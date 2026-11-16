# S03: Caching and shipping a new version

**Status:** detailed proposal. Header values and commands are proposed, not verified.

## Learning objective

Attendees can predict, from response headers and file naming, who will see a new version and when, and can name the usual way this goes wrong.

## Prerequisites

- [S02](02-localhost-to-public-url.md): the game is on a public URL with deploy on push.

## Preparation

Effort: **M**. Tasks: [Phase 4](../tasks.md#phase-4-session-3-preparation).

- Explicit cache headers on the main deployment: entry HTML and unhashed JSON revalidated every time; hashed assets cached long and immutable.
- A release branch with one obvious visible change (for example a different building colour and a sign).
- A second deployment with a deliberately wrong policy: long-lived caching on the entry HTML.
- The same build on GitHub Pages, as a host whose cache headers the site cannot set.
- A rehearsed rollback to the previous deployment.
- Optional: [G1](../game-roadmap.md#g1-new-version-notice).

Uncertainties:

- Exact header behaviour of each host, including the cache-status header and GitHub Pages defaults. Record what rehearsal shows.
- Deploy duration; it must fit inside the session.
- How to roll back on the chosen Cloudflare product.

## What attendees start with

- The public URL, already open in a tab from before the release.
- DevTools.

## Game changes

None required. The on-screen build ID from G0 carries the session. G1 is optional.

## Relevant tools

DevTools Network panel (Size and Status columns, "Disable cache"), `curl -I`, host cache-status headers, host rollback.

## Agenda

| Time | Activity |
| --- | --- |
| 0–5 | Everyone opens the game and notes the build ID. Question: I am about to ship a change. Who gets it, and when? |
| 5–15 | **Anatomy.** Inspect headers for the entry HTML, a hashed script and `version.json`. Reload and see memory cache, disk cache and `304` responses. Explain validators, max-age, immutable, and the edge cache status. |
| 15–28 | **Release.** Merge the prepared branch. Watch the deploy run. Attendees keep one old tab untouched and open a new tab. Compare build IDs and asset filenames. The old tab keeps running old code until reloaded. |
| 28–38 | **When it goes wrong.** Open the misconfigured deployment and release to it: browsers stay on the old version. Discuss what can and cannot be fixed from the server side. Contrast with GitHub Pages headers. Roll the main deployment back. |
| 38–45 | Rules of thumb. Questions. |

## Explained, assembled, demonstrated

- Explained: browser cache versus edge cache; why hashed filenames make long caching safe; why the entry document is the weak point.
- Demonstrated: a live release, a stuck client, a rollback.
- Configured live: nothing; the header configuration is shown, not written.

## Participant interaction

- Record their build ID before and after.
- Find which requests were served from cache after the release.
- Try to get the new version on the misconfigured deployment and report what worked.

## Intended outcome

Learning.

## How the outcome is observed

- Old tabs and new tabs show different build IDs at the same moment.
- Attendees correctly predict the outcome on the misconfigured deployment before trying it.
- After rollback, a reload shows the earlier build ID.

## Starting state, reset, rehearsal

Starting state: main deployment on the pre-release build; release branch unmerged; misconfigured deployment one build behind and visited by nobody yet.

Reset: revert the merge or roll back; redeploy the misconfigured site under a fresh URL, because browsers that visited it hold the old entry document.

Rehearsal checklist:

1. Headers on all three deployments match the session notes.
2. A full release takes under four minutes from merge to visible.
3. The misconfigured deployment really traps a browser; test with a fresh profile.
4. Rollback works and its duration is known.
5. Starting state restored after rehearsal, including a fresh URL for the misconfigured site.

## Fallback

- Deploy too slow or failing: switch to a pre-built second deployment that already has the new version and compare the two URLs.
- Misconfigured deployment does not trap browsers: show the captured recording.

## Links

- Tasks: [T-040 to T-044](../tasks.md#phase-4-session-3-preparation)
- Design: [§ Expected build output](../design.md#expected-build-output), [§ 6 Build and deployment](../design.md#6-build-and-deployment)
- Next: [S04](04-delivery-paths.md)
