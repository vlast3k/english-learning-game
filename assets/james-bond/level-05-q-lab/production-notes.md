# Production Notes

## Workflow Result

The rejected PR art was reverted and replaced through the Level Authoring Workflow:

1. Existing Level 05 scenario and mission data were kept as the validated content source.
2. UI consistency review found the reverted state playable but visually mismatched: camp background, reused Level 4 prop art, and Q Lab hotspots sitting on unrelated scenery.
3. Asset direction selected painted PNG assets matching Levels 1-3 instead of the rejected flat SVG style.
4. Scenario integration was limited to asset paths, hotspot coordinates, walk-to points, obstacle bounds, and inventory crops.

## Integration Checklist

- Background: `generated/q-lab-background.png` at `1024x576`.
- Props: `generated/interactive-props.png` at `1536x1024`, using 4x2 cells of `384x512`.
- Guide: Level 1 guide sheet is reused until a matching-quality Agent Q sheet exists.
- Required visible targets: briefing board, spy watch, x-ray glasses, stealth jacket, Agent Q, and security door.
- No readable text, logos, weapons, or franchise marks are intentionally included in generated artwork.

## Phaser Checklist

1. Open `phaser.html?level=5&reset=1`.
2. Confirm the briefing-board hotspot is centered on the left board.
3. Confirm watch, glasses, and jacket hotspots align with the three table displays.
4. Confirm the guide stands on the floor near the right side, not on the table.
5. Confirm the security-door hit zone covers the visible door.
6. Complete the level and verify all three inventory crops.
7. Run `npm test` and inspect the Level 05 screenshot.
