# Reconciled v0.2 balance-data import

The complete authoritative numeric roster is the separately provided `AOE_CLONE_Reconciled_Balance_v0_2.xlsx`, not the tiny shared archetype samples.

From the repository root:

```bash
python3 scripts/import_balance.py AOE_CLONE_Reconciled_Balance_v0_2.xlsx data/balance-v0.2.json
npm test
npm run validate
```

The import uses **Python standard library only**, handles shared-string or inline-string XLSX cells, validates 216 unit entries, 540 research rows, 228 building rows and 126 upgrade rows.

The generated JSON can be read by `loadReconciled`, `factionRoster` and `technologyCatalog` in `src/reconciledData.js`. It is intentionally not a binary XLSX blob committed to the repository. When tests are run without imported data, the data-integration test is skipped by returning early; use this script first for comprehensive data checks.

**Important:** shared archetypes currently power the default match simulation; do not claim the full 540-node runtime research and all 216 faction attacks are active until the match builder is wired to these imported catalogs.

## Direct JSON import
If you already have the separately exported `AOE_CLONE_Full_Faction_Data_v0_2.json` from the ChatGPT project, copy it into this repository at `data/balance-v0.2.json`. Do not run the Python XLSX importer again. This JSON covers all six factions and all six numeric tabs, but **it is not required for the lightweight Node tests**. For game runtime use, wire a `technologyCatalog(...)` and `factionRoster(...)` into the match builder. This integration is not silently activated by the presence of the file.
