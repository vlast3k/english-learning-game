# Sun Temple Adventure Slice 03 Dependency Graph

This file defines the Temple Steps adventure logic. Use it with the slice-three plot, screen/prop map, and curriculum ledger.

## Current Status

Status: implemented in `game-engine/missions/sun-temple-adventure-slice-01.json` and verified by the dedicated slice-three browser smoke test.

## Entry Requirements

```text
compass.blue_lens_placed = true
location.temple_steps.revealed = true
slice.blue_lens_complete = true
```

## New Facts

```text
location.temple_steps.discovered
location.sun_courtyard.discovered
location.mirror_hall.revealed
item.stone_cup.taken
craft.water_cup_made
temple.channel_filled
temple.gate_open
temple.sun_flower_open
item.stone_lens.taken
compass.stone_lens_placed
slice.stone_lens_complete
```

## Required Flow

```text
Base Camp
  Blue Lens already placed
  Temple Steps marker available

Temple Steps
  inspect dry sun channel
  take stone cup

Waterfall Mouth
  use stone cup on waterfall pool
  stone cup -> water cup

Temple Steps
  use water cup on dry sun channel
  water cup consumed
  gate opens

Sun Courtyard
  take Stone Lens

Base Camp
  place Stone Lens in Sun Compass
  reveal Mirror Hall marker
```

## Item Dependencies

| Item | Found / made | Availability | Result |
| --- | --- | --- | --- |
| `stone_cup` | Temple Steps | always present on first arrival | add cup, set taken fact |
| `water_cup` | waterfall pool | selected `stone_cup` | remove stone cup, add water cup |
| `stone_lens` | Sun Courtyard | gate open and flower is already open | add lens, set taken fact |

## Interaction Dependencies

| Interaction | Screen | Condition | Result | Feedback |
| --- | --- | --- | --- | --- |
| inspect `sun_channel` | Temple Steps | gate closed | no state change | `The stone gate needs water.` |
| use `stone_cup` on `waterfall_pool` | Waterfall Mouth | selected cup | make water cup | `I have water now.` |
| use `water_cup` on `sun_channel` | Temple Steps | selected water cup | consume cup; water flows; open gate; open flower; discover courtyard | `The gate is open.` |
| use `stone_lens` on `sun_compass` | Base Camp | selected lens | consume lens; reveal Mirror Hall | `The mirror hall is on the map.` |

## Map Discovery And Travel

| Marker | Visible when | Enabled when | Destination |
| --- | --- | --- | --- |
| Temple Steps | Blue Lens placed | Blue Lens placed | `temple-steps` |
| Sun Courtyard | temple gate open | temple gate open | `sun-courtyard` |
| Mirror Hall | Stone Lens placed | false, forward hook | future `mirror-hall` |

Waterfall Mouth remains a valid map destination. The reuse is intentional: its pool is the source of water for the Temple Steps channel.

## Failure And Hint Rules

| Situation | Suggested line |
| --- | --- |
| inspect gate before water | `The stone gate needs water.` |
| use wrong item on waterfall pool | `Use a cup here.` |
| use wrong item on sun channel | `The channel needs water.` |
| inspect flower before gate opens | no hotspot or `The gate is closed.` |
| use Stone Lens away from compass | `This lens is for the Sun Compass.` |

## Progress Graph

```text
slice.blue_lens_complete
  -> Temple Steps marker
  -> take stone cup
  -> fill water cup at Waterfall Mouth
  -> fill sun channel
  -> open temple gate
  -> Sun Courtyard, flower already open
  -> take Stone Lens
  -> place Stone Lens
  -> Mirror Hall marker
  -> slice.stone_lens_complete
```

## Prop Budget Rule

Every new prop has one dependency role:

| Prop | Role |
| --- | --- |
| stone cup | water container |
| waterfall pool | fill target |
| dry sun channel | water-use gate |
| open stone gate | state result |
| stone sun flower | lens reveal target |
| Stone Lens | progress item |
| compass Stone Lens overlay | persistent progress |
