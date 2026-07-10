# Sun Temple Adventure Slice 02 Curriculum Ledger

This ledger checks Waterfall Cave language against `curriculum-scope.md`.

The slice remains adventure-first. The player should solve through looking, taking, combining, using, and returning, not through answering grammar questions.

## Current Status

Status: implemented and reviewed in `sun-temple-adventure-slices-01-02-polish-review.md`.

## Language Policy

Use short lines:

- `This is a ...`
- `It is ...`
- `There is a ...`
- `The ... is in/on/under/near the ...`
- `I have a ...`
- `I need ...`
- `Use the ... on the ...`
- `The ... is open.`
- `The ... is light now.`

Avoid:

- past tense;
- future tense;
- long cave lore;
- words like `ancient`, `mechanism`, `reflect`, `illuminate` in player-facing text.

## Grammar Coverage

| Grammar construct | Slice-two use | Safe example |
| --- | --- | --- |
| `be` | cave and box states | `The cave is dark.` |
| `there is` | hidden key | `There is a key in the wall.` |
| prepositions | item placement and hiding | `The key is in the wall.` |
| `have/has` | item feedback | `I have an empty jar.` `The leaf has light.` |
| commands | inventory actions | `Use the key on the box.` |
| `need` phrase | blocked cave | `I need light.` |
| simple present | optional reminders | `The jar helps in the cave.` |
| `can/can't` | optional blocked-path line | `I can't see.` |

## Vocabulary Ledger

| Word/Phrase | Bulgarian | Appears as | Screen(s) | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| cave | пещера | place/target | waterfall, cave | adventure-critical | Already forward hook from slice one. |
| water | вода | scenery | waterfall | in-scope | Safe. |
| waterfall | водопад | region object | waterfall-mouth | adventure-critical | Concrete and visual. |
| dark | тъмно | cave state | waterfall-mouth | in-scope-ish | Common child word; use with translation. |
| light | светлина | state/item purpose | waterfall/cave | in-scope | Keep. |
| jar | буркан | combine part | keeper-hut | adventure-critical | Concrete, visually clear. |
| empty | празен | jar state | keeper-hut | adventure-critical | Keep; visible state supports meaning. |
| leaf | листо | combine part | waterfall-mouth | in-scope/adventure-critical | Concrete nature word. |
| glow | свети / светъл | item modifier | waterfall-mouth | adventure-critical | Could use `light leaf`; `glow leaf` is clearer game object. |
| key | ключ | item | dark-cave | in-scope | Common. |
| wall | стена | hiding place | dark-cave | in-scope | Common. |
| box | кутия | use target | dark-cave | in-scope | Common. |
| blue | син | lens color | dark-cave/base | in-scope | Safe. |
| lens | леща | progress item | cave/base | adventure-critical | User approved lens naming. |
| temple | храм | forward hook | map | adventure-critical | Use sparingly. |
| steps | стъпала | forward marker | map | in-scope-ish | Concrete. |

## Draft Text Lines

### Keeper Hut

| Situation | English | Bulgarian | Notes |
| --- | --- | --- | --- |
| take jar | `I have an empty jar.` | `Имам празен буркан.` | `have`; `empty/jar` supported visually |
| inspect shelf | `There is one jar here.` | `Тук има един буркан.` | prevents many-prop confusion |
| hint from Mira/Lina | `A jar can hold light.` | `Буркан може да държи светлина.` | warm setup; `can` |

### Waterfall Mouth

| Situation | English | Bulgarian | Notes |
| --- | --- | --- | --- |
| inspect entrance | `The cave is dark.` | `Пещерата е тъмна.` | state line |
| need light | `I need light.` | `Трябва ми светлина.` | simple need |
| take leaf | `This leaf has light.` | `Това листо има светлина.` | warmer and concrete |
| combine jar/leaf | `The jar holds the light.` | `Бурканът държи светлината.` | motivates `glow_jar`; story-object name can be in inventory |
| use glow jar | `The cave is light now.` | `Пещерата вече е светла.` | state change |

### Dark Cave

| Situation | English | Bulgarian | Notes |
| --- | --- | --- | --- |
| inspect wall | `There is a key in the wall.` | `Има ключ в стената.` | `there is`; preposition |
| take key | `I have a stone key.` | `Имам каменен ключ.` | `have`; stone adjective |
| inspect box | `The box is shut.` | `Кутията е затворена.` | simple state |
| use key | `The box needs this key.` | `Кутията има нужда от този ключ.` | warmer feedback |
| open box | `The box is open.` | `Кутията е отворена.` | state |
| lens reveal | `The Blue Lens is in the box.` | `Синята леща е в кутията.` | reward line |
| take lens | `I have the Blue Lens.` | `Имам Синята леща.` | progress item |

### Base Camp Return

| Situation | English | Bulgarian | Notes |
| --- | --- | --- | --- |
| place lens | `The Blue Lens is in the compass.` | `Синята леща е в компаса.` | preposition |
| reveal next marker | `The temple steps are on the map.` | `Стъпалата към храма са на картата.` | forward hook |

## Safer Rewrite Notes

| Current line | Concern | Safer option |
| --- | --- | --- |
| `The leaf has light.` | slightly unnatural | `This leaf has light.` |
| `This is a glow jar.` | `glow` not curriculum | Keep as story item with translation support. |
| `The temple steps are on the map.` | `temple` adventure-critical | Keep as forward hook; no comprehension test. |

## Coverage Added By Slice Two

Slice two naturally reinforces:

- `be`;
- `there is`;
- prepositions;
- `have/has`;
- commands;
- color adjective `blue`;
- concrete nouns for common adventure play.

Slice two still avoids:

- worksheet grammar questions;
- long exposition;
- hidden language prerequisites.
