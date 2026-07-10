# Sun Temple Adventure: World State Plan

## Purpose And Scope

This document defines how the valley should visibly remember Alex's actions from the opening mystery through the final restoration. It is the Workstream 3 design deliverable from `sun-temple-adventure-creative-proposal-action-plan.md`.

It is deliberately a state and art-planning document. It does **not** add a new screen, item, puzzle, rule, prompt, generated image, or hotspot. Mirror Hall and the Observatory must first receive their own dependency graphs before their art is commissioned.

Read with:

1. `sun-temple-adventure-current-walkthrough.md` for the live route and objects.
2. `sun-temple-adventure-final-creative-design-proposal.md` for the intended ending.
3. `sun-temple-adventure-story-dialogue-ledger.md` for current player-facing information.
4. `sun-temple-adventure-creative-proposal-action-plan.md` for workstream boundaries.

## Design Rule

The valley does not become generically brighter after every success. Each local repair remains visible where it happened. Only the completed Observatory mechanism creates the shared, valley-wide sunlight restoration.

```text
notice a problem
  -> discover a local clue
  -> repair or activate one local system
  -> keep that local change visible on revisits
  -> complete the Observatory mechanism
  -> show one connected final restoration across the valley
```

This preserves the adventure logic: the bridge remains tied because Alex repaired it; the cave remains lit because Alex lit it; the garden recovers only when sunlight has actually returned.

## State Vocabulary

### Live Facts To Preserve

These facts already describe meaningful, persistent changes. Future content should reuse them rather than inventing parallel versions.

| Fact | Meaning | Visible consequence now |
| --- | --- | --- |
| `map.ui_unlocked` | Alex has taken the torn map. | HUD map becomes usable. |
| `map.valley_map_made` | The two map pieces were combined. | Jungle route can be discovered. |
| `bridge.repaired` | Rope was used on the broken bridge. | Rope stays tied; far side and basket are reachable. |
| `lina.helped` | Lina has her seed basket again. | Keeper Hut route and Lina's later knowledge are available. |
| `compass.green_lens_placed` | Green Lens is installed at Base Camp. | Waterfall route is revealed. |
| `waterfall.cave_lit` | Glow jar lights the cave entrance. | Dark Cave becomes available and remains visibly lit. |
| `dark_cave.box_open` | Stone key opened the blue stone box. | The box stays open. |
| `compass.blue_lens_placed` | Blue Lens is installed. | Temple Steps route is revealed. |
| `temple.channel_filled` | Water cup filled the carved channel. | Water follows the carved route. |
| `temple.gate_open` | The water mechanism opened the gate. | Sun Courtyard is reachable. |
| `temple.sun_flower_open` | The stone flower responded to the water. | Courtyard lens source is open. |
| `compass.stone_lens_placed` | Stone Lens is installed. | Mirror Hall is revealed as the next route. |

`location.*` facts remain travel/discovery facts. They should not be used as substitutes for puzzle completion or restoration states.

### Future Facts To Introduce Only With Their Slice Designs

The names below are recommendations, not live requirements. Workstream 4 and the finale design may refine them, but should retain their narrow meanings.

| Proposed fact | Owns it | Meaning |
| --- | --- | --- |
| `mirror_hall.light_source_revealed` | Slice 4 | A visible incoming light source can be used in Mirror Hall. |
| `mirror_hall.beam_path_complete` | Slice 4 | The child has aligned the full readable mirror route. |
| `compass.mirror_lens_placed` | Slice 4 / Base Camp | Mirror Lens is installed; Observatory approach is revealed. |
| `observatory.sun_lens_found` | Finale approach | Alex has earned the Sun Lens. |
| `compass.sun_lens_placed` | Base Camp | The fifth and final lens is installed. |
| `observatory.door_open` | Finale approach | The Observatory can be entered. |
| `observatory.great_mirror_aligned` | Finale | The final physical mirror action is solved. |
| `valley.light_restored` | Finale | The single campaign-wide finale state: sunlight has returned through the system. |
| `map.complete` | Finale UI | The map has its complete, bright presentation. |

Do not set `valley.light_restored` when a lens is placed, when the temple gate opens, or when Mirror Hall is solved. It belongs only to the final Observatory action.

## State Layers

Each screen may use the following layers. A screen should implement only the layers it genuinely needs.

| Layer | Meaning | Example |
| --- | --- | --- |
| Normal | The place before Alex understands its role. | Dry channel at Temple Steps. |
| Clue | A noticed detail makes a future action legible. | Paper under the Camp Edge branch. |
| Local repair | Alex solved a location-specific obstacle. | Rope tied across Broken Bridge. |
| Lens/map progress | The Compass changes what Alex can reach or understand. | Temple Steps marker revealed after Blue Lens. |
| Final restoration | Sunlight reaches the whole valley after the Observatory. | Lina's plants turn toward the light. |

Local repair facts persist into the final restoration. A final overlay must never hide the bridge rope, cave glow, open box, or running temple water that explain how Alex earned the ending.

## Region State Matrix

### Current Playable Regions

| Region | Normal / clue state | Local repair or discovery state | Final restoration response | Art decision |
| --- | --- | --- | --- | --- |
| Base Camp | Existing painted drooping sun flower points toward the temple; incomplete Compass establishes the mystery. | Lenses remain visibly placed as each is returned. | Flower stands and faces the returning light; five-lens Compass and complete map read as one completed instrument. | Final flower and Compass state need a dedicated overlay/atlas treatment; do not regenerate the whole camp. |
| Camp Supply Tent | A practical supply stop, not a second story mystery. | Rope and jar pickups are already consumed into the route. | No required visual change. A broad “warmer tent” treatment would dilute the finale. | No finale art planned. |
| Camp Edge | Map paper under branch and a route toward the jungle. | Branch remains moved after the map piece is found. | No required visual change. The solved branch remains useful evidence of early exploration. | No finale art planned. |
| Jungle Path | Sun mark introduces the recurring route motif. | Route is discovered after map repair. | Optional, very subtle warm trace on the existing sun mark only if it helps the final travel montage. | Low priority; do not generate separately. |
| Broken Bridge | Basket is visibly stranded across the gap. | Rope remains tied and the crossing stays repaired. | No additional change required. The bridge's persistence already communicates repair. | No finale art planned. |
| Village Garden | Lina's planting beds and seed basket establish what the missing light affects. | Lina is helped; Green Lens is found in the flower pot. | Plants and flowers turn toward sunlight; Lina receives one short ending reaction. This is the emotional proof that the journey mattered. | Required finale overlay/state art, with no new collectible props. |
| Keeper Hut | Plants and sunlight clue connect the garden to the glow-jar route. | Jar is taken; later route knowledge is available. | At most a small leaf/plant turn toward the light. This is secondary to the garden. | Optional; omit unless the final return route needs this beat. |
| Waterfall Mouth | Glow leaf and pool show water and light as useful natural resources. | Cave is lit; stone cup can be filled later. | A clear sunlight reflection on water may support the final connected-system read while retaining the cave glow. | Optional, dependent on final composition. |
| Dark Cave | Thin wall line leads to the stone key and blue box. | Cave remains lit; box stays open. | No broad brightening. The cave should remain recognisable and quietly mysterious. | No finale art planned. |
| Temple Steps | Dry channel and water-path marks make the mechanism readable. | Water runs in the channel and gate remains open. | Small warm light along the already-running water path can connect it to the final beam without reopening the puzzle. | Required only if a Temple-to-Observatory visual route is shown. |
| Sun Courtyard | Stone flower opens when the channel receives water. | Stone Lens is taken; Mirror Hall is revealed after placement. | Central flower receives a warm glow, but stays a stone mechanism rather than becoming a garden flower. | Required small final overlay if the finale montage revisits the courtyard. |

### Future Regions

| Region | Before solution | Solved state | Final restoration response | Design dependency |
| --- | --- | --- | --- | --- |
| Mirror Hall | Mirrors are readable but inactive; one visible source indicates what can be redirected. | A complete beam route reveals Mirror Lens and opens the Observatory direction. | The solved beam continues beyond the hall toward the Observatory, visually linking the internal puzzle to the finale. | Workstream 4 must define mirror count, beam route, interaction order, and reward before art. |
| Observatory approach / door | Route is known but the door or mechanism remains incomplete. | Sun Lens is earned and the completed Compass provides the needed access. | Door or path stays visibly open; this should read as a consequence, not a second unexplained miracle. | Final-approach dependency graph required. |
| Sun Observatory | Great sun mirror is dormant but clearly capable of turning. | Alex aligns the mirror after all five lenses and Observatory access are complete. | The mirror sends sunlight back through the valley system and sets `valley.light_restored`. | Finale design must specify the actual final action before prompts are written. |

## Finale Sequence

The player may travel instantly on the map during play. The final visual payoff should still follow a deliberate physical order rather than flipping unrelated screens bright at random.

```text
Sun Observatory: great mirror turns
  -> Mirror Hall: beam is accepted and redirected
  -> Temple Steps: sun marks and running water catch warm light
  -> Sun Courtyard: stone flower glows
  -> Waterfall Mouth: water reflects the returning light
  -> Village Garden: plants and flowers turn toward it; Lina reacts
  -> Base Camp: sun flower rises; Compass and map are complete
```

This can be implemented later as a short sequence of existing scene visits, a map-led montage, or a concise finale transition. Workstream 3 does not choose the presentation system; it fixes the causal order that any presentation must respect.

## Art Strategy

### Required Principles

- Prefer small state overlays, state frames, and atlas additions over new full backgrounds.
- Use a state overlay only when it changes the child’s reading of the world.
- Match the existing painted lighting, camera, perspective, and ground contact exactly.
- Never add a final-state decoration just to make a screen brighter.
- Keep interactive and collectible props separate from final-state art. Restoration art must not create accidental hotspots or false inventory expectations.

### Approved Future Asset Package

Generate this package only after Mirror Hall and the Observatory design deliverables are approved:

1. Base Camp restored flower state, including any needed cover/mask for the baked drooping flower.
2. Five-lens / complete Compass state frames and complete-map UI state.
3. Village Garden sunlight-and-plant-turn state overlay.
4. Temple Steps warm channel / sun-mark state overlay, if the final visual route uses it.
5. Sun Courtyard warm central-flower glow overlay, if the finale revisits it.
6. Mirror Hall beam state frames.
7. Observatory Door open state and Sun Observatory great-mirror states.
8. Waterfall reflection overlay only if it makes the final light path clearer.

### Explicit Deferrals And Rejections

- No full-background regeneration for the existing playable regions at this stage.
- No Base Camp flower overlay is generated now: the current drooping flower is already baked into the accepted background, while its final counterpart needs a confirmed final art package and masking plan.
- No global yellow filter or indiscriminate “sunny” version of every screen.
- No additional props, collectibles, NPCs, or errands for the purpose of showing restoration.
- No final brightening of Dark Cave or the Camp Supply Tent.

## Implementation Contract For The Finale

When the finale is built:

1. Keep local facts such as `bridge.repaired`, `waterfall.cave_lit`, and `temple.gate_open` as the source for local solved overlays.
2. Use `valley.light_restored` as the one global condition for recurring restored-light overlays.
3. Do not duplicate that global result into per-screen facts unless a screen has a separate gameplay requirement. UI and art may derive their final state from the global fact.
4. Continue to use `scene.entered` only for one-time spoken reactions or arrival beats; it must not be required to make final art appear.
5. Keep the normal, local-solved, and final-state layers composable. A save restored after the finale must render correctly on direct map travel to every prior region.
6. Add no restoration hotspot unless it has a clear optional inspect line. The finale should be a reward for past actions, not a hidden second checklist.

## Future Verification Plan

Once finale content exists, add a campaign-state test fixture or equivalent smoke-test setup that begins with:

```json
{
  "bridge.repaired": true,
  "waterfall.cave_lit": true,
  "dark_cave.box_open": true,
  "temple.channel_filled": true,
  "temple.gate_open": true,
  "temple.sun_flower_open": true,
  "compass.green_lens_placed": true,
  "compass.blue_lens_placed": true,
  "compass.stone_lens_placed": true,
  "compass.mirror_lens_placed": true,
  "compass.sun_lens_placed": true,
  "valley.light_restored": true,
  "map.complete": true
}
```

Verify at minimum:

- existing local repairs are still visible;
- each required final overlay appears only under `valley.light_restored`;
- travel directly to an old region does not lose its local state;
- inventory remains clean after lens placement;
- final art creates no misleading takeable object or overlapping hotspot;
- disabled and locked map states still distinguish unrevealed future locations before the finale.

## Decisions Still Owned By Later Workstreams

- Exact Mirror Hall mirror layout, interaction verbs, beam path, and Mirror Lens reward.
- Exact Observatory approach, Sun Lens source, and access condition.
- Whether the finale uses a short guided montage, child-controlled revisits, or a hybrid.
- Precise overlay dimensions, masks, and prompt language, which must be based on the actual finalized art compositions.
- Final Lina and Mira dialogue, after the actual ending action and travel sequence are known.

## Handoff

Workstream 3 is complete when this document remains consistent with the live first three slices and final art has not been prematurely generated. The next sequential task is Workstream 4: create the full Mirror Hall design package before any Mirror Hall images or scenario JSON are made.
