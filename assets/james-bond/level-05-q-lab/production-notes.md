# Production Notes

## Level Goal

Level 05 turns `have`, `has`, possessive `'s`, and possessive adjectives into a gadget inspection mission. The child agent verifies a watch, x-ray glasses, and a stealth jacket before Agent Q opens the security door.

## Integration

- Background: `generated/q-lab-background.svg` at `1024x576`.
- Props: `generated/interactive-props.svg` at `1536x1024`, using 4x2 cells of `384x512`.
- Guide: `generated/agent-q-spritesheet.svg` at `768x660`, using 4x3 frames of `192x220`.
- Level 05 scenario coordinates were aligned with the visible briefing board, gadget pads, Agent Q position, and security door.
- The laboratory art uses the same warm wood, brass, parchment, navy, and teal visual language as the earlier spy levels.
- The prop atlas uses original, safe gadget designs and contains no readable text or franchise marks.

## Phaser Checklist

1. Open `phaser.html?level=5&reset=1`.
2. Confirm the briefing-board hotspot is centered on the left board.
3. Confirm watch, glasses, and jacket hotspots align with the three table displays.
4. Confirm Agent Q stands clear of the right-side workbench and door.
5. Confirm the security-door hit zone covers the visible door.
6. Complete the level and verify all three inventory crops.
7. Run `npm test` and inspect Level 05 screenshots.
