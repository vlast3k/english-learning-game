# Dark Cave Background Prompt

Purpose: second-slice reward screen. The player inspects the cave wall, finds a stone key, opens a blue stone box, and takes the Blue Lens.

## Image Prompt

Create a calm, kid-friendly painted cave interior adventure-game background, 16:9 composition suitable for a Phaser point-and-click scene.

Dominant visual focus: an old blue stone box with a simple sun mark, placed where the player can clearly click it. Nearby, a cave wall has gentle sun-and-river markings and one small wall crack where a stone key can appear as an overlay. The wall crack must have a fair visual clue: a tiny blue glint, a small sun mark, or a thin water trickle pointing to it.

The cave should feel mysterious but safe: shallow reflective water, rounded stones, soft blue-green glow from the player's glow jar, no frightening imagery. It should look like a hidden place of discovery, not a dangerous dungeon.

Required visible elements:

- calm cave interior with shallow water or smooth stone floor;
- blue stone box area;
- wall mark/crack area for the hidden stone key, with a fair blue glint or sun-mark clue;
- cave opening/path back to waterfall mouth;
- enough clear lower-floor space for hero movement.

Composition requirements:

- Keep the stone box and wall crack separated enough for reliable click zones.
- Make the Blue Lens reveal area visually clear but not visible before the box opens.
- Stage the room like a readable mini-scene, ideally left to right: cave opening/glow source, wall crack clue, then blue stone box final focus.
- Leave room for HUD, inventory, and dialogue bubbles.
- No readable text or alphabetic markings.
- No weapons, skulls, traps, bats, horror imagery, or franchise references.

Avoid:

- many boxes or many keys;
- gem piles or treasure clutter;
- scary lighting;
- tiny unreadable interaction targets;
- UI elements baked into the image.

## Required State/Overlay Notes

Use overlays for:

- stone key hidden/visible/removed;
- blue stone box shut/open if needed;
- Blue Lens hidden/visible/removed.

The Blue Lens should be visually distinct from the blue cave: bright cyan rim, simple sun motif, and clean circular silhouette.

## Click Target Checklist

- `cave_wall`
- `stone_key` overlay
- `blue_stone_box`
- `blue_lens` overlay
- `exit_waterfall_mouth`
