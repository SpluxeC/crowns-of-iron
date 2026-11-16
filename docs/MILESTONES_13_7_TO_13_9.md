# Crowns of Iron — Milestones 13.7–13.9

Version **13.9.0** targets the public GitHub Pages, 3D-only, landscape-enabled single-player AI skirmish. The previous multiplayer development sources remain intact.

## 13.7 — Reliable resource collection and logistics

A 13.6 diagnostic exposed the actual cause of AI starvation: workers were collecting cargo, but early buildings occupied the Town Center's logical return location and blocked the straight paths to guaranteed starting deposits. AI workers then remained stuck carrying 30-unit loads, never crediting the empire.

Fixes:
- AI construction reserves every faction's Town Center drop-off (the start tile plus its immediate surrounding squares) and the four cardinal resource approach paths out to three tiles.
- Cargo delivery uses *reachable* walkable drop-off approaches, not blindly walking into occupied buildings. Older saves whose center tile has already been built over can use a walkable perimeter drop-off.
- Workers must still physically travel to an eligible drop-off; this does not grant free income or bypass finite deposits.
- Age-aware AI worker job allocation weights Food, Wood and other resource demands by the next mandatory technology's actual resource shortfall. Idle, empty-handed workers may be reassigned from optional deposits after a cooldown if no worker is satisfying a critical tech deficit.
- Spatial inventory, deposit depletion and resource costs remain authoritative.

## 13.8 — Research and age progression

- The AI now reserves the next unqueued mandatory research technology's cost before spending resources on optional workers and military recruitment.
- Research remains subject to age, prerequisite, costs, facility and timer validation. No techs or ages are granted for free.
- From Age II onward, the AI prioritizes construction of renewable Food Farms, then age-appropriate military and economic buildings. Farms already produce resources through the existing spatial renewable economy system.
- Legacy abstract-economy AI tests retain their original optional recruitment behavior.

## 13.9 — Complete-game testing, not time jumps

The Pages deployment gate runs both the older reproducible 10-minute 1v1 / 7-minute 1v3 AI soaks and the new `npm run full-match-matrix`:

- **Seven full AI-controlled skirmishes:** six seeded 1v1 matchups rotating through all six factions, plus a seeded 1v3 battle. All run actual one-second simulation steps until defeat or a genuine 30-minute limit.
- One complete 1v1 match replays from the same seed; the full state checksum, scores, winner and game checkpoints must agree.
- A separate peaceful 1v1 uses **1,800 actual one-second steps**, not an elapsed-time edit, verifying the score-based 30-minute resolution.
- Every minute during play, check finite nonnegative inventories, legal population, positive health for surviving units and stable human ownership indices.
- The deployment gate requires at least **five of seven matches** to reach Age II and at least one to reach Age III, raising a regression if economic progression stalls again.

### Branch validation observations

On the initial complete-game matrix after the economic changes, all seven active matches ended by elimination. Six of seven contained Age II progression, two reached Age III, and a full-game repeated seed matched its checksum. One match ended after 127 simulated seconds before any side could reach Age II. A distinct time-limit test now verifies 1,800 real simulation steps and timed scoring.

These are reproducible **headless simulations**, not 30 minutes of graphics rendering or hands-on physical mobile playtesting. Performance, tactical sophistication, and every faction matchup still require further manual game testing.

## Run

```sh
npm test
npm run solo-soak
npm run full-match-matrix
npm run build-pages
npm run pages-smoke
```

GitHub Pages publication: `https://spluxec.github.io/crowns-of-iron/` after the main branch CI and deployment pass.
