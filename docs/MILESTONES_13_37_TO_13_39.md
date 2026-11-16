# Crowns of Iron — Milestones 13.37–13.39

## 13.37 — Balanced large-squad target load
- When allocating fresh AI attack orders, count attacks already assigned by living, active squad members to valid enemy units.
- The first three attack assignments can stay coordinated on a shared target; after that, a bounded penalty encourages targeting another reachable enemy rather than saturating one unit.
- Track target identity by owner and unit ID, update counts when an AI order is replaced or removed, and preserve player-issued commands, attack-domain rules and path validity.
- The planner remains deterministic, issues at most its configured orders per decision, and still probes at most 16 reachable candidates per soldier.

## 13.38 — Recovery from depleted resource deposits
- Exclude exhausted or blocked resource tiles from active AI gathering coverage so old harvest jobs do not masquerade as ongoing collection.
- Unloaded workers assigned to depleted or blocked deposits release those stale harvest jobs and can seek new finite, reachable deposits. Workers carrying cargo retain their return/delivery obligation.
- The existing mandatory-research deficit protection, 20-second retarget rule and physical resource/harvest validation remain intact. No resources spawn or credit magically.

## 13.39 — Mobile pixel-density changes
- Recompute adaptive WebGL rendering resolution bounds on canvas resizing when device pixel ratio changes during orientation changes, browser zoom or switching displays.
- Preserve the current Auto mode's relative quality setting within new legal limits. Performance and Quality modes snap to their defined new bounds.
- The canvas remains full-screen with UI overlay, landscape rules remain active; game-state tick timing and multiplayer logic are unaffected.
- Adds regression tests for saturation, expired harvest assignments, and DPR transitions.

Release gates: Node tests, simulation validation, mirrored faction balance, full-match soak and replay, browser/art smoke, static Pages build and package validation. This is not physical-mobile-device performance certification or live multiplayer playtesting.
