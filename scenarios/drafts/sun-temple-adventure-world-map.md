# Sun Temple Adventure World Map

This file maps the first-pass world for `sun-temple-adventure`. It follows `scenarios/drafts/sun-temple-adventure-plot.md` and should be revised before any asset prompts or JSON are created.

## Current Status

Status: first-pass region and screen map drafted with initial design decisions recorded.

Next incomplete design step: prompt pack.

Do not generate assets or JSON yet.

## World Structure

The campaign uses a hub-and-spoke map.

Base Camp is the hub. The player starts there and returns often. New regions are discovered through exits, map pieces, and repaired paths. Once discovered, a region can appear on the world map for later travel.

Recommended first implementation: build a vertical slice with four to six screens after the whole campaign is designed on paper. No final drawings should be created until the full game design, dependency graph, prop map, curriculum ledger, and asset plan are drafted. Rough draft sketches are allowed if they help reason about screen layout.

## Region Map

| Region | Purpose | Unlock condition | Contains screens | Return reason |
| --- | --- | --- | --- | --- |
| Base Camp | Safe hub, compass table, guide hints, map access | Available at start | `base-camp-table`, `camp-supply-tent`, `camp-edge` | Use new items at compass table, get hints, craft/combine later |
| Jungle Path | First exploration route and bridge gate | Find or repair first map piece at camp edge | `jungle-path`, `broken-bridge` | Use rope, revisit after bridge repair |
| River Garden Village | First friendly NPC region and first lens | Repair bridge | `village-garden`, `keeper-hut` | Give items to NPC, receive lens, later get lamp part |
| Waterfall Cave | Dark side region with second lens | Discover cave marker from village or river path; needs lamp/torch | `waterfall-mouth`, `dark-cave` | Use light item, find old clue, return with temple symbol |
| Temple Courtyard | Main ancient site and lens placement | Compass has first lens and cave clue, or map marker from cave | `temple-steps`, `sun-courtyard` | Place lenses, unlock inner temple |
| Inner Temple | Late campaign puzzle space | Courtyard mechanism repaired | `mirror-hall`, `observatory-door` | Use completed compass, unlock finale |
| Sun Observatory | Finale | Complete Sun Compass | `sun-observatory` | Final mirror action and ending |

## Map Unlock Philosophy

The map should not be only a menu. It should feel like a found object that grows.

Suggested map states:

1. No map: player can walk only inside Base Camp.
2. Torn map found: map UI becomes available with Base Camp and Camp Edge.
3. Torn map combined with first map piece: Jungle Path marker appears.
4. Bridge repaired: River Garden Village marker appears after reaching it once.
5. Green Lens placed in the Sun Compass: Waterfall Cave marker appears but is locked until the player has a light item.
6. Cave clue found: Temple Courtyard marker appears.
7. Courtyard mechanism repaired: Inner Temple marker appears.
8. Compass completed: Sun Observatory marker appears.

## Screen List

This is a first-pass screen list. Each screen must survive later prop-budget review.

| Screen ID | Region | What happens here | Exits | Required visible props | NPCs | State variants |
| --- | --- | --- | --- | --- | --- | --- |
| `base-camp-table` | Base Camp | Start, inspect Sun Compass, see missing lens slots, talk to Mira | supply tent, camp edge, map when unlocked | Sun Compass, torn map area, camp table, empty lens slots | Guide Mira | compass empty / compass with lenses |
| `camp-supply-tent` | Base Camp | Take rope, inspect useful supplies | base camp table | backpack, rope, small box, notebook or lamp part | none or supply helper | rope present / rope taken |
| `camp-edge` | Base Camp | Inspect and move branch, find first map piece | base camp table, jungle path after repaired map | fallen branch, map piece, path sign | Guide Mira optional | branch blocking / branch moved |
| `jungle-path` | Jungle Path | Walk deeper into jungle, inspect carved sun stone and river glow | camp edge, broken bridge | path stones, carved sun stone, river glow, plants | none | normal / marker seen |
| `broken-bridge` | Jungle Path | Use rope on broken bridge to cross | jungle path, village garden after repair | broken bridge, rope posts, river, bright far-side marker | none | bridge broken / bridge repaired |
| `village-garden` | River Garden Village | Meet Garden Keeper Lina; give useful item; receive hint to first lens | bridge, keeper hut in second slice | garden table, basket, water pot, first lens hiding place | Lina | needs item / helped / lens found |
| `keeper-hut` | River Garden Village | Get hint or part for light item; possible map clue | village garden | hut shelf, lamp part or cloth, wall map | Lina or helper | locked shelf / item taken |
| `waterfall-mouth` | Waterfall Cave | Cave entrance is dark; use lamp/torch | village garden or map, dark cave when lit | waterfall, cave mouth, dark entrance | none | dark / lit |
| `dark-cave` | Waterfall Cave | Find old clue and second lens | waterfall mouth | cave wall symbols, second lens, stone box | none or echo hint | closed box / box open |
| `temple-steps` | Temple Courtyard | Approach temple, inspect outer symbols | map, sun courtyard | stone steps, animal/shape symbols, sealed door | Keeper Maya optional | sealed / courtyard open |
| `sun-courtyard` | Temple Courtyard | Place lenses or symbols to open inner temple | temple steps, mirror hall | compass pedestal, lens slots, stone panels | Keeper Maya optional | slots empty / slots filled |
| `mirror-hall` | Inner Temple | Align path toward observatory door | sun courtyard, observatory door | mirrors, light beam, moveable panel | none | beam off / beam on |
| `observatory-door` | Inner Temple | Use completed compass to unlock final area | mirror hall, sun observatory | final door, compass socket | Mira voice hint | locked / open |
| `sun-observatory` | Sun Observatory | Turn mirror and finish campaign | map or ending only | sun mirror, valley view, completed compass place | Mira | before mirror / after mirror |

## Vertical Slice Recommendation

For the first playable build, use this smaller chain:

1. `base-camp-table`
2. `camp-supply-tent`
3. `camp-edge`
4. `jungle-path`
5. `broken-bridge`
6. `village-garden`

Minimum adventure mechanics covered:

- inspect Sun Compass;
- take rope;
- inspect and move branch to get map piece;
- combine torn map and map piece into the valley map;
- unlock map marker;
- use rope on bridge;
- travel or walk to village;
- talk to Lina;
- give item to Lina;
- use Lina's hint to find the first lens;
- place lens in Sun Compass;
- reveal Waterfall Cave marker as the forward hook for slice two.

This is enough to test the new adventure structure without designing the full campaign into a corner.

## Travel Links

Initial walking links:

- `base-camp-table` -> `camp-supply-tent`
- `base-camp-table` -> `camp-edge`
- `camp-supply-tent` -> `base-camp-table`
- `camp-edge` -> `base-camp-table`

Unlocked walking links:

- `camp-edge` -> `jungle-path` after the valley map is made
- `jungle-path` -> `broken-bridge`
- `broken-bridge` -> `village-garden` after bridge repair
- `village-garden` -> `keeper-hut` after Lina intro
- `village-garden` -> `waterfall-mouth` after cave clue
- `waterfall-mouth` -> `dark-cave` after light item
- `dark-cave` -> `temple-steps` after cave clue
- `temple-steps` -> `sun-courtyard` after outer gate opens
- `sun-courtyard` -> `mirror-hall` after lens mechanism
- `mirror-hall` -> `observatory-door`
- `observatory-door` -> `sun-observatory` after completed compass

Map travel links:

- Map UI should become available only after the torn map is found.
- Useful instant travel markers begin after the torn map and first map piece are combined.
- Once the map is available, discovered markers allow instant travel.
- A marker should appear only after the location is discovered or clearly marked by a clue.
- Locked markers can appear later, but they should show why they are blocked in simple text.

## Region Purposes

Base Camp:

- teaches the interface and map;
- stores central progress at the Sun Compass;
- gives reasons to return after each lens.

Jungle Path:

- teaches blocked route and item use;
- gives the first strong adventure action: repair bridge;
- contains a memorable carved sun stone and river glow so it does not feel like a hallway.

River Garden Village:

- teaches NPC give/receive logic;
- grounds the adventure with a friendly place and practical help;
- ties Lina's basket, seeds, flower pot, and Green Lens into one small story beat.

Waterfall Cave:

- teaches light gating and possibly item combining;
- adds mystery without danger-heavy tone.

Temple Courtyard:

- turns collected lenses into visible world progress;
- connects symbols, shapes, and map clues.

Inner Temple:

- uses state changes such as light beams and mirror positions;
- supports a satisfying final mechanism.

Sun Observatory:

- completes the map/compass story with a visible world change.

## Locked Decisions

- `camp-edge` does not need a separate starter tool; the player inspects and moves the branch.
- `rope` is enough to repair the first bridge.
- Lina reveals where the first lens is and gives a hint; she does not hand over the lens directly.
- `keeper-hut` waits for the second slice.
- World map markers allow instant travel after the map is unlocked and a marker is discovered.
- Each region should begin with one background screen for implementation, but the whole game should be designed before any final drawings are created.
- The Green Lens is hidden under a flower pot.
- Rope is consumed from inventory and becomes part of the repaired bridge.
- The Sun Compass lives at Base Camp for the first slice; later access is undecided until more places are defined.
- Map travel is opened from a HUD map button.
- The lost basket appears on the far side of the repaired bridge.

## Remaining Open Questions

- Should instant map travel be available from any screen or only while the player is not in dialogue/inventory mode?
- Which later regions need more than one screen in the full design?

## Compaction Handoff

If context is compacted, read `adventure-game-reboot.md`, then `sun-temple-adventure-plot.md`, this file, `sun-temple-adventure-dependency-graph.md`, `sun-temple-adventure-screen-prop-map.md`, `sun-temple-adventure-curriculum-ledger.md`, and `sun-temple-adventure-asset-plan.md`. The selected direction is an adventure-first Sun Temple campaign with a hub map, instant map travel after discovery, inventory use, item combining, NPC item exchange, and map discovery. The next concrete step is the prompt pack under `assets/sun-temple-adventure/`.
