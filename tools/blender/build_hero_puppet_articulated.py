"""Split the flat painted limb cutouts into articulated segments.

The single-piece leg and arm cutouts rotate as rigid pendulums, which reads as a
stiff, sliding pose. This splits each leg into thigh + shin(+boot) and each arm
into upper + forearm so the walk renderer can bend the knee and elbow and produce
a real stride.

Reads the flat layer cutouts described by
`blender-puppet/metadata.json` and writes articulated segment PNGs plus
`blender-puppet/metadata_articulated.json`.
"""

import json
from pathlib import Path

from PIL import Image
from collections import deque


ROOT = Path(__file__).resolve().parents[2]
PUPPET_DIR = ROOT / "assets/james-bond/level-01-briefing/blender-puppet"
SEG_DIR = PUPPET_DIR / "segments"

# Depth in world Y. Camera looks toward +Y, so smaller (more negative) is closer
# to camera == drawn in front. Front limbs must be closer than the torso.
DEPTH = {
    "back_arm": 0.06,
    "back_leg": 0.05,
    "torso_bag": 0.0,
    "head": -0.01,
    "front_leg": -0.05,
    "front_arm": -0.06,
}

KNEE_RATIO = 0.52
ELBOW_RATIO = 0.50
OVERLAP = 20
# Draw the proximal segment (thigh/upper arm) slightly in front of the distal
# segment (shin/forearm) so the proximal art always covers the horizontal cut
# edge as the joint bends. Without this the cut line shows as a broken limb.
JOINT_DEPTH_DELTA = 0.008


def load_flat_layers():
    meta = json.loads((PUPPET_DIR / "metadata.json").read_text(encoding="utf-8"))
    return {layer["name"]: layer for layer in meta["layers"]}


def keep_largest_component(img, min_alpha=40):
    """Drop every alpha island except the biggest one.

    Stray boot slivers, glove fragments, and bag-strap bits get separated from
    the main limb when it is cut; if they survive they render as floating
    'skeleton' fragments once the limb rotates. Keeping only the largest blob
    removes them."""
    alpha = img.getchannel("A")
    w, h = img.size
    data = alpha.load()
    seen = [[False] * w for _ in range(h)]
    best = []
    best_size = 0
    for sy in range(h):
        for sx in range(w):
            if seen[sy][sx] or data[sx, sy] < min_alpha:
                continue
            stack = [(sx, sy)]
            seen[sy][sx] = True
            comp = []
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and data[nx, ny] >= min_alpha:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if len(comp) > best_size:
                best_size = len(comp)
                best = comp
    if not best:
        return img
    keep = set(best)
    out = img.copy()
    px = out.load()
    for y in range(h):
        for x in range(w):
            if data[x, y] and (x, y) not in keep:
                px[x, y] = (0, 0, 0, 0)
    return out


def solidify_overlap_band(top_img, band_rows):
    """Force the bottom `band_rows` of the proximal segment to full opacity
    wherever the limb already exists, so it cleanly hides the distal segment's
    cut edge instead of double-exposing through feathered alpha (the corn-cob
    banding at the knee/elbow)."""
    out = top_img.copy()
    w, h = out.size
    px = out.load()
    start = max(0, h - band_rows)
    for y in range(start, h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a >= 40:
                px[x, y] = (r, g, b, 255)
    return out


def split_limb(entry, base_name, ratio, distal_name, proximal_name):
    img = Image.open(ROOT / entry["path"]).convert("RGBA")
    img = keep_largest_component(img)
    x0, y0, x1, y1 = entry["bbox"]
    px, py = entry["pivot"]
    center_x = (x0 + x1) / 2
    foot_y = y1
    joint_y = py + ratio * (foot_y - py)
    row = int(round(joint_y - y0))
    row = max(OVERLAP, min(img.height - OVERLAP, row))

    top_img = img.crop((0, 0, img.width, min(img.height, row + OVERLAP)))
    bot_img = img.crop((0, max(0, row - OVERLAP), img.width, img.height))
    top_img = keep_largest_component(top_img)
    bot_img = keep_largest_component(bot_img)
    top_img = solidify_overlap_band(top_img, 2 * OVERLAP)

    top_path = SEG_DIR / f"{base_name}_{proximal_name}.png"
    bot_path = SEG_DIR / f"{base_name}_{distal_name}.png"
    top_img.save(top_path)
    bot_img.save(bot_path)

    depth = DEPTH[base_name]
    chain = [
        {
            "name": f"{base_name}_{proximal_name}",
            "path": str(top_path.relative_to(ROOT)),
            "bbox": [x0, y0, x1, y0 + top_img.height],
            "joint": [px, py],
            "depth": depth - JOINT_DEPTH_DELTA,
        },
        {
            "name": f"{base_name}_{distal_name}",
            "path": str(bot_path.relative_to(ROOT)),
            "bbox": [x0, y0 + max(0, row - OVERLAP), x1, y1],
            "joint": [center_x, joint_y],
            "depth": depth,
        },
    ]
    return chain


def static_layer(entry):
    return {
        "name": entry["name"],
        "path": entry["path"],
        "bbox": entry["bbox"],
        "joint": entry["pivot"],
        "depth": DEPTH.get(entry["name"], entry.get("depth", 0.0)),
    }


def whole_limb(entry, base_name, dx=0.0):
    """Emit a single-segment limb (no knee/elbow split).

    Splitting the leg into thigh + shin produced an L-shaped notch at the knee
    whenever the shin rotated past the thigh silhouette — the 'broken/skeleton
    leg' artifact. A whole leg cutout swinging from the hip stays one clean,
    properly drawn limb. `dx` translates the whole limb (both its drawn quad and
    its pivot) horizontally so the far leg sits beside the near one as a distinct
    full leg instead of hiding directly behind it and showing only a thin strip."""
    img = Image.open(ROOT / entry["path"]).convert("RGBA")
    img = keep_largest_component(img)
    seg_path = SEG_DIR / f"{base_name}.png"
    img.save(seg_path)
    x0, y0, x1, y1 = entry["bbox"]
    bbox = [x0 + dx, y0, x1 + dx, y1]
    joint = [entry["pivot"][0] + dx, entry["pivot"][1]]
    return [
        {
            "name": base_name,
            "path": str(seg_path.relative_to(ROOT)),
            "bbox": bbox,
            "joint": joint,
            "depth": DEPTH[base_name],
        }
    ]


def main():
    SEG_DIR.mkdir(parents=True, exist_ok=True)
    flat = load_flat_layers()

    chains = {
        "back_leg": whole_limb(flat["back_leg"], "back_leg", dx=-9.0),
        "front_leg": whole_limb(flat["front_leg"], "front_leg", dx=2.0),
        "back_arm": whole_limb(flat["rear_arm"], "back_arm"),
        "front_arm": whole_limb(flat["front_arm"], "front_arm"),
    }
    statics = [static_layer(flat["torso_bag"]), static_layer(flat["head"])]

    metadata = {
        "frame_width": 192,
        "frame_height": 220,
        "statics": statics,
        "chains": chains,
    }
    (PUPPET_DIR / "metadata_articulated.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    print(f"Wrote {PUPPET_DIR / 'metadata_articulated.json'}")
    for name, chain in chains.items():
        print(name, [seg["name"] for seg in chain])


if __name__ == "__main__":
    main()
