import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d';
import './style.css';
import { fetchVersion, loadConfig, type GameConfig } from './config';
import { EYE_HEIGHT, NO_INPUT, Player, type MoveInput } from './player';
import { Flock } from './sheep';
import { buildWorld, loadWorld } from './world';

const BUILD_ID = __BUILD_ID__;
const FIXED_DT = 1 / 60;
const MAX_STEPS_PER_FRAME = 10;
const DEG = Math.PI / 180;

// ------------------------------------------------------------------ test hook
// Documented in apps/game/README.md § Test hook. Keep the two in step.

export interface GameState {
  ready: true;
  buildId: string;
  commit: string;
  deploymentLabel: string;
  config: GameConfig;
  connectionState: 'offline';
  /** Feet position in metres; y is 0 on the ground outdoors. */
  position: { x: number; y: number; z: number };
  yawDeg: number;
  pitchDeg: number;
  grounded: boolean;
  /** True while the player is riding a sheep. */
  riding: boolean;
  /** Feet positions of the sheep, in world.json order. */
  sheep: Array<{ x: number; y: number; z: number }>;
  fps: number;
  respawnCount: number;
  pointerLocked: boolean;
  diagnosticsVisible: boolean;
  world: {
    name: string;
    objectCount: number;
    halfSize: number;
    spawn: { x: number; y: number; z: number; yawDeg: number };
  };
}

export interface SimulatedInput {
  forward?: number;
  right?: number;
  turn?: number;
  jump?: boolean;
  run?: boolean;
  /** Set the view direction immediately. */
  yawDeg?: number;
  pitchDeg?: number;
}

export interface GameHook {
  hookVersion: 1;
  readonly state: GameState;
  teleport(x: number, y: number, z: number, yawDeg?: number): void;
  setInput(input: SimulatedInput | null): void;
  walkTo(x: number, z: number, options?: { timeoutMs?: number; run?: boolean }): Promise<boolean>;
  respawn(): void;
}

declare global {
  interface Window {
    __game?: GameHook;
    __gameError?: string;
  }
}

// ----------------------------------------------------------------------- DOM

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = el<HTMLCanvasElement>('game');
const banner = el('banner');
const diag = el('diag');
const buildLabel = el('build');
const fatalBox = el('fatal');

function fatal(message: string): void {
  console.error(message);
  window.__gameError = message;
  fatalBox.textContent = `The game could not start.\n\n${message}`;
  fatalBox.hidden = false;
  banner.hidden = true;
}

// ---------------------------------------------------------------------- main

async function start(): Promise<void> {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    return fatal('This browser or device does not provide WebGL 2.');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const [config, version, world] = await Promise.all([loadConfig(), fetchVersion(), loadWorld()]);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 500);
  camera.rotation.order = 'YXZ';

  const physics = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  physics.timestep = FIXED_DT;
  const built = buildWorld(world, scene, physics);
  const player = new Player(physics);
  const flock = new Flock(built.sheep, scene, physics, player);

  const spawn = world.spawn;
  let respawnCount = 0;
  const toSpawn = () => player.teleport(spawn.position[0], spawn.position[1], spawn.position[2], spawn.yawDeg * DEG);
  const respawn = () => {
    toSpawn();
    respawnCount++;
  };
  toSpawn();
  physics.step();

  // ---- input
  const keys = new Set<string>();
  let simulated: SimulatedInput | null = null;
  let walk: { x: number; z: number; run: boolean; ticksLeft: number; resolve: (ok: boolean) => void } | null = null;

  const toggleDiagnostics = () => {
    diag.hidden = !diag.hidden;
    refreshDiagnostics();
  };
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space' || e.code.startsWith('Arrow') || e.code === 'F3') e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'KeyR') respawn();
    if (e.code === 'KeyO' || e.code === 'F3') toggleDiagnostics();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  const locked = () => document.pointerLockElement === canvas;
  canvas.addEventListener('click', () => {
    canvas.focus();
    if (locked()) return;
    try {
      // Returns a promise in current browsers and undefined in older ones.
      const request = canvas.requestPointerLock() as Promise<void> | undefined;
      request?.catch(() => undefined);
    } catch {
      // Mouse look stays off; keyboard controls still work.
    }
  });
  document.addEventListener('pointerlockchange', () => {
    banner.hidden = locked();
  });
  document.addEventListener('mousemove', (e) => {
    if (locked()) player.look(-e.movementX * 0.0023, -e.movementY * 0.0023);
  });

  const key = (...codes: string[]) => (codes.some((c) => keys.has(c)) ? 1 : 0);
  const currentInput = (): MoveInput => {
    if (walk) {
      const dx = walk.x - player.x;
      const dz = walk.z - player.z;
      player.yaw = Math.atan2(-dx, -dz);
      return { ...NO_INPUT, forward: 1, run: walk.run };
    }
    if (simulated) {
      return {
        forward: simulated.forward ?? 0,
        right: simulated.right ?? 0,
        turn: simulated.turn ?? 0,
        jump: simulated.jump ?? false,
        run: simulated.run ?? false,
      };
    }
    return {
      forward: key('KeyW', 'ArrowUp') - key('KeyS', 'ArrowDown'),
      right: key('KeyD') - key('KeyA'),
      turn: key('ArrowLeft') - key('ArrowRight'),
      jump: keys.has('Space'),
      run: keys.has('ShiftLeft') || keys.has('ShiftRight'),
    };
  };

  const finishWalk = (ok: boolean) => {
    const w = walk;
    walk = null;
    w?.resolve(ok);
  };

  const half = world.bounds.halfSize;
  const tick = () => {
    const input = currentInput();
    if (!flock.step(FIXED_DT, input)) player.step(FIXED_DT, input);
    physics.step();
    if (walk) {
      if (Math.hypot(walk.x - player.x, walk.z - player.z) < 0.25) finishWalk(true);
      else if (--walk.ticksLeft <= 0) finishWalk(false);
    }
    const outside = Math.abs(player.x) > half + 1 || Math.abs(player.z) > half + 1 || player.y < -5 || player.y > 200;
    if (outside) {
      finishWalk(false);
      respawn();
    }
  };

  // ---- HUD
  buildLabel.textContent = `${config.values.deploymentLabel} · build ${BUILD_ID}`;
  banner.textContent = 'Click to look around';
  diag.hidden = !config.showDiagnostics;
  let fps = 0;

  const norm = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;
  const snapshot = (): GameState => ({
    ready: true,
    buildId: BUILD_ID,
    commit: version?.commit ?? 'unknown',
    deploymentLabel: config.values.deploymentLabel,
    config: { ...config.values },
    connectionState: 'offline',
    position: { x: player.x, y: player.y, z: player.z },
    yawDeg: norm(player.yaw / DEG),
    pitchDeg: player.pitch / DEG,
    grounded: player.grounded,
    riding: flock.riding,
    sheep: flock.positions,
    fps,
    respawnCount,
    pointerLocked: locked(),
    diagnosticsVisible: !diag.hidden,
    world: {
      name: world.name ?? '',
      objectCount: built.objectCount,
      halfSize: half,
      spawn: { x: spawn.position[0], y: spawn.position[1], z: spawn.position[2], yawDeg: spawn.yawDeg },
    },
  });

  function refreshDiagnostics(): void {
    if (diag.hidden) return;
    const s = snapshot();
    const served = version && version.buildId !== BUILD_ID ? `  (version.json now says ${version.buildId})` : '';
    const overrides = config.overrides.length ? `  + query overrides: ${config.overrides.join(', ')}` : '';
    diag.textContent = [
      `build       ${s.buildId}${served}`,
      `commit      ${s.commit.slice(0, 7)}`,
      `built       ${version?.builtAt ?? 'unknown'}`,
      `deployment  ${s.deploymentLabel}`,
      `config      ${config.source}${overrides}`,
      `serverUrl   ${s.config.serverUrl ?? 'null'}`,
      `connection  ${s.connectionState} (${s.config.serverUrl ? 'this build has no network code' : 'no server configured'})`,
      `position    x ${s.position.x.toFixed(2)}  y ${s.position.y.toFixed(2)}  z ${s.position.z.toFixed(2)}`,
      `facing      yaw ${s.yawDeg.toFixed(0)}°  pitch ${s.pitchDeg.toFixed(0)}°`,
      `grounded    ${s.grounded ? 'yes' : 'no'}${s.riding ? ' (riding a sheep)' : ''}`,
      `fps         ${s.fps}`,
      `world       ${s.world.name} (${s.world.objectCount} objects)`,
    ].join('\n');
  }

  // ---- hook
  window.__game = {
    hookVersion: 1,
    get state() {
      return snapshot();
    },
    teleport(x, y, z, yawDeg) {
      finishWalk(false);
      player.teleport(x, y, z, yawDeg === undefined ? undefined : yawDeg * DEG);
    },
    setInput(input) {
      finishWalk(false);
      simulated = input ? { ...input } : null;
      if (input?.yawDeg !== undefined) player.yaw = input.yawDeg * DEG;
      if (input?.pitchDeg !== undefined) {
        player.pitch = 0;
        player.look(0, input.pitchDeg * DEG);
      }
    },
    walkTo(x, z, options) {
      finishWalk(false);
      const ticksLeft = Math.ceil(((options?.timeoutMs ?? 10000) / 1000) * 60);
      return new Promise<boolean>((resolve) => {
        walk = { x, z, run: options?.run ?? false, ticksLeft, resolve };
      });
    },
    respawn,
  };

  // ---- loop
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  let last = performance.now();
  let acc = 0;
  let frames = 0;
  let fpsSince = last;
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    acc += Math.min((now - last) / 1000, 0.25);
    last = now;
    let steps = 0;
    while (acc >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
      tick();
      acc -= FIXED_DT;
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) acc = 0;
    const a = acc / FIXED_DT;
    camera.position.set(
      player.prevX + (player.x - player.prevX) * a,
      player.prevY + (player.y - player.prevY) * a + EYE_HEIGHT,
      player.prevZ + (player.z - player.prevZ) * a,
    );
    camera.rotation.set(player.pitch, player.yaw, 0);
    flock.render(a);
    renderer.render(scene, camera);

    frames++;
    if (now - fpsSince >= 500) {
      fps = Math.round((frames * 1000) / (now - fpsSince));
      frames = 0;
      fpsSince = now;
      refreshDiagnostics();
    }
  };
  requestAnimationFrame(frame);
}

start().catch((err: unknown) => fatal(err instanceof Error ? err.message : String(err)));
