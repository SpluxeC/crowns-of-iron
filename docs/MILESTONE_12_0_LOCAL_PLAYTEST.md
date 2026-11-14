# Crowns of Iron — Milestone 12.0: Packaged Local Playtest

This milestone creates a downloadable **local browser playtest ZIP** through
GitHub Actions. It is intentionally not an Internet game server or Windows/macOS
native application. This is an intermediate step toward a distributable release,
with no change to game balance or local-session security boundaries.

## Build and verify

```bash
npm run package-local
npm run verify-package
```

The first command assembles `dist/crowns-of-iron-local/` from the committed
`assets/`, `data/`, `src/`, `web/` and `scripts/` sources, plus a minimal
Node package and Windows/macOS/Linux start scripts and playtest guide.
Generated output, user checkpoints, .git history, secrets and dependencies
are excluded from packaging.

The second command launches the **actual packaged runtime** on an ephemeral
127.0.0.1 test port, checks the health endpoint, client page, art gallery, core
ES modules, local session-authenticated state and dynamically generated four-mesh
vehicle glTF. It checks that state is unauthorized without credentials. This is
a distribution smoke test, not a full end-to-end multiplayer gameplay test.

The `Package local browser playtest` GitHub Actions workflow triggers on
pushes to `main`, milestone branches, and pull requests targeting `main`.
After verification, it uploads the `crowns-of-iron-local-playtest` artifact
as a ZIP retained for 30 days. The workflow itself runs with read-only
repository permissions.

## Start from artifact

1. From the successful package workflow run, download
   **crowns-of-iron-local-playtest** under *Artifacts*.
2. Extract the ZIP to a normal writable folder.
3. Install Node.js 22+ if not already installed.
4. Windows: run `START-WINDOWS.cmd`. macOS/Linux:
   `sh START-MAC-LINUX.sh`.
5. On **that same machine**, visit
   `http://127.0.0.1:5190/client` and enter the `human` session token
   printed by the server terminal.
6. The 3D gallery is at
   `http://127.0.0.1:5190/model-gallery`.

The local server must stay open to play. Safeguards remain in place:
127.0.0.1-only binding, no unauthenticated match snapshots, fixed module/art
allowlists, and no public network access.

## Known non-goals

- No hosting or publicly accessible URL.
- No standalone .exe/.app or automatic Node runtime bundling.
- No production account authentication, HTTPS, matchmaking or public multiplayer.
- No hardware compatibility certification, full game balancing, installers,
  license or commercial distribution grant.
- No claims of complete in-game skirmish balance from distribution smoke alone.

This milestone is suitable for a local desktop playtest, not commercial
release. A public playable link requires a separately designed authenticated
network service and deployment infrastructure.
