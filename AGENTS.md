# Agent Notes

This repo is an English-learning adventure game prototype for kids. The current primary experience is the Phaser 3 point-and-click POC in `phaser.html` / `phaser-game.js`, not the older DOM prototype in `index.html` / `main.js`.

The learning scope is defined in `curriculum-scope.md`

## Current Game

- Theme: kid-friendly jungle camp adventure with vocabulary and grammar challenges.
- Main scene: painted campsite background, hero, guide, item hotspots, and jungle exit.
- Player flow:
  - Click ground to walk.
  - Click camp items (`rope`, `backpack`, `map`) to walk to them and start item challenge dialogs.
  - Complete all item challenges to retrieve gear.
  - Talk to the guide near the table to unlock the jungle path.
- Dialog behavior:
  - Item challenge dialogs are native Phaser parchment bubbles.
  - Item challenge dialogs have a top-right close button so the child can leave before answering.
  - There is no global `BG` translation button.
  - Hovering English words for 3 seconds shows a Bulgarian translation in a solid parchment balloon.
  - Translation progress bars are based on the original English word width.
  - Wrong answers show a warm parchment hint strip, not a red error box.

## Important Files

- `phaser-game.js`: primary game logic, Phaser scene, character movement, item quizzes, guide dialogue, speech bubble rendering, translation reveal, and UI controls.
- `phaser.html`: Phaser entry page. Keep JS/CSS query strings in sync with `ASSET_VERSION` when cache-busting visual/game changes.
- `phaser-style.css`: page shell and bundled font declarations.
- `assets/phaser/`: painted background and character sprite sheets.
- `assets/fonts/`: bundled Merienda font files used by Phaser text.
- `scenarios/sun-temple-poc.json`: older scenario data and guide tree source data.
- `tools/browser-smoke-test.mjs`: Playwright smoke test. It starts a local server, opens `phaser.html`, verifies dialogue UX and movement, and writes screenshots.
- `tools/validate_character_sprites.py`: sprite-sheet sanity checks.
- `TESTING.md`: short test command reference.
- `index.html`, `main.js`, `style.css`: older DOM prototype. Do not assume screenshots or recent UX requests apply here unless the user explicitly asks.

## Run And Test

Install dependencies if needed:

```sh
npm install
```

Run the game locally:

```sh
npm run serve
```

Open:

```text
http://localhost:9231/phaser.html
```

Run full validation:

```sh
npm test
```

That runs:

- `npm run test:assets`: validates sprite metrics and checks `phaser-game.js` syntax.
- `npm run test:browser`: runs the live Phaser smoke test in Chrome.

Useful browser-test variants:

```sh
npm run test:browser
HEADLESS=false npm run test:browser
BROWSER_CHANNEL=chrome npm run test:browser
```

Smoke-test screenshots are written to:

```text
test-results/browser-smoke/
```

Key screenshots to inspect after UI changes:

- `initial.png`: scene composition and guide position.
- `dialogue-rope.png`: item challenge dialog and close button.
- `dialogue-word-revealed.png`: hover translation balloon.
- `dialogue-feedback.png`: wrong-answer hint strip.

## Current UI Expectations

- The guide should stand beside the camp table on the ground, not in the bushes.
- Item challenge dialogs must be dismissible without completing the challenge.
- Answer buttons should have full-surface hover/click hit plates.
- Bulgarian translations should not replace or obscure English text directly; use solid translation balloons.
- Keep the UI adventurous and readable for children. Avoid plain web-form styling.
- Prefer testing visual/UI changes with `npm run test:browser` and inspect screenshots.

## Implementation Notes

- Use `apply_patch` for manual edits.
- Keep changes scoped to the Phaser path unless the request explicitly targets the DOM prototype.
- When adding or changing assets referenced by the Phaser page, update cache keys:
  - `ASSET_VERSION` in `phaser-game.js`
  - query strings in `phaser.html`
- Phaser starts after `document.fonts.ready` so bundled fonts measure correctly.
- The browser smoke test has guards for:
  - guide placement near the table
  - item challenge close button
  - no `BG` chip
  - word translation coverage
  - reveal bar width based on English word
  - hover reveal reset
  - feedback strip bounds and style
  - side/up/down hero walk animation
