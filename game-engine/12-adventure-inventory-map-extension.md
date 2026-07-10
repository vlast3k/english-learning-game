# 12. Adventure Inventory And Map Extension

## Purpose

The next game should reuse the existing Phaser/data-driven engine, but it needs stronger classic adventure-game behavior than the current collectible quiz flow.

This note captures the likely reusable engine extension before any new campaign JSON is generated.

## Current Engine Strengths

The current engine already supports:

- data-driven scenarios;
- hotspot clicks;
- guide/NPC dialogue;
- inventory-like learned item display;
- translation reveal;
- ECA rules;
- persistent campaign facts;
- scene transitions;
- locked exits;
- validation and browser tests.

These are good foundations for an adventure-first campaign.

## Gap

The current flow is mostly:

```text
click hotspot -> answer challenge -> receive item -> talk to guide -> unlock exit
```

The new game needs:

```text
inspect -> take item -> use/give/combine item -> change screen state -> discover map marker -> travel/revisit
```

The challenge should be adventure reasoning, not grammar-question correctness.

## Proposed Domain Events

Add or standardize these events:

- `hotspot.inspected`
- `item.taken`
- `inventory.item_selected`
- `inventory.item_used_on_hotspot`
- `inventory.item_given_to_npc`
- `inventory.items_combined`
- `npc.talked`
- `location.discovered`
- `location.travel_requested`
- `location.entered`
- `screen.state_changed`

Payload examples:

```json
{
  "type": "inventory.item_used_on_hotspot",
  "item": "rope",
  "target": "broken_bridge",
  "screen": "jungle-river-west"
}
```

```json
{
  "type": "inventory.item_given_to_npc",
  "item": "fruit",
  "npc": "hungry_monkey",
  "screen": "monkey-tree"
}
```

## Proposed Conditions

The current condition whitelist already covers many needs:

- `fact`
- `inventory_contains`
- `inventory_missing`
- `puzzle`
- `all`
- `any`
- `not`

Likely additions:

```json
{ "location_discovered": "river-crossing" }
{ "location_unlocked": "river-crossing" }
{ "current_screen": "base-camp" }
{ "screen_state": "bridge_repaired", "equals": true }
```

These can also be represented as facts if we want to keep the runtime smaller:

```json
{ "fact": "location.river_crossing.discovered", "equals": true }
{ "fact": "screen.jungle_river.bridge_repaired", "equals": true }
```

Recommendation: use facts first, then add dedicated condition helpers only if JSON becomes hard to read.

## Proposed Actions

State actions:

- `inventory.add`
- `inventory.remove`
- `inventory.replace`
- `fact.set`
- `location.discover`
- `location.unlock`
- `screen.state.set`

Presentation actions:

- `dialog.show`
- `ui.status.set`
- `ui.toast`
- `ui.inventory.select`
- `ui.inventory.clear_selection`
- `ui.map.show_marker`
- `ui.map.open`
- `hotspot.refresh`
- `screen.refresh`

Flow actions:

- `scene.transition`
- `map.travel`
- `event.emit`
- `campaign.complete`

`location.discover`, `location.unlock`, and `screen.state.set` may initially compile to `fact.set` plus bridge refreshes.

## Scenario JSON Shape Ideas

Future scenario content should distinguish between:

- scenery hotspots;
- takeable item hotspots;
- use targets;
- NPCs;
- exits;
- map markers.

Current Sun Temple convention:

- Adventure content uses `npcs`, not `guide`.
- The existing Phaser implementation still has one legacy guide actor internally; for now the primary NPC is mapped onto that actor.
- Existing non-adventure content may continue to use `guide`.
- Add true multi-NPC rendering before relying on more than one visible NPC on a screen.

Possible shape:

```json
{
  "hotspots": [
    {
      "id": "old_rope",
      "kind": "takeable",
      "label": "rope",
      "item_id": "rope",
      "text": "This is an old rope.",
      "text_bg": "Това е старо въже.",
      "position": { "x": 240, "y": 420 },
      "radius": 42
    },
    {
      "id": "broken_bridge",
      "kind": "use_target",
      "label": "broken bridge",
      "accepts": ["rope"],
      "text": "The bridge is broken.",
      "text_bg": "Мостът е счупен."
    }
  ],
  "npcs": [
    {
      "id": "guide_mira",
      "name": "Mira",
      "position": { "x": 720, "y": 430 },
      "dialogue": "mira_start"
    }
  ],
  "map": {
    "current_location": "base-camp",
    "markers": []
  }
}
```

The exact schema should be finalized only after the campaign dependency graph is written.

## Mission JSON Pattern

Using an item on a target:

```json
{
  "id": "repair-bridge-with-rope",
  "once": true,
  "event": {
    "type": "inventory.item_used_on_hotspot",
    "target": "broken_bridge"
  },
  "condition": {
    "inventory_contains": "rope"
  },
  "actions": [
    { "type": "inventory.remove", "item": "rope" },
    { "type": "fact.set", "fact": "screen.jungle_river.bridge_repaired", "value": true },
    { "type": "location.unlock", "location": "temple_steps" },
    { "type": "dialog.show", "speaker": "Alex", "text": "The bridge is safe now." },
    { "type": "screen.refresh" }
  ]
}
```

Giving an item to an NPC:

```json
{
  "id": "give-fruit-to-monkey",
  "once": true,
  "event": {
    "type": "inventory.item_given_to_npc",
    "npc": "hungry_monkey"
  },
  "condition": {
    "inventory_contains": "fruit"
  },
  "actions": [
    { "type": "inventory.remove", "item": "fruit" },
    { "type": "inventory.add", "item": "small_key" },
    { "type": "dialog.show", "speaker": "Monkey", "text": "Thank you!" }
  ]
}
```

Combining items:

```json
{
  "id": "make-torch",
  "once": true,
  "event": {
    "type": "inventory.items_combined",
    "items": ["stick", "cloth"]
  },
  "actions": [
    { "type": "inventory.remove", "item": "stick" },
    { "type": "inventory.remove", "item": "cloth" },
    { "type": "inventory.add", "item": "torch" },
    { "type": "ui.toast", "text": "You made a torch." }
  ]
}
```

## Map Travel Pattern

Map travel should be unlocked by discovery.

```json
{
  "id": "discover-river-crossing",
  "once": true,
  "event": {
    "type": "location.entered",
    "target": "river-crossing"
  },
  "actions": [
    { "type": "fact.set", "fact": "location.river_crossing.discovered", "value": true },
    { "type": "ui.map.show_marker", "location": "river-crossing" }
  ]
}
```

```json
{
  "id": "travel-to-river-crossing",
  "event": {
    "type": "location.travel_requested",
    "target": "river-crossing"
  },
  "condition": {
    "fact": "location.river_crossing.discovered",
    "equals": true
  },
  "actions": [
    {
      "type": "scene.transition",
      "scenario": "scenarios/<campaign-id>-river-crossing-content.json"
    }
  ]
}
```

## Validation Requirements

The validator should eventually check:

- every takeable hotspot has an `item_id`;
- every inventory item is defined once in an item registry;
- every `accepts` item exists;
- every give/combine rule references known items and NPCs;
- no required prop exists only in art notes without a hotspot or state purpose;
- map markers have valid destination scenarios;
- no unreachable screen is required for campaign completion;
- all player-visible English text passes the curriculum boundary review.

## Browser Smoke-Test Requirements

The first vertical slice should verify:

- take an item;
- select inventory item;
- use item on hotspot;
- give item to NPC;
- combine two items;
- unlock a new map marker;
- travel through the map;
- revisit an old screen with changed state;
- translation reveal still works;
- no grammar quiz is required for progression.

## Implementation Rule

Do not implement this extension until the campaign plot, world map, dependency graph, screen list, and prop/NPC map are drafted. The schema should serve the designed adventure, not the other way around.
