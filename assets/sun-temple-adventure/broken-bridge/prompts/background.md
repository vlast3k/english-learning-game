# Broken Bridge Background Prompt

Purpose: first major inventory-use gate. The player sees the basket across the river before bridge repair, then uses the rope to make the bridge safe.

## Image Prompt

Create a warm painted jungle river crossing adventure-game background, 16:9 composition for a Phaser point-and-click scene.

Dominant visual focus: a clear near-side/far-side river split with a small broken wooden bridge between them. The far side should be visible but unreachable before repair. Lina's lost basket is visible across the water on the far side, clearly desirable but out of reach.

The bridge should have simple posts or broken rail points where a rope can logically be tied. The repaired state must show the rope tied onto the bridge.

Required visible elements:

- small river, safe and bright;
- broken wooden bridge;
- near side where hero stands;
- far side with visible lost basket;
- obvious place for rope repair;
- path back to jungle path;
- far-side route toward village garden.

Composition requirements:

- Make the bridge the only obvious repair target.
- Basket must be visible before repair, but visually unreachable.
- Repaired bridge state must explain where the rope went.
- Leave walkable ground on near side and far side if possible.
- Leave room for HUD/inventory/dialogue.

Avoid:

- dangerous rushing river;
- scary height;
- multiple baskets or rope-like objects;
- extra repair tools.

## Required State/Overlay Notes

Use either two full backgrounds or clean overlays:

- bridge broken;
- bridge repaired with rope tied in place;
- basket visible/unreachable;
- basket removed after taken.

If overlay alignment is unreliable, use full broken and repaired background variants.

## Click Target Checklist

- `broken_bridge`
- `lost_basket` overlay
- `exit_jungle_path`
- `exit_village_garden`

