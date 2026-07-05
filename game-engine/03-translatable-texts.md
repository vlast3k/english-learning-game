# 03. Translatable Texts

Dialog body text is expected to be word-translatable.

## What Changed

The hover translation feature existed already: `phaser-game.js` splits speech-bubble body text into individual word objects, gives translated words a progress bar, and shows a solid parchment translation balloon after hover.

The missing piece was content coverage. A scenario could introduce new English words without adding Bulgarian translations, so those words still appeared visually but did not reveal anything on hover.

`tools/validate-game-content.mjs` now checks translation coverage for every scenario file.

## What Is Translatable

The validator checks the English text fields that are rendered through `createRevealTextFlow`:

- collectible intro text: `hotspots[].intro.text`
- view-only scenery text: `hotspots[].description.text`
- quiz prompt text: `quizzes[*][].text`
- guide/director locked text: `guide.locked_text`
- guide/director dialogue text: `guide.dialogue_tree.nodes.*.npc_text`
- exit locked text: `exit_marker.locked_text`

These are the parchment speech-bubble body texts where individual English words can be hovered.

## What Is Not Yet Translatable

Answer button labels are not checked by this feature because they are currently rendered as plain button text, not reveal-flow word objects.

Examples:

- quiz answer choices
- collectible translation choice buttons
- "OK"
- close button symbols

If answer buttons become hover-translatable later, the validator should include `options[].text` as well.

## Translation Lookup

At runtime, lookup works in this order:

1. Scenario translations from `content.translations`
2. Built-in fallback translations in `phaser-game.js`

Tokens are normalized the same way in the validator and runtime:

- lowercase
- remove punctuation at the start/end
- keep inner apostrophes, such as `director's`

That means a scenario can provide explicit entries for plural or possessive words:

```json
{
  "agent": "агент",
  "agents": "агенти",
  "director's": "на директора"
}
```

## Validation

Run:

```sh
npm run test:content
```

The validator scans every `*-content.json` file and fails if a reveal-flow English token is missing from both the scenario dictionary and the built-in fallback dictionary.

This prevents issues like a sentence showing `shows`, `agents`, or `suspects` without hover translations.
