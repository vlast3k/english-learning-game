# Director Guide Source Panel Prompt

Use case: illustration-story
Asset type: NPC source panel for Phaser guide spritesheet extraction, target canvas flexible but compatible with 4 columns x 3 rows
Primary request: Create a kid-friendly headquarters director NPC who functions like the current guide character.
Subject: A warm, clever mission director, adult but friendly, standing beside a briefing table. They wear a neat waistcoat or blazer, round glasses, a headset earpiece, and hold a clipboard or mission folder. No weapons. Their body language is encouraging, like a teacher guiding a child through a spy puzzle.
Canvas/layout:
- Arrange 12 full-body poses in a clean 4 columns x 3 rows grid.
- Row 1: calm idle variations.
- Row 2: talking variations with small mouth/hand changes.
- Row 3: pointing/explaining variations aimed toward the mission screen or dossier board.
- Use a flat chroma-key green background if possible, since `tools/extract_painted_sprites.py` removes green for guide extraction.
- Leave generous padding around every pose and keep the feet aligned to a consistent baseline.
Style: Painted storybook game character matching the current guide/hero asset quality, readable at `192x220`, friendly and expressive.
Avoid: Real actor likenesses, stern militaristic look, weapons, medals resembling real agencies, text labels, deep shadows, cropped feet, merged hands, photorealism.
Output: One source panel image suitable for extraction into `768x660` guide spritesheet frames.

