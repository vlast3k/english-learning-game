# Village Garden Background Prompt

Purpose: first NPC help scene. The player gives Lina her basket, receives a flower-pot hint, finds the Green Lens, then returns to the Sun Compass.

## Image Prompt

Create a warm painted village garden adventure-game background, 16:9 composition for a Phaser point-and-click scene.

Dominant visual focus: a friendly garden area with space for Lina near one distinctive flower pot. The flower pot is the important hiding place for the Green Lens. The garden should also show a small seed/flower problem, making Lina's need for the basket feel practical.

The scene should feel like a safe destination after crossing the bridge: welcoming, colorful, and simple.

Required visible elements:

- open garden path and walkable ground;
- one distinctive flower pot near Lina's interaction area;
- small garden table or low work area;
- subtle seed/flower problem, such as empty seed row or drooping small flowers;
- route back toward bridge;
- no required keeper hut art yet, because hut visibility is deferred.

Composition requirements:

- Use one obvious flower pot, not several similar pots.
- Flower pot must be readable at game resolution.
- Leave room for Lina sprite without covering flower pot or exits.
- Garden table and water pot can be scenery, but must not compete with the flower pot.
- Leave room for HUD/inventory/dialogue.

Avoid:

- many basket-like objects;
- many lens-like shiny objects;
- multiple flower pots that create false leads;
- readable text on signs.

## Required State/Overlay Notes

Use overlays for:

- flower pot normal state;
- flower pot with small sun mark or green shine after Lina hint;
- Green Lens hidden/visible/taken.

Lina should be a separate NPC sprite, not baked into the background.

## Click Target Checklist

- `lina` sprite/give target
- `flower_pot`
- `green_lens` overlay
- `garden_table` optional scenery
- `water_pot` optional scenery
- `exit_broken_bridge`

