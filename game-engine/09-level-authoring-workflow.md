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
Asset plan + generated assets
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

## Agent 1: Writer

The Writer designs the quest in natural language or semi-structured notes. Its job is educational adventure design, not JSON formatting.

Responsibilities:

- Use the requested vocabulary and grammar.
- Create a clear child-friendly level goal.
- Define characters, items, locations, and puzzle beats.
- Keep item logic believable.
- Avoid unsupported mechanics.
- Explain why each collectible or gate exists.

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
5. Exit to the next level.
```

The Writer may describe desired state changes, but stable puzzle IDs, flags, and ECA rules are normalized later.

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

The JSON Coder should not create new mechanics. If the design requires unsupported behavior, it should mark the draft for review instead of encoding imaginary fields.

## Tool: Deterministic Validator

The validator is not an LLM. It is the trusted gatekeeper.

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

The Asset Director should create or update an asset plan first. Image generation and file integration are separate steps.

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
- all required assets are declared;
- Phaser can load the level;
- browser smoke screenshots show readable UI and reachable interactions;
- required progression interactions are tested through real UI clicks when clickability or state presentation matters;
- state-dependent revisits show correct labels, locked text, exit glow, inventory, guide text, and commands.

The design rule is: **agents may author and revise level data, but deterministic validation decides whether the level is playable.**
