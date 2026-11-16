# S07: Changing a live world

**Status:** tentative.

## Learning objective

Attendees can distinguish deploying a new application version from changing live content or state, and can follow a piece of data from a web form to every connected game.

## Prerequisites

- [S05](05-first-backend.md). [S03](03-caching-and-releases.md) is useful for the contrast.

## Preparation

Effort: **L**. Tasks: [Later work](../tasks.md#later-work-tentative).

- Shared object schema in `packages/shared`, derived from the `world.json` schema.
- Server: HTTP API to create, list and delete objects; broadcast of changes to connected games; reset command.
- `apps/placer`: a small web UI built from prepared components (object picker, position input or top-down map, submit).
- Game item [G4](../game-roadmap.md#g4-live-world-objects).
- A persistence choice ([Q-05](../decisions.md#q-05)).

Uncertainties:

- Persistence on a free host whose filesystem is not durable.
- How much of the placer UI to connect live versus pre-assemble.

## What attendees start with

The game URL and the placer URL. Prepared UI components and a running API.

## Game changes

[G4](../game-roadmap.md#g4-live-world-objects).

## Relevant tools

The server API, DevTools, `curl` for direct API calls.

## Agenda

| Time | Activity |
| --- | --- |
| 0–5 | Recap S03: a release changes code for everyone on reload. Today: change the world with no release. |
| 5–15 | **Design.** Data flow: form, API, server state, broadcast, game. The object schema as the contract shared by three components. |
| 15–25 | **Connect.** Wire the prepared form component to the API on screen and place the first object. |
| 25–38 | **Use it.** Attendees place objects and watch them appear in each other's games. Call the API with `curl`. Restart the server: what survives depends on persistence. Check the build ID: unchanged. |
| 38–45 | Content versus code. What an open write API invites; teaser for S08. |

## Explained, assembled, demonstrated

- Explained: content/state versus application version; a shared contract.
- Assembled live: the form-to-API connection.
- Demonstrated: live placement, persistence across restart.

## Participant interaction

Place objects from the web UI; build something together in the world.

## Intended outcome

Learning and functionality.

## How the outcome is observed

Objects appear in all games within a second; the build ID never changes during the session.

## Starting state, reset, rehearsal

Starting state: empty object list; placer deployed with the form not yet wired (on a prepared branch) or wired but hidden.

Reset: run the object reset command.

Rehearsal checklist:

1. Place, list and delete through UI and `curl`.
2. Several hundred objects remain playable.
3. Reset clears every client.
4. Persistence behaves as the session claims.

## Fallback

Use the pre-wired placer. If the hosted server fails, run it locally behind a tunnel.

## Links

- Design: [§ World data](../design.md#world-data), [§ Tentative: backend interfaces](../design.md#tentative-backend-interfaces)
- Decisions: [D-10](../decisions.md#d-10), [Q-05](../decisions.md#q-05)
- Next: [S08](08-abuse-and-validation.md)
