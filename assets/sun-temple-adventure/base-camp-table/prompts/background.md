# Base Camp Table Background Prompt

Purpose: first screen of the `sun-temple-adventure` vertical slice. Introduce the Sun Compass, torn map, Mira, and the visible valley problem.

## Image Prompt

Create a warm, kid-friendly painted adventure-game background for a jungle base camp clearing, 16:9 composition suitable for a Phaser point-and-click scene.

Dominant visual focus: a sturdy camp table under a clear slanting sunbeam. On the table is an old round Sun Compass with five empty lens sockets arranged like a simple sun symbol. Next to it is a torn map area where a loose torn map can be placed as an overlay. Near the table, place one small drooping sun flower to show that the valley needs sunlight.

The scene should feel like a classic readable point-and-click adventure screen: charming, clear silhouettes, soft painted colors, safe jungle mystery, no danger. Add Guide Mira standing space beside the table on walkable ground, but do not bake in a character if this prompt is for background only. Leave clear walkable ground in the lower third.

Required visible elements:

- camp table;
- Sun Compass area with five empty lens slots;
- torn map area beside the compass;
- one drooping sun flower near the table or map edge;
- path/exits toward a supply tent and camp edge;
- readable open ground for player movement.

Composition requirements:

- Keep the Sun Compass and torn map area separated enough for individual click targets.
- Put the supply tent exit on one side and the camp-edge path on the other.
- Leave room at top or upper corners for HUD, inventory, and dialogue bubbles.
- No readable text on signs or objects.
- No weapons, skulls, horror imagery, or franchise references.

Avoid:

- cluttered camp gear that looks clickable;
- multiple maps, compasses, or flowers that confuse the interaction;
- dark or photoreal thriller lighting;
- UI elements baked into the image.

## Required State/Overlay Notes

Do not bake the takeable torn map into the background if it needs to disappear. The compass can be part of the background, but its Green Lens placed state and green light on the map should be handled by overlay if possible.

## Click Target Checklist

- `sun_compass`
- `torn_map` overlay
- `mira` sprite position
- `exit_supply_tent`
- `exit_camp_edge`

