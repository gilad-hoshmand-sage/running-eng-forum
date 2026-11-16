import { expect, test } from '@playwright/test';
import { openGame, setInput, settle, state, teleport, track, walkTo } from './helpers';

// World landmarks used below come from public/world.json:
// spawn (0, 0, 8) facing -z; building front wall outer face at z = -9, door at x = 0;
// ground floor at y = 0.1, upper floor at y = 3.2; fence inner face at +-50.

test.describe('play', () => {
  test('criterion 1: walk and look within 5 seconds of clicking the canvas', async ({ page }) => {
    await openGame(page);
    const before = await state(page);
    await expect(page.getByTestId('hint')).toContainText('W A S D');

    await page.getByTestId('canvas').click();
    const clickedAt = Date.now();

    await page.keyboard.down('KeyW');
    await expect.poll(async () => (await state(page)).position.z, { timeout: 5000 }).toBeLessThan(before.position.z - 1);
    await page.keyboard.up('KeyW');

    await page.keyboard.down('ArrowLeft');
    await expect.poll(async () => (await state(page)).yawDeg, { timeout: 5000 }).toBeGreaterThan(before.yawDeg + 10);
    await page.keyboard.up('ArrowLeft');
    expect(Date.now() - clickedAt).toBeLessThan(5000);

    // Mouse look needs pointer lock, which not every headless browser grants.
    const s = await state(page);
    test.info().annotations.push({ type: 'pointer-lock', description: String(s.pointerLocked) });
    if (s.pointerLocked) {
      await page.mouse.move(300, 200);
      await page.mouse.move(420, 260, { steps: 5 });
      const after = await state(page);
      test.info().annotations.push({ type: 'mouse-look-moved-view', description: String(after.yawDeg !== s.yawDeg || after.pitchDeg !== s.pitchDeg) });
    }
  });

  test('criterion 2: spawn to the upper floor and back outside', async ({ page }) => {
    await openGame(page);
    const up: Array<[number, number]> = [
      [0, -8], // in front of the door
      [0, -10.5], // lobby
      [-1, -15], // past the reception desk
      [-1, -16.5], // stair hall entrance
      [-6.25, -16.5],
      [-6.25, -18.2], // foot of the stairs
      [-0.4, -18.2], // top of the stairs
      [0, -16], // upper landing
    ];
    for (const [x, z] of up) expect(await walkTo(page, x, z), `walk to ${x}, ${z}`).toBe(true);
    await settle(page);
    const top = await state(page);
    expect(top.position.y).toBeGreaterThan(3.1);
    expect(top.position.y).toBeLessThan(3.4);

    // Into an upper-floor room through its doorway.
    expect(await walkTo(page, 0, -12.9)).toBe(true);
    expect(await walkTo(page, 4, -12.9)).toBe(true);
    expect((await state(page)).position.y).toBeGreaterThan(3.1);

    const down = [[0, -12.9], ...up.slice().reverse(), [0, 4]] as Array<[number, number]>;
    for (const [x, z] of down) expect(await walkTo(page, x, z), `walk back to ${x}, ${z}`).toBe(true);
    await settle(page);
    const out = await state(page);
    expect(Math.abs(out.position.y)).toBeLessThan(0.1);
    expect(out.respawnCount).toBe(0);
  });

  test('criterion 3: the ground is solid', async ({ page }) => {
    await openGame(page);
    const s = await state(page);
    expect(Math.abs(s.position.y)).toBeLessThan(0.1);

    await teleport(page, 12, 6, 12);
    const fall = await track(page, 2500);
    expect(fall.max.y).toBeGreaterThan(5);
    expect(fall.min.y).toBeGreaterThan(-0.05);
    expect(fall.end.grounded).toBe(true);
    expect(Math.abs(fall.end.position.y)).toBeLessThan(0.1);
  });

  test('criterion 3: a wall is solid, also when running and jumping into it', async ({ page }) => {
    await openGame(page);
    // Solid stretch of the front wall between a window and the corner.
    await teleport(page, 6.2, 0, -7, 0);
    await setInput(page, { forward: 1, run: true });
    const run = await track(page, 2000);
    expect(run.min.z).toBeGreaterThan(-9);
    expect(run.end.position.z).toBeLessThan(-8.4); // it did reach the wall

    await setInput(page, { forward: 1, run: true, jump: true });
    const jump = await track(page, 3000);
    expect(jump.min.z).toBeGreaterThan(-9);

    // A window pane is solid too.
    await teleport(page, 4.2, 0, -7, 0);
    await setInput(page, { forward: 1, run: true, jump: true });
    const pane = await track(page, 3000);
    expect(pane.min.z).toBeGreaterThan(-9);
  });

  test('criterion 3: an inside corner of the building holds', async ({ page }) => {
    await openGame(page);
    // Ground-floor office, north-east corner: walls at x = 6.8 and z = -18.8.
    await teleport(page, 4.5, 0.1, -17.5, -135);
    await setInput(page, { forward: 1, run: true, jump: true });
    const t = await track(page, 3000);
    expect(t.max.x).toBeLessThan(6.8);
    expect(t.min.z).toBeGreaterThan(-18.8);
    expect(t.max.y).toBeLessThan(1.6);
  });

  test('criterion 3: furniture is solid', async ({ page }) => {
    await openGame(page);
    // Reception desk: x -0.1..1.7, z -15.9..-15.2, 1.05 m high.
    await teleport(page, 0.8, 0.1, -13, 0);
    await setInput(page, { forward: 1 });
    const t = await track(page, 2500);
    expect(t.min.z).toBeGreaterThan(-15.2);
    expect(t.end.position.z).toBeLessThan(-14.5);
  });

  test('criterion 3: the world boundary holds, including its corner', async ({ page }) => {
    await openGame(page);
    await teleport(page, 44, 0, 0, -90); // facing +x
    await setInput(page, { forward: 1, run: true, jump: true });
    const side = await track(page, 3000);
    expect(side.max.x).toBeLessThan(50);
    expect(side.end.position.x).toBeGreaterThan(49);

    await teleport(page, 46, 0, 46, -135); // facing the +x +z corner
    await setInput(page, { forward: 1, run: true, jump: true });
    const corner = await track(page, 3000);
    expect(corner.max.x).toBeLessThan(50);
    expect(corner.max.z).toBeLessThan(50);
    expect(corner.end.respawnCount).toBe(0);
  });

  test('criterion 4: a jump returns to the ground', async ({ page }) => {
    await openGame(page);
    await setInput(page, { jump: true });
    await page.waitForFunction(() => !window.__game!.state.grounded);
    await setInput(page, null);
    const t = await track(page, 2000);
    expect(t.max.y).toBeGreaterThan(0.5);
    expect(t.max.y).toBeLessThan(1.3);
    expect(t.end.grounded).toBe(true);
    expect(Math.abs(t.end.position.y)).toBeLessThan(0.1);
  });

  test('criterion 4: repeated jumping does not climb a wall', async ({ page }) => {
    await openGame(page);
    await teleport(page, 6.2, 0, -8.5, 0);
    await setInput(page, { forward: 1, jump: true });
    const t = await track(page, 6000);
    expect(t.max.y).toBeLessThan(1.3);
    expect(t.min.z).toBeGreaterThan(-9);
  });

  test('respawn: R key, and automatically outside the world bounds', async ({ page }) => {
    await openGame(page);
    await teleport(page, 20, 0, 20);
    await page.getByTestId('canvas').focus();
    await page.keyboard.press('KeyR');
    let s = await state(page);
    expect(s.respawnCount).toBe(1);
    expect(Math.hypot(s.position.x - s.world.spawn.x, s.position.z - s.world.spawn.z)).toBeLessThan(0.5);

    await teleport(page, 70, 0, 0);
    await expect.poll(async () => (await state(page)).respawnCount).toBe(2);
    s = await state(page);
    expect(Math.hypot(s.position.x - s.world.spawn.x, s.position.z - s.world.spawn.z)).toBeLessThan(0.5);
  });
});

test.describe('HUD', () => {
  test('criterion 12: the build ID on screen matches version.json', async ({ page, request }) => {
    await openGame(page);
    const version = await (await request.get('./version.json')).json();
    expect(version.buildId).toMatch(/^\d{8}-\d{6}-/);
    expect(version.commit).toBeTruthy();
    expect(Number.isNaN(Date.parse(version.builtAt))).toBe(false);
    await expect(page.getByTestId('build')).toContainText(version.buildId);
    expect((await state(page)).buildId).toBe(version.buildId);
  });

  test('diagnostics overlay toggles and shows current values', async ({ page }) => {
    await openGame(page);
    const overlay = page.getByTestId('diagnostics');
    await expect(overlay).toBeHidden();
    await page.getByTestId('canvas').focus();
    await page.keyboard.press('KeyO');
    await expect(overlay).toBeVisible();
    const s = await state(page);
    await expect(overlay).toContainText(`build       ${s.buildId}`);
    await expect(overlay).toContainText('deployment  local');
    await expect(overlay).toContainText('serverUrl   null');
    await expect(overlay).toContainText('connection  offline');
    await expect(overlay).toContainText(/position\s+x -?\d+\.\d\d\s+y -?\d+\.\d\d\s+z -?\d+\.\d\d/);
    await expect(overlay).toContainText(/fps\s+\d+/);

    await teleport(page, 10, 0, 10);
    await expect(overlay).toContainText(/position\s+x 10\.00/);

    await page.keyboard.press('KeyO');
    await expect(overlay).toBeHidden();
  });

  test('query parameters override config.json', async ({ page }) => {
    await openGame(page, './?deploymentLabel=from-query&serverUrl=wss%3A%2F%2Fexample.invalid&diag=1');
    await expect(page.getByTestId('build')).toContainText('from-query');
    const overlay = page.getByTestId('diagnostics');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText('deployment  from-query');
    await expect(overlay).toContainText('serverUrl   wss://example.invalid');
    await expect(overlay).toContainText('query overrides: deploymentLabel, serverUrl');
    const s = await state(page);
    expect(s.config.serverUrl).toBe('wss://example.invalid');
    expect(s.connectionState).toBe('offline');
  });
});
