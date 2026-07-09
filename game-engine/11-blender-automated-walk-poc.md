# Blender Automated Walk POC

This POC proves a fully automated, free walk-cycle pipeline that Codex can run without manual animation-editor work.

## Goal

Stop generating walk cycles by warping a flattened PNG. Instead, render transparent frames from a scriptable Blender scene and pack them into the same Phaser spritesheet shape the game already uses.

## Files

- `tools/blender/render_walk_poc.py` - Blender Python script that builds and renders a simple side-view agent puppet.
- `tools/blender/pack_walk_poc.py` - Packs rendered frames into Phaser-compatible PNG assets.
- `tools/blender/validate_walk_poc.py` - Validates output count, dimensions, transparency, and nonblank alpha.
- `tools/blender/run_walk_poc.sh` - One-command wrapper.
- `assets/james-bond/level-01-briefing/blender-poc/frames/` - Rendered transparent frame PNGs.
- `assets/james-bond/level-01-briefing/blender-poc/agent-walk-row.png` - 8-frame walk row, `1536x220`.
- `assets/james-bond/level-01-briefing/blender-poc/agent-phaser-spritesheet.png` - Phaser-compatible six-row sheet, `1536x1320`.
- `assets/james-bond/level-01-briefing/blender-poc/agent-walk-preview.gif` - Quick visual preview.

## Command

```sh
tools/blender/run_walk_poc.sh
```

If Blender is not on `PATH`, set:

```sh
BLENDER_BIN=/Applications/Blender.app/Contents/MacOS/Blender tools/blender/run_walk_poc.sh
```

## How It Works

1. Blender runs headlessly with `--background`.
2. `render_walk_poc.py` creates a simple toon spy puppet from primitive meshes.
3. The script poses the legs and arms across 8 phases of a walk cycle.
4. Blender renders each phase as a transparent `192x220` PNG into a temporary directory.
5. `pack_walk_poc.py` publishes the fresh frames and packs them into the row and six-row Phaser sheet layout.
6. `validate_walk_poc.py` checks that the output is nonblank, transparent at the corners, and the expected Phaser dimensions.

## Why This Is Better Than The Old Builder

The old `tools/build_spy_walk_cycle.py` tried to split and rotate limbs from a flattened painted sprite. That can create duplicate-foot artifacts because one boot or trouser area can be copied into multiple moving layers.

The Blender POC uses actual posed geometry. Each foot exists once per frame, and the camera renders the final sprite. The repo still consumes ordinary PNG spritesheets, so Phaser does not need a skeletal runtime.

## What This POC Does Not Prove Yet

This is not production hero art. It proves that Codex can run Blender headlessly and generate Phaser-compatible transparent spritesheets without manual editor work.

To get the nice painted hero, the production source must be upgraded from a flattened PNG into one of:

- a layered 2D puppet in Blender, with separate head, torso, arms, legs, and boots, or
- a stylized 3D/toon hero model matching the painted design.

The current primitive character intentionally keeps the source simple so the automation can be verified first.

## Next Step Toward Production

Replace the primitive POC puppet with a better scripted character source:

- a simple low-poly/toon 3D spy model, or
- layered 2D cutout planes parented to bones in Blender.

The automation stays the same: render frames, pack row/sheet, validate output, update cache keys, run browser smoke tests.

## Painted Hero Follow-Up

After the Blender POC proved the automation path, the immediate production fix for the current hero used the best existing art source: the painted walk row already present in `assets/james-bond/level-01-briefing/generated/hero-spy-source-panel.png`.

`tools/build_spy_walk_cycle.py` now:

1. extracts the bottom painted walk row from the source panel,
2. filters for exactly eight full-body walking components,
3. removes paper background and shadow fringes per frame,
4. normalizes the frames to `192x220`,
5. writes `hero-spy-natural-walk-row.png`,
6. writes the runtime `hero-spy-natural-spritesheet.png`, and
7. writes `hero-spy-natural-walk-preview.gif`.

This gives the game the nice painted hero with a natural walk cycle now, while keeping the Blender POC available for a future fully generated or rigged source.

## Review Feedback Incorporated

- The wrapper renders into a temporary directory before publishing frames, so a partial Blender failure cannot silently pack stale frame PNGs.
- The packer resolves paths from the repo root and accepts explicit input/output arguments.
- The validator guards frame count, dimensions, transparent corners, and nonblank alpha.
- The documentation distinguishes the automation POC from production-quality hero art.

## Production Walk Pipeline (Layered Painted Puppet)

The production hero walk is now generated from a layered 2D cutout of the painted
side pose, posed and rendered in Blender, instead of slicing 8 incoherent
AI-generated frames out of the source panel. The panel slicer produced a sliding,
wobbling hero because each frame was a slightly different drawing with no shared
foot or hip anchor.

### Files

- `tools/blender/build_hero_puppet_layers.py` - cuts the painted side pose into head, torso/bag, arms, and legs layers with pivots.
- `tools/blender/build_hero_puppet_articulated.py` - splits each leg into thigh + shin/boot and each arm into upper + forearm so knees and elbows can bend; writes `metadata_articulated.json`.
- `tools/blender/render_hero_articulated_walk.py` - poses the two-bone limb chains across 8 walk phases, grounds the lowest foot to the baseline, and renders shadeless transparent frames.
- `tools/blender/review_hero_walk.py` - renders and builds review artifacts (numbered row, onion-skin overlay, looping GIF) under `test-results/hero-walk-iter/`.
- `tools/blender/publish_hero_walk.py` - packs the rendered walk into the runtime row/sheet and reuses the painted front/back/side idle poses.
- `tools/blender/run_hero_walk.sh` - one-command wrapper: build segments, render, publish.

### Command

```sh
tools/blender/run_hero_walk.sh
```

This rewrites the runtime assets:

- `hero-spy-natural-walk-row.png` (`1536x220`)
- `hero-spy-natural-spritesheet.png` (`1536x1320`, row 3 is the side walk the game plays)
- `hero-spy-natural-walk-preview.gif` (`192x220`)

### Why It Reads As A Walk Now

- One painted source pose is reused, so proportions, hair, and colors stay stable across frames.
- Each leg is a two-bone chain (thigh + shin/boot) and each arm is upper + forearm, so the knee and elbow bend for a real contact/passing/lift stride instead of rigid pendulum swings.
- The thigh is drawn in front of the shin with a generous overlap, so the horizontal cut edge at the knee is always hidden — the leg reads as a single drawn limb with no visible seam or detached boot.
- Legs swing in 180-degree opposition and the arms counter-swing, giving clear walking symmetry.
- After posing, the body is shifted vertically so the lowest boot sits on the ground baseline, removing floating/sliding feet without inverse kinematics.
- Materials are shadeless (emission + alpha), so the painted jacket, pants, and boots keep their true colors instead of collapsing into a dark silhouette.

### Review Loop

`review_hero_walk.py` regenerates a numbered frame row, an onion-skin overlay, and
a looping GIF so an art-direction pass can judge stride readability, per-frame
poses, joint seams, and ground contact. The motion constants live in the `WALK`
dict at the top of `render_hero_articulated_walk.py` for quick tuning between
review passes. The current cycle was iterated against an Art Designer review until
the legs were seam-free, the feet stayed grounded, and the arm/leg opposition read
as a believable hand-drawn walk.

### Tuning For A New Character

Adjust the limb split ratios and overlap in `build_hero_puppet_articulated.py` and
the swing/bend amounts in the `WALK` dict inside `render_hero_articulated_walk.py`.
Keep the proximal segment (thigh/upper arm) drawn in front of the distal segment so
the joint cut stays hidden, and keep `torso_sway` small so the walk row passes the
character-sprite center-drift check.

## Rig V2 Reboot: Generated Parts First

The next reboot follows the better art-direction approach: generate a puppet kit
first, then animate parts with Blender. This avoids slicing full-body generated
walk frames, which bakes in inconsistent feet, neighboring hands, shadows, JPEG
halos, and frame-to-frame identity drift.

### Current Files

- `assets/james-bond/level-01-briefing/rig-v2/source/hero-puppet-parts-chromakey.png` - selected generated body-part sheet on flat green.
- `assets/james-bond/level-01-briefing/rig-v2/source/hero-puppet-parts-alpha-preview.png` - extracted alpha preview of the source sheet.
- `assets/james-bond/level-01-briefing/rig-v2/parts/*.png` - isolated puppet parts.
- `assets/james-bond/level-01-briefing/rig-v2/parts/contact-sheet.png` - quick visual audit of part names.
- `assets/james-bond/level-01-briefing/rig-v2/hero-rig-v2.json` - metadata with source bboxes, part sizes, and pivots.
- `tools/blender/build_hero_rig_v2_parts.py` - green-key removal, component extraction, part naming, pivot metadata.
- `tools/blender/render_hero_walk_v2.py` - Blender orthographic renderer that places the parts on pivot empties and animates an 8-frame walk.

### Commands

```sh
python3 tools/blender/build_hero_rig_v2_parts.py
blender --background --python tools/blender/render_hero_walk_v2.py -- \
  --output-dir test-results/hero-rig-v2/candidate-04/frames \
  --frame-count 8
```

The rendered review artifacts from the first reboot pass are under:

```text
test-results/hero-rig-v2/
```

### Current Status

This pipeline is now real and reproducible, but it has not replaced the runtime
hero yet. The generated parts are clean and alpha-friendly, but the assembled
candidate still does not beat the installed Gemini component-clean walk strip.
The main remaining art issue is source-kit anatomy: the torso and limb parts need
to be generated or edited with more compatible side-view proportions before the
Blender rig can produce a polished final sprite.

Keep the currently installed `hero-spy-natural-spritesheet.png` until a `rig-v2`
candidate is reviewed as visually better.
