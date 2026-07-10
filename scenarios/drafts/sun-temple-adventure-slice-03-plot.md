# Sun Temple Adventure Slice 03 Plot

This file designs the third playable slice for `sun-temple-adventure`.

Read after:

1. `scenarios/drafts/sun-temple-adventure-plot.md`
2. `scenarios/drafts/sun-temple-adventure-slice-02-plot.md`
3. `scenarios/drafts/sun-temple-adventure-slices-01-02-polish-review.md`

Do not generate prompts, art, scenario JSON, or mission JSON from this file alone.

## Current Status

Status: implemented and browser-smoke-tested. The remaining slice-three task is user-led hotspot alignment in the level editor.

Working title: `The Temple Steps`

Primary reward: `Stone Lens`

## Entry State

Slice three starts after the Blue Lens is placed in the Sun Compass:

```text
compass.blue_lens_placed = true
location.temple_steps.revealed = true
slice.blue_lens_complete = true
```

The Temple Steps marker is visible but locked at the end of slice two. After the placement dialogue, it becomes the next available destination.

## Slice Promise

The child should feel:

- "The compass showed a real new place."
- "I found a cup at the temple, but the water is at the waterfall."
- "I went back to a place I know and used the cup there."
- "The water opened the temple path."
- "The Stone Lens belongs to this sunny courtyard."

The slice should not feel:

- like a lesson about temple history;
- like three unrelated stone props;
- like a map marker that exists only to add another screen;
- scary, dangerous, or combat-oriented.

## Plot Beats

### Beat 1: The Steps On The Map

The Blue Lens reveals Temple Steps. Mira says only that the steps are on the map. The child travels there and sees a warm, sealed stone gate with a dry sun channel leading toward the temple.

The channel must visibly run from the cup area, through the gate, and onward toward the courtyard. It gives one clear visual problem: it needs water.

Draft line:

```text
The stone gate needs water.
```

### Beat 2: The Empty Stone Cup

Beside the steps is one obvious stone cup with a simple sun motif. Alex takes it. The cup is empty, so it naturally suggests a return to the waterfall.

Draft line:

```text
This cup is empty.
```

### Beat 3: Return To The Waterfall

At Waterfall Mouth, Alex uses the empty stone cup on a calm, obvious fillable edge of the pool below the waterfall. The empty cup becomes a water cup.

The pool is a new use target, not a new collectible. It keeps the existing waterfall screen useful after the Blue Lens is found.

Draft lines:

```text
The waterfall has water.
I have water now.
```

### Beat 4: Open The Stone Gate

Alex returns to Temple Steps and uses the water cup on the dry sun channel. Water visibly runs through the old channel toward the courtyard, the gate opens, and the water cup is consumed as a placed world action. The open gate is the immediate, obvious next path; map travel may unlock later but should not interrupt this moment.

Draft line:

```text
The gate is open.
```

### Beat 5: The Sun Courtyard

Inside is a bright, safe courtyard with a stone sun flower at its centre. The newly flowing water has already opened the flower, and the Stone Lens visibly glints inside it. Alex simply takes it.

This makes the lens feel like a reward from a visible cause, not a loose treasure.

Draft lines:

```text
The water opens the flower.
I can see the Stone Lens.
```

### Beat 6: Return To Base Camp

Alex returns to Base Camp and places the Stone Lens in the Sun Compass. The lens is removed from inventory, appears on the compass, and reveals the Mirror Hall marker as the next forward hook.

Draft line:

```text
The mirror hall is on the map.
```

## New And Reused Screens

New backgrounds:

1. `temple-steps`
2. `sun-courtyard`

Reused backgrounds:

- `waterfall-mouth`: add a pool use target for filling the cup;
- `base-camp-table`: add Stone Lens compass overlay and Mirror Hall marker.

No new visible NPC is required. Mira remains the optional Base Camp hint; Temple Steps and Sun Courtyard should tell their story through the water channel and flower state.

## Item Set

| Item ID | Player name | Source | Removed by | Purpose |
| --- | --- | --- | --- | --- |
| `stone_cup` | stone cup | Temple Steps | fill at waterfall | carries water |
| `water_cup` | water cup | use stone cup on waterfall pool | use on sun channel | opens gate |
| `stone_lens` | Stone Lens | Sun Courtyard | place in Sun Compass | third campaign lens |

The water cup is not a permanent inventory item. It is consumed when the channel fills, keeping the inventory clean.

## Excluded Ideas

- no animal-door or matching quiz at the gate;
- no new temple NPC before true multi-NPC rendering exists;
- no loose gems, keys, many cups, or many slots;
- no water danger, falling hazards, traps, or enemy guardians;
- no Temple Steps art generation until review is complete.

## Compaction Handoff

Next, create the dependency graph, screen/prop map, and curriculum ledger. Then ask the LucasArts Senior Art Director and Game Designer to review this slice before any prompt or art work.
