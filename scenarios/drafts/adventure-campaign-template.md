# Adventure Campaign Design Template

Use this template to design the new adventure-first game before creating assets or JSON. Fill it in order. Keep it specific enough that another Codex session can continue after context compaction.

## 1. Campaign Identity

Campaign ID:

Working title:

One-sentence premise:

Player character:

Companion or guide:

Main mystery:

Main obstacle or antagonist:

Ending:

Tone:

Non-goals:

## 2. Plot Outline

Write the story as a sequence of adventure beats, not lessons.

Beat 1:

Beat 2:

Beat 3:

Beat 4:

Beat 5:

Final beat:

## 3. World Map

List every region and whether it is available at start or discovered later.

| Region | Purpose | Unlock condition | Contains screens | Return reason |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## 4. Screen List

Each screen must have a gameplay reason.

| Screen ID | Region | What happens here | Exits | Required visible props | NPCs | State variants |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

## 5. Adventure Actions

Use this section to define the actual adventure-game logic.

### Take Items

| Item ID | Item name | Found on screen | Required for | Notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### Use Item On Hotspot

| Inventory item | Target hotspot | Screen | Resulting state change | New item or unlock |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### Give Item To NPC

| Inventory item | NPC | Screen | NPC response | Result |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### Combine Items

| Item A | Item B | Result item | Why it makes sense | Required later |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### Map Discovery And Travel

| Location marker | Discovered by | Travel unlocked when | Destination screen |
| --- | --- | --- | --- |
|  |  |  |  |

## 6. NPCs

| NPC ID | Name | Role in story | Screen(s) | Wants/needs | Gives/unlocks |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

## 7. Prop Budget

This prevents unused generated props.

| Prop | Screen | Must be visible? | Clickable? | Inventory item? | State variant? | Reason to exist |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

Any prop without a reason should be removed before art prompts are written.

## 8. Curriculum Ledger

The campaign may use these concepts naturally, but it should not drill them as isolated grammar tests.

### Grammar Coverage

| Grammar construct | Used in screen/dialogue/item | Exact safe sentence examples | Notes |
| --- | --- | --- | --- |
| `be` |  |  |  |
| `what/who/where` with `be` |  |  |  |
| `there is/there are` |  |  |  |
| prepositions: `in/on/under/next to/behind` |  |  |  |
| simple present |  |  |  |
| `do/does` questions and negatives |  |  |  |
| `have/has` |  |  |  |
| possessive adjectives |  |  |  |
| possessive `'s` |  |  |  |
| `this/that/these/those` |  |  |  |
| `can/can't` |  |  |  |
| present continuous |  |  |  |
| adverbs of frequency |  |  |  |

### Vocabulary Coverage

Track important words from `curriculum-scope.md`. Prefer words that serve the adventure.

| Word | Bulgarian | Appears as | Screen(s) | Required or optional | Notes |
| --- | --- | --- | --- | --- | --- |
|  |  | item / NPC / sign / dialogue / hint / map |  |  |  |

### Out-Of-Scope Language To Avoid

List words or grammar that appear tempting for the plot but are outside the current curriculum.

| Avoid | Safer replacement |
| --- | --- |
|  |  |

## 9. Text Style Rules

Use short, child-readable English.

Preferred sentence shapes:

- `This is a ...`
- `There is a ...`
- `The ... is in/on/under/next to/behind the ...`
- `I have a ...`
- `Can you help?`
- `Use the ... on the ...`
- `Give the ... to ...`
- `The ... is open.`
- `The ... is moving.`

Avoid long subordinate clauses. If the story needs more complexity, split it into two short lines.

## 10. Asset Prompt Plan

Do not write final prompts until sections 3-7 are stable.

| Asset | Screen/region | Required visible details | Click targets | State variants | Prompt file path |
| --- | --- | --- | --- | --- | --- |
| background |  |  |  |  |  |
| prop sheet |  |  |  |  |  |
| NPC sprite |  |  |  |  |  |
| map |  |  |  |  |  |

Prompt checklist for every screen background:

- Include all required props from the screen list.
- Keep click targets readable at Phaser resolution.
- Avoid readable text baked into images unless it is deliberately part of a clue.
- Leave walkable ground clear.
- Leave room for dialogue bubbles and HUD.
- Avoid extra decorative objects that look clickable but are not.

## 11. Engine JSON Plan

Only fill this once the adventure graph is stable.

| Screen ID | Scenario JSON path | Mission JSON path | Required engine features | Validation notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## 12. Implementation Checklist

- Plot approved.
- World map approved.
- Screen list approved.
- Inventory dependency graph approved.
- NPC and prop budget approved.
- Curriculum ledger approved.
- Asset prompts approved.
- Required engine extensions implemented.
- Scenario JSON generated.
- Mission JSON generated.
- Validation passes.
- Browser smoke test covers travel, inventory use, map unlocks, and translation hints.

## 13. Current Status

Status:

Next incomplete section:

Important decisions already made:

Important decisions still open:
