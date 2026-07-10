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
- Slice-three is implemented and browser-smoke-tested end to end:
  - `temple-steps` and `sun-courtyard` scenario JSON files are live under `scenarios/`.
  - The mission manifest includes the cup, waterfall pool, water-channel, Stone Lens, and Mirror Hall chain.
  - All Sun Temple screens register the slice-three atlas and show the Temple Steps, Sun Courtyard, and Mirror Hall map states.
  - A dedicated slice-three smoke test is available at `tools/sun-temple-adventure-slice-03-smoke-test.mjs`.
  - Hotspot coordinates and radii in the two new scenes were aligned by the user and are locked for normal polish work.
- The final creative proposal has been translated into a sequenced implementation plan at `scenarios/drafts/sun-temple-adventure-creative-proposal-action-plan.md`.
- Workstream 0 is complete: `scenarios/drafts/sun-temple-adventure-story-dialogue-ledger.md` records all live story text, its trigger and category, Bulgarian coverage, and approved-but-not-live copy candidates.
- Workstream 1 is complete: Base Camp now uses its existing drooping flower as a one-time opening mystery, with an inspect hotspot and revised Compass text. No new Base Camp art was needed.
- Workstream 2 is complete: the existing three slices now use evidence-first observations, focused state reactions, Temple Steps progressive inspection hints, and connected lens-map responses. No new route, mandatory item, NPC, or screen was added.
- Workstream 3 is complete: `scenarios/drafts/sun-temple-adventure-world-state-plan.md` defines persistent local repairs, the future global `valley.light_restored` state, required finale visual responses, and explicit art deferrals.
- Workstream 4 is complete: the Slice 4 plot, dependency graph, screen/prop map, curriculum ledger, LucasArts Senior Art Director and Game Designer review, and asset plan define a one-room Mirror Hall light puzzle.
- Workstream 5 is complete: generated Mirror Hall background/atlas art, frame manifest, scenario JSON, mission rules, Base Camp fourth-lens progress state, map transitions, and dedicated Slice 4 browser coverage are live. The user still owns the new scene's hotspot alignment pass.

Not done:

- Some takeable objects are still baked into generated backgrounds, so later visual polish may need overlay/masking or revised backgrounds.
- Some slice-two overlay positions are first-pass coordinates and should receive the same visual polish pass as the rest of the campaign.
- The blue-box keyhole clue and generic hint-request UI are intentionally deferred until art support or child playtesting justifies them.
- Observatory approach, Observatory Door, Sun Observatory, Sun Lens, and the restored-valley finale remain future design and implementation work.
- Final restoration art is intentionally deferred until Mirror Hall and the Observatory have approved dependency graphs and compositions.

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

1. **Creative-Polish Baseline**
   - Review the completed story dialogue ledger before adding or changing player-facing lines.
   - Base Camp sunlight mystery and its one-time scene-entry support are complete.
   - Current-slice clue and reaction pass is complete without adding new errands, required tools, or screens.

2. **Future Slice Design**
   - The user aligns Slice 4 hotspots in the level editor; do not change their positions or sizes during normal polish.
   - Design the Observatory approach and finale together as Workstream 6 before generating any final-region art.
   - Design the Observatory approach and finale as one connected final unit after Slice 4 is proven.

## Key Files To Read After Compaction

Read in this order:

1. `adventure-game-reboot.md`
2. `scenarios/drafts/sun-temple-adventure-current-walkthrough.md`
3. `scenarios/drafts/sun-temple-adventure-final-creative-design-proposal.md`
4. `scenarios/drafts/sun-temple-adventure-creative-proposal-action-plan.md`, `scenarios/drafts/sun-temple-adventure-story-dialogue-ledger.md`, and `scenarios/drafts/sun-temple-adventure-world-state-plan.md`
5. `scenarios/drafts/sun-temple-adventure-plot.md`
6. `scenarios/drafts/sun-temple-adventure-world-map.md`
7. `scenarios/drafts/sun-temple-adventure-dependency-graph.md`
8. `scenarios/drafts/sun-temple-adventure-screen-prop-map.md`
9. `scenarios/drafts/sun-temple-adventure-curriculum-ledger.md`
10. `scenarios/drafts/sun-temple-adventure-asset-plan.md`
11. `scenarios/drafts/sun-temple-adventure-art-director-review.md`
12. `game-engine/12-adventure-inventory-map-extension.md`
13. `scenarios/drafts/sun-temple-adventure-engine-integration-plan.md`
14. `assets/sun-temple-adventure/shared/generated/asset-frames-v1.json`
15. `tools/sun-temple-adventure-smoke-test.mjs`
16. `tools/sun-temple-adventure-slice-02-smoke-test.mjs`
17. `scenarios/drafts/sun-temple-adventure-slices-01-02-polish-review.md`
18. `scenarios/drafts/sun-temple-adventure-slice-02-plot.md`
19. `scenarios/drafts/sun-temple-adventure-slice-02-dependency-graph.md`
20. `scenarios/drafts/sun-temple-adventure-slice-02-screen-prop-map.md`
21. `scenarios/drafts/sun-temple-adventure-slice-02-curriculum-ledger.md`
22. `scenarios/drafts/sun-temple-adventure-slice-02-asset-plan.md`
23. `scenarios/drafts/sun-temple-adventure-slice-02-art-director-review.md`
24. `scenarios/drafts/sun-temple-adventure-slice-03-plot.md`
25. `scenarios/drafts/sun-temple-adventure-slice-03-dependency-graph.md`
26. `scenarios/drafts/sun-temple-adventure-slice-03-screen-prop-map.md`
27. `scenarios/drafts/sun-temple-adventure-slice-03-curriculum-ledger.md`
28. `scenarios/drafts/sun-temple-adventure-slice-03-art-director-review.md`
29. `scenarios/drafts/sun-temple-adventure-slice-03-asset-plan.md`
30. `scenarios/drafts/sun-temple-adventure-slice-03-asset-review.md`
31. `assets/sun-temple-adventure/shared/generated/asset-frames-slice-03-v1.json`
32. `scenarios/drafts/sun-temple-adventure-slice-04-plot.md`
33. `scenarios/drafts/sun-temple-adventure-slice-04-dependency-graph.md`
34. `scenarios/drafts/sun-temple-adventure-slice-04-screen-prop-map.md`
35. `scenarios/drafts/sun-temple-adventure-slice-04-curriculum-ledger.md`
36. `scenarios/drafts/sun-temple-adventure-slice-04-art-director-review.md`
37. `scenarios/drafts/sun-temple-adventure-slice-04-asset-plan.md`

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
assets/sun-temple-adventure/temple-steps/generated/background-v1.png
assets/sun-temple-adventure/sun-courtyard/generated/background-v1.png
assets/sun-temple-adventure/shared/generated/prop-state-atlas-slice-03-v1.png
assets/sun-temple-adventure/shared/generated/asset-frames-slice-03-v1.json
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

Let the user align the new Mirror Hall hotspots, then begin Workstream 6: design the Observatory approach and Sun Observatory finale as one connected five-lens payoff before generating their art.
