# Tasks

**Status as of 2026-11-16: Phase 0 (AI tasks) and Phase 1 are done; the game awaits the organizer's play check. Nothing from Phase 2 onward has been started, run or verified.**

Owner **AI** means an implementation AI session does the work. Owner **Organizer** means a human action is required (accounts, rehearsal, decisions), usually with AI help. **Game** marks AI-owned game deliverables, which humans do not review at source level.

Status values: `todo`, `in progress`, `done`, `blocked`. When a task is done, record the date and what was verified.

Work phases in order. Within a phase, follow the dependency column.

## Phase 0: Repository bootstrap

| ID | Task | Owner | Depends on | Done when | Status |
| --- | --- | --- | --- | --- | --- |
| T-001 | Initialise git, add `.gitignore`, licence choice, first commit of the planning documents | AI | — | `git log` shows the planning commit; working tree clean | done 2026-11-16: `git init` on branch `main`, `.gitignore`, planning documents committed. **No licence file added**: the choice is the organizer's ([Q-08](decisions.md#q-08)). Not pushed. |
| T-002 | Create the public GitHub repository and push ([D-05](decisions.md#d-05)) | Organizer | T-001 | Repository is public and contains the documents | todo |
| T-003 | Root `package.json` with npm workspaces and the root scripts from [design.md § Root commands](design.md#root-commands), delegating to `apps/game` | AI | T-001 | `npm install` succeeds at the root; scripts exist | done 2026-11-16: `npm install` and all four root scripts run from a fresh clone |
| T-004 | Decide whether to try Superpowers for Phase 1 ([D-16](decisions.md#d-16)) | Organizer | — | Decision recorded | todo |
| T-005 | Confirm or change the `proposed` decisions that Phase 1 relies on: [D-08](decisions.md#d-08) to [D-11](decisions.md#d-11), [D-18](decisions.md#d-18) | Organizer | — | Statuses updated in decisions.md | todo |

T-004 and T-005 do not block Phase 1; implementation proceeds on the proposals unless they are changed.

## Phase 1: Game baseline (G0)

All **Game**, owner **AI**. Specification: [game-roadmap.md § G0](game-roadmap.md#g0-playable-baseline) and [design.md § 3–5](design.md#3-selected-game-technology). Acceptance criteria numbers refer to G0.

| ID | Task | Depends on | Done when | Status |
| --- | --- | --- | --- | --- |
| T-010 | Scaffold `apps/game` with the selected technology; dev, build, preview commands work; empty scene renders | T-003 | A lit ground plane renders from dev and from the built output | done 2026-11-16: world renders from `npm run dev` and from `dist/` |
| T-011 | Runtime data loading: `config.json`, `version.json` generated at build, `world.json` with a documented schema | T-010 | Criteria 11 and 12 pass by hand | done 2026-11-16: automated instead of by hand; see record below |
| T-012 | Player controller: first-person look, walk, jump, gravity, collision, respawn | T-010 | Criteria 3 and 4 pass on a test scene with a wall, a step and a boundary | done 2026-11-16: verified on the real world, not a separate test scene |
| T-013 | World content from `world.json`: outdoor area with props and boundary; two-floor office building with doorway, stairs, rooms, furniture | T-011, T-012 | Criterion 2 passes; visuals are readable | done 2026-11-16: route test passes; screenshots of each room inspected by AI. No door (left to [G6](game-roadmap.md#g6-engagement-extras)) |
| T-014 | HUD: controls hint, build ID, diagnostics overlay showing position, frame rate, deployment label, config values, connection state placeholder | T-011 | Overlay toggles and shows correct values | done 2026-11-16: automated |
| T-015 | Test hook and automated acceptance tests against the built output ([D-11](decisions.md#d-11)) | T-012, T-013, T-014 | Criterion 13 passes; `npm test` is green from a fresh clone | done 2026-11-16: 21 tests pass in a fresh clone after `npm install` |
| T-016 | Delivery hardening and contract: relative asset URLs, sub-path serving, no third-party requests, transfer size, three-server check, Safari and Firefox check, `apps/game/README.md` | T-015 | Criteria 5 to 10 and 14 pass; results recorded here | done 2026-11-16 with gaps: real Safari, real Firefox and real mouse capture were not checked; see record below |

After T-016 the organizer plays the game and accepts or returns it. This is the only human check of the game.

### Phase 1 verification record

Run on 2026-11-16: macOS, Apple M4 Pro, Node 24.12, npm 11. Commands and interfaces: [apps/game/README.md](../apps/game/README.md).

| G0 criterion | Result | How it was verified |
| --- | --- | --- |
| 1 Loads and plays after a click | Pass, partly | `npm run dev` checked with a scripted headless Chromium: walking 0.7 s after the click. Automated on the build: keyboard walk and turn; mouse look with the captured state simulated. **Not verified:** the browser actually capturing the mouse on click, and a human using real Chrome. |
| 2 Spawn → upper floor → outside | Pass | Automated walk along the route and back; also into an upper-floor room |
| 3 Nothing can be walked through | Pass | Automated: ground (6 m drop), outer wall, window pane, inside corner, furniture, boundary side and corner, each while running and jumping |
| 4 Jumping | Pass | Automated: apex 0.5–1.3 m, lands; 6 s of jumping against a wall gains no height |
| 5 About 60 fps | Pass on this machine only | Steady 120 fps (display rate) at 1440 × 810, Chromium with the M4 Pro GPU, on the route into the building. 60 fps in software rendering. **Not verified** on an older or Intel MacBook. |
| 6 Safari and Firefox | Partly | The whole suite passes in Playwright's Firefox and WebKit builds (63 tests over three engines). **Not verified:** the real Safari and Firefox applications. |
| 7 Build output | Pass | Automated: file layout, content-hashed names, one separate `.wasm`, relative URLs only |
| 8 Three servers, root and sub-path | Pass | Automated: Vite preview (root), a plain Node file server (root and sub-path), Python `http.server` (root and sub-path) |
| 9 No third-party requests | Pass | Automated: every request URL is on the page's origin, on all three servers |
| 10 Under about 5 MB | Pass | 3.9 MB uncompressed for everything; about 1.4 MB with gzip per the build report. Compressed transfer was not measured on a real host. |
| 11 Edit JSON, reload, no rebuild | Pass | Automated: label, spawn, world name and an added solid object change after a reload; build ID stays the same |
| 12 Build ID | Pass | Automated: on-screen ID equals `version.json`; a second build produces a different ID |
| 13 `npm test` | Pass | 21 tests in Chromium, green in a fresh clone. Covers criteria 1–4 and 7–12. |
| 14 README | Pass | Every item of [design.md § Game operational surface](design.md#game-operational-surface) has a section |

Also verified: saving `world.json` under `npm run dev` reloads the connected browser (needed by [T-021](#phase-2-session-1-preparation)).

For the organizer's play check, in real Chrome, Safari and Firefox:

1. Click the game: the mouse is captured and moves the view; `Esc` releases it.
2. Walk into the building, up the stairs and back out.
3. Press `O`: the overlay shows about 60 fps or more.

Known limits:

- Python's `http.server` took about 35 s to start listening on this machine (it resolves its own host name first). Allow for that if it is used in [T-020](#phase-2-session-1-preparation).
- The player starts wherever `spawn` says without a collision check, so a spawn point inside an object leaves the player stuck in it.
- `npm test` needs port 4173 free.

## Phase 2: Session 1 preparation

Session: [S01](sessions/01-dev-server-and-build.md).

| ID | Task | Owner | Depends on | Done when | Status |
| --- | --- | --- | --- | --- | --- |
| T-020 | `infra/static/`: ready-to-run examples serving `dist/` with a zero-config static server and a container web server, with one command each | AI | T-016 | Both serve a playable game; header differences from the preview server are recorded in the session file | todo |
| T-021 | Attendee command sheet and the prepared `world.json` edit | AI | T-016 | Sheet exists under `docs/sessions/`; the edit hot-updates in dev | todo |
| T-022 | Answer [Q-01](decisions.md#q-01) and [Q-07](decisions.md#q-07): first date, room network constraints | Organizer | — | Recorded in decisions.md | todo |
| T-023 | Rehearse S01 on the room network; capture fallback screenshots; tag `session-01` | Organizer | T-020, T-021, T-022 | Rehearsal checklist in S01 is complete; S01 commands marked verified | todo |

## Phase 3: Session 2 preparation

Session: [S02](sessions/02-localhost-to-public-url.md).

| ID | Task | Owner | Depends on | Done when | Status |
| --- | --- | --- | --- | --- | --- |
| T-030 | Create the Cloudflare account; note whether a card was requested; choose Workers static assets or Pages from current documentation ([D-12](decisions.md#d-12)) | Organizer | — | Account exists; choice and references recorded | todo |
| T-031 | Deploy the built game to the chosen product by manual command; per-host `config.json` with a `deploymentLabel` | AI + Organizer | T-016, T-030 | Public URL serves a playable game with the right label | todo |
| T-032 | GitHub Actions workflow: build and deploy the game on push with a `paths` filter; token in repository secrets ([D-14](decisions.md#d-14)) | AI + Organizer | T-002, T-031 | A push touching `apps/game/**` deploys; a docs-only push does not | todo |
| T-033 | Install `cloudflared`; verify a Quick Tunnel to the local preview server, including `.wasm` loading | Organizer | T-016 | Game playable through the tunnel URL from another network | todo |
| T-034 | Command sheet for `dig`, `curl -sv`, `openssl s_client` with captured sample output | AI | T-031 | Sheet exists; output captured from the real deployment | todo |
| T-035 | Rehearse S02; tag `session-02` | Organizer | T-032, T-033, T-034 | Rehearsal checklist in S02 is complete | todo |

## Phase 4: Session 3 preparation

Session: [S03](sessions/03-caching-and-releases.md).

| ID | Task | Owner | Depends on | Done when | Status |
| --- | --- | --- | --- | --- | --- |
| T-040 | Explicit cache policy on the main deployment; record actual response headers for entry HTML, hashed assets and unhashed JSON | AI | T-031 | Headers verified with `curl -I` and written into S03 | todo |
| T-041 | Deploy the same build to GitHub Pages from the workflow; record its headers | AI | T-032 | Pages URL playable under its sub-path; headers recorded | todo |
| T-042 | Misconfigured deployment with long-lived caching on the entry HTML, redeployable under a fresh URL | AI | T-040 | A fresh browser profile stays on the old build after a release | todo |
| T-043 | Release branch with a visible `world.json` change; documented rollback procedure | AI | T-040 | Release and rollback both timed and recorded | todo |
| T-044 | Decide on [G1](game-roadmap.md#g1-new-version-notice); implement if wanted (**Game**); rehearse S03; tag `session-03` | Organizer + AI | T-041, T-042, T-043 | Rehearsal checklist in S03 is complete | todo |

## Later work (tentative)

Break these into detailed tasks when the session is scheduled. Each needs its session file refreshed first.

| ID | Work | For | Depends on | Blocking questions |
| --- | --- | --- | --- | --- |
| T-100 | Container image serving `dist/`, public container hosting, edge function generating `config.json`, comparison sheet | [S04](sessions/04-delivery-paths.md) | Phase 4 | [Q-03](decisions.md#q-03) |
| T-110 | `packages/shared` schemas; `apps/server` with Dockerfile, hosting, deploy workflow, reset command; **Game** [G2](game-roadmap.md#g2-lobby-and-chat) | [S05](sessions/05-first-backend.md) | Phase 3 | Node host confirmation ([D-12](decisions.md#d-12)) |
| T-120 | Position relay, latency injection; **Game** [G3](game-roadmap.md#g3-remote-players); second implementation on an existing framework | [S06](sessions/06-multiplayer-sync.md) | T-110 | [Q-04](decisions.md#q-04) |
| T-130 | Object schema and API, persistence, `apps/placer`, object reset; **Game** [G4](game-roadmap.md#g4-live-world-objects) | [S07](sessions/07-live-world-editing.md) | T-110 | [Q-05](decisions.md#q-05) |
| T-140 | Bot in `tools/`, switchable validation, rate limits and caps | [S08](sessions/08-abuse-and-validation.md) | T-130 | — |
| T-150 | Structured logs, metrics view, fault injection; optional **Game** [G5](game-roadmap.md#g5-client-diagnostics-reporting) | [S09](sessions/09-observability.md) | T-110 | Tool choice |
| T-160 | Email provider evaluation and integration | [S10](sessions/10-email-integration.md) | T-130 | [Q-06](decisions.md#q-06), [Q-02](decisions.md#q-02) |
