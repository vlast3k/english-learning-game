# Sun Temple Adventure Screen Prop And NPC Map

This file turns the first-slice dependency graph into concrete screen requirements. It defines what must be visible, clickable, and stateful before any final art prompts or JSON are created.

Sources:

- `adventure-game-reboot.md`
- `scenarios/drafts/sun-temple-adventure-plot.md`
- `scenarios/drafts/sun-temple-adventure-world-map.md`
- `scenarios/drafts/sun-temple-adventure-dependency-graph.md`

Do not generate final drawings, scenario JSON, or mission JSON from this file yet. The prompt pack still needs to be drafted and reviewed.

## Current Status

Status: first-pass screen prop/NPC map drafted for the first vertical slice.

Next incomplete design step: prompt pack.

## First-Slice Screen Set

The first playable slice uses six screens:

1. `base-camp-table`
2. `camp-supply-tent`
3. `camp-edge`
4. `jungle-path`
5. `broken-bridge`
6. `village-garden`

No final art should be generated until the whole game is designed on paper. Rough layout sketches may be useful later, but they should stay throwaway drafts.

## Global UI Requirements

| UI element | State | Purpose | Notes |
| --- | --- | --- | --- |
| HUD map button | visible but disabled before `torn_map` is taken | opens map travel UI | User chose HUD button rather than inventory-only map. |
| Inventory bar | visible after first item | shows takeable/useable items | Needs selection state for `use item on hotspot`. |
| Translation reveal | available on English text | Bulgarian support | Keep existing hover/tap translation behavior. |
| Hint feedback | parchment-style | wrong/early item use | No red error framing. |

Map travel should be blocked while dialogue, inventory-use targeting, or reveal animation is active.

## Screen: `base-camp-table`

Purpose:

- introduce Mira, the Sun Compass, and the torn map;
- unlock map UI when `torn_map` is taken;
- later accept the Green Lens.

Required visual composition:

- safe jungle base camp clearing;
- central camp table reachable from the ground;
- one drooping sun flower near the camp table or map edge, showing the valley needs sun;
- Sun Compass large enough to read as important;
- five empty lens slots visible on or around the compass;
- torn map lying near the compass;
- Guide Mira standing beside the table, not blocking clickable props;
- exits/signals to supply tent and camp edge.

Required hotspots:

| Hotspot ID | Kind | Visible object | Default state | Later state | Interaction |
| --- | --- | --- | --- | --- | --- |
| `sun_compass` | inspect/use target | Sun Compass with sun-symbol slots | five empty slots | Green Lens placed after first slice; green light touches map | inspect; accept `green_lens` |
| `torn_map` | takeable | torn map | present on table | removed after taken | take item; unlock HUD map button |
| `mira` | NPC | Guide Mira | present | present | talk/hint |
| `exit_supply_tent` | exit | tent path/sign | available | available | walk to `camp-supply-tent` |
| `exit_camp_edge` | exit | jungle edge path/sign | available | available | walk to `camp-edge` |

State variants:

- `initial`: torn map visible, compass empty.
- `map_taken`: torn map removed, HUD map button enabled or visible.
- `green_lens_placed`: Green Lens appears in first compass slot, is removed from inventory, and green light reveals Waterfall Cave marker on the map.

Layout notes:

- Keep the compass and torn map separated enough for reliable click zones.
- Leave clean floor space for the hero near the table.
- Mira should be near the table but not on top of the compass.

## Screen: `camp-supply-tent`

Purpose:

- provide the rope;
- establish inventory item taking without a quiz.

Required visual composition:

- open canvas supply tent or simple camp shelf;
- rope coil clearly visible and clickable;
- backpack/notebook/small box should be visually quiet scenery only if present; only rope is required for gameplay in slice one;
- exit back to base camp.

Required hotspots:

| Hotspot ID | Kind | Visible object | Default state | Later state | Interaction |
| --- | --- | --- | --- | --- | --- |
| `rope` | takeable | rope coil | present | removed after taken | take item |
| `exit_base_camp` | exit | tent opening/path | available | available | walk to `base-camp-table` |

State variants:

- `rope_present`: rope coil visible.
- `rope_taken`: rope coil removed or clearly absent.

Layout notes:

- Avoid many tool-looking objects that are not usable. This screen can have atmosphere, but the rope must be the only obvious required tool.
- Do not make box/backpack/notebook look clickable unless later promoted to mechanics.

## Screen: `camp-edge`

Purpose:

- reveal the map piece under a branch;
- allow map repair by combining `torn_map` and `map_piece_01`;
- unlock the Jungle Path marker.

Required visual composition:

- edge of camp with jungle path beyond;
- fallen branch across the foreground or path edge;
- map piece partly hidden under branch before interaction;
- torn-map edge and map-piece edge should visually match when combined later;
- simple path sign or stones pointing toward jungle;
- exit back to base camp;
- exit to jungle path should be locked until `valley_map` is made.

Required hotspots:

| Hotspot ID | Kind | Visible object | Default state | Later state | Interaction |
| --- | --- | --- | --- | --- | --- |
| `fallen_branch` | inspect/state target | branch | covers map piece | moved aside | inspect, then move |
| `map_piece_01` | takeable | map piece | hidden/partly visible | takeable after branch moved; removed after taken | take item |
| `exit_base_camp` | exit | camp path | available | available | walk to `base-camp-table` |
| `exit_jungle_path` | exit | jungle path | locked | available after `valley_map` | walk to `jungle-path` |

State variants:

- `branch_blocking`: branch covers map piece.
- `branch_moved`: map piece visible.
- `map_piece_taken`: map piece removed.
- `valley_map_made`: jungle path unlocked and map marker available.

Layout notes:

- The branch must look movable, not like a permanent tree trunk.
- The map piece should be visible enough to invite inspection but still clearly blocked.

## Screen: `jungle-path`

Purpose:

- connect camp to the bridge;
- reinforce the sense of a larger world;
- introduce a path marker without adding required props.

Required visual composition:

- safe jungle trail with open walkable ground;
- stones/plants framing the path;
- carved sun stone pointing toward the river;
- a small river glow or brighter opening in the distance;
- exit back to camp edge;
- exit forward to broken bridge.

Required hotspots:

| Hotspot ID | Kind | Visible object | Default state | Later state | Interaction |
| --- | --- | --- | --- | --- | --- |
| `path_marker` | scenery | carved sun stone | present | present | inspect; optional clue |
| `exit_camp_edge` | exit | path back | available | available | walk to `camp-edge` |
| `exit_broken_bridge` | exit | river path | available | available | walk to `broken-bridge` |

State variants:

- `normal`: default path.
- `marker_seen`: optional fact only; no visual change required.

Layout notes:

- Do not overload this screen with collectibles. It is a breathing-space traversal screen for the first slice.
- Its memorable focus is the carved sun stone and river glow, not a new item.

## Screen: `broken-bridge`

Purpose:

- first clear inventory-use gate;
- consume rope from inventory;
- unlock village access;
- reveal the lost basket on the far side after bridge repair.

Required visual composition:

- small river with broken wooden bridge;
- rope posts or bridge ends that make rope use obvious;
- far side visible but unreachable before repair;
- lost basket visible on far side before bridge repair, clearly unreachable;
- exit back to jungle path;
- exit to village garden after repair.

Required hotspots:

| Hotspot ID | Kind | Visible object | Default state | Later state | Interaction |
| --- | --- | --- | --- | --- | --- |
| `broken_bridge` | use target | broken bridge | broken, unsafe | repaired with rope tied on it | accepts `rope` |
| `lost_basket` | takeable | basket | visible but unreachable until repaired | visible/takeable on far side | take item |
| `exit_jungle_path` | exit | path back | available | available | walk to `jungle-path` |
| `exit_village_garden` | exit | far path | locked | available after repair | walk to `village-garden` |

State variants:

- `bridge_broken`: no crossing; basket visible but not reachable.
- `bridge_repaired`: rope consumed from inventory, rope visibly tied to bridge, village exit available, basket reachable.
- `basket_taken`: basket removed from far side.

Layout notes:

- The repaired state should visibly explain where the rope went.
- Basket placement must be on the far side of the bridge, per user decision.
- Keep the bridge as the only obvious repair target in the screen.
- The basket should read as desirable but unreachable, not hidden.

## Screen: `village-garden`

Purpose:

- introduce Lina;
- give `lost_basket` to Lina;
- receive hint for Green Lens;
- inspect flower pot and take Green Lens.

Required visual composition:

- friendly village garden, bright and calm;
- Lina visible near a garden table or path;
- one distinctive flower pot that can hide the Green Lens;
- a small sun symbol or green shine on/near the flower pot after Lina's hint;
- a seed/flower problem that explains why Lina needs the basket;
- garden table and water pot can exist as scenery but must not outshine the flower pot;
- exit back to bridge;
- keeper hut visibility is deferred until later structure is known.

Required hotspots:

| Hotspot ID | Kind | Visible object | Default state | Later state | Interaction |
| --- | --- | --- | --- | --- | --- |
| `lina` | NPC/give target | Garden Keeper Lina | needs basket with seeds | helped after basket given | talk; accepts `lost_basket` |
| `flower_pot` | inspect/state target | flower pot | normal flowers | sun mark/green shine after Lina hint; reveals Green Lens | inspect |
| `green_lens` | takeable | Green Lens | hidden | visible after flower pot inspected with hint | take item |
| `garden_table` | scenery | table | present | present | optional inspect only |
| `water_pot` | scenery | water pot | present | present | optional inspect only |
| `exit_broken_bridge` | exit | river path | available | available | walk to `broken-bridge` |
| `exit_keeper_hut` | deferred exit | keeper hut route | deferred until later structure is known | not required in first slice | no first-slice behavior yet |

State variants:

- `lina_needs_basket`: default.
- `lina_helped`: basket removed from inventory; Lina has seeds again and gives flower pot hint.
- `flower_pot_checked`: Green Lens visible.
- `green_lens_taken`: lens removed from garden and added to inventory.

Layout notes:

- The flower pot should be near Lina but not under her sprite.
- Avoid multiple visually similar flower pots.
- Do not require keeper hut art yet; revisit when later structure is known.
- The garden should feel like a destination, not just a prize screen.

## First-Slice Prop Budget

| Prop | Screen | Must be visible | Clickable | Inventory item | State variant | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Sun Compass | `base-camp-table` | yes | yes | no | empty / Green Lens placed | central progress |
| drooping sun flower | `base-camp-table` | yes | no | no | same | shows valley problem |
| torn map | `base-camp-table` | yes until taken | yes | yes | present / taken | unlock map UI |
| Guide Mira | `base-camp-table` | yes | yes | no | same | guide/hints |
| rope | `camp-supply-tent` | yes until taken | yes | yes | present / taken | bridge repair |
| fallen branch | `camp-edge` | yes | yes | no | blocking / moved | reveals map piece |
| map piece | `camp-edge` | partly visible then visible | yes after branch moved | yes | hidden / visible / taken | map repair |
| carved sun stone | `jungle-path` | yes | yes | no | optional inspected state | memorable clue/navigation flavor |
| broken bridge | `broken-bridge` | yes | yes | no | broken / repaired with rope | inventory-use gate |
| lost basket | `broken-bridge` | yes after repair | yes | yes | unreachable / takeable / taken | item for Lina |
| Lina | `village-garden` | yes | yes | no | needs basket / helped | NPC exchange |
| flower pot | `village-garden` | yes | yes | no | normal / checked | hides Green Lens |
| Green Lens | `village-garden` | hidden then visible | yes when visible | yes | hidden / visible / taken | first lens |

Any other visible object in these screens is scenery unless this table is revised.

## NPC Placement

| NPC | Screen | Placement | Interaction radius | Notes |
| --- | --- | --- | --- | --- |
| Guide Mira | `base-camp-table` | beside camp table on walkable ground | reachable without overlapping table | Do not block Sun Compass or torn map. |
| Lina | `village-garden` | near garden table and flower pot | reachable from path | Do not stand over the flower pot or exit. |

## Exits And Walk Targets

Exact Phaser coordinates come later, after art dimensions and layout exist. These are logical requirements.

| Screen | Exit | Target screen | Availability | Visual signal |
| --- | --- | --- | --- | --- |
| `base-camp-table` | supply tent | `camp-supply-tent` | start | tent opening or supply sign |
| `base-camp-table` | camp edge | `camp-edge` | start | jungle-edge path |
| `camp-supply-tent` | base camp | `base-camp-table` | start | tent opening |
| `camp-edge` | base camp | `base-camp-table` | start | camp path |
| `camp-edge` | jungle path | `jungle-path` | after `valley_map` | path sign/stones |
| `jungle-path` | camp edge | `camp-edge` | start after entering | return path |
| `jungle-path` | bridge | `broken-bridge` | start after entering | river path |
| `broken-bridge` | jungle path | `jungle-path` | start | return path |
| `broken-bridge` | village garden | `village-garden` | after bridge repaired | far-side path |
| `village-garden` | bridge | `broken-bridge` | start after entering | river path |
| `village-garden` | keeper hut | second-slice screen | deferred | no required first-slice visual |

## State Names For Later JSON

These are suggested fact/state names. They are not final schema.

| State | Set by |
| --- | --- |
| `map.ui_unlocked` | take `torn_map` |
| `camp_edge.branch_inspected` | inspect `fallen_branch` |
| `camp_edge.branch_moved` | move `fallen_branch` |
| `inventory.has_valley_map` or `map.repaired_01` | combine `torn_map` + `map_piece_01` |
| `location.jungle_path.discovered` | map repair |
| `location.broken_bridge.discovered` | enter bridge screen |
| `bridge.repaired` | use `rope` on `broken_bridge` |
| `location.village_garden.discovered` | cross repaired bridge |
| `lina.helped` | give `lost_basket` to Lina |
| `village.flower_pot_hint_given` | Lina helped dialogue |
| `village.flower_pot_checked` | inspect flower pot after hint |
| `compass.green_lens_placed` | use `green_lens` on compass |
| `location.waterfall_cave.marker_visible` | place Green Lens in compass |

## Prompt Implications For Later

When writing asset prompts later:

- Each screen background must include the required visible props from this file.
- Avoid extra tool-like props in `camp-supply-tent`.
- Avoid extra basket-like or lens-like objects in `village-garden`.
- The bridge needs two clear visual states: broken and repaired with tied rope.
- The flower pot must be easy to identify at game resolution.
- The basket should be visible across the river before bridge repair.
- The map repair should show matching torn edges and a joined river line.
- The Green Lens placement should show green light revealing the Waterfall Cave marker.
- Add a recurring sun symbol motif on the compass, map piece, carved sun stone, bridge post, and flower pot.
- Keep walkable ground visible on every screen.
- Leave room for dialogue bubbles, inventory, and the HUD map button.

## Locked Details From User Answers

- HUD map button is visible but disabled before `torn_map` is taken.
- Placing the Green Lens removes it from the inventory to keep inventory clean.
- Keeper hut visibility is deferred until more structure is known.

## Remaining Open Questions

- Should the keeper hut be visible in the first-slice village background or saved for slice two? Revisit after later structure is defined.

## Compaction Handoff

If context is compacted, read this file after the dependency graph, then read `sun-temple-adventure-curriculum-ledger.md` and `sun-temple-adventure-asset-plan.md`. The first-slice prop/NPC map, curriculum ledger, and asset plan are drafted. The next step is prompt files, not image generation. Do not create assets, scenario JSON, or mission JSON yet.
