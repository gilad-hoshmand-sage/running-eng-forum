// Generates the small tiling textures in src/assets/. Original procedural
// noise, no third-party artwork. Run: node scripts/gen-textures.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const SIZE = 64;

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(pixel) {
  const raw = Buffer.alloc(SIZE * (1 + SIZE * 3));
  for (let y = 0; y < SIZE; y++) {
    raw[y * (1 + SIZE * 3)] = 0;
    for (let x = 0; x < SIZE; x++) {
      const v = Math.max(0, Math.min(255, Math.round(pixel(x, y))));
      const o = y * (1 + SIZE * 3) + 1 + x * 3;
      raw[o] = raw[o + 1] = raw[o + 2] = v;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Deterministic generator so the files (and their content hashes) are stable.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

// Textures are near-white greyscale; the material colour tints them.
const textures = {
  grass: (() => {
    const r = rng(1);
    const n = Array.from({ length: SIZE * SIZE }, () => r());
    return (x, y) => 200 + 55 * n[y * SIZE + x] - (n[((y + 1) % SIZE) * SIZE + x] > 0.8 ? 40 : 0);
  })(),
  plaster: (() => {
    const r = rng(2);
    const n = Array.from({ length: SIZE * SIZE }, () => r());
    return (x, y) => 236 + 19 * n[y * SIZE + x];
  })(),
  wood: (() => {
    const r = rng(3);
    const rows = Array.from({ length: SIZE }, () => r());
    const n = Array.from({ length: SIZE * SIZE }, () => r());
    return (x, y) => 205 + 35 * rows[y] + 15 * n[y * SIZE + x] - (y % 16 === 0 ? 45 : 0);
  })(),
  concrete: (() => {
    const r = rng(4);
    const n = Array.from({ length: SIZE * SIZE }, () => r());
    return (x, y) => 215 + 30 * n[y * SIZE + x] - (x === 0 || y === 0 ? 50 : 0);
  })(),
};

for (const [name, fn] of Object.entries(textures)) {
  const file = new URL(`../src/assets/${name}.png`, import.meta.url);
  writeFileSync(file, png(fn));
  console.log('wrote', file.pathname);
}
