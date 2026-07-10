# Waterfall Mouth Background Prompt

Purpose: second-slice cave-entry screen. The player finds a glow leaf, makes a glow jar, and uses it to light the dark cave entrance.

## Image Prompt

Create a bright, warm painted jungle waterfall adventure-game background, 16:9 composition for a Phaser point-and-click scene.

Dominant visual focus: a dark but non-scary cave mouth beside or partly behind a gentle waterfall. The cave entrance should be clearly visible as the blocked path before the waterfall beauty takes over. Near the entrance, reserve a clean spot for one small cluster of glow leaves as a separate overlay; the leaf should feel like it belongs to the cave-light problem.

The scene should feel magical and safe: shallow water, stepping stones, lush plants, soft mist, and sunlight catching the waterfall. The darkness inside the cave should signal "needs light" without horror.

Required visible elements:

- gentle waterfall and shallow safe water;
- dark cave entrance;
- clean glow-leaf placement area near the cave;
- path/stepping stones back toward village/map travel;
- open walkable ground or stones in the lower third.

Composition requirements:

- Make the cave entrance the only obvious blocked target.
- Make the glow-leaf area visually distinct from the Blue Lens or gems.
- Place the glow-leaf area near the cave mouth, but not inside it.
- Leave room for HUD, inventory, and dialogue bubbles.
- No readable text.
- No weapons, skulls, traps, bats, horror imagery, or franchise references.

Avoid:

- many glowing objects;
- loose gems, coins, tools, jars, or keys;
- violent rushing water;
- cave mouth hidden by too much mist;
- UI elements baked into the image.

## Required State/Overlay Notes

The glow leaf should be a removable overlay. The cave-lit state can be an overlay showing soft blue-green light inside the entrance after the glow jar is used.

## Click Target Checklist

- `glow_leaf` overlay
- `dark_cave_entrance`
- `exit_village_garden`
- `exit_dark_cave`
