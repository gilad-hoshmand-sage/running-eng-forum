# Local static servers

Three unrelated servers over the same directory, `apps/game/dist/`, for the shared screen in [S01](../../docs/sessions/01-dev-server-and-build.md). They show that the build is only files. They are local demonstrations, not hosting ([D-19](../../docs/decisions.md#d-19)).

Run from the repository root, after `npm run build`. Verified 2026-11-16.

| Command | Server | URL | Stop |
| --- | --- | --- | --- |
| `npm run preview` | Vite's preview server (Node) | http://localhost:4173/ | Ctrl-C |
| `npm run serve:python` | Python's built-in `http.server` | http://localhost:8081/ | Ctrl-C |
| `npm run serve:nginx` | nginx in a Docker container | http://localhost:8082/ | Ctrl-C |

- `serve:nginx` needs Docker running. It uses `nginx:1.29-alpine`, mounts `dist/` read-only, and prints the access log to the terminal. Its whole configuration is [nginx.conf](nginx.conf).
- `serve:python` needs only the Python that ships with macOS developer tools. It can take several seconds to start listening.
- All three listen on `localhost` only.
- The observed header differences are recorded in the S01 session file.
