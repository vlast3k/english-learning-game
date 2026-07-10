# Sun Temple Adventure Curriculum Ledger

This ledger checks the first vertical slice of `sun-temple-adventure` against `curriculum-scope.md`.

The goal is not to turn the slice into grammar exercises. The goal is to keep player-facing English inside the allowed grammar patterns, track which vocabulary is inside the curriculum, and flag adventure-critical words that may need approval or replacement.

Sources:

- `curriculum-scope.md`
- `scenarios/drafts/sun-temple-adventure-plot.md`
- `scenarios/drafts/sun-temple-adventure-world-map.md`
- `scenarios/drafts/sun-temple-adventure-dependency-graph.md`
- `scenarios/drafts/sun-temple-adventure-screen-prop-map.md`

The first-slice scenario JSON, mission rules, and art are now implemented. Use this ledger for language review only; do not use it to change hotspot coordinates or radii.

## Current Status

Status: implemented and reviewed in `sun-temple-adventure-slices-01-02-polish-review.md`.

Next language-design step: apply the same policy to the Temple Steps slice after its plot is approved.

## First-Slice Language Policy

Use short English lines based on allowed curriculum patterns:

- `This is a ...`
- `It is ...`
- `There is a ...`
- `The ... is under/on/next to/behind the ...`
- `I have a ...`
- `I need a ...`
- `Can you help?`
- `Use the ... on the ...`
- `Give the ... to ...`
- `The ... is open/safe.`

Imperative UI/action commands such as `Take`, `Use`, `Give`, `Look`, `Open`, and `Close` are acceptable only as short game commands, because they are common game UI and many command verbs are in the Cambridge/Blue Dot lists.

Avoid:

- long subordinate clauses;
- past tense;
- future tense;
- modal verbs other than `can/can't`;
- abstract exposition;
- complex conditionals;
- unreviewed adventure vocabulary in required comprehension text.

## Grammar Coverage In First Slice

The first slice should touch several grammar concepts naturally, but it does not need to cover everything.

| Grammar construct | First-slice use | Safe example lines | Status |
| --- | --- | --- | --- |
| `be` | descriptions of objects and places | `This is the Sun Compass.` `The bridge is not safe.` | allowed |
| `what/who/where` with `be` | Mira hints and optional inspect lines | `Where is the basket?` `What is this?` | allowed |
| `there is/there are` | map piece, lens, path descriptions | `There is a map piece under the branch.` | allowed |
| prepositions `in/on/under/next to/behind` | map piece and lens hiding | `The Green Lens is under the flower pot.` | allowed |
| simple present | NPC needs and object behavior | `Mira helps Alex.` `Lina needs her basket.` | allowed, use sparingly |
| `do/does` questions/negatives | optional hints only | `Do you have the rope?` | allowed, not required |
| `have/has` | inventory feedback | `I have a rope.` `The compass has five empty spots.` | allowed |
| possessive adjectives | NPC/item ownership | `This is her basket.` | allowed |
| possessive `'s` | Lina item ownership | `This is Lina's basket.` | allowed |
| `this/that/these/those` | object inspection | `This is a map piece.` | allowed |
| `can/can't` | blocked path feedback | `I can't cross here.` `Can you help?` | allowed |
| present continuous | not needed in slice one | `The map is opening.` only if UI needs it | optional, avoid unless useful |
| adverbs of frequency | not needed in slice one | none | defer |

## First-Slice Vocabulary Ledger

Status values:

- `in-scope`: appears in `curriculum-scope.md`.
- `adventure-critical`: not clearly in the curriculum, but needed for the adventure as currently designed.
- `replaceable`: can be swapped for a simpler in-scope word if we choose strict vocabulary.
- `proper-name`: character/object name, not a vocabulary target.

| Word/Phrase | Bulgarian | Appears as | Screen(s) | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Alex | Алекс | player name | all | proper-name | Listed as Cambridge name. |
| Mira | Мира | guide name | `base-camp-table` | proper-name | Simple name; not a target word. |
| Lina | Лина | NPC name | `village-garden` | proper-name | Simple name; not a target word. |
| sun | слънце | object/theme | camp, finale | in-scope | Cambridge Starters includes `sun`. |
| green | зелен | lens color | village, compass | in-scope | Cambridge Starters includes `green`. |
| seed | семе | Lina's basket reason | village | in-scope | Blue Dot Unit 17 includes `seed`. |
| flower | цвете | valley problem and hiding-place object | camp/village | in-scope | Cambridge Starters includes `flower`. |
| map | карта | item/UI | camp, map UI | adventure-critical | Mentioned in planning implications but not clearly target vocabulary. Keep with translation support unless replaced. |
| rope | въже | inventory item | supply tent, bridge | adventure-critical | Mentioned in `curriculum-scope.md` planning implication as `Lina's rope`, but not clearly in vocabulary list. Good adventure noun. |
| bridge | мост | use target/location | `broken-bridge` | adventure-critical | Very useful for adventure; not clearly in target list. |
| basket | кошница | NPC item | bridge, village | adventure-critical | Not clearly in target list. Could replace with `bag` if strict. |
| branch | клон | blocker | `camp-edge` | adventure-critical | Could replace with `plant` or `tree` if strict, but branch is clearer for gameplay. |
| pot | саксия / гърне | hiding-place object | `village-garden` | adventure-critical | `flower pot` may be easier as a phrase than `pot` alone. |
| table | маса | scenery/camp object | camp, village | in-scope | Cambridge Starters includes `table`. |
| path | пътека | exit/location | camp/jungle | adventure-critical | Not clearly in list; `road` is in scope but `path` is better for jungle. |
| jungle | джунгла | region/theme | `jungle-path` | adventure-critical | Not clearly in list; could use `forest` if strict. |
| village | село | region | village | in-scope | Blue Dot Unit 4. |
| garden | градина | region | village | in-scope | Blue Dot/Cambridge. |
| water | вода | scenery | bridge/village | in-scope | Blue Dot/Cambridge. |
| river | река | scenery/location | bridge | adventure-critical | Used in Bond Level 6 and adventure planning; not clearly in listed source excerpt. |
| compass | компас | central object | base camp | adventure-critical | Not in scope. Treat `Sun Compass` as a proper story object unless we rename. |
| lens | леща / кристал | progress item | village/compass | adventure-critical | Not in scope and may be hard for children. Consider `Green Glass` or `Green Stone`. |
| spot | място | compass slot | camp | in-scope? | `spots` appears in Unit 15 as animal spots; `empty spots` may be understandable but should be checked. |
| empty | празен | compass slots | camp | adventure-critical | Not clearly in list. Could use `no green lens here` instead. |
| safe | безопасен | bridge feedback | bridge | in-scope | Blue Dot Unit 5. |
| open | отворен / отварям | gate/UI | map/paths | in-scope | Cambridge Starters. |
| take | вземи | UI command | item interactions | in-scope | Blue Dot has `take photos`; Cambridge has `take a photo`. Command use acceptable. |
| use | използвай | UI command | inventory | in-scope | Blue Dot Unit 17 includes `use`. |
| give | дай | UI command/NPC | Lina | in-scope | Blue Dot/Cambridge. |
| help | помагам | NPC/dialogue | Mira/Lina | in-scope | Blue Dot/Cambridge. |

## Adventure-Critical Vocabulary Decision Needed

The adventure currently depends on several words that are not clearly formal vocabulary targets:

- `map`
- `rope`
- `bridge`
- `basket`
- `branch`
- `path`
- `jungle`
- `river`
- `compass`
- `lens`

Recommendation:

- Allow `map`, `rope`, `bridge`, `basket`, `branch`, `path`, `jungle`, and `river` as adventure nouns with Bulgarian translation support, because they are concrete, visually grounded, and necessary for adventure-game clarity.
- Treat `Sun Compass` as a proper story-object name, not a target word.
- Reconsider `lens`. `Green Lens` may be less child-friendly. Possible replacements:
  - `Green Stone`: more adventure-like, but `stone` is not clearly listed.
  - `Green Glass`: easier visually, but `glass` is not clearly listed as singular; `glasses` is in scope.
  - `Green Star`: fully in-scope (`green`, `star`) and visually clear, but changes the compass concept.
  - `Green Light`: both words are in scope and fits the sun theme.

The user approved keeping `Green Lens`. Do not rename it.

## Suggested First-Slice Text Lines

These are draft text lines for curriculum review only. They are not final scenario JSON.

### `base-camp-table`

| Situation | English | Bulgarian | Grammar notes |
| --- | --- | --- | --- |
| inspect compass | `This is the Sun Compass.` | `Това е Слънчевият компас.` | `This is`; `compass` adventure-critical |
| inspect compass after intro | `It has five empty spots.` | `Има пет празни места.` | `has`; `empty` adventure-critical |
| take map | `I have the torn map.` | `Имам скъсаната карта.` | `have`; `map` adventure-critical |
| map button unlock | `The map is open.` | `Картата е отворена.` | `be`; `open` in-scope |
| use Green Lens | `The Green Lens is in the compass.` | `Зелената леща е в компаса.` | preposition `in`; lens/compass adventure-critical |
| next marker reveal | `The cave is on the map.` | `Пещерата е на картата.` | `be`; `on`; cave adventure-critical |

### `camp-supply-tent`

| Situation | English | Bulgarian | Grammar notes |
| --- | --- | --- | --- |
| inspect rope | `This is a rope.` | `Това е въже.` | `This is`; rope adventure-critical |
| take rope | `I have a rope.` | `Имам въже.` | `have`; rope adventure-critical |
| inspect backpack | `This is a backpack.` | `Това е раница.` | `This is`; backpack familiar from current game |

### `camp-edge`

| Situation | English | Bulgarian | Grammar notes |
| --- | --- | --- | --- |
| inspect branch | `There is a map piece under the branch.` | `Има парче от карта под клона.` | `There is`; `under`; map/branch adventure-critical |
| move branch | `The branch is not on the map piece now.` | `Клонът вече не е върху парчето от карта.` | `be`; `on`; wording may need simplification |
| take map piece | `I have a map piece.` | `Имам парче от карта.` | `have` |
| combine map | `This is the valley map.` | `Това е картата на долината.` | `This is`; `valley` adventure-critical |

### `jungle-path`

| Situation | English | Bulgarian | Grammar notes |
| --- | --- | --- | --- |
| inspect marker | `The river path is here.` | `Пътеката към реката е тук.` | `be`; river/path adventure-critical |
| inspect sun stone | `This stone has a sun.` | `Този камък има слънце.` | `this`; `has`; stone adventure-critical; sun in-scope |
| exit forward | `Walk to the bridge.` | `Върви към моста.` | command; bridge adventure-critical |

### `broken-bridge`

| Situation | English | Bulgarian | Grammar notes |
| --- | --- | --- | --- |
| inspect bridge | `The bridge is not safe.` | `Мостът не е безопасен.` | `be` negative; safe in-scope |
| try bridge without rope | `I need a rope.` | `Трябва ми въже.` | simple need phrase; rope adventure-critical |
| use rope | `Use the rope on the bridge.` | `Използвай въжето на моста.` | command; `on` |
| repaired bridge | `The bridge is safe now.` | `Мостът вече е безопасен.` | `be`; safe |
| take basket | `I have Lina's basket.` | `Имам кошницата на Лина.` | possessive `'s`; basket adventure-critical |

### `village-garden`

| Situation | English | Bulgarian | Grammar notes |
| --- | --- | --- | --- |
| talk to Lina before basket | `Where is my basket?` | `Къде е моята кошница?` | `Where is`; possessive adjective |
| give basket | `This is Lina's basket.` | `Това е кошницата на Лина.` | possessive `'s` |
| Lina thanks Alex | `My seeds are here. Thank you.` | `Семената ми са тук. Благодаря.` | possessive adjective; seeds in-scope |
| Lina hint | `The Green Lens is under the flower pot.` | `Зелената леща е под саксията.` | `be`; `under`; lens/pot adventure-critical |
| inspect flower pot before hint | `There are flowers here.` | `Тук има цветя.` | `There are`; flowers in-scope |
| take Green Lens | `I have the Green Lens.` | `Имам Зелената леща.` | `have`; lens adventure-critical |

## Safer Rewrite Notes

Some draft lines may need simplification before JSON:

| Current line | Concern | Safer option |
| --- | --- | --- |
| `It has five empty spots.` | `empty` may be outside scope | `It has no green lens.` or use visual slots with minimal text |
| `The branch is not on the map piece now.` | awkward and longer | `The map piece is here.` |
| `This is the valley map.` | `valley` may be outside scope | `This is the map.` |
| `The Green Lens is under the flower pot.` | `lens` and `pot` outside scope | Keep if approved; otherwise rename lens/item |
| `My seeds are here. Thank you.` | `Thank you` is UI/social phrase, not grammar focus | Keep as natural dialogue |

## Coverage Gaps To Fill Later

The first slice naturally covers:

- `be`
- `there is/are`
- prepositions
- `have`
- possessive adjective / possessive `'s`
- simple object commands
- `where is`

Later regions should naturally cover:

- simple present habits;
- `do/does` questions;
- `can/can't`;
- present continuous;
- demonstratives;
- adverbs of frequency;
- broader vocabulary themes from `curriculum-scope.md`.

Do not force those into the first slice unless they serve the adventure.

## Locked Decisions From User Answers

- Adventure-critical words are allowed as non-target nouns with Bulgarian support.
- `Green Lens` remains named `Green Lens`.
- HUD map button is visible but disabled before the map is taken.
- Placing a lens removes it from inventory to keep inventory clean.

## Remaining Open Questions

- Are the draft first-slice English and Bulgarian lines acceptable as final text, or should they get a tighter line-by-line rewrite before JSON?

## Compaction Handoff

If context is compacted, read this file after the screen prop/NPC map, then read `sun-temple-adventure-asset-plan.md`. The first-slice curriculum ledger is drafted, and adventure-critical nouns outside the formal vocabulary are allowed with Bulgarian support. The next step is prompt files, not image generation. Do not create assets, scenario JSON, or mission JSON yet.
