# Sun Temple Adventure: Creative Proposal To Playable Action Plan

This document turns `sun-temple-adventure-final-creative-design-proposal.md` into concrete work. It is the implementation companion to that proposal, not a replacement for it.

Read first:

1. `sun-temple-adventure-final-creative-design-proposal.md`
2. `sun-temple-adventure-current-walkthrough.md`
3. `sun-temple-adventure-next-steps.md`

## Decision Summary

Adopt the proposal's central direction:

```text
Observe the valley -> understand connected water and light systems -> repair them -> restore sunlight to the garden.
```

Do not attempt to apply every suggestion as new dialogue or a new prop. The current game is already playable through the Stone Lens. The work should make its existing actions clearer and more emotionally connected, then build the remaining campaign using the same adventure rules.

## What Is Already Playable

The current implementation already proves the proposed core loop:

| Proposal principle | Live example |
| --- | --- |
| help people and observe the world | return Lina's basket to receive the Green Lens clue |
| use a practical item on an obstacle | consume rope to repair the bridge |
| combine meaningful objects | map pieces -> map; jar + glow leaf -> glow jar |
| revisit a known place for a new reason | use Waterfall Mouth to fill the stone cup later |
| keep state changes visible | tied rope, lit cave, open box, open temple gate, placed lenses |
| grow the map through discovery | Green -> Waterfall, Blue -> Temple Steps, Stone -> Mirror Hall |

The proposal should therefore sharpen the existing structure, not rewrite it.

## Proposal Review And Disposition

| Feedback area | Decision | Concrete interpretation |
| --- | --- | --- |
| Missing-sunlight mystery and drooping Base Camp flower | adopt | Add one visible Base Camp state prop and one concise opening interaction before revising later dialogue. |
| Alex as curious, increasingly confident explorer | adopt | Add a small number of state-change reactions; do not narrate routine pickups. |
| Mira as partial-knowledge companion | adopt | Replace repeated generic compass lines with one short evolving line per lens placement or major discovery. |
| Lina as the garden's human connection | adopt | Strengthen basket/seeds/light relationship in existing lines; reserve her final reaction for the ending. |
| Discovery before explanation | adopt | Give each current obstacle a visible clue before its required hint. Do not front-load temple lore. |
| Progressive hints | adopt in a lightweight form | Add ordered observation -> relationship -> remembered-place hints to key puzzles. Do not add a new hint minigame. |
| More intentional interactions than repeated `look` | adopt selectively | Replace only the branch's repeated-inspect ambiguity and similar cases with explicit state feedback; do not add a verb UI yet. |
| Water activation needs a visible beat | adopt | Add a short success sequence before courtyard travel becomes prominent; keep the solved state persistent. |
| Mirror Hall light puzzle | adopt as Slice 4 | Design its exact beam, mirror states, reward, and observatory unlock before generating art. |
| Observatory finale and valley-wide payoff | adopt as final slice | Define the final state-overlay package before any finale art. |
| More NPCs, errands, tools, or collectible economy | reject for now | Keep Mira and Lina as the only named NPCs. Every new item must have one visible dependency role. |
| Villain, countdown, combat, chosen-one framing | reject | Preserve the repair-and-discovery tone. |

## Guardrails

These rules apply to every action below.

- Do not change existing hotspot coordinates or radii while implementing narrative polish. The user owns the alignment pass.
- Keep no more than one required idea in a mandatory dialogue bubble.
- Required clues must be short, concrete, and curriculum-reviewed. Optional atmosphere may be slightly richer.
- Do not place a new collectible in art unless it has a rule, inventory fate, and visible use.
- Do not add a puzzle between a mechanism and its promised reward.
- Preserve instant map travel and the Base Camp Compass hub.
- Keep `Mirror Hall` locked until Slice 4 is designed and implemented.
- Do not add grammar-question progression.

## Workstream 0: Establish The Canonical Narrative Baseline

**Goal:** make the proposal the source of creative intent without allowing it to overwrite facts about the live build.

### Actions

1. Keep `sun-temple-adventure-current-walkthrough.md` as the factual current-state record.
2. Keep `sun-temple-adventure-final-creative-design-proposal.md` as the creative target.
3. Add this action plan to the compaction reading order.
4. Create one new `sun-temple-adventure-story-dialogue-ledger.md` before editing player-facing lines. It must classify every line as `required clue`, `state reaction`, `optional flavour`, or `map/Compass response`, and give Bulgarian text plus a curriculum status.

### Acceptance Criteria

- A later agent can identify what is playable, what is planned, and what is approved but not implemented.
- No current scenario JSON is changed in this workstream.

## Workstream 1: Make The Opening Mystery Visible

**Goal:** establish why Alex cares before the first map puzzle, while keeping the immediate action simple.

### Content Actions

1. Promote the existing drooping sun flower already painted at Base Camp into a story state. It should point toward the temple direction and read as a living thing that needs light, not as another collectible.
2. Add one `sun_flower` inspect hotspot at Base Camp, with a one-time opening exchange:

   ```text
   Alex: This flower is leaning away from the shade.
   Mira: It always faced the temple. Now the light never reaches it.
   ```

3. Revise the first Compass inspection to preserve uncertainty:

   ```text
   Mira: Five lenses are missing. The Compass changed when the light faded.
   Alex: Then the lenses may show us what happened.
   ```

4. Keep the required next action immediately visible: take the torn map. The flower and Compass are story context, not new locks.

### Asset Actions

1. No flower asset is needed for the current opening pass: the accepted Base Camp background already contains a clear drooping flower.
2. Defer a future restored-flower overlay until the campaign-wide final-state package is designed.

### Engine Actions

1. Emit a `scene.entered` adventure event after content, engine state, overlays, and actor placement are ready.
2. Support `once: true` rules on `scene.entered` so opening/arrival reactions occur once per campaign, not on every map return.
3. Do not introduce a cutscene system. Engine-driven speech bubbles are sufficient.

### Files Expected To Change

- `game-engine/phaser-bridge.js`
- `scenarios/sun-temple-adventure-base-camp-table-content.json`
- `game-engine/missions/sun-temple-adventure-slice-01.json`
- shared story-state atlas prompt, generated PNG, and frame manifest
- `sun-temple-adventure-story-dialogue-ledger.md`
- Slice 1 browser smoke test

### Acceptance Criteria

- On a fresh campaign, the child can notice why the valley's light matters before leaving camp.
- The flower is not takeable, does not block progress, and remains visible until the final future restoration state.
- Existing map, rope, branch, and first-lens flow still passes browser smoke coverage.

## Workstream 2: Polish The Existing Three Slices Into One Story

**Goal:** add only the high-value information and visible evidence recommended by the proposal.

### 2A. Interaction Clarity

| Existing beat | Concrete action | Required visible evidence |
| --- | --- | --- |
| Camp Edge branch | Show a small corner of map paper beneath the branch; first interaction explains it, second performs the state change with an explicit line | map corner before move; full map piece after move |
| Jungle Path sun stone | Add one optional line: `Someone marked this path with a sun.` | existing stone remains scenery, not a puzzle |
| Broken Bridge basket | Add one optional first-look line: `A basket on the other side. Someone must be looking for it.` | basket remains visibly unreachable before repair |
| Village Garden seeds | Revise Lina's functional lines so basket, seeds, and planting beds are connected | no new item or chore |
| Keeper Hut shelf | Add optional plant/light observation; keep jar as the only required item | no extra tool |
| Waterfall Mouth leaf | Add one meaningful Alex reaction to the glow leaf and a clear pool-use line for the later cup return | leaf and pool remain visually distinct |
| Dark Cave wall and box | Add a visible seam/marking before key reveal and mention the keyhole on the box | no random search or key chain |
| Temple Steps channel | Replace generic first line with observation -> water relationship -> remembered waterfall hint sequence | channel, cup rest, gate, and waterfall remain legible |
| Sun Courtyard flower | Stage entrance so the water/flower result is immediately read before the lens pickup | no extra puzzle after gate |

### 2B. Dialogue Budget

Implement these limits in the dialogue ledger before adding text:

- One first-arrival or discovery reaction per major region.
- One required clue per main obstacle.
- One state-change reaction per major solution.
- Optional inspect lines only for scenery that reinforces place, relationship, water, light, growth, or route motifs.
- Routine item pickups keep their existing short confirmations unless their story meaning is otherwise invisible.

### 2C. Mira And Lina Progression

Add only these required Compass/relationship beats:

| State | Speaker | Story job |
| --- | --- | --- |
| Green Lens placed | Mira | say that the lens revealed an old route beside water |
| Blue Lens placed | Mira | notice that cave and river routes form one connected system |
| Stone Lens placed | Mira | point to Mirror Hall and ask how light can exist inside the temple |
| Future ending | Lina then Mira | pay off the garden and the whole journey |

The first three lines are content polish. The ending lines are deferred until the finale state is real.

### 2D. Engine And UI Support

1. Preserved the existing Bulgarian hover translation system and added translations for the new story words.
2. Implemented the required compact progression on the Sun Channel through existing one-time/priority rules: `dry` -> `water paths` -> `waterfall can fill cup`.
3. Used explicit player inspection for that progression. A new generic hint-request UI is deferred until child playtesting shows that repeated inspection is insufficient.
4. Recorded required clue, state reaction, optional flavour, and map response kinds in the dialogue ledger. Runtime-specific styling is deferred; no puzzle rule depends on a visual label.
5. Used the existing success dialogue bubble as the short state-reveal beat after water activation. It keeps input paused while the persistent water and gate state becomes visible, without adding a timed lock.

### Files Expected To Change

- Slice 1-3 scenario JSON files and shared mission manifest
- `tools/sun-temple-adventure-smoke-test.mjs`
- `tools/sun-temple-adventure-slice-02-smoke-test.mjs`
- `tools/sun-temple-adventure-slice-03-smoke-test.mjs`
- `sun-temple-adventure-story-dialogue-ledger.md`

### Acceptance Criteria

- A child can infer every obstacle before the strongest hint appears.
- No existing story route gains a mandatory new item or extra screen.
- Each lens placement changes both Compass state and the player's understanding of the valley system.
- The existing three-slice smoke flows remain valid after copy changes.

## Workstream 3: Campaign-Wide Visual State Package

**Goal:** plan the recurring light-and-repair payoff now, without generating finale assets before their puzzle and composition requirements exist.

### Actions

1. Create `sun-temple-adventure-world-state-plan.md` with a state table for every existing and planned region:

   ```text
   normal -> clue discovered -> mechanism repaired -> final sunlight restored
   ```

2. Specify exact final-state changes before making finale art:
   - Base Camp flower rises and turns toward the temple.
   - Village Garden brightens; Lina's plants turn toward light.
   - Waterfall, Temple Steps, Sun Courtyard, Mirror Hall, and Observatory each show a connected light-route response.
   - Map changes from repaired/local routes to a complete bright map.
3. Treat the existing Base Camp drooping flower as accepted baked-in opening art. Do not generate a flower overlay yet: its restored counterpart needs a confirmed finale composition and masking plan. Defer all final-restoration overlays until the finale design and composition are approved.
4. Use overlays and state art rather than regenerating whole backgrounds wherever the background remains structurally valid.

### Acceptance Criteria

- The final payoff is designed as one connected system, not as unrelated brightened backgrounds.
- Art prompts list every state dependency and exclude decorative props without a state role.

### Completion Record

Completed in `sun-temple-adventure-world-state-plan.md`.

- The plan preserves live local facts and reserves one global `valley.light_restored` fact for the final Observatory action.
- Every current and future region now has a normal/clue, local-solved, and final-response decision.
- Required, optional, and rejected final-state art are separated so no new finale art is generated before Mirror Hall and the Observatory are designed.
- The final visual order is fixed: Observatory -> Mirror Hall -> Temple -> Courtyard -> Waterfall -> Garden -> Base Camp.

## Workstream 4: Design Slice 4, Mirror Hall, Before Art

**Goal:** turn the proposal's Mirror Hall into a complete, child-readable vertical slice.

### Required Design Deliverables

Create and review these before asset prompts:

1. `sun-temple-adventure-slice-04-plot.md`
2. `sun-temple-adventure-slice-04-dependency-graph.md`
3. `sun-temple-adventure-slice-04-screen-prop-map.md`
4. `sun-temple-adventure-slice-04-curriculum-ledger.md`
5. `sun-temple-adventure-slice-04-art-director-review.md`
6. `sun-temple-adventure-slice-04-asset-plan.md`

### Locked Slice-4 Shape

```text
Stone Lens placed
  -> Mirror Hall marker becomes usable
  -> one visible light source enters the hall
  -> one fixed reflection teaches the rule
  -> child changes a small number of mirror/panel states
  -> every correct state visibly extends the beam
  -> beam reaches a sealed sun panel
  -> panel reveals Mirror Lens and opens Observatory Door route
  -> Mirror Lens placement reveals the high observatory approach
```

### Mirror Hall Design Constraints

- Use three visual ideas only: source, mirrors, destination.
- Limit the puzzle to two or three meaningful states. No random rotation or hidden combinations.
- Wrong states must leave the current beam visible and suggest what changed.
- No unrelated key, code, or fetch chain.
- The Mirror Lens is the immediate reward after the beam reaches the panel.
- `Observatory Door` is a visible forward hook, not another instant puzzle.

### Engine Decision Gate

Before implementation, choose one of these based on the approved dependency graph:

- **Preferred:** declarative state targets with a small finite `mirror_state` fact and beam overlays. This fits the existing engine.
- **Only if required by the approved puzzle:** add a constrained rotate/cycle interaction to hotspots. It must expose readable state labels and support browser testing.

Do not build free-form physics mirrors or a generic puzzle editor.

### Acceptance Criteria

- The player can predict each mirror action from the beam's current path.
- The screen tells its story visually before Mira explains it.
- Slice 4 uses at most one new inventory reward: Mirror Lens.

### Completion Record

Completed in the Slice 4 design package:

- `sun-temple-adventure-slice-04-plot.md`
- `sun-temple-adventure-slice-04-dependency-graph.md`
- `sun-temple-adventure-slice-04-screen-prop-map.md`
- `sun-temple-adventure-slice-04-curriculum-ledger.md`
- `sun-temple-adventure-slice-04-art-director-review.md`
- `sun-temple-adventure-slice-04-asset-plan.md`

The approved design uses a single Mirror Hall screen, a fixed teaching reflection, two one-way declarative mirror states, a visible panel reward, and no new engine puzzle system. Art and scenario implementation are complete in Workstream 5.

## Workstream 5: Implement And Verify Slice 4

**Goal:** make Mirror Hall playable with the same data-driven discipline as Slices 1-3.

### Actions

1. Generate Mirror Hall background and one transparent state atlas only after design review.
2. Create the Mirror Hall scenario JSON and add the Observatory Door forward marker to all map configurations.
3. Extend the shared mission manifest with mirror state, beam state, Mirror Lens, and map facts.
4. Add texture-frame registration and state overlays.
5. Add a dedicated Slice 4 browser smoke test that proves every beam state, Mirror Lens retrieval, Compass placement, and Observatory Door reveal.
6. Let the user align new hotspots before final visual regression.

### Acceptance Criteria

- Existing slices still pass their smoke tests.
- Mirror Hall can be completed from a fresh Slice-3-complete state.
- The map communicates why Observatory Door is still unavailable or newly available.

### Completion Record

Completed with one new Mirror Hall background, one chroma-key-derived alpha atlas, a Slice 4 frame manifest, scenario JSON, shared mission rules, Base Camp fourth-lens state, map transitions, and `tools/sun-temple-adventure-slice-04-smoke-test.mjs`.

- The puzzle is implemented as durable facts and state overlays, with no free-rotation UI or new puzzle engine.
- The high observatory hook becomes visible but disabled only after Mirror Lens placement.
- Existing Slice 1-3 and new Slice 4 browser smoke coverage passes.
- New Mirror Hall hotspot coordinates and radii are starter values only; the user owns the alignment pass.

## Workstream 6: Design The Observatory Approach And Finale Together

**Goal:** avoid splitting the fifth lens and the final payoff into disconnected content.

### Required Design Decisions

1. Decide exactly where the Sun Lens appears: on the high observatory approach or at Observatory Door after a final environmental alignment.
2. Define one synthesis puzzle using learned ideas: map routes, visible light direction, and old mechanisms. It must not repeat the Mirror Hall puzzle or add a new inventory scavenger hunt.
3. Decide how the complete Compass acts at Observatory Door without being consumed.
4. Define the final mirror interaction as one ceremonial action, not another complex puzzle.
5. Define the final world-state overlay table before generating any finale backgrounds.

### Required Design Deliverables

1. `sun-temple-adventure-slice-05-plot.md`
2. `sun-temple-adventure-slice-05-dependency-graph.md`
3. `sun-temple-adventure-slice-05-screen-prop-map.md`
4. `sun-temple-adventure-slice-05-curriculum-ledger.md`
5. `sun-temple-adventure-slice-05-art-director-review.md`
6. `sun-temple-adventure-slice-05-asset-plan.md`

Treat the Observatory approach and Sun Observatory ending as one design unit even if implementation later splits them into two technical slices.

## Recommended Order Of Work

1. Completed: user aligns Slice 3 hotspots and the dedicated Slice 3 validation passes.
2. Completed: Workstream 0 dialogue ledger and canonical handoff update.
3. Completed: Workstream 1, Base Camp flower and one-time opening mystery. The existing background flower became an inspectable story object, so no new art was required.
4. Completed: Workstream 2, current-slice clues, reactions, and hint sequencing. The blue-box keyhole text and a generic hint UI were intentionally deferred because the present art and child-play evidence do not justify them yet.
5. Completed: Workstream 3, campaign-wide world-state plan. Finale art is deferred until the relevant puzzle and composition designs are approved.
6. Completed: Workstream 4, full Mirror Hall design and independent art-direction review.
7. Completed: Workstream 5, generated and implemented Slice 4. User hotspot alignment is the remaining local visual-edit step.
8. Next: Workstream 6, design Observatory approach and finale as a combined payoff.
9. Generate and implement the final slices only after the final-state art plan is approved.
10. End with a campaign-wide child playtest and a single coordinated polish pass for dialogue, visual states, hotspot alignment, and Bulgarian support.

## Definition Of Playable

The campaign is not merely playable when every marker has a destination. It is playable when:

- a child can see what is wrong before being told the answer;
- each required item has a clear purpose and visible result;
- map travel rewards remembering locations;
- Mira and Lina make the valley feel cared for without interrupting play;
- each lens changes the Compass, map, and the player's understanding;
- the final mirror visibly pays off the bridge, garden, cave, waterfall, temple, and mirror discoveries;
- no gameplay-critical step depends on grammar answers, pixel hunting, random guessing, or an unexplained dead end.
