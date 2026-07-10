# Sun Temple Adventure Slices 01 And 02 Polish Review

This is the implementation review for the two playable Sun Temple slices. It records what was checked after hotspot alignment and what is deliberately deferred.

## Status

Status: completed after hotspot alignment. Do not change hotspot coordinates or radii as part of follow-up work unless the user explicitly requests it.

## Playthrough Review

### Slice One: Green Lens

Verified flow:

```text
Sun Compass -> torn map -> rope -> branch/map piece -> valley map
-> Jungle Path -> Broken Bridge -> basket -> Lina -> flower pot
-> Green Lens -> Sun Compass -> Waterfall Cave map marker
```

Clarity findings and decisions:

- The disabled-but-visible map button establishes the map as a future tool without a tutorial wall.
- The branch, bridge, basket, flower pot, and compass each have a single useful action in their current state.
- Item use now checks the selected item, not merely whether the correct item exists in inventory. A wrong selection cannot accidentally repair the bridge, give Lina the basket, or place the Green Lens.
- The Green Lens is removed after placement; its compass overlay is the lasting progress signal.

### Slice Two: Blue Lens

Verified flow:

```text
Waterfall Mouth -> glow leaf -> Keeper Hut -> empty jar
-> glow jar -> light cave -> wall key -> blue stone box
-> Blue Lens -> Sun Compass -> Temple Steps marker
```

Clarity findings and decisions:

- The jar and leaf make one clear craft pair; the glow jar remains in inventory after use, which avoids a confusing disappearance.
- The dark cave is opened by an action that visibly changes the entrance.
- The wall crack, stone key, blue box, and Blue Lens form one short, readable cave chain.
- Temple Steps is visible as a locked forward hook rather than an empty destination.

## UI And State Polish

Completed:

- Adventure hotspot rings now use a quiet idle state and reveal at full strength with their label on hover.
- The editor still shows full hotspot circles, labels, resize handles, and its translucent helper character.
- Taking or placing an item refreshes its hotspot, inventory, overlay, and map state through the shared engine actions.
- All Sun Temple maps use the same nine-marker layout and the same locked Temple Steps treatment.
- Empty adventure screens remain NPC-free in play and keep their editor-only helper separate from saved story data.

Deferred visual work:

- Some generated backgrounds include the original takeable object as painted scenery. The gameplay hotspot disappears, but the painted object may remain as harmless scenery until a later state-art pass masks or regenerates it.
- Do not use that pass to add more decorative tool-like props. It should only solve state readability for existing progression objects.

## Curriculum Review

The live player-facing text is acceptable under the adventure-first language policy.

| Coverage | Slice one | Slice two |
| --- | --- | --- |
| `be` descriptions | compass, bridge, lens | cave, wall, box |
| `there is/are` | map piece, flowers | key in wall |
| `have/has` | rope, basket, lens | jar, key, lens |
| prepositions | under/on/in | in/on |
| possession | Lina's basket, my seeds | none required |
| `can` | optional future support | `I can see now.` |
| commands | take, use, give | use, open |

Decisions:

- No grammar questions or answer gates were added.
- Adventure-critical nouns remain allowed with Bulgarian support: map, rope, bridge, basket, compass, lens, jar, waterfall, cave, and temple.
- `Green Lens` and `Blue Lens` remain proper progress-object names.
- `The box is closed.` replaces `The box is shut.` for simpler, more familiar vocabulary.
- `I can see now.` replaces the less natural `The cave is light now.` after lighting the cave.

## Verification

- Content, engine, asset, and editor validators pass.
- The dedicated slice-two browser route verifies the full Blue Lens chain.
- Browser smoke tests now read hotspot coordinates and map-marker positions from scenario data where applicable, so alignment work does not require test rewrites.

## Next Work

Before third-slice art generation, use this order:

1. Let a child play the two completed slices and record only genuine confusion.
2. Decide whether any painted-takeable background needs a state-art mask or regenerated background.
3. Design Temple Steps and the Stone Lens chain in documents.
4. Ask the art director to review that third-slice design before creating prompts.
