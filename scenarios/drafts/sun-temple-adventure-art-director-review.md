# Sun Temple Adventure Art Director Review

This file records external/reviewer critique before the prompt pack is written.

Purpose:

- stress-test the story and first-slice staging before image prompts;
- improve adventure feel without breaking the user's constraints;
- preserve which suggestions were accepted, rejected, or deferred after context compaction.

## Review Context

Reviewer lens:

- classic point-and-click adventure art direction;
- readable silhouettes and screen composition;
- memorable location identity;
- clear interactables;
- environmental storytelling;
- no filler props;
- kid-friendly charm.

Hard constraints:

- no rival explorer;
- no grammar-question progression;
- adventure-critical nouns are allowed with Bulgarian support;
- first slice remains six screens: `base-camp-table`, `camp-supply-tent`, `camp-edge`, `jungle-path`, `broken-bridge`, `village-garden`;
- no final image generation yet;
- prompt review is the next production step.

## Reviewer Notes

Status: dedicated reviewer output received and integrated.

Summary:

- The core adventure loop is strong: broken compass -> torn map -> repaired route -> helped NPC -> first lens -> return to compass.
- Prop-budget discipline is strong and should stay.
- The no-rival, valley-as-obstacle direction fits the kid-friendly tone.
- The first slice needs stronger emotional and visual reasons for the mechanics.
- `jungle-path` risks feeling like a hallway unless it gets one memorable visual clue.
- The map repair should be visually satisfying: torn edge matches, river line joins, new marker appears.
- Each screen should have one dominant visual focus before prompts are written.
- The lost basket should be visible but unreachable before the bridge is repaired.
- Lina should need the basket for a concrete reason, such as seeds for the garden.
- The Green Lens hiding place should feel fair through a Lina clue and a small visual sign on the flower pot.
- Placing the Green Lens should reveal the next map marker, making the world feel larger.
- A recurring sun-symbol motif would make the world feel authored.

## Integration Decisions

Use this table after receiving critique.

| Suggestion | Decision | Reason | Files to update |
| --- | --- | --- | --- |
| Give each first-slice screen one dominant visual focus. | accepted | Needed before prompt writing; improves readability and scene identity. | screen prop map, asset plan |
| Make `jungle-path` more memorable with a carved sun stone / river glow / temple glimpse. | accepted | Prevents the screen from becoming a hallway. | world map, screen prop map, asset plan |
| Make the basket visible but unreachable before bridge repair. | accepted | Stronger adventure motivation and clearer bridge purpose. | dependency graph, screen prop map, asset plan |
| Give Lina a concrete need for the basket. | accepted | Adds emotional reason without adding grammar gates. | plot, dependency graph, curriculum ledger |
| Add recurring sun-symbol motif on key props. | accepted | Creates authored world identity without adding new mechanics. | screen prop map, asset plan |
| Make Green Lens placement reveal the Waterfall Cave marker. | accepted | Gives first-slice ending a forward hook and explains the five-lens structure. | plot, world map, dependency graph |
| Make map repair visually satisfying with matching torn edges and joined river line. | accepted | Makes item combining feel like discovery, not only inventory bookkeeping. | screen prop map, asset plan |
| De-emphasize `supply_box`, `backpack`, and `notebook`. | accepted | Avoids false affordances and prop clutter. | screen prop map, asset plan |
| Create rough layout thumbnails before prompts. | deferred | Useful, but prompt files can first encode layout requirements; sketches can be added if prompts feel ambiguous. | none yet |
| Decide whether Sun Compass becomes portable. | deferred | User already deferred until more places are defined. | none yet |

## Integrated Story/Staging Changes

- The valley problem is now more visible: drooping sun flowers show that the valley needs light.
- Each lens is framed as revealing or lighting a new part of the map, not merely filling a progress meter.
- The first slice ends with the Green Lens casting light onto the map and revealing the Waterfall Cave marker.
- Lina needs the lost basket because her seeds are in it.
- Lina's hint points to the flower pot as an old garden clue.
- The `jungle-path` includes a carved sun stone and river glow as a memorable clue.
- The lost basket is visible across the river before the bridge is repaired, but unreachable.
- Supply-tent scenery is visually quiet; the rope remains the only obvious required tool.

## Guardrails For Accepting Suggestions

Accept suggestions that:

- make the first slice feel more like an adventure;
- make screen identities more distinct;
- make player goals clearer through visual staging;
- reduce filler props;
- improve the reason to revisit locations;
- preserve simple English and Bulgarian support.

Reject or defer suggestions that:

- add quizzes as gates;
- require a rival or combat;
- expand the first slice beyond six screens;
- require final art generation before prompts are reviewed;
- add complex language outside the curriculum boundary;
- create many new props with weak gameplay purpose.

## Compaction Handoff

If context is compacted, read this after `sun-temple-adventure-asset-plan.md` and before image generation. Reviewer output has been integrated. The next step is to review the prompt files under `assets/sun-temple-adventure/`.
