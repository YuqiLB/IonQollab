# Rejected design concepts — archived 2026-10-11

**Status: not selected. Not part of the active game.**

Everything created for the three-direction exploration is grouped here so it can be removed together. No production module or stylesheet imports this folder. The root README has one informational archive link; deleting this folder requires no game-code changes.

| Category | Location |
| --- | --- |
| Optional preview entry | `design-preview.html` |
| A/B/C layouts and state machine | `preview/concepts.css`, `preview/concepts.js` |
| Original design rationale and recommendation | `preview/README.md` (historical; the recommendation was rejected) |
| Captures, comparison sheet, and test records | `qa/concepts/` |
| Preview browser tests | `tests/concepts-smoke.cjs` |
| Inspection and contact-sheet helpers | `tools/` |

To revisit, run the normal root server and open `/design-archive/three-concepts/design-preview.html`. The archive reads existing shared character/font assets and the RSA module from the project root. It writes nothing to the active game. Relative asset paths have been adjusted for this location. Archived scripts resolve their capture output within this folder.

Paths and run instructions in the historical design/QA notes refer to their original locations. For the relocated preview test, run `node design-archive/three-concepts/tests/concepts-smoke.cjs /path/to/node_modules` from the project root. The old root `/design-preview.html` entry has been removed rather than redirected.

The new reference-inspired production skin is separate: `styles/pixel-ui.css`.
