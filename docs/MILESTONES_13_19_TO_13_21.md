# Crowns of Iron — Milestones 13.19–13.21

Built upon the previous milestone branch (13.16–13.18) pending its final browser CI verification.

## 13.19 — Threat-aware, legal AI targeting
- A shared squad objective must be attackable by at least one active squad combatant using existing domain restrictions (air, naval, land).
- Defensive objectives ignore unarmed enemy workers and prioritize armed intruders within defensive range. Raiding still targets enemy workers.
- In the army planner, an existing AI order remains available as fallback while searching for replacement targets; a failed or unreachable replacement must not discard a valid active attack. Stale targets are removed when the original enemy no longer exists or cannot legally be attacked.
- Existing human/manual attack orders, damage stats and battle movement rules remain untouched.

## 13.20 — Quantified faction progression
- Pure progression diagnostics aggregate the 120-second development snapshots from all thirty real headless faction matchups.
- Report observation counts, mean active armies/workers, mean completed technology/construction, highest observed age, and share of observations at age II or above for every faction.
- Per-faction timeline reports sample count and two-minute army/worker/research means. Shorter games contribute fewer samples; missing observations are not treated as zeros or wins.
- Rejects malformed faction identifiers, timestamps, negative development counts, or invalid ages. No faction buff/nerf is applied without better evidence.

## 13.21 — Regression and release checks
- Adds focused tests for defending against armed intruders, legal attack domains, faction/side alignment and checkpoint validation.
- Update to v13.21.0, extend syntax-check.
- CI required: `npm test`, `npm run faction-matchups`, `npm run full-match-matrix`, browser smoke, and playtest packaging.

No physical phone benchmarks, full PvP online tests or statistically certified balance are implied.
