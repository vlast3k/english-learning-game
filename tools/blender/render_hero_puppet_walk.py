"""Render a layered 2D painted hero puppet walk cycle in Blender."""

import argparse
import json
import math
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
PUPPET_DIR = ROOT / "assets/james-bond/level-01-briefing/blender-puppet"
FRAME_W = 192
FRAME_H = 220


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
    """Build a fully shadeless material so the painted texture keeps its true
    colors. Lit shaders (Principled BSDF + weak lights) collapsed the painted
    jacket and boots into near-black, which made the walk look like a
    silhouette. Emission + alpha-driven transparency renders flat 2D art."""
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


def add_layer(layer):
    x0, y0, x1, y1 = layer["bbox"]
    px, py = layer["pivot"]
    pivot_world = px_to_world(px, py)
    center_world = px_to_world((x0 + x1) / 2, (y0 + y1) / 2)
    width = x1 - x0
    height = y1 - y0
    empty = bpy.data.objects.new(f"{layer['name']}_pivot", None)
    empty.location = (pivot_world[0], layer["depth"], pivot_world[2])
    bpy.context.collection.objects.link(empty)

    mesh = bpy.data.meshes.new(f"{layer['name']}_mesh")
    local_center = (center_world[0] - pivot_world[0], 0, center_world[2] - pivot_world[2])
    verts = [
        (local_center[0] - width / 2, 0, local_center[2] - height / 2),
        (local_center[0] + width / 2, 0, local_center[2] - height / 2),
        (local_center[0] + width / 2, 0, local_center[2] + height / 2),
        (local_center[0] - width / 2, 0, local_center[2] + height / 2),
    ]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for loop, uv in zip(uv_layer.data, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop.uv = uv
    obj = bpy.data.objects.new(layer["name"], mesh)
    obj.parent = empty
    obj.data.materials.append(make_material(layer["name"], layer["path"]))
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

    bpy.ops.object.light_add(type="AREA", location=(0, -120, 80))
    light = bpy.context.object
    light.name = "puppet_flat_light"
    light.data.energy = 650
    light.data.size = 260

    bpy.ops.object.camera_add(location=(0, -500, 0), rotation=(math.radians(90), 0, 0))
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = FRAME_H
    scene.camera = camera


def pose_layers(pivots, frame_index, frame_count):
    phase = 2 * math.pi * frame_index / frame_count
    s = math.sin(phase)
    c = math.cos(phase)
    bob = abs(s) * 2.2
    sway = math.sin(phase + math.pi / 2) * 0.9

    for name in ("torso_bag", "head"):
        pivots[name].location.x += sway
        pivots[name].location.z += bob
        pivots[name].rotation_euler[1] = math.radians(-s * 1.4)

    pivots["back_leg"].rotation_euler[1] = math.radians(24 * s)
    pivots["front_leg"].rotation_euler[1] = math.radians(-24 * s)
    pivots["back_leg"].location.z += max(0, -c) * 5.0
    pivots["front_leg"].location.z += max(0, c) * 5.0
    pivots["rear_arm"].rotation_euler[1] = math.radians(-18 * s)
    pivots["front_arm"].rotation_euler[1] = math.radians(16 * s)


def render_frame(metadata, output_dir, frame_index, frame_count):
    clear_scene()
    setup_camera()
    pivots = {layer["name"]: add_layer(layer) for layer in metadata["layers"]}
    pose_layers(pivots, frame_index, frame_count)
    bpy.context.scene.render.filepath = str(output_dir / f"walk_{frame_index + 1:02d}.png")
    bpy.ops.render.render(write_still=True)


def main():
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    metadata = json.loads((PUPPET_DIR / "metadata.json").read_text(encoding="utf-8"))
    for frame_index in range(args.frame_count):
        render_frame(metadata, output_dir, frame_index, args.frame_count)


if __name__ == "__main__":
    main()
