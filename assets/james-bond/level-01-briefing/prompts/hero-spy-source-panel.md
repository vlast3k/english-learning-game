# Hero Spy Source Panel Prompt

Use case: illustration-story
Asset type: Character source panel for Phaser extraction, target canvas `1536x1024`
Primary request: Create a source panel for a kid secret-agent hero that can be extracted into the existing Phaser hero spritesheet format.
Input images: Use `assets/phaser/hero-painted-spritesheet.png` as a style and layout reference only. Do not copy the explorer outfit; create a new child spy outfit.
Subject: A cheerful 8-10-year-old kid secret agent, friendly and brave, wearing a navy field jacket, light shirt, soft scarf, simple trousers or shorts, practical boots, and a small crossbody gadget pouch. No weapons. The design should be readable at small game scale and match the current painted character proportions: large expressive head, compact body, warm storybook brushwork.
Canvas/layout:
- Overall canvas: `1536x1024`, light off-white paper background that can be removed by `tools/extract_painted_sprites.py`.
- Upper left panel, x roughly `60-400`, y `34-690`: full-body front idle pose.
- Upper middle panel, x roughly `430-770`, y `38-690`: full-body right-facing side idle pose.
- Upper right panel, x roughly `800-1095`, y `36-690`: full-body back idle pose.
- Bottom row, y roughly `690-1024`: eight right-facing side-walk poses laid out left to right, evenly spaced, full body visible.
- Portrait panel, x roughly `1020-1536`, y `30-620`: six bust portraits with normal, curious, smile, surprised, thinking, and focused expressions.
Rigging constraints:
- The side idle pose must have two visibly separate legs below the shorts/trouser hem around the lower torso.
- Boots must be separated and not fused by shadow.
- Arms and hands must be visible, slightly away from the torso, and suitable for counter-swing in walking.
- Avoid long coats, dangling straps, gadgets, or bags crossing over the legs.
- Keep a clear hip/hem line; the walk-cycle script may cut around `HEM_Y = 161`, rotate legs by about `SWING_DEG = 34`, and lift a foot by about `FOOT_LIFT = 15`.
Walk cycle guidance:
- Eight side-walk poses should show believable alternating foot contact: contact, passing, contact, passing, mirrored through the cycle.
- Hands swing opposite the feet, but remain child-safe and uncluttered.
- Feet should stay near a consistent baseline so the character does not bounce excessively when placed in a `192x220` frame.
Style: Same polished painted storybook game art as the current hero-painted spritesheet, clean silhouette, crisp edges, transparent-ready against a removable paper background.
Avoid: Real spy franchise logos, tuxedo parody, actor likenesses, weapons, hard noir realism, tiny unreadable gadgets, merged feet, heavy cast shadows, cropped hats or boots, text.
Output: One complete source panel image, no grid lines, no labels, no watermark.

