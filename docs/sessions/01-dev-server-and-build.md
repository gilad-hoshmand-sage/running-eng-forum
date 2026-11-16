# S01: The dev server and the build

**Status:** detailed proposal. Commands are proposed, not verified.

## Learning objective

Attendees can explain what the dev server does, what the build produces, and that the built game is only files that any HTTP server can hand out.

## Prerequisites

- None for attendees.
- Game baseline [G0](../game-roadmap.md#g0-playable-baseline) complete.

## Preparation

Effort: **S** once G0 exists (G0 itself is **L**). Tasks: [Phase 2](../tasks.md#phase-2-session-1-preparation).

- Three ways to serve `dist/` ready to run: the preview command, a zero-config static server, and a container web server.
- A one-page command sheet for attendees who run things locally.
- A prepared, visible `world.json` edit (for example the building's wall colour).
- Captured screenshots of each Network-panel view as fallback.

Uncertainties:

- Whether attendees can reach the organizer's laptop over the room network ([Q-07](../decisions.md#q-07)).
- How the chosen servers differ on `.wasm` content type and compression; confirm in rehearsal so the comparison is real.

## What attendees start with

- A browser with DevTools.
- The address of the organizer's laptop on the local network.
- Optional: the repository cloned, Node installed, `npm install` already run.

## Game changes

None beyond G0.

## Relevant tools

Vite dev server and build, browser DevTools Network panel, `curl -I`, a static file server, Docker with a stock web-server image.

## Agenda

| Time | Activity |
| --- | --- |
| 0–5 | Everyone opens the game from the organizer's laptop and plays. Question posed: what did your browser just download, and from what? |
| 5–17 | **Dev server.** Run the dev command. In the Network panel: many small module requests, the hot-reload WebSocket, unminified code. Save the prepared `world.json` edit and watch every connected browser update. Explain `localhost` versus listening on the network. |
| 17–30 | **Build.** Run the build. Walk the output directory: entry HTML, hashed JS and CSS, the `.wasm` file, assets, `config.json`, `version.json`. Compare request count and size with the dev server. Point: all game code runs in the browser. |
| 30–40 | **It is only files.** Serve the same directory with three different servers. Attendees compare response headers. Open `index.html` directly from disk and see why it fails. |
| 40–45 | Questions. Close with the limit of today's setup: only this room can reach it. |

## Explained, assembled, demonstrated

- Explained: transformation on demand versus ahead of time; content-hashed filenames; what a static server is.
- Demonstrated: dev server, build, three servers over one directory.
- Assembled: nothing.

## Participant interaction

- Play the game.
- Find three things in DevTools: the number of requests in dev versus build, the largest file, one header that differs between two servers.
- Optional: run the same commands locally.

## Intended outcome

Learning.

## How the outcome is observed

- Attendees report the three DevTools findings aloud or in chat.
- The same build ID appears on screen under all three servers.

## Starting state, reset, rehearsal

Starting state: repository at the session tag, dependencies installed, no servers running, `world.json` unmodified.

Reset: revert the `world.json` edit; delete the build output.

Rehearsal checklist:

1. Fresh clone, install, dev, build, preview all work.
2. A second device on the room network can load the game from the laptop.
3. All three servers start and show the expected header differences.
4. The `world.json` edit hot-updates a second device.
5. Container image is already pulled.

## Fallback

- Room network blocks access: attendees watch the shared screen, or the organizer opens a Quick Tunnel and says it will be explained next month.
- A server fails to start: use the remaining two.
- Everything fails: walk through the captured screenshots.

## Links

- Tasks: [T-020 to T-023](../tasks.md#phase-2-session-1-preparation)
- Design: [§ 4 Local runtime, build artifacts and delivery](../design.md#4-local-runtime-build-artifacts-and-delivery)
- Decisions: [D-02](../decisions.md#d-02), [D-08](../decisions.md#d-08)
- Next: [S02](02-localhost-to-public-url.md)
