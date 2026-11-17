/** Slides: a player who steps onto one is carried down it at running speed. */
import { RUN_SPEED, TURN_SPEED, type MoveInput, type Player } from './player';
import type { SlidePath, Vec3 } from './world';

/** Feet this far below or above the surface still count as being on it. */
const BELOW = 0.2;
const ABOVE = 0.4;
/** No boarding this close (horizontally) to the bottom, so a rider who arrives can walk away. */
const BOTTOM_MARGIN = 0.5;

const length = (s: SlidePath) =>
  Math.hypot(s.end[0] - s.start[0], s.end[1] - s.start[1], s.end[2] - s.start[2]);

function pointAt(s: SlidePath, distance: number): Vec3 {
  const f = distance / length(s);
  return [0, 1, 2].map((i) => s.start[i] + (s.end[i] - s.start[i]) * f) as Vec3;
}

/** Distance down the slide at which feet at (x, y, z) are on it, or null if they are not. */
function boarding(s: SlidePath, x: number, y: number, z: number): number | null {
  const dx = s.end[0] - s.start[0];
  const dz = s.end[2] - s.start[2];
  const run = Math.hypot(dx, dz);
  const px = x - s.start[0];
  const pz = z - s.start[2];
  const ahead = (px * dx + pz * dz) / run;
  const across = Math.abs(px * dz - pz * dx) / run;
  if (ahead < 0 || ahead > run - BOTTOM_MARGIN || across > s.width / 2) return null;
  const f = ahead / run;
  const surface = s.start[1] + (s.end[1] - s.start[1]) * f;
  if (y < surface - BELOW || y > surface + ABOVE) return null;
  return f * length(s);
}

export class Slides {
  private current: SlidePath | null = null;
  private travelled = 0;

  constructor(private readonly paths: SlidePath[], private readonly player: Player) {}

  get sliding(): boolean {
    return this.current !== null;
  }

  /**
   * Advance one fixed step. Returns true when the player is on a slide and has been
   * moved by it; false when the caller should step the player itself.
   */
  step(dt: number, input: MoveInput): boolean {
    const p = this.player;
    if (this.current) {
      // A teleport or respawn ends the ride.
      const [x, y, z] = pointAt(this.current, this.travelled);
      if (Math.abs(p.x - x) + Math.abs(p.y - y) + Math.abs(p.z - z) > 0.01) this.current = null;
    }
    if (!this.current) {
      for (const s of this.paths) {
        const at = boarding(s, p.x, p.y, p.z);
        if (at !== null) {
          this.current = s;
          this.travelled = at;
          break;
        }
      }
      if (!this.current) return false;
    }

    p.yaw += input.turn * TURN_SPEED * dt;
    const total = length(this.current);
    this.travelled = Math.min(total, this.travelled + RUN_SPEED * dt);
    const [x, y, z] = pointAt(this.current, this.travelled);
    p.carryTo(x, y, z);
    if (this.travelled >= total) this.current = null; // off at the bottom
    return true;
  }
}
