# Sun Temple Adventure Asset Plan

This asset plan defines what art will be needed for the first vertical slice of `sun-temple-adventure`.

It does not contain final prompts and does not authorize image generation. Prompt files should be written and reviewed next, then images can be generated after the prompt pack is approved.

Sources:

- `adventure-game-reboot.md`
- `scenarios/drafts/sun-temple-adventure-plot.md`
- `scenarios/drafts/sun-temple-adventure-world-map.md`
- `scenarios/drafts/sun-temple-adventure-dependency-graph.md`
- `scenarios/drafts/sun-temple-adventure-screen-prop-map.md`
- `scenarios/drafts/sun-temple-adventure-curriculum-ledger.md`

## Current Status

Status: first-pass asset plan drafted, prompt pack created, and first-pass images generated.

Next incomplete design step: first-slice runtime/content implementation.

## Asset Principles

- Generate only assets required by the dependency graph and screen prop map.
- Avoid decorative props that look clickable but are not.
- Prefer one clear background per first-slice screen, with separate prop/state overlays where the state changes.
- Keep the visual style adventurous, warm, readable, and child-safe.
- Leave walkable ground clear.
- Leave room for HUD, inventory, map button, and dialogue bubbles.
- No final drawings until the prompt pack is reviewed.

## Proposed Asset Directory

Use this structure when prompts and assets begin:

```text
assets/sun-temple-adventure/
  shared/
    prompts/
    generated/
  base-camp-table/
    prompts/
    generated/
  camp-supply-tent/
    prompts/
    generated/
  camp-edge/
    prompts/
    generated/
  jungle-path/
    prompts/
    generated/
  broken-bridge/
    prompts/
    generated/
  village-garden/
    prompts/
    generated/
  ui-map/
    prompts/
    generated/
```

## Screen Background Assets

| Screen | Background asset | Required state variants | Notes |
| --- | --- | --- | --- |
| `base-camp-table` | camp table background | base only; compass state can be overlay | Must include table, compass area, Mira position, exits. |
| `camp-supply-tent` | supply tent background | base only; rope can be overlay | Keep prop clutter low. Rope must be clearly visible. |
| `camp-edge` | camp edge background | branch blocking / branch moved | Could use overlay for branch and map piece. |
| `jungle-path` | jungle path background | base only | Traversal screen with carved sun stone and river glow. |
| `broken-bridge` | broken bridge background | broken / repaired | Important state change. Repaired state must show rope tied to bridge; basket visible across river before repair. |
| `village-garden` | village garden background | base only; flower pot/lens can be overlay | Keeper hut visibility deferred until later structure is known; garden should show Lina's seed/flower need. |

Recommended first implementation:

- Use background images for each screen at the Phaser scene aspect ratio.
- Use a small prop/state atlas for removable or changing objects.
- Do not bake inventory items into a background if they must disappear after taking.

## Prop And State Overlay Assets

| Asset | Screen | Needed states | Why separate from background |
| --- | --- | --- | --- |
| torn map | `base-camp-table` | visible / removed | takeable item |
| compass lens slot overlay | `base-camp-table` | empty / Green Lens placed / green light on map | progress state and next marker reveal |
| drooping sun flower | `base-camp-table` | visible | shows valley problem |
| rope coil | `camp-supply-tent` | visible / removed | takeable item |
| fallen branch | `camp-edge` | blocking / moved | state change |
| map piece | `camp-edge` | hidden/visible / removed | takeable item; torn edge should match map |
| carved sun stone | `jungle-path` | visible | memorable navigation clue |
| broken bridge overlay | `broken-bridge` | broken / repaired with tied rope | major state change |
| lost basket | `broken-bridge` | visible unreachable / reachable / removed | takeable item after repair |
| flower pot | `village-garden` | normal / sun mark or green shine / checked | lens hiding place |
| Green Lens | `village-garden`, `base-camp-table` | hidden / visible / inventory icon / placed | progress item |

Open implementation choice:

- The bridge could be two full backgrounds if overlay alignment is hard. Prefer overlays if they remain visually clean.

## NPC Assets

| NPC | Asset need | Reuse option | Notes |
| --- | --- | --- | --- |
| Guide Mira | guide sprite or static painted NPC | Could temporarily reuse current guide/director sprite for slice testing | Final art should fit jungle guide tone. |
| Lina | static NPC or simple spritesheet | no good current match | Needs friendly village-garden look. Can be static for first slice. |

For first-slice implementation, static NPC sprites are acceptable if they can face the player and dialogue works. Full walk cycles are not required for NPCs.

## Hero Asset

| Asset | Recommendation | Notes |
| --- | --- | --- |
| Hero explorer sprite | Reuse existing hero initially, plan dedicated explorer later | A new hero sheet can wait until adventure mechanics are proven. |
| Hero portraits | Reuse existing portraits initially | Dedicated expressions are optional. |

Do not block the first vertical slice on a new hero spritesheet.

## Inventory Icons

| Item | Icon needed | Notes |
| --- | --- | --- |
| torn map | yes | Removed after combine. |
| map piece | yes | Removed after combine. |
| valley map | yes | Could also drive HUD map button state. |
| rope | yes | Removed after bridge repair. |
| lost basket | yes | Removed after giving to Lina. |
| Green Lens | yes | Removed after placing in Sun Compass. |

Inventory icons can be cropped from the prop atlas if clean. If not, generate separate transparent icons.

## HUD And Map Assets

| UI Asset | Needed states | Notes |
| --- | --- | --- |
| HUD map button | disabled / enabled | User chose visible but disabled before map is taken. |
| map panel background | closed / open | Should feel like a parchment/adventure map, not a web modal. |
| map markers | locked / discovered / current | First slice needs Base Camp, Camp Edge, Jungle Path, Broken Bridge, Village Garden. |
| Waterfall Cave marker | hidden / revealed locked | Revealed when Green Lens is placed, as the forward hook for slice two. |
| route lines | inactive / active | Optional for first slice, useful for readability. |

The map UI can be built in Phaser/CSS-style UI first; generated art can be added later if needed.

## Prompt Pack To Create Next

These prompt files have been created. Review them before image generation:

```text
assets/sun-temple-adventure/base-camp-table/prompts/background.md
assets/sun-temple-adventure/camp-supply-tent/prompts/background.md
assets/sun-temple-adventure/camp-edge/prompts/background.md
assets/sun-temple-adventure/jungle-path/prompts/background.md
assets/sun-temple-adventure/broken-bridge/prompts/background.md
assets/sun-temple-adventure/village-garden/prompts/background.md
assets/sun-temple-adventure/shared/prompts/prop-state-atlas.md
assets/sun-temple-adventure/shared/prompts/npc-mira.md
assets/sun-temple-adventure/shared/prompts/npc-lina.md
assets/sun-temple-adventure/ui-map/prompts/map-ui.md
```

## Prompt Requirements

Every prompt must include:

- exact screen purpose;
- one dominant visual focus for the screen;
- required visible props;
- forbidden extra click-looking props;
- walkable ground requirements;
- room for HUD/inventory/dialogue;
- state variants needed;
- child-safe adventure tone;
- no real franchise references;
- no weapons or frightening imagery;
- no readable text baked into images unless explicitly needed.

## Dominant Visual Focus By Screen

| Screen | Dominant visual focus |
| --- | --- |
| `base-camp-table` | Sun Compass table under a sunbeam, five empty slots, drooping sun flower nearby. |
| `camp-supply-tent` | Clean supply nook with rope as the obvious hero prop. |
| `camp-edge` | Diagonal fallen branch with map piece visibly trapped under it. |
| `jungle-path` | Leaf tunnel opening toward river glow, with carved sun stone in foreground. |
| `broken-bridge` | Near side/far side river split, broken bridge, unreachable basket across the water. |
| `village-garden` | Lina, one distinctive flower pot, and small seed/flower problem. |
| `base-camp-table` after Green Lens | Green light from compass touches map and reveals Waterfall Cave marker. |

## Deferred Asset Decisions

- Whether keeper hut appears in the first-slice village background.
- Whether to generate a dedicated hero explorer spritesheet before or after mechanics.
- Whether bridge repair is handled by overlay or full background variant.
- Whether map UI needs generated parchment art or can be built with Phaser UI first.

## Compaction Handoff

If context is compacted, read this file after the curriculum ledger, then inspect `assets/sun-temple-adventure/generated-contact-sheet-v1.jpg` and the generated assets. First-pass images exist, and the user described the visuals as stunning. No scenario JSON, mission JSON, or runtime code has been created yet.

Next step:

1. Read `scenarios/drafts/sun-temple-adventure-engine-integration-plan.md`.
2. Use `assets/sun-temple-adventure/shared/generated/asset-frames-v1.json` for crop frames.
3. Implement the first slice with generated assets.
4. Add smoke tests for adventure interactions.

## Generated First Pass

Generated images are saved under:

```text
assets/sun-temple-adventure/base-camp-table/generated/background-v1.png
assets/sun-temple-adventure/camp-supply-tent/generated/background-v1.png
assets/sun-temple-adventure/camp-edge/generated/background-v1.png
assets/sun-temple-adventure/jungle-path/generated/background-v1.png
assets/sun-temple-adventure/broken-bridge/generated/background-broken-v1.png
assets/sun-temple-adventure/village-garden/generated/background-v1.png
assets/sun-temple-adventure/shared/generated/prop-state-atlas-v1.png
assets/sun-temple-adventure/shared/generated/npc-mira-v1.png
assets/sun-temple-adventure/shared/generated/npc-lina-v1.png
assets/sun-temple-adventure/ui-map/generated/map-ui-v1.png
assets/sun-temple-adventure/generated-contact-sheet-v1.jpg
```

Notes:

- The village garden was regenerated to remove a shiny false-lead object from the background.
- Prop and UI sheets were generated on magenta chroma-key and converted to alpha PNGs.
- Mira was generated on green chroma-key and converted to alpha PNG.
- Crop/frame rectangles are recorded in `assets/sun-temple-adventure/shared/generated/asset-frames-v1.json`.
- No consuming JSON or runtime code has been updated yet.
