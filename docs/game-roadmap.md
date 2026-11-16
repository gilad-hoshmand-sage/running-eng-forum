# Game roadmap (supporting)

The game changes only when a session needs it or engagement justifies it. The sequence of sessions is in [forum-plan.md](forum-plan.md); this document does not follow its phases.

**Status: nothing implemented.** The game is AI-owned. Items are stated as capabilities, interfaces and acceptance criteria; internals are left to the implementing AI. Technology: [design.md § 3](design.md#3-selected-game-technology).

| Item | Summary | Needed by | Status |
| --- | --- | --- | --- |
| [G0](#g0-playable-baseline) | Local single-player baseline with operational surface | S01, S02, S03 | Planned, required |
| [G1](#g1-new-version-notice) | "New version available" notice | S03 (optional) | Tentative |
| [G2](#g2-lobby-and-chat) | Name entry, connection to a server, chat | S05 | Tentative |
| [G3](#g3-remote-players) | Other players visible and moving | S06 | Tentative |
| [G4](#g4-live-world-objects) | Objects added and removed at runtime from server state | S07, S08 | Tentative |
| [G5](#g5-client-diagnostics-reporting) | Client error and timing reports | S09 | Tentative |
| [G6](#g6-engagement-extras) | Doors, a character, collectibles | None | Optional |

Sessions needing no game change beyond G0: [S01](sessions/01-dev-server-and-build.md), [S02](sessions/02-localhost-to-public-url.md), [S03](sessions/03-caching-and-releases.md), [S04](sessions/04-delivery-paths.md), [S08](sessions/08-abuse-and-validation.md), [S10](sessions/10-email-integration.md).

## G0: Playable baseline

Tasks: [T-010 to T-016](tasks.md#phase-1-game-baseline-g0).

### Capabilities

- Small 3D world: a grassy outdoor area of roughly 100 × 100 m with trees or similar props and a boundary the player cannot cross.
- One office-like building about the size of a large house, two floors, with a doorway, stairs, several rooms and simple furniture.
- First-person movement with keyboard and mouse: walk, look, jump ([D-18](decisions.md#d-18)).
- Gravity and collision with the ground, walls, stairs, furniture and props.
- Simple, readable visuals. Ordinary setting. No gore, blood or health mechanics.
- On-screen controls hint, build ID, and a diagnostics overlay.
- A respawn key, and automatic respawn if the player leaves the world bounds.

### Operational surface

As listed in [design.md § Game operational surface](design.md#game-operational-surface): root commands, static build output, `config.json`, `version.json`, `world.json`, test hook, and `apps/game/README.md`.

### Acceptance criteria

Play:

1. After `npm install` and `npm run dev`, the game loads in current Chrome on macOS and the player can walk and look around within 5 seconds of clicking the canvas.
2. The player can walk from the spawn point into the building, climb to the second floor and return outside.
3. The player cannot pass through the ground, any wall, furniture or the world boundary, including while jumping or running into corners.
4. Jumping returns the player to the ground; the player cannot climb walls by repeated jumping.
5. Holds about 60 fps on a recent MacBook with integrated graphics.
6. Also loads and plays in current Safari and Firefox on macOS.

Build and delivery:

7. `npm run build` produces a static directory matching [design.md § Expected build output](design.md#expected-build-output), with content-hashed asset filenames and a separate `.wasm` file.
8. The built output works when served by at least three unrelated static servers, at a domain root and under a sub-path, with no server-side logic.
9. The running game makes no requests to third-party origins.
10. Initial transfer is under about 5 MB.
11. Editing `config.json` or `world.json` in the built output changes behaviour after a reload, without rebuilding.
12. The build ID on screen matches `version.json`, and changes with each build.

Verification:

13. `npm test` runs automated acceptance tests against the built output that cover at least criteria 1, 3 (one wall, the ground, the boundary), 4, 9, 11 and 12 using the test hook.
14. `apps/game/README.md` covers every item of the operational surface.

### Inexpensive optional inclusion

A door that opens with a key press may be included in G0 if it does not add risk. Otherwise it belongs to [G6](#g6-engagement-extras).

## G1: New version notice

- **Justification:** makes "a tab keeps running the old version" visible in [S03](sessions/03-caching-and-releases.md). The session works without it by comparing build IDs.
- **Capability:** the game periodically refetches `version.json` and shows a notice when the build ID differs from its own.
- **Acceptance:** with a tab open, deploying a new build produces the notice within the polling interval; reloading clears it; the interval is configurable in `config.json`.

## G2: Lobby and chat

- **Justification:** first use of a backend ([S05](sessions/05-first-backend.md)).
- **Depends on:** `apps/server`, `packages/shared` message schemas, `serverUrl` in `config.json`.
- **Capability:** name entry before play; connection status in the overlay; a text chat panel; a list of who is present.
- **Acceptance:** two browsers on different networks see each other's names and messages; with `serverUrl` null or the server down, single-player works and the overlay says "offline"; reconnects after a server restart without a page reload.

## G3: Remote players

- **Justification:** the subject of [S06](sessions/06-multiplayer-sync.md).
- **Depends on:** G2.
- **Capability:** other players appear as simple avatars with name labels and move as their owners move. A switch (config or query parameter) selects the smoothing mode, so the session can compare raw updates with interpolation, and adjusts the send rate.
- **Acceptance:** ten simultaneous players stay visible and plausibly positioned; a disconnected player disappears within a few seconds; the smoothing switch has a visible effect; players do not collide with each other.

## G4: Live world objects

- **Justification:** attendees place objects into the running world ([S07](sessions/07-live-world-editing.md)); the abuse session reuses it ([S08](sessions/08-abuse-and-validation.md)).
- **Depends on:** server object API, shared object schema (derived from the `world.json` schema).
- **Capability:** objects created or deleted on the server appear or disappear in every connected game without a reload; placed objects are solid; objects persist across a page reload.
- **Acceptance:** an object created through the API appears in all open games within one second; several hundred objects do not make the game unplayable; a server-side reset clears them everywhere.

## G5: Client diagnostics reporting

- **Justification:** gives [S09](sessions/09-observability.md) client-side signals to look at.
- **Capability:** when enabled in `config.json`, the game reports errors and basic timings (load time, frame rate, connection drops) to a configured endpoint.
- **Acceptance:** a forced error shows up on the server side with build ID and deployment label; reporting is off by default.

## G6: Engagement extras

Add only when attendees ask for more or a session wants a new hook. None is planned.

- Doors that open, buttons that trigger something.
- A character that responds when approached.
- Collectibles or points. Details are undecided.
