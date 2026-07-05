# Production Notes

## Level Goal

Level 02 turns the room-and-prepositions curriculum into a safe flat surveillance mission. The child agent inspects a friendly apartment scene, finds hidden clue items, and uses `There is/There are` plus place words to report what is in the room.

The visual target is spy-adventure flavor for kids, not a literal branded James Bond scene. Avoid real franchise marks, actor likenesses, alcohol, gambling, weapons, and frightening thriller imagery.

## Phaser Integration Checklist

When turning this into a live selectable level:

1. Load `scenarios/james-bond-level-02-content.json` through the `scenario` query parameter.
2. Keep using the default hero/guide sprites unless new character art is explicitly requested.
3. If replacing loaded assets or changing generated art, update cache keys in `phaser-content.js` / `phaser.html` as relevant.
4. Run `npm test`.
5. Inspect the rendered scene for walkable floor space, door hit area, and hotspot placement.

## Asset Notes

- The background was resized to the Phaser scene size, `1024x576`.
- The item sheet remains a larger source image for future cropping.
- No hero sprite sheet, hero portraits, or guide sprite sheet were created for this level.
