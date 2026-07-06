# Production Notes

## Level Goal

Level 03 turns the simple-present curriculum into a friendly village camp visit. The child agent reads a welcome board, collects picnic clues, and brings the village list back to the Level 02 map room.

The visual target is bright, safe, village-adventure art. Spy flavor is subtle and playful: clue ribbons, map/list props, and mission-like organization, without real franchise marks or thriller imagery.

## Phaser Integration Checklist

1. Load `scenarios/james-bond-level-03-content.json` directly with `phaser.html?level=3&reset=1`.
2. Confirm the background reads as a village garden camp, not the old jungle camp.
3. Confirm visible art exists for bread note, football clue, teacher map, welcome board, garden table, teacher, and map-room path.
4. If replacing generated art, update cache keys in `phaser-content.js`, `game-engine/phaser-bridge.js`, `phaser-game.js`, and `phaser.html`.
5. Run `npm test`.

## Asset Notes

- The generated background was resized to the Phaser scene size, `1024x576`.
- The prop sheet is kept as a 4x2 atlas with 384x512 source cells.
- The teacher guide sheet is chroma-key processed to RGBA and resized to Phaser's existing guide spritesheet layout.
