# Camp Supply Tent Background Prompt

Purpose: simple supply screen where the player takes the rope. This screen must not become a junk-room full of false affordances.

## Image Prompt

Create a warm painted adventure-game background of a small open canvas supply tent at a jungle base camp, 16:9 composition for a Phaser point-and-click scene.

Dominant visual focus: a clean supply nook with one obvious rope coil as the hero prop. The rope should be clearly visible, child-readable, and easy to separate as an overlay or crop. The rest of the tent should be visually quiet.

Required visible elements:

- open tent or supply shelf;
- one rope coil in a clear foreground or midground position;
- simple canvas, wooden crate, or shelf shapes for atmosphere;
- exit back to base camp through the tent opening;
- open walkable ground in the lower portion.

Composition requirements:

- Make the rope the only obvious required tool.
- Keep any box, backpack, notebook, or spare gear small and quiet, not highlighted.
- Leave room for inventory/HUD and dialogue bubbles.
- No readable text.
- No weapons, sharp traps, or threatening objects.

Avoid:

- many tools or gadgets;
- multiple ropes;
- shiny objects that look like collectibles;
- cluttered shelves that imply many unused interactions.

## Required State/Overlay Notes

The rope should be separable as a prop overlay or clean crop because it disappears after being taken. Background should still look natural after the rope is removed.

## Click Target Checklist

- `rope` overlay/crop
- `exit_base_camp`

