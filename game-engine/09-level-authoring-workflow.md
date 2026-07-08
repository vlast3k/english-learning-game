# 09. Level Authoring Workflow

## Purpose

The Puzzle Dependency Graph and ECA runtime define how a level runs. The next layer is a repeatable authoring workflow for creating new levels without hand-wiring progression logic in Phaser.

This workflow follows the standard adventure-game production shape:

```text
Narrative design
        |
        v
Structured level data
        |
        v
Deterministic validation
        |
        v
Art and asset planning
        |
        v
Playable integration
```

The AI-assisted version keeps the same shape, but uses specialized agents to draft and revise content. The deterministic validator remains the authority.

## Source Materials

Each level generation session starts from fixed inputs:

- `curriculum-scope.md` for vocabulary, grammar, and learning constraints.
- The current level or campaign brief.
- Existing scenario examples in `scenarios/`.
- Existing mission manifests in `game-engine/missions/`.
- The ECA action and condition whitelist from `06-puzzle-dependency-eca.md`.

Agents may propose content, but they should not invent unsupported mechanics, arbitrary JavaScript, or new runtime actions.

## Workflow

```text
Level brief + curriculum
          |
          v
Orchestrator
          |
          v
Writer -> JSON Coder -> Validator -> ECA Reviewer
                         ^                 |
                         |                 v
                         +------------ revision loop
          |
          v
ECA-valid scenario + mission manifest
          |
          v
UI Consistency Reviewer
          |
          v
Asset Director
          |
          v
Asset plan
          |
          v
Generated assets
          |
          v
Asset integration validation
          |
          v
Browser smoke test
```

## Orchestrator

The orchestrator owns the level design session. It tracks the goal, source inputs, current artifacts, validation state, and which agent should act next.

Example session state:

```json
{
  "level_id": "jungle-stream-01",
  "scene_id": "jungle-stream-01",
  "theme": "kid-friendly jungle adventure",
  "target_words": ["rope", "map", "bridge"],
  "grammar_focus": ["Where is the ...?", "I have a ..."],
  "artifacts": {
    "design": "scenarios/drafts/jungle-stream-01-design.md",
    "scenario": "scenarios/jungle-stream-01-content.json",
    "mission": "game-engine/missions/jungle-stream-01.json",
    "asset_plan": "scenarios/drafts/jungle-stream-01-assets.json"
  },
  "status": "writing"
}
```

The orchestrator does not bypass validation. It only advances to asset work after the validator succeeds.

The orchestrator also does not treat an asset plan as finished asset work. A level with a `scenarios/drafts/<scene_id>-assets.json` file is not ready until the planned project assets exist on disk, the scenario references those paths, cache keys are updated when needed, and validation passes. Reusing an existing asset is allowed only when the asset plan records it as an explicit reuse decision with an existing path.

## Agent 1: Writer

The Writer designs the quest in natural language or semi-structured notes. Its job is educational adventure design, not JSON formatting.

Responsibilities:

- Use the requested vocabulary and grammar.
- Create a clear child-friendly level goal.
- Define characters, items, locations, and puzzle beats.
- Keep item logic believable.
- Avoid unsupported mechanics.
- Explain why each collectible or gate exists.
- Finish the design by selecting the exit gate review words.

Output should be a design artifact such as:

```text
Level title:
The Missing Bridge Rope

Goal:
Fix the small jungle bridge and reach the next path.

Items:
- rope: used to repair the bridge
- map: shows the safe path

Puzzle flow:
1. Talk to the guide.
2. Find the rope near the camp box.
3. Answer a vocabulary challenge about "rope".
4. Use the rope to unlock the bridge gate.
5. Pass the gate review quiz.
6. Exit to the next level.

Gate review words:
- rope = въже
- map = карта
- bridge = мост
```

The Writer may describe desired state changes, but stable puzzle IDs, flags, and ECA rules are normalized later.

### Final Writer Step: Exit Gate Review Quiz

Every level design ends with an exit gate review quiz. This is a retention check before the player moves to the next level, not a new story puzzle.

The Writer chooses the best words for the gate review from the level's vocabulary. Prefer words that:

- were actually practiced during required level interactions;
- are important to the level goal, story, objects, or exit;
- have clear one-to-one Bulgarian translations;
- are not near-cognates or transliteration pairs that a child can answer by matching letters instead of knowing meaning;
- mix concrete nouns, useful verbs, and key adjectives when the level supports that;
- are appropriate distractors for each other without becoming confusing or unfair.

Avoid words that:

- were never encountered by the child;
- have missing Bulgarian translations;
- have multiple likely translations in this level context;
- are too visually or linguistically obvious, including pairs such as `apartment`/`апартамент`, `camera`/`камера`, `instrument`/`инструмент`, or `park`/`парк`;
- are UI/system words rather than learner vocabulary.

The gate review should be designed as 10 questions:

- 5 English -> Bulgarian prompts;
- 5 Bulgarian -> English prompts;
- each question shows 1 prompt word and 3 answer choices;
- each question has 1 correct answer and 2 distractors chosen from other review words;
- no hover translation reveal is used inside this gate review;
- the review can be closed and resumed before completion;
- once the exit is passed, the review must not appear again for that completed exit.

The selected words should be stored in `level_plan.gate_review_words` when the best review set is narrower than `level_plan.vocabulary_targets`. If `gate_review_words` is absent, the runtime may fall back to `vocabulary_targets`, but authored levels should prefer an explicit review set.

Before handing the design to the JSON Coder, run this dedicated language-quality prompt over the proposed gate review set:

```text
Review the proposed `gate_review_words` for a 9-year-old English learner in a spy academy game.

Keep the final 10-word gate review mandatory, but reject any word that is answerable by spelling similarity or transliteration rather than meaning. Examples to reject: apartment/апартамент, camera/камера, instrument/инструмент, park/парк. Also reject UI words, decorative background words, words not practiced in required interactions, and words with ambiguous translations in this level.

Return:
- APPROVED with the 10 review words, or
- REVISE with replacement words from the level's practiced vocabulary and a one-line reason per rejected word.
```

Example:

```json
{
  "level_plan": {
    "vocabulary_targets": ["rope", "map", "bridge", "river", "big", "help"],
    "gate_review_words": ["rope", "map", "bridge", "river", "help"]
  },
  "translations": {
    "rope": "въже",
    "map": "карта",
    "bridge": "мост",
    "river": "река",
    "help": "помагам"
  }
}
```

## Agent 2: JSON Coder

The JSON Coder converts the Writer design into repository artifacts:

- `scenarios/<scene_id>-content.json`
- `game-engine/missions/<scene_id>.json`

Responsibilities:

- Preserve the Writer's story intent.
- Use existing content and mission schema patterns.
- Create stable IDs for puzzles, hotspots, guide nodes, exits, facts, and flags.
- Use only supported ECA conditions and actions.
- Keep presentation content in scenario JSON.
- Keep progression logic in the mission manifest.
- Preserve the Writer's `level_plan.gate_review_words` selection when provided.
- Ensure every gate review word has a scenario translation entry.

The JSON Coder should not create new mechanics. If the design requires unsupported behavior, it should mark the draft for review instead of encoding imaginary fields.

### Hotspot Placement Editor

After the initial scenario JSON is valid and the background art exists, use the Phaser hotspot editor to align click circles with the painted scene instead of estimating coordinates by hand.

Run the local server:

```sh
npm run serve:editor
```

Open the level with editor mode enabled:

```text
http://localhost:9231/phaser.html?level=7&editor=hotspots
```

The editor keeps every hotspot label visible and adds placement rings for the hero and guide. Purple horizontal guides show the character depth scale: drag the `back` or `front` guide up/down to set the y-position for that depth, and drag its gold handle left/right to tune the character size at that depth. The runtime linearly interpolates character size between those two guides. Blue rectangles show `navigation.obstacles`, the no-walk zones the hero must route around; drag a rectangle to move it, and drag its blue corner handle to resize it. Drag a labeled hotspot circle to move the hotspot, and drag its gold resize handle to change `radius`. Drag the hero or guide ring to move that character, and drag its gold resize handle to change the per-level scale multiplier. Press `S` to save the current placements directly into the scenario JSON on disk. Press `C` to copy a JSON patch containing hotspot, character, obstacle, and depth-scale placement data.

The editor intentionally changes only `hotspots[].x`, `hotspots[].y`, `hotspots[].radius`, `hero_start`, `guide.position`, `presentation.character_scale_multiplier`, `presentation.guide_scale_multiplier`, `presentation.character_depth_scale`, and `navigation.obstacles[]` rectangle coordinates. It does not change mission manifests, puzzles, translations, or walk targets. After saving placement changes, run the normal validator and browser smoke test.

## Tool: Deterministic Validator

The validator is not an LLM. It is the trusted gatekeeper.

## Art Integration Rule

Final playable levels should not use scene overlays for required in-world props. The background art should include the visible mission board, required collectibles, important scenery, and exit gate/path as painted scene elements. Inventory icons are still allowed because they live in the UI after collection, not in the world.

Before a level is considered art-integrated, open editor mode and verify that every hotspot circle lines up with a visible painted object in the background. Track cleanup status in `10-scene-prop-integration-audit.md`.

It should check:

- valid JSON syntax;
- required fields and supported enum values;
- unique puzzle and rule IDs;
- missing puzzle dependencies;
- dependency cycles;
- impossible gates;
- unsupported condition and action types;
- bindings for hotspots, guides, and exits;
- curriculum coverage;
- translation coverage;
- exit gate review word coverage;
- asset references and declared texture keys;
- simulated level completion.

The deterministic validator proves structural and logical reachability. It does not prove that a child can perceive, click, or understand the required interaction in the Phaser scene.

Validator output should be machine-readable so the Reviewer can route repairs:

```json
{
  "status": "ERROR",
  "errors": [
    {
      "type": "missing_dependency_source",
      "severity": "blocking",
      "path": "$.puzzles[3].requires.all[0]",
      "message": "Puzzle requires 'jungle.has_rope', but no rule or puzzle produces it.",
      "suggested_owner": "writer"
    }
  ]
}
```

Existing commands are the starting point:

```sh
npm run test:engine
npm test
```

Future validators can add a dedicated generated-level command without changing the basic workflow.

## Agent 3: ECA Reviewer

The ECA Reviewer reads validator output and sends the smallest possible repair request to the right agent. It focuses on progression logic, graph reachability, dependencies, and runtime data contracts.

Routing rules:

- Broken JSON, schema mismatch, unsupported enum, or bad IDs go to the JSON Coder.
- Impossible quest logic, missing item cause, dead paths, or weak puzzle motivation go to the Writer.
- Missing vocabulary, grammar, or translation coverage usually goes to the Writer.
- Asset declaration mismatches usually go to the JSON Coder.
- UI state, clickability, label, hotspot, and visual communication issues go to the UI Consistency Reviewer.

Example ECA Reviewer response:

```json
{
  "route_to": "writer",
  "reason": "The bridge gate requires a rope, but the player never gets a rope before reaching the bridge.",
  "repair_instruction": "Add a simple rope retrieval puzzle before the bridge. Keep the same target vocabulary."
}
```

The orchestrator then repeats:

```text
Writer revision -> JSON Coder revision -> Validator -> ECA Reviewer
```

A session should have a maximum revision count so broken generations do not loop forever.

## Agent 4: UI Consistency Reviewer

The UI Consistency Reviewer checks whether a validated level is actually playable and understandable through the Phaser scene. Its core rule is: **a level is not playable just because ECA simulation passes.**

Responsibilities:

- Check that every required hotspot is visible, reachable, and clickable.
- Verify that hotspot glows, labels, and hit zones are centered on the visible object or intended exit cue in screenshots, not on nearby empty ground or unrelated scenery.
- Detect overlapping hotspot hit zones, stale labels, stale commands, and misleading toasts.
- Verify that the scene reflects campaign state after revisits or branching paths.
- Check that locked hotspot text explains the real missing requirement.
- Verify that exit glow, guide text, inventory, HUD status, and ECA state agree.
- Verify that the exit gate review uses the same parchment question style as other challenge dialogs.
- Verify that the exit gate review is 10 questions, bidirectional, closeable/resumable, and does not show hover translation reveals.
- Verify that a completed exit does not show the gate review again.
- Check that browser tests exercise real UI interactions where playability matters, not only direct `engine.emit` calls.
- When possible, perform a read-only browser probe or screenshot inspection to verify that required interactions can be reached through actual pointer clicks.
- Inspect screenshots for readable text, non-overlapping UI, and obvious story/asset mismatch.
- Route hotspot glow or hit-zone misalignment to the JSON Coder when coordinates/radii are wrong, and to the Asset Director when the required object is not actually present in the painted background.
- Route pure progression bugs back to the ECA Reviewer, schema problems to the JSON Coder, and wording/content problems to the Writer.

Example UI review finding:

```json
{
  "route_to": "json_coder",
  "reason": "The required return hotspot 'supply_message' is placed at the same x/y/radius as 'computer_station', so the player may click the scenery object instead of the puzzle.",
  "repair_instruction": "Move the return hotspot or add state-based hotspot visibility. Add a browser test that clicks the visible return hotspot after Level 3 returns to Level 2."
}
```

The UI Consistency Reviewer should run after ECA validation succeeds and before asset generation. Asset generation should not begin while the level still has unresolved clickability, state-presentation, or readability problems.

## Agent 5: Asset Director

The Asset Director starts only after ECA validation and UI consistency review succeed.

Responsibilities:

- Read the validated scenario and mission manifest.
- Produce an asset plan for backgrounds, characters, hotspots, inventory icons, and UI crops.
- Generate or otherwise provide every non-reused asset declared by the plan.
- Copy project-bound generated files into the workspace; do not leave referenced assets only in an external generation cache.
- Update the scenario asset paths and frame coordinates so Phaser loads the generated files.
- Mark the asset plan as integrated only after the scenario references the generated or explicitly reused assets.
- Keep visual style consistent with the current Phaser game.
- Avoid text inside generated images.
- Avoid scary, violent, or confusing imagery.
- Declare output paths and texture keys before generation.

Example asset plan entry:

```json
{
  "id": "jungle_stream_background",
  "type": "background",
  "size": "1536x864",
  "path": "assets/generated/jungle-stream-01/background.png",
  "style": "painted kid-friendly jungle adventure, warm and readable",
  "prompt": "A cheerful jungle stream crossing with a small broken wooden bridge, clear open ground for a child hero and guide, no text."
}
```

The Asset Director should create or update an asset plan first. Image generation and file integration are separate required steps, not optional follow-up notes.

### Asset Plan Status

Asset plans may use these top-level statuses:

- `planned`: prompts and output paths are drafted, but files are not generated or integrated yet.
- `integrated`: required files exist in the workspace, the scenario references them, and any reused assets are documented as reuse decisions.

Validation must fail for an authored level whose matching asset plan is still `planned`. Validation must also fail when a plan declares a generated background, prop atlas, or guide sheet but the scenario still points at an older placeholder path.

Example integrated asset plan shape:

```json
{
  "scene_id": "jungle-stream-01",
  "status": "integrated",
  "assets": [
    {
      "id": "jungle_stream_background",
      "type": "background",
      "path": "assets/generated/jungle-stream-01/background.png",
      "texture_key": "campBg"
    },
    {
      "id": "jungle_stream_props",
      "type": "interactive_props",
      "path": "assets/generated/jungle-stream-01/interactive-props.png",
      "texture_key": "interactiveProps"
    },
    {
      "id": "guide_reuse",
      "type": "guide_spritesheet",
      "path": "assets/james-bond/level-01-briefing/generated/director-guide-spritesheet.png",
      "texture_key": "guide",
      "decision": "Reuse the existing guide until a dedicated sheet meets quality constraints."
    }
  ],
  "generated_outputs": [
    "assets/generated/jungle-stream-01/background.png",
    "assets/generated/jungle-stream-01/interactive-props.png"
  ]
}
```

## Artifacts

Each generated level should leave behind reviewable artifacts:

```text
scenarios/drafts/<scene_id>-design.md
scenarios/<scene_id>-content.json
game-engine/missions/<scene_id>.json
scenarios/drafts/<scene_id>-assets.json
assets/generated/<scene_id>/
```

The design draft is allowed to be messy and creative. The scenario and mission files must be strict, validated runtime data.

## Acceptance Criteria

A generated level is not ready until:

- the scenario JSON validates;
- the mission manifest validates;
- the level can be completed through simulation;
- all target vocabulary and grammar are covered;
- Bulgarian translations are present for learner-facing English text;
- the exit gate review word set is explicitly selected, translated, and suitable for 10 bidirectional questions;
- all required assets are declared;
- declared asset files exist in the workspace;
- matching asset plans are marked `integrated`, not `planned`;
- generated background and prop atlas paths in the asset plan are the same paths referenced by the scenario;
- Phaser can load the level;
- browser smoke screenshots show readable UI and reachable interactions;
- required progression interactions are tested through real UI clicks when clickability or state presentation matters;
- browser tests cover the exit gate review, including 10 questions, 5/5 direction balance, no hover translation reveal, close/resume behavior, wrong-answer feedback, and no repeat after the completed exit;
- state-dependent revisits show correct labels, locked text, exit glow, inventory, guide text, and commands.

The design rule is: **agents may author and revise level data, but deterministic validation decides whether the level is playable.**
