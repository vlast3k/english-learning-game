# Sun Temple Adventure Slice 04 Dependency Graph

This file turns `sun-temple-adventure-slice-04-plot.md` into a data-driven, failure-safe Mirror Hall flow. Read it with the Slice 4 screen/prop map and curriculum ledger.

## Current Status

Status: design approved for the asset-planning stage. Nothing in this graph is implemented yet.

## Entry Requirements

```text
compass.stone_lens_placed = true
location.mirror_hall.revealed = true
slice.stone_lens_complete = true
```

The Mirror Hall marker is enabled once the Stone Lens is placed. It is not a locked map teaser.

## New Facts

```text
location.mirror_hall.discovered
mirror_hall.light_source_seen
mirror_hall.near_mirror_aligned
mirror_hall.far_mirror_aligned
mirror_hall.beam_path_complete
mirror_hall.sun_panel_open
item.mirror_lens.taken
compass.mirror_lens_placed
location.observatory_approach.revealed
slice.mirror_lens_complete
```

Initial values for the two alignment facts are `false`. They are one-way progress facts: once a mirror is aligned, it remains aligned.

## Required Flow

```text
Base Camp
  Stone Lens already placed
  Mirror Hall marker enabled

Mirror Hall
  observe the fixed reflection and source line
  turn near mirror once
  beam reaches far mirror
  turn far mirror once
  full beam reaches sun panel
  sun panel opens
  take Mirror Lens

Base Camp
  place Mirror Lens in Sun Compass
  reveal high Observatory Approach forward hook
```

The initial beam state is useful information, not a failure. It ends at the wrong side of the near mirror. After the first turn it reaches the far mirror; after the second it reaches the sun panel. No state resets, timed failures, or item dependencies exist.

## Mirror-State Contract

| State | `near_mirror_aligned` | `far_mirror_aligned` | Visible beam result | Player reading |
| --- | --- | --- | --- | --- |
| 0: teaching state | false | false | source -> fixed mirror -> near mirror -> nearby wall | the near mirror can send it somewhere else |
| 1: first success | true | false | source -> fixed mirror -> near mirror -> far mirror -> nearby wall | the far mirror is now the next meaningful object |
| 2: completed route | true | true | source -> fixed mirror -> near mirror -> far mirror -> sun panel | the panel can open |

`mirror_hall.beam_path_complete` and `mirror_hall.sun_panel_open` are set together when the far mirror is aligned. Keeping both facts makes the art condition and lens gate explicit while avoiding a separate unearned interaction.

## Interaction Dependencies

| Interaction | Screen | Condition | Result | Feedback |
| --- | --- | --- | --- | --- |
| inspect `light_source` | Mirror Hall | first inspection only | set `mirror_hall.light_source_seen` | `The light is inside.` |
| inspect `fixed_mirror` | Mirror Hall | any state | no required fact | `The mirror turns the light.` |
| turn `near_mirror` | Mirror Hall | `near_mirror_aligned = false` | set near aligned; refresh state overlays | `The light reaches the next mirror.` |
| inspect `far_mirror` early | Mirror Hall | near mirror not aligned | no state change | `The light does not reach this mirror yet.` |
| turn `far_mirror` | Mirror Hall | near aligned and far not aligned | set far aligned, beam complete, panel open; refresh overlays | `The light reaches the sun mark.` |
| inspect `sun_panel` early | Mirror Hall | panel closed | no state change | `The panel is closed.` |
| take `mirror_lens` | Mirror Hall | panel open and lens not taken | add inventory; set taken fact; remove lens overlay | `This is the Mirror Lens.` |
| use `mirror_lens` on `sun_compass` | Base Camp | selected Mirror Lens | remove inventory; set compass fact; reveal Observatory Approach | `Four lenses show the route. One space is still dark.` |

The fixed mirror does not need a mandatory click. Its reflected beam is already visible on arrival. Its optional inspect line supports a child who needs the rule named in simple language.

## Rule Priorities And Revisit Safety

When implemented in the mission manifest:

1. Put early-inspect feedback before successful interactions for the same hotspot, with mutually exclusive fact gates.
2. Successful mirror-turn rules are `once: true`; their facts make the state durable across scene transitions and saved games.
3. After a mirror is aligned, clicking it may show a short confirmation such as `The mirror is in the right place.` It must not toggle the state back.
4. The Lens pickup remains available after travel away and back whenever `sun_panel_open = true` and `item.mirror_lens.taken = false`.
5. Placement at Base Camp consumes the Mirror Lens and sets the future route fact exactly once.

The current runtime supports this model with `fact.set`, `inventory.add`, `inventory.remove`, `screen.refresh`, `hotspot.refresh`, and declarative visibility conditions. No rotate/cycle action, drag interaction, physics simulation, or new puzzle engine is required.

## Map Discovery And Travel

| Marker | Visible when | Enabled when | Destination / purpose |
| --- | --- | --- | --- |
| Mirror Hall | Stone Lens placed | Stone Lens placed | `mirror-hall` playable Slice 4 destination |
| Observatory Approach | Mirror Lens placed | false until Slice 5 design | future high-route forward hook only |

The Mirror Hall marker changes from the Slice 3 locked hook to a usable destination once this slice is implemented. The Observatory Approach marker must remain visibly distinct from an ordinary unlocked travel marker; its final label and exact lock copy are deferred to the Slice 5 design package.

## Item Dependencies

| Item | Found / made | Availability | Result |
| --- | --- | --- | --- |
| `mirror_lens` | sun panel in Mirror Hall | full beam path complete | add inventory; set taken fact |

No item is used on a mirror, panel, or beam. The mirrors are room mechanisms, not inventory objects.

## Progress Graph

```text
slice.stone_lens_complete
  -> Mirror Hall marker enabled
  -> observe a fixed reflection
  -> align near mirror
  -> beam reaches far mirror
  -> align far mirror
  -> beam reaches sun panel
  -> panel opens
  -> take Mirror Lens
  -> place Mirror Lens in Compass
  -> Observatory Approach forward hook
  -> slice.mirror_lens_complete
```

## Failure And Hint Rules

| Situation | Required response |
| --- | --- |
| child looks at the far mirror before the near mirror | Beam visibly stops before it; optional line says it does not reach the mirror yet. |
| child looks at the sun panel before the path is complete | Panel remains visibly closed; optional line says it is closed. |
| child clicks an already aligned mirror | Keep its solved position; give a brief confirmation only. |
| child selects an inventory item and clicks a mirror | Do not consume it; say the mirror turns the light. |
| child leaves after first alignment | On return, the first beam extension and near-mirror state remain visible. |
| child leaves after panel opens but before pickup | Panel stays open and Mirror Lens remains visible. |
| child tries to place the Mirror Lens away from Base Camp | Do not consume it; say it belongs in the Sun Compass. |

## Smoke-Test Happy Path

The eventual Slice 4 browser test must establish a Slice-3-complete state, then prove:

1. Mirror Hall map travel is enabled.
2. Initial beam/state overlays render and the Mirror Lens is absent or blocked.
3. Near mirror interaction changes only the first mirror and beam route.
4. Far mirror interaction opens the sun panel and shows the Mirror Lens.
5. Lens pickup adds the correct inventory item and hides the world prop.
6. Base Camp placement removes the inventory item, renders the Compass overlay, and reveals the locked Observatory Approach hook.
7. Re-entering Mirror Hall preserves the completed beam and open panel.

## Prop Budget Rule

Every new visual element has one dependency role:

| Element | Role |
| --- | --- |
| high wall opening | source of light |
| fixed mirror | teaches reflection without interaction |
| near mirror panel | first state change |
| far mirror panel | second state change |
| beam overlays | make every state legible |
| sealed sun panel | destination and Lens container |
| Mirror Lens | fourth Compass progress item |
| Compass Mirror Lens overlay | persistent progress |
| Observatory Approach marker | forward hook |
