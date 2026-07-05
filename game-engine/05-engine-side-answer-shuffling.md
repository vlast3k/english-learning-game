# 05. Engine-Side Answer Shuffling

Challenge answer order is now controlled by the Phaser engine, not by scenario JSON.

## What Changed

Item quiz options and guide/director challenge options are shuffled at runtime before buttons are rendered. Scenario authors can keep the correct answer first in the JSON for readability, but the child will not see that source order in the game.

The engine also prevents the correct answer from appearing in the first visible slot for these challenge dialogs. This removes the simple "always press the first button" shortcut.

## Runtime Behavior

`phaser-game.js` uses `getShuffledChallengeOptions()` when opening:

- collectible quiz questions
- guide/director dialogue challenge questions

The original option objects are preserved, so feedback, correctness flags, and follow-up actions still work exactly as before.

The Bulgarian translation gate has its own shuffle/retry behavior because it must reshuffle after a wrong translation penalty.

## Validation

The browser smoke test opens the rope challenge and fails if the first rendered answer is correct. It then chooses an incorrect answer by rendered button metadata, not by hardcoded button position.
