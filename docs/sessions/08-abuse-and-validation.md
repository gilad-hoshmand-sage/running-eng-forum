# S08: Spam, validation and rate limits

**Status:** tentative.

## Learning objective

Attendees can explain why an open write interface needs validation and limits at the server, and can describe a layered defence and what each layer does not cover.

## Prerequisites

- [S07](07-live-world-editing.md).

## Preparation

Effort: **M**. Tasks: [Later work](../tasks.md#later-work-tentative).

- `tools/` bot that floods the object API and sends malformed, oversized and out-of-bounds objects. It targets only this project's own server.
- A server build without protection and one with it, switchable by configuration: schema validation, bounds and size checks, per-client rate limit, total object cap.
- A fast reset.

Uncertainties:

- How to identify a client without accounts (address, token issued by the placer, session name) and how honest to be about its weakness.
- Whether shared office addresses make per-address limits misleading in the room.

## What attendees start with

The game and placer from S07.

## Game changes

None beyond G4.

## Relevant tools

A schema validation library (for example zod), a rate-limiting approach, server logs.

## Agenda

| Time | Activity |
| --- | --- |
| 0–5 | Everyone places a few objects. |
| 5–12 | **Attack.** Start the bot. The world fills with junk; clients slow down. Look at what the bot sends. |
| 12–22 | **Why the UI did not help.** Client-side checks are not a defence. Enumerate what the server accepted that it should not have. |
| 22–35 | **Fix in layers.** Enable validation, then limits, then caps, rerunning the bot after each. Read rejected requests in the logs. |
| 35–45 | What is still exposed. Where managed products (edge rate limiting, bot protection) fit. Questions. |

## Explained, assembled, demonstrated

- Explained: trust boundary, validation, rate limiting, quotas.
- Configured live: turning on each protection.
- Demonstrated: the bot before and after.

## Participant interaction

Keep placing objects during the attack and after each fix to see whether legitimate use still works; try to get an invalid object past the server by hand.

## Intended outcome

Learning and tool awareness; the protections stay enabled.

## How the outcome is observed

Rejection counts in the logs; the world stays usable under attack once protections are on.

## Starting state, reset, rehearsal

Starting state: protections off, empty object list, bot not running.

Reset: stop the bot, run the object reset, protections off.

Rehearsal checklist:

1. Bot visibly degrades the unprotected world without crashing the host.
2. Each protection has a visible effect on its own.
3. Reset completes in seconds.
4. Bot volume stays within free-tier limits.

## Fallback

Run server and bot locally. Show a recording of the unprotected attack.

## Links

- Game: [G4](../game-roadmap.md#g4-live-world-objects)
- Previous: [S07](07-live-world-editing.md)
