# 08. Picture Inventory

Collected items now enter the HUD inventory as picture slots instead of text labels.
Inventory icons are HUD/UI assets only. The scene should not reuse collectible inventory crops as foreground sprites on top of objects that are already painted into the background.

## What Changed

When a collectible is retrieved, `updateInventory()` rebuilds the inventory row from collected hotspot ids. Each slot shows an image, has a full hit plate, and keeps the old text-only state only for the empty inventory message.

Hovering a slot shows the collectible label in a parchment tooltip. Clicking a slot opens the same Phaser parchment dialogue used elsewhere, with body text rendered through `createRevealTextFlow`, so English words keep the normal Bulgarian hover reveal behavior.

## Icon Sources

The runtime resolves inventory art in this order:

1. `hotspot.inventory.icon` or `hotspot.icon` crop metadata.
2. A crop from the active scene background around the hotspot position.
3. A small engine-drawn fallback symbol for known item families.

This resolution is only for the inventory row and inventory detail affordance. In-world hotspot art should come from the painted background unless the hotspot explicitly defines `scene_icon` for a separate cue, such as an exit sign or scenery marker.

Scenario-specific prop sheets can be loaded through:

```json
{
  "assets": {
    "interactive_props": "assets/example/generated/interactive-props.png"
  }
}
```

Collectibles can then point at a crop:

```json
{
  "inventory": {
    "icon": {
      "texture": "interactiveProps",
      "frame": { "x": 0, "y": 0, "width": 320, "height": 320 }
    },
    "detail": {
      "text": "An agent badge is ready on the wall. It needs your name.",
      "bg": "Агентска значка е готова на стената. Тя има нужда от твоето име."
    }
  }
}
```

`assets.inventory_icons` is also supported and loads as the `inventoryIcons` texture key.

## Detail Text

If `inventory.detail` is missing, the detail bubble reuses the collectible intro text and Bulgarian translation. This keeps existing content valid while allowing future scenes to add richer inspection text.

## Validation

`tools/validate-game-content.mjs` validates optional `inventory.detail` strings and optional `inventory.icon.frame` crop metadata. Inventory detail English text is included in hover-translation coverage when provided.

The browser smoke test now verifies:

- collected inventory entries render as image slots
- hovering a slot shows the item label
- clicking a slot opens a translatable detail bubble
- `inventory-pictures.png` is captured for visual review
