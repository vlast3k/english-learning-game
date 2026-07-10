# Sun Temple Adventure: Current Playable Walkthrough And Story Inventory

This is an implementation-grounded walkthrough of the current Sun Temple Adventure build. It is intended as a briefing document for a later story or game-design review.

It describes what the child can play now, not the full five-lens campaign envisioned for later development.

Implementation sources:

- `game-engine/missions/sun-temple-adventure-slice-01.json`
- `scenarios/sun-temple-adventure-*-content.json`
- `assets/sun-temple-adventure/*/generated/`

## Current Scope

The playable adventure contains four completed slices and ends on a locked `High Observatory` map hook.

```text
Slice 1: find the Green Lens
Slice 2: find the Blue Lens
Slice 3: find the Stone Lens
Slice 4: find the Mirror Lens
Forward hook: High Observatory, locked and not implemented
```

The player character is Alex. The two named non-player characters are Mira, the calm expedition guide at Base Camp, and Lina, a village gardener. There are no enemies, rivals, villains, combat scenes, traps, or scary stakes in the current build.

The Sun Compass has five empty lens positions in the story. Four can currently be filled: Green Lens, Blue Lens, Stone Lens, and Mirror Lens.

## Core Experience

The adventure is point-and-click and map-based:

- The map HUD button is visible from the start but disabled until Alex takes the torn map.
- The map permits instant travel among discovered locations.
- Inventory items are selected, then used on screen targets or combined with another inventory item.
- English labels and a Bulgarian translation/hint system remain available, but no grammar-answer gate is used for progress.
- A prop that changes state is usually represented with an overlay, while backgrounds carry stable scenery.

## Canonical Story In One Paragraph

At Base Camp, Alex and Mira examine the unfinished Sun Compass, which needs five lenses. Alex restores a map, crosses a repaired bridge to return Lina's lost basket, and is guided to the Green Lens in the village garden. Placing it reveals Waterfall Cave. There, Alex makes a glow jar from a jar and a glowing leaf, lights a dark cave, finds a stone key, opens a blue stone box, and earns the Blue Lens. The second placement reveals Temple Steps. At the steps, Alex takes an empty stone cup back to the waterfall, fills it, and pours the water into a dry sun channel. The water opens the temple gate and a stone sun flower in the courtyard beyond, where the Stone Lens waits. In Mirror Hall, Alex redirects a visible line of light through two mirror panels to open a sun panel and take the Mirror Lens. Its placement reveals the still-locked High Observatory route.

## Walkthrough

The following is the intended first-time order. Once the map is unlocked, the child can travel back to earlier discovered locations; the story does not force a single physical route after that point.

### 1. Base Camp: The Unfinished Compass

**What Alex sees**

- A warm jungle expedition camp and a table holding the Sun Compass.
- Mira standing beside the table.
- A drooping sun flower beside the table, facing toward the temple direction.
- A torn map on the table.
- Paths toward the Supply Tent and Camp Edge.

**People and dialogue**

- On the first Base Camp arrival, Mira says: `That flower faces the temple. Now it has no light.`
- Inspecting the flower: `This flower needs light.`
- Mira's standing guidance: `The Sun Compass needs five lenses.`
- Inspecting the compass: `This is the Sun Compass. Five lenses are missing.`

**Interactive props**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| Sun Compass | use target / look target | Inspects freely; later accepts all three current lenses | Establishes the five-lens campaign goal |
| sun flower | look target | On first inspection, Alex notices it needs light | Establishes the valley restoration mystery; it is never collectible or a progression lock |
| torn map | collectible | Take it | Enables the HUD map |
| Supply Tent exit | exit | Travel there | Leads to the rope |
| Camp Edge exit | exit | Travel there | Leads to the missing map piece |

**Story movement**

The game gives Alex a mission object rather than a villain: complete the Sun Compass and understand why the valley's flower has lost its light. Taking the torn map changes the world from a small camp to a travel adventure.

### 2. Supply Tent: The Useful Rope

**What Alex sees**

- A supply-tent scene containing one usable rope and a route back to Base Camp.

**Interactive props**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| rope | collectible | Take it | Alex says, `I have a rope.` |
| Base Camp exit | exit | Travel back | Returns to the hub |

**Story movement**

The rope is a clear practical tool. It has no story exposition of its own, but it sets up the bridge problem.

### 3. Camp Edge: The Missing Map Piece

**What Alex sees**

- A jungle edge with a fallen branch covering a map piece.
- A route back to Base Camp and one toward the Jungle Path.

**Interactive props**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| fallen branch | state target | A visible paper corner sits below it; first look identifies it, second look moves the branch | `A piece of paper is under the branch.` then `The map piece is here.` |
| map piece | collectible | Available only after the branch is moved | Alex says, `I have a map piece.` |
| Jungle Path exit | exit | Locked until the map is restored | `I need the map.` |

**Inventory action**

Combine `torn map` and `map piece` to make the `map`. The two pieces are removed, the completed map is added, and Jungle Path becomes a discovered map destination.

**Story movement**

Alex actively repairs the means of exploration. The finished map validates the shift from camp errands to a wider journey.

### 4. Jungle Path: The River Route

**What Alex sees**

- An open jungle path marked by one sun stone.
- Routes back to Camp Edge and onward to Broken Bridge.

**Interactive props**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| sun stone / path marker | look-only scenery | Inspect it | `This path has a sun mark.` |
| Broken Bridge exit | exit | Travel onward | Discovers Broken Bridge |

**Story movement**

This is a small navigation beat: the sun stone confirms that Alex is following a real route rather than wandering through generic jungle.

### 5. Broken Bridge: Help Is On The Other Side

**What Alex sees**

- A broken bridge spanning the route to the village.
- Lina's basket visible across the bridge.

**Interactive props**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| broken bridge | use target | Looking before repair explains the need; accepts rope | `The bridge is not safe. I need a rope.` Then `The bridge is safe now.` |
| rope tied on bridge | state overlay | Appears after using rope | Signals the permanent repaired state |
| far basket | look-only scenery | Visible before repair but not obtainable | `A basket is over there. Someone needs it.` |
| basket | collectible | Becomes available after repair | Alex says, `I have Lina's basket.` |
| Village Garden exit | exit | Locked before repair, usable after repair | Gives the line `The bridge is not safe.` when blocked |

**Inventory action**

Use `rope` on the broken bridge. The rope is consumed and remains visually represented as a tied bridge state.

**Story movement**

This is the first clear act of help: Alex turns expedition equipment into a safe route, then brings back an object belonging to a person rather than simply taking a treasure.

### 6. Village Garden: Lina's Favour And The Green Lens

**What Alex sees**

- A bright village garden, Lina, a flower pot, and paths to the bridge and Keeper Hut.

**People and dialogue**

- Before help: Lina says, `My seed basket is near the old bridge. I need it.`
- Giving the basket: `My seeds are safe. Thank you.`
- After help: `The Green Lens is under the flower pot.`
- After the Green Lens is placed: `The hut has a jar. Waterfall leaves glow at night.`

**Interactive props**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| Lina | NPC | Talk to her; give the basket when selected | Gives the human reason for the first lens clue |
| flower pot | state target / look target | Before help: only flowers; after help: reveals the lens | `There are flowers here.` then `The Green Lens is here.` |
| Green Lens | collectible | Appears after flower-pot discovery | Alex says, `I have the Green Lens.` |
| Keeper Hut exit | exit | Locked until Lina is helped | `I should help Lina first.` |

**Inventory action**

Give `basket` to Lina. The basket leaves inventory. Inspect the flower pot, then take the `Green Lens`.

**Story movement**

The first lens is a social reward: Alex helps Lina before gaining access to it. Lina also shifts the story toward the next puzzle by hinting at a jar that can hold light.

### 7. Base Camp Return: Green Lens Opens Waterfall Cave

**What Alex sees**

- The same camp and Sun Compass, now ready to accept the Green Lens.

**Interactive props and state**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| Sun Compass | use target | Accepts selected Green Lens | Lens leaves inventory; green lens progress art appears on the compass |
| Waterfall Cave map marker | map state | Revealed after placement | Mira says, `The lens shows an old water path.` |

**Story movement**

The compass proves it is more than a collection display: each lens reveals a real place. This is the first expansion from the village region into the cave region.

### 8. Keeper Hut: A Container For Light

**What Alex sees**

- A small hut with an empty jar, a shelf of small plants, and a way back to Village Garden.

**Interactive props**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| empty jar | collectible | Take it | `This is an empty jar.` |
| shelf | look-only scenery | Inspect it | `These plants open in sunlight.` |
| Village Garden exit | exit | Travel back | Returns to Lina's area |

**Story movement**

The hut delivers on Lina's clue. It has a very small story role: provide the container that makes the cave-lighting solution possible.

### 9. Waterfall Mouth: Light And Water

**What Alex sees**

- A large waterfall and shallow pool.
- A glowing leaf near a dark cave entrance.
- A return route to Village Garden.

**Interactive props**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| glow leaf | collectible | Take it | `This leaf has light. It is not warm.` |
| waterfall pool | use target | Later accepts the stone cup | Fills the cup for the Temple Steps puzzle |
| dark cave entrance | use target | Before lighting: warns Alex; accepts glow jar | `The cave is dark. I need light.` then `I can see now.` |
| lit-cave glow | state overlay | Appears after using glow jar | Makes the cave route visibly usable |
| Dark Cave exit | exit | Visible only after the cave is lit | Leads inside |

**Inventory actions**

1. Combine `empty jar` and `glow leaf` to make `glow jar`. The jar and leaf are removed; Alex says, `The jar holds the light.`
2. Use `glow jar` on the dark cave entrance. The glow jar stays in inventory, but the cave becomes lit and accessible.

**Story movement**

Waterfall Mouth is intentionally reused. In the Blue Lens sequence it is a safe place where Alex makes light; in the Stone Lens sequence it becomes the remembered water source needed to solve a different problem.

### 10. Dark Cave: Key, Box, Blue Lens

**What Alex sees**

- A now-lit cave wall, a closed blue stone box, and a route back to Waterfall Mouth.

**Interactive props**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| cave wall | state target | Inspect its visible seam | `One stone has a thin line.` |
| stone key | collectible | Appears after wall inspection | `I have a stone key.` |
| blue stone box | use target | Looks closed; accepts stone key | `The box is closed.` then `The box is open.` |
| open blue stone box | state overlay | Appears after key use | Makes the reward state clear |
| Blue Lens | collectible | Appears after the box opens | `I have the Blue Lens.` |

**Inventory action**

Use `stone key` on the blue stone box. The key is consumed and the `Blue Lens` becomes available.

**Story movement**

The cave is a gentle mystery rather than a dangerous space: light reveals a key, the key opens a box, and the box provides the second lens.

### 11. Base Camp Return: Blue Lens Opens Temple Steps

**What Alex sees**

- The Sun Compass now has a Green Lens placement and can accept the Blue Lens.

**Interactive props and state**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| Sun Compass | use target | Accepts selected Blue Lens | Lens leaves inventory; blue lens progress art appears |
| Temple Steps map marker | map state | Revealed and enabled after placement | Mira says, `The cave path joins the river path.` |

**Story movement**

The map offers a third region with a visibly different sunny temple mood, rather than simply another cave screen.

### 12. Temple Steps: The Dry Sun Channel

**What Alex sees**

- Sunlit stone steps, a broad fixed stone arch, an empty sun-marked cup rest, and a dry carved channel leading through the arch.
- The closed-gate overlay covers the open background arch before the water action.

**Interactive props**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| stone cup | collectible | Take it once | `This cup is empty.` |
| sun channel | use target / look target | Builds the clue through three inspections, then accepts water cup | `The channel is dry.` -> `These marks are water paths.` -> with cup: `The waterfall can fill this cup.` |
| closed gate | state overlay | Visible before water use | Hides after the channel is filled |
| water paths | state overlay | Three continuous painted-channel water paths appear after water use | Shows the cause of the gate opening |
| Sun Courtyard exit | exit | Hidden until the gate opens | Leads to the reward |
| path back | exit | Always available | Returns to Waterfall Mouth |

**Inventory action**

Take `stone cup`, return to Waterfall Mouth, and use it on the `waterfall pool`. The stone cup becomes `water cup`; Alex says, `I have water now.`

**Story movement**

The child must recognize and reuse a familiar place. The puzzle is not about a new magic object: the waterfall already has the water that the temple channel visibly lacks.

### 13. Temple Steps Return: Open The Gate

**What Alex sees change**

- The selected `water cup` can now be used on the dry sun channel.
- The cup is consumed.
- The closed gate disappears.
- Water follows the carved route toward and through the arch.
- Sun Courtyard becomes a discovered map location and its exit becomes available immediately.

**Story movement**

This is the clearest current cause-and-effect spectacle: carrying water back to the temple visibly opens the way forward.

Alex says, `The water follows the sun marks! The gate is open.`

### 14. Sun Courtyard: The Stone Lens Reward

**What Alex sees**

- A bright courtyard beyond the gate. On the first arrival, Alex says, `The water opens the stone flower.`
- A large stone sun flower at its centre, with water already reaching it.
- The Stone Lens visibly placed in the flower centre.
- A non-clickable distant doorway that is visual future architecture, not a current destination.

**Interactive props**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| Stone Lens | collectible | Available immediately on entering | `I have the Stone Lens.` |
| Temple Steps exit | exit | Returns to Temple Steps | Supports backtracking |

**Story movement**

The reward is visible rather than hidden behind one more puzzle. Water has already opened the flower before the child enters, so the Stone Lens reads as the direct payoff of the water action.

### 15. Base Camp Return: Stone Lens Opens Mirror Hall

**What Alex sees**

- The compass can now show three placed lens states: Green, Blue, and Stone.

**Interactive props and state**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| Sun Compass | use target | Accepts selected Stone Lens | Lens leaves inventory; Stone Lens progress art appears |
| Mirror Hall map marker | map destination | Becomes enabled after Stone Lens placement | Mira says, `All three lenses point to Mirror Hall. Where is the light?` |

**Story movement**

The Stone Lens now gives a concrete new place, not only a promise. The five-lens objective remains unresolved: the Sun Lens, Observatory approach, Observatory Door, and final restoration do not exist yet.

### 16. Mirror Hall: Carry The Light

**What Alex sees**

- A safe, warm inner temple hall with a daylight opening, one fixed wall mirror, two movable mirror panels, and a large sealed sun panel visible from the first arrival.
- A visible light line initially stops at the near mirror; the panel is closed and the Mirror Lens is not yet reachable.

**Interactive props and state**

| Prop | Type | Current behaviour | Story information / result |
| --- | --- | --- | --- |
| light opening / fixed mirror | look targets | Optional concise observations | Establish that light is already inside and mirrors turn it |
| near mirror | one-way state target | One click sends the line to the far mirror | `The light reaches the next mirror.` |
| far mirror | one-way state target | Initially gives a clear blocked clue; after near mirror, one click sends the line to the panel | `The light opens the panel.` |
| sun panel | state prop | Closed until both mirrors are aligned | Opens visibly; stays open on revisits |
| Mirror Lens | collectible | Available from the opened panel | `This is the Mirror Lens.` |
| path back | exit | Returns to Sun Courtyard | Supports map-based revisits |

**Story movement**

Mirror Hall reveals that the temple carries and redirects light; it does not create it. Alex earns the fourth lens by changing visible states rather than finding another key. At Base Camp, Mira says, `Four lenses show the route. One space is still dark.` The map shows a locked High Observatory hook, preserving the final Sun Lens and restoration mystery.

## Current Prop Inventory

| Prop / item | First source | Used with | Fate | Narrative role |
| --- | --- | --- | --- | --- |
| torn map | Base Camp | map piece | replaced by map | Opens travel |
| map piece | Camp Edge | torn map | replaced by map | Restores exploration route |
| map | inventory craft | none required | remains | Unlocks Jungle Path |
| rope | Supply Tent | broken bridge | consumed and shown tied | Repairs access |
| basket | Broken Bridge | Lina | given away | Makes first lens a favour reward |
| Green Lens | Village Garden | Sun Compass | placed, removed | Reveals Waterfall Cave |
| empty jar | Keeper Hut | glow leaf | replaced by glow jar | Holds light |
| glow leaf | Waterfall Mouth | empty jar | replaced by glow jar | Provides light |
| glow jar | inventory craft | dark cave entrance | remains in inventory | Lights cave |
| stone key | Dark Cave | blue stone box | consumed | Opens second-lens container |
| Blue Lens | Dark Cave | Sun Compass | placed, removed | Reveals Temple Steps |
| stone cup | Temple Steps | waterfall pool | replaced by water cup | Carries water |
| water cup | Waterfall Mouth | sun channel | consumed | Opens gate and courtyard |
| Stone Lens | Sun Courtyard | Sun Compass | placed, removed | Reveals Mirror Hall |

## Look-Only And State Props

These are not collectable items, but they provide information, a visible obstacle, or a permanent state change.

| Screen | Prop | Role |
| --- | --- | --- |
| Camp Edge | fallen branch | Reveals the map piece through a two-look state change |
| Jungle Path | sun stone | Confirms the river route |
| Broken Bridge | far basket | Shows the immediate goal before it is reachable |
| Broken Bridge | repaired bridge / tied rope | Displays the completed access state |
| Village Garden | flower pot | Holds the clue-and-reveal state for the Green Lens |
| Keeper Hut | shelf | Establishes plants and supports Lina's light clue |
| Waterfall Mouth | waterfall pool | Fills the stone cup in the later Temple Steps return |
| Waterfall Mouth | dark cave entrance / cave glow | Gives the cave-lighting gate and its visible completion state |
| Dark Cave | cave wall | Reveals the hidden stone key |
| Dark Cave | blue stone box | Gives the key-to-reward state change |
| Temple Steps | dry sun channel / closed gate / water paths | Makes the water cause-and-effect puzzle legible |
| Sun Courtyard | stone sun flower | Visible reward setting for the Stone Lens |

## Map And Location Progression

| Location | How it becomes available | Current role |
| --- | --- | --- |
| Base Camp, Supply Tent, Camp Edge | available at campaign start | initial local region |
| Jungle Path | craft the completed map | first outward route |
| Broken Bridge | reach it from Jungle Path | access puzzle |
| Village Garden | repair bridge | Lina and Green Lens region |
| Keeper Hut | help Lina, then use its exit | jar source |
| Waterfall Mouth | place Green Lens | glow leaf, cave entrance, later water source |
| Dark Cave | light cave with glow jar | key, box, Blue Lens |
| Temple Steps | place Blue Lens | cup and water-channel puzzle |
| Sun Courtyard | fill the sun channel | Stone Lens reward |
| Mirror Hall | place Stone Lens | usable destination; Mirror Lens can be earned |

## Story Information The Child Currently Receives

1. The Sun Compass has five missing lenses, and the Base Camp flower has no light.
2. A restored map allows travel into the river route.
3. A broken bridge blocks the way to Lina's lost basket.
4. Lina's seeds are in that basket; helping her reveals the Green Lens location.
5. The first placed lens shows an old water path and reveals Waterfall Cave on the map.
6. Lina's hut contains a jar, and waterfall leaves glow at night.
7. A glowing leaf plus that jar creates a cave light.
8. A visible cave-wall seam reveals a key; the key opens a stone box; the box holds the Blue Lens.
9. The second placed lens connects the cave route to the river route and reveals Temple Steps.
10. The Temple Steps channel is dry and marked for water.
11. The familiar waterfall fills the stone cup.
12. Water follows the sun marks, opens the gate, and opens the sun flower beyond it.
13. The third placed lens points toward Mirror Hall, but that place is not ready yet.

## Current Narrative Strengths

- The world grows in visible rings: camp -> river and village -> cave -> temple.
- The first lens comes from helping another person, not simply looting a treasure.
- Each completed lens visibly changes the compass and opens a map destination.
- The Waterfall Mouth has an intentional return use in Slice 3, giving the map a reason to exist beyond moving between backgrounds.
- The three inventory transformations are concrete and child-readable: map pieces -> map, jar + leaf -> glow jar, stone cup -> water cup.
- The Temple Steps water action supplies the strongest current visual consequence.

## Planned Campaign Continuation: Design Intent, Not Yet Implemented

This section is deliberately included for future story-review work. It describes the agreed direction for the remaining campaign so a reviewer can assess and improve continuity without inventing a different premise, antagonist, ending, or travel structure.

None of the locations, props, lens interactions, dialogue, artwork, or scenario JSON in this section should be treated as currently playable unless they are also described in the walkthrough above.

### Fixed Campaign Spine

The intended complete story is `Secrets of the Sun Temple`:

```text
Alex and Mira repair the Sun Compass in a hidden jungle valley.
Five lenses restore the Compass and reveal the route through the Sun Temple.
At the observatory, Alex turns the sun mirror.
Sunlight reaches the valley garden again.
```

The original premise includes a gentle environmental problem: the old light path is broken, and a small sun flower near Base Camp is drooping because it needs sun. The completed mirror should return light to the valley garden. The drooping flower is implemented as the opening mystery; its restored state and the final valley-wide light state remain planned story material.

The tone must remain warm, practical, and non-combat-focused. The valley itself supplies the obstacles: blocked routes, dark places, old light mechanisms, and objects that need to be used in the right place. There is no planned rival explorer, villain, weapon, trap sequence, or frightening temple guardian.

### Five-Lens Arc

| Lens | Current / planned source | Main adventure purpose | Status |
| --- | --- | --- | --- |
| Green Lens | Village Garden, after helping Lina | Establish that kindness and observation earn progress | implemented |
| Blue Lens | Dark Cave, after making light and opening the stone box | Establish item combining and safe cave exploration | implemented |
| Stone Lens | Sun Courtyard, after carrying waterfall water to the temple channel | Establish return travel and visible world-state cause and effect | implemented |
| Mirror Lens | Mirror Hall in the Inner Temple | Use a light-beam / mirror-alignment state puzzle | implemented |
| Sun Lens | Late observatory route, likely Observatory Door or the high path beyond it | Complete the final route and make the Compass whole | planned |

Each placement at Base Camp should visibly update the Sun Compass and reveal a meaningful map state. The final two placements should preserve this established rhythm rather than introduce a separate collection system.

### Intended Remaining Locations

| Planned location | Expected entry | Intended screen role | Story obligation |
| --- | --- | --- | --- |
| Mirror Hall | Stone Lens placement reveals its usable marker | Inner Temple puzzle space with a fixed reflection, two mirror states, a light beam, and a sun panel | implemented; Mirror Lens now reveals the high observatory hook |
| Observatory Door | Opened from the Inner Temple after the Mirror Hall mechanism | Late-game gate with a Sun Compass socket or completed-compass requirement | State clearly that the high observatory route is the final way forward |
| Sun Observatory | Beyond Observatory Door, once all five lenses are placed | Final sun-mirror action and ending scene | Let Alex turn the mirror and show sunlight reaching the valley garden |

The working region sequence is:

```text
Base Camp
  -> Jungle Path and River Garden Village
  -> Waterfall Cave
  -> Temple Courtyard
  -> Mirror Hall
  -> Observatory Door
  -> Sun Observatory
  -> restored valley garden ending
```

Base Camp remains the story hub throughout. The map should continue to grow by discovery and visible compass progress, and discovered locations should remain available for instant travel from the HUD map button.

### Intended Final Beats

1. The Stone Lens placement reveals the usable Mirror Hall marker.
2. Alex enters Mirror Hall, aligns two visible reflections, and earns the Mirror Lens.
3. Placing the Mirror Lens reveals the locked High Observatory route.
4. Alex earns the Sun Lens through the late temple/observatory approach and completes the five-lens Sun Compass.
5. The complete Compass opens the Observatory Door or fits its final pedestal.
6. At Sun Observatory, Alex turns the sun mirror.
7. A visible light change reaches the valley garden and resolves the original sunlight problem.
8. Mira thanks Alex; the repaired map becomes complete and bright rather than torn and dark.

The exact prop chain, number of screens, and language lines for these future locations are intentionally undecided. Future design should solve them through the same dependency-first process used for the first three slices: plot -> location and screen map -> prop/NPC map -> curriculum review -> art prompts -> scenario JSON.

### Story Constraints A Future Reviewer Should Preserve

- Keep Alex as a curious, kind, careful junior explorer, not a fighter or chosen hero.
- Keep Mira as a gentle guide and map/compass companion. Her role can gain emotional specificity, but she should not become a quiz dispenser.
- Keep Lina's basket/seeds/flower-pot sequence as the first lens's social foundation.
- Keep each lens linked to a place and a visible map or temple change.
- Keep Waterfall Mouth meaningful as a return location; the Stone Lens cup puzzle already establishes this pattern.
- Keep Mirror Hall and the observatory as the natural continuation of the temple/light story, not as a sudden new mythology.
- Keep the finale about repair, discovery, and restoring sunlight to the garden, not defeating an enemy.
- Do not introduce a separate grammar progression, random collectible economy, or unused prop clutter to make future slices feel larger.

## Current Narrative Limits And Review Targets

These are factual limitations of the current build, not proposed fixes. They are included so a later reviewer can focus feedback where it is most valuable.

- Alex has no established personal reason for wanting to complete the compass beyond exploration.
- Mira frames the five-lens goal but has little evolving dialogue between placements.
- Lina is the only NPC with a personal need and does not appear again after the first region.
- The lenses are mechanically linked to new locations, but their larger shared meaning is not yet explained.
- The current build has no antagonist, ticking clock, or conflict between characters. Its planned final destination is Sun Observatory, but the playable build currently stops at the locked High Observatory marker.
- Most dialogue is short functional guidance. There are few reactions to entering a new place or to each lens discovery.
- Keeper Hut, Waterfall Mouth, and Dark Cave are compact one-purpose screens. Their atmosphere is strong, but their story detail is deliberately sparse.
- The distant Sun Courtyard doorway is background-only in the current slice and must not be made clickable without a meaningful follow-up.

## Suggested Brief For A Future Reviewer Agent

Review the document as the current playable experience, not as a request to add unnecessary props or grammar questions. Assess:

1. Whether the existing five-lens premise has enough emotional and dramatic pull for a child.
2. Whether Mira and Lina give the player enough sense of relationship and companionship.
3. Whether each transition between camp, village, cave, waterfall, and temple has a clear emotional change as well as a mechanical one.
4. Which existing scenes could gain a stronger story beat through dialogue, visible state, or a recontextualized existing prop, without adding clutter.
5. Whether the Mirror Hall hook creates a satisfying promise for the next slice.
6. Which additions would be high-value, and which would distract from the current adventure loop.
7. Whether the planned Mirror Hall -> Observatory Door -> Sun Observatory continuation feels like the natural payoff of the existing compass, water, and sunlight story.

Treat the planned continuation as a story constraint, but do not assume Mirror Hall, the final two lenses, additional NPCs, item-combining beyond the listed recipes, or new scenery are already implemented.
