# 10. Scene Prop Integration Audit

## Policy

Required level props are painted into the level background. Authored content scenarios should not use `scene_icon` for world objects, collectibles, scenery, or exits.

Inventory icons are different: `inventory.icon` can still crop or reuse prop-sheet art because it appears in the inventory UI after collection.

## Current Status

| Level | Status | In-world `scene_icon` usage | Notes |
| --- | --- | --- | --- |
| 01 Briefing | OK | none | Required props appear background-integrated. |
| 02 Surveillance | OK | none | Required props appear background-integrated. |
| 03 Village Camp | OK | none | Welcome board, garden table, and map-room path use painted background objects. |
| 04 Animal Trail | OK | none | Added `animal-trail-background.png` with field board, report, meat bowl, camera, rock habitat, and gate embedded. |
| 05 Q Lab | OK | none | Briefing board and security door use painted background objects. |
| 06 River And Mountain | OK | none | Added `river-mountain-background-v2.png` with route board, table clues, village road, and mountain path embedded. |
| 07 Festival Puzzle | OK | none | `festival-background-v2.png` embeds the board, props, and festival arch exit. |
| 08 Pattern Temple | OK | none | Added `pattern-temple-background-v2.png` with number stones and sequence cards embedded at prop scale. |
| 09 Seasons Garden | OK | none | Added `seasons-garden-background-v2.png` with seasonal clues and garden gate embedded at prop scale. |
| 10 Earth Helper | OK | none | Added `earth-helper-background-v2.png` with cleanup, reuse, seed, and gate props embedded at prop scale. |
| 11 City-Country Finale | Draft OK | none | Added `city-country-finale-background.png` with message board, postcards, routine card, compare view, and final gate embedded. Hotspot circles are intentionally rough for manual editor alignment. |

## Verification

- Machine scan: no `scene_icon` usage remains in `scenarios/*content.json`.
- `npm run test:content` passes.

## Acceptance Criteria

- Required collectibles are visible in the painted background without `scene_icon`.
- Required scenery/mission board objects are visible in the painted background without `scene_icon`.
- Exit gate/path is visible in the painted background without `scene_icon`.
- Hotspot circles are aligned in editor mode with the painted props.
- Scenario keeps `inventory.icon` for UI inventory where useful.
