# Sun Temple Adventure Slice 04 Plot

This file defines the fourth playable slice for `sun-temple-adventure`.

Read after:

1. `scenarios/drafts/sun-temple-adventure-current-walkthrough.md`
2. `scenarios/drafts/sun-temple-adventure-final-creative-design-proposal.md`
3. `scenarios/drafts/sun-temple-adventure-world-state-plan.md`
4. `scenarios/drafts/sun-temple-adventure-creative-proposal-action-plan.md`

Do not generate prompts, art, scenario JSON, or mission JSON from this file alone. The dependency graph, screen/prop map, curriculum ledger, art-director review, and asset plan are still required.

## Current Status

Status: design draft. Nothing in this slice is implemented.

Working title: `The Mirror Hall`

Primary reward: `Mirror Lens`

New region purpose: show that the temple carried and redirected real sunlight. The child solves a short, visible cause-and-effect puzzle rather than collecting another unrelated object.

## Entry State

Slice four begins after Alex places the Stone Lens in the Sun Compass:

```text
compass.stone_lens_placed = true
location.mirror_hall.revealed = true
slice.stone_lens_complete = true
```

The Mirror Hall map marker becomes usable at this point. It is not a locked teaser: the Stone Lens is the reward that opens the next place.

## Slice Promise

The child should feel:

- "The three lenses led me somewhere real."
- "I can see where the light starts and where it needs to go."
- "This mirror changed the beam, so I know what to try next."
- "The temple did not make sunlight. It carried it."
- "The Mirror Lens points the adventure toward the observatory."

The slice should not feel:

- like a dark maze or a scary temple;
- like a hidden-combination lock;
- like a physics simulation that demands precise aim;
- like another key-and-box chain;
- like a lecture about reflection;
- like a collection of decorative mirrors with no job.

## Core Puzzle Grammar

Everything in the room must read through three visual ideas:

```text
light source -> mirrors -> sealed sun panel
```

- A narrow warm beam enters through a high wall opening.
- A fixed mirror immediately reflects it, teaching the rule before the child touches anything.
- Two distinct movable mirror panels are the only required interactions.
- The sealed sun panel is visible from the beginning and contains the Mirror Lens behind a translucent stone cover.

The child never needs to guess a code. At every state, the visible beam shows what the latest action did and what part of the room is still dark.

## Plot Beats

### Beat 1: A Line Of Light

After Stone Lens placement, the Compass reveals Mirror Hall as a usable map destination. Alex enters a calm, high-ceilinged inner chamber, not a ruin full of hazards. A thin shaft of daylight enters through an opening near the ceiling.

The beam reaches one fixed mirror and turns across the floor. It then stops short of a second, dark mirror panel. Across the room, a sealed sun panel holds a clear circular shape: the Mirror Lens.

The room itself tells the immediate goal. Mira does not explain the solution before the child looks.

Draft arrival reaction:

```text
Alex: The light is already inside.
```

Optional Mira response when Alex later returns to Base Camp:

```text
Mira: The hall may show where the temple sent it.
```

Adventure purpose:

- pay off the Stone Lens map reveal;
- establish a non-threatening new kind of obstacle;
- make the destination and its reward visible before any interaction.

### Beat 2: The First Turn

The nearer movable mirror has two clear resting positions. In its starting position, the fixed beam ends on the wrong part of the wall beside the second mirror. A sun-marked hinge or simple bright edge shows that it can turn.

Alex changes the nearer mirror once. The beam now reaches the far movable mirror. The first successful state remains visible and never resets.

Draft reaction:

```text
Alex: The light reaches the next mirror.
```

Adventure purpose:

- make one action produce an immediate, legible result;
- teach the full puzzle rule with the first move;
- give the child a reason to examine the remaining dark mirror.

### Beat 3: The Second Turn

The far mirror also has two clear resting positions. Its starting angle sends the incoming beam onto a blank stone wall near the sun panel. Its other angle sends the beam directly to the sealed sun panel.

The child changes this mirror once. The full beam visibly connects source, fixed mirror, near mirror, far mirror, and sun panel. No correct state is undone by a later action; the only wrong state is a useful visible dead-end beam.

Draft reaction:

```text
Alex: It reaches the sun panel now.
```

Adventure purpose:

- let the child predict the final action from the first reflection;
- keep the puzzle to two meaningful choices rather than repeated rotation;
- make the solution read spatially, not verbally.

### Beat 4: The Mirror Lens

When the beam reaches the sun panel, the stone cover opens or becomes transparent with a warm glow. The Mirror Lens is clearly visible and can be taken directly. It is the only new inventory item in this slice.

Taking the lens does not turn off the beam. The completed route remains visible on all revisits, so the room continues to explain its own solution.

Draft lines:

```text
Alex: The light opened the panel.
Alex: This is the Mirror Lens.
```

Adventure purpose:

- give the reward a visible physical cause;
- reinforce that light, rather than a hidden mechanism, opened the way;
- keep the inventory clean and purposeful.

### Beat 5: The Observatory Route

The completed beam also strikes a high sun mark beyond the panel, producing a distant reflected glint in the direction of the observatory route. The glint is a forward hook, not a second Mirror Hall task and not the final restoration.

The map may now show the future observatory route as a locked or incomplete marker. The exact label and access condition belong to Workstream 6; this slice only establishes that the beam leads upward and outward.

Draft reaction:

```text
Alex: The beam goes up the mountain.
```

Adventure purpose:

- make Mirror Hall part of the larger valley system;
- promise the Observatory without trying to solve it early;
- make the next campaign direction feel earned.

### Beat 6: Return To The Sun Compass

Alex returns to Base Camp and places the Mirror Lens in the Sun Compass. The lens is removed from inventory and visibly joins the three existing lenses. The Compass now shows four connected paths and one remaining dark space.

The high observatory approach becomes visible on the map as the next future region. It should be represented as an incomplete forward hook until Workstream 6 decides how Alex earns the Sun Lens and reaches Observatory Door.

Draft exchange:

```text
Mira: Four lenses show the route. One space is still dark.
Alex: The Sun Lens completes it.
```

Adventure purpose:

- preserve Base Camp as the campaign progress hub;
- state the remaining mystery without explaining the finale;
- end Slice 4 on a clear but not immediately solvable promise.

## Screens

New background:

1. `mirror-hall`

Reused screens:

- `base-camp-table`: Mirror Lens placement and four-lens Compass/map state;
- HUD map: Mirror Hall travel and the future observatory forward hook.

The slice is intentionally one new location. It is a focused spatial puzzle, and splitting it into several rooms would weaken the child's ability to read the beam as one continuous system.

## Character Usage

No new NPC is required.

- Alex is the principal voice in Mirror Hall. Alex notices light and forms the first theory.
- Mira remains at Base Camp as the concise Compass-response companion.
- Lina has no required Slice-4 dialogue; the garden payoff is reserved for the final restoration.

This keeps the room quiet enough for the visible beam to do the explaining.

## Item Set

| Item ID | Player-facing name | Source | Removed by | Purpose |
| --- | --- | --- | --- | --- |
| `mirror_lens` | Mirror Lens | opened sun panel in Mirror Hall | place in Sun Compass | reveals the observatory direction and fills the fourth Compass position |

The mirror panels are world mechanisms, not inventory items. They cannot be picked up, combined, or used outside Mirror Hall.

## Explicit State Direction

The dependency graph should use small declarative states, not a physics system:

```text
mirror_hall.light_source_revealed
mirror_hall.near_mirror_aligned
mirror_hall.far_mirror_aligned
mirror_hall.beam_path_complete
mirror_hall.sun_panel_open
item.mirror_lens.taken
compass.mirror_lens_placed
```

Each mirror must have only two child-readable states. The state names, art frames, and exact rule priorities will be finalized in the dependency graph and screen/prop map.

## Excluded Ideas

- no keys, boxes, cups, jars, rope, or fresh collectible chain;
- no moveable furniture, free-aim laser, drag puzzle, timer, enemy, trap, or failure reset;
- no third movable mirror unless the dependency review proves two cannot form a readable path;
- no new companion, rival, temple guardian, or exposition character;
- no Observatory Door interaction in this slice;
- no Mirror Hall art, prompts, scenario JSON, or map marker implementation before review.

## Questions Deferred To The Next Design Documents

- Which exact two mirror/panel shapes best distinguish the near and far interactions?
- Does the far mirror use a turn, a slide, or a two-position panel? It must remain a two-state visual choice.
- Should the future map hook be named `Observatory Approach`, `High Path`, or remain an unlabeled locked marker until Slice 5 design?
- Which visible architecture can show the beam continuing upward without implying that the final observatory is already open?
- Do both mirror interactions need their own optional Bulgarian-supported inspect line, or is the visible beam sufficient after the first explanation?

## Compaction Handoff

The Slice 4 plot is drafted. Next, create `sun-temple-adventure-slice-04-dependency-graph.md`. It must turn this exact two-mirror path into facts, gates, state transitions, map states, failure-safe interaction rules, and a smoke-testable happy path before any art or runtime implementation begins.
