# Jungle Path Background Prompt

Purpose: traversal screen with a memorable visual clue so it does not feel like a hallway.

## Image Prompt

Create a warm, readable painted jungle-path adventure-game background, 16:9 composition for a Phaser point-and-click scene.

Dominant visual focus: a tunnel of leaves opening toward a soft river glow in the distance. In the foreground or midground is a carved sun stone pointing toward the river. The sun stone is an inspectable clue and part of the recurring sun-symbol motif.

The mood should be safe jungle mystery: lush plants, warm light, clear path, no threats.

Required visible elements:

- clear walkable jungle path;
- carved sun stone with simple sun symbol;
- brighter river glow or opening ahead;
- path back toward camp edge;
- path forward toward broken bridge.

Composition requirements:

- The carved sun stone should be distinct but not look like a takeable inventory item.
- The path direction should be visually obvious without text.
- Keep the lower third walkable and uncluttered.
- Leave room for HUD, inventory, and dialogue.

Avoid:

- hidden collectibles;
- many clickable-looking stones;
- confusing side paths;
- dark danger tone.

## Required State/Overlay Notes

No required state variants for slice one. Optional inspected state can be handled in data only.

## Click Target Checklist

- `path_marker`
- `exit_camp_edge`
- `exit_broken_bridge`

