# S02: From localhost to a public URL

**Status:** detailed proposal, reworked for online-only delivery ([D-19](../decisions.md#d-19)). Commands are proposed, not verified.

## Learning objective

Attendees can trace a request from a typed URL to the bytes of the game, naming the role of DNS, TLS, HTTP and the host, and can explain how a push to the repository becomes files on a public host.

## Prerequisites

- [S01](01-dev-server-and-build.md), or its recap: the build is a directory of static files, and it is live on two hosts.

## Preparation

Effort: **M**. Tasks: [Phase 3](../tasks.md#phase-3-session-2-preparation).

- GitHub Actions workflow that builds and deploys the game to both hosts on push.
- A trivial, safe change ready to push live (for example a `deploymentLabel` or sign text).
- A command sheet: `dig`, `curl -sv`, `openssl s_client`.
- Captured output of each command for both hosts as fallback.

Uncertainties:

- Deploy duration; the live run must finish inside its agenda slot.
- Without a custom domain, DNS is observed on provider hostnames only ([Q-02](../decisions.md#q-02)).
- Whether the corporate network or VPN alters DNS answers or intercepts TLS; check in rehearsal, since it would change what attendees see.

## What attendees start with

- A browser with DevTools, a terminal, and optionally a phone on mobile data.
- The two public URLs from S01.

## Game changes

None. Uses the build ID and `deploymentLabel` from G0.

## Relevant tools

A managed static host on a CDN, GitHub Pages, GitHub Actions, `dig`, `curl`, `openssl`, the browser's certificate viewer.

## Agenda

| Time | Activity |
| --- | --- |
| 0–5 | Recap S01: a directory of files, live at two URLs. Today: what happens between typing the URL and the first byte, and how the files got there. |
| 5–20 | **Trace host A.** Together run `dig` (what the name resolves to), `curl -sv` (connection, TLS handshake, certificate, protocol, response headers), and read the certificate in the browser. Explain where the files live and which machine answered. |
| 20–28 | **Trace host B.** Same commands on the second URL. Different addresses, certificate, protocol details and headers for the same files. Who operates what in each case. |
| 28–40 | **How it got there.** Push the prepared change. Walk through the workflow while it runs: checkout, install, build, upload to each host. The uploaded directory is the `dist/` from S01. Attendees reload and see the new build ID. |
| 40–45 | Side-by-side comparison of the two hosts. Questions. |

## Explained, assembled, demonstrated

- Explained: name resolution, TLS termination, what a CDN edge is, what a deploy pipeline does.
- Demonstrated: the request trace on two hosts, a live deploy run.
- Assembled: nothing live; the workflow is read, not written.

## Participant interaction

- Run the three commands against both URLs and read out: the certificate issuer, the HTTP version, and the edge location identifier in the response headers.
- Load the game on a phone using mobile data.
- Watch the workflow run in the public repository and confirm the new build ID.

## Intended outcome

Learning. The public URLs and the deploy pipeline stay.

## How the outcome is observed

- Attendees report different edge locations or the same one, and can say why.
- Attendees name one difference between the hosts from their own command output.
- The build ID changes on both URLs after the push, with no manual step.

## Starting state, reset, rehearsal

Starting state: both deployments live at the session tag; last workflow run green; the prepared change unpushed.

Reset: revert the pushed change.

Rehearsal checklist:

1. Both URLs load from the corporate network and from mobile data.
2. `dig`, `curl -sv` and `openssl` output matches the command sheet on the corporate network.
3. A trivial push deploys to both hosts; duration noted.
4. Fallback captures are current.

## Fallback

- One host unreachable: trace the other and show captures for the missing one.
- Deploy slow or Actions unavailable: read a previous run log and compare two already-deployed build IDs.

## Links

- Tasks: [T-032 to T-035](../tasks.md#phase-3-session-2-preparation)
- Design: [§ Delivery arrangements](../design.md#delivery-arrangements), [§ 6 Build and deployment](../design.md#6-build-and-deployment)
- Decisions: [D-12](../decisions.md#d-12), [D-14](../decisions.md#d-14), [D-15](../decisions.md#d-15), [D-19](../decisions.md#d-19)
- Next: [S03](03-caching-and-releases.md)
