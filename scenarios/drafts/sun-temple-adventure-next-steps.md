# Sun Temple Adventure Next Steps

This is the compact handoff plan after first-pass art generation.

## Current State

Done:

- Adventure reboot direction documented in `adventure-game-reboot.md`.
- Campaign plot/world/dependency/prop/curriculum/asset docs drafted.
- Art-director review completed and integrated.
- Prompt pack created under `assets/sun-temple-adventure/*/prompts/`.
- First-pass generated assets saved under `assets/sun-temple-adventure/*/generated/`.
- Contact sheet saved at `assets/sun-temple-adventure/generated-contact-sheet-v1.jpg`.
- Engine integration plan drafted at `scenarios/drafts/sun-temple-adventure-engine-integration-plan.md`.
- Asset frame manifest created at `assets/sun-temple-adventure/shared/generated/asset-frames-v1.json`.
- First-pass adventure runtime support added behind `gameplay_mode: "adventure"`.
- Six first-slice Sun Temple scenario JSON files created under `scenarios/`.
- Shared first-slice mission manifest created at `game-engine/missions/sun-temple-adventure-slice-01.json`.
- Dedicated Sun Temple smoke test added at `tools/sun-temple-adventure-smoke-test.mjs`.
- First-slice browser smoke passes end to end: map pickup, rope pickup, branch/map-piece reveal, item combining, bridge repair, Lina exchange, Green Lens placement, and Waterfall Cave reveal.
- Adventure content now uses `npcs` for characters. The old `guide` field remains legacy compatibility for the James Bond/base learning flow.
- Slice-two Waterfall Cave design docs created:
  - `scenarios/drafts/sun-temple-adventure-slice-02-plot.md`
  - `scenarios/drafts/sun-temple-adventure-slice-02-dependency-graph.md`
  - `scenarios/drafts/sun-temple-adventure-slice-02-screen-prop-map.md`
  - `scenarios/drafts/sun-temple-adventure-slice-02-curriculum-ledger.md`
  - `scenarios/drafts/sun-temple-adventure-slice-02-asset-plan.md`
  - `scenarios/drafts/sun-temple-adventure-slice-02-art-director-review.md`
- Slice-two prompt pack created and first-pass images generated.
- Slice-two implementation completed:
  - `keeper-hut`, `waterfall-mouth`, and `dark-cave` scenario JSON files are live under `scenarios/`.
  - The shared mission manifest now contains the full jar, leaf, glow-jar, cave, key, box, Blue Lens, and Temple Steps chain.
  - Base Camp accepts the Blue Lens and renders its placed state.
  - Village Garden now leads to the Keeper Hut after helping Lina.
  - The HUD map supports Waterfall Cave, Keeper Hut, Dark Cave, and the locked Temple Steps forward hook on every Sun Temple screen.
  - The Phaser content adapter supports additional texture atlases and merged frame manifests, so later regions can add prop sheets without replacing the first-slice atlas.
  - Dedicated slice-two browser smoke coverage is in `tools/sun-temple-adventure-slice-02-smoke-test.mjs`.
- First-and-second-slice polish review completed at `scenarios/drafts/sun-temple-adventure-slices-01-02-polish-review.md`.
- Hotspot positions and sizes were aligned by the user. Treat them as locked during normal polish work.

Not done:

- Some takeable objects are still baked into generated backgrounds, so later visual polish may need overlay/masking or revised backgrounds.
- Some slice-two overlay positions are first-pass coordinates and should receive the same visual polish pass as the rest of the campaign.

User feedback:

- The user said the visuals are stunning.
- Treat the generated first-pass art as accepted for implementation unless the user requests visual changes.

## First Playable Slice

Screens:

1. `base-camp-table`
2. `camp-supply-tent`
3. `camp-edge`
4. `jungle-path`
5. `broken-bridge`
6. `village-garden`

Required flow:

```text
inspect Sun Compass
take torn map
map button becomes enabled
take rope
inspect/move branch
take map piece
combine torn map + map piece -> valley map
unlock Jungle Path marker
walk/map travel to Jungle Path
reach Broken Bridge
use rope on bridge
rope removed from inventory and bridge repaired
basket becomes reachable
take basket
go to Village Garden
talk to Lina
give basket to Lina
Lina says seeds are here and hints flower pot
inspect flower pot
take Green Lens
return to Base Camp
use Green Lens on Sun Compass
Green Lens removed from inventory and appears placed
Waterfall Cave marker revealed as locked forward hook
```

## Recommended Next Work Order

1. **Coordinate And Visual Polish**
   - Check whether baked-in takeable objects need overlay covers or regenerated backgrounds.
   - Keep hotspot coordinates and radii unchanged unless explicitly asked to revise them.
   - Let a child play both completed slices before changing Mira/Lina scale or click zones.

2. **NPC Schema Follow-Up**
   - Current runtime maps the primary `npcs[0]` entry onto the existing guide actor.
   - Before adding screens with multiple visible characters, add true multi-NPC rendering/click zones.
   - Keep Sun Temple content on `npcs`; do not reintroduce `guide` for adventure screens.

3. **Third Slice Design**
   - Design Temple Steps and the Stone Lens dependency chain before generating more art.
   - Keep asset prompts tied to screen props and inventory actions.

## Key Files To Read After Compaction

Read in this order:

1. `adventure-game-reboot.md`
2. `scenarios/drafts/sun-temple-adventure-plot.md`
3. `scenarios/drafts/sun-temple-adventure-world-map.md`
4. `scenarios/drafts/sun-temple-adventure-dependency-graph.md`
5. `scenarios/drafts/sun-temple-adventure-screen-prop-map.md`
6. `scenarios/drafts/sun-temple-adventure-curriculum-ledger.md`
7. `scenarios/drafts/sun-temple-adventure-asset-plan.md`
8. `scenarios/drafts/sun-temple-adventure-art-director-review.md`
9. `game-engine/12-adventure-inventory-map-extension.md`
10. `scenarios/drafts/sun-temple-adventure-engine-integration-plan.md`
11. `assets/sun-temple-adventure/shared/generated/asset-frames-v1.json`
12. `tools/sun-temple-adventure-smoke-test.mjs`
13. `tools/sun-temple-adventure-slice-02-smoke-test.mjs`
14. `scenarios/drafts/sun-temple-adventure-slices-01-02-polish-review.md`
15. `scenarios/drafts/sun-temple-adventure-slice-02-plot.md`
16. `scenarios/drafts/sun-temple-adventure-slice-02-dependency-graph.md`
17. `scenarios/drafts/sun-temple-adventure-slice-02-screen-prop-map.md`
18. `scenarios/drafts/sun-temple-adventure-slice-02-curriculum-ledger.md`
19. `scenarios/drafts/sun-temple-adventure-slice-02-asset-plan.md`
20. `scenarios/drafts/sun-temple-adventure-slice-02-art-director-review.md`

## Generated Assets

Use these first:

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
assets/sun-temple-adventure/keeper-hut/generated/background-v1.png
assets/sun-temple-adventure/waterfall-mouth/generated/background-v1.png
assets/sun-temple-adventure/dark-cave/generated/background-v1.png
assets/sun-temple-adventure/shared/generated/prop-state-atlas-slice-02-v1-source.png
assets/sun-temple-adventure/shared/generated/prop-state-atlas-slice-02-v1.png
assets/sun-temple-adventure/shared/generated/asset-frames-slice-02-v1.json
assets/sun-temple-adventure/generated-contact-sheet-slice-02-v1.jpg
```

## Important Design Constraints

- No grammar-question progression.
- Adventure-critical words are allowed with Bulgarian support.
- `Green Lens` remains named `Green Lens`.
- Map button is visible but disabled before the torn map is taken.
- Placing the Green Lens removes it from inventory.
- Rope is consumed and shown tied onto the repaired bridge.
- Basket is visible but unreachable before bridge repair.
- Lina needs the basket because her seeds are inside it.
- Green Lens placement reveals Waterfall Cave marker.
- Keeper hut visibility is deferred.
- Mira and Lina are declared under `npcs`; `guide` is legacy-only for non-adventure content.
- Slice two uses a `glow_jar`, not a torch, for child-safe cave lighting.
- Slice two adds no new NPC.

## Next Implementation Recommendation

Do a campaign-wide coordinate and state-overlay polish pass before designing slice three. Do not generate Temple Steps art until its story and dependency chain are designed.
