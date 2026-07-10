# Sun Temple Adventure Dependency Graph

This file defines the concrete adventure logic for `sun-temple-adventure`. It follows:

- `adventure-game-reboot.md`
- `scenarios/drafts/sun-temple-adventure-plot.md`
- `scenarios/drafts/sun-temple-adventure-world-map.md`

Do not generate assets, scenario JSON, or mission JSON from this file alone. The next step after this is the prompt pack.

## Current Status

Status: first-pass dependency graph drafted with open-question decisions recorded.

Next incomplete design step: prompt pack.

## Locked Decisions Reflected Here

- First vertical slice: Base Camp, Camp Edge, Jungle Path, Broken Bridge, Village Garden.
- Map UI unlocks after the torn map is found.
- First useful travel marker unlocks after the torn map is combined with the first map piece.
- Item combining is included from the first version.
- No rival explorer.
- Full campaign uses five Sun Compass lenses.
- `camp-edge` uses inspect/move branch, not a separate tool.
- Rope alone repairs the first bridge.
- Lina reveals the first lens location and gives a hint; she does not hand the lens directly.
- `keeper-hut` begins in the second slice.
- Discovered map markers allow instant travel.
- The Green Lens is hidden under a flower pot in the village garden.
- Using rope on the bridge consumes it from inventory and leaves it visibly tied to the repaired bridge.
- For the first slice, the Sun Compass lives at Base Camp. Whether it can later be opened from the inventory/map UI will be decided after more places are defined.
- Map travel is represented by a HUD map button, not only an inventory item.
- The lost basket appears on the far side of the repaired bridge.
- The HUD map button is visible but disabled before the torn map is taken.
- Placing the Green Lens removes it from inventory to keep inventory clean.
- Adventure-critical words are allowed as non-target nouns with Bulgarian support.
- `Green Lens` remains named `Green Lens`.

## Five Lens Structure

These names are placeholders until the curriculum ledger and prop map approve them.

| Lens | Region | How it is earned | Main adventure mechanic |
| --- | --- | --- | --- |
| Green Lens | River Garden Village | Help Lina, then find the lens from her hint | give item to NPC, inspect hidden place |
| Blue Lens | Waterfall Cave | Make/use a light source and open a stone box | combine items, use item on dark entrance |
| Stone Lens | Temple Courtyard | Place symbol stones in matching slots | use inventory on hotspot |
| Mirror Lens | Inner Temple | Align the light beam | change screen state |
| Sun Lens | Sun Observatory path | Complete late map/compass route | map travel and final gate |

## First Vertical Slice: Required Flow

This is the minimum playable proof that the new game is an adventure game.

```text
base-camp-table
  inspect Sun Compass
  take torn map
  map UI unlocks with Base Camp only

camp-supply-tent
  take rope

camp-edge
  inspect fallen branch
  move branch
  take map piece
  combine torn map + map piece = valley map
  discover Jungle Path marker

jungle-path
  inspect path marker
  reach broken bridge

broken-bridge
  use rope on broken bridge
  bridge repaired
  cross to village side
  discover Village Garden marker
  take lost basket near far side

village-garden
  talk to Lina
  give lost basket to Lina
  Lina says her seeds are in the basket
  Lina gives hint: first lens is under a flower pot
  inspect flower pot
  take Green Lens

base-camp-table
  use Green Lens on Sun Compass
  compass state updates
  Green Lens reveals Waterfall Cave marker
  first slice complete
```

The first lens hiding place is the flower pot in the village garden.

## Item Registry

| Item ID | Item name | First appears | Type | Used for | Notes |
| --- | --- | --- | --- | --- | --- |
| `torn_map` | torn map | `base-camp-table` | inventory/map | combine with `map_piece_01`; unlock map UI | May be on camp table next to Sun Compass. |
| `rope` | rope | `camp-supply-tent` | inventory/tool | repair `broken_bridge` | Rope alone is enough for first bridge. |
| `map_piece_01` | map piece | `camp-edge` | inventory/map | combine with `torn_map` | Hidden under fallen branch. |
| `valley_map` | valley map | combine result | map | show discovered markers and allow instant travel | Replaces `torn_map` and `map_piece_01`. |
| `lost_basket` | basket | `broken-bridge` far side | inventory/NPC item | give to Lina | Visible but unreachable before bridge repair; holds Lina's seeds. |
| `green_lens` | Green Lens | `village-garden` | progress item | place in Sun Compass | First of five lenses. |
| `stick` | stick | second slice, likely village or jungle | inventory/combine part | combine with cloth | For light source. |
| `cloth` | cloth | second slice, likely keeper hut | inventory/combine part | combine with stick | For light source. |
| `torch` | torch | combine result | inventory/tool | light cave entrance | Could become `lamp` if we choose a less fire-like object. |
| `blue_lens` | Blue Lens | `dark-cave` | progress item | place in Sun Compass | Second lens. |
| `stone_symbol` | stone symbol | `temple-steps` | inventory/key | temple slots | Placeholder for courtyard puzzle. |
| `stone_lens` | Stone Lens | `sun-courtyard` | progress item | place in Sun Compass | Third lens. |
| `mirror_lens` | Mirror Lens | `mirror-hall` | progress item | place in Sun Compass | Fourth lens. |
| `sun_lens` | Sun Lens | `observatory-door` or final path | progress item | complete Sun Compass | Fifth lens. |
| `complete_sun_compass` | complete Sun Compass | `base-camp-table` after five lenses | progress item/state | open final observatory mechanism | Could be a state rather than inventory item. |

## Take Item Dependencies

| Item ID | Found on screen | Availability condition | Result |
| --- | --- | --- | --- |
| `torn_map` | `base-camp-table` | start | `inventory.add:torn_map`, `map.ui_unlocked=true` |
| `rope` | `camp-supply-tent` | start | `inventory.add:rope` |
| `map_piece_01` | `camp-edge` | branch moved | `inventory.add:map_piece_01` |
| `lost_basket` | `broken-bridge` far side | bridge repaired | `inventory.add:lost_basket` |
| `green_lens` | `village-garden` | Lina helped and lens hiding place inspected | `inventory.add:green_lens` |

## Inspect And State Dependencies

| Interaction | Screen | Condition | State change | Feedback purpose |
| --- | --- | --- | --- | --- |
| inspect Sun Compass | `base-camp-table` | start | `compass.inspected=true` | Establish five empty lens slots. |
| inspect fallen branch | `camp-edge` | start | none or `branch.inspected=true` | Hint that something is under it. |
| move fallen branch | `camp-edge` | branch inspected | `camp_edge.branch_moved=true` | Reveals `map_piece_01`. |
| inspect path marker | `jungle-path` | valley map made | `jungle_path.marker_seen=true` | Reinforces direction to bridge. |
| inspect flower pot | `village-garden` | Lina helped | `village.first_lens_found=true` | Reveals `green_lens`. |

## Combine Item Dependencies

| Item A | Item B | Result | Removes | Unlocks |
| --- | --- | --- | --- | --- |
| `torn_map` | `map_piece_01` | `valley_map` | `torn_map`, `map_piece_01` | `location.jungle_path.discovered=true`, first useful map marker |
| `stick` | `cloth` | `torch` | `stick`, `cloth` | Waterfall Cave entry in second slice |

The first combine action is mandatory in the vertical slice. The torch combine action is mandatory in the longer campaign but can be implemented in the second slice.

## Use Item On Hotspot Dependencies

| Inventory item | Target hotspot | Screen | Condition | Result |
| --- | --- | --- | --- | --- |
| `rope` | `broken_bridge` | `broken-bridge` | `inventory_contains:rope` | remove rope from inventory, show tied rope on bridge, `bridge.repaired=true`, unlock Village Garden path |
| `green_lens` | `sun_compass_slot_green` | `base-camp-table` | `inventory_contains:green_lens` | remove lens from inventory, show lens in compass slot, `compass.green_lens_placed=true`, reveal Waterfall Cave marker |
| `torch` | `dark_cave_entrance` | `waterfall-mouth` | `inventory_contains:torch` | `cave.lit=true`, unlock `dark-cave` |
| `blue_lens` | `sun_compass_slot_blue` | `base-camp-table` | `inventory_contains:blue_lens` | `compass.blue_lens_placed=true` |
| `stone_lens` | `sun_compass_slot_stone` | `base-camp-table` | `inventory_contains:stone_lens` | `compass.stone_lens_placed=true` |
| `mirror_lens` | `sun_compass_slot_mirror` | `base-camp-table` | `inventory_contains:mirror_lens` | `compass.mirror_lens_placed=true` |
| `sun_lens` | `sun_compass_slot_sun` | `base-camp-table` | `inventory_contains:sun_lens` | `compass.sun_lens_placed=true`, `complete_sun_compass=true` |
| `complete_sun_compass` or compass state | `observatory_pedestal` | `sun-observatory` | all five lenses placed | final mirror sequence |

Using a lens on the compass removes it from inventory and shows it as placed progress on the compass.

For the first slice, the Sun Compass is interacted with only at Base Camp. Later design may decide whether the compass can also be opened from the map/inventory UI.

## Give Item To NPC Dependencies

| Inventory item | NPC | Screen | Condition | Result |
| --- | --- | --- | --- | --- |
| `lost_basket` | `lina` | `village-garden` | Lina has asked for it | remove `lost_basket`, `lina.helped=true`, Lina has seeds again, show hint for Green Lens |

Lina should not give the Green Lens directly. Her reward is information: a short hint that points to the flower pot. The basket matters because Lina's seeds are inside it.

## Map Discovery And Travel Dependencies

| Marker | UI appears when | Marker discovered when | Instant travel condition | Destination |
| --- | --- | --- | --- | --- |
| Base Camp | `torn_map` taken | start | map UI unlocked | `base-camp-table` |
| Camp Edge | `torn_map` taken | start or first visit | map UI unlocked | `camp-edge` |
| Jungle Path | `valley_map` made | map repaired | `location.jungle_path.discovered=true` | `jungle-path` |
| Broken Bridge | `valley_map` made | first visit to bridge | `location.broken_bridge.discovered=true` | `broken-bridge` |
| Village Garden | bridge repaired | first arrival at village | `location.village_garden.discovered=true` | `village-garden` |
| Waterfall Cave | Green Lens placed | first lens lights the repaired map | marker visible, locked until light item is ready | `waterfall-mouth` |
| Temple Courtyard | cave clue found | second lens found or cave clue read | discovered | `temple-steps` |
| Inner Temple | courtyard opened | stone mechanism solved | discovered | `mirror-hall` |
| Sun Observatory | compass nearly complete | observatory door unlocked | all five lenses placed | `sun-observatory` |

Map travel uses a HUD map button. It should be blocked while a dialogue, inventory action, or reveal animation is active.

## Screen Completion Conditions

These are not "level complete" tests. They are world-state milestones.

| Screen | Milestone | Required state |
| --- | --- | --- |
| `base-camp-table` | map started | `torn_map` taken |
| `camp-edge` | path found | `valley_map` made |
| `broken-bridge` | bridge repaired | `bridge.repaired=true` |
| `village-garden` | first lens found | `green_lens` taken |
| `base-camp-table` | first lens placed | `compass.green_lens_placed=true` |

## First Vertical Slice Puzzle Graph

This graph describes dependencies, not UI.

```text
start
  -> inspect_compass
  -> take_torn_map
  -> take_rope
  -> inspect_branch
  -> move_branch
  -> take_map_piece_01
  -> combine_valley_map
  -> discover_jungle_path
  -> reach_broken_bridge
  -> use_rope_on_bridge
  -> discover_village_garden
  -> take_lost_basket
  -> talk_to_lina
  -> give_basket_to_lina
  -> inspect_flower_pot
  -> take_green_lens
  -> return_to_base_camp
  -> place_green_lens
  -> reveal_waterfall_cave_marker
  -> vertical_slice_complete
```

Parallel actions allowed:

- `take_rope` can happen before or after `take_torn_map`.
- `inspect_compass` is strongly recommended but may not need to block the whole slice.
- `talk_to_lina` can happen before `take_lost_basket`, but the basket handoff needs the item.

## Failure And Hint Rules

Wrong or early item use should not punish the child.

Examples:

- Use rope on camp table: `Not here. The rope can help on a path.`
- Try bridge without rope: `The bridge is not safe. I need a rope.`
- Talk to Lina without basket: `My basket is not here. It is near the river path.`
- Give basket to Lina: `My seeds are here. Thank you.`
- Inspect flower pot before Lina hint: `There are flowers here.`
- Use Green Lens before inspecting compass: `This lens is for the Sun Compass.`

All hint text must be reviewed in the curriculum ledger before becoming final content.

## Prop Budget Implications

Every required prop in the first vertical slice must map to a dependency:

| Prop | Reason |
| --- | --- |
| Sun Compass | central progress object and lens placement target |
| torn map | map UI unlock item |
| rope | bridge repair item |
| fallen branch | map piece blocker |
| map piece | map repair combine item |
| broken bridge | first item-use target |
| lost basket | NPC give item; visible unreachable goal across the river |
| Lina | NPC hint giver |
| flower pot | discovery target after NPC hint |
| Green Lens | first campaign progress item |
| carved sun stone | memorable clue on `jungle-path`; sun motif |

If a first-slice visual prop is not in this table, it should be treated as background scenery unless later added to the graph.

## Locked Details From User Answers

- Green Lens hiding place: flower pot, chosen because the user did not care among the options.
- Rope use: consumed from inventory, visible as part of the repaired bridge.
- Sun Compass access: Base Camp only for the first slice; revisit after more places are defined.
- Map travel UI: HUD button.
- Lost basket placement: far side of the bridge.

## Remaining Open Questions

- Should later access to the Sun Compass happen only at Base Camp or also from the HUD/map once the world grows?

## Compaction Handoff

If context is compacted, read this file after the plot and world-map files, then read `sun-temple-adventure-screen-prop-map.md`, `sun-temple-adventure-curriculum-ledger.md`, and `sun-temple-adventure-asset-plan.md`. The next step is the prompt pack under `assets/sun-temple-adventure/`. Do not generate images or JSON yet.
