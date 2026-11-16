# S10: An automated email integration

**Status:** tentative, lowest priority. Whether to run it is open ([Q-06](../decisions.md#q-06)).

## Learning objective

Attendees can explain how a system integrates with an external service through an API and webhooks, and what that adds: credentials, retries, failure handling, limits.

## Prerequisites

- [S07](07-live-world-editing.md).

## Preparation

Effort: **M**, uncertain. Tasks: [Later work](../tasks.md#later-work-tentative).

Two possible shapes; choose one:

- **Outbound:** a game event (for example an object placed on a marked spot) sends an email.
- **Inbound:** an email to a known address places an object in the world.

Needed: an email provider account, a server-side integration with the secret stored outside the repository, and a recipient allow-list so the demo cannot mail arbitrary addresses.

Uncertainties:

- Zero-cost providers usually require a verified sending domain, and inbound email requires a domain. There is no custom domain ([D-15](../decisions.md#d-15), [Q-02](../decisions.md#q-02)). This may block the session.
- Provider free-tier limits and card requirements are not yet checked.
- Corporate mail filters may delay or drop messages during the session.

## What attendees start with

The running game and placer.

## Game changes

None. The integration lives in the server.

## Relevant tools

An email API provider, webhooks, a request inspector for showing webhook payloads.

## Agenda

| Time | Activity |
| --- | --- |
| 0–5 | Trigger the integration once; an email arrives or an object appears. |
| 5–18 | Design: API call or webhook, where the secret lives, what happens when the provider is slow or down. |
| 18–35 | Attendees trigger it. Inspect the provider's delivery log and the webhook payload. Force a failure and watch the retry. |
| 35–45 | Limits, abuse potential, questions. |

## Explained, assembled, demonstrated

- Explained: outbound API versus inbound webhook; secrets; idempotency and retries.
- Configured live: possibly the webhook URL.

## Participant interaction

Trigger the integration; read the provider log.

## Intended outcome

Functionality and tool awareness.

## How the outcome is observed

Emails arrive, or emailed objects appear in the world; the provider log matches.

## Starting state, reset, rehearsal

Starting state: integration enabled; allow-list set; provider quota available.

Reset: disable the integration after the session.

Rehearsal checklist:

1. End-to-end trigger works to a corporate mailbox.
2. Forced failure and retry behave as described.
3. Quota is sufficient for the room.

## Fallback

Show the provider's delivery log and a captured webhook payload from rehearsal.

## Links

- Decisions: [Q-06](../decisions.md#q-06), [Q-02](../decisions.md#q-02)
