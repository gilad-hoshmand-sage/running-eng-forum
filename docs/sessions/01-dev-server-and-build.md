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
- How the two hosts differ from each other on compression and cache headers; record once they are deployed. Local-server differences are recorded in § Organizer runbook.

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

## Organizer runbook

Verified locally on 2026-11-16 (macOS, Chromium). GitHub Pages is deployed and its headers are recorded below; the Cloudflare deployment does not exist yet, so host-to-host differences are still to be recorded.

Attendee handout: [01-command-sheet.md](01-command-sheet.md). Server details: [infra/static/README.md](../../infra/static/README.md).

**The live edit.** With `npm run dev` running, in `apps/game/public/world.json` change the `buildingWall` material's `color` from `#e9dfc8` to `#d9534f` and save. The whole office turns red; the browser reloaded 0.5 s after the save in testing. Undo with `git checkout apps/game/public/world.json`.

**Three local servers.** After `npm run build`, start each in its own terminal before the session: `npm run preview` (4173), `npm run serve:python` (8081), `npm run serve:nginx` (8082). All three served a playable game with the same build ID.

Observed response headers, requested with `Accept-Encoding: gzip, br`:

| | Vite preview | Python `http.server` | nginx container |
| --- | --- | --- | --- |
| `Server` header | none | `SimpleHTTP Python/3.x` | `nginx/1.29.x` |
| HTTP version | 1.1 | 1.0 | 1.1 |
| Compression of HTML, JS, JSON | gzip | none | gzip |
| Compression of `.wasm` | none (3.08 MB sent) | none (3.08 MB) | gzip (1.31 MB) |
| `Cache-Control` | `no-cache` on everything | none | none |
| `ETag` | yes | no | yes |
| `Last-Modified` | assets only | yes | yes |
| JS content type | `text/javascript` | `text/javascript` | `application/javascript` |
| `.wasm` content type | `application/wasm` | `application/wasm` | `application/wasm` |
| Unknown path | `200` with the entry page | `404` | `404` |

Talking points from the table:

- Compression is a server choice: the same `.wasm` file is 3.08 MB from two servers and 1.31 MB from nginx, because [nginx.conf](../../infra/static/nginx.conf) lists `application/wasm`.
- None of the three sets a useful cache policy for hashed files. That is next-but-one month's topic ([S03](03-caching-and-releases.md)).
- The preview server answers unknown paths with the entry page, a convenience for single-page apps that a plain file server does not have.
- All three send the correct `.wasm` content type, so there is no difference to show there.

**Public host: GitHub Pages.** https://gilad-hoshmand-sage.github.io/running-eng-forum/ (label `github-pages`). Observed 2026-11-16 with `curl -I` and `Accept-Encoding: gzip, br`:

| | GitHub Pages |
| --- | --- |
| `Server` header | `GitHub.com`, plus `Via: 1.1 varnish` and `X-Cache` (a CDN in front) |
| HTTP version | 2 |
| Compression of HTML, JS | gzip |
| Compression of `.wasm` | gzip (1.18 MB) |
| Compression of `config.json` (61 bytes) | none |
| `Cache-Control` | `max-age=600` on everything, hashed or not |
| `ETag`, `Last-Modified` | yes |
| JS content type | `application/javascript` |
| `.wasm` content type | `application/wasm` |
| Unknown path | `404` with GitHub's own page |
| Other | `Access-Control-Allow-Origin: *` |

- Ten minutes of caching on every file, including `config.json` and the entry page, cannot be changed on this host. That is the contrast for [S03](03-caching-and-releases.md).
- The URL must keep its trailing slash.

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

- Handout: [01-command-sheet.md](01-command-sheet.md)
- Tasks: [T-020 to T-023](../tasks.md#phase-2-session-1-preparation)
- Design: [§ 4 Local runtime, build artifacts and delivery](../design.md#4-local-runtime-build-artifacts-and-delivery)
- Decisions: [D-02](../decisions.md#d-02), [D-08](../decisions.md#d-08), [D-19](../decisions.md#d-19)
- Next: [S02](02-localhost-to-public-url.md)
