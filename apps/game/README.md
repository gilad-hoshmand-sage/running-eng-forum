# Demo game

The forum's demo application: a small first-person 3D world with a park and a two-floor office building. It runs entirely in the browser.

This file is the complete contract for using the game. You do not need to read the source. Roadmap item: [G0](../../docs/game-roadmap.md#g0-playable-baseline). Verification record: [docs/tasks.md](../../docs/tasks.md#phase-1-game-baseline-g0).

## 1. Commands

Run from the repository root. Needs Node 20.19 or newer.

| Command | Effect |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `http://localhost:5173/` |
| `npm run build` | Type-check, then write the deployable build to `apps/game/dist/` |
| `npm run preview` | Serve `apps/game/dist/` at `http://localhost:4173/` |
| `npm test` | Build, then run the acceptance tests against `dist/` in headless Chromium |

Extras:

| Command | Effect |
| --- | --- |
| `npm run dev -- --host` | Dev server reachable from other devices on the network. Same flag works for `preview`. |
| `npm run dev -- --port 3000` | Another port. Same flag works for `preview`. |
| `npm run test:browsers -w apps/game` | Acceptance tests in Chromium, Firefox and WebKit |

Notes:

- `npm test` downloads Playwright's Chromium on first use (about 150 MB, cached outside the repository). On Linux CI, run `npx playwright install-deps chromium` once first.
- `npm test` uses port 4173; stop `npm run preview` before running it.
- In dev, saving `public/config.json` or `public/world.json` reloads every connected browser.

## 2. Build artifacts and runtime requirements

`npm run build` writes:

```
apps/game/dist/
  index.html                     entry page; references the hashed files by relative URL
  assets/index-<hash>.js         game code; changes every build (contains the build ID)
  assets/three-<hash>.js         rendering library; changes only when the library does
  assets/rapier-<hash>.js        physics glue code
  assets/rapier_wasm3d_bg-<hash>.wasm   physics engine (about 3 MB, about 1.2 MB gzipped)
  assets/index-<hash>.css        styles
  assets/<name>-<hash>.png       four textures
  config.json                    runtime configuration (not hashed)
  version.json                   build identity (not hashed)
  world.json                     world layout (not hashed)
```

Whole directory: about 4 MB uncompressed.

To run it, serve the directory with any static file server. Requirements:

- **HTTP or HTTPS.** Opening `index.html` from disk (`file://`) does not work.
- **No server logic, no rewrites.** Every URL is a file. All URLs are relative, so the directory works at a domain root or under any sub-path. The page URL must end in `/` or `index.html`.
- **`.wasm` as `application/wasm`** is preferred. The game still starts with another content type, slightly slower.
- **No other origins.** The game requests only its own files.
- **Browser:** WebGL 2. Current Chrome, Firefox or Safari on a desktop. Keyboard and mouse only; no touch controls.
- The game fetches the three JSON files with the browser's normal caching rules, so the server's cache headers decide when edits become visible.

## 3. `config.json`

Fetched once at startup. Edit it in `dist/` (or `public/` in dev) and reload; no rebuild.

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `deploymentLabel` | string | `"unlabelled"` | Name of this deployment. Shown top-right and in the diagnostics overlay. |
| `serverUrl` | string or `null` | `null` | Backend address. Shown in the overlay only; this build has no network code. |

If `config.json` is missing or invalid, the game starts with the defaults and the overlay's `config` line says so. Unknown keys are ignored.

Query-parameter overrides (for demonstrations; they win over `config.json`):

| Parameter | Effect |
| --- | --- |
| `?deploymentLabel=text` | Overrides `deploymentLabel` |
| `?serverUrl=wss://host` | Overrides `serverUrl`; `?serverUrl=null` or an empty value sets it to `null` |
| `?diag=1` | Starts with the diagnostics overlay open |

## 4. `version.json`

Written by every build. Do not edit.

```json
{
  "buildId": "20261116-102132-4002ad3",
  "commit": "4002ad3f29820b2b50f3c5b5cf61b9f8e48ff3b7",
  "dirty": false,
  "builtAt": "2026-11-16T10:21:32.335Z"
}
```

- `buildId`: UTC build time plus the short commit, with `-dirty` appended when the working tree had uncommitted changes. Different for every build.
- The same ID is compiled into the game code and shown on screen. A tab therefore shows the build it is *running*; `version.json` shows the build the server *has*. When they differ, the overlay's `build` line shows both.
- Under `npm run dev` the build ID is `dev`.

## 5. `world.json`

The whole world: fetched at startup, edit and reload, no rebuild. An invalid file stops the game with a message that names the faulty entry.

Units are metres. `x` is east, `y` is up, `z` is south. The ground is at `y = 0`. Angles are degrees about the vertical axis; `0` faces −z (north) and positive values turn left.

Top level:

| Key | Type | Meaning |
| --- | --- | --- |
| `schemaVersion` | `1` | Must be `1` |
| `name` | string, optional | Shown in the overlay |
| `sky.color` | colour | Sky and fog colour |
| `ground.material` | material name | Ground surface |
| `bounds.halfSize` | number ≥ 5 | The playable area is the square from −halfSize to +halfSize in x and z, enclosed by a solid wall |
| `bounds.fenceHeight` | number ≥ 0 | Height of the visible fence. The solid wall is always far taller. |
| `bounds.fenceMaterial` | material name | Fence surface |
| `spawn.position` | `[x, y, z]` | Where the player's feet start and respawn. Must be in free space. |
| `spawn.yawDeg` | number | Initial facing |
| `materials` | object | Named materials, see below |
| `objects` | array | Objects, see below |

Material (`"materials": { "<name>": { ... } }`):

| Key | Type | Meaning |
| --- | --- | --- |
| `color` | `"#rrggbb"` | Required. Tints the texture if there is one. |
| `texture` | `"grass"`, `"plaster"`, `"wood"` or `"concrete"` | Optional built-in texture |
| `textureScale` | number > 0 | Metres per texture repeat. Default `2`. Applies to boxes, stairs and the ground. |
| `opacity` | 0 to 1 | Optional. Below 1 the material is see-through. |

Changing one material recolours everything that uses it; for example `buildingWall` is every outer wall of the office.

Fields common to all objects:

| Key | Type | Meaning |
| --- | --- | --- |
| `type` | string | `"box"`, `"cylinder"`, `"tree"`, `"stairs"` or `"sheep"` |
| `id` | string, optional | A label for humans and error messages |
| `position` | `[x, y, z]` | Centre of the object's **base** |
| `rotationYDeg` | number, optional | Rotation about the vertical axis. Default `0`. |
| `material` | material name | Required except for trees; ignored for sheep |
| `solid` | boolean, optional | Default `true`. `false` makes the object visual only. |

Per type:

| Type | Extra keys | Notes |
| --- | --- | --- |
| `box` | `size: [x, y, z]` | Walls, floors, furniture. Everything in the building is boxes. |
| `cylinder` | `radius`, `height` | Upright |
| `tree` | `height` (default 6), `trunkMaterial` (optional) | `material` is the foliage. Without them, materials named `treeFoliage` and `treeTrunk` are used if present. Only the trunk is solid. |
| `stairs` | `width`, `rise`, `length`, `steps` | Climbs `rise` metres over `length` metres toward +x (before rotation). `position` is the centre of the bottom edge of the first step. Solid underneath. |
| `sheep` | none | A sheep that grazes within about 5 m of `position` and can be ridden (§ 6). Place it on flat ground: it moves horizontally only and does not climb steps. `rotationYDeg` and `solid` are ignored. Counts toward the object count. |

Example:

```json
{ "id": "crate", "type": "box", "position": [3, 0, 5], "size": [1, 1, 1], "rotationYDeg": 30, "material": "wood" }
```

Limits of the player, useful when editing: 1.8 m tall, 0.7 m wide, steps up ledges of 0.3 m, jumps about 0.9 m, walks up slopes to 50°.

## 6. Controls and on-screen information

| Input | Action |
| --- | --- |
| Click | Capture the mouse for looking around |
| Mouse | Look |
| `W` `A` `S` `D` | Walk |
| Arrow keys | Up/down walk, left/right turn (works without the mouse) |
| `Shift` | Run |
| `Space` | Jump |
| `R` | Respawn at the spawn point |
| `O` or `F3` | Toggle the diagnostics overlay |
| `Esc` | Release the mouse |

The player also respawns automatically after leaving the world bounds.

Sheep: jump onto a sheep's back (0.7 m high) to ride it. While riding, the walking, running and looking controls steer the sheep (5 m/s, 9 m/s with `Shift`), and `Space` hops off. A sheep stays where its rider leaves it. Respawning also ends the ride.

Always visible: a controls hint (bottom-left) and `<deploymentLabel> · build <buildId>` (top-right).

Diagnostics overlay (top-left, hidden by default):

| Line | Shows |
| --- | --- |
| `build` | Build ID this tab is running; plus the ID in `version.json` if it differed at load |
| `commit`, `built` | From `version.json` |
| `deployment` | `deploymentLabel` |
| `config` | Where the configuration came from, and which keys a query parameter overrode |
| `serverUrl` | Configured value |
| `connection` | Always `offline` in this build (placeholder for the backend) |
| `position` | Feet position in metres |
| `facing` | Yaw and pitch in degrees |
| `grounded` | Whether the player is standing on something; adds `(riding a sheep)` while riding |
| `fps` | Frames per second, updated twice a second |
| `world` | World name and object count |

## 7. Test hook

`window.__game` exists once the game is playable. It is public: anyone can use it from the DevTools console. It is meant for acceptance tests and rehearsals.

If startup fails, `window.__game` stays undefined and `window.__gameError` holds the message shown on screen.

Read-only state, `window.__game.state` (a fresh snapshot on every read):

| Field | Type | Meaning |
| --- | --- | --- |
| `ready` | `true` | |
| `buildId`, `commit` | string | Build identity |
| `deploymentLabel` | string | Effective value |
| `config` | object | Effective configuration after overrides |
| `connectionState` | `"offline"` | Placeholder |
| `position` | `{x, y, z}` | Feet position |
| `yawDeg`, `pitchDeg` | number | Facing; yaw is within −180..180 |
| `grounded` | boolean | Always `true` while riding |
| `riding` | boolean | Whether the player is riding a sheep |
| `sheep` | array of `{x, y, z}` | Feet position of each sheep, in `world.json` order. To mount from a test: `teleport` to a sheep's `x`, `z` at `y` 2 and wait for `riding`. |
| `fps` | number | |
| `respawnCount` | number | Respawns since load, manual or automatic |
| `pointerLocked` | boolean | Whether the mouse is captured |
| `diagnosticsVisible` | boolean | |
| `world` | `{name, objectCount, halfSize, spawn: {x, y, z, yawDeg}}` | From `world.json` |

Test-only actions:

| Call | Effect |
| --- | --- |
| `teleport(x, y, z, yawDeg?)` | Move the player's feet there. No collision check: choose free space. |
| `setInput({forward, right, turn, jump, run, yawDeg, pitchDeg})` | Replace keyboard input until cleared. `forward`, `right`, `turn` are −1..1; `jump`, `run` are booleans; `yawDeg`, `pitchDeg` set the view once. All optional. |
| `setInput(null)` | Return control to the keyboard |
| `walkTo(x, z, {timeoutMs?, run?})` | Walk in a straight line toward the point. Resolves `true` on arrival (within 0.25 m), `false` on timeout (default 10 s of game time) or interruption. It does not find paths. |
| `respawn()` | Same as pressing `R` |

`hookVersion` is `1`.

Example, in the console:

```js
await __game.walkTo(0, -8);      // to the front door
__game.state.position;           // { x: 0, y: 0, z: -8 }
```

The game only advances while its tab is visible, as with any page animation.

## 8. Verification

`npm test` checks, against the built output:

- Play: loading and moving after a click; the route from spawn to the upper floor and back; solid ground, walls, window panes, corners, furniture and boundary; jumping; respawn; riding a sheep and hopping off.
- HUD: build ID against `version.json`; overlay contents and toggle; query overrides.
- Build output: file layout, content-hashed names, separate `.wasm`, relative URLs, total size, a new build ID per build.
- Delivery: three different static servers, at a root and under a sub-path; requests stay on the page's origin; edits to `config.json` and `world.json` apply after a reload; a broken `world.json` is reported on screen.

What has been verified, when and on which browsers is recorded in [docs/tasks.md](../../docs/tasks.md#phase-1-game-baseline-g0).

## 9. Network protocol

None. This build makes no network connections beyond fetching its own files.
