# S06: Multiplayer and data synchronisation

**Status:** tentative. Largest preparation item in the plan.

## Learning objective

Attendees can describe why keeping several clients in agreement is hard, what a naive approach gets wrong, and what an existing framework takes on in exchange for what.

## Prerequisites

- [S05](05-first-backend.md).

## Preparation

Effort: **XL**. Tasks: [Later work](../tasks.md#later-work-tentative).

- Server: naive position relay; each client sends its position, the server rebroadcasts.
- Game item [G3](../game-roadmap.md#g3-remote-players), including the smoothing and send-rate switches.
- A way to add artificial latency and packet delay on the server for the demonstration.
- A separate demonstration build or branch using the chosen existing solution ([Q-04](../decisions.md#q-04)). It does not need to be merged.
- A short comparison: lines of code, features gained, operating model.

Uncertainties:

- Which solution to showcase. Candidates: Colyseus (Node room framework with state sync), Cloudflare Durable Objects with PartyServer (stateful edge), Yjs (CRDT document sync; a better fit for [S07](07-live-world-editing.md) objects than for positions).
- Effort of the second implementation.
- Free-tier load: about 10 players at 10–20 messages per second is within the limits recorded in [decisions.md § References](../decisions.md#references), but must be measured.

## What attendees start with

The multiplayer game URL.

## Game changes

[G3](../game-roadmap.md#g3-remote-players).

## Relevant tools

`ws`, the chosen framework, DevTools WebSocket inspector.

## Agenda

| Time | Activity |
| --- | --- |
| 0–7 | Everyone plays together. |
| 7–17 | **Naive design.** One screen of server code. Message shape and rate in DevTools. |
| 17–27 | **Limits.** Lower the send rate, add latency: avatars jump. Turn on interpolation: smooth but late. Discuss trust (a client can claim any position), bandwidth growth with player count, late joiners. |
| 27–38 | **Existing solution.** What it provides: rooms, state schema, delta updates, reconnection. Show the same game on it. Integration effort and what it asks of hosting. |
| 38–45 | Demonstrated versus adopted: decide nothing today. Questions. |

## Explained, assembled, demonstrated

- Explained: update rate, interpolation, authority, state versus events.
- Demonstrated: degradation under latency, the smoothing switch, the framework version.

## Participant interaction

Play; toggle smoothing through a query parameter; watch their own outgoing messages; try to spot themselves lagging on a neighbour's screen.

## Intended outcome

Learning and tool awareness. Adoption is a separate later decision.

## How the outcome is observed

Attendees see the visible difference between modes and can name two things the framework handled that the naive server did not.

## Starting state, reset, rehearsal

Starting state: both server variants awake, no players, latency injection off.

Reset: restart servers; latency off.

Rehearsal checklist:

1. Ten simultaneous clients on the naive server.
2. Latency injection and smoothing switch have clear visible effects.
3. Framework variant reachable and playable.
4. Message volume measured against free-tier limits.

## Fallback

A recorded side-by-side video of the modes. Run both servers locally on the shared screen with several browser windows.

## Links

- Decisions: [D-13](../decisions.md#d-13), [Q-04](../decisions.md#q-04)
