# Sun Temple Adventure Story Dialogue Ledger

This ledger is the content baseline for the creative-polish work. It records the dialogue and short feedback that the live Sun Temple Adventure currently emits, then separates approved future candidates from text that is not yet in the game.

Read with:

- `sun-temple-adventure-current-walkthrough.md` for the actual screen flow;
- `sun-temple-adventure-final-creative-design-proposal.md` for the intended creative direction;
- `sun-temple-adventure-creative-proposal-action-plan.md` for the order in which copy may be changed;
- `curriculum-scope.md` for language boundaries.

## Status And Scope

Status: Workstreams 0-2 are complete for the current three slices. The ledger now reflects live opening, clue, reaction, and Compass-map text. The box-keyhole candidate remains deferred because the current art does not visibly support it.

Current source of truth for live text:

```text
game-engine/missions/sun-temple-adventure-slice-01.json
scenarios/sun-temple-adventure-*-content.json
```

## Dialogue Kinds

Use these labels in later content changes.

| Kind | Meaning | Rule |
| --- | --- | --- |
| `required_clue` | Information needed to understand the next action | One concrete, visible idea. Must be Bulgarian-supported. |
| `state_reaction` | Confirms a meaningful player-caused change | Brief; do not repeat on routine state checks. |
| `map_compass_response` | Explains a lens placement or newly revealed route | Connect the change to the valley system without solving later mysteries. |
| `navigation_block` | Explains why a route is currently unavailable | State the immediate missing condition, not a future solution. |
| `fallback_hint` | Response to a wrong selected item | Warm, local, and actionable. |
| `optional_flavour` | Non-required observation that gives place or character texture | Must never contain the only puzzle clue. |
| `standing_npc` | Repeatable default line when no state-specific rule takes priority | Must not replace a more useful state response. |
| `ui_feedback` | Toast or command feedback | Keep short; add Bulgarian support when it conveys story or progression. |

## Review Rules

- Keep required lines inside short present-tense, concrete English.
- Adventure-critical nouns are allowed with Bulgarian support.
- A rule that fires once is preferred for discovery and completion reactions.
- Repeated lines should be either a current obstacle reminder or optional flavour.
- Do not add a proposed line until its trigger, `dialogue_kind`, English, Bulgarian, and curriculum status are recorded here.
- Do not use dialogue to compensate for an invisible prop, an unclear hotspot, or a missing state overlay.

## Live Text: Slice 1, Map And Village

| Rule / trigger | Speaker | Current English | Bulgarian | Kind | Repeat | Content review |
| --- | --- | --- | --- | --- | --- |
| `inspect-sun-compass` | Mira | `This is the Sun Compass. Five lenses are missing.` | `Това е Слънчевият компас. Липсват пет лещи.` | `required_clue` | repeatable | Live Workstream 1 revision. It establishes the Compass without explaining the later temple system. |
| `opening-sunlight-mystery` | Mira | `That flower faces the temple. Now it has no light.` | `Това цвете гледа към храма. Сега няма светлина.` | `required_clue` | once | Live Workstream 1 opening context. It does not block the torn map. |
| `inspect-sun-flower` | Alex | `This flower needs light.` | `Това цвете има нужда от светлина.` | `required_clue` | once | Live Workstream 1 inspection. The flower is already painted in Base Camp. |
| `talk-to-mira` and Mira default | Mira | `The Sun Compass needs five lenses.` | `Слънчевият компас има нужда от пет лещи.` | `standing_npc` | repeatable | Currently duplicates itself. Replace with state-aware Mira lines in Workstream 2. |
| `take-torn-map` | UI | `The map is open.` | missing | `ui_feedback` | once | Add Bulgarian support before changing this flow. |
| `take-rope` | Alex | `I have a rope.` | `Имам въже.` | `state_reaction` | once | Keep. Clear inventory confirmation. |
| `inspect-branch-first` | Alex | `A piece of paper is under the branch.` | `Има парче хартия под клона.` | `required_clue` | once | Live Workstream 2 revision. The paper is already visibly under the branch. |
| `move-branch` | Alex | `The map piece is here.` | `Парчето от карта е тук.` | `state_reaction` | once | Keep. Must pair with a visible moved-branch state. |
| `take-map-piece` | Alex | `I have a map piece.` | `Имам парче от карта.` | `state_reaction` | once | Keep. |
| `combine-valley-map` | UI | `This is the map.` | missing | `ui_feedback` | once | Add Bulgarian support. Optional replacement can name the completed map if curriculum-safe. |
| `inspect-path-marker` | Alex | `This path has a sun mark.` | `Тази пътека има слънчев знак.` | `optional_flavour` | repeatable | Live Workstream 2 route motif. |
| `inspect-far-basket` | Alex | `A basket is over there. Someone needs it.` | `Има кошница там. Някой има нужда от нея.` | `optional_flavour` | once | Live Workstream 2 observation; it gives the basket a human meaning before Lina appears. |
| `inspect-bridge-without-rope` | Alex | `The bridge is not safe. I need a rope.` | `Мостът не е безопасен. Трябва ми въже.` | `required_clue` | repeatable | Keep. Visible broken bridge supplies the first clue. |
| `repair-bridge` | Alex | `The bridge is safe now.` | `Мостът вече е безопасен.` | `state_reaction` | once | Keep. Tied-rope overlay carries most of the result. |
| `take-lost-basket` | Alex | `I have Lina's basket.` | `Имам кошницата на Лина.` | `state_reaction` | once | Keep. Add a prior basket observation in Workstream 2. |
| `talk-to-lina-before-basket` | Lina | `My seed basket is near the old bridge. I need it.` | `Моята кошница със семена е до стария мост. Имам нужда от нея.` | `required_clue` | repeatable | Live Workstream 2 revision. The direct link to the bridge and seeds makes the favour legible. |
| `give-basket-to-lina` | Lina | `My seeds are safe. Thank you.` | `Семената ми са в безопасност. Благодаря.` | `state_reaction` | once | Live Workstream 2 relationship payoff. |
| `talk-to-lina-after-basket` | Lina | `The Green Lens is under the flower pot.` | `Зелената леща е под саксията.` | `required_clue` | repeatable | Keep the direct clue. It must remain available until the lens is taken. |
| `inspect-flower-pot-before-hint` | Alex | `There are flowers here.` | `Тук има цветя.` | `optional_flavour` | repeatable | Keep short; it deliberately does not reveal the reward early. |
| `inspect-flower-pot-after-hint` | Alex | `The Green Lens is here.` | `Зелената леща е тук.` | `required_clue` | once | Keep. The visible lens overlay is the primary evidence. |
| `take-green-lens` | Alex | `I have the Green Lens.` | `Имам Зелената леща.` | `state_reaction` | once | Keep. |
| `place-green-lens` | Mira | `The lens shows an old water path.` | `Лещата показва стар път до водата.` | `map_compass_response` | once | Live Workstream 2 map response; it points toward water without solving the cave. |
| `exit-village-to-keeper-locked` | Alex | `I should help Lina first.` | `Първо трябва да помогна на Лина.` | `navigation_block` | repeatable | Keep. Direct and relationship-led. |
| `exit-edge-to-jungle-locked` | Alex | `I need the map.` | `Трябва ми картата.` | `navigation_block` | repeatable | Keep. |
| `exit-bridge-to-village-locked` | Alex | `The bridge is not safe.` | `Мостът не е безопасен.` | `navigation_block` | repeatable | Keep. |

## Live Text: Slice 2, Waterfall Cave

| Rule / trigger | Speaker | Current English | Bulgarian | Kind | Repeat | Content review |
| --- | --- | --- | --- | --- | --- |
| `talk-to-lina-after-green-lens` | Lina | `The hut has a jar. Waterfall leaves glow at night.` | `В колибата има буркан. Листата край водопада светят нощем.` | `required_clue` | repeatable | Live Workstream 2 clue. It joins hut, jar, waterfall, and leaf without adding an item. |
| `take-empty-jar` | Alex | `This is an empty jar.` | `Това е празен буркан.` | `state_reaction` | once | Keep; the inventory icon makes the object clear. |
| `inspect-hut-shelf` | Alex | `These plants open in sunlight.` | `Тези растения се отварят на слънце.` | `optional_flavour` | repeatable | Live Workstream 2 light-and-growth flavour. |
| `take-glow-leaf` | Alex | `This leaf has light. It is not warm.` | `Този лист има светлина. Не е топъл.` | `state_reaction` | once | Live Workstream 2 reaction; it keeps the light child-safe and non-fire-like. |
| `combine-glow-jar` | Alex | `The jar holds the light.` | `Бурканът държи светлината.` | `state_reaction` | once | Keep. Clear craft result. |
| `inspect-dark-cave-before-light` | Alex | `The cave is dark. I need light.` | `Пещерата е тъмна. Трябва ми светлина.` | `required_clue` | repeatable | Keep. Visible darkness carries the observation. |
| `light-dark-cave` | Alex | `I can see now.` | `Вече виждам.` | `state_reaction` | once | Keep. The cave glow overlay is the main reward. |
| `inspect-cave-wall` | Alex | `One stone has a thin line.` | `Един камък има тънка линия.` | `required_clue` | once | Live Workstream 2 revision. The existing cave wall already has a visible seam. |
| `take-stone-key` | Alex | `I have a stone key.` | `Имам каменен ключ.` | `state_reaction` | once | Keep. |
| `inspect-blue-stone-box` | Alex | `The box is closed.` | `Кутията е затворена.` | `required_clue` | repeatable | Strengthen with a visible keyhole before changing copy. |
| `open-blue-stone-box` | Alex | `The box is open.` | `Кутията е отворена.` | `state_reaction` | once | Keep. Open-box overlay carries the result. |
| `take-blue-lens` | Alex | `I have the Blue Lens.` | `Имам Синята леща.` | `state_reaction` | once | Keep. |
| `place-blue-lens` | Mira | `The cave path joins the river path.` | `Пътят през пещерата се свързва с пътя край реката.` | `map_compass_response` | once | Live Workstream 2 connected-system response. |

## Live Text: Slice 3, Temple Steps

| Rule / trigger | Speaker | Current English | Bulgarian | Kind | Repeat | Content review |
| --- | --- | --- | --- | --- | --- |
| `inspect-sun-channel-dry` | Alex | `The channel is dry.` | `Каналът е сух.` | `required_clue` | once | Live Workstream 2 first observation. |
| `inspect-sun-channel-marks` | Alex | `These marks are water paths.` | `Тези знаци са пътища за вода.` | `required_clue` | once | Live Workstream 2 second observation. |
| `inspect-sun-channel-cup-hint` | Alex | `The waterfall can fill this cup.` | `Водопадът може да напълни тази чаша.` | `required_clue` | repeatable | Live Workstream 2 remembered-location hint; only available while Alex has the stone cup. |
| `inspect-sun-channel-water-needed` | Alex | `The stone gate needs water.` | `Каменната порта има нужда от вода.` | `fallback_hint` | repeatable | Live reminder after the explicit observations. |
| `take-stone-cup` | Alex | `This cup is empty.` | `Тази чаша е празна.` | `state_reaction` | once | Keep. A later hint can point to the remembered waterfall only after observation. |
| `fill-stone-cup` | Alex | `I have water now.` | `Сега имам вода.` | `state_reaction` | once | Keep. This makes the transform clear. |
| `open-temple-gate` | Alex | `The water follows the sun marks! The gate is open.` | `Водата следва слънчевите знаци! Портата е отворена.` | `state_reaction` | once | Live Workstream 2 state reaction. The active bubble gives the child a moment to see the persistent water state. |
| `arrive-sun-courtyard` | Alex | `The water opens the stone flower.` | `Водата отваря каменното цвете.` | `state_reaction` | once | Live Workstream 2 arrival beat; no extra puzzle is inserted. |
| `take-stone-lens` | Alex | `I have the Stone Lens.` | `Имам Каменната леща.` | `state_reaction` | once | Keep. |
| `place-stone-lens` | Mira | `All three lenses point to Mirror Hall. Where is the light?` | `И трите лещи сочат към Залата с огледалата. Къде е светлината?` | `map_compass_response` | once | Live Workstream 2 forward question. |

## Live Fallback And Wrong-Item Text

These lines are shown when an item is selected but no compatible mission rule fires. They must remain short and local.

| Screen / target | Current English | Bulgarian | Kind | Content review |
| --- | --- | --- | --- | --- |
| Base Camp / Sun Compass | `This is for a lens.` | `Това е за леща.` | `fallback_hint` | Keep. |
| Broken Bridge / bridge | `The bridge is not safe. I need a rope.` | `Мостът не е безопасен. Трябва ми въже.` | `fallback_hint` | Keep. |
| Waterfall Mouth / pool | `Use a cup here.` | `Използвай чаша тук.` | `fallback_hint` | Keep. The pool must read as water before this line is needed. |
| Waterfall Mouth / cave entrance | `Not here. The cave needs light.` | `Не тук. Пещерата има нужда от светлина.` | `fallback_hint` | Keep. |
| Dark Cave / blue box | `The box needs a key.` | `Кутията има нужда от ключ.` | `fallback_hint` | Keep. Add keyhole evidence. |
| Temple Steps / sun channel | `The channel needs water.` | `Каналът има нужда от вода.` | `fallback_hint` | Keep. Must agree with the progressive clue sequence. |

## Content Gaps Found In The Baseline

These are planning findings, not approved runtime changes.

1. **Mira still repeats a generic line.** `talk-to-mira` and her default text are the same, and neither evolves after a lens placement.
2. **Two UI progression toasts lack Bulgarian text.** `The map is open.` and `This is the map.` are English-only.
3. **The blue box has no visible keyhole.** Keep `The box is closed.` until a later art pass supplies a clear keyhole state.
4. **The opening flower and Temple Steps now establish the valley-light question, but the broader final restoration state remains unimplemented.**

## Approved Candidate Lines: Not Yet Live

These lines have a defined purpose from the creative proposal. They are candidates only; add them in Workstreams 1-2 after their visual evidence and trigger exist.

| Planned trigger | Speaker | English candidate | Bulgarian working draft | Kind | Dependency before implementation |
| --- | --- | --- | --- | --- | --- |
| Blue box inspect | Alex | `The blue box has a stone keyhole.` | `Синята кутия има каменна ключалка.` | `required_clue` | Visible keyhole evidence |

## Next Workstream Gate

Workstreams 0-2 are complete for the current slices. The next permitted work is Workstream 3 only:

```text
campaign-wide world-state plan
-> final restoration-state dependencies
-> only then future-slice design and art
```

Do not implement the deferred blue-box keyhole line until a visible keyhole state is approved and present in the art.
