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
