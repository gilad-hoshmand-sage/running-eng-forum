/** Sheep: slow grazing animals the player can ride by landing on their back. */
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d';
import { TURN_SPEED as PLAYER_TURN_SPEED, type MoveInput, type Player } from './player';
import type { Vec3 } from './world';

/** Height of a sheep's back above its feet; the player's jump apex is about 0.9 m. */
export const BACK_HEIGHT = 0.7;
const RADIUS = 0.45;
const GROUND_GAP = 0.05;
const ROAM_SPEED = 0.6;
const ROAM_RADIUS = 5;
const TURN_SPEED = 1.5; // rad/s
const RIDE_SPEED = 5;
const RIDE_RUN_SPEED = 9;
const MOUNT_REACH = 0.8;
const REMOUNT_DELAY = 0.4; // seconds after hopping off

const WOOL = new THREE.MeshLambertMaterial({ color: 0xf2efe6 });
const SKIN = new THREE.MeshLambertMaterial({ color: 0x3a3532 });

class Sheep {
  x: number;
  z: number;
  prevX: number;
  prevZ: number;
  yaw = Math.random() * Math.PI * 2;
  homeX: number;
  homeZ: number;
  private targetYaw = this.yaw;
  private walking = false;
  private timer = Math.random() * 5;
  private readonly group = new THREE.Group();
  private readonly head: THREE.Mesh;
  private readonly body: RAPIER.RigidBody;
  private readonly collider: RAPIER.Collider;

  constructor(
    readonly y: number,
    x: number,
    z: number,
    scene: THREE.Scene,
    physics: RAPIER.World,
    private readonly controller: RAPIER.KinematicCharacterController,
  ) {
    this.x = this.prevX = this.homeX = x;
    this.z = this.prevZ = this.homeZ = z;

    // Faces local -z, like the player at yaw 0.
    const wool = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 1.1), WOOL);
    wool.position.y = BACK_HEIGHT - 0.225;
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.4), SKIN);
    this.group.add(wool, this.head);
    for (const lx of [-0.22, 0.22]) {
      for (const lz of [-0.38, 0.38]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), SKIN);
        leg.position.set(lx, 0.15, lz);
        this.group.add(leg);
      }
    }
    scene.add(this.group);

    const halfHeight = (BACK_HEIGHT - GROUND_GAP) / 2;
    this.body = physics.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y + GROUND_GAP + halfHeight, z),
    );
    this.collider = physics.createCollider(RAPIER.ColliderDesc.cylinder(halfHeight, RADIUS), this.body);
  }

  /** Move horizontally, stopping at obstacles. Returns the distance actually covered. */
  private move(dx: number, dz: number, ignore?: RAPIER.Collider): number {
    this.controller.computeColliderMovement(
      this.collider,
      { x: dx, y: 0, z: dz },
      undefined,
      undefined,
      ignore ? (c) => c.handle !== ignore.handle : undefined,
    );
    const m = this.controller.computedMovement();
    this.x += m.x;
    this.z += m.z;
    const t = this.body.translation();
    this.body.setNextKinematicTranslation({ x: this.x, y: t.y, z: this.z });
    return Math.hypot(m.x, m.z);
  }

  roam(dt: number): void {
    this.prevX = this.x;
    this.prevZ = this.z;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.walking = !this.walking;
      this.timer = this.walking ? 2 + Math.random() * 3 : 3 + Math.random() * 6;
      if (this.walking) {
        const dx = this.homeX - this.x;
        const dz = this.homeZ - this.z;
        this.targetYaw = Math.hypot(dx, dz) > ROAM_RADIUS ? Math.atan2(-dx, -dz) : Math.random() * Math.PI * 2;
      }
    }
    if (!this.walking) return;
    const diff = Math.atan2(Math.sin(this.targetYaw - this.yaw), Math.cos(this.targetYaw - this.yaw));
    this.yaw += Math.max(-TURN_SPEED * dt, Math.min(TURN_SPEED * dt, diff));
    const want = ROAM_SPEED * dt;
    const moved = this.move(-Math.sin(this.yaw) * want, -Math.cos(this.yaw) * want);
    if (moved < want * 0.5) this.targetYaw += Math.PI / 2; // blocked: turn away
  }

  ride(dt: number, input: MoveInput, yaw: number, rider: RAPIER.Collider): void {
    this.prevX = this.x;
    this.prevZ = this.z;
    this.yaw = yaw;
    let f = input.forward;
    let r = input.right;
    const mag = Math.hypot(f, r);
    if (mag > 1) {
      f /= mag;
      r /= mag;
    }
    const step = (input.run ? RIDE_RUN_SPEED : RIDE_SPEED) * dt;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    this.walking = mag > 0;
    if (this.walking) this.move((-sin * f + cos * r) * step, (-cos * f - sin * r) * step, rider);
  }

  /** Stay around wherever the rider left it. */
  release(): void {
    this.homeX = this.x;
    this.homeZ = this.z;
    this.walking = false;
    this.timer = 2;
  }

  render(alpha: number): void {
    this.group.position.set(
      this.prevX + (this.x - this.prevX) * alpha,
      this.y,
      this.prevZ + (this.z - this.prevZ) * alpha,
    );
    this.group.rotation.y = this.yaw;
    // Head down to graze while standing still.
    const grazing = !this.walking;
    this.head.position.set(0, grazing ? 0.3 : 0.75, grazing ? -0.68 : -0.7);
  }
}

export class Flock {
  private readonly sheep: Sheep[];
  private ridden: Sheep | null = null;
  private remountIn = 0;

  constructor(positions: Vec3[], scene: THREE.Scene, physics: RAPIER.World, private readonly player: Player) {
    const controller = physics.createCharacterController(0.02);
    this.sheep = positions.map((p) => new Sheep(p[1], p[0], p[2], scene, physics, controller));
  }

  get riding(): boolean {
    return this.ridden !== null;
  }

  get positions(): Array<{ x: number; y: number; z: number }> {
    return this.sheep.map((s) => ({ x: s.x, y: s.y, z: s.z }));
  }

  /**
   * Advance one fixed step. Returns true when the player is riding and has been
   * moved by the sheep; false when the caller should step the player itself.
   */
  step(dt: number, input: MoveInput): boolean {
    const p = this.player;
    this.remountIn = Math.max(0, this.remountIn - dt);

    let s = this.ridden;
    // Jumping hops off; a teleport or respawn also ends the ride.
    if (s && (input.jump || Math.hypot(p.x - s.x, p.z - s.z) > 0.01 || Math.abs(p.y - s.y - BACK_HEIGHT) > 0.01)) {
      s.release();
      s = this.ridden = null;
      this.remountIn = REMOUNT_DELAY;
    }
    if (!s && p.grounded && this.remountIn === 0) {
      s =
        this.sheep.find(
          (c) => Math.abs(p.y - c.y - BACK_HEIGHT) < 0.1 && Math.hypot(p.x - c.x, p.z - c.z) < MOUNT_REACH,
        ) ?? null;
      this.ridden = s;
    }

    for (const other of this.sheep) if (other !== s) other.roam(dt);
    if (!s) return false;

    p.yaw += input.turn * PLAYER_TURN_SPEED * dt;
    s.ride(dt, input, p.yaw, p.collider);
    p.carryTo(s.x, s.y + BACK_HEIGHT, s.z);
    return true;
  }

  render(alpha: number): void {
    for (const s of this.sheep) s.render(alpha);
  }
}
