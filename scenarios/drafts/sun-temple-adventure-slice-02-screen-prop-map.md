# Sun Temple Adventure Slice 02 Screen Prop And NPC Map

This file turns the Waterfall Cave dependency graph into concrete screen requirements.

Source graph: `scenarios/drafts/sun-temple-adventure-slice-02-dependency-graph.md`

## Current Status

Status: first-pass screen/prop map drafted.

## Global Requirements

- Use `npcs`, not `guide`, for adventure characters.
- No new visible NPC is required for slice two.
- Keep the existing HUD map and inventory flow.
- Use clear state overlays for objects that disappear or change.
- Avoid decorative props that look like tools but have no gameplay.

## Screen: `keeper-hut`

Purpose:

- add the deferred village hut;
- provide the `empty_jar`;
- give the player a reason to revisit the village after the Green Lens.

Required visual composition:

- small open garden keeper hut, warm and safe;
- one shelf or table with a single obvious empty jar, staged as the one useful thing after the hint `A jar can hold light.`;
- simple garden context: hanging herbs, seed trays, woven mats, but visually quiet;
- open doorway or path back to village garden;
- no extra tool clutter that looks clickable.

Required hotspots:

| Hotspot ID | Kind | Visible object | Default state | Later state | Interaction |
| --- | --- | --- | --- | --- | --- |
| `empty_jar` | takeable | empty glass jar | present | removed after taken | take item |
| `hut_shelf` | scenery | quiet shelf | present | present | optional inspect |
| `exit_village_garden` | exit | hut doorway/path | available | available | walk to `village-garden` |

State variants:

- `jar_present`
- `jar_taken`

Layout notes:

- The jar must be distinct and easy to crop for inventory.
- Do not include multiple jars.
- Leave clear floor for hero movement.

## Screen: `waterfall-mouth`

Purpose:

- introduce the Waterfall Cave region;
- provide `glow_leaf`;
- block cave entry until the `glow_jar` is made and used.

Required visual composition:

- bright jungle waterfall with shallow safe water;
- dark cave mouth partly behind or beside the waterfall;
- one cluster of glow leaves near the cave entrance;
- stepping stones/path back to map/village;
- cave entrance should be the dominant blocked target.

Required hotspots:

| Hotspot ID | Kind | Visible object | Default state | Later state | Interaction |
| --- | --- | --- | --- | --- | --- |
| `glow_leaf` | takeable | one glowing leaf or small cluster | present | removed after taken | take item |
| `dark_cave_entrance` | use target | dark cave mouth | dark/blocked | lit/open after `glow_jar` | inspect; accepts `glow_jar` |
| `exit_village_garden` | exit | path back | available | available | walk/map transition |
| `exit_dark_cave` | exit | cave path | locked | available after cave lit | walk to `dark-cave` |

State variants:

- `cave_dark`: entrance dark, no cave access.
- `glow_leaf_taken`: glow leaf removed.
- `cave_lit`: soft blue-green light in entrance, cave access enabled.

Layout notes:

- The glow leaf should look magical but botanical, not like a gem or lens.
- The glow leaf should sit near the dark entrance, suggesting it belongs to the cave-light problem, but it should not be inside the cave.
- The cave should be mysterious, not scary.
- Avoid hiding the cave entrance under the waterfall mist.

## Screen: `dark-cave`

Purpose:

- reward using the light source;
- hide/reveal the stone key;
- use the stone key on a box;
- reveal the Blue Lens.

Required visual composition:

- calm cave interior with shallow reflective water;
- soft blue-green light from the glow jar;
- old wall with sun/river marks, one small crack, and a fair clue such as a tiny blue glint or sun mark near the crack;
- blue stone box with a sun mark;
- one Blue Lens reveal position near or inside the box, with a bright rim and clean circular silhouette so it reads against the blue cave;
- exit back to waterfall mouth.

Required hotspots:

| Hotspot ID | Kind | Visible object | Default state | Later state | Interaction |
| --- | --- | --- | --- | --- | --- |
| `cave_wall` | state target | wall marks and small crack | present | key revealed after inspect | inspect |
| `stone_key` | takeable | small stone key | hidden | visible after wall inspect; removed after taken | take item |
| `blue_stone_box` | use target | stone box with blue sun mark | shut | open after key use | inspect; accepts `stone_key` |
| `blue_lens` | takeable | Blue Lens | hidden | visible after box opens; removed after taken | take item |
| `exit_waterfall_mouth` | exit | cave opening | available | available | walk to `waterfall-mouth` |

State variants:

- `box_shut`: key hidden until wall checked; lens hidden.
- `key_visible`: key appears in wall crack.
- `box_open`: blue lens visible.
- `blue_lens_taken`: box remains open, lens removed.

Layout notes:

- The stone key should be small but not impossible to click.
- The Blue Lens must be visually distinct from blue cave reflections.
- Stage the cave from left to right if possible: entrance/glow source, wall crack clue, then blue stone box as final focus.
- Do not include scary skulls, traps, bats, weapons, or horror lighting.

## Reused Screen: `base-camp-table`

New slice-two requirement:

- `sun_compass` accepts `blue_lens`.
- A Blue Lens placed overlay appears in the compass.
- Temple Steps marker appears on the HUD map after Blue Lens placement.

New state variants:

- `green_lens_placed`: start state for slice two.
- `blue_lens_placed`: second lens placed, Temple Steps marker revealed.

## Reused Screen: `village-garden`

New slice-two requirement:

- `exit_keeper_hut` becomes available after Lina is helped or after Green Lens placement.
- Lina can optionally remind the player: `The hut has a jar.`

This does not require new village art unless a visible hut path is needed later.

## Slice-Two Prop Budget

| Prop | Screen | Must be visible | Clickable | Inventory item | State variant | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| empty jar | `keeper-hut` | yes | yes | yes | visible/removed | combine part |
| hut shelf | `keeper-hut` | yes | optional | no | none | grounds jar location |
| glow leaf | `waterfall-mouth` | yes | yes | yes | visible/removed | combine part |
| dark cave entrance | `waterfall-mouth` | yes | yes | no | dark/lit | item-use gate |
| cave wall crack | `dark-cave` | yes | yes | no | key hidden/revealed | inspect state |
| stone key | `dark-cave` | hidden then visible | yes | yes | hidden/visible/removed | opens box |
| blue stone box | `dark-cave` | yes | yes | no | shut/open | lens gate |
| Blue Lens | `dark-cave` | hidden then visible | yes | yes | hidden/visible/removed | progress reward |
| Blue Lens compass overlay | `base-camp-table` | after placement | no | no | visible after placement | progress display |

## Art False-Lead Rules

- `keeper-hut`: no shovel, axe, lamp, rope, hammer, or many jars.
- `waterfall-mouth`: no loose gems, coins, tools, or extra glowing objects.
- `dark-cave`: no many keys, many boxes, readable text, or scary props.
