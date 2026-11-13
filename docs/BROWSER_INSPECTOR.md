# Minimal browser simulation inspector

Run `npm run inspect` and open `http://127.0.0.1:5173`.

The browser shows an abstract, seeded **2D tile map** and a live readout of core economy state. Advance time, queue a Worker, start age research, inspect tiles and reserve a 3x3 Training Camp.

This is a local developer tool, **not** the intended final third-person/3D strategy presentation. Training Camp placement is an illustrative economic transaction and does not yet connect into the authoritative building queue. The opposing civilization is inactive, so this inspector is not multiplayer or a game demo suitable for balance claims.

The source modules use browser-native ESM and no external CDN/dependencies. The HTTP server binds only to `127.0.0.1`.
