# S01: The dev server and the build

**Status:** detailed proposal, reworked for online-only delivery ([D-19](../decisions.md#d-19)). Commands are proposed, not verified.

## Learning objective

Attendees can explain what the dev server does, what the build produces, and that the built game is only files that any HTTP server can hand out.

## Prerequisites

- None for attendees.
- Game baseline [G0](../game-roadmap.md#g0-playable-baseline) complete.
- The build deployed to two public hosts.

## Preparation

Effort: **M** (was S; the two hosted deployments are now needed before this session). Tasks: [Phase 2](../tasks.md#phase-2-session-1-preparation).

- The same build live at two public URLs on different hosts, each with its own `deploymentLabel`.
- Three ways to serve `dist/` locally, ready to run on the shared screen: the preview command, a zero-config static server, and a container web server.
- A one-page command sheet for attendees who run things on their own machine.
- A prepared, visible `world.json` edit (for example the building's wall colour).
- Captured screenshots of each Network-panel view as fallback.

Uncertainties:

- Whether the corporate network reaches both hosting domains; check in rehearsal.
- How the two hosts and the local servers differ on `.wasm` content type, compression and cache headers; confirm in rehearsal so the comparison is real.

## What attendees start with

- A browser with DevTools.
- The two public URLs.
- Optional: the repository cloned on their own machine, Node installed, `npm install` already run.

Nobody connects to the organizer's laptop. Local steps are watched on the shared screen or repeated on the attendee's own machine.

## Game changes

None beyond G0.

## Relevant tools

Vite dev server and build, browser DevTools Network panel, `curl -I`, a static file server, Docker with a stock web-server image.

## Agenda

| Time | Activity |
| --- | --- |
| 0–5 | Everyone opens the hosted game and plays. Question posed: what did your browser just download, and what produced it? |
| 5–17 | **Dev server**, on the shared screen. Run the dev command. In the Network panel: many small module requests, the hot-reload WebSocket, unminified code. Save the prepared `world.json` edit and watch the browser update. Explain why this server exists only on a developer's machine. |
| 17–30 | **Build.** Run the build on screen and walk the output directory: entry HTML, hashed JS and CSS, the `.wasm` file, assets, `config.json`, `version.json`. Attendees open the Network panel on the hosted URL and find the same files. Compare request count and size with the dev server. Point: all game code runs in the browser. |
| 30–40 | **It is only files.** On screen, serve the same directory with three different local servers. Attendees compare the two public URLs: same build ID, same files, different response headers. |
| 40–45 | Questions. Close with next month's question: how did those files get to those two URLs? |

## Explained, assembled, demonstrated

- Explained: transformation on demand versus ahead of time; content-hashed filenames; what a static server is.
- Demonstrated: dev server, build, three local servers and two hosts over one directory.
- Assembled: nothing.

## Participant interaction

- Play the hosted game.
- Find three things in DevTools on the hosted URLs: the number of requests, the largest file, one header that differs between the two hosts.
- Optional: run the dev server and build on their own machine and compare.

## Intended outcome

Learning.

## How the outcome is observed

- Attendees report the three DevTools findings aloud or in chat.
- The same build ID appears on both public URLs and under all three local servers.

## Starting state, reset, rehearsal

Starting state: repository at the session tag; both hosted deployments on that build; dependencies installed locally; no local servers running; `world.json` unmodified.

Reset: revert the `world.json` edit; delete the local build output.

Rehearsal checklist:

1. Fresh clone, install, dev, build, preview all work.
2. Both public URLs load from the corporate network and show the same build ID.
3. All three local servers start; header differences between servers and between hosts are noted.
4. The `world.json` edit hot-updates in the dev server.
5. Container image is already pulled.

## Fallback

- One host unreachable: compare the other host with a local server on the shared screen.
- A local server fails to start: use the remaining two.
- Everything fails: walk through the captured screenshots.

## Links

- Tasks: [T-020 to T-023](../tasks.md#phase-2-session-1-preparation)
- Design: [§ 4 Local runtime, build artifacts and delivery](../design.md#4-local-runtime-build-artifacts-and-delivery)
- Decisions: [D-02](../decisions.md#d-02), [D-08](../decisions.md#d-08), [D-19](../decisions.md#d-19)
- Next: [S02](02-localhost-to-public-url.md)
