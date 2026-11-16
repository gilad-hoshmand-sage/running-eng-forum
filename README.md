# Engineering Forum + Demo Game

A monthly engineering forum about how software is built, served, deployed and operated, using a small browser 3D game as the shared demo application.

**Status:** the game baseline is built and tested; session preparation has not started. See [docs/tasks.md](docs/tasks.md).

To run the game: `npm install`, then `npm run dev`. Details: [apps/game/README.md](apps/game/README.md).

## Purpose

- **The forum sessions are the product.** The game is a supporting tool.
- Audience: developers, operations engineers, QA engineers and other technical people.
- A session succeeds when attendees understand a mechanism, discover a tool, or want to investigate further. It does not need to add a permanent feature.

## Format

- About 45 minutes, about once a month, up to ~30 attendees, fewer than ~10 simultaneous players.
- The organizer prepares between sessions with AI. Attendees explain, connect, observe and play; they do not live-code.
- Attendees can always follow in a browser with DevTools. Cloning the repo and running commands is optional.

## Initial scope

- A local, single-player 3D browser game: grassy outdoor area, one enterable two-floor office building, walking, jumping, gravity, collision.
- Sessions 1–3: the dev server and build output, the path to a public URL, caching and releases.

## Constraints

- Zero cost. Services that need no payment card are preferred; a card-required free tier needs an explicit decision.
- The game is an AI-developed black box. Humans use its commands, artifacts, configuration and interfaces, not its source.
- One public GitHub repository, MIT licensed.
- Everything attendees use is hosted online at public URLs. No tunnels and no serving from the organizer's laptop.
- No gore, blood or health mechanics.

## Documentation

| Document | Contents |
| --- | --- |
| [docs/forum-plan.md](docs/forum-plan.md) | Primary roadmap: learning objectives, session sequence, preparation |
| [docs/sessions/](docs/sessions/) | One file per proposed session |
| [docs/design.md](docs/design.md) | Architecture, repository layout, delivery, interfaces, technology |
| [docs/game-roadmap.md](docs/game-roadmap.md) | Game baseline and conditional additions, with acceptance criteria |
| [docs/tasks.md](docs/tasks.md) | Ordered implementation and preparation tasks |
| [docs/decisions.md](docs/decisions.md) | Decisions, assumptions, open questions, references |
| [CLAUDE.md](CLAUDE.md) | Entry point and working rules for AI sessions |
