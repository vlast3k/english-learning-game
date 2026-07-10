# Sun Temple Adventure Slice 02 Dependency Graph

This file defines the adventure logic for the Waterfall Cave slice.

Source plot: `scenarios/drafts/sun-temple-adventure-slice-02-plot.md`

## Current Status

Status: first-pass dependency graph drafted.

Do not generate scenario JSON from this file alone. Use it with the screen/prop map and asset plan.

## Entry Requirements

Slice two starts after:

```text
compass.green_lens_placed = true
location.waterfall_cave.revealed = true
slice.green_lens_complete = true
```

The player may reach the new content by:

- HUD map marker to `waterfall-mouth` if the marker is visible;
- walking from `village-garden` to `keeper-hut`;
- later walking or map travel between discovered slice-two places.

## New Facts

```text
location.keeper_hut.discovered
location.waterfall_mouth.discovered
location.dark_cave.discovered
location.temple_steps.revealed
item.empty_jar.taken
item.glow_leaf.taken
item.stone_key.taken
item.blue_lens.taken
craft.glow_jar_made
waterfall.cave_lit
dark_cave.wall_checked
dark_cave.box_open
compass.blue_lens_placed
slice.blue_lens_complete
```

## New Inventory Items

| Item ID | Name | Source | Removed by |
| --- | --- | --- | --- |
| `empty_jar` | empty jar | `keeper-hut` | combine into `glow_jar` |
| `glow_leaf` | glow leaf | `waterfall-mouth` | combine into `glow_jar` |
| `glow_jar` | glow jar | combine result | kept after cave entry for light, may remain visible as tool |
| `stone_key` | stone key | `dark-cave` after wall check | use on `blue_stone_box` |
| `blue_lens` | Blue Lens | `dark-cave` after box opens | place in Sun Compass |

Recommendation: keep `glow_jar` in inventory after lighting the cave for now. It can support later cave hint text and avoids a confusing disappearance. The cave-lit fact controls entry.

## Required Flow

```text
base-camp-table
  Green Lens already placed
  Waterfall Cave marker visible

village-garden
  optional Lina reminder
  exit_keeper_hut available after Lina helped

keeper-hut
  take empty_jar
  discover keeper hut marker

waterfall-mouth
  inspect dark_cave_entrance
  take glow_leaf
  combine empty_jar + glow_leaf = glow_jar
  use glow_jar on dark_cave_entrance
  cave_lit=true
  unlock dark-cave

dark-cave
  inspect cave_wall
  reveal/take stone_key
  use stone_key on blue_stone_box
  box_open=true
  take blue_lens

base-camp-table
  use blue_lens on Sun Compass
  compass.blue_lens_placed=true
  reveal Temple Steps marker
  slice two complete
```

## Take Item Dependencies

| Item ID | Found on screen | Availability condition | Result |
| --- | --- | --- | --- |
| `empty_jar` | `keeper-hut` | `lina.helped=true` or `compass.green_lens_placed=true` | add item, set `item.empty_jar.taken=true` |
| `glow_leaf` | `waterfall-mouth` | `location.waterfall_cave.revealed=true` | add item, set `item.glow_leaf.taken=true` |
| `stone_key` | `dark-cave` | `dark_cave.wall_checked=true` | add item, set `item.stone_key.taken=true` |
| `blue_lens` | `dark-cave` | `dark_cave.box_open=true` | add item, set `item.blue_lens.taken=true` |

## Inspect And State Dependencies

| Interaction | Screen | Condition | State change | Feedback purpose |
| --- | --- | --- | --- | --- |
| inspect dark entrance | `waterfall-mouth` | before cave lit | none | explain need for light |
| inspect cave wall | `dark-cave` | `waterfall.cave_lit=true` | `dark_cave.wall_checked=true` | reveal stone key |
| inspect blue stone box | `dark-cave` | before key use | none | explain that it is shut |
| inspect Sun Compass | `base-camp-table` | after Green Lens | none | remind that another lens can fit |

## Combine Dependencies

| Item A | Item B | Result | Removes | Unlocks |
| --- | --- | --- | --- | --- |
| `empty_jar` | `glow_leaf` | `glow_jar` | `empty_jar`, `glow_leaf` | item use on cave entrance |

Use sorted item matching in mission JSON so selection order does not matter.

## Use Item On Hotspot Dependencies

| Inventory item | Target hotspot | Screen | Condition | Result |
| --- | --- | --- | --- | --- |
| `glow_jar` | `dark_cave_entrance` | `waterfall-mouth` | inventory contains `glow_jar` | `waterfall.cave_lit=true`, discover/unlock `dark-cave` |
| `stone_key` | `blue_stone_box` | `dark-cave` | inventory contains `stone_key` | remove key, `dark_cave.box_open=true`, reveal `blue_lens` |
| `blue_lens` | `sun_compass` | `base-camp-table` | inventory contains `blue_lens` | remove lens, `compass.blue_lens_placed=true`, reveal `temple-steps` marker |

## Map Discovery And Travel

| Marker | Visible when | Enabled when | Destination |
| --- | --- | --- | --- |
| Keeper Hut | `lina.helped=true` or `location.keeper_hut.discovered=true` | discovered | `keeper-hut` |
| Waterfall Cave | `location.waterfall_cave.revealed=true` | discovered/revealed; entrance still requires light | `waterfall-mouth` |
| Dark Cave | `waterfall.cave_lit=true` | discovered and lit | `dark-cave` |
| Temple Steps | `compass.blue_lens_placed=true` | visible but locked forward hook | future `temple-steps` |

The Waterfall Cave marker may travel to `waterfall-mouth` even before the cave is lit. The blocked state is inside the screen at the cave entrance.

## Failure And Hint Rules

| Situation | Suggested line |
| --- | --- |
| Try cave entrance without light | `The cave is dark. I need light.` |
| Hint after cave is dark | `A jar can hold light.` |
| Use wrong item on cave entrance | `Not here. The cave needs light.` |
| Combine wrong items | `These do not fit together.` |
| Inspect stone box before key | `The box is shut.` |
| Use wrong item on stone box | `The box needs a key.` |
| Try to take Blue Lens before box opens | hidden; no message needed |
| Use Blue Lens away from compass | `This lens is for the Sun Compass.` |

## Slice-Two Puzzle Graph

```text
slice_01_complete
  -> reveal_waterfall_cave_marker
  -> discover_keeper_hut
  -> take_empty_jar
  -> discover_waterfall_mouth
  -> take_glow_leaf
  -> combine_glow_jar
  -> use_glow_jar_on_cave
  -> discover_dark_cave
  -> inspect_cave_wall
  -> take_stone_key
  -> use_stone_key_on_box
  -> take_blue_lens
  -> return_to_base_camp
  -> place_blue_lens
  -> reveal_temple_steps_marker
  -> slice_02_complete
```

Parallel actions allowed:

- The player can visit Waterfall Mouth before finding the empty jar.
- The player can take the glow leaf before the empty jar.
- The player can return to Base Camp at any time through the map.

## Prop Budget Implications

Every slice-two prop must map to a dependency:

| Prop | Reason |
| --- | --- |
| empty jar | combine part |
| glow leaf | combine part |
| glow jar | light source result |
| dark cave entrance | item-use gate |
| cave wall crack | reveals key |
| stone key | opens box |
| blue stone box | lens container/state change |
| Blue Lens | progress item |
| blue lens compass overlay | visible progress |

## Fair-Clue Requirements

- The keeper-hut jar must be motivated by a line from Mira or Lina: `A jar can hold light.`
- The cave wall key must not be a pixel hunt. The wall should show a tiny blue glint, small sun mark, or water trickle near the crack.
- The Blue Lens must be visually distinct from the blue cave by shape and rim, not only by color.
