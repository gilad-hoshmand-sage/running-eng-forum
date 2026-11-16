# S05: The first backend: lobby and chat

**Status:** tentative.

## Learning objective

Attendees can explain what changes when an application gains shared state: a long-running process, a persistent connection, a second deployable, and new failure modes.

## Prerequisites

- [S02](02-localhost-to-public-url.md).

## Preparation

Effort: **L**. Tasks: [Later work](../tasks.md#later-work-tentative).

- `packages/shared`: message schemas for join, leave, presence and chat.
- `apps/server`: a deliberately small Node + TypeScript WebSocket server holding state in memory, with a Dockerfile.
- Server hosted at a public URL; its own deploy workflow with a path filter.
- Game item [G2](../game-roadmap.md#g2-lobby-and-chat).
- A reset command that clears server state.

Uncertainties:

- Node hosting at zero cost: sleep and cold-start behaviour, WebSocket idle timeouts ([D-12](../decisions.md#d-12)).
- There is no live substitute for the hosted server ([D-19](../decisions.md#d-19)); a second cloud deployment of the server may be worth keeping as a spare.

## What attendees start with

The game URL with lobby enabled. The server source is small enough to show on one screen.

## Game changes

[G2](../game-roadmap.md#g2-lobby-and-chat): name entry, connection status, chat panel, presence list.

## Relevant tools

`ws`, DevTools WebSocket frame inspector, the host's log viewer.

## Agenda

| Time | Activity |
| --- | --- |
| 0–5 | Everyone joins the lobby and chats. Until today nothing was shared. What had to be added? |
| 5–15 | **Design.** Static host plus server diagram. Why HTTP request/response is not enough; what a WebSocket is. Read the server in one screen. |
| 15–27 | **Observe.** Attendees open the WebSocket in DevTools and read frames. Server logs show joins and messages. The game finds the server through `config.json`. |
| 27–38 | **Break it.** Restart the server: state is gone, clients reconnect. Deploy a server change without touching the game. Show the cold start if the host sleeps. |
| 38–45 | What this adds to operate. Questions. |

## Explained, assembled, demonstrated

- Explained: stateful process versus static files; connection lifecycle; two deployables from one repository.
- Configured live: pointing a game deployment at the server by changing `config.json`.
- Demonstrated: restart, state loss, reconnect, independent deploy.

## Participant interaction

Join, chat, inspect frames, watch what happens to their client when the server restarts.

## Intended outcome

Learning and functionality: the backend stays.

## How the outcome is observed

Messages from one attendee appear on everyone's screen; after the restart the presence list empties and refills.

## Starting state, reset, rehearsal

Starting state: server deployed and awake, no connected clients, empty state.

Reset: restart the server or run the reset command.

Rehearsal checklist:

1. Ten browser tabs join and chat.
2. Restart and reconnect behave as described.
3. A server-only push deploys only the server.
4. The shared-screen fallback (local server, two browser windows) works.

## Fallback

If the hosted server fails, switch `serverUrl` to a spare cloud deployment if one exists; otherwise demonstrate on the shared screen with a local server and two browser windows.

## Links

- Design: [§ Tentative: with a backend](../design.md#tentative-with-a-backend), [§ Tentative: backend interfaces](../design.md#tentative-backend-interfaces)
- Decisions: [D-13](../decisions.md#d-13)
