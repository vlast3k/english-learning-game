# Production Notes

## Level Goal

Level 01 introduces `be` and identity questions through a headquarters briefing:

- "I am..."
- "He is..."
- "She is..."
- "Are they...?"
- "Who is this?"
- "What is it?"

The visual target is spy-adventure flavor for kids, not a literal branded James Bond scene. Avoid real franchise marks, actor likenesses, alcohol, and weapons.

## Phaser Integration Checklist

When turning generated images into live game assets:

1. Keep the new level assets separate from `assets/phaser/` until the scene is wired.
2. Extract or crop generated source panels into game-ready PNGs.
3. If replacing Phaser-loaded assets, update:
   - `ASSET_VERSION` in `phaser-game.js`
   - query strings in `phaser.html` / `phaser-content.js` as relevant
4. Run `npm test`.
5. Inspect smoke-test screenshots, especially character feet and click target placement.

## Hero Sprite Layout Reminder

The current painted hero sheet is:

| Rows | Frames | Current use |
| --- | --- | --- |
| 1 | `0-7` | Walk down source frames, currently not played by Phaser animations |
| 2 | `8-15` | Walk up source frames, currently not played by Phaser animations |
| 3 | `16-23` | Side walk cycle, currently played for down/up/side movement |
| 4 | `24-31` | Front idle/expression frames |
| 5 | `32-39` | Back idle frames |
| 6 | `40-47` | Side idle/expression frames |

`tools/build_walk_cycle.py` rebuilds row 3 from frame `40`. For a new spy hero, frame `40` is the most important source pose for clean feet and hand movement.

## Spy Hero Natural Walk Output

The generated source panel's bottom walk row had nearly identical leg and hand poses. For a more natural first pass, use:

- Builder: `tools/build_spy_walk_cycle.py`
- Walk row: `generated/hero-spy-natural-walk-row.png`
- Full six-row sheet: `generated/hero-spy-natural-spritesheet.png`
- Animated preview: `generated/hero-spy-natural-walk-preview.gif`

This builder extracts the right-facing side idle pose from `generated/hero-spy-source-panel.png`, then renders eight side-walk frames with alternating leg swing, foot lift, and arm counter-swing.
