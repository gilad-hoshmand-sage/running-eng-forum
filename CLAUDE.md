# AI working instructions

Read [README.md](README.md) first, then the document for your task:

| Task | Read |
| --- | --- |
| Any implementation work | [docs/tasks.md](docs/tasks.md), then the task's linked documents |
| Game changes | [docs/game-roadmap.md](docs/game-roadmap.md), [docs/design.md](docs/design.md) § Game operational surface |
| Servers, hosting, CI | [docs/design.md](docs/design.md), [docs/decisions.md](docs/decisions.md) |
| Preparing a session | The file in [docs/sessions/](docs/sessions/) and [docs/forum-plan.md](docs/forum-plan.md) |

## Rules

- The forum sessions are the product. Do not add game features that no session or roadmap item asks for.
- The game is a black box to humans. Anything a human needs (commands, config, interfaces, verification) goes in `apps/game/README.md`, never "read the source".
- Each topic has one authoritative document. Link to it; do not copy it.
- Decisions carry a status in [docs/decisions.md](docs/decisions.md). Do not treat `proposed` items as agreed, and do not promote them without the organizer's confirmation.
- When a decision, interface or task changes, update every document that references it in the same change.
- Reference documents by path, section heading and ID (`D-07`, `Q-02`, `T-010`, `G0`, `S03`). No line numbers.
- Mark commands and configuration as *proposed* until they have been run; record verification in [docs/tasks.md](docs/tasks.md).
- Zero cost. Check free-tier limits and payment-card requirements against current official sources before adopting a service, and record the reference in [docs/decisions.md](docs/decisions.md) § References.
- The repository is public. Never commit secrets; deployment tokens live in GitHub Actions secrets.
- Human-facing text is short and scannable. AI-facing context is complete without filler.
