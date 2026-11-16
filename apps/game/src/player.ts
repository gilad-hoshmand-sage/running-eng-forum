/** First-person player: kinematic capsule driven by Rapier's character controller. */
import * as RAPIER from '@dimforge/rapier3d';

export interface MoveInput {
  /** -1..1, positive walks forward. */
  forward: number;
  /** -1..1, positive strafes right. */
  right: number;
  /** -1..1, positive turns left (keyboard turning). */
  turn: number;
  jump: boolean;
  run: boolean;
}

export const NO_INPUT: MoveInput = { forward: 0, right: 0, turn: 0, jump: false, run: false };

const RADIUS = 0.35;
const HALF_HEIGHT = 0.55; // of the capsule's cylindrical part; total height 1.8 m
const CENTRE = HALF_HEIGHT + RADIUS;
export const EYE_HEIGHT = 1.65;
const WALK_SPEED = 4.5;
const RUN_SPEED = 7.5;
const TURN_SPEED = 2.2; // rad/s
const GRAVITY = 22;
const JUMP_SPEED = 6.3; // apex about 0.9 m
const MAX_FALL_SPEED = 40;
const MAX_PITCH = (89 * Math.PI) / 180;

export class Player {
  /** Feet position. */
  x = 0;
  y = 0;
  z = 0;
  /** Feet position before the latest step, for render interpolation. */
  prevX = 0;
  prevY = 0;
  prevZ = 0;
  /** Radians. Yaw 0 looks toward -z; positive yaw turns left. */
  yaw = 0;
  pitch = 0;
  grounded = false;

  private velY = 0;
  private readonly body: RAPIER.RigidBody;
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;

  constructor(physics: RAPIER.World) {
    this.body = physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
    this.collider = physics.createCollider(RAPIER.ColliderDesc.capsule(HALF_HEIGHT, RADIUS), this.body);
    this.controller = physics.createCharacterController(0.02);
    this.controller.setUp({ x: 0, y: 1, z: 0 });
    this.controller.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    this.controller.setMinSlopeSlideAngle((50 * Math.PI) / 180);
    this.controller.enableAutostep(0.3, 0.2, false);
    this.controller.enableSnapToGround(0.3);
    this.controller.setApplyImpulsesToDynamicBodies(false);
  }

  teleport(x: number, y: number, z: number, yaw?: number): void {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.z = this.prevZ = z;
    if (yaw !== undefined) {
      this.yaw = yaw;
      this.pitch = 0;
    }
    this.velY = 0;
    this.grounded = false;
    this.body.setTranslation({ x, y: y + CENTRE, z }, true);
    this.body.setNextKinematicTranslation({ x, y: y + CENTRE, z });
  }

  look(dYaw: number, dPitch: number): void {
    this.yaw += dYaw;
    this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch + dPitch));
  }

  /** Advance one fixed step. Call physics.step() afterwards. */
  step(dt: number, input: MoveInput): void {
    this.prevX = this.x;
    this.prevY = this.y;
    this.prevZ = this.z;

    this.yaw += input.turn * TURN_SPEED * dt;

    let f = input.forward;
    let r = input.right;
    const mag = Math.hypot(f, r);
    if (mag > 1) {
      f /= mag;
      r /= mag;
    }
    const speed = input.run ? RUN_SPEED : WALK_SPEED;
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const vx = (-sin * f + cos * r) * speed;
    const vz = (-cos * f - sin * r) * speed;

    const jumping = this.grounded && input.jump;
    if (this.grounded) this.velY = jumping ? JUMP_SPEED : 0;
    this.velY = Math.max(-MAX_FALL_SPEED, this.velY - GRAVITY * dt);
    // Snap-to-ground would cancel the first frame of a jump.
    if (this.velY > 0) this.controller.disableSnapToGround();
    else this.controller.enableSnapToGround(0.3);

    const desired = { x: vx * dt, y: this.velY * dt, z: vz * dt };
    this.controller.computeColliderMovement(this.collider, desired);
    const m = this.controller.computedMovement();
    this.grounded = this.controller.computedGrounded();
    // Hitting a ceiling ends the upward part of a jump.
    if (this.velY > 0 && m.y < desired.y - 1e-4) this.velY = 0;

    this.x += m.x;
    this.y += m.y;
    this.z += m.z;
    this.body.setNextKinematicTranslation({ x: this.x, y: this.y + CENTRE, z: this.z });
  }
}
