# S09: Seeing what the system is doing

**Status:** tentative. Not in the original candidate list; proposed because of the operations focus.

## Learning objective

Attendees can say which signals (logs, metrics, client reports) answer which question about a running system, and can use them to find the cause of a prepared fault.

## Prerequisites

- [S05](05-first-backend.md).

## Preparation

Effort: **M**. Tasks: [Later work](../tasks.md#later-work-tentative).

- Structured server logs with a connection identifier.
- A small metrics endpoint or page: connected players, messages per second, object count, errors.
- Optional game item [G5](../game-roadmap.md#g5-client-diagnostics-reporting).
- Two or three injectable faults, for example a slow handler, dropped messages for one client, a bad release.

Uncertainties:

- Which existing tool to show without cost or heavy setup. Candidates: host log viewers, OpenTelemetry with a local collector, a free error-tracking tier. Check card requirements first.

## What attendees start with

The game URL and a read-only view of logs and metrics.

## Game changes

[G5](../game-roadmap.md#g5-client-diagnostics-reporting), optional.

## Relevant tools

Host log viewer, structured logging, a metrics view, optionally an existing observability tool.

## Agenda

| Time | Activity |
| --- | --- |
| 0–5 | Everyone plays. Something is wrong; nobody is told what. |
| 5–15 | Which signals exist and what each can answer. |
| 15–33 | **Investigate.** Two prepared faults, one after another. Attendees propose where to look; the organizer drives. |
| 33–40 | What an existing tool adds over the homemade view. |
| 40–45 | Questions. |

## Explained, assembled, demonstrated

- Explained: logs versus metrics versus client-side reports; correlation identifiers.
- Demonstrated: diagnosing injected faults.

## Participant interaction

Play to generate signals; suggest hypotheses; find their own connection in the logs.

## Intended outcome

Learning and tool awareness.

## How the outcome is observed

The group identifies each fault from the signals, not from being told.

## Starting state, reset, rehearsal

Starting state: all faults off.

Reset: faults off; restart server.

Rehearsal checklist:

1. Each fault is visible in at least one signal.
2. Faults switch on and off without a deploy.
3. Log view is readable on a projector.

## Fallback

Walk through captured logs from rehearsal.

## Links

- Design: [§ Tentative: with a backend](../design.md#tentative-with-a-backend)
