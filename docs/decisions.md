# Decisions, assumptions and open questions

Last updated 2026-11-16.

Status values:

- **requirement**: stated by the organizer in the project brief.
- **agreed**: decided with the organizer during planning.
- **delegated**: chosen by AI under an explicit delegation.
- **proposed**: AI recommendation, not yet confirmed. Only the workspace tooling in D-06 remains in this state.
- **assumption**: taken as true without confirmation.
- **deferred**, **superseded**: as named.

## Summary

| ID | Topic | Status |
| --- | --- | --- |
| [D-01](#d-01) | Sessions are primary, game is supporting | requirement |
| [D-02](#d-02) | Two separate opening sessions | agreed |
| [D-03](#d-03) | Mixed participation | agreed |
| [D-04](#d-04) | Zero cost, card-free first | agreed |
| [D-05](#d-05) | Public GitHub repository | agreed |
| [D-06](#d-06) | One repository with npm workspaces | agreed (one repository); proposed (tooling) |
| [D-07](#d-07) | Game technology | delegated |
| [D-08](#d-08) | Static, client-only, portable build | agreed |
| [D-09](#d-09) | Runtime configuration file | agreed |
| [D-10](#d-10) | World defined as data | agreed |
| [D-11](#d-11) | Test hook and automated acceptance tests | agreed |
| [D-12](#d-12) | Hosting providers | agreed |
| [D-13](#d-13) | Backend stack | agreed; details set at S05 prep |
| [D-14](#d-14) | Deployment through GitHub Actions with path filters | agreed |
| [D-15](#d-15) | No custom domain | assumption |
| [D-16](#d-16) | Superpowers is optional | agreed |
| [D-17](#d-17) | Session lineup | agreed |
| [D-18](#d-18) | First-person camera | delegated |
| [D-19](#d-19) | Online only: no tunnels, no serving from the organizer's laptop | requirement |
| [D-20](#d-20) | MIT licence | agreed |

## Decisions

### D-01

**Sessions are primary; the game is supporting.** Status: requirement.
The game is an AI-developed black box. It changes only to support a learning objective, enable a demonstration, or add worthwhile engagement. Affects: all documents.

### D-02

**The opening topics are two sessions.** Status: agreed.
S01 covers the dev server and build output locally; S02 covers the path to a public URL. Alternative: one combined trace, rejected because each mechanism would get only a few minutes. Affects: [forum-plan.md](forum-plan.md), S01, S02.

### D-03

**Mixed participation.** Status: agreed.
Every session must work for an attendee who has only a browser with DevTools. Cloning and running locally is optional. Consequence under [D-19](#d-19): browser-only attendees use public URLs, so hosted deployments must exist before session 1. Affects: all session files.

### D-04

**Zero cost; card-free services first.** Status: agreed.
The organizer accepts a card on file but prefers to avoid it. Rule: design for services that need no card. Using a card-required free tier needs an explicit decision recorded here, with the reason. Affects: [design.md § Delivery arrangements](design.md#delivery-arrangements).

### D-05

**Public GitHub repository.** Status: agreed.
Consequences: attendees clone without invitations; no secrets in the repository; deploy tokens in GitHub Actions secrets; GitHub Pages is available. Affects: design.md § 2 and § 6.

### D-06

**One repository, npm workspaces.** Status: one repository is agreed (organizer preference and AI recommendation); npm workspaces without further monorepo tooling is proposed.
Rationale and growth path: [design.md § 2](design.md#2-repository-organization). Revisit only if a component needs separate access control or a host demands its own repository.

### D-07

**Game technology: TypeScript, Three.js, Rapier, Vite, Playwright.** Status: delegated.
Rationale and consequences: [design.md § 3](design.md#3-selected-game-technology). Considered: Babylon.js (more built in, larger download, less example material). The implementing AI may change internals but not the operational surface.

### D-08

**The game build is static, client-only and portable.** Status: agreed (2026-11-16).
Relative asset URLs, self-hosted assets, no third-party requests, no server logic. Required by S01–S04. Affects: design.md § 1, § 4; G0 criteria 7–10.

### D-09

**Runtime configuration through `config.json`.** Status: agreed (2026-11-16).
Alternative: build-time environment variables, rejected because one artifact must be deployable to several hosts with different settings. Affects: [design.md § 5](design.md#5-configuration-interfaces-and-data-flows).

### D-10

**The static world is defined in `world.json`.** Status: agreed (2026-11-16).
Enables visible changes without touching game code and seeds the object schema for S07. Cost: a schema to maintain. Affects: design.md § 5, G0, G4.

### D-11

**Test hook and automated acceptance tests.** Status: agreed (2026-11-16).
Because no human reads the game source, acceptance is automated against the built output through a small documented hook on `window`. The hook is visible to anyone in DevTools; that is acceptable for a demo. Affects: G0 criterion 13, T-015.

### D-12

**Hosting providers.** Status: agreed (2026-11-16). Card requirements still to be checked during T-030; a card request triggers D-04.
Cloudflare for static hosting and edge functions; GitHub Pages as the contrast host; Render free tier for containers and the Node server. No tunnels and no laptop-hosted fallback ([D-19](#d-19)). Table and alternatives: [design.md § Delivery arrangements](design.md#delivery-arrangements) and [§ 7](design.md#7-backend-and-infrastructure-alternatives). Card requirements for Cloudflare and Render were not confirmed from their documentation; check at sign-up.

### D-13

**Backend: Node, TypeScript, `ws`, JSON messages, in-memory state.** Status: agreed (2026-11-16). Message types and hosting details are set when S05 is prepared.
Deliberately minimal so the mechanism is visible. Affects: [design.md § Tentative: backend interfaces](design.md#tentative-backend-interfaces).

### D-14

**Deployment: GitHub Actions, one workflow per deployable, path filters, manual command as backup.** Status: agreed (2026-11-16).
Shows independent deployment from one repository. Affects: [design.md § 6](design.md#6-build-and-deployment).

### D-15

**No custom domain.** Status: assumption.
A domain costs money. Sessions use provider hostnames. Consequence: DNS is observed but not configured, and email integration may be blocked. See [Q-02](#q-02).

### D-16

**Superpowers is optional workflow tooling, not a project requirement.** Status: agreed (2026-11-16).
Evaluation: it is an MIT-licensed plugin of agent skills (brainstorm, plan, worktrees, test-driven development, subagent execution, review). Its test-first and review steps suit a black-box game that is accepted through tests. Its brainstorming and planning steps overlap with these documents and would reopen settled decisions unless told to treat `docs/` as the specification. Recommendation: optionally try it for Phase 1 with that instruction; keep nothing in the repository that depends on it.

### D-17

**Session lineup S01–S10.** Status: agreed (2026-11-16) as the working lineup.
See [forum-plan.md](forum-plan.md). S01–S03 are intended as planned; S04–S10 are candidates. S09 was added by AI.

### D-18

**First-person camera.** Status: delegated.
Simplest inside a building. Avatars for other players arrive with G3.

### D-19

**Online only.** Status: requirement (organizer, 2026-11-16).
Everything attendees use is served from proper cloud hosting at a public URL. No tunnels, no attendee access to the organizer's laptop, no improvised workarounds. Local commands are shown on the shared screen or run by attendees on their own machines. Consequences: Quick Tunnels are dropped from S02 and from every fallback; the two static deployments move ahead of S01; a failed hosted demonstration falls back to captures or a shared-screen local run, never to laptop hosting; hosted servers have no live substitute, so rehearsal and wake-up steps matter more. Supersedes Q-07. Affects: all session files, [design.md § Delivery arrangements](design.md#delivery-arrangements), tasks Phases 2–3.

### D-20

**MIT licence.** Status: agreed (2026-11-16). `LICENSE` at the repository root. Resolves Q-08.

## Open questions

| ID | Question | Blocks | Needed by |
| --- | --- | --- | --- |
| [Q-01](#q-01) | Date of the first session | Nothing; sets the schedule | T-022 |
| [Q-02](#q-02) | Would a custom domain be acceptable? | S10; deepens S02 | Before S02 prep ends |
| [Q-03](#q-03) | Use a card-required free tier for a real server? | Shape of S04 | S04 prep |
| [Q-04](#q-04) | Which synchronisation solution to showcase | T-120 | S06 prep |
| [Q-05](#q-05) | Persistence for placed objects | T-130 | S07 prep |
| [Q-06](#q-06) | Run the email session at all, and with which provider | T-160 | After S07 |
| [Q-07](#q-07) | Room network constraints | Resolved by [D-19](#d-19) | — |
| [Q-08](#q-08) | Licence for the public repository | Resolved by [D-20](#d-20) | — |

None blocks Phase 0 or Phase 1.

### Q-01

First session date. Phases 0–2 must finish before it; G0 is the long item.

### Q-02

A domain is a small yearly cost, which breaks the zero-cost rule unless one already exists. With one, S02 could configure DNS records live and S10 becomes feasible.

### Q-03

A free virtual machine (for example Oracle Always Free) would let S04 show a server with SSH, a reverse proxy and certificates, but needs a card. Without it, Path A is a container on a free container host; a laptop behind a tunnel is ruled out by [D-19](#d-19). Recommendation: start card-free; revisit if S04 feels thin.

### Q-04

Candidates and fit: [S06 § Preparation](sessions/06-multiplayer-sync.md#preparation). Recommendation to evaluate first: Colyseus, because it is Node-based and maps directly onto the naive server it replaces.

### Q-05

Options: memory only, a JSON file, SQLite, a managed free database, Durable Object storage. Constrained by the Node host's non-durable filesystem.

### Q-06

Lowest-priority candidate. Depends on Q-02 and on a provider check.

### Q-07

Resolved 2026-11-16 by [D-19](#d-19): no laptop access and no tunnels. Remaining check, done in rehearsal: the corporate network and VPN reach the hosting domains and do not alter DNS or TLS in ways that change what attendees observe.

### Q-08

Resolved 2026-11-16 by [D-20](#d-20): MIT. The dependencies are MIT or Apache-2.0, which constrain nothing here. Raised by T-001.

## References

Checked on 2026-11-16 unless marked otherwise.

| Topic | Finding | Source |
| --- | --- | --- |
| Cloudflare Workers free plan | 100,000 requests per day; 10 ms CPU per invocation; static asset requests free and unlimited | https://developers.cloudflare.com/workers/platform/pricing/ |
| Cloudflare Durable Objects free plan | Available with SQLite backend only; 100,000 requests per day; 13,000 GB-s per day; 5 GB storage; incoming WebSocket messages billed 20:1; operations fail when a limit is exceeded | https://developers.cloudflare.com/durable-objects/platform/pricing/ |
| GitHub Pages | 1 GB site; 100 GB per month soft bandwidth limit; 10 builds per hour soft limit, not applied to custom Actions workflows | https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits |
| Render free web services | Sleep after 15 minutes without traffic; about one minute to wake; 750 instance hours per month; no persistent disk; may restart at any time | https://render.com/docs/free |
| Superpowers | Plugin of composable agent skills; MIT | https://github.com/obra/superpowers |
| Game dependencies | Three.js 0.187.0 MIT; `@dimforge/rapier3d` 0.21.0 Apache-2.0; Vite 8.3.8 MIT; `vite-plugin-wasm` 3.6.0 MIT; TypeScript 7.0.2 Apache-2.0; `@playwright/test` 1.65.1 Apache-2.0 | npm registry metadata (`npm view <package> version license`) |

Not verified this session; confirm before relying on them:

- Whether Cloudflare and Render ask for a payment card at sign-up.
- Docker support on Render free instances.
- GitHub Pages lack of custom header control. Its default headers were observed on 2026-11-16: [S01 § Organizer runbook](sessions/01-dev-server-and-build.md#organizer-runbook).
- GitHub Actions being free for public repositories on standard runners.

Expected load against limits: 30 attendees loading a build of a few megabytes is negligible for every static host listed. Ten players sending 10–20 position messages per second for 45 minutes is roughly 270,000–540,000 messages; under Durable Objects billing that is about 13,500–27,000 requests, within the daily limit. Measure before S06.
