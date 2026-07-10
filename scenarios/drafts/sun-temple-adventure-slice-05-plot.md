# Sun Temple Adventure Slice 05 Plot

This file begins Workstream 6: the Observatory approach and Sun Observatory finale must be designed as one connected five-lens payoff. It is a design draft only; do not generate art or scenario JSON from it yet.

## Current Status

Status: initial design draft. Slice 4 is live; the Observatory approach, Sun Lens, Observatory Door, and ending are not implemented.

Working title: `The High Observatory`

Primary reward: `Sun Lens`, followed by the final restoration action.

## Entry Promise

After the Mirror Lens is placed, the Compass reveals a locked High Observatory route. The child has already learned that water can open a temple route and that mirrors can carry light. This final unit should combine those discoveries without repeating either puzzle.

```text
four lenses in Compass
  -> High Observatory approach is revealed
  -> one simple receiver makes the high route understandable
  -> Sun Lens is earned from the route itself
  -> full Compass opens Observatory Door
  -> Alex turns one great sun mirror
  -> light visibly returns through the known valley
```

## Proposed Three-Screen Shape

### High Observatory Approach

Alex reaches a safe sunlit cliff path above the temple. The Mirror Hall beam arrives at an old four-part light receiver. Four route marks are already lit, but the receiver points away from the morning opening. One large stone turn-wheel changes it once, sending light into a high niche. The niche opens and reveals the Sun Lens.

This is a synthesis beat, not another mirror maze: the child recognizes that light must face its destination and sees the result immediately.

### Base Camp: Complete The Compass

Alex returns to Base Camp and places the Sun Lens in the Compass. All five positions form one bright route pattern. The Compass is not consumed; it is now the map/control object that opens Observatory Door.

### Observatory Door And Sun Observatory

The complete Compass opens Observatory Door through a visible route-line or stone-ring response. Inside, the Sun Observatory contains one great mirror aimed away from the valley. Alex turns it once. This ceremonial action sets `observatory.great_mirror_aligned` and `valley.light_restored`; the world-state plan controls the visible responses across the known valley.

## Scope Guardrails

- At most one new inventory item: Sun Lens.
- No new NPC, rival, combat, timer, code, or key chain.
- The approach uses one visible turn-wheel state only; it does not repeat Mirror Hall's two-reflection puzzle.
- Observatory Door has one Compass use and no extra reward.
- The finale mirror has one player action and shows the payoff; it is not a final test.
- Final restoration uses the world-state plan's overlays, not new clutter props.

## Questions For The Dependency Graph

1. Should the approach receiver open the Sun Lens niche directly, or first open Observatory Door? Current recommendation: direct niche reveal for fewer stops and a clearer reward.
2. Does the finished Compass open Observatory Door on inspection, or through a non-inventory Compass UI? Preserve the Base Camp placement rhythm without treating the Compass as disposable.
3. Which existing locations join the finale montage, and which remain quiet? Follow `sun-temple-adventure-world-state-plan.md`; do not brighten every screen.

## Compaction Handoff

Next, create the Slice 5 dependency graph. It must resolve the Compass interaction contract, final state facts, exact screen count, map states, restoration order, and browser-test fixture before any Observatory art prompts are written.
