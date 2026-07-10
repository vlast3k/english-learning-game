# Sun Temple Adventure Slice 03 Screen Prop And NPC Map

This file turns the Temple Steps dependency graph into screen requirements. The reviewed prompt pack is derived from this file; later prompt changes must preserve its dependency rules.

## Current Status

Status: implemented in the two slice-three scenario files. Hotspot coordinates and radii were aligned by the user and are locked for normal polish work.

## Global Requirements

- Reuse the current HUD map and inventory.
- No new visible NPC is required.
- Keep the new prop budget very small: cup, water cup, channel, gate, sun flower, Stone Lens.
- The Temple Steps must be warm, open-air, and safe. It is an invitation to explore, not a threatening ruin.
- Make water movement the clear state change, without adding text written into the painting.

## Screen: `temple-steps`

Purpose:

- make the Temple Steps marker feel earned;
- present a single water problem;
- provide the stone cup;
- open the route to Sun Courtyard.

Required composition:

- broad sunlit steps leading to a fixed, front-facing stone arch;
- visible dry channel carved with a simple sun motif, running in mostly straight unobstructed segments from foreground cup rest through the arch and visibly toward the courtyard;
- one low, flat, empty circular cup rest with a small sun motif at the start of the channel;
- clear walkable foreground and a route back to the map;
- no many doors, keys, cups, statues, weapons, or unreadable temple writing.

| Hotspot ID | Kind | Object | State / interaction |
| --- | --- | --- | --- |
| `sun_channel` | use target | dry carved water channel | inspect; accepts water cup; then flows |
| `stone_cup` | takeable | one empty stone cup | present, then removed |
| `exit_sun_courtyard` | exit | opened gate | hidden until channel filled |
| `exit_map_path` | exit | steps/path back | always available |

State variants:

- `channel_dry`, opaque closed-gate overlay in the fixed arch footprint;
- `channel_flowing`, opaque open-gate overlay and three visible water segments continuing toward the courtyard;
- cup taken.

## Reused Screen: `waterfall-mouth`

New purpose:

- turn the waterfall into a useful return destination.

| Hotspot ID | Kind | Object | State / interaction |
| --- | --- | --- | --- |
| `waterfall_pool` | use target | calm shallow pool | accepts stone cup; makes water cup |

The pool should be visually part of the existing water, not a separate new shiny object. Its calm fillable edge must be clear enough to read after the cup is taken; do not make the target a pixel hunt.

## Screen: `sun-courtyard`

Purpose:

- reward the return journey;
- show water as a visible cause;
- reveal the Stone Lens from one strong central object.

Required composition:

- warm open courtyard just beyond the gate;
- stone sun flower in the centre, supplied by a visibly flowing channel;
- already-open flower holds one visibly glinting Stone Lens with a warm ochre/sandstone rim and clean circular sun silhouette; it must not read as a coin;
- only one path back to Temple Steps and enough quiet foreground for hero movement;
- no extra loose props that look useful.

| Hotspot ID | Kind | Object | State / interaction |
| --- | --- | --- | --- |
| `stone_lens` | takeable | Stone Lens in open flower | visible on arrival; removed after taking |
| `exit_temple_steps` | exit | open gate/path | always available |

State variants:

- flower open / lens visible on arrival, because this screen cannot be entered until the water action has opened the gate;
- lens taken, flower remains open.

## Reused Screen: `base-camp-table`

New requirements:

- Sun Compass accepts `stone_lens`.
- Stone Lens overlay appears after placement.
- Mirror Hall marker appears as a locked forward hook.

## Slice-Three Prop Budget

| Prop | Screen | Visible | Clickable | Inventory | State role |
| --- | --- | --- | --- | --- | --- |
| stone cup | Temple Steps | yes | yes | yes | present / removed |
| waterfall pool | Waterfall Mouth | yes | yes | no | fill target |
| water cup | inventory only | no | no | yes | crafted / consumed |
| sun channel | Temple Steps | yes | yes | no | dry / flowing |
| stone gate | Temple Steps | yes | no | no | closed / open |
| stone sun flower | Sun Courtyard | yes | no | no | open |
| Stone Lens | Sun Courtyard | visible on arrival | yes | yes | visible / removed |
| compass Stone Lens | Base Camp | after placement | no | no | persistent progress |

## Art False-Lead Rules

- no more than one cup;
- no loose keys, coins, ropes, gems, tools, or extra lenses;
- no skulls, weapons, traps, ruins that look dangerous, or readable inscriptions;
- no decorative mirrors yet; Mirror Hall is only a map hook in this slice.
