# Sun Temple Adventure Engine Integration Plan

This is the technical bridge between the drafted first slice and the existing Phaser/data-driven runtime.

Sources:

- `adventure-game-reboot.md`
- `scenarios/drafts/sun-temple-adventure-next-steps.md`
- `scenarios/drafts/sun-temple-adventure-dependency-graph.md`
- `scenarios/drafts/sun-temple-adventure-screen-prop-map.md`
- `scenarios/drafts/sun-temple-adventure-curriculum-ledger.md`
- `scenarios/drafts/sun-temple-adventure-asset-plan.md`
- `game-engine/12-adventure-inventory-map-extension.md`
- current runtime files: `phaser-game.js`, `phaser-content.js`, `game-engine/runtime.js`, `game-engine/phaser-bridge.js`

## Current Status

Status: first-pass integration plan drafted and initial implementation completed.

Current follow-up: tune the first slice visually, then design the second slice dependency graph before generating more art.

Schema note:

- Sun Temple adventure screens should use `npcs` for characters such as Mira and Lina.
- The legacy `guide` field is still supported for existing learning/Bond content.
- The current adventure runtime maps the primary `npcs[0]` character onto the existing guide actor; true multi-NPC rendering should be added before designing a screen with multiple visible NPCs.

Slice-two note:

- Waterfall Cave design and first-pass art now exist.
- New screens planned: `keeper-hut`, `waterfall-mouth`, `dark-cave`.
- New chain: `empty_jar + glow_leaf -> glow_jar -> light cave -> stone_key -> blue_stone_box -> blue_lens -> Sun Compass`.
- Next engine/content task is scenario JSON, crop frames, mission rules, and browser smoke extension for slice two.

## Implementation Goal

Build only the first playable slice:

```text
base-camp-table
camp-supply-tent
camp-edge
jungle-path
broken-bridge
village-garden
```

The slice must prove:

- item taking without grammar quizzes;
- inventory selection;
- item combining;
- using an inventory item on a screen hotspot;
- giving an inventory item to an NPC;
- screen state changes;
- HUD map button disabled/enabled;
- map travel to discovered locations;
- placing the Green Lens in the Sun Compass;
- keeping Bulgarian reveal/hint support.

Do not implement later regions yet.

## Conservative Architecture Choice

Use six normal scenario content files, not a brand-new multi-screen scene system.

Reason:

- the current Phaser page already loads one scenario by URL;
- `game-engine/runtime.js` persists shared campaign state through `storage_key`;
- `scene.transition` already changes the scenario URL;
- one scenario per screen gives simple browser-test entry points;
- this avoids rewriting the scene loader before we know the adventure loop works.

Create:

```text
scenarios/sun-temple-adventure-base-camp-table-content.json
scenarios/sun-temple-adventure-camp-supply-tent-content.json
scenarios/sun-temple-adventure-camp-edge-content.json
scenarios/sun-temple-adventure-jungle-path-content.json
scenarios/sun-temple-adventure-broken-bridge-content.json
scenarios/sun-temple-adventure-village-garden-content.json
```

Create matching mission manifests:

```text
game-engine/missions/sun-temple-adventure-base-camp-table.json
game-engine/missions/sun-temple-adventure-camp-supply-tent.json
game-engine/missions/sun-temple-adventure-camp-edge.json
game-engine/missions/sun-temple-adventure-jungle-path.json
game-engine/missions/sun-temple-adventure-broken-bridge.json
game-engine/missions/sun-temple-adventure-village-garden.json
```

All manifests must use:

```json
{
  "campaign_id": "sun-temple-adventure",
  "storage_key": "english-game:sun-temple-adventure"
}
```

This lets each screen have local interaction rules while sharing inventory, facts, and fired rules.

## State Model

Use facts first. Do not add dedicated condition syntax until facts become hard to read.

Core first-slice facts:

```text
compass.inspected
map.ui_unlocked
camp_edge.branch_inspected
camp_edge.branch_moved
map.valley_map_made
location.base_camp.discovered
location.camp_supply_tent.discovered
location.camp_edge.discovered
location.jungle_path.discovered
location.broken_bridge.discovered
location.village_garden.discovered
location.waterfall_cave.revealed
bridge.repaired
lina.talked
lina.asked_for_basket
lina.helped
village.flower_pot_checked
compass.green_lens_placed
slice.green_lens_complete
```

Inventory item IDs:

```text
torn_map
rope
map_piece_01
valley_map
lost_basket
green_lens
```

Use `inventory.remove` and `inventory.add` instead of adding `inventory.replace` for the first pass.

## Runtime Support Already Present

`game-engine/runtime.js` already supports:

- persistent facts;
- persistent inventory;
- puzzle graph nodes;
- conditions: `fact`, `inventory_contains`, `inventory_missing`, `puzzle`, `all`, `any`, `not`, `event`;
- actions: `fact.set`, `inventory.add`, `inventory.remove`, `inventory.clear`, `puzzle.complete`, `dialog.show`, `ui.status.set`, `ui.toast`, `scene.transition`;
- event history and debug overlay.

`game-engine/phaser-bridge.js` already supports:

- loading mission manifests per scenario;
- emitting existing events;
- showing engine-driven dialog;
- changing scenario with `scene.transition`;
- refreshing exit markers;
- showing/hiding hotspots based on `visible_when` and `hidden_when`.

## Minimum Runtime Extensions

Add these without breaking existing James Bond content.

### 1. Adventure Hotspot Kinds

Extend data-driven hotspot handling for these `kind` values:

```text
inspect
takeable
state_target
use_target
exit
scenery
```

Initial behavior:

- `inspect`: walk to hotspot, emit `hotspot.inspected`.
- `takeable`: walk to hotspot, emit `item.taken`.
- `state_target`: walk to hotspot, emit `hotspot.inspected` or a configured `event`.
- `use_target`: if an inventory item is selected, emit `inventory.item_used_on_hotspot`; otherwise inspect/show hint.
- `scenery`: keep current scenery bubble behavior.
- `exit`: emit `exit.reached` or transition through configured rule.

James Bond hotspots without these kinds should keep the old quiz/retrieve path.

### 2. Adventure Inventory Selection

Current inventory uses `learnedWords` as the visual item list. Keep the underlying array for compatibility, but add explicit adventure selection state:

```text
selectedInventoryItemId
```

Clicking an inventory item in adventure mode should:

- select/deselect the item;
- visually highlight the selected slot;
- set command text such as `Use rope with...`;
- emit `inventory.item_selected`;
- not immediately open the old inventory detail bubble unless the item is clicked again or a detail command exists.

Adventure mode can be enabled by content:

```json
{
  "gameplay_mode": "adventure"
}
```

### 3. Item Use On Hotspot

When `selectedInventoryItemId` exists and the player clicks a compatible target:

```json
{
  "type": "inventory.item_used_on_hotspot",
  "item": "rope",
  "target": "broken_bridge",
  "screen": "broken-bridge"
}
```

If the item is wrong, emit the same event and let a rule show a gentle hint, or show a fallback dialog from the hotspot config.

After a successful use, clear selection.

### 4. Item Giving To NPC

Use the existing single-guide/NPC slot per scenario at first:

- Mira is the guide actor in `base-camp-table`.
- Lina is the guide actor in `village-garden`.

When an inventory item is selected and the player clicks the guide/NPC:

```json
{
  "type": "inventory.item_given_to_npc",
  "item": "lost_basket",
  "npc": "lina",
  "screen": "village-garden"
}
```

If no inventory item is selected, emit:

```json
{
  "type": "npc.talked",
  "target": "lina"
}
```

Keep old guide quiz behavior for non-adventure content.

### 5. Item Combining

For the first pass, implement simple inventory-to-inventory combining:

- select `torn_map`;
- click `map_piece_01` inventory slot;
- emit `inventory.items_combined` with normalized sorted item IDs.

Event payload:

```json
{
  "type": "inventory.items_combined",
  "items": ["map_piece_01", "torn_map"],
  "primary": "torn_map",
  "secondary": "map_piece_01"
}
```

The rule removes both and adds `valley_map`.

### 6. HUD Map Button And Map Panel

Add an adventure HUD map button to Phaser only when `contentModel.map` or `gameplay_mode: "adventure"` is present.

States:

- visible but disabled before `map.ui_unlocked`;
- enabled after `map.ui_unlocked`;
- shows discovered markers;
- shows revealed locked Waterfall Cave marker after `location.waterfall_cave.revealed`;
- closes cleanly without changing scene.

Map marker click emits:

```json
{
  "type": "location.travel_requested",
  "target": "broken-bridge"
}
```

Use mission rules to transition to the destination scenario only when the discovered fact is true.

### 7. Refresh Actions

Add these `ActionExecutor` action cases:

```text
hotspot.refresh -> bridge.refreshHotspots()
screen.refresh -> bridge.refreshScreenState()
ui.map.refresh -> bridge.refreshMap()
ui.inventory.clear_selection -> bridge.clearInventorySelection()
```

The first pass can make `refreshScreenState()` call:

- `refreshEngineHotspots()`;
- `refreshEngineExitMarker()`;
- overlay visibility refresh;
- map refresh.

### 8. Overlay Sprites

Add content support for stateful overlays:

```json
{
  "overlays": [
    {
      "id": "rope_tied_bridge",
      "texture": "propAtlas",
      "frame": "rope_tied_bridge",
      "x": 510,
      "y": 350,
      "visible_when": { "fact": "bridge.repaired", "equals": true }
    }
  ]
}
```

For implementation speed, overlays may use full atlas textures with manual crop frames defined in content or an asset manifest.

## Content Schema Additions

Use these fields in Sun Temple scenario JSON. They should be optional and safe for existing content.

```json
{
  "gameplay_mode": "adventure",
  "assets": {
    "background": "assets/sun-temple-adventure/base-camp-table/generated/background-v1.png",
    "prop_atlas": "assets/sun-temple-adventure/shared/generated/prop-state-atlas-v1.png",
    "map_ui": "assets/sun-temple-adventure/ui-map/generated/map-ui-v1.png"
  },
  "inventory_items": {
    "rope": {
      "label": "rope",
      "english": "rope",
      "bg": "въже",
      "icon": { "texture": "propAtlas", "frame": "rope_coil" }
    }
  },
  "map": {
    "button": { "visible": true, "enabled_when": { "fact": "map.ui_unlocked", "equals": true } },
    "markers": [
      {
        "id": "base-camp-table",
        "label": "Base Camp",
        "destination": "scenarios/sun-temple-adventure-base-camp-table-content.json",
        "visible_when": { "fact": "location.base_camp.discovered", "equals": true },
        "enabled_when": { "fact": "location.base_camp.discovered", "equals": true }
      }
    ]
  },
  "overlays": [],
  "hotspots": []
}
```

## First-Slice Mission Rule Sketch

Use rules like these; exact text should come from the curriculum ledger.

### Take Torn Map

```json
{
  "id": "take-torn-map",
  "once": true,
  "event": { "type": "item.taken", "target": "torn_map" },
  "actions": [
    { "type": "inventory.add", "item": "torn_map" },
    { "type": "fact.set", "fact": "map.ui_unlocked", "value": true },
    { "type": "fact.set", "fact": "location.base_camp.discovered", "value": true },
    { "type": "fact.set", "fact": "location.camp_edge.discovered", "value": true },
    { "type": "ui.toast", "text": "The map is open." },
    { "type": "screen.refresh" }
  ]
}
```

### Combine Map

```json
{
  "id": "combine-valley-map",
  "once": true,
  "event": { "type": "inventory.items_combined" },
  "condition": {
    "all": [
      { "event": "items.0", "equals": "map_piece_01" },
      { "event": "items.1", "equals": "torn_map" },
      { "inventory_contains": "torn_map" },
      { "inventory_contains": "map_piece_01" }
    ]
  },
  "actions": [
    { "type": "inventory.remove", "item": "torn_map" },
    { "type": "inventory.remove", "item": "map_piece_01" },
    { "type": "inventory.add", "item": "valley_map" },
    { "type": "fact.set", "fact": "map.valley_map_made", "value": true },
    { "type": "fact.set", "fact": "location.jungle_path.discovered", "value": true },
    { "type": "ui.toast", "text": "This is the map." },
    { "type": "screen.refresh" }
  ]
}
```

### Repair Bridge

```json
{
  "id": "repair-bridge",
  "once": true,
  "event": { "type": "inventory.item_used_on_hotspot", "target": "broken_bridge" },
  "condition": { "inventory_contains": "rope" },
  "actions": [
    { "type": "inventory.remove", "item": "rope" },
    { "type": "fact.set", "fact": "bridge.repaired", "value": true },
    { "type": "fact.set", "fact": "location.village_garden.discovered", "value": true },
    { "type": "dialog.show", "speaker": "Alex", "text": "The bridge is safe now.", "bg": "Мостът вече е безопасен." },
    { "type": "screen.refresh" }
  ]
}
```

### Give Basket To Lina

```json
{
  "id": "give-basket-to-lina",
  "once": true,
  "event": { "type": "inventory.item_given_to_npc", "target": "lina" },
  "condition": { "inventory_contains": "lost_basket" },
  "actions": [
    { "type": "inventory.remove", "item": "lost_basket" },
    { "type": "fact.set", "fact": "lina.helped", "value": true },
    { "type": "dialog.show", "speaker": "Lina", "text": "My seeds are here. Thank you.", "bg": "Семената ми са тук. Благодаря." },
    { "type": "screen.refresh" }
  ]
}
```

### Place Green Lens

```json
{
  "id": "place-green-lens",
  "once": true,
  "event": { "type": "inventory.item_used_on_hotspot", "target": "sun_compass" },
  "condition": { "inventory_contains": "green_lens" },
  "actions": [
    { "type": "inventory.remove", "item": "green_lens" },
    { "type": "fact.set", "fact": "compass.green_lens_placed", "value": true },
    { "type": "fact.set", "fact": "location.waterfall_cave.revealed", "value": true },
    { "type": "fact.set", "fact": "slice.green_lens_complete", "value": true },
    { "type": "dialog.show", "speaker": "Mira", "text": "The cave is on the map.", "bg": "Пещерата е на картата." },
    { "type": "screen.refresh" }
  ]
}
```

## Asset Integration Plan

Use the accepted generated art as first implementation assets.

Backgrounds:

```text
assets/sun-temple-adventure/base-camp-table/generated/background-v1.png
assets/sun-temple-adventure/camp-supply-tent/generated/background-v1.png
assets/sun-temple-adventure/camp-edge/generated/background-v1.png
assets/sun-temple-adventure/jungle-path/generated/background-v1.png
assets/sun-temple-adventure/broken-bridge/generated/background-broken-v1.png
assets/sun-temple-adventure/village-garden/generated/background-v1.png
```

Shared sheets:

```text
assets/sun-temple-adventure/shared/generated/prop-state-atlas-v1.png
assets/sun-temple-adventure/shared/generated/npc-mira-v1.png
assets/sun-temple-adventure/shared/generated/npc-lina-v1.png
assets/sun-temple-adventure/ui-map/generated/map-ui-v1.png
```

Asset frame manifest:

```text
assets/sun-temple-adventure/shared/generated/asset-frames-v1.json
```

This manifest lists frame rectangles for `prop-state-atlas-v1.png`, `npc-mira-v1.png`, `npc-lina-v1.png`, and `map-ui-v1.png`.

Mira and Lina are usable as static full-body NPCs for the first slice. Dedicated NPC walk cycles are not required yet.

## Screen Content Plan

Keep hotspots sparse and directly tied to the dependency graph.

| Screen | Core hotspots | Notes |
| --- | --- | --- |
| `base-camp-table` | `sun_compass`, `torn_map`, `exit_supply_tent`, `exit_camp_edge`, Mira guide | `torn_map` hides after inventory add; `sun_compass` accepts `green_lens`. |
| `camp-supply-tent` | `rope`, `exit_base_camp` | only one obvious item. |
| `camp-edge` | `fallen_branch`, `map_piece_01`, `exit_base_camp`, `exit_jungle_path` | `map_piece_01` visible only after branch moved; jungle exit locked until `valley_map`. |
| `jungle-path` | `path_marker`, `exit_camp_edge`, `exit_broken_bridge` | traversal screen, no inventory item. |
| `broken-bridge` | `broken_bridge`, `lost_basket`, `exit_jungle_path`, `exit_village_garden` | basket visible but disabled/unreachable until `bridge.repaired`. |
| `village-garden` | `flower_pot`, `green_lens`, `exit_broken_bridge`, Lina guide | `green_lens` visible only after `lina.helped` and `village.flower_pot_checked`. |

## Browser Smoke Test Plan

Add a new test after the first implementation, probably:

```text
tools/sun-temple-smoke-test.mjs
```

Required assertions:

- loads `base-camp-table` background;
- map button visible and disabled at start;
- taking `torn_map` enables map button;
- taking `rope` adds inventory slot;
- moving branch reveals `map_piece_01`;
- combining map items replaces them with `valley_map`;
- map panel shows discovered Jungle Path marker;
- bridge blocks progress before rope;
- using rope repairs bridge and removes rope;
- basket becomes takeable after bridge repair;
- giving basket to Lina removes basket and sets `lina.helped`;
- flower pot reveals Green Lens after Lina is helped;
- placing Green Lens removes it from inventory;
- Waterfall Cave marker appears locked;
- translation reveal still works in at least one adventure dialog.

## Recommended Implementation Order

1. Add optional adventure fields to content loading/preload:
   - `gameplay_mode`;
   - `assets.prop_atlas`;
   - `assets.map_ui`;
   - `inventory_items`;
   - `overlays`;
   - `map`.
2. Add adventure inventory selection without changing old inventory behavior for non-adventure scenarios.
3. Add adventure hotspot event emission.
4. Add map HUD/panel.
5. Add runtime action cases for refresh and selection clearing.
6. Create the six scenario JSON files.
7. Create the six mission JSON files.
8. Wire first scenario into `scenarios/index.json` only if we want it to become the default during development; otherwise test via `?scenario=...`.
9. Run syntax and browser smoke tests.

## Risks And Guardrails

- Do not convert all old collectible quizzes to adventure hotspots; gate adventure behavior behind `gameplay_mode: "adventure"`.
- Do not remove `learnedWords` yet; too much UI code depends on it.
- Do not add grammar-question gates to Sun Temple content.
- Do not create decorative hotspots for props that have no dependency.
- Keep map travel disabled during active dialogue or active inventory targeting.
- Use facts for screen state before inventing new condition helpers.
- Reuse current scene transition behavior before building an in-memory multi-screen router.

## Compaction Handoff

If context is compacted again, read this file after `sun-temple-adventure-next-steps.md`. The next concrete task is a dedicated full Sun Temple browser smoke test and playthrough tuning.

Implementation note:

- The smallest runtime extension pass has been implemented behind `gameplay_mode: "adventure"`.
- Scenario files exist for all six first-slice screens.
- A shared mission manifest exists at `game-engine/missions/sun-temple-adventure-slice-01.json`.
- Targeted browser checks passed for base load, map taking, map panel, transition to supply tent, and rope taking.
- The next task is not more architecture. It is full playthrough smoke coverage and coordinate/state polish.
