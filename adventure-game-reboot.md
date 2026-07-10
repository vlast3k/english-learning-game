# Adventure Game Reboot Plan

This is the durable planning document for the next game. It exists so future work can continue after context compaction without rediscovering the intent from chat history.

## Core Direction

Build a new adventure-first English learning game that reuses the existing Phaser/data-driven game engine where possible, but changes the learning experience from quiz-led levels into an exploration game.

The new game should feel like a real adventure: travel between places, discover map locations, collect and use inventory items, talk to NPCs, unlock blocked paths, revisit old screens with new items, and solve environmental problems.

The learning layer remains present but quieter:

- Keep English-to-Bulgarian translation reveal and hint support.
- Use only grammar and vocabulary from `curriculum-scope.md`.
- Ensure all required grammar concepts and target words appear somewhere across the campaign.
- Do not structure each level around explicit grammar drills.
- Do not add grammar beyond the curriculum boundary.
- Do not make "understanding the material" the main challenge; the first game already does that.

## What This Replaces

The James Bond campaign proved that the engine can load multiple scenarios and generated assets, but it drifted toward one grammar topic per level and produced many props that were not deeply tied to gameplay.

This reboot should avoid:

- one worksheet-style grammar objective per screen;
- many decorative prop assets that are not clickable or useful;
- disconnected missions that feel like curriculum wrappers;
- generating art before inventory logic and screen purpose are known;
- writing scenario JSON before the plot, map, props, NPCs, and dependencies are stable.

## Existing Repo Context

Primary runtime path:

- `phaser.html`
- `phaser-game.js`
- `phaser-content.js`
- `game-engine/runtime.js`
- `game-engine/phaser-bridge.js`

Current content examples:

- `scenarios/james-bond-level-01-content.json` through `scenarios/james-bond-level-11-content.json`
- `game-engine/missions/james-bond-level-01.json` through `game-engine/missions/james-bond-level-11.json`
- `assets/james-bond/`

Curriculum source:

- `curriculum-scope.md`

Older adventure seed:

- `indiana-jones-game1.md`

Do not assume the older DOM prototype in `index.html` / `main.js` is the target. The reusable path is the Phaser/data-driven engine.

## Target Experience

The player explores a connected world, starting from a safe hub and gradually opening new areas. Some locations may have several screens. A world map becomes available as places are discovered, and the child can travel back to unlocked places from the map.

Good adventure actions:

- inspect an object;
- pick up an item;
- use an inventory item on a hotspot;
- give an item to an NPC;
- combine two inventory items;
- unlock a new screen or map location;
- change world state, such as repairing a bridge or lighting a dark cave;
- revisit old screens after new items are found;
- read short signs, notes, diary pages, labels, or NPC lines;
- hover/tap English words for Bulgarian support.

Language should appear naturally in:

- item names;
- NPC dialogue;
- map labels;
- signs and notes;
- environmental hints;
- short descriptions;
- inventory feedback;
- gate messages.

## Design Sequence

Work in this order. Do not skip ahead to assets or JSON.

1. Plot
   - Define the title, premise, hero, companion/guide, main mystery, antagonist or obstacle force, emotional tone, and ending.
   - Keep it kid-friendly, adventurous, and concrete.

2. World and Locations
   - Define the world map regions.
   - Define screens inside each region.
   - Define travel links and when they unlock.
   - Decide which screens are revisited later.

3. Adventure Dependency Graph
   - List every inventory item.
   - List every NPC.
   - List every blocked path.
   - Define exact dependencies: take X, use X on Y, give X to NPC Z, combine A+B, unlock location C.
   - Every important prop must have a gameplay reason.

4. Screen Prop and NPC Map
   - For each screen, list visible required props, optional scenery, NPCs, exits, walkable area, and state variants.
   - Required props must be visibly present in the background or generated as sprites/atlases.
   - Do not request a prop sheet until the interaction list is stable.

5. Curriculum Coverage Review
   - Build a ledger from `curriculum-scope.md`.
   - Mark which words and grammar constructs are used in each screen/dialogue/item.
   - Revise text that uses grammar outside scope.
   - Add missing required words naturally as labels, notes, NPC lines, or item descriptions.

6. Prompt Pack
   - Write image prompts only after the prop/NPC/screen map is approved.
   - Each prompt must include all required interactables and avoid unsupported decorative clutter.
   - Each screen prompt should include a checklist of click targets that must be visible.

7. Engine JSON
   - Generate scenario JSON and mission JSON after plot, map, dependencies, and assets are stable.
   - Extend the engine first if a needed action is unsupported.
   - Validate with existing tools and browser smoke tests.

## Proposed Artifact Set

Use these files for the new game planning track:

- `adventure-game-reboot.md`: this canonical plan.
- `scenarios/drafts/adventure-campaign-template.md`: fill-in template for plot, map, props, NPCs, curriculum, assets, and JSON.
- `game-engine/12-adventure-inventory-map-extension.md`: engine design note for inventory-use, give/combine actions, and map travel.

When the actual campaign name is chosen, create campaign-specific files rather than overloading this plan:

- `scenarios/drafts/<campaign-id>-plot.md`
- `scenarios/drafts/<campaign-id>-world-map.md`
- `scenarios/drafts/<campaign-id>-dependency-graph.md`
- `scenarios/drafts/<campaign-id>-curriculum-ledger.md`
- `scenarios/drafts/<campaign-id>-asset-plan.md`
- `assets/<campaign-id>/<region-or-screen>/prompts/*.md`
- `scenarios/<campaign-id>-<screen-id>-content.json`
- `game-engine/missions/<campaign-id>-<screen-id>.json`

## Engine Reuse Policy

Reuse:

- Phaser movement and hotspot input;
- dialogue bubbles;
- translation reveal and Bulgarian hints;
- inventory HUD where possible;
- ECA runtime and mission validation;
- scenario loading and asset override pattern;
- browser smoke-test approach.

Likely new reusable engine features:

- `item.take`;
- `item.use_on_hotspot`;
- `item.give_to_npc`;
- `item.combine`;
- `location.discover`;
- `location.unlock`;
- `map.open`;
- `map.travel`;
- screen/state variants for changed locations;
- interaction feedback that is not a quiz result.

These should be declarative mission actions and conditions, not hard-coded one-off Phaser logic.

## Curriculum Policy

The curriculum is a constraint, not the visible level structure.

Allowed grammar is the set in `curriculum-scope.md`, especially:

- `be`;
- `what/who/where` with `be`;
- `there is/there are`;
- place prepositions;
- simple present;
- `do/does` questions and negatives;
- `have/has`;
- possessive adjectives and possessive `'s`;
- `this/that/these/those`;
- `can/can't`;
- present continuous;
- adverbs of frequency;
- basic word order within the listed constructs.

No new grammar should be introduced casually in dialogue, hints, or labels. If a richer sentence is needed for story, rewrite it with allowed structures.

The coverage goal is campaign-wide, not level-by-level. A screen can focus on adventure logic while still using simple curriculum-safe language.

## Asset Policy

Every generated visual asset should answer one of these questions:

- What does the player need to click?
- What does the player need to notice?
- What can change after an inventory action?
- What NPC or route does the player need to remember?

Avoid prop atlases full of unrelated objects. If a prop is generated, it should be referenced by:

- a hotspot;
- an inventory item;
- an NPC request;
- a changed screen state;
- a map marker;
- a story clue.

Asset prompts should be written after the screen interaction map, not before it.

## Current Recommended Theme Direction

The strongest current direction is an Indiana Jones / jungle ruins / lost map / ancient observatory adventure inspired by `indiana-jones-game1.md`, but not copied directly.

Why it fits:

- natural map travel between camp, jungle, river, village, cave, ruins, temple, and observatory;
- strong reason to collect and use items;
- easy to make kid-safe;
- good fit for animal, nature, place, shape, number, season, and Earth vocabulary;
- natural backtracking and multi-screen regions;
- less dependence on spy-mission grammar checks.

This is a recommendation, not a locked decision.

## Current Campaign Draft

The campaign track has started under:

- `scenarios/drafts/sun-temple-adventure-plot.md`
- `scenarios/drafts/sun-temple-adventure-world-map.md`
- `scenarios/drafts/sun-temple-adventure-dependency-graph.md`
- `scenarios/drafts/sun-temple-adventure-screen-prop-map.md`
- `scenarios/drafts/sun-temple-adventure-curriculum-ledger.md`

Current campaign ID:

- `sun-temple-adventure`

Working title:

- `Secrets of the Sun Temple`

Current status:

- Plot first pass drafted with initial decisions recorded.
- World map and screen list first pass drafted with initial decisions recorded.
- The campaign uses five Sun Compass lenses.
- The first vertical slice is Base Camp -> Camp Edge -> Jungle Path -> Broken Bridge -> Village Garden.
- Map UI unlocks after the torn map is found; useful travel markers begin after the first map repair, then discovered markers allow instant travel.
- The first version includes item combining.
- There is no rival explorer.
- Adventure dependency graph first pass drafted.
- Green Lens hides under a flower pot.
- Rope is consumed from inventory when repairing the bridge.
- Map travel uses a HUD map button.
- Lost basket appears on the far side of the repaired bridge.
- Screen prop and NPC map first pass drafted.
- Curriculum ledger first pass drafted.
- Adventure-critical words are allowed as non-target nouns with Bulgarian support.
- `Green Lens` remains named `Green Lens`.
- HUD map button is visible but disabled before the torn map is taken.
- Placing the Green Lens removes it from inventory.
- Keeper hut visibility is deferred until more structure is known.
- Asset plan first pass drafted.
- Dedicated art-director review completed and accepted staging improvements were integrated.
- Prompt pack first pass drafted.
- First-pass images generated and saved under `assets/sun-temple-adventure/`.
- Engine integration plan drafted in `scenarios/drafts/sun-temple-adventure-engine-integration-plan.md`.
- Asset frame manifest created at `assets/sun-temple-adventure/shared/generated/asset-frames-v1.json`.
- First-pass adventure runtime/content implementation created for the six-screen vertical slice.
- Targeted browser checks passed for initial load, taking the torn map, opening the map panel, travelling to the supply tent, and taking rope.
- Next incomplete step is a dedicated full Sun Temple smoke test and end-to-end playthrough tuning.

## Remaining Decisions

Before generating campaign content, decide:

- final first-slice English lines and Bulgarian translations;
- whether the keeper hut is visible in the first-slice village background or saved for slice two, deferred until more structure is known;
- later-region screen counts and whether the Sun Compass can later be opened from the HUD/map.

## Next Work Item

The generated first-pass assets are accepted for implementation unless the user requests visual changes.

Next step after compaction: add a dedicated full Sun Temple browser smoke test and tune the first playable vertical slice according to:

- `scenarios/drafts/sun-temple-adventure-engine-integration-plan.md`
- `scenarios/drafts/sun-temple-adventure-next-steps.md`
- `assets/sun-temple-adventure/shared/generated/asset-frames-v1.json`

## Compaction Handoff

If context has been compacted, read this file first. The user wants a new adventure-first game that reuses the Phaser/data-driven engine, uses curriculum as a boundary rather than quiz structure, includes map travel and inventory-based adventure interactions, avoids orphan props, and is designed in phases before assets or JSON are generated.

Current state before compaction:

- Design docs exist under `scenarios/drafts/sun-temple-adventure-*.md`.
- Prompt files exist under `assets/sun-temple-adventure/*/prompts/`.
- First-pass generated assets exist under `assets/sun-temple-adventure/*/generated/`.
- Contact sheet exists at `assets/sun-temple-adventure/generated-contact-sheet-v1.jpg`.
- Engine integration plan exists at `scenarios/drafts/sun-temple-adventure-engine-integration-plan.md`.
- Asset frame manifest exists at `assets/sun-temple-adventure/shared/generated/asset-frames-v1.json`.
- Six Sun Temple scenario JSON files exist under `scenarios/`.
- Shared first-slice mission manifest exists at `game-engine/missions/sun-temple-adventure-slice-01.json`.
- First-pass adventure runtime support exists behind `gameplay_mode: "adventure"`.
- The user said the visuals are stunning, so proceed as if the first-pass art is accepted unless they later request visual changes.

Continue from the earliest incomplete section in the design sequence. The next incomplete section is full smoke-test coverage and end-to-end tuning of the first playable vertical slice.
