# Puzzle Dependency Graph and ECA Runtime

## Purpose

The adventure game now separates **what must be solved** from **how the world reacts**.

- The **Puzzle Dependency Graph** describes progression: available, locked, in progress, and completed puzzles.
- **Event–Condition–Action (ECA)** rules describe runtime behavior: when an event happens, evaluate a condition and execute declared actions.
- Phaser remains responsible for rendering, movement, dialogue bubbles, animation, and input. It communicates with the engine through a small bridge.

This is the foundation for the James Bond learning campaign. Levels 01 and 02 are the first migrated levels.

## Runtime files

- `game-engine/runtime.js` — reusable engine implementation.
- `game-engine/phaser-bridge.js` — integration with the current Phaser scene.
- `game-engine/missions/james-bond-level-01.json` — Level 01 puzzle graph and ECA rules.
- `game-engine/missions/james-bond-level-02.json` — Level 02 puzzle graph and ECA rules.
- `tools/validate-game-engine.mjs` — graph validation and two-level campaign simulation.
- `tools/bond-engine-browser-test.mjs` — live browser verification of the Level 01 → Level 02 transition.

The engine manifests are deliberately separate from the learning-content scenario JSON files. Scene art, questions, translations, and curriculum metadata remain in `scenarios/`; progression and world rules live in `game-engine/missions/`.

## Data flow

```text
Player input / quiz result
          |
          v
     Domain event
          |
          v
    ECA rule engine ---- condition evaluator
          |                       |
          v                       v
       actions              persistent state
          |
          v
   Phaser bridge / scene transition
```

Phaser emits domain events such as:

- `mission.understood`
- `collectible.completed`
- `guide.completed`
- `exit.reached`

The engine does not know how a speech bubble or sprite is drawn.

## Mission manifest

Each migrated scene has a matching manifest named after its `scene_id`:

```text
game-engine/missions/<scene_id>.json
```

Example header:

```json
{
  "schema_version": 1,
  "campaign_id": "junior-agent-spy-academy",
  "storage_key": "english-game:junior-agent-spy-academy",
  "scene_id": "james-bond-level-01",
  "mission_puzzle": "level01_understand_mission",
  "initial_state": {
    "facts": {},
    "inventory": [],
    "counters": {},
    "puzzles": {}
  },
  "puzzles": [],
  "rules": [],
  "bindings": {}
}
```

The same `campaign_id` and `storage_key` are used by both levels. This preserves solved puzzles and campaign facts when Level 01 navigates to Level 02.

## Puzzle nodes

A puzzle node has a stable ID, optional requirements, and optional produced facts:

```json
{
  "id": "level01_director_approval",
  "title": "Pass the director final check",
  "type": "gate",
  "requires": {
    "all": [
      { "puzzle": "level01_agent_badge", "status": "completed" },
      { "puzzle": "level01_dossier_clue", "status": "completed" },
      { "puzzle": "level01_profile_form", "status": "completed" }
    ]
  },
  "produces": ["level01.director_approved"]
}
```

Runtime puzzle states are:

- `locked` — requirements are not satisfied.
- `available` — requirements are satisfied and the player can begin.
- `in_progress` — explicitly started but not complete.
- `completed` — solved and persisted.

The three Level 01 learning puzzles become available in parallel after the mission briefing. They converge at the director approval gate. Level 02 follows the same shape.

## Bindings

Bindings connect existing scene objects to puzzle nodes without adding engine-specific fields to the content JSON:

```json
{
  "bindings": {
    "hotspots": {
      "agent_badge": { "puzzle_id": "level01_agent_badge" }
    },
    "guide": {
      "id": "director",
      "puzzle_id": "level01_director_approval"
    },
    "exit": {
      "id": "training_door",
      "puzzle_id": "level01_enter_training_door",
      "requires_puzzle": "level01_director_approval"
    }
  }
}
```

This keeps the current scene format reusable and allows the same presentation content to run without the engine if necessary.

## Conditions

Supported declarative conditions:

```json
{ "puzzle": "some_puzzle", "status": "completed" }
{ "fact": "some.fact", "equals": true }
{ "inventory_contains": "item_id" }
{ "inventory_missing": "item_id" }
{ "counter": "attempts", "at_least": 2 }
{ "event": "payload.answer", "equals": "correct" }
{ "all": [] }
{ "any": [] }
{ "not": {} }
```

Conditions may be nested. Mission files cannot execute arbitrary JavaScript.

## ECA rules

A rule declares an event, optional condition, and actions:

```json
{
  "id": "level01-director-approved",
  "once": true,
  "event": {
    "type": "guide.completed",
    "target": "director"
  },
  "condition": {
    "puzzle": "level01_director_approval",
    "status": "available"
  },
  "actions": [
    {
      "type": "puzzle.complete",
      "puzzle": "level01_director_approval"
    },
    {
      "type": "flag.set",
      "flag": "training_door_open",
      "value": true
    },
    {
      "type": "exit.refresh"
    }
  ]
}
```

`once: true` is persisted. Repeated clicks or duplicate events cannot grant an item or complete the same transition twice.

## Supported actions

State actions:

- `fact.set`
- `counter.increment`
- `inventory.add`
- `inventory.remove`
- `inventory.clear`
- `puzzle.start`
- `puzzle.complete`
- `flag.set`

Presentation bridge actions:

- `ui.status.set`
- `ui.toast`
- `ui.vocab.show`
- `dialog.show`
- `exit.refresh`

Flow actions:

- `event.emit`
- `scene.transition`
- `campaign.complete`

This whitelist is intentional. Content cannot execute arbitrary code.

## Phaser bridge

`game-engine/phaser-bridge.js` wraps the existing data-driven Phaser scene. It converts engine actions into the current presentation:

- Inventory actions update `learnedWords` and the HUD.
- Puzzle completion updates hotspot glows.
- Flag actions keep compatibility with existing scene flags.
- `dialog.show` uses the parchment speech bubble.
- `scene.transition` changes the `scenario` URL parameter.

Level 01 now transitions to:

```text
phaser.html?scenario=scenarios/james-bond-level-02-content.json
```

Level 02 currently ends with `campaign.complete`. When Level 03 is ready, the final Level 02 rule can be changed to a `scene.transition` action without changing Phaser progression code.

## Persistent state

The runtime stores campaign state in `localStorage`, so campaign progress survives browser restarts on the same device. The latest campaign also records its resume scenario; opening the bare game URL continues there unless an explicit `scenario`, `level`, `reset`, or `new` parameter is supplied.

For development exploration, append `explore=1` to any game URL. The flag is kept during navigation and allows direct travel through gates without completing their normal requirements. Adventure maps also open immediately and show every configured destination. This mode works in both Sun Temple and Junior Agent Spy Academy.

```json
{
  "currentScene": "james-bond-level-02",
  "facts": {},
  "inventory": [],
  "counters": {},
  "puzzles": {},
  "firedRules": [],
  "eventHistory": []
}
```

Persistence currently lasts for the browser tab. A profile/save service can later replace the storage adapter without changing mission manifests.

Inventory is cleared between Level 01 and Level 02, while solved puzzles and campaign facts remain available as history.

## Debug controls

The engine provides a developer overlay:

- `F2` — all puzzle nodes and statuses.
- `F3` — facts and inventory.
- `F4` — recent domain events.
- `F5` — currently available puzzles.

Press the same key again to close the overlay.

The active runtime is also available as:

```js
window.__ENGLISH_GAME_ENGINE__
```

Useful calls:

```js
window.__ENGLISH_GAME_ENGINE__.getSnapshot()
window.__ENGLISH_GAME_ENGINE__.getPuzzleStatus("level01_agent_badge")
window.__ENGLISH_GAME_ENGINE__.emit("collectible.completed", { target: "agent_badge" })
```

## Validation

Run:

```sh
npm run test:engine
```

The validator checks:

- unique puzzle and rule IDs;
- missing puzzle dependencies;
- dependency cycles;
- final puzzle presence;
- supported action types;
- hotspot, guide, and exit bindings;
- Level 01 locked-exit behavior;
- complete Level 01 simulation;
- persistent state across Level 01 → Level 02;
- complete Level 02 simulation and campaign completion.

The browser test additionally loads the actual Phaser application, completes both levels through domain events, observes the real navigation, and confirms state persistence.

## Adding the next level

1. Add the new scenario JSON.
2. Add `game-engine/missions/<scene_id>.json` with the same campaign ID and storage key.
3. Define puzzle nodes, ECA rules, and object bindings.
4. Replace the previous level's terminal `campaign.complete` action with `scene.transition`.
5. Run `npm test` and inspect the F2/F4 debug views.

The design rule is: **new adventure progression should normally be expressed as graph nodes and ECA rules, not as new progression-specific `if` statements in Phaser code.**
