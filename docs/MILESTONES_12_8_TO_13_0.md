# Crowns of Iron — Milestones 12.8–13.0
## Browser-only 3D RTS gameplay interaction, economy and combat

The GitHub Pages single-player game remains 3D-only, landscape on mobile and Web Worker authoritative. Existing localhost multiplayer proof-of-concept code remains preserved.

### 12.8: Selection and mobile controls
- Desktop: drag a left-button rectangle over projected friendly units to select up to 24; Shift-click to add/remove units; right-click any visible battlefield target for a context-sensitive order.
- Mobile: single-finger pan, single-tap select, two-finger pinch to smoothly change RTS camera zoom, and **Command** followed by a target to issue a context-sensitive order.
- Smart orders: enemy unit → attack; enemy building → structure attack (military); resource deposit → assign selected workers to spatial harvest; clear tile → group formation movement or individual movement. Shift/context modified destination issues attack-move to armed units.
- Selection updates status, HP, active orders and stances. The right-hand empire drawer opens automatically when selecting a building.

### 12.9: Economy and buildings
- New skirmishes use the existing **spatial harvesting economy**, enabling real resource deposits, worker travel, carrying and return to a drop-off instead of unbounded abstract income.
- Worker **Gather** mode assigns deposits through the existing validated `assignHarvest` command.
- Available recruitment/research options narrow to the currently selected, owned completed building's facility key; global options remain visible when no building is selected.
- Placement UI shows a world-aligned projected footprint outlined green for available grass or red for blocked tiles. Client previews are advisory; the simulation validates authoritative placement, worker reachability, affordability and age eligibility.
- Building status includes completion, facility key, and repair/cancel actions, using simulation commands rather than local state mutations.

### 13.0: Combat commands
- Attack enemy units and visible structures with direct pointer interactions.
- Attack-move, group formation destinations, hold/guard/aggressive stances, stop, and two-point patrol through the actual simulation.
- Patrol routes are saved in simulation state and alternate attack-move legs when the current leg completes; explicit stop/move/attack/formation orders cancel patrol.
- The existing WebGL rendering includes selected-unit highlighting and segmented health indicators. The HUD now reports current order, stance and aggregate selection HP.

### Testing and limitations
- `tests/rtsInteraction.test.js` checks box selection, selection cap, smart attacks, worker gathering, formations, attack move, and footprint validation.
- `tests/patrolOrders.test.js` checks valid armed patrols, return path and stop cancellation.
- `npm run pages-smoke` exercises Chromium 3D UI, command modes and mobile synthetic pinch, along with single-player match launch, save/load, and orientation.
- Full-length balancing, sophisticated collision-free large-group positioning, automated repair worker travel and mobile hardware ergonomics require further playtesting. The public game still uses prototype art and noncompetitive AI.
