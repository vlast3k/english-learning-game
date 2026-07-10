# Sun Temple Adventure Slice 05 Screen, Prop, And NPC Map

Status: design draft. This is the final-unit scene contract; it adds no art or implementation.

## Screens

| Screen | Purpose | Required props and states |
| --- | --- | --- |
| `observatory-approach` | earn Sun Lens through one readable high-route action | four-lit receiver, one turn-wheel, closed/open niche, Sun Lens |
| `observatory-door` | use the complete Compass without consuming it | one Compass socket, closed/open stone rings, clear Observatory entrance |
| `sun-observatory` | perform the ceremonial restoration action | one great sun mirror, unturned/turned states, outgoing light |

Base Camp is reused for Sun Lens placement. No new NPC is required; Lina and Mira react only after restoration, on later revisits.

## Prop Budget

| Prop | Screen | Clickable | State role |
| --- | --- | --- | --- |
| four-part receiver | approach | no | proves four routes arrive |
| turn-wheel | approach | yes | points received light at niche |
| Sun Lens niche | approach | look/take | closed -> open -> Lens removed |
| Sun Lens | approach / inventory | yes | fifth Compass reward |
| Compass socket | Door | yes | recognizes complete Compass, never consumes it |
| stone rings | Door | no | closed -> open transition |
| great sun mirror | Observatory | yes | unturned -> aligned; triggers restoration |

## False-Lead Rules

- no extra mirrors, receivers, wheels, keys, tools, loose lenses, maps, or doors;
- no cliff danger, jumping, falling, enemy, timer, or puzzle text;
- Door is a single short screen or foreground state, not a fourth puzzle room;
- Observatory has one mirror only and no second alignment task.

## Final-State Use

Use `valley.light_restored` exactly as specified in `sun-temple-adventure-world-state-plan.md`: required visible responses are Base Camp flower/Compass/map, Village Garden plants, and the connected temple route. Dark Cave and Supply Tent stay visually quiet.

