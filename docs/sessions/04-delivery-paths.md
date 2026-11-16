# S04: Three ways to serve the same build

**Status:** tentative. May need two sessions.

## Learning objective

Attendees can compare three delivery arrangements for one artifact by request path, where bytes live, where code runs, how updates appear, and who is responsible for what.

## Prerequisites

- [S02](02-localhost-to-public-url.md) and [S03](03-caching-and-releases.md).

## Preparation

Effort: **L**. Tasks: [Later work](../tasks.md#later-work-tentative).

- **Path A, container:** a web server in a Docker image serving `dist/`, running at a public URL, with its access log viewable.
- **Path B, managed static + CDN:** the existing Cloudflare deployment.
- **Path C, edge function:** a small function in front of the static files that does something worth doing at request time. Proposed: generate `config.json` per request (deployment label plus the edge location that answered), shown in the game's overlay.
- A comparison sheet to fill in live.

Uncertainties:

- Public hosting for the container at zero cost without a card ([Q-03](../decisions.md#q-03)). Fallback is the container on the laptop behind a tunnel.
- Free container hosts sleep when idle; the cold start must be planned for or used as a teaching point.
- Whether three paths fit in 45 minutes. If not, split: A versus B, then C.

## What attendees start with

Three URLs serving the same build ID, and the comparison sheet.

## Game changes

None. Path C uses `config.json` keys the overlay already displays; if a new key is needed it is a small G0 follow-up.

## Relevant tools

Docker, a stock web server (nginx or Caddy), a container host, Cloudflare Workers, `curl`, DevTools, host log viewers.

## Agenda

| Time | Activity |
| --- | --- |
| 0–5 | Three URLs, one game. What could be different? |
| 5–17 | **Path A.** The Dockerfile and server config in a few lines. Attendees load it; their requests appear in the access log. Who patches, restarts and scales this? |
| 17–27 | **Path B.** Recap as contrast: no server to operate, bytes at the edge, cache status in headers. |
| 27–38 | **Path C.** Read the function. Attendees see the edge location in their overlay. Function logs live. Where code runs and what it costs in limits. Note that CDN, origin and edge function can sit in one request path. |
| 38–45 | Complete the comparison sheet together. When is each arrangement the right one? |

## Explained, assembled, demonstrated

- Explained: origin, CDN and edge function roles and combinations.
- Demonstrated: all three paths, with logs.
- Assembled: nothing live; deployments are prepared.

## Participant interaction

Load each URL, compare headers and timings, find their own request in the container log, read their edge location from the overlay.

## Intended outcome

Learning and tool awareness. Nothing needs to be adopted permanently.

## How the outcome is observed

The comparison sheet is filled from evidence attendees gathered: headers, logs, overlay values.

## Starting state, reset, rehearsal

Starting state: all three deployments on the same build ID; container service awake.

Reset: none.

Rehearsal checklist:

1. All three URLs show the same build ID.
2. Container woken ten minutes before; logs visible.
3. Function logs stream.
4. Local container plus tunnel fallback works.

## Fallback

Run Path A locally behind a tunnel. If Path C fails, read the function and show captured output.

## Links

- Design: [§ Delivery arrangements](../design.md#delivery-arrangements)
- Decisions: [D-12](../decisions.md#d-12), [Q-03](../decisions.md#q-03)
