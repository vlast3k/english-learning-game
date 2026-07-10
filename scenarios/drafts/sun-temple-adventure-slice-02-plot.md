# Sun Temple Adventure Slice 02 Plot

This file defines the second playable slice for `sun-temple-adventure`.

Read this after:

1. `scenarios/drafts/sun-temple-adventure-plot.md`
2. `scenarios/drafts/sun-temple-adventure-world-map.md`
3. `scenarios/drafts/sun-temple-adventure-dependency-graph.md`
4. `scenarios/drafts/sun-temple-adventure-next-steps.md`

Do not generate scenario JSON from this file alone. Use it with the slice-two dependency graph, screen/prop map, curriculum ledger, asset plan, and prompt files.

## Current Status

Status: first-pass slice-two design drafted.

Slice two working title: `The Waterfall Cave`

Primary reward: `Blue Lens`

New region purpose: prove that the adventure can extend beyond the first slice without becoming a quiz chain.

## Entry State

Slice two begins after the first slice milestone:

```text
compass.green_lens_placed = true
location.waterfall_cave.revealed = true
sun_temple.slice_01.complete = completed
```

The Waterfall Cave marker is visible on the map, but the cave is dark. Alex needs a small light source before entering.

## Slice-Two Promise

The child should feel:

- "The map changed because I placed the Green Lens."
- "I need to make light for the cave."
- "I know where to get the parts."
- "The cave opens because I used the thing I made."
- "The Blue Lens was inside the cave."

The slice should not feel:

- like a grammar test;
- like a random fetch quest;
- like a dangerous cave;
- like it introduced lots of pretty props that do not matter.

## New Screens

Slice two adds three new screen backgrounds:

1. `keeper-hut`
2. `waterfall-mouth`
3. `dark-cave`

It also reuses:

- `village-garden` as the approach to the keeper hut;
- `base-camp-table` as the Sun Compass lens-placement hub;
- the HUD map to jump between discovered locations.

## Plot Beats

### Beat 1: The Green Light On The Map

After Alex places the Green Lens, the map shows a new marker: Waterfall Cave. Mira explains the cave is on the map, but it is dark.

Adventure purpose:

- connect slice one reward to slice two;
- make the map feel alive;
- establish the new goal without a quiz.

Draft line:

```text
The cave is on the map. It is dark.
```

### Beat 2: Lina's Keeper Hut

In the village, Lina's small keeper hut has simple garden tools and one useful object: an empty jar. The hut should feel like a practical place, not a loot room.

Mira or Lina plants the idea before the player needs it:

```text
A jar can hold light.
```

Alex takes the empty jar.

Adventure purpose:

- add the deferred `keeper-hut` screen from slice one;
- introduce one clean combine part;
- keep the NPC story grounded in Lina's garden world.

Draft line:

```text
This is an empty jar.
```

### Beat 3: Glow Leaves At The Waterfall

The Waterfall Mouth is beautiful and readable: safe stepping stones, bright water, and a dark cave mouth behind the falling water. Near the cave are glow leaves that softly shine.

Alex takes a glow leaf and combines it with the empty jar to make a glow jar.

Adventure purpose:

- use item combining again;
- avoid fire/torch handling;
- make the light source visually connected to the cave region.

Draft line:

```text
The leaf has light.
```

### Beat 4: Open The Dark Cave

The cave entrance is too dark until Alex uses the glow jar on it. Using the glow jar changes the waterfall-mouth state and unlocks the Dark Cave screen.

Adventure purpose:

- use an inventory item on a screen target;
- make the blocked path clear and non-scary;
- open a new place through player action.

Draft line:

```text
The cave is light now.
```

### Beat 5: The Blue Stone Box

Inside the Dark Cave, a blue sun mark glows on an old stone box. The cave is calm, with shallow water and friendly blue light. A small blue glint and a tiny sun mark on the cave wall point to a crack. Alex finds a small stone key in the crack after inspecting the wall.

Alex uses the stone key on the blue stone box. The box opens and reveals the Blue Lens.

Adventure purpose:

- add a second item-use step inside the cave;
- make the lens feel earned;
- give the cave a memorable object that maps cleanly to a prop/state overlay.

Draft lines:

```text
There is a key in the wall.
Use the key on the box.
```

### Beat 6: Return To The Sun Compass

Alex returns to Base Camp and places the Blue Lens in the Sun Compass. The Blue Lens is removed from inventory, appears on the compass, and reveals the Temple Steps marker as the next forward hook.

Adventure purpose:

- reinforce Base Camp as the hub;
- show progress on the five-lens campaign;
- end the slice with a new map destination.

Draft line:

```text
The temple steps are on the map.
```

## Character Usage

No new NPC is required in slice two.

- Mira remains at Base Camp for global hints.
- Lina remains in Village Garden for optional reminders.
- `keeper-hut` has no visible NPC in the first implementation. It belongs to Lina, but the screen should be a practical room, not a second conversation scene.

This avoids adding multi-NPC runtime complexity before it is needed.

## Slice-Two Item Set

| Item ID | Player-facing name | Role |
| --- | --- | --- |
| `empty_jar` | empty jar | combine part from keeper hut; motivated by `A jar can hold light.` |
| `glow_leaf` | glow leaf | combine part from waterfall mouth |
| `glow_jar` | glow jar | light source used on dark cave entrance |
| `stone_key` | stone key | opens the blue stone box |
| `blue_lens` | Blue Lens | second Sun Compass progress item |

## Excluded Ideas

Rejected for slice two:

- torch or fire item: too risky and less child-safe than a glow jar;
- rival explorer: user chose obstacle-only adventure;
- grammar questions at the cave door: against the second-game goal;
- many hut tools: likely to create false clickable props;
- multi-NPC cave dialogue: unnecessary for this slice.

## Open Questions Resolved Autonomously

- **Should the cave light source be a torch, lamp, or glow jar?** Use `glow_jar`.
- **Should `keeper-hut` be in slice two?** Yes. It provides the `empty_jar`.
- **Should there be a new NPC?** No. Use existing Mira/Lina optional hints only.
- **Should the Blue Lens be in a stone box or loose in the cave?** Put it in a blue stone box so the cave has an adventure action before the reward.
- **Should Temple Steps be implemented now?** No. Reveal the marker as the forward hook only.
- **How does the child know to look for a jar?** Use the hint line `A jar can hold light.`
- **Why does inspecting the cave wall reveal the key?** A blue glint and tiny sun mark make the wall crack a fair clue.
- **How does the Blue Lens stay readable in a blue cave?** Give it a bright rim, clean circular silhouette, and sun motif.

## Compaction Handoff

Continue with:

1. `scenarios/drafts/sun-temple-adventure-slice-02-dependency-graph.md`
2. `scenarios/drafts/sun-temple-adventure-slice-02-screen-prop-map.md`
3. `scenarios/drafts/sun-temple-adventure-slice-02-curriculum-ledger.md`
4. `scenarios/drafts/sun-temple-adventure-slice-02-asset-plan.md`
5. `scenarios/drafts/sun-temple-adventure-slice-02-art-director-review.md`
