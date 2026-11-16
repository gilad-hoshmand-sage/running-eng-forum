/** world.json: schema, validation, and construction of visuals and colliders. */
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d';
import { dataUrl } from './config';
import concreteUrl from './assets/concrete.png';
import grassUrl from './assets/grass.png';
import plasterUrl from './assets/plaster.png';
import woodUrl from './assets/wood.png';

export type Vec3 = [number, number, number];

export interface MaterialDef {
  color: string;
  texture?: string;
  textureScale?: number;
  opacity?: number;
}

interface ObjectBase {
  id?: string;
  position: Vec3;
  rotationYDeg?: number;
  material?: string;
  solid?: boolean;
}
export interface BoxObject extends ObjectBase {
  type: 'box';
  size: Vec3;
}
export interface CylinderObject extends ObjectBase {
  type: 'cylinder';
  radius: number;
  height: number;
}
export interface TreeObject extends ObjectBase {
  type: 'tree';
  height?: number;
  trunkMaterial?: string;
}
export interface StairsObject extends ObjectBase {
  type: 'stairs';
  width: number;
  rise: number;
  length: number;
  steps: number;
}
export type WorldObject = BoxObject | CylinderObject | TreeObject | StairsObject;

export interface WorldData {
  schemaVersion: 1;
  name?: string;
  sky: { color: string };
  ground: { material: string };
  bounds: { halfSize: number; fenceHeight: number; fenceMaterial: string };
  spawn: { position: Vec3; yawDeg: number };
  materials: Record<string, MaterialDef>;
  objects: WorldObject[];
}

const TEXTURE_URLS: Record<string, string> = {
  concrete: concreteUrl,
  grass: grassUrl,
  plaster: plasterUrl,
  wood: woodUrl,
};

// ---------------------------------------------------------------- validation

class WorldError extends Error {}

function fail(where: string, what: string): never {
  throw new WorldError(`world.json: ${where}: ${what}`);
}
function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function reqNum(v: unknown, where: string, min = -Infinity): number {
  if (!isNum(v) || v < min) fail(where, `expected a number${min > -Infinity ? ` >= ${min}` : ''}`);
  return v;
}
function reqVec3(v: unknown, where: string): Vec3 {
  if (!Array.isArray(v) || v.length !== 3 || !v.every(isNum)) fail(where, 'expected [x, y, z] numbers');
  return v as Vec3;
}
function reqColor(v: unknown, where: string): string {
  if (typeof v !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(v)) fail(where, 'expected a colour like "#aabbcc"');
  return v;
}
function reqObj(v: unknown, where: string): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(where, 'expected an object');
  return v as Record<string, unknown>;
}

export function validateWorld(raw: unknown): WorldData {
  const w = reqObj(raw, 'root');
  if (w.schemaVersion !== 1) fail('schemaVersion', 'this build understands only schemaVersion 1');
  const sky = reqObj(w.sky, 'sky');
  reqColor(sky.color, 'sky.color');
  const materials = reqObj(w.materials, 'materials');
  for (const [name, m] of Object.entries(materials)) {
    const def = reqObj(m, `materials.${name}`);
    reqColor(def.color, `materials.${name}.color`);
    if (def.texture !== undefined && !(String(def.texture) in TEXTURE_URLS)) {
      fail(`materials.${name}.texture`, `expected one of ${Object.keys(TEXTURE_URLS).join(', ')}`);
    }
    if (def.textureScale !== undefined) reqNum(def.textureScale, `materials.${name}.textureScale`, 0.01);
    if (def.opacity !== undefined) reqNum(def.opacity, `materials.${name}.opacity`, 0);
  }
  const needMaterial = (v: unknown, where: string) => {
    if (typeof v !== 'string' || !(v in materials)) fail(where, 'expected the name of an entry in "materials"');
  };
  const ground = reqObj(w.ground, 'ground');
  needMaterial(ground.material, 'ground.material');
  const bounds = reqObj(w.bounds, 'bounds');
  reqNum(bounds.halfSize, 'bounds.halfSize', 5);
  reqNum(bounds.fenceHeight, 'bounds.fenceHeight', 0);
  needMaterial(bounds.fenceMaterial, 'bounds.fenceMaterial');
  const spawn = reqObj(w.spawn, 'spawn');
  reqVec3(spawn.position, 'spawn.position');
  reqNum(spawn.yawDeg, 'spawn.yawDeg');
  if (!Array.isArray(w.objects)) fail('objects', 'expected an array');
  w.objects.forEach((item: unknown, i: number) => {
    const o = reqObj(item, `objects[${i}]`);
    const where = `objects[${i}]${typeof o.id === 'string' ? ` ("${o.id}")` : ''}`;
    reqVec3(o.position, `${where}.position`);
    if (o.rotationYDeg !== undefined) reqNum(o.rotationYDeg, `${where}.rotationYDeg`);
    if (o.solid !== undefined && typeof o.solid !== 'boolean') fail(`${where}.solid`, 'expected true or false');
    if (o.material !== undefined) needMaterial(o.material, `${where}.material`);
    switch (o.type) {
      case 'box':
        reqVec3(o.size, `${where}.size`).forEach((n) => reqNum(n, `${where}.size`, 0.001));
        needMaterial(o.material, `${where}.material`);
        break;
      case 'cylinder':
        reqNum(o.radius, `${where}.radius`, 0.001);
        reqNum(o.height, `${where}.height`, 0.001);
        needMaterial(o.material, `${where}.material`);
        break;
      case 'tree':
        if (o.height !== undefined) reqNum(o.height, `${where}.height`, 0.2);
        if (o.trunkMaterial !== undefined) needMaterial(o.trunkMaterial, `${where}.trunkMaterial`);
        break;
      case 'stairs':
        reqNum(o.width, `${where}.width`, 0.1);
        reqNum(o.rise, `${where}.rise`, 0.01);
        reqNum(o.length, `${where}.length`, 0.1);
        if (!Number.isInteger(o.steps) || (o.steps as number) < 1 || (o.steps as number) > 200) {
          fail(`${where}.steps`, 'expected a whole number from 1 to 200');
        }
        needMaterial(o.material, `${where}.material`);
        break;
      default:
        fail(`${where}.type`, 'expected "box", "cylinder", "tree" or "stairs"');
    }
  });
  return raw as WorldData;
}

export async function loadWorld(): Promise<WorldData> {
  const res = await fetch(dataUrl('world.json'));
  if (!res.ok) throw new WorldError(`world.json could not be loaded (HTTP ${res.status})`);
  let raw: unknown;
  try {
    raw = await res.json();
  } catch (err) {
    throw new WorldError(`world.json is not valid JSON: ${(err as Error).message}`);
  }
  return validateWorld(raw);
}

// -------------------------------------------------------------- construction

const BOUNDARY_COLLIDER_HEIGHT = 60;
const DEG = Math.PI / 180;

/** Tile a texture by real size: scale each box face's UVs to metres / scale. */
function scaleBoxUVs(geo: THREE.BoxGeometry, w: number, h: number, d: number, scale: number): void {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z; four vertices each.
  const dims: Array<[number, number]> = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let face = 0; face < 6; face++) {
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      uv.setXY(i, (uv.getX(i) * dims[face][0]) / scale, (uv.getY(i) * dims[face][1]) / scale);
    }
  }
}

export interface BuiltWorld {
  objectCount: number;
  colliderCount: number;
}

export function buildWorld(data: WorldData, scene: THREE.Scene, physics: RAPIER.World): BuiltWorld {
  const loader = new THREE.TextureLoader();
  const textures = new Map<string, THREE.Texture>();
  const materials = new Map<string, THREE.MeshLambertMaterial>();
  let colliderCount = 0;

  const texture = (name: string): THREE.Texture => {
    let t = textures.get(name);
    if (!t) {
      t = loader.load(TEXTURE_URLS[name]);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      textures.set(name, t);
    }
    return t;
  };
  const material = (name: string): THREE.MeshLambertMaterial => {
    let m = materials.get(name);
    if (!m) {
      const def = data.materials[name];
      const opacity = def.opacity ?? 1;
      m = new THREE.MeshLambertMaterial({
        color: def.color,
        map: def.texture ? texture(def.texture) : null,
        transparent: opacity < 1,
        opacity,
      });
      materials.set(name, m);
    }
    return m;
  };
  const fallback = (color: number) => new THREE.MeshLambertMaterial({ color });
  const defaultTrunk = fallback(0x7a5a3a);
  const defaultFoliage = fallback(0x3f8f4a);
  const texScale = (name: string) => data.materials[name].textureScale ?? 2;

  const addCollider = (desc: RAPIER.ColliderDesc, pos: THREE.Vector3, quat: THREE.Quaternion) => {
    physics.createCollider(
      desc.setTranslation(pos.x, pos.y, pos.z).setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }),
    );
    colliderCount++;
  };

  /** A box in the local frame of `origin` (position + rotation about Y). */
  const addBox = (
    origin: THREE.Vector3,
    rotY: number,
    localCentre: THREE.Vector3,
    size: Vec3,
    matName: string | null,
    solid: boolean,
    localQuat = new THREE.Quaternion(),
  ) => {
    const frame = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    const pos = localCentre.clone().applyQuaternion(frame).add(origin);
    const quat = frame.clone().multiply(localQuat);
    if (matName) {
      const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
      if (data.materials[matName].texture) scaleBoxUVs(geo, size[0], size[1], size[2], texScale(matName));
      const mesh = new THREE.Mesh(geo, material(matName));
      mesh.position.copy(pos);
      mesh.quaternion.copy(quat);
      scene.add(mesh);
    }
    if (solid) addCollider(RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2), pos, quat);
  };

  // Sky, fog and light.
  scene.background = new THREE.Color(data.sky.color);
  scene.fog = new THREE.Fog(data.sky.color, 90, 320);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f7a, 2.2));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.6);
  sun.position.set(40, 80, 25);
  scene.add(sun);

  // Ground: visual plane reaching past the fence to the fog; solid slab with its top at y = 0.
  const half = data.bounds.halfSize;
  const groundSize = half * 2 + 600;
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
  const groundUv = groundGeo.attributes.uv as THREE.BufferAttribute;
  const groundTiles = groundSize / texScale(data.ground.material);
  for (let i = 0; i < groundUv.count; i++) groundUv.setXY(i, groundUv.getX(i) * groundTiles, groundUv.getY(i) * groundTiles);
  const ground = new THREE.Mesh(groundGeo, material(data.ground.material));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const zero = new THREE.Vector3();
  addBox(zero, 0, new THREE.Vector3(0, -1, 0), [half * 2 + 40, 2, half * 2 + 40], null, true);

  // Boundary: a visible fence, and a much taller invisible wall behind it.
  const fh = data.bounds.fenceHeight;
  const t = 0.2;
  for (const [x, z, sx, sz] of [
    [0, -half, half * 2 + t * 2, t],
    [0, half, half * 2 + t * 2, t],
    [-half, 0, t, half * 2],
    [half, 0, t, half * 2],
  ] as const) {
    const out = t / 2; // inner face sits exactly at halfSize
    const cx = x + Math.sign(x) * out;
    const cz = z + Math.sign(z) * out;
    if (fh > 0) addBox(zero, 0, new THREE.Vector3(cx, fh / 2, cz), [sx, fh, sz], data.bounds.fenceMaterial, false);
    addBox(zero, 0, new THREE.Vector3(cx, BOUNDARY_COLLIDER_HEIGHT / 2, cz), [sx, BOUNDARY_COLLIDER_HEIGHT, sz], null, true);
  }

  for (const o of data.objects) {
    const origin = new THREE.Vector3(...o.position);
    const rotY = (o.rotationYDeg ?? 0) * DEG;
    const solid = o.solid ?? true;
    const frame = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    switch (o.type) {
      case 'box':
        addBox(origin, rotY, new THREE.Vector3(0, o.size[1] / 2, 0), o.size, o.material!, solid);
        break;
      case 'cylinder': {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(o.radius, o.radius, o.height, 16), material(o.material!));
        mesh.position.copy(origin).y += o.height / 2;
        scene.add(mesh);
        if (solid) addCollider(RAPIER.ColliderDesc.cylinder(o.height / 2, o.radius), mesh.position, frame);
        break;
      }
      case 'tree': {
        const h = o.height ?? 6;
        const trunkH = h * 0.4;
        const trunkR = Math.max(0.03, h * 0.035);
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(trunkR * 0.8, trunkR, trunkH, 8),
          o.trunkMaterial ? material(o.trunkMaterial) : 'treeTrunk' in data.materials ? material('treeTrunk') : defaultTrunk,
        );
        trunk.position.copy(origin).y += trunkH / 2;
        const foliageMat = o.material ? material(o.material) : 'treeFoliage' in data.materials ? material('treeFoliage') : defaultFoliage;
        const lower = new THREE.Mesh(new THREE.ConeGeometry(h * 0.28, h * 0.5, 9), foliageMat);
        lower.position.copy(origin).y += h * 0.3 + h * 0.25;
        const upper = new THREE.Mesh(new THREE.ConeGeometry(h * 0.2, h * 0.4, 9), foliageMat);
        upper.position.copy(origin).y += h * 0.6 + h * 0.2;
        scene.add(trunk, lower, upper);
        if (solid) {
          const pos = origin.clone();
          pos.y += h / 2;
          addCollider(RAPIER.ColliderDesc.cylinder(h / 2, trunkR + 0.05), pos, frame);
        }
        break;
      }
      case 'stairs': {
        // Ascends toward local +x from `position` (centre of the bottom edge of the first step).
        const run = o.length / o.steps;
        const rise = o.rise / o.steps;
        for (let i = 0; i < o.steps; i++) {
          const top = (i + 1) * rise;
          addBox(origin, rotY, new THREE.Vector3((i + 0.5) * run, top / 2, 0), [run, top, o.width], o.material!, solid);
        }
        if (solid) {
          // Invisible ramp along the step noses so walking up and down is smooth.
          const angle = Math.atan2(rise, run);
          const thick = 0.1;
          const len = Math.hypot(o.length, o.rise);
          const mid = new THREE.Vector3(-run + o.length / 2, o.rise / 2, 0);
          mid.x += (Math.sin(angle) * thick) / 2;
          mid.y -= (Math.cos(angle) * thick) / 2;
          const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
          addBox(origin, rotY, mid, [len, thick, o.width], null, true, tilt);
        }
        break;
      }
    }
  }

  return { objectCount: data.objects.length, colliderCount };
}
