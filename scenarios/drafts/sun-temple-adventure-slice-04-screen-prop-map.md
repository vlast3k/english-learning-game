# Sun Temple Adventure Slice 04 Screen, Prop, And NPC Map

This file turns the approved Mirror Hall dependency graph into scene and asset requirements. Later prompts and scenario JSON must preserve these rules.

## Current Status

Status: design approved for asset planning. No Slice 4 scenario, hotspot, or art asset exists yet.

## Global Requirements

- Reuse the existing HUD map, inventory, and Base Camp Compass hub.
- Add one new playable background only: `mirror-hall`.
- Add no visible NPC to the hall. Alex's short observations and the beam itself carry the scene.
- Include exactly three mirrors: one fixed teaching mirror and two movable panels.
- Keep the initial beam, each extended beam state, and the sealed sun panel readable at normal game scale.
- Do not put text, arrows, numbered instructions, riddles, keys, weapons, loose coins, or extra collectible-looking objects into the painting.
- Reserve clear lower-ground space for hero movement and clear upper corners for HUD/dialogue.

## Screen: `mirror-hall`

### Purpose

- turn the Stone Lens map promise into a real place;
- teach reflection through a visible fixed example;
- provide exactly two cause-and-effect interactions;
- visibly reveal the Mirror Lens;
- point the campaign upward toward the future observatory.

### Required Composition

The room is a calm, broad inner hall, viewed as one coherent puzzle board rather than a maze. It should feel ancient and warm enough to explore, with cool stone shadows only where they help the beam stand out.

Required stable elements:

- one narrow high wall opening at upper left or upper centre, visibly admitting warm daylight;
- one fixed mirror positioned so its reflection is visible immediately;
- a near movable mirror in the mid-ground, visually closest to the fixed reflection;
- a far movable mirror clearly downstream from the near mirror;
- one large sealed sun panel on the far wall, visible from the first arrival and clearly beyond the far mirror;
- a small high opening or architectural line beyond the sun panel that can later read as the observatory direction;
- quiet walkable lower third and a single clear exit back to the map/temple route.

The intended reading order is spatial, not written:

```text
source opening -> fixed mirror -> near mirror -> far mirror -> sun panel -> high route
```

### Hotspot Contract

Coordinates and radii are intentionally omitted. The user will align them in the level editor after first-pass integration.

| Hotspot ID | Kind | Object | Visible condition | Interaction result |
| --- | --- | --- | --- | --- |
| `light_source` | inspect | high daylight opening | always | optional first observation |
| `fixed_mirror` | inspect | fixed reflective surface | always | optional rule reminder |
| `near_mirror` | inspect / mechanism | first movable mirror | always | one-way alignment; first beam extension |
| `far_mirror` | inspect / mechanism | second movable mirror | always | early clue or second alignment |
| `sun_panel` | inspect | sealed panel holding Lens | always | early closed feedback; Lens reveal after beam completion |
| `mirror_lens` | takeable | Mirror Lens within opened panel | `mirror_hall.sun_panel_open` and not taken | add inventory |
| `exit_map_path` | exit | hall entrance/path | always | leave scene |

No hidden hotspot exists behind a painting, shadow, or decorative prop. The near and far mirror click zones must cover their actual visible reflecting faces, not a distant hinge or tiny glint.

### State Variants

| State | Background / stable art | Overlay state |
| --- | --- | --- |
| teaching | source, fixed mirror, two mounts, sealed panel | near mirror starting position; far mirror starting position; initial visible beam route |
| first extension | unchanged | near mirror aligned; initial dead-end beam hidden; beam reaches far mirror; far mirror still sends beam to wall |
| completed route | unchanged | both mirrors aligned; beam reaches sun panel; panel-open state; Mirror Lens world prop visible |
| lens taken | unchanged | completed beam and open panel remain; Mirror Lens world prop hidden |

The background must not bake in the Mirror Lens, the beam paths, the mirror orientations, or a panel that is permanently open. These are stateful overlays.

## Reused Screen: `base-camp-table`

New Slice 4 requirements:

- Sun Compass accepts `mirror_lens` after it is taken.
- Mirror Lens overlay appears as the fourth placed lens.
- Map presentation changes to show an `Observatory Approach` forward hook.
- The hook is visible but unavailable until the Slice 5 dependency graph defines its actual route and Sun Lens condition.

Do not add a new Base Camp prop, NPC, or extra Compass interaction for this slice.

## HUD Map Requirement

| Marker | State | Meaning |
| --- | --- | --- |
| Mirror Hall | available after Stone Lens placement | active Slice 4 destination |
| Observatory Approach | visible after Mirror Lens placement, disabled | future high route; not a secret item or playable location yet |

The marker needs a distinct architectural/beam emblem. It must not look like a sixth collectible, a coin, or a lens.

## Slice 4 Prop Budget

| Prop | Screen | Visible on entry | Clickable | Inventory | State role |
| --- | --- | --- | --- | --- | --- |
| daylight opening | Mirror Hall | yes | optional inspect | no | source |
| fixed mirror | Mirror Hall | yes | optional inspect | no | rule demonstration |
| near mirror | Mirror Hall | yes | yes | no | first alignment |
| far mirror | Mirror Hall | yes | yes | no | second alignment |
| beam route | Mirror Hall | yes | no | no | state feedback |
| sealed sun panel | Mirror Hall | yes | optional inspect | no | destination / opens |
| Mirror Lens | Mirror Hall | no, until panel opens | yes | yes | reward / removed after pickup |
| Mirror Lens Compass state | Base Camp | after placement | no | no | persistent campaign progress |
| Observatory Approach marker | HUD map | after placement | disabled | no | forward hook |

## Art False-Lead Rules

- no fourth mirror, mirror shards, decorative mirror wall, or reflectively shiny floor that could look interactive;
- no treasure chest, keyhole, pedestal, book, map piece, loose lens, rope, jar, cup, or tool;
- no character portrait, statue face, monster, skull, trap, weapon, or readable inscription;
- no dense vine cover, deep black corridor, or branching doorway that reads as an unexplained route;
- no background beam that bypasses the two required mirror states;
- no labels such as `turn`, `light`, arrows, numbers, or letters painted in the scene.

