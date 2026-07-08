"""Render an articulated painted-hero walk cycle in Blender.

Each leg is a two-bone chain (thigh + shin/boot) and each arm is upper + forearm,
so the renderer can bend the knee and elbow and produce a real stride instead of
rigid pendulum swings. Materials are shadeless so the painted colors stay true.

Motion constants live in WALK so the review loop can tune them quickly.
"""

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
PUPPET_DIR = ROOT / "assets/james-bond/level-01-briefing/blender-puppet"
FRAME_W = 192
FRAME_H = 220

# Tunable walk parameters (degrees unless noted). Adjusted by the review loop.
WALK = {
    "front_thigh_swing": 14.0,  # near leg is always on top: swing it for a clear stride
    "back_thigh_swing": 9.0,    # far leg is offset beside the near one, so it can swing too
    "front_foot_lift": 4.0,     # small lift on the near leg for a stepping feel
    "body_bob": 1.5,            # subtle whole-body bounce (px)
    "arm_swing": 18.0,          # front shoulder swing (visible but not flung)
    "back_arm_scale": 0.35,     # keep rear arm tucked so it does not poke out
    "torso_lean": 5.0,          # forward lean (deg)
    "torso_sway": 0.0,          # horizontal sway (px) — 0 keeps center stable
    "head_bob": 1.2,            # head counter bob (px)
    "ground_baseline": 211.0,   # frame-y the lowest foot should touch
}


def parse_args():
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--frame-count", type=int, default=8)
    return parser.parse_args(args)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def px_to_world(x, y, depth=0.0):
    return Vector((x - FRAME_W / 2, depth, FRAME_H / 2 - y))


def make_material(name, image_path):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    for attr, value in (
        ("blend_method", "BLEND"),
        ("shadow_method", "NONE"),
        ("show_transparent_back", False),
        ("use_backface_culling", False),
    ):
        if hasattr(mat, attr):
            setattr(mat, attr, value)
    tree = mat.node_tree
    nodes = tree.nodes
    links = tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    mix = nodes.new("ShaderNodeMixShader")
    transparent = nodes.new("ShaderNodeBsdfTransparent")
    emission = nodes.new("ShaderNodeEmission")
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(ROOT / image_path))
    tex.interpolation = "Closest"
    links.new(tex.outputs["Color"], emission.inputs["Color"])
    links.new(tex.outputs["Alpha"], mix.inputs["Fac"])
    links.new(transparent.outputs["BSDF"], mix.inputs[1])
    links.new(emission.outputs["Emission"], mix.inputs[2])
    links.new(mix.outputs["Shader"], output.inputs["Surface"])
    return mat


def add_quad(name, image_path, bbox, depth):
    """Build a textured quad at absolute world position matching its frame bbox."""
    x0, y0, x1, y1 = bbox
    tl = px_to_world(x0, y0, depth)
    tr = px_to_world(x1, y0, depth)
    br = px_to_world(x1, y1, depth)
    bl = px_to_world(x0, y1, depth)
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata([tl, tr, br, bl], [], [(0, 1, 2, 3)])
    mesh.update()
    uv = mesh.uv_layers.new(name="UVMap")
    for loop, coord in zip(uv.data, [(0, 1), (1, 1), (1, 0), (0, 0)]):
        loop.uv = coord
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(make_material(name, image_path))
    bpy.context.collection.objects.link(obj)
    return obj


def add_empty(name, world_loc, parent=None):
    empty = bpy.data.objects.new(name, None)
    empty.location = world_loc
    bpy.context.collection.objects.link(empty)
    if parent is not None:
        bpy.context.view_layer.update()
        empty.parent = parent
        empty.matrix_parent_inverse = parent.matrix_world.inverted()
    return empty


def parent_keep(child, parent):
    bpy.context.view_layer.update()
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def build_chain(chain, root_parent):
    """Build a limb from its segment list. Each limb is a single whole cutout
    swinging from its hip/shoulder joint, which keeps the painted leg a clean,
    unbroken silhouette. Returns the joint empty and its quad object."""
    seg = chain[0]
    joint_empty = add_empty(f"{seg['name']}_joint", px_to_world(*seg["joint"], seg["depth"]), root_parent)
    quad = add_quad(seg["name"], seg["path"], seg["bbox"], seg["depth"])
    parent_keep(quad, joint_empty)
    return joint_empty, quad


def setup_camera():
    scene = bpy.context.scene
    engines = {item.identifier for item in scene.render.bl_rna.properties["engine"].enum_items}
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
    scene.render.resolution_x = FRAME_W
    scene.render.resolution_y = FRAME_H
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    bpy.ops.object.camera_add(location=(0, -500, 0), rotation=(math.radians(90), 0, 0))
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = FRAME_H
    scene.camera = camera


def deg(value):
    return math.radians(value)


def pose(root, statics, legs, arms, leg_quads, frame_index, frame_count):
    phase = 2 * math.pi * frame_index / frame_count
    s = math.sin(phase)
    sway = math.cos(phase) * WALK["torso_sway"]

    root.location = px_to_world(FRAME_W / 2 + sway, FRAME_H / 2)
    root.rotation_euler[1] = deg(-WALK["torso_lean"])

    statics["head"].location.z += -abs(math.sin(phase * 2)) * WALK["head_bob"]

    # The near (front) leg is always drawn on top, so it can take a full, clearly
    # visible swing without ever exposing an occluded edge. The far (back) leg
    # takes only a subtle swing so its hip — which is hidden behind the torso and
    # near leg — never extends into a thin spike/sliver. Only the near leg lifts,
    # which keeps the step reading cleanly without a hip gap on the far leg.
    for name, offset, swing, lift in (
        ("back_leg", math.pi, WALK["back_thigh_swing"], 0.0),
        ("front_leg", 0.0, WALK["front_thigh_swing"], WALK["front_foot_lift"]),
    ):
        joint = legs[name]
        theta = phase + offset
        joint.rotation_euler[1] = deg(-swing * math.sin(theta))
        joint.location.z += max(0.0, math.sin(theta)) * lift

    # Arms counter-swing opposite the same-side leg. Front arm is fully visible;
    # the rear arm is scaled down so it stays tucked behind the torso.
    arm_specs = (("front_arm", 1.0, 1.0), ("back_arm", -1.0, WALK["back_arm_scale"]))
    for name, direction, scale in arm_specs:
        if name not in arms:
            continue
        joint = arms[name]
        joint.rotation_euler[1] = deg(WALK["arm_swing"] * scale * direction * s)

    # Whole-body weight dip: both boots drop together on alternate frames, adding
    # believable vertical bob and enough foot-box motion to read as a real walk
    # without ever splitting the legs apart (which would expose a sliver).
    bob_px = abs(math.sin(phase * 2)) * WALK["body_bob"]
    ground_feet(root, leg_quads, bob_px)


def ground_feet(root, leg_quads, baseline_offset=0.0):
    """Shift the whole body vertically so the lowest boot sits on the baseline
    (plus an optional per-frame downward bob offset). Grounds on the midpoint of
    each leg quad's bottom edge — the boot's contact point — rather than the
    rotated bound-box corner, so the baseline stays stable as the legs swing."""
    bpy.context.view_layer.update()
    baseline_z = px_to_world(0, WALK["ground_baseline"] + baseline_offset).z
    lowest = None
    for quad in leg_quads:
        verts = quad.data.vertices
        # from_pydata order is [tl, tr, br, bl]; bottom edge is br(2), bl(3).
        br = quad.matrix_world @ verts[2].co
        bl = quad.matrix_world @ verts[3].co
        foot_z = (br.z + bl.z) / 2.0
        lowest = foot_z if lowest is None else min(lowest, foot_z)
    if lowest is not None:
        root.location.z += baseline_z - lowest


def render_frame(metadata, output_dir, frame_index, frame_count):
    clear_scene()
    setup_camera()
    root = add_empty("body_root", px_to_world(FRAME_W / 2, FRAME_H / 2))

    statics = {}
    for layer in metadata["statics"]:
        quad = add_quad(layer["name"], layer["path"], layer["bbox"], layer["depth"])
        parent_keep(quad, root)
        statics[layer["name"]] = quad

    legs = {}
    arms = {}
    leg_quads = []
    for name, chain in metadata["chains"].items():
        joint, quad = build_chain(chain, root)
        if "leg" in name:
            legs[name] = joint
            leg_quads.append(quad)
        else:
            arms[name] = joint

    pose(root, statics, legs, arms, leg_quads, frame_index, frame_count)
    bpy.context.view_layer.update()
    bpy.context.scene.render.filepath = str(output_dir / f"walk_{frame_index + 1:02d}.png")
    bpy.ops.render.render(write_still=True)


def main():
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    metadata = json.loads((PUPPET_DIR / "metadata_articulated.json").read_text(encoding="utf-8"))
    for frame_index in range(args.frame_count):
        render_frame(metadata, output_dir, frame_index, args.frame_count)


if __name__ == "__main__":
    main()
