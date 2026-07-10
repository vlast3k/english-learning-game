# Sun Temple Adventure Slice 03 Asset Plan

This asset plan turns the approved Temple Steps design into the smallest useful art package.

Sources:

- `sun-temple-adventure-slice-03-plot.md`
- `sun-temple-adventure-slice-03-dependency-graph.md`
- `sun-temple-adventure-slice-03-screen-prop-map.md`
- `sun-temple-adventure-slice-03-curriculum-ledger.md`
- `sun-temple-adventure-slice-03-art-director-review.md`

## Current Status

Status: generated, integrated, and browser-smoke-tested. The state atlas remains available for inventory and progress art; the solved Temple Steps water is rendered directly along the painted channel.

## Asset Principles

- Generate only the two new backgrounds and state props required by the dependency graph.
- Do not regenerate Waterfall Mouth: its existing shallow pool is reused as the cup-fill target.
- Keep changing/takeable items out of backgrounds whenever possible.
- The cup, water cup, Stone Lens, and compass progress must be separate atlas elements.
- The Temple Steps water action must read at a glance: cup area -> continuous channel -> opened gate -> courtyard.
- No new NPC art, decorative tools, doors, keys, coins, or false-lead objects.

## New Directories

```text
assets/sun-temple-adventure/temple-steps/
  prompts/
  generated/
assets/sun-temple-adventure/sun-courtyard/
  prompts/
  generated/
assets/sun-temple-adventure/shared/prompts/prop-state-atlas-slice-03.md
assets/sun-temple-adventure/shared/generated/prop-state-atlas-slice-03-v1-source.png
assets/sun-temple-adventure/shared/generated/prop-state-atlas-slice-03-v1.png
assets/sun-temple-adventure/shared/generated/asset-frames-slice-03-v1.json
```

## Background Assets

| Screen | Asset | Stable scene content | Must not be baked in |
| --- | --- | --- | --- |
| `temple-steps` | `background-v1.png` | dry sun channel, fixed open arch, warm temple beyond, cup rest | stone cup, water, closed/open gate state, text |
| `sun-courtyard` | `background-v1.png` | open courtyard, already-open stone sun flower, flowing channel, exit path | Stone Lens, text, extra tools |

## State Prop Atlas

Use a flat `#ff00ff` chroma-key source so the final atlas can become alpha PNG.

| Atlas element | Used by | Purpose |
| --- | --- | --- |
| stone cup | Temple Steps / inventory | takeable container |
| water cup | inventory | filled result |
| closed gate overlay | Temple Steps | opaque initial gate state over the fixed arch footprint |
| open gate overlay | Temple Steps | opaque solved gate state over the same fixed arch footprint |
| channel flow start | Temple Steps | water from cup rest to arch |
| channel flow gate | Temple Steps | water through the fixed arch footprint |
| channel flow beyond gate | Temple Steps | water continuing visibly toward courtyard |
| Stone Lens | Sun Courtyard / inventory | third lens reward |
| Stone Lens compass overlay | Base Camp | persistent placement state |
| Mirror Hall map marker | HUD map | locked forward hook |

The `open_gate` frame remains available for a later scene or transition. Slice-three's solved state should use the fixed painted arch plus the water overlays, rather than placing a second arch over the background.

## Composition Requirements

### Temple Steps

- Stage left-to-right: low flat sun-marked cup rest and channel foreground, fixed arch middle, inviting sunlit temple beyond.
- The channel must visibly continue through the gate toward the courtyard.
- Gate footprint must be front-facing, centered, symmetrical, and free of vines or plants so opaque closed/open gate overlays can fully replace one another.
- Channel must use simple, mostly straight segments and be free of stones, grass, deep shadows, or steps where water overlays will sit.
- The cup rest needs clear ground around it and no painted cup.
- Lower third remains walkable and visually quiet.
- Reserve top corners for HUD and middle upper area for dialogue.

### Sun Courtyard

- The stone sun flower is the single visual focus.
- It is already open when this screen becomes reachable; a Stone Lens overlay will sit visibly in its centre.
- Flowing channel arrives at the flower so the water cause is legible without text.
- Keep enough foreground clear for hero movement and the exit readable.

## Prompt Files

1. `assets/sun-temple-adventure/temple-steps/prompts/background.md`
2. `assets/sun-temple-adventure/sun-courtyard/prompts/background.md`
3. `assets/sun-temple-adventure/shared/prompts/prop-state-atlas-slice-03.md`

## Review Checklist

Before accepting generated art, verify:

- cup spot, channel, gate, and courtyard direction are visually connected;
- no competing prop looks usable;
- closed/open gate overlays fully replace one another over the fixed arch footprint;
- three water-flow overlays align to clean channel segments;
- Stone Lens is warm ochre/sandstone with a circular sun rim, not coin-like;
- sun flower is the courtyard focus;
- no readable text, weapons, traps, darkness, horror, or franchise references;
- no accidental characters or NPCs;
- Mirror Hall marker reads as a locked HUD destination emblem, not a coin or collectible.

## Deferred Assets

- Mirror Hall background and props;
- new NPCs;
- Waterfall Mouth revision, unless later playtesting proves the pool unreadable;
- full final map artwork.
