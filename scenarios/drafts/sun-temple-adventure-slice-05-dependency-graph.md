# Sun Temple Adventure Slice 05 Dependency Graph

Status: design draft. This defines the final campaign dependency contract before art.

## Required Facts

```text
location.observatory_approach.discovered
observatory.receiver_aligned
observatory.sun_lens_niche_open
item.sun_lens.taken
compass.sun_lens_placed
observatory.door_open
observatory.great_mirror_aligned
valley.light_restored
map.complete
slice.sun_lens_complete
```

`valley.light_restored` is set only by the great-mirror action. It is never set by a lens placement, door opening, or approach puzzle.

## Required Flow

```text
Mirror Lens placed
  -> High Observatory marker enabled
  -> turn high-route receiver once
  -> Sun Lens niche opens
  -> take Sun Lens
  -> place Sun Lens in Compass
  -> full Compass opens Observatory Door
  -> turn great sun mirror
  -> valley.light_restored and map.complete
```

## Interaction Contract

| Interaction | Condition | Result |
| --- | --- | --- |
| turn `light_receiver` | receiver not aligned | set `observatory.receiver_aligned`; open Sun Lens niche |
| take `sun_lens` | niche open | add lens; set taken fact |
| use Sun Lens on Compass | selected lens | consume lens; set fifth Compass state; enable Observatory Door |
| use complete Compass at Door | fifth Compass state | set `observatory.door_open`; transition to Observatory |
| turn `great_sun_mirror` | door open, mirror not aligned | set mirror aligned, `valley.light_restored`, `map.complete` |

## State And Test Rules

- Receiver, opened niche, Compass, Door, and great mirror remain visibly solved on revisits.
- The Sun Lens is the only new inventory item.
- The final test fixture must begin with four lenses placed and assert that `valley.light_restored` changes only after the great mirror turns.
- Final overlay tests must revisit Base Camp, Village Garden, Temple Steps, Sun Courtyard, Waterfall Mouth, and Mirror Hall with the restoration fact true.

## Open Gate

The screen/prop map must decide whether Observatory Door is a separate screen or a readable element on the approach screen. It must not add a new puzzle either way.
