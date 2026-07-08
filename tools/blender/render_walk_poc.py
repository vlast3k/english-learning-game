"""Render an automated Blender walk-cycle POC.

Run through Blender, not system Python:

    blender --background --python tools/blender/render_walk_poc.py -- --output-dir assets/james-bond/level-01-briefing/blender-poc/frames
"""

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


FRAME_COUNT = 8
RENDER_W = 192
RENDER_H = 220


def parse_args():
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--frame-count", type=int, default=FRAME_COUNT)
    return parser.parse_args(args)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = 0.68
    return mat


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_ellipsoid(name, location, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    return obj


def add_box(name, location, scale, mat, rotation_z=0):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=(0, 0, rotation_z))
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    return obj


def add_limb(name, start, end, radius, mat):
    start_v = Vector(start)
    end_v = Vector(end)
    midpoint = (start_v + end_v) / 2
    direction = end_v - start_v
    bpy.ops.mesh.primitive_cylinder_add(vertices=18, radius=radius, depth=direction.length, location=midpoint)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return obj


def foot_end(hip_x, hip_z, phase, side):
    stride = 0.46 * math.sin(phase + side * math.pi)
    lift = max(0, math.cos(phase + side * math.pi)) * 0.12
    knee_bend = 0.18 * max(0, math.sin(phase + side * math.pi))
    knee = (hip_x + stride * 0.42, -0.03 * side, hip_z - 0.38 + lift + knee_bend)
    ankle = (hip_x + stride, -0.03 * side, hip_z - 0.82 + lift)
    return knee, ankle


def hand_end(shoulder_x, shoulder_z, phase, side):
    swing = -0.34 * math.sin(phase + side * math.pi)
    elbow = (shoulder_x + swing * 0.42, -0.03 * side, shoulder_z - 0.43)
    hand = (shoulder_x + swing, -0.03 * side, shoulder_z - 0.82)
    return elbow, hand


def build_character(frame_index, frame_count, mats):
    phase = 2 * math.pi * frame_index / frame_count
    bob = 0.045 * math.cos(phase * 2)

    # Back-side limbs first so the near side reads clearly.
    for side in (1, -1):
        hip = (0.0, -0.04 * side, 0.88 + bob)
        knee, ankle = foot_end(hip[0], hip[2], phase, side)
        limb_mat = mats["pants_far"] if side == 1 else mats["pants"]
        boot_mat = mats["boot_far"] if side == 1 else mats["boot"]
        add_limb(f"leg_upper_{side}", hip, knee, 0.082, limb_mat)
        add_limb(f"leg_lower_{side}", knee, ankle, 0.072, limb_mat)
        add_box(f"boot_{side}", (ankle[0] + 0.11, ankle[1], ankle[2] - 0.035), (0.2, 0.085, 0.055), boot_mat, -0.08)

    add_ellipsoid("torso", (0, 0, 1.43 + bob), (0.34, 0.19, 0.48), mats["jacket"])
    add_box("shirt", (0.06, -0.012, 1.4 + bob), (0.11, 0.02, 0.32), mats["shirt"], 0.06)
    add_box("strap", (-0.05, -0.21, 1.41 + bob), (0.055, 0.035, 0.52), mats["strap"], -0.58)
    add_ellipsoid("satchel", (-0.33, -0.24, 1.13 + bob), (0.18, 0.065, 0.18), mats["bag"])
    add_ellipsoid("neck", (0.16, 0, 1.91 + bob), (0.12, 0.1, 0.1), mats["skin"])
    add_ellipsoid("head", (0.24, 0, 2.2 + bob), (0.26, 0.21, 0.31), mats["skin"])
    add_ellipsoid("hair", (0.16, -0.01, 2.39 + bob), (0.29, 0.22, 0.12), mats["hair"])
    add_ellipsoid("eye", (0.47, -0.16, 2.23 + bob), (0.025, 0.018, 0.035), mats["eye"])

    for side in (1, -1):
        shoulder = (0.0, -0.035 * side, 1.7 + bob)
        elbow, hand = hand_end(shoulder[0], shoulder[2], phase, side)
        sleeve_mat = mats["jacket_far"] if side == 1 else mats["jacket"]
        add_limb(f"arm_upper_{side}", shoulder, elbow, 0.066, sleeve_mat)
        add_limb(f"arm_lower_{side}", elbow, hand, 0.056, sleeve_mat)
        add_ellipsoid(f"hand_{side}", hand, (0.07, 0.055, 0.08), mats["skin"])


def setup_scene(output_dir):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in {item.identifier for item in scene.render.bl_rna.properties["engine"].enum_items} else "BLENDER_EEVEE"
    scene.render.resolution_x = RENDER_W
    scene.render.resolution_y = RENDER_H
    scene.render.film_transparent = True
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(output_dir / "frame")

    bpy.ops.object.light_add(type="AREA", location=(0, -3.5, 4.2))
    light = bpy.context.object
    light.name = "softbox"
    light.data.energy = 520
    light.data.size = 5

    bpy.ops.object.camera_add(location=(0.12, -6.2, 1.32))
    camera = bpy.context.object
    camera.name = "sprite_camera"
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 3.22
    look_at(camera, (0.12, 0, 1.32))
    scene.camera = camera


def render_frames(output_dir, frame_count):
    mats = {
        "skin": material("skin", (0.94, 0.56, 0.31, 1)),
        "hair": material("hair", (0.16, 0.09, 0.035, 1)),
        "eye": material("eye", (0.03, 0.025, 0.02, 1)),
        "jacket": material("jacket", (0.04, 0.11, 0.18, 1)),
        "jacket_far": material("jacket_far", (0.025, 0.075, 0.13, 1)),
        "shirt": material("shirt", (0.82, 0.75, 0.6, 1)),
        "strap": material("strap", (0.38, 0.21, 0.09, 1)),
        "bag": material("bag", (0.28, 0.17, 0.08, 1)),
        "pants": material("pants", (0.46, 0.34, 0.2, 1)),
        "pants_far": material("pants_far", (0.34, 0.25, 0.16, 1)),
        "boot": material("boot", (0.18, 0.095, 0.035, 1)),
        "boot_far": material("boot_far", (0.11, 0.06, 0.025, 1)),
    }
    for index in range(frame_count):
        clear_scene()
        setup_scene(output_dir)
        build_character(index, frame_count, mats)
        bpy.context.scene.frame_set(index + 1)
        bpy.context.scene.render.filepath = str(output_dir / f"walk_{index + 1:02d}.png")
        bpy.ops.render.render(write_still=True)


def main():
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    render_frames(output_dir, args.frame_count)


if __name__ == "__main__":
    main()
