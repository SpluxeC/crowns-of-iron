# Crowns of Iron — Development Phase 5.5–5.8

**Release type:** local testable 3D/2D browser RTS prototype; not a shipped game or Internet service.

## 5.5 — Player-side building and placement

The connected multiplayer browser now offers an age-filtered list of early constructions (Training Camp, Shelter, Resource Depot, then Barracks, Archery Range, Farm and Forge at Age II). Select a living, positioned Worker, choose the building and click a map tile. Only the server performs affordability, placement, site reachability, technology/age gating, and worker-busy checks. Structure footprint and building timing are inherited from the authoritative simulation. The UI is basic: no drag ghost, precise placement preview, multiple-builder selector, cancel button or production layout.

## 5.6 — Recruitment, mandatory research and queue inspection

Available recruitment choices derive from the player's existing facilities and queues; the browser supports Worker, Club Fighter, Swordsman and Archer in their correct production buildings. The next eligible mandatory discovery is selected by age, prerequisites, queue and completion state and requested from Town Center. The user can inspect friendly research and production jobs and their elapsed queue time. This is **not** all 540 faction-specific tech rows and does not yet expose every unit, building and age-specific interaction in the UI. Server validation remains authoritative; the client lists are only convenience hints. The v0.2 balance system is provisional.

## 5.7 — Local disk checkpoint / explicit recovery

`src/hostStore.js` writes versioned MatchHost checkpoints to a same-directory temporary file using exclusive creation and restrictive 0600 permissions (on supported platforms), syncs the file, then atomically renames it over the prior checkpoint. The server creates directories with restrictive permissions, writes approximately every five seconds, and attempts one final save on SIGINT/SIGTERM. Existing checkpoint files are **not** overwritten on startup unless the operator explicitly chooses restoration or reset.

Default checkpoint: `.local/crowns-host-checkpoint.json`, configurable through `CHECKPOINT_FILE`.

Shell usage (Unix):

```sh
npm run protocol-server
RESTORE_CHECKPOINT=1 npm run protocol-server
RESET_CHECKPOINT=1 npm run protocol-server
```

PowerShell:

```powershell
$env:RESTORE_CHECKPOINT="1"; npm run protocol-server
```

Restoration issues **new** session tokens. The operator must supply each player a fresh token privately; old browser sessions won't authenticate. The file is intentionally never served by HTTP. **Checksums detect accidental corruption, not malicious tampering.** This is neither an authenticated save format nor encrypted/replicated durable storage. The five-second interval leaves a possible loss window after abrupt process failure. A process crash or forced termination won't necessarily run final shutdown logic.

## 5.8 — More reliable local client synchronization

The browser's SSE decoder now handles split version frames, CRLF line endings, heartbeats, oversize messages and malformed/non-version notifications. Every reconnect fetches authoritative fog-filtered state, and a five-second polling fallback runs while connected. Older racing snapshots are ignored. The transport remains same-machine HTTP bound to 127.0.0.1, not Internet-grade security, authenticated accounts or production latency/host failover.

## Verification

```sh
npm test
npm run validate
npm run syntax-check
npm run batch-5.5-demo
npm run protocol-server
```

Automated tests cover research/build/training UI selectors, real authenticated HTTP economy commands, SSE frame decoding, file checkpoint restoration and corruption/overwrite guards, plus all previous simulation regression tests. The browser's visual behavior, keyboard/touch accessibility, multiple remote physical machines, real crash-loss bounds, competitive multiplayer and full-scale GPU performance still need manual evaluation.

## Next suggested phase

Complete a richer construction/technology catalog UI, improve unit selection and pathing at military scale, introduce a proper production 3D asset pipeline, benchmark practical match loads, and develop credentialed hosting and matchmaking architecture before any public multiplayer exposure.
