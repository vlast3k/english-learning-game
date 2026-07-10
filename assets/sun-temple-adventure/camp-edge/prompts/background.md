# Camp Edge Background Prompt

Purpose: reveal the map piece under a movable branch and unlock the first meaningful map repair.

## Image Prompt

Create a warm painted jungle camp-edge adventure-game background, 16:9 composition for a Phaser point-and-click scene.

Dominant visual focus: a diagonal fallen branch near the foreground or path edge, with a torn map piece visibly trapped underneath. The child should immediately understand there is something under the branch.

The scene is the edge of the safe base camp where the path begins to enter the jungle. It should feel inviting and mysterious, not dangerous.

Required visible elements:

- camp path back toward base camp;
- jungle path forward, visually blocked/locked until map repair;
- diagonal fallen branch;
- partial map piece peeking out under branch;
- small sun-symbol motif on or near the map piece;
- open walkable ground.

Composition requirements:

- The branch must look movable, not like a huge permanent tree trunk.
- The map piece should have a torn edge that can visually match the torn map later.
- A simple path shape should lead toward the jungle without requiring readable signs.
- Leave room for HUD/inventory/dialogue.

Avoid:

- many loose papers;
- many branches;
- heavy dark jungle;
- extra tools or collectibles.

## Required State/Overlay Notes

Best handled with overlays:

- branch blocking state;
- branch moved state;
- map piece visible/taken state.

Background should support both branch positions.

## Click Target Checklist

- `fallen_branch`
- `map_piece_01` overlay
- `exit_base_camp`
- `exit_jungle_path`

