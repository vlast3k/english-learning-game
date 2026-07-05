# 02. Natural Walk Cycle Generation

The game can turn a clean side-idle character pose into a more natural 8-frame walking row.

## What Changed

AI-generated sprite panels often repeat the same walking pose across all frames. The result looks like sliding: feet stay in the same triangle shape, and hands do not counter-swing naturally.

`tools/build_spy_walk_cycle.py` is a reusable first pass for fixing that problem. It extracts a right-facing side idle pose from a source panel, fits it into the existing Phaser character frame size, then renders an 8-frame side-walk cycle with:

- alternating leg swing
- alternating foot lift
- near/far leg layering
- visible hand and forearm counter-swing
- consistent foot baseline inside the `192x220` frame

For the James Bond Level 01 prototype, it writes:

- `assets/james-bond/level-01-briefing/generated/hero-spy-natural-walk-row.png`
- `assets/james-bond/level-01-briefing/generated/hero-spy-natural-spritesheet.png`
- `assets/james-bond/level-01-briefing/generated/hero-spy-natural-walk-preview.gif`

## What Is Reusable

The reusable engine idea is deterministic sprite correction: use one good side pose as the source of truth, then generate the side-walk row mechanically instead of relying on image generation to produce exact animation phases.

The current Phaser hero layout is:

| Rows | Frames | Meaning |
| --- | --- | --- |
| 1 | `0-7` | Walk down source frames |
| 2 | `8-15` | Walk up source frames |
| 3 | `16-23` | Side walk cycle |
| 4 | `24-31` | Front idle/expression frames |
| 5 | `32-39` | Back idle frames |
| 6 | `40-47` | Side idle/expression frames |

The live game currently plays frames `16-23` for side, up, and down walking, so row 3 is the highest-impact row to fix.

The same approach can be reused for future characters when the source art provides:

- a clean right-facing side idle pose
- separated or partly separable boots
- visible hands/forearms
- no long coat, bag, or shadow merging the legs
- enough transparent or removable background around the body

## What Remains Scene-Specific

The exact source crop boxes and rig coordinates are scene/character-specific. For each new generated source panel, tune:

- `SRC`
- `FRONT_BOX`, `SIDE_BOX`, `BACK_BOX`
- `HIP_Y`
- `LEG_SPLIT_X`
- `SWING_DEG`
- `FOOT_LIFT`
- `ARM_SWING_DEG`
- output paths

If the character outfit changes significantly, the leg and arm masks may need adjustment.

## Validation

Run the builder:

```sh
python3 tools/build_spy_walk_cycle.py
```

Check dimensions:

```sh
python3 - <<'PY'
from PIL import Image
for path in [
    "assets/james-bond/level-01-briefing/generated/hero-spy-natural-walk-row.png",
    "assets/james-bond/level-01-briefing/generated/hero-spy-natural-spritesheet.png",
    "assets/james-bond/level-01-briefing/generated/hero-spy-natural-walk-preview.gif",
]:
    image = Image.open(path)
    print(path, image.size, image.mode)
PY
```

Expected dimensions:

- walk row: `1536x220`
- full spritesheet: `1536x1320`
- preview GIF: `192x220`

Visually inspect the row or GIF and confirm:

- one foot plants while the other passes or lifts
- feet do not stay in the same triangle pattern across frames
- hands move opposite the feet
- the character baseline stays stable
- the body does not visibly tear around the hips, knees, or wrists

