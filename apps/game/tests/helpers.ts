import { expect, type Page } from '@playwright/test';
import type { GameState, SimulatedInput } from '../src/main';

/** Open the game and wait until the test hook reports ready. */
export async function openGame(page: Page, url = './'): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(() => window.__game !== undefined || window.__gameError !== undefined, null, {
    timeout: 30_000,
  });
  expect(await page.evaluate(() => window.__gameError ?? null)).toBeNull();
  await settle(page);
}

export function state(page: Page): Promise<GameState> {
  return page.evaluate(() => window.__game!.state);
}

export function teleport(page: Page, x: number, y: number, z: number, yawDeg = 0): Promise<void> {
  return page.evaluate(([x, y, z, yaw]) => window.__game!.teleport(x, y, z, yaw), [x, y, z, yawDeg]);
}

export function setInput(page: Page, input: SimulatedInput | null): Promise<void> {
  return page.evaluate((i) => window.__game!.setInput(i), input);
}

export function walkTo(page: Page, x: number, z: number, run = false): Promise<boolean> {
  return page.evaluate(([x, z, run]) => window.__game!.walkTo(x as number, z as number, { timeoutMs: 15_000, run: run as boolean }), [x, z, run]);
}

/** Wait until the player is standing on something. */
export async function settle(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__game!.state.grounded, null, { timeout: 15_000 });
}

export interface Track {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
  end: GameState;
}

/** Sample the player's position every frame for `ms` and report the extremes. */
export function track(page: Page, ms: number): Promise<Track> {
  return page.evaluate(
    (ms) =>
      new Promise<Track>((resolve) => {
        const p = window.__game!.state.position;
        const min = { ...p };
        const max = { ...p };
        const until = performance.now() + ms;
        const sample = () => {
          const s = window.__game!.state;
          for (const k of ['x', 'y', 'z'] as const) {
            min[k] = Math.min(min[k], s.position[k]);
            max[k] = Math.max(max[k], s.position[k]);
          }
          if (performance.now() >= until) resolve({ min, max, end: s });
          else requestAnimationFrame(sample);
        };
        sample();
      }),
    ms,
  );
}

/** Record every request URL the page makes. */
export function recordRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  return urls;
}
