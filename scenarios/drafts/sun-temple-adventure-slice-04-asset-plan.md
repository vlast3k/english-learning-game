# Sun Temple Adventure Slice 04 Asset Plan

This asset plan turns the reviewed Mirror Hall design into the smallest usable future art package.

Sources:

- `sun-temple-adventure-slice-04-plot.md`
- `sun-temple-adventure-slice-04-dependency-graph.md`
- `sun-temple-adventure-slice-04-screen-prop-map.md`
- `sun-temple-adventure-slice-04-curriculum-ledger.md`
- `sun-temple-adventure-slice-04-art-director-review.md`
- `sun-temple-adventure-world-state-plan.md`

## Current Status

Status: generated, integrated, and browser-smoke-tested. The generated background and alpha atlas are accepted as first-pass production art; new Mirror Hall hotspot coordinates remain user-owned alignment work.

## Asset Principles

- Generate one new scene background and one transparent state atlas only.
- Keep all changing, collectible, and progress elements out of the background.
- The source-to-panel route must remain visible in all three puzzle states at normal game scale.
- Reuse Base Camp and the existing HUD; add only state frames required for the fourth lens and forward hook.
- Do not create decorative props without a dependency role.
- Preserve the warm painted storybook style of the accepted current regions.

## Planned Directories And Files

```text
assets/sun-temple-adventure/mirror-hall/
  prompts/
    background.md
  generated/
    background-v1.png

assets/sun-temple-adventure/shared/prompts/
  prop-state-atlas-slice-04.md

assets/sun-temple-adventure/shared/generated/
  prop-state-atlas-slice-04-v1-source.png
  prop-state-atlas-slice-04-v1.png
  asset-frames-slice-04-v1.json
```

The prompt files and generated files now exist at these paths.

## Background Asset

| Screen | Asset | Stable scene content | Must not be baked in |
| --- | --- | --- | --- |
| `mirror-hall` | `background-v1.png` | high daylight opening, fixed mirror, two clean movable-mirror mounting areas, sealed sun-panel recess, high-route architectural slit, quiet walkable ground | all visible beams, both movable mirror orientations, panel-open state, Mirror Lens, text, labels, characters, extra props |

### Composition Requirements

- One fixed camera shows all five major read points: source, fixed mirror, near mount, far mount, sun panel.
- The high light opening must emit no painted beam beyond a small natural glow; state art supplies the actual puzzle beam.
- The fixed mirror should be set into a wall and clearly not look clickable as a turning mechanism.
- The near and far mounts need clean, unoccluded negative space around their intended overlay footprints.
- The near and far locations must be visually distinct by position and frame shape, not color text or arrows.
- The sealed sun panel must have a clean central recess for a later Lens overlay and a clear surrounding area for closed/open state art.
- A small high slit or architectural outlet beyond the panel must support the final upward-glint state without looking like a doorway.
- Do not use shiny floor reflections that compete with the beam overlays.
- Do not place texture, vine, rubble, or decorative motifs beneath the planned beam paths.

## State Prop Atlas

Use a flat `#ff00ff` chroma-key source so the final atlas can become an alpha PNG. Exact frame dimensions follow the accepted background composition; do not crop or align frames before the image is approved.

| Atlas element | Used by | Purpose |
| --- | --- | --- |
| near mirror, starting orientation | Mirror Hall | initial teaching state |
| near mirror, aligned orientation | Mirror Hall | first successful state |
| far mirror, starting orientation | Mirror Hall | initial / first-success state |
| far mirror, aligned orientation | Mirror Hall | completed beam state |
| beam: source to fixed mirror | Mirror Hall | stable initial demonstration; may be retained across all states |
| beam: fixed to near mirror | Mirror Hall | stable path segment after fixed reflection |
| beam: near wrong endpoint | Mirror Hall | initial dead-end feedback |
| beam: near to far mirror | Mirror Hall | first successful extension |
| beam: far wrong endpoint | Mirror Hall | second readable dead-end |
| beam: far to sun panel | Mirror Hall | completed route |
| sealed sun panel overlay | Mirror Hall | closed destination state over stable recess |
| open sun panel overlay | Mirror Hall | opened destination state |
| panel glow / upward glint | Mirror Hall | reward response and Observatory direction; must not be clickable |
| Mirror Lens | Mirror Hall / inventory | fourth lens reward; present only after panel opens |
| Mirror Lens Compass overlay | Base Camp | persistent fourth-lens progress state |
| Observatory Approach locked marker | HUD map | future route forward hook |

The implementation may combine continuous beam segments into fewer frames if the frame manifest keeps every puzzle state equally clear. It must not approximate the path with a generic glow.

## State-to-Asset Mapping

| Game condition | Required visible elements |
| --- | --- |
| neither movable mirror aligned | near-start, far-start, stable source/fixed segments, near-wrong endpoint, sealed panel |
| near aligned only | near-aligned, far-start, stable segments, near-to-far segment, far-wrong endpoint, sealed panel |
| both mirrors aligned | near-aligned, far-aligned, stable segments, near-to-far segment, far-to-panel segment, open panel, panel glow, Mirror Lens |
| Lens taken | same as completed route, without Mirror Lens |
| Mirror Lens placed at Base Camp | Compass fourth-lens overlay; Observatory Approach locked marker |

## Frame Manifest Requirements

`asset-frames-slice-04-v1.json` must provide:

- atlas texture key and all frame rectangles;
- inventory icon and display frame for `mirror_lens`;
- Base Camp Compass overlay frame;
- map marker frame;
- state overlay frame names that match the dependency graph's fact conditions;
- no coordinates for screen hotspots, which remain user-aligned in the level editor.

## Review Checklist Before Accepting Art

- Source, fixed mirror, near mirror, far mirror, and panel are all readable on one screen.
- Every beam state lands on a visible object or wall; no beam disappears into texture or off-screen space.
- Near and far mirrors are distinct and their overlay orientations fit their mounts without a visible rectangular cutout.
- The source/fixed beam visibly teaches reflection before interaction.
- The Mirror Lens reads as a fourth lens, not a coin, button, eye, or extra mirror.
- The panel-open and Lens states are legible without written text.
- The upward glint is a direction cue only, not a false click target.
- The hall contains no added false-lead props, NPCs, weapons, traps, text, or horror imagery.
- Base Camp and map overlays fit their existing UI framing without regenerating those backgrounds.

## Deferred Assets

- Observatory Approach, Observatory Door, and Sun Observatory backgrounds;
- Sun Lens and final Compass frame;
- campaign-wide `valley.light_restored` overlays;
- any new NPC art;
- generic mirror rotation controls or UI.

## Handoff

The generated hall keeps the source, fixed mirror, two clean mounts, and sun panel in one composition. The atlas supplies four mirror frames, panel states, Mirror Lens, Compass overlay, and future map marker. Runtime drawing uses narrow stateful graphic light paths rather than the atlas beam crops, keeping the path continuous on the generated architecture. Workstream 5 is complete; user-owned hotspot alignment is the remaining Slice 4 task before later visual polish.
