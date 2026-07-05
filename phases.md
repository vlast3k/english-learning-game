Ето готов, структуриран документ, който можете да копирате и поставите директно във вашия локален AI асистент (като Codex, Cursor, GitHub Copilot или друг), за да започне изграждането на играта.

Той е написан на английски в техническата си част, тъй като езиковите модели за програмиране се справят най-добре с инструкции на английски, но концепцията запазва всички обсъдени дотук правила.

---

# One-Scene POC Plan: Reviewable Pilot Scene

## Critical Update
The first POC proves JSON loading, vocabulary, dialogue, and Bulgarian feedback, but it does **not** yet feel like a classic point-and-click adventure. The next phase must add the adventure-game layer: a visible hero sprite walking through scenes, visiting locations, approaching characters, and starting conversations after movement.

---

# Phaser 3 Visual/Interaction POC: Native Adventure First Scene

## Goal
Rebuild the first camp scene as a Phaser 3 POC to test whether the game can feel like a real animated point-and-click adventure rather than a DOM prototype.

This POC is allowed to diverge visually from the vanilla browser implementation. Its job is to prove production direction:

- painted bitmap background
- Phaser-rendered hero/NPC/hotspots
- click-to-walk movement
- native in-game speech bubble, not web-form dialogue
- Bulgarian translation toggle inside the speech bubble
- critical visual review before handoff

## Phaser Stack

- Runtime: Phaser 3 vendored locally for this POC.
- Entry point: `phaser.html`
- Game code: `phaser-game.js`
- Styling shell: `phaser-style.css`
- Phaser library: `vendor/phaser.min.js`
- Background asset: `assets/phaser/camp-bg-painted.png`
- Scenario data: reuse `scenarios/sun-temple-poc.json` for dialogue text and translations where practical.

## First Scene Scope

Build only the camp scene:

- painted camp background
- original young explorer hero
- guide NPC
- rope, backpack, and map hotspots
- jungle exit marker
- inventory chips
- native speech bubble when talking to guide
- `BG` control inside the speech bubble to reveal Bulgarian question translation
- wrong-answer Bulgarian feedback inside the same game-native bubble

## Native Bubble Requirements

The dialogue must look like part of the adventure game, not a web panel:

- rounded parchment bubble rendered by Phaser graphics
- small tail pointing toward the guide or speaking character
- speaker name integrated as a small badge
- answer buttons styled as adventure-game choices
- `BG` chip built into the bubble chrome
- feedback and translation presented as parchment notes inside the same bubble
- bubble should not cover the whole scene unless necessary

## Review Gate

Before release:

1. Test all interactions in browser.
2. Capture screenshots:
   - initial camp
   - guide bubble before BG
   - guide bubble after BG
   - wrong-answer feedback
   - success/unlocked state
3. Send screenshots to a separate agent instructed to review as a 9-year-old boy:
   - is it exciting?
   - is the hero cool?
   - does the guide bubble feel like part of the game?
   - are answer buttons inviting?
   - are hotspots clear?
4. Apply the review comments carefully, especially about chat bubble visual style.
5. Retest and capture final screenshots.

## Done Definition

- Phaser POC runs at `http://localhost:8000/phaser.html`.
- Hero walks to clicked locations and hotspots.
- Hotspots teach vocabulary after the hero arrives.
- Guide dialogue opens in a native in-game bubble.
- `BG` translation works inside the bubble.
- Wrong answer shows Bulgarian feedback.
- Correct answer unlocks the jungle exit.
- Separate-agent review has been considered and fixes applied.
- Browser validation passes with no app errors.

---

# Sprite Upgrade Pass: Hero And Guide Acting Naturally

## Goal
Replace temporary vector people with real Phaser sprite-sheet characters that can be animated, reviewed, and validated for smooth movement.

## Scope

- Painted hero sprite sheet extracted from the original concept character sheet, with:
  - front walk cycle
  - back walk cycle
  - side walk cycle
  - front/back/side idle poses
  - separate painted portrait expressions for object-looking feedback
- Painted guide sprite sheet matching the original concept-art direction, with:
  - idle breathing loop
  - talking loop
  - pointing/gesture loop
- Phaser movement logic chooses hero facing from walk direction:
  - down/front when walking toward camera
  - up/back when walking away
  - side when moving left/right
- Looking at camp objects shows a painted Alex portrait expression inside the vocabulary bubble.
- Talking to the guide triggers guide talk animation.

## Validation

- Extract painted hero sprites from the original concept sheet with `tools/extract_painted_sprites.py`.
- Use the generated painted guide concept sheet as the guide source.
- Validate frame registration with `tools/validate_character_sprites.py`.
- Browser-test the live Phaser scene:
  - side walk
  - back walk
  - front walk
  - object-look expressions
  - guide talk animation
  - existing dialogue and Bulgarian translation flow
- Capture screenshots for independent reviewer feedback.

---

# Object Quiz Retrieval Increment

## Goal
Make camp object retrieval earned instead of automatic. Looking at an object starts a short learning challenge, and the object is added to inventory only after the player answers all object questions correctly.

## Scope

- Each camp object has a 3-question mini quiz.
- Questions test a mix of:
  - spelling
  - articles/plurals
  - sentence order
  - present simple / present continuous syntax
- Wrong answers show Bulgarian feedback inside the same native parchment dialogue panel.
- Correct answers advance to the next object question.
- Completing all 3 questions retrieves the object and adds it to inventory.
- Retrieved object highlights change from yellow to green with a check mark.
- The guide now has its own blue highlight circle so he reads as an interactable character.
- The guide’s jungle-unlock dialogue still requires rope, backpack, and map to be retrieved.

## Validation

- Browser-test the full object flow:
  - wrong answer does not retrieve the item
  - 3 correct answers retrieve the item
  - highlight color changes after retrieval
  - all 3 objects are required before guide progress
  - guide highlight is visible

---

# Adventure POC Phase: Walkable Point-and-Click Slice

## Goal
Build a playable vertical slice that feels closer to classic LucasArts adventure games such as **Indiana Jones and the Fate of Atlantis**: a hero character appears in the world, the player clicks where to walk, the hero visits different locations, and conversations happen with characters inside the scene.

For legal and creative safety, the actual character should be an original young explorer rather than a direct Indiana Jones copy. The feeling can be inspired by pulpy archaeology adventure: hat, satchel, ruins, jungle, mystery, and dialogue.

## What This Phase Adds
This phase adds a new engine layer above the current POC:

- A visible player sprite.
- Click-to-walk movement inside a defined walkable area.
- Scene exits that the hero walks to before changing scene.
- NPCs that the hero walks toward before dialogue opens.
- Hotspots that can be inspected or collected after the hero reaches them.
- At least 2 connected scenes so the player can actually visit places.
- A lower adventure command/status line, for example: `Walk to guide`, `Look at map`, `Talk to guide`.

## Proposed Adventure POC
Create a small 3-location slice from **Secrets of the Sun Temple**:

### Scene 1: Base Camp
Purpose: safe hub and tutorial.

- Player starts near the tent.
- Visible NPC: local guide.
- Hotspots: backpack, rope, map.
- Exit: jungle path on the right side of the scene.
- The guide blocks the exit until the player learns the words and answers one grammar question.

### Scene 2: Jungle Path
Purpose: prove travel and exploration.

- Player enters from the left.
- Hotspot: old explorer journal page.
- NPC or animal: panther sleeping near a path.
- Exit back to camp.
- Exit forward to temple gate, initially blocked by the panther.
- Grammar puzzle: Present Simple habit question about the panther:
  - `The panther sleeps during the day.`
  - Wrong answer can explain in Bulgarian why Present Continuous is not right for habits.

### Scene 3: Temple Gate
Purpose: prove destination payoff.

- Player enters from the jungle path.
- Hotspot: carved sun symbol.
- NPC: guide can appear beside the player or speak by radio.
- Puzzle: simple reading/grammar check to identify the sun symbol.
- End state: `You reached the Sun Temple gate.`

## Adventure Engine Systems

### 1. Player Character System
Add a `PlayerController`:

- Tracks `sceneId`, `x`, `y`, `facing`, `isWalking`, and `target`.
- Renders a player sprite inside the scene.
- Moves toward clicked points with smooth animation.
- Flips the sprite left/right based on movement direction.
- Stops when it reaches the target.

POC sprite can be CSS/SVG placeholder first:

- hat
- jacket/shirt
- satchel
- simple walking bob animation

Final art can come later.

### 1A. Hero Sprite Direction
The hero must feel like the main character of a classic archaeology adventure, not a generic marker.

Do **not** make a direct Indiana Jones copy or use the name/likeness as an asset. Instead, create an original child-friendly pulp explorer with recognizable adventure cues:

- wide-brim explorer hat
- tan/brown jacket or shirt
- satchel strap across the body
- dark boots
- expressive walking pose
- warm, brave, curious personality

The silhouette can evoke the archaeology-adventure genre, but the face, colors, proportions, and costume details should be original.

For the first animated POC, use either:

- a simple SVG/CSS character assembled from shapes, animated with code; or
- a small sprite sheet generated as original art and placed in `assets/hero/`.

Minimum animation states:

- `idle_down`
- `idle_left`
- `idle_right`
- `walk_left`
- `walk_right`
- optional: `walk_up`, `walk_down`

POC implementation can start with a 2-frame or 4-frame walk cycle:

```json
"player_sprite": {
  "image": "assets/hero/explorer-spritesheet.png",
  "frame_width": 64,
  "frame_height": 96,
  "animations": {
    "idle_down": [0],
    "walk_right": [1, 2, 3, 2],
    "walk_left": [4, 5, 6, 5]
  }
}
```

If a real sprite sheet is not ready, the engine should still support the same animation API while rendering a temporary CSS/SVG explorer. That way the POC proves movement now and can swap in better art later.

### 2. Walkable Area
Each scene JSON should define a walkable polygon or rectangle:

```json
"walkable_area": [
  { "x": 40, "y": 430 },
  { "x": 760, "y": 390 },
  { "x": 760, "y": 560 },
  { "x": 40, "y": 560 }
]
```

For the POC, use a simple polygon hit-test:

- If the player clicks inside the walkable area, walk there.
- If the player clicks outside it, ignore the click or walk to the nearest valid edge.

### 3. Depth and Scale
To make the scene feel less flat:

- Player and NPCs get larger lower on the screen.
- Player and NPC `z-index` depends on `y` position.
- Hotspots remain clickable but do not float like UI buttons.

POC version can use:

```js
scale = 0.75 + (playerY / 600) * 0.35
zIndex = Math.round(playerY)
```

### 4. Interaction Model
Replace immediate click actions with adventure-style actions:

- Click ground: player walks there.
- Click NPC: command line says `Talk to guide`; player walks to the NPC; dialogue opens after arrival.
- Click item: command line says `Look at rope` or `Pick up rope`; player walks to the item; vocabulary popup opens after arrival.
- Click exit: command line says `Walk to jungle path`; player walks to exit; scene changes after arrival.

This is the key difference from the first POC. The scene should feel inhabited, not like clicking UI markers.

### 5. Scene Exits and Travel
Extend JSON interactables with exits:

```json
{
  "id": "exit_jungle_path",
  "type": "exit",
  "label": "jungle path",
  "x_pos": 735,
  "y_pos": 430,
  "walk_to": { "x": 700, "y": 455 },
  "target_scene": "jungle_path",
  "target_spawn": "from_camp",
  "requires_flag": "jungle_path_open",
  "locked_text": "The guide says we should prepare first."
}
```

Each destination scene should define spawn points:

```json
"spawn_points": {
  "from_camp": { "x": 90, "y": 470 },
  "from_temple": { "x": 700, "y": 455 }
}
```

### 6. Dialogue Placement
Dialogue should still use the bottom dialogue box, but it should open only after the player reaches the NPC.

Dialogue JSON stays mostly the same. The interaction timing changes:

1. click NPC
2. hero walks to `walk_to`
3. hero faces NPC
4. dialogue opens

### 7. Educational Integration
The learning mechanics should become part of exploration:

- Vocabulary is discovered by inspecting world objects.
- Grammar checks are used to unlock paths or solve puzzles.
- Bulgarian feedback appears as sidekick/helper guidance, not just an error box.
- The adventure should never feel like a quiz screen pasted on top of a background.

## New JSON Shape
The adventure POC should move toward this schema:

```json
{
  "scenario_name": "Secrets of the Sun Temple",
  "start_scene": "camp",
  "player": {
    "start_scene": "camp",
    "start_spawn": "start"
  },
  "scenes": {
    "camp": {
      "background_image": "assets/camp.svg",
      "walkable_area": [],
      "spawn_points": {},
      "characters": [],
      "hotspots": [],
      "exits": []
    }
  },
  "dialogues": {}
}
```

Prefer separating:

- `characters` for NPCs
- `hotspots` for objects/items/vocabulary
- `exits` for travel

This will be cleaner than using one generic `interactables` list forever.

## POC Done Definition
This phase is ready for review when:

- The player sees a visible explorer sprite in the camp.
- Clicking ground makes the explorer walk there.
- Clicking the guide makes the explorer walk to him before dialogue starts.
- Clicking objects makes the explorer walk to them before vocabulary opens.
- The player can move from camp to jungle path through an exit.
- At least one exit is blocked until a grammar/vocabulary condition is met.
- The player can reach a second or third scene, not just stay in one static screen.
- The UI has an adventure command/status line.
- The old vocabulary and Bulgarian feedback loops still work.
- Browser validation confirms movement, dialogue, exit transition, blocked exit, unlocked exit, and mobile layout.

## Browser Test Checklist
Before handoff:

- Start local server.
- Open game in browser.
- Confirm scenario JSON loads with no console errors.
- Click ground in several places:
  - player walks smoothly
  - player does not leave the walkable area
  - player scale/depth feels acceptable
- Click guide:
  - command line updates
  - player walks to guide
  - dialogue opens only after arrival
- Click vocabulary item:
  - player walks to item
  - word is learned only after arrival
  - journal updates without duplicates
- Try jungle exit before unlock:
  - player walks to exit
  - blocked message appears
  - scene does not change
- Complete guide puzzle:
  - Bulgarian feedback appears on wrong answer
  - correct answer unlocks exit
- Click jungle exit after unlock:
  - player walks to exit
  - scene changes
  - player appears at the correct spawn point
- Repeat a basic layout check on narrow/mobile viewport.

## Implementation Order

1. Refactor scenario JSON into `characters`, `hotspots`, `exits`, `walkable_area`, and `spawn_points`.
2. Add player sprite rendering.
3. Add click-to-walk movement and animation loop.
4. Add command/status line.
5. Change object/NPC clicks into queued actions:
   - walk first
   - interact after arrival
6. Add scene exits and spawn points.
7. Add a second scene: `jungle_path`.
8. Add the blocked/unlocked exit rule.
9. Add optional third scene: `temple_gate`.
10. Validate in browser and visually review screenshots.

---

## Goal
Build a small but real proof of concept using the existing Phase 1 engine shell. The POC should prove that the game can load scenario content from data, render one scene, teach a few vocabulary words, run one dialogue-based grammar puzzle, and show Bulgarian feedback for wrong answers.

This POC is intentionally narrow: one scene, one NPC, a few interactables, and one short learning loop. It should feel playable enough to review, but not try to become the full 10-hour adventure yet.

## Proposed Scene
Use the opening camp from **Secrets of the Sun Temple**:

**Scene name:** Base Camp After the Storm  
**Player fantasy:** A young explorer arrives at a jungle camp after a storm. Gear is scattered around the camp, and the local guide will only open the jungle path after the player learns the key equipment words and answers one grammar question.

## POC Scope

### 1. Scenario Data File
Create a new external scenario file:

`scenarios/sun-temple-poc.json`

It should contain:

- Scenario metadata: title, start scene, short description.
- One scene: `camp`.
- Scene background path.
- 3 vocabulary interactables:
  - `backpack` / `раница`
  - `rope` / `въже`
  - `map` / `карта`
- 1 dialogue interactable:
  - `guide`
- One dialogue tree with:
  - A first check requiring the player to know the camp items.
  - A grammar choice testing **Present Continuous**.
  - At least one wrong answer with Bulgarian feedback.
  - One correct answer that unlocks a simple success state.

### 2. Engine Work
Implement only the engine pieces needed for this one scene:

- Load the JSON scenario file from `main.js`.
- Add a `SceneManager` that reads `scenes[currentScene]`.
- Render the scene background from scenario data.
- Render interactables from scenario data as positioned clickable elements.
- Route clicks by interactable type:
  - `vocabulary`
  - `dialogue`
- Keep the existing `StateManager`, but extend it only if needed for:
  - learned words
  - flags such as `guide_intro_complete`

### 3. Vocabulary Loop
When the player clicks a vocabulary item:

- Show a small vocabulary popup/card with the English word and Bulgarian translation.
- Add the word to `learnedWords`.
- Visually mark the item as learned, for example dim it or add a check marker.
- Make the Vocabulary Journal button open a modal listing learned words.

This proves the scouting mechanic without needing a full inventory system yet.

### 4. Dialogue and Grammar Loop
When the player clicks the guide:

- Open the existing dialogue box.
- Show NPC text and answer buttons from the JSON.
- If the player picks a wrong answer:
  - keep the dialogue open
  - show the Bulgarian feedback text
  - visually mark the chosen answer as wrong
- If the player picks the correct answer:
  - progress to the next node or close the dialogue
  - set a success flag
  - show a short completion message such as: `The jungle path is open.`

The first grammar puzzle should be simple and obvious from the scene, for example:

NPC: `Look at the guide. What is he doing now?`  
Wrong: `He looks at the map.`  
Feedback: `Това звучи като навик. Когато действието се случва точно сега, използваме am/is/are + -ing.`  
Correct: `He is looking at the map.`

### 5. Visual Assets for POC
Use simple local assets first, not final art:

- Keep or replace `assets/placeholder-scene.svg` as the camp background.
- Add simple CSS-styled interactable markers, or small SVG placeholders, for:
  - backpack
  - rope
  - map
  - guide

Do not block the POC on polished image generation. The purpose is to review the flow and engine behavior first.

### 6. Review Criteria Before Handoff
Before giving the POC for review, perform a critical self-review against these questions:

- Does the POC prove the data-driven engine idea, or is too much content hard-coded?
- Can a second scene be added later mostly by editing JSON?
- Is the learning loop clear for a 9-year-old?
- Are the Bulgarian feedback messages helpful and specific?
- Are clickable objects discoverable without cluttering the screen?
- Does the UI work at desktop and smaller viewport sizes?
- Does the journal show only learned words and avoid duplicates?
- Are wrong answers recoverable without restarting the dialogue?

### 7. Browser Test Checklist
Run the POC through a local browser before handoff:

- Start a local server, because JSON `fetch()` will not reliably work from `file://`.
- Open the game in browser.
- Confirm the scenario JSON loads without console errors.
- Confirm the camp background renders.
- Click each vocabulary item and verify:
  - popup appears
  - word is added to journal
  - duplicate clicks do not duplicate journal entries
- Open and close the journal.
- Click the guide and verify:
  - dialogue opens
  - wrong answer shows Bulgarian feedback
  - correct answer completes the scene goal
- Test at desktop size and a narrow/mobile-ish width.
- Fix any overlap, unreadable text, or broken click target before review.

### 8. Done Definition
The POC is ready for your review when:

- The game starts directly in the one camp scene.
- All content for that scene comes from `scenarios/sun-temple-poc.json`.
- The player can learn at least 3 words.
- The player can answer 1 grammar puzzle with Bulgarian feedback for mistakes.
- The browser test checklist passes.
- Any known limitations are listed clearly before handoff.

---

### 📋 Копирайте текста по-долу и го дайте на Codex:

```markdown
# Project Overview: Educational Point-and-Click Adventure Game Engine

## Context
Build a web-based (HTML/CSS/Vanilla JS) 2D point-and-click adventure game engine. The game is designed for a 9-year-old boy to practice English grammar (Present Simple, Present Continuous, Possessive 's) and reading comprehension. 
The engine must be completely data-driven. The core logic (Engine) must be separate from the content (Scenarios). Content will be loaded via external JSON files.

## Core Architectural Pillars
1. **Tech Stack:** HTML5, CSS3, Vanilla JavaScript (ES6+). No external frameworks (like React or Vue) to keep it lightweight and easy to run locally in a browser.
2. **State Management:** A global state object to track inventory, current location, unlocked flags, and learned vocabulary.
3. **Data-Driven Design:** A JSON parser that builds scenes, dialogue trees, and puzzles based on a predefined schema.
4. **Smart Feedback System:** A validation engine that checks grammar answers and provides specific error messages in Bulgarian based on the exact grammatical mistake made.

---

## JSON Schema Structure (Draft)
The engine should expect JSON data structured like this for each scenario:

```json
{
  "scenario_name": "Secrets of the Sun Temple",
  "scenes": {
    "camp": {
      "background_image": "camp_bg.jpg",
      "interactables": [
        {
          "id": "item_rope",
          "type": "vocabulary",
          "english_word": "rope",
          "bulgarian_translation": "въже",
          "x_pos": 150,
          "y_pos": 300,
          "image": "rope_sprite.png"
        },
        {
          "id": "npc_guide",
          "type": "dialogue",
          "x_pos": 400,
          "y_pos": 250,
          "dialogue_tree": "guide_intro_tree"
        }
      ]
    }
  },
  "dialogues": {
    "guide_intro_tree": {
      "start_node": "node_1",
      "nodes": {
        "node_1": {
          "npc_text": "What is the panther doing right now?",
          "options": [
            {
              "text": "It sleeps.",
              "is_correct": false,
              "error_type": "PRESENT_CONT_MISSING_ING",
              "feedback_bg": "Пантерата прави това точно в момента! Трябва да използваш -ing. Опитай пак!"
            },
            {
              "text": "It is sleeping.",
              "is_correct": true,
              "next_node": "node_2",
              "action": "unlock_path_jungle"
            }
          ]
        }
      }
    }
  }
}

```

## Implementation Tasks (Phase 1 to 5)

Please implement the engine step-by-step according to the following tasks. Wait for my confirmation after completing each phase before moving to the next.

### Phase 1: Core Layout & Game Loop Setup

1. Setup the basic `index.html`, `style.css`, and `main.js` files.
2. Create the main game container (e.g., 800x600 resolution, scalable).
3. Divide the UI into three main layers:
* **Background Layer:** For rendering the current scene's background image.
* **Interactable Layer:** For rendering clickable sprites (items, NPCs).
* **UI Overlay Layer:** For rendering the Inventory bar, the "Vocabulary Journal" button, and the Dialogue Box.


4. Implement a basic State Manager class to handle `currentScene`, `inventory[]`, and `learnedWords[]`.

### Phase 2: JSON Parsing & Scene Rendering

1. Create a function to fetch and parse a dummy JSON scenario file.
2. Implement a `SceneManager` that reads the `scenes` object from the JSON.
3. When a scene loads, update the background image and dynamically spawn clickable `div` elements for all `interactables` based on their `x_pos` and `y_pos`.

### Phase 3: The Vocabulary "Scouting" System

1. Implement the logic for `type: "vocabulary"` interactables.
2. When the player clicks a vocabulary item on the screen:
* Show a styled popup card displaying the `english_word` and `bulgarian_translation`.
* Add the word to the global `learnedWords` array (State Manager).
* Remove or visually alter the item in the scene so the player knows it has been collected/learned.


3. Build the "Vocabulary Journal" UI module: A modal that displays all collected words when the player clicks a UI button.

### Phase 4: Dialogue System & Grammar Puzzles

1. Implement the logic for `type: "dialogue"` interactables.
2. When clicked, pause background interaction and open a Dialogue UI Box at the bottom of the screen.
3. Build a `DialogueManager` that traverses the `dialogue_tree`.
4. Render the `npc_text` and spawn buttons for each option in the `options` array.
5. If the user clicks an option where `is_correct` is `true`:
* Execute any attached `action` (e.g., add item to inventory, unlock a flag).
* Progress to the `next_node` or close the dialogue.



### Phase 5: Smart Feedback Module (Bulgarian)

1. Hook into the incorrect choices in the `DialogueManager`.
2. If the user clicks an option where `is_correct` is `false`:
* Prevent moving to the next node.
* Trigger an error animation (e.g., screen shake or red flash on the button).
* Display a specific helper modal character (a "Sidekick") that prints the `feedback_bg` string (the Bulgarian explanation of the grammar mistake).
* Allow the user to close the error modal and try selecting an option again.



```

```
