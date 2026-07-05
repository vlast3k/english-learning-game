# 01. Data-Driven Scenes

The Phaser experience now has a reusable scene engine with scene-specific learning content supplied by JSON.

## What Changed

`phaser-game.js` still owns the core runtime behavior:

- walking to clicked ground and hotspots
- pathfinding around obstacle rectangles
- opening collectible challenge dialogs
- gating collectible quizzes behind a Bulgarian translation choice
- showing view-only scenery bubbles
- showing guide/director speech bubbles
- gating an exit behind required learning items
- revealing Bulgarian translations on English word hover
- rendering feedback, answer buttons, inventory, status text, and native Phaser UI

Scene-specific content lives in `*-content.json` files under `scenarios/`. The current files are:

- `scenarios/camp-content.json`
- `scenarios/james-bond-level-01-content.json`

`phaser-content.js` is the adapter between the stable Phaser scene and those JSON files. It wraps the scene class, loads content, normalizes field names, and overrides only the pieces that should come from data.

## Scenario Loading

By default, the adapter loads:

```text
scenarios/camp-content.json
```

For local experiments, pass a scenario file in the URL:

```text
phaser.html?scenario=scenarios/james-bond-level-01-content.json
```

The query string changes content only. It does not require a fork of `phaser-game.js`.

## Data Contract

Each scenario file can define the learning and navigation shape of a level.

Required core fields:

- `schema_version`
- `scene_id`
- `content_version`
- `translations`
- `guide`
- `hotspots`
- `quizzes`

Optional scene configuration fields:

- `level_plan`: design notes for the level objective and flow
- `assets`: references to generated art/source assets
- `hero_start`: starting position for the hero
- `hud.status_text`: initial status text
- `navigation.walkable_polygon`: floor area where the hero can stand
- `navigation.obstacles`: rectangles the hero cannot walk through
- `navigation.clearance`: pathfinding clearance around obstacles
- `exit_marker`: data-driven exit label, walk target, lock text, unlock status, and required flag

The adapter currently recognizes these runtime asset overrides:

- `assets.background` -> Phaser texture key `campBg`
- `assets.hero_spritesheet` -> Phaser spritesheet key `heroSprite`
- `assets.hero_portraits` -> Phaser spritesheet key `heroPortraits`
- `assets.guide_spritesheet` -> Phaser spritesheet key `guideSprite`

These paths are read before Phaser queues the default camp assets, so a scenario can change the visible background and characters without changing `phaser-game.js`.

## Hotspots

Hotspots are clickable scene areas. The adapter maps `walk_to` to the runtime `walkTo` field and treats `kind` as the behavior switch.

Collectible hotspots:

- `kind: "collectible"`
- open an intro bubble
- require the player to choose the correct Bulgarian translation for the intro text
- then run the quiz list under `quizzes[hotspot.id]`
- after completion, add the item to inventory/learned words
- count toward `guide.required_items`

View-only hotspots:

- `kind: "scenery"`
- open a description bubble
- do not run quizzes
- do not affect inventory or guide gating

In the James Bond Level 01 content:

- Collectibles: `agent_badge`, `dossier_clue`, `profile_form`
- View-only: `mission_screen`, `briefing_table`, `world_map`
- The level plan is explained by the `mission_screen` hotspot

## Guide And Exit Flow

The guide/director remains the same reusable interaction pattern:

1. The player completes required collectible quizzes.
2. The player talks to the guide/director.
3. The guide dialogue checks one or more final answers.
4. A correct final answer can run an action such as:

```json
{ "type": "set_flag", "flag": "training_door_open" }
```

The `exit_marker.required_flag` controls whether the exit is locked or open.

For the camp scene, this is the jungle path. For James Bond Level 01, this is the training door.

## Navigation

Navigation can now be content-driven.

The base engine still performs pathfinding, clamping, and obstacle avoidance. A scenario may provide:

- a walkable polygon for floor bounds
- a list of rectangular obstacle footprints
- a clearance value for routing around obstacles

This is how a level says where the hero can walk and where the hero cannot go without changing the Phaser engine.

For James Bond Level 01, blocked areas include:

- briefing table
- front chair
- scanner station
- plant
- right cabinets

## Translations

Each scenario provides its own `translations` dictionary. The adapter resolves hovered English tokens through scenario data first, then falls back to the built-in Phaser translations.

This keeps vocabulary local to a level. For example, the Bond level adds words such as `badge`, `dossier`, `profile`, `director`, `mission`, `name`, `family`, `friend`, `boy`, `girl`, `man`, and `woman`.

## What Is Reusable

The reusable engine layer is the interaction model:

- movement and pathfinding
- hotspot click handling
- collectible challenge flow
- collectible intro translation checks
- engine-side challenge answer shuffling
- scenery bubble flow
- guide/director gating
- dialogue-tree option handling
- exit locking/unlocking
- translation reveal behavior
- feedback and inventory UI

Future scenes should add scenario JSON and assets first. Changes to `phaser-game.js` should only be needed when introducing a genuinely new mechanic.

## Validation

`tools/validate-game-content.mjs` validates every `*-content.json` file before the game runs. It checks that:

- `phaser-content.js` is loaded before `phaser-game.js`
- scenario files have the required top-level fields
- hotspots have labels, positions, radii, walk targets, and valid kinds
- collectibles have intro text, learning metadata, and quizzes
- collectible intros have exactly three Bulgarian translation choices and exactly one correct choice
- scenery hotspots have description text
- guide requirements reference known collectibles
- quiz questions have valid options and exactly one correct answer
- optional navigation polygons and obstacle rectangles have valid bounds
- optional exit markers have labels, lock text, unlock flags, and walk targets
- guide dialogue trees reference valid start nodes
- translations are available through the data-driven adapter

Validation is included in `npm test`, so new content should fail early if the JSON shape breaks.

## Pattern For Future Engine Features

Add future reusable game-engine changes as numbered notes in this folder:

```text
game-engine/02-next-feature.md
game-engine/03-another-feature.md
```

Each note should explain:

- what changed
- what became reusable
- what remains scene-specific
- how the behavior is validated
