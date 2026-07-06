# James Bond Level 04 Design: Guard Animal Trail

## Premise

After the Level 03 village support loop returns through the map room, Agent Alex follows the final report to a jungle trail outside the villain's quiet base. A trained guard tiger protects the gate, but the mission is observational and child-friendly: Alex must read a nature report, learn the animal's habits, and choose the calm time to pass.

The level is a spy adventure wrapper for the curriculum stage "Animal Trail": simple present with `he/she/it`, `doesn't`, and `Does it...?`, plus animal, action, and time-of-day vocabulary.

## Curriculum Focus

- New grammar:
  - `It sleeps in the morning.`
  - `It walks at night.`
  - `It doesn't eat fruit.`
  - `Does it hide during the day?`
  - `Yes, it does.`
- Review pocket:
  - `There is a camera behind the rock.`
- Vocabulary:
  - animal, tiger, snake, habitat, meat, fruit, sleep, walk, hide, eat, morning, night, day, trail, gate, report, camera
- Exercise mix:
  - Vocabulary recognition
  - Grammar gap-fill
  - Sentence choice
  - True/false reading comprehension

## Characters

- Agent Alex: the child-friendly junior spy.
- Ranger Nadia: the local trail ranger who knows the guard animal's routine.
- Guard tiger: seen through tracks, report text, and camera clues. The tiger is not an enemy encounter; it is a calm animal with predictable habits.

## Goal

Open the quiet base gate by proving Alex understands the guard animal's habits.

## Puzzle Items

- `animal_report`: a short field report with the key reading fact: the tiger sleeps in the morning and walks at night.
- `meat_bowl`: a food clue teaching `It eats meat` and `It doesn't eat fruit`.
- `trail_camera`: a habitat camera clue that reviews `behind` and introduces `Does it hide...?`

## Puzzle Flow

1. Read the field board mission briefing.
2. Collect the animal report by answering vocabulary and sentence questions about the tiger's routine.
3. Collect the meat bowl clue by choosing `meat`, `doesn't`, and the correct food sentence.
4. Collect the trail camera clue by answering a `Does it...?` question about the snake hiding behind a rock.
5. Talk to Ranger Nadia. She checks the complete animal report:
   - `What does the tiger do in the morning?`
   - `Does it eat fruit?`
6. Ranger Nadia opens the quiet gate.
7. Use the quiet gate to complete Level 04 and mark missions 01-04 complete.

## Asset Direction

This draft runs with the existing painted campsite background and spy character assets, plus a small level-specific prop sheet for the report, meat bowl, and camera. A future art pass should replace the reused background with:

- a jungle trail base-gate background;
- prop sheet elements for a field report, meat bowl, trail camera, tiger tracks, and rock/snake clue;
- a friendly ranger/guide variant if the director sprite feels too formal.

## ECA Notes

- The Level 02 return/final-report step after the village support loop should set `level04.unlocked` and transition to `scenarios/james-bond-level-04-content.json`.
- Level 04 final puzzle should set `level04.complete` and `campaign.levels_01_02_03_04_complete`.
- No new runtime actions are needed. Use `puzzle.complete`, `inventory.add`, `ui.vocab.show`, `flag.set`, `exit.refresh`, `dialog.show`, and `campaign.complete`.

## Reviewer Checklist

- Curriculum coverage includes third-person `-s`, `doesn't`, and `Does it...?`.
- The reading artifact is short enough for a child and directly needed for the guide gate.
- The guard animal is not scary or violent; the "hunt" vocabulary is avoided in required answers.
- Every required collectible has Bulgarian intro and quiz support.
- The exit is locked until Ranger Nadia's guide check completes.
