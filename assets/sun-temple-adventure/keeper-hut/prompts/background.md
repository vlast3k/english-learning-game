# Keeper Hut Background Prompt

Purpose: second-slice village utility screen. The player finds the empty jar used to make a glow jar for Waterfall Cave.

## Image Prompt

Create a warm, kid-friendly painted adventure-game background for a small jungle village keeper hut, 16:9 composition suitable for a Phaser point-and-click scene.

Dominant visual focus: one simple empty glass jar sitting alone on a low keeper shelf or small table. The jar should feel like the answer to the hint "A jar can hold light." The jar area should be obvious and clean, with enough empty space around it for a separate overlay/click target.

The hut should feel practical and kind: woven walls, simple garden shelves, seed trays, soft daylight through the doorway, a path back to the village garden. It is Lina's hut, but do not include Lina or any other character in the background.

Required visible elements:

- small open keeper hut interior;
- one clear shelf/table spot for the empty jar;
- doorway/path back to village garden;
- simple garden context such as seed trays or hanging herbs;
- readable walkable floor in the lower third.

Composition requirements:

- Make the jar spot the only obvious takeable-object focus.
- Make the jar singular and unmistakable; no other glass shapes nearby.
- Keep the lower third clear for hero movement.
- Leave room at top or upper corners for HUD, inventory, and dialogue bubbles.
- No readable text on signs or labels.
- No weapons, skulls, traps, horror imagery, or franchise references.

Avoid:

- many jars;
- tool clutter such as shovel, axe, hammer, lamp, rope, or keys;
- shiny false-lead objects;
- dark or scary hut lighting;
- UI elements baked into the image.

## Required State/Overlay Notes

Do not bake the takeable empty jar into the background if it needs to disappear. The shelf/table should remain visible after the jar is taken.

## Click Target Checklist

- `empty_jar` overlay
- `hut_shelf`
- `exit_village_garden`
