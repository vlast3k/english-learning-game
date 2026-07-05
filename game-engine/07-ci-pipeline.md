# CI Pipeline

## What CI means here

**CI** means **Continuous Integration**.

In this repository, the CI pipeline is an automated verification process that runs the project checks in a clean GitHub-hosted environment whenever code is proposed or integrated.

Its purpose is to answer:

> Can this change be safely integrated without breaking the game content, the puzzle/ECA engine, the JavaScript runtime, the generated assets, or the browser behavior?

The pipeline is defined in:

```text
.github/workflows/test.yml
```

It is implemented with GitHub Actions.

The pipeline is **not a deployment pipeline**. It does not publish the game, create a release, or update a production environment. It only validates the repository.

## When the pipeline runs

The workflow runs for:

```yaml
on:
  pull_request:
  push:
    branches: [main]
```

This means:

1. Every pull request receives an automated verification run.
2. Every push merged or committed directly to `main` is verified again.

Running the checks both before and after integration protects against two different problems:

- A pull request may be invalid on its own.
- A valid pull request may conflict logically with other changes that reached `main` first.

## Execution environment

The pipeline uses one GitHub Actions job called `test`:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
```

The job runs on a fresh Ubuntu virtual machine and has a ten-minute timeout.

A clean runner is important because it prevents tests from passing only because of files, packages, caches, browser state, or environment variables left on a developer machine.

The pipeline prepares these runtimes:

- Node.js 24
- Python 3.12
- Chrome, through the GitHub runner image and Playwright's configured `chrome` channel

The Node package cache is enabled, but dependencies are still installed from the lock file using:

```sh
npm ci
```

Unlike `npm install`, `npm ci` is intended for deterministic automation:

- it requires the lock file to match `package.json`;
- it installs the exact locked dependency versions;
- it starts from a clean `node_modules` directory.

Python installs Pillow because the asset validators inspect generated image files:

```sh
python -m pip install pillow
```

## Pipeline overview

The job executes the following validation chain:

```text
Checkout repository
        |
        v
Prepare Node.js and Python
        |
        v
Install Pillow and npm dependencies
        |
        v
Validate scenario content
        |
        v
Validate Puzzle Graph + ECA engine
        |
        v
Validate assets and JavaScript syntax
        |
        v
Run existing Phaser browser smoke test
        |
        v
Run James Bond Level 01 -> Level 02 browser test
```

The steps are intentionally ordered from the cheapest and most structural checks to the more expensive browser checks.

A malformed JSON manifest should fail before Chrome is started. A browser is only started after the repository structure, engine definitions, assets, and JavaScript have passed validation.

## npm command structure

The top-level command is:

```sh
npm test
```

It expands to:

```text
npm run test:content
    -> npm run test:engine
    -> npm run test:assets
    -> npm run test:browser
```

The browser group expands further:

```text
npm run test:browser:base
    -> npm run test:browser:bond
```

The commands are defined in `package.json`:

```json
{
  "scripts": {
    "test": "npm run test:content && npm run test:engine && npm run test:assets && npm run test:browser",
    "test:content": "node tools/validate-game-content.mjs",
    "test:engine": "node tools/validate-game-engine.mjs",
    "test:assets": "python3 tools/validate_character_sprites.py && node --check phaser-game.js && node --check phaser-content.js && node --check game-engine/runtime.js && node --check game-engine/phaser-bridge.js",
    "test:browser": "npm run test:browser:base && npm run test:browser:bond",
    "test:browser:base": "node tools/run-browser-smoke-test.mjs",
    "test:browser:bond": "node tools/bond-engine-browser-test.mjs"
  }
}
```

The `&&` operators are deliberate. A later stage does not run when an earlier stage fails.

This gives a clearer failure boundary and avoids wasting runner time.

## Stage 1: Scenario content validation

Command:

```sh
npm run test:content
```

Implementation:

```text
tools/validate-game-content.mjs
```

This is the existing data-content validation stage. It checks the scenario manifests used by the data-driven Phaser scene.

Its responsibility is the **learning and scene content layer**, including structures such as:

- scenario JSON validity;
- required content fields;
- hotspots;
- quizzes;
- dialogue trees;
- translations;
- scene configuration.

This stage answers:

> Is the declarative scenario content structurally valid before the game or engine tries to use it?

It does not validate the Puzzle Dependency Graph. That belongs to the next stage.

## Stage 2: Puzzle Graph and ECA validation

Command:

```sh
npm run test:engine
```

Implementation:

```text
tools/validate-game-engine.mjs
```

This is the architecture-specific CI stage added with the Puzzle Dependency Graph and ECA runtime.

It performs two categories of checks.

### Static graph checks

The validator checks:

- every puzzle has a unique ID;
- every rule has a unique ID;
- puzzle dependencies refer to existing puzzle nodes;
- the dependency graph has no cycles;
- every migrated mission has a final puzzle;
- ECA rules use only supported action types;
- `puzzle.complete` actions reference existing puzzles;
- scene-transition targets exist;
- collectible hotspot bindings reference real hotspots and puzzles;
- guide and exit bindings reference real puzzles.

These checks prevent errors such as:

```text
level02_director_check requires level02_missing_clue
```

when `level02_missing_clue` does not exist.

They also prevent a cycle such as:

```text
Puzzle A requires Puzzle B
Puzzle B requires Puzzle A
```

which would leave both puzzles permanently locked.

### Headless campaign simulation

The validator then loads `game-engine/runtime.js` in an isolated Node.js VM and simulates the two migrated missions without Phaser.

The simulation verifies:

1. The Level 01 training door stays locked before director approval.
2. The Level 01 mission briefing becomes completed.
3. The badge, dossier, and profile puzzles can be completed.
4. The director gate becomes available and completes.
5. The training-door puzzle completes.
6. The engine requests the Level 02 scenario transition.
7. Level inventory is cleared at the transition.
8. Campaign state survives when a Level 02 runtime is created.
9. The Level 02 phone, camera, and hidden-bag puzzles complete.
10. The director room-check gate completes.
11. The final Level 02 puzzle completes.
12. The campaign-completion fact is written.

This stage is faster than a browser test and isolates engine behavior from Phaser rendering.

It answers:

> Is the graph logically solvable, and do the ECA rules produce the intended campaign state transitions?

## Stage 3: Assets and JavaScript validation

Command:

```sh
npm run test:assets
```

The command combines Python asset checks and JavaScript syntax checks:

```sh
python3 tools/validate_character_sprites.py
node --check phaser-game.js
node --check phaser-content.js
node --check game-engine/runtime.js
node --check game-engine/phaser-bridge.js
```

### Character asset validation

`tools/validate_character_sprites.py` checks assumptions made by the Phaser animation code about generated sprite assets.

This protects against issues such as:

- an image with the wrong dimensions;
- a spritesheet with an unexpected frame layout;
- missing generated character files;
- assets that cannot be read as valid images.

### JavaScript syntax validation

`node --check` parses each JavaScript file without running it.

This catches syntax errors such as:

- missing brackets;
- invalid object syntax;
- malformed class methods;
- broken string or template literals.

The new engine files are included explicitly:

```text
game-engine/runtime.js
game-engine/phaser-bridge.js
```

This stage answers:

> Are the required visual assets structurally usable, and can Node parse all runtime JavaScript?

It does not prove browser behavior. That is the responsibility of the final two stages.

## Stage 4: Base Phaser browser smoke test

Command:

```sh
npm run test:browser:base
```

Implementation:

```text
tools/run-browser-smoke-test.mjs
tools/browser-smoke-test.mjs
```

The test starts a temporary local HTTP server and launches Chrome through Playwright.

It exercises the existing Phaser proof of concept and verifies presentation behavior such as:

- the game loads without browser errors;
- the expected assets are requested;
- hero walking animations advance through multiple frames;
- the character body pose changes while walking;
- the hero uses one sprite layer without the removed boot overlay;
- translation-gate choices are displayed;
- an incorrect translation causes the validation penalty and reshuffle;
- a correct translation unlocks the next interaction;
- the mission-introduction translation gate behaves correctly.

`tools/run-browser-smoke-test.mjs` is a small stable runner around the original smoke test. It keeps the original checks, but uses four distinct frames as the minimum for the short downward route. The route can finish before five different frames are sampled on CI runners, while four frames plus the existing body-pose assertions still demonstrate a real walk animation.

This test protects the existing camp experience from regressions introduced by shared Phaser wrappers or script-loading changes.

It answers:

> Does the original Phaser game still render and behave correctly in a real browser?

## Stage 5: Bond campaign browser test

Command:

```sh
npm run test:browser:bond
```

Implementation:

```text
tools/bond-engine-browser-test.mjs
```

This is an end-to-end integration test for the migrated Puzzle Graph and ECA architecture.

Like the base smoke test, it starts a local HTTP server and launches Chrome with Playwright.

The test then:

1. Opens Phaser with the Level 01 scenario.
2. Waits until `window.__ENGLISH_GAME_ENGINE__` reports `james-bond-level-01`.
3. Emits the Level 01 mission-understood event.
4. Completes the badge, dossier, and profile domain events.
5. Completes the director event.
6. Confirms the three items reached the Phaser inventory presentation.
7. Emits the training-door exit event.
8. Observes the real URL navigation to the Level 02 scenario.
9. Waits until the Level 02 engine runtime is active.
10. Confirms the Level 01 final puzzle remained persisted.
11. Completes the Level 02 mission and three clue events.
12. Completes the Level 02 director and exit events.
13. Confirms the final Level 02 puzzle and campaign fact.
14. Fails if the browser reports JavaScript errors.

This stage tests the complete integration boundary:

```text
mission manifest
      +
engine runtime
      +
ECA rules
      +
Phaser bridge
      +
sessionStorage
      +
real browser navigation
```

It answers:

> Does the architecture work inside the actual Phaser application, including the Level 01 -> Level 02 transition and persistent campaign state?

## Why both engine simulation and browser testing exist

The headless engine test and the browser test overlap intentionally, but they protect different failure modes.

| Test | Main responsibility |
| --- | --- |
| `test:engine` | Graph correctness, ECA semantics, persistent state model, deterministic campaign simulation |
| `test:browser:bond` | Phaser integration, browser script order, bridge behavior, URL transition, browser storage |

For example:

- A missing puzzle dependency should fail `test:engine`.
- A broken `<script>` order in `phaser.html` should fail `test:browser:bond`.
- A malformed JavaScript file should fail `test:assets` before either browser test.
- A visual walking regression should fail `test:browser:base` even when the graph is correct.

Keeping the layers separate makes failures easier to diagnose.

## Failure behavior

GitHub marks the workflow as failed when any command exits with a non-zero status.

Because the stages run sequentially, the name of the failed GitHub Actions step identifies the subsystem to inspect:

| Failed step | Likely problem area |
| --- | --- |
| Validate game content | Scenario JSON, quizzes, translations, dialogue, content fields |
| Validate puzzle graph and ECA engine | Puzzle dependencies, bindings, rules, actions, campaign state logic |
| Validate assets and JavaScript | Spritesheet/image structure or JavaScript syntax |
| Run base browser smoke test | Existing Phaser UI, movement, animation, translation interaction |
| Run Bond campaign browser test | Engine/Phaser bridge, persistence, scenario transition, browser integration |

A failed CI pipeline should not automatically be interpreted as “the engine is broken.” The failed step indicates which layer rejected the change.

## Local reproduction

Run the complete pipeline locally with:

```sh
npm ci
python3 -m pip install pillow
npm test
```

Run one layer only:

```sh
npm run test:content
npm run test:engine
npm run test:assets
npm run test:browser:base
npm run test:browser:bond
```

The browser tests use Chrome by default:

```sh
BROWSER_CHANNEL=chrome npm run test:browser:bond
```

To show the browser window while debugging locally:

```sh
HEADLESS=false BROWSER_CHANNEL=chrome npm run test:browser:bond
```

The CI runner uses headless mode.

## Relationship to pull requests

For a pull request, GitHub creates a temporary merge result between the branch and the current target branch and runs the workflow against that integrated result.

This is important: CI is not only testing the feature branch in isolation. It is checking whether the proposed result can work together with the current `main` branch.

A green pull-request check therefore means:

- the proposed merge result passed all configured validation stages;
- it does not mean the code has been manually reviewed;
- it does not mean the game was deployed;
- it does not prove every possible player path;
- it does prove the specific structural, simulation, asset, syntax, and browser scenarios encoded in the pipeline.

## Adding a new engine capability

When adding a new puzzle condition, ECA action, state field, or scene binding:

1. Update the runtime implementation.
2. Add the new action or structure to `tools/validate-game-engine.mjs`.
3. Add a headless simulation case proving its state behavior.
4. Add a browser case when the feature crosses the Phaser bridge or browser boundary.
5. Include new JavaScript runtime files in `test:assets` syntax validation.
6. Run `npm test` before opening or updating the pull request.

The principle is:

> Every declarative engine capability should have a structural validator, and every important player-visible integration should have a browser test.

## Current scope and future extensions

The current CI pipeline validates the repository but does not yet perform:

- deployment;
- packaging or release creation;
- performance benchmarking;
- visual screenshot comparison against approved baselines;
- accessibility auditing;
- cross-browser testing beyond the configured Chrome channel;
- saved-game compatibility migration tests across engine schema versions.

These can be added later as separate jobs or workflows. They should not be mixed into the current validation job until there is a clear failure policy and ownership for each new check.
