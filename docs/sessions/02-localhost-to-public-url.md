# S02: From localhost to a public URL

**Status:** detailed proposal. Commands are proposed, not verified.

## Learning objective

Attendees can trace a request from a typed URL to the bytes of the game, naming the role of DNS, TLS, HTTP and the host, and can say where the bytes are stored in two different arrangements.

## Prerequisites

- [S01](01-dev-server-and-build.md), or its recap: the build is a directory of static files.

## Preparation

Effort: **M**. Tasks: [Phase 3](../tasks.md#phase-3-session-2-preparation).

- Cloudflare account; the game deployed as a static site with a stable URL.
- GitHub Actions workflow that builds and deploys the game on push.
- `cloudflared` installed; Quick Tunnel rehearsed against the local preview server.
- A command sheet: `dig`, `curl -sv`, `openssl s_client`.
- Captured output of each command and a saved network capture as fallback.

Uncertainties:

- Whether Cloudflare sign-up asks for a payment card ([D-04](../decisions.md#d-04)); fall back to GitHub Pages if it does.
- Workers static assets versus Pages as the Cloudflare product; decide during [T-030](../tasks.md#phase-3-session-2-preparation).
- Whether the forum network allows outbound tunnels ([Q-07](../decisions.md#q-07)).
- Without a custom domain, DNS is observed on provider hostnames only ([Q-02](../decisions.md#q-02)).

## What attendees start with

- A browser with DevTools, a terminal, and optionally a phone on mobile data.
- The URLs, shared when each step starts.

## Game changes

None. Uses the build ID and `deploymentLabel` from G0.

## Relevant tools

Cloudflare Quick Tunnel, a managed static host, GitHub Actions, `dig`, `curl`, `openssl`, the browser's certificate viewer.

## Agenda

| Time | Activity |
| --- | --- |
| 0–5 | Recap S01. Goal for today: someone outside this room loads the game. |
| 5–15 | **Step 1: tunnel.** Start the local preview server and a Quick Tunnel. Attendees open the public URL, including on phones. Show their requests arriving in the laptop's server log. Stop the local server: the site is gone. Draw the path: name, Cloudflare edge, tunnel, laptop. |
| 15–30 | **Step 2: managed static host.** Open the hosted URL. Together run `dig` (what the name resolves to), `curl -sv` (connection, TLS handshake, certificate, protocol, response headers), and read the certificate in the browser. Close the laptop lid: the site still works. Explain where the files now live and which machine answered. |
| 30–38 | **How it got there.** Walk through the deploy workflow and one run log: checkout, install, build, upload. The uploaded directory is the `dist/` from S01. |
| 38–45 | Side-by-side comparison of the two arrangements. Questions. |

## Explained, assembled, demonstrated

- Explained: name resolution, TLS termination, what a CDN edge is, who operates what in each arrangement.
- Demonstrated: tunnel, hosted site, a deploy run.
- Assembled: the tunnel is started live. The hosted deployment already exists.

## Participant interaction

- Open both URLs; play.
- Run the three commands and read out: the certificate issuer, the HTTP version, and the edge location identifier in the response headers.
- Spot their own request in the laptop log during step 1.

## Intended outcome

Learning, plus functionality: the game has a permanent public URL.

## How the outcome is observed

- The game loads on a phone using mobile data.
- With the laptop closed, the hosted URL still serves and the tunnel URL does not.
- Attendees report different edge locations or the same one, and can say why.

## Starting state, reset, rehearsal

Starting state: hosted deployment live at the session tag; local preview server and tunnel stopped; last workflow run green.

Reset: none. Quick Tunnel URLs are disposable.

Rehearsal checklist:

1. Hosted URL loads from a network other than home or office.
2. Tunnel starts and serves the game, including the `.wasm` file.
3. `dig`, `curl -sv` and `openssl` output matches the command sheet.
4. A trivial push triggers a successful deploy; note how long it takes.
5. Fallback captures are current.

## Fallback

- Tunnel blocked or failing: show the captured log and diagram; spend the time on step 2.
- Hosted site unreachable: use the GitHub Pages deployment if it exists, otherwise the captured command output.
- Actions unavailable: read a previous run log.

## Links

- Tasks: [T-030 to T-035](../tasks.md#phase-3-session-2-preparation)
- Design: [§ Delivery arrangements](../design.md#delivery-arrangements), [§ 6 Build and deployment](../design.md#6-build-and-deployment)
- Decisions: [D-12](../decisions.md#d-12), [D-14](../decisions.md#d-14), [D-15](../decisions.md#d-15)
- Next: [S03](03-caching-and-releases.md)
