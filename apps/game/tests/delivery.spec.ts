import { execFileSync, spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { openGame, recordRequests, state } from './helpers';
import { freePort, serveDirectory, type StaticServer } from './static-server';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(APP, 'dist');
const HASHED = /-[A-Za-z0-9_-]{8}\.(js|css|wasm|png)$/;
const MAX_INITIAL_BYTES = 5 * 1024 * 1024;

function walk(dir: string, base = ''): string[] {
  return readdirSync(join(dir, base), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(dir, join(base, e.name)) : [join(base, e.name)],
  );
}

/** Private copy of dist/ so a test can edit files without touching the real build. */
function copyDist(sub = ''): { root: string; dir: string } {
  const root = mkdtempSync(join(tmpdir(), 'game-dist-'));
  const dir = join(root, sub);
  cpSync(DIST, dir, { recursive: true });
  return { root, dir };
}

async function expectPlayable(page: Page, url: string): Promise<string[]> {
  const requests = recordRequests(page);
  const failed: string[] = [];
  page.on('requestfailed', (r) => failed.push(r.url()));
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  await openGame(page, url);
  const before = await state(page);
  await page.evaluate(() => window.__game!.setInput({ forward: 1 }));
  await expect.poll(async () => (await state(page)).position.z).toBeLessThan(before.position.z - 0.5);
  await page.evaluate(() => window.__game!.setInput(null));
  expect(failed).toEqual([]);
  return requests;
}

test.describe('build output', () => {
  test('criterion 7: static directory with hashed assets and a separate .wasm file', () => {
    const files = walk(DIST).map((f) => f.split('\\').join('/')).sort();
    const top = files.filter((f) => !f.startsWith('assets/'));
    expect(top).toEqual(['config.json', 'index.html', 'version.json', 'world.json']);

    const assets = files.filter((f) => f.startsWith('assets/'));
    for (const f of assets) expect(f, `${f} has a content hash`).toMatch(HASHED);
    expect(assets.filter((f) => f.endsWith('.wasm'))).toHaveLength(1);
    expect(assets.filter((f) => f.endsWith('.js')).length).toBeGreaterThanOrEqual(1);
    expect(assets.filter((f) => f.endsWith('.css')).length).toBeGreaterThanOrEqual(1);
    expect(assets.filter((f) => f.endsWith('.png')).length).toBeGreaterThanOrEqual(1);

    // The wasm is a real file, not inlined into JavaScript.
    const wasm = assets.find((f) => f.endsWith('.wasm'))!;
    expect(readFileSync(join(DIST, wasm)).subarray(0, 4)).toEqual(Buffer.from([0x00, 0x61, 0x73, 0x6d]));

    // Entry HTML uses only relative URLs.
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(ref, `${ref} is relative`).toMatch(/^\.\/assets\//);

    // No absolute URL to another origin anywhere in the shipped text files.
    for (const f of files.filter((f) => /\.(html|css|json)$/.test(f))) {
      expect(readFileSync(join(DIST, f), 'utf8'), f).not.toMatch(/https?:\/\//);
    }

    const total = files.reduce((n, f) => n + statSync(join(DIST, f)).size, 0);
    test.info().annotations.push({ type: 'dist-bytes', description: String(total) });
    expect(total).toBeLessThan(MAX_INITIAL_BYTES);
  });

  test('criterion 12: the build ID changes with each build', () => {
    test.slow();
    const first = JSON.parse(readFileSync(join(DIST, 'version.json'), 'utf8'));
    const out = mkdtempSync(join(tmpdir(), 'game-rebuild-'));
    try {
      execFileSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], { cwd: APP, stdio: 'pipe' });
      const second = JSON.parse(readFileSync(join(out, 'version.json'), 'utf8'));
      expect(second.buildId).not.toBe(first.buildId);
      // The ID is compiled into the application chunk as well.
      const entry = readdirSync(join(out, 'assets')).find((f) => /^index-.*\.js$/.test(f))!;
      expect(readFileSync(join(out, 'assets', entry), 'utf8')).toContain(second.buildId);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });
});

test.describe('delivery', () => {
  test('criteria 8, 9, 10: preview server at the root; same-origin only; under 5 MB', async ({ page, baseURL }) => {
    const sizes: number[] = [];
    page.on('response', async (r) => {
      const body = await r.body().catch(() => null);
      if (body) sizes.push(body.length);
    });
    const requests = await expectPlayable(page, './');
    await page.waitForLoadState('networkidle');
    const origin = new URL(baseURL!).origin;
    expect(requests.length).toBeGreaterThan(5);
    for (const url of requests) expect(new URL(url).origin, url).toBe(origin);

    const wasm = requests.find((u) => u.endsWith('.wasm'));
    expect(wasm, 'the .wasm file is fetched as its own request').toBeTruthy();

    // Uncompressed body sizes: an upper bound on what any server transfers.
    const total = sizes.reduce((a, b) => a + b, 0);
    test.info().annotations.push({ type: 'initial-bytes-uncompressed', description: String(total) });
    expect(total).toBeGreaterThan(100_000);
    expect(total).toBeLessThan(MAX_INITIAL_BYTES);
  });

  test('criteria 8, 9: plain Node file server, at the root and under a sub-path', async ({ page }) => {
    const servers: StaticServer[] = [];
    try {
      const root = await serveDirectory(DIST, '/');
      const sub = await serveDirectory(DIST, '/forum/demo-game/');
      servers.push(root, sub);
      for (const [server, path] of [[root, '/'], [sub, '/forum/demo-game/']] as const) {
        const requests = await expectPlayable(page, server.origin + path);
        for (const url of requests) {
          expect(new URL(url).origin, url).toBe(server.origin);
          expect(new URL(url).pathname.startsWith(path), `${url} stays under ${path}`).toBe(true);
        }
      }
    } finally {
      await Promise.all(servers.map((s) => s.close()));
    }
  });

  test('criterion 8: python3 http.server, at the root and under a sub-path', async ({ page }) => {
    test.skip(spawnSync('python3', ['--version']).status !== 0, 'python3 is not installed');
    // http.server resolves its own host name before listening, which can take half a minute.
    test.setTimeout(240_000);
    const { root } = copyDist('forum/demo-game');
    cpSync(DIST, join(root, 'at-root'), { recursive: true });
    const procs: ChildProcess[] = [];
    try {
      const targets: Array<{ origin: string; path: string }> = [];
      for (const [dir, path] of [[join(root, 'at-root'), '/'], [root, '/forum/demo-game/']] as const) {
        const port = await freePort();
        procs.push(spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dir], { stdio: 'ignore' }));
        targets.push({ origin: `http://127.0.0.1:${port}`, path });
      }
      for (const { origin, path } of targets) {
        await expect
          .poll(async () => fetch(origin + path, { signal: AbortSignal.timeout(2000) }).then((r) => r.status, () => 0), { timeout: 120_000 })
          .toBe(200);
        const requests = await expectPlayable(page, origin + path);
        for (const url of requests) expect(new URL(url).origin, url).toBe(origin);
      }
    } finally {
      procs.forEach((p) => p.kill());
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('criterion 11: editing config.json and world.json changes the game after a reload, without a rebuild', async ({ page }) => {
    const { root, dir } = copyDist();
    const server = await serveDirectory(dir, '/');
    try {
      await openGame(page, server.origin + '/');
      const original = await state(page);
      await expect(page.getByTestId('build')).toContainText('local');
      expect(original.world.spawn).toMatchObject({ x: 0, z: 8 });

      const configFile = join(dir, 'config.json');
      const config = JSON.parse(readFileSync(configFile, 'utf8'));
      config.deploymentLabel = 'edited-by-test';
      writeFileSync(configFile, JSON.stringify(config, null, 2));

      const worldFile = join(dir, 'world.json');
      const world = JSON.parse(readFileSync(worldFile, 'utf8'));
      world.name = 'Edited world';
      world.spawn = { position: [20, 2, 20], yawDeg: 90 };
      world.objects.push({ id: 'test-platform', type: 'box', position: [20, 0, 20], size: [4, 1, 4], material: 'wood' });
      writeFileSync(worldFile, JSON.stringify(world));

      await page.reload();
      await page.waitForFunction(() => window.__game !== undefined);
      await page.waitForFunction(() => window.__game!.state.grounded);
      const edited = await state(page);
      await expect(page.getByTestId('build')).toContainText('edited-by-test');
      expect(edited.deploymentLabel).toBe('edited-by-test');
      expect(edited.buildId).toBe(original.buildId); // same build, different data
      expect(edited.world.name).toBe('Edited world');
      expect(edited.world.objectCount).toBe(original.world.objectCount + 1);
      expect(edited.position.x).toBeCloseTo(20, 0);
      expect(edited.position.z).toBeCloseTo(20, 0);
      // Dropped from the new spawn onto the added one-metre platform: the new object is solid.
      expect(edited.position.y).toBeGreaterThan(0.9);
      expect(edited.position.y).toBeLessThan(1.1);
    } finally {
      await server.close();
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('a broken world.json is reported on screen, not as a blank page', async ({ page }) => {
    const { root, dir } = copyDist();
    const server = await serveDirectory(dir, '/');
    try {
      const worldFile = join(dir, 'world.json');
      const world = JSON.parse(readFileSync(worldFile, 'utf8'));
      world.objects[0].material = 'no-such-material';
      writeFileSync(worldFile, JSON.stringify(world));
      await page.goto(server.origin + '/');
      await expect(page.getByTestId('fatal')).toBeVisible();
      await expect(page.getByTestId('fatal')).toContainText('world.json');
      await expect(page.getByTestId('fatal')).toContainText('material');
    } finally {
      await server.close();
      rmSync(root, { recursive: true, force: true });
    }
  });
});
