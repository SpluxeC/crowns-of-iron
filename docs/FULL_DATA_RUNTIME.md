# Reconciled six-faction runtime data

`data/balance-v0.2.json` is committed alongside the simulation (not merely downloadable separately). It contains validated 216 unit rows, 540 technology rows, 228 building rows and 126 local upgrade rows.

`src/fullCatalog.js` installs faction-specific 36-unit definitions and 90-technology catalogs into a fresh match. The command layer selects server-owned data: clients specify role or technology ID, not prices, damage, times or HP. Worker and optional technology training uses the installed catalog, and bots use the same research definitions.

Run `npm run full-data-demo` to exercise actual v0.2 cost/HP/technology values.

The **complete data effects** are still design descriptions, not executable implementations. Many special abilities, all local upgrade effects, unique movement mechanics, full building catalogs and research effect modifiers require dedicated gameplay logic. Tests must not equate 540 loaded tech records with 540 implemented unique effects.

The browser loads `/data/balance-v0.2.json` from the local web server on startup. Large file loading is asynchronous; if it fails, the inspector displays a warning and stays in shared-baseline mode.
