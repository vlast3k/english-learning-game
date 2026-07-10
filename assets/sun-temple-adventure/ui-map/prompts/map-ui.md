# HUD Map And Map Panel Prompt

Purpose: create optional art direction for the HUD map button and parchment-style map panel. The map UI can also be built in Phaser first; this prompt is for art support if needed.

## Image Prompt

Create a kid-friendly adventure-game UI map asset set with transparent or easily separable elements.

Style:

- warm parchment adventure map;
- simple readable icons;
- playful point-and-click adventure tone;
- no realistic military or treasure-hunter franchise references;
- no readable text baked into the art.

Required elements:

1. HUD map button, disabled state: visible but muted, before the torn map is taken.
2. HUD map button, enabled state: same icon but brighter/active.
3. Parchment map panel background.
4. Marker icon for Base Camp.
5. Marker icon for Camp Edge.
6. Marker icon for Jungle Path.
7. Marker icon for Broken Bridge.
8. Marker icon for Village Garden.
9. Locked/revealed marker for Waterfall Cave, shown after Green Lens placement.
10. Optional route-line pieces between markers.

Requirements:

- simple shapes readable at small UI sizes;
- enough spacing for cropping;
- no labels or baked text;
- visually distinct disabled/enabled button states;
- markers should feel like map symbols, not inventory items.

## UI Behavior Notes

- Map button is visible but disabled before `torn_map` is taken.
- Map button becomes enabled after `torn_map` is taken.
- Waterfall Cave marker is hidden until Green Lens placement, then appears as revealed but locked.

