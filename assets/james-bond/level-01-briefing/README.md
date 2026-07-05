# Level 01: Briefing at Headquarters

Kid-friendly spy adventure asset pack for the first mission in `james-bond-game.md`.

This folder is intentionally separate from the current jungle Phaser POC assets. It holds the prompts and generated concept images for a future MI6-style briefing level without replacing the existing campsite files.

## Sprite Notes

Current Phaser character expectations:

- Hero sheet: `1536x1320`, 8 columns x 6 rows, `192x220` per frame.
- Guide sheet: `768x660`, 4 columns x 3 rows, `192x220` per frame.
- `phaser-game.js` currently loads `assets/phaser/hero-painted-spritesheet.png`.
- `hero-walk-down`, `hero-walk-up`, and `hero-walk-side` all currently play frames `16-23`, which is row 3 of the hero sheet.
- `tools/build_walk_cycle.py` rebuilds frames `16-23` from idle-side frame `40`.
- The walk-cycle rig needs a clean side idle pose with two separable leg blobs below `HEM_Y = 161`.
- Important movement knobs are `SWING_DEG = 34.0` and `FOOT_LIFT = 15`.

Prompt implications:

- Ask for a clean right-facing side idle pose with separated legs and clear boots.
- Keep hands and arms visible and unobstructed so side-walk frames can imply natural counter-swing.
- Avoid long coats, capes, briefcases crossing the legs, deep shadows, or merged feet.
- Give the character shorts/trousers with a clear hem/hip separation line so the rig can cut and rotate legs cleanly.

## Prompt Files

- `prompts/briefing-room-background.md`: first-level headquarters backdrop.
- `prompts/hero-spy-source-panel.md`: source panel for extracting a Phaser-compatible hero spritesheet.
- `prompts/director-guide-source-panel.md`: source panel for the guide/director NPC spritesheet.
- `prompts/agent-dossier-pictures.md`: challenge pictures for identifying people and qualities.
- `prompts/interactive-props.md`: clickable level props for the first grammar/vocabulary tasks.

