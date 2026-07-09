"""Render an 8-frame walking cycle from the generated v2 puppet parts in Blender."""

import argparse
import json
import math
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
RIG_DIR = ROOT / "assets/james-bond/level-01-briefing/rig-v2"
METADATA = RIG_DIR / "hero-rig-v2.json"
FRAME_W = 192
FRAME_H = 220


PART_LAYOUT = {
    "bag": {"height": 48, "depth": -0.08},
    "rear_upper_arm": {"height": 43, "depth": -0.06},
    "rear_forearm": {"height": 29, "depth": -0.05},
    "rear_thigh": {"height": 60, "depth": -0.04},
    "rear_shin": {"height": 54, "depth": -0.03},
    "rear_boot": {"height": 28, "depth": -0.02},
    "torso": {"height": 86, "depth": 0.0},
    "front_thigh": {"height": 60, "depth": 0.02},
    "front_shin": {"height": 54, "depth": 0.03},
    "front_boot": {"height": 28, "depth": 0.04},
    "front_upper_arm": {"height": 43, "depth": 0.05},
    "front_forearm": {"height": 29, "depth": 0.06},
    "head": {"height": 64, "depth": 0.07},
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


def px_to_world(x, y):
    return (x - FRAME_W / 2, 0, FRAME_H / 2 - y)


def make_material(name, image_path):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.blend_method = "BLEND"
    material.show_transparent_back = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    transparent = nodes.new("ShaderNodeBsdfTransparent")
    emission = nodes.new("ShaderNodeEmission")
    texture = nodes.new("ShaderNodeTexImage")
    mix = nodes.new("ShaderNodeMixShader")
    texture.image = bpy.data.images.load(str(ROOT / image_path))
    emission.inputs["Strength"].default_value = 1.0
    material.node_tree.links.new(texture.outputs["Color"], emission.inputs["Color"])
    material.node_tree.links.new(texture.outputs["Alpha"], mix.inputs["Fac"])
    material.node_tree.links.new(transparent.outputs["BSDF"], mix.inputs[1])
    material.node_tree.links.new(emission.outputs["Emission"], mix.inputs[2])
    material.node_tree.links.new(mix.outputs["Shader"], output.inputs["Surface"])
    return material


def add_part(part, pivot_px, display_height, depth):
    source_width, source_height = part["size"]
    display_width = source_width * (display_height / source_height)
    pivot_x, pivot_y = part["pivot"]
    pivot_world = px_to_world(*pivot_px)

    empty = bpy.data.objects.new(f"{part['name']}_pivot", None)
    empty.location = (pivot_world[0], depth, pivot_world[2])
    bpy.context.collection.objects.link(empty)

    local_pivot_x = pivot_x * (display_width / source_width)
    local_pivot_y = pivot_y * (display_height / source_height)
    left = -local_pivot_x
    right = display_width - local_pivot_x
    top = local_pivot_y
    bottom = local_pivot_y - display_height

    mesh = bpy.data.meshes.new(f"{part['name']}_mesh")
    verts = [(left, 0, bottom), (right, 0, bottom), (right, 0, top), (left, 0, top)]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.update()
    uvs = mesh.uv_layers.new(name="UVMap")
    for loop, uv in zip(uvs.data, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop.uv = uv

    obj = bpy.data.objects.new(part["name"], mesh)
    obj.parent = empty
    obj.data.materials.append(make_material(part["name"], part["path"]))
    bpy.context.collection.objects.link(obj)
    return empty


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
    scene.view_settings.look = "Medium High Contrast"
    scene.eevee.taa_render_samples = 64

    bpy.ops.object.camera_add(location=(0, -500, 0), rotation=(math.radians(90), 0, 0))
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = FRAME_H
    scene.camera = camera


def lerp(a, b, t):
    return a + (b - a) * t


def walk_pose(frame_index, frame_count):
    phase = 2 * math.pi * frame_index / frame_count
    s = math.sin(phase)
    c = math.cos(phase)
    contact = abs(s)
    bob = 2.5 * (1 - contact)
    hip_x = 96 + 0.9 * c
    hip_y = 128 + bob
    shoulder_x = 90 + 0.5 * c
    shoulder_y = 88 + bob * 0.65
    neck_x = 91 + 0.6 * c
    neck_y = 66 + bob * 0.55

    front_foot_x = 117 + 23 * s
    rear_foot_x = 74 - 23 * s
    front_foot_y = 205 - max(0, c) * 9
    rear_foot_y = 205 - max(0, -c) * 9
    front_knee_x = 111 + 15 * s + 7 * c
    rear_knee_x = 81 - 15 * s - 7 * c
    front_knee_y = 165 - max(0, c) * 7 + bob * 0.25
    rear_knee_y = 165 - max(0, -c) * 7 + bob * 0.25

    return {
        "pivots": {
            "bag": (74 + 0.4 * c, 112 + bob),
            "torso": (neck_x, neck_y),
            "head": (neck_x + 2, neck_y + 6),
            "rear_upper_arm": (shoulder_x - 12, shoulder_y),
            "rear_forearm": (74 - 10 * s, 120 + bob),
            "front_upper_arm": (shoulder_x + 13, shoulder_y),
            "front_forearm": (111 + 10 * s, 120 + bob),
            "rear_thigh": (hip_x - 7, hip_y),
            "rear_shin": (rear_knee_x, rear_knee_y),
            "rear_boot": (rear_foot_x, rear_foot_y),
            "front_thigh": (hip_x + 8, hip_y),
            "front_shin": (front_knee_x, front_knee_y),
            "front_boot": (front_foot_x, front_foot_y),
        },
        "rotations": {
            "bag": math.radians(-5 * s),
            "torso": math.radians(-1.8 * s),
            "head": math.radians(1.0 * s),
            "rear_upper_arm": math.radians(-18 * s - 10),
            "rear_forearm": math.radians(-12 * s - 5),
            "front_upper_arm": math.radians(18 * s + 10),
            "front_forearm": math.radians(12 * s + 5),
            "rear_thigh": math.radians(18 * s + 5),
            "rear_shin": math.radians(-18 * s - 8 * c),
            "rear_boot": math.radians(-4 * s),
            "front_thigh": math.radians(-18 * s - 5),
            "front_shin": math.radians(18 * s + 8 * c),
            "front_boot": math.radians(4 * s),
        },
    }


def render_frame(parts, output_dir, frame_index, frame_count):
    clear_scene()
    setup_camera()
    pose = walk_pose(frame_index, frame_count)
    pivots = {}
    for name, layout in PART_LAYOUT.items():
        part = parts[name]
        pivot_px = pose["pivots"][name]
        pivots[name] = add_part(part, pivot_px, layout["height"], layout["depth"])
        pivots[name].rotation_euler[1] = pose["rotations"].get(name, 0)

    bpy.context.scene.render.filepath = str(output_dir / f"walk_{frame_index + 1:02d}.png")
    bpy.ops.render.render(write_still=True)


def main():
    args = parse_args()
    metadata = json.loads(METADATA.read_text(encoding="utf-8"))
    parts = {part["name"]: part for part in metadata["parts"]}
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    for frame_index in range(args.frame_count):
        render_frame(parts, output_dir, frame_index, args.frame_count)


if __name__ == "__main__":
    main()
