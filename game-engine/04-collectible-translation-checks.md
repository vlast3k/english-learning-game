# 04. Collectible Translation Checks

Collectible item intros now require a Bulgarian translation choice before the normal quiz starts.

## What Changed

When the hero reaches a collectible, the game still shows the English intro sentence in the parchment bubble. Instead of a single "Pick it up" button, the bubble shows three Bulgarian translations.

Only one translation is correct. A correct choice unlocks the existing item quiz flow. The item is still not collected until the player completes the quiz questions.

If the player chooses a wrong translation, the game closes the choices and shows a 3-second `Validating...` progress bar. After that penalty, the same translation choices appear again in a different order.

## Scenario Format

Each collectible hotspot needs `intro.translation_check`:

```json
{
  "intro": {
    "text": "A long rope is lying on the ground. It looks strong.",
    "bg": "Дълго въже лежи на земята. Изглежда здраво.",
    "translation_check": {
      "prompt": "Choose the Bulgarian translation before you pick it up.",
      "validating_text": "Validating...",
      "retry_text": "Read the English sentence once more.",
      "options": [
        { "text": "Дълго въже лежи на земята. Изглежда здраво.", "isCorrect": true },
        { "text": "Къса пръчка лежи до огъня. Изглежда топла." },
        { "text": "Дълга карта виси над масата. Изглежда стара." }
      ]
    }
  }
}
```

The correct option can match `intro.bg`, but the runtime checks `isCorrect`, not exact string equality.

## Runtime Behavior

The reusable Phaser scene tracks successful translation checks in `validatedItemTranslations`. This lets a child leave a quiz after passing the translation step and return directly to the quiz without repeating the translation gate.

The existing quiz mechanics are unchanged:

- quiz answer buttons stay in English
- quiz wrong-answer feedback remains the warm parchment hint strip
- item retrieval still happens only after the final quiz answer is correct

## Validation

`tools/validate-game-content.mjs` now checks every collectible in every `*-content.json` scenario:

- `intro.translation_check` exists
- `validating_text` is a non-empty string
- `options` contains exactly three choices
- exactly one choice has `isCorrect: true`
- every choice has non-empty Bulgarian text

The browser smoke test also exercises the camp rope flow and captures `dialogue-translation-validating.png`.
