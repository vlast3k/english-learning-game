# Sun Temple Adventure Slice 02 Asset Plan

This asset plan defines first-pass art needs for the Waterfall Cave slice.

Source files:

- `scenarios/drafts/sun-temple-adventure-slice-02-plot.md`
- `scenarios/drafts/sun-temple-adventure-slice-02-dependency-graph.md`
- `scenarios/drafts/sun-temple-adventure-slice-02-screen-prop-map.md`
- `scenarios/drafts/sun-temple-adventure-slice-02-curriculum-ledger.md`

## Current Status

Status: first-pass asset plan drafted, reviewed, prompt pack created, and first-pass images generated.

## Asset Principles

- Generate only what the dependency graph needs.
- Backgrounds should contain the screen identity and stable scenery.
- Takeable/changing props should be in a separate prop atlas.
- Avoid extra clickable-looking tools.
- Keep walkable ground clear.
- Leave space for HUD, inventory, map panel, and dialogue bubbles.
- Keep the cave magical and calm, never horror-like.

## Proposed Asset Directory Additions

```text
assets/sun-temple-adventure/keeper-hut/
  prompts/
  generated/
assets/sun-temple-adventure/waterfall-mouth/
  prompts/
  generated/
assets/sun-temple-adventure/dark-cave/
  prompts/
  generated/
assets/sun-temple-adventure/shared/prompts/prop-state-atlas-slice-02.md
assets/sun-temple-adventure/shared/generated/prop-state-atlas-slice-02-v1-source.png
assets/sun-temple-adventure/shared/generated/prop-state-atlas-slice-02-v1.png
```

## Screen Background Assets

| Screen | Background asset | Required state variants | Notes |
| --- | --- | --- | --- |
| `keeper-hut` | `background-v1.png` | base only; jar is overlay | Warm hut, simple shelf, no tool clutter. |
| `waterfall-mouth` | `background-v1.png` | base only; cave light can be overlay | Waterfall, dark entrance, glow-leaf area. |
| `dark-cave` | `background-v1.png` | base only; key/box/lens overlays | Calm cave, fair wall-crack clue, stone box area. |

## Prop And State Overlay Assets

| Asset | Screen | Why separate |
| --- | --- | --- |
| empty jar | `keeper-hut` | takeable item, inventory icon |
| glow leaf | `waterfall-mouth` | takeable item, inventory icon |
| glow jar | inventory/use overlay | combine result, inventory icon |
| cave-lit glow overlay | `waterfall-mouth` | state after using glow jar |
| stone key | `dark-cave` | hidden then takeable |
| blue stone box shut/open | `dark-cave` | state change |
| Blue Lens | `dark-cave`, inventory | progress item |
| Blue Lens placed compass overlay | `base-camp-table` | progress state |

## Background Prompt Files To Create

```text
assets/sun-temple-adventure/keeper-hut/prompts/background.md
assets/sun-temple-adventure/waterfall-mouth/prompts/background.md
assets/sun-temple-adventure/dark-cave/prompts/background.md
assets/sun-temple-adventure/shared/prompts/prop-state-atlas-slice-02.md
```

## Dominant Visual Focus

| Screen | Dominant focus |
| --- | --- |
| `keeper-hut` | one empty jar on a simple keeper shelf |
| `waterfall-mouth` | dark cave entrance behind bright waterfall and one glow-leaf cluster |
| `dark-cave` | blue stone box as main focus, with a fair wall-crack clue nearby |

## Chroma-Key Prop Atlas

Generate the prop atlas on flat `#ff00ff` chroma-key because some props are green/blue.

Required atlas objects:

1. empty jar
2. glow leaf
3. glow jar
4. cave-lit glow overlay
5. stone key
6. blue stone box shut
7. blue stone box open
8. Blue Lens
9. Blue Lens placed compass overlay

The atlas should have generous padding between objects and no shadows touching the key color.

Readability requirements:

- `glow_leaf` must look like a leaf with light, not a gem or lens.
- `Blue Lens` must have a bright rim and clear circular silhouette so it does not disappear against blue cave art.
- `stone_key` must be small but readable.

## Deferred Assets

- Temple Steps background: not generated in slice two; only reveal map marker.
- New NPCs: none.
- New hero art: defer.
- True multi-NPC rendering: defer until a screen needs it.

## Art Generation Batch

First-pass generation created:

1. `keeper-hut/generated/background-v1.png`
2. `waterfall-mouth/generated/background-v1.png`
3. `dark-cave/generated/background-v1.png`
4. `shared/generated/prop-state-atlas-slice-02-v1-source.png`
5. processed transparent prop atlas: `shared/generated/prop-state-atlas-slice-02-v1.png`
6. starter frame manifest: `shared/generated/asset-frames-slice-02-v1.json`

Contact sheet:

```text
assets/sun-temple-adventure/generated-contact-sheet-slice-02-v1.jpg
```

## Generated First Pass Notes

- `keeper-hut` succeeds as a practical hut screen with one obvious jar and no competing tool clutter.
- `waterfall-mouth` succeeds as a blocked cave entrance screen; the cave reads before the waterfall overwhelms it, and the glow-leaf cluster sits near the entrance.
- `dark-cave` succeeds as a calm lit cave screen. It includes a glow jar in the scene, which supports the lit-cave state. The wall crack has a blue glint and the blue stone box is the clear final focus.
- The prop atlas converted cleanly from magenta chroma-key to alpha. It includes jar, glow leaf, glow jar, cave glow, stone key, shut/open box, Blue Lens, Blue Lens compass slot, and Temple Steps marker.
- Starter crop frames are recorded in `assets/sun-temple-adventure/shared/generated/asset-frames-slice-02-v1.json`.
- The Temple Steps marker is more emblematic/golden than map-like, but usable as a locked forward hook unless a later UI pass needs a flatter map marker.

## Next Implementation Step

Create slice-two scenario JSON and mission rules only after reviewing the generated contact sheet and deciding the hotspot coordinates. Do not remap slice-one hotspots as part of that work.
