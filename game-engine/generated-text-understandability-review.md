# Generated Level Text Understandability Review

Scope: generated James Bond scenario files in `scenarios/james-bond-level-01-content.json` through `scenarios/james-bond-level-04-content.json`, plus matching mission manifests in `game-engine/missions/`.

Scale:

- 5: clear, natural, age-appropriate.
- 4: understandable, but a little plain or stiff.
- 3: understandable, but awkward or potentially confusing.
- 2: weird, unnatural, or too system-like for a child.
- 1: broken or very hard to understand.

Intentional wrong-answer options are visible to children, but they are not ranked as natural English because they are designed to be wrong. They are noted separately where they may be too silly or misleading.

## Highest Priority Rewrites

| Rank | Source | Current text | Score | Issue | Suggested replacement |
|---:|---|---|---:|---|---|
| 1 | Level 3 title | Friendly Village Camp List | 2 | Sounds like a file name, not a level title. | Village Picnic List |
| 2 | Level 3 exit | The path waits. I need the village welcome list first. | 2 | "The path waits" is poetic but odd for learner UI. "Village welcome list" is also unnatural. | I need the village list before I go back. |
| 3 | Level 3 bread note | A cook has bread on the table. I make bread for friends. | 2 | Speaker changes strangely: a cook has bread, then "I" suddenly speaks. | The cook has bread on the table. She makes bread for friends. |
| 4 | Level 2 camera clue | The camera is behind the curtain by the window. Find the hidden view. | 2 | "Hidden view" is not natural kid English. | The camera is behind the curtain by the window. Find the hidden clue. |
| 5 | Level 1 badge quiz | Which word means the person label on a badge? | 2 | "Person label" sounds unnatural. | Which word goes on a badge? |
| 6 | Level 2 mission title/door | Safe Flat Watch / safe flat door | 2 | "Safe flat" is British/spy jargon and unclear for kids. | Secret Apartment Watch / apartment door |
| 7 | Level 2 mission puzzle | Complete the village support loop and open the animal trail | 2 | Developer/system language. | Finish the village plan and open the animal trail. |
| 8 | Level 4 gate text | The gate is quiet, but I need Ranger Nadia's animal check first. | 2 | A gate cannot really be "quiet" in this context. | The gate is closed. I need Ranger Nadia's animal check first. |

## Level 1: Briefing At Headquarters

Overall: mostly understandable. The weakest text is concentrated in one quiz prompt and one dialogue question.

| Text | Score | Notes |
|---|---:|---|
| Briefing at Headquarters | 5 | Clear title. |
| The hero arrives at a friendly secret-agent headquarters to earn a junior agent license. | 4 | Understandable, but "secret-agent headquarters" and "license" are a bit formal. |
| Briefing in progress | 4 | Clear status text. |
| Read the mission screen first. | 5 | Clear instruction. |
| Get the agent badge. | 5 | Clear instruction. |
| Read the dossier board. | 4 | "Dossier" is advanced, but it is target spy vocabulary. |
| Complete the profile form. | 5 | Clear. |
| Talk to the Director. | 5 | Clear. |
| Use the training door. | 5 | Clear. |
| Collect your agent badge, dossier clue, and profile form first. | 5 | Clear gate text. |
| Final check. Who are you? | 5 | Clear dialogue. |
| Good. What is it on the big screen? | 3 | Awkward word order. Prefer "Good. What is on the big screen?" |
| training door | 5 | Clear object label. |
| The scanner stays closed. I need the director's approval first. | 4 | Clear enough, but "scanner" appears without much setup. |
| agent badge | 5 | Clear object label. |
| An agent badge is ready on the wall. It needs your name. | 4 | Understandable, slightly stiff. |
| dossier board | 4 | Clear in spy context, advanced word. |
| The dossier board shows agents and suspects. Who is this? | 4 | Understandable, though the singular "Who is this?" after plural people may feel abrupt. |
| profile form | 5 | Clear object label. |
| A profile form is on the briefing table. Complete the family file. | 3 | "Family file" is unnatural. Prefer "Fill in the family form." |
| mission screen | 5 | Clear object label. |
| This is the mission plan. First get the badge, then read the dossier and complete the profile. | 5 | Clear sequence. |
| briefing table | 5 | Clear object label. |
| The briefing table is big. The profile folder is on the table. | 5 | Simple and clear. |
| world map | 5 | Clear object label. |
| A world map is on the wall. The next mission is still secret. | 5 | Natural and clear. |
| Badge challenge 1/3. Which word means the person label on a badge? | 2 | Weird phrase. Prefer "Which word goes on a badge?" |
| Badge challenge 2/3. I ___ Agent Alex. | 5 | Clear gap-fill. |
| Badge challenge 3/3. Choose the best answer. | 5 | Clear. |
| Dossier challenge 1/3. Which question asks about a person? | 5 | Clear. |
| Dossier challenge 2/3. Choose the best sentence for a boy. | 5 | Clear. |
| Dossier challenge 3/3. She ___ a good agent. | 5 | Clear. |
| Profile challenge 1/3. Which word means brother, sister, mother, and father together? | 5 | Clear, age-appropriate. |
| Profile challenge 2/3. They ___ brother and sister. | 5 | Clear. |
| Profile challenge 3/3. Choose the correct question. | 5 | Clear. |

## Level 2: Safe Flat Watch

Overall: mechanically clear, but the level name and repeated "safe flat" wording are not child-friendly. If the audience is US/Bulgarian kids learning English, "flat" may be less useful than "apartment".

| Text | Score | Notes |
|---|---:|---|
| Safe Flat Watch | 2 | Spy-like, but unclear. Prefer "Secret Apartment Watch". |
| The hero checks a quiet apartment to find hidden microphones and clues. | 4 | Clear, though "hidden microphones" may be advanced. |
| Surveillance in progress | 3 | "Surveillance" is advanced and system-like. Prefer "Apartment watch in progress". |
| Read the mission board first. | 5 | Clear. |
| Find the phone clue. | 5 | Clear. |
| Find the camera clue. | 5 | Clear. |
| Find the hidden bag. | 5 | Clear. |
| Talk to the Director. | 5 | Clear. |
| Use the safe flat door. | 2 | "Safe flat" is unclear. Prefer "Use the apartment door." |
| Send the supply message. | 5 | Clear. |
| Use the final report. | 4 | Understandable, but "use" a report is slightly game-like. |
| Send the village supply plan | 4 | Clear enough. |
| Find the phone clue, camera clue, and hidden bag first. | 5 | Clear. |
| Send the village supply message on the desk, then bring me the final report. | 4 | Understandable, a little long. |
| The village path is open. Use the safe flat door when you are ready. | 3 | Mixed geography. Prefer "The village path is open. Use the apartment door when you are ready." |
| Final room check. What is on the desk? | 5 | Clear. |
| Good. What is in the room? | 5 | Clear. |
| safe flat door | 2 | Unclear label. Prefer "apartment door". |
| The door stays closed. I need the director's safe flat check first. | 3 | Understandable, but "safe flat check" is awkward. |
| final report | 4 | Clear label, but it appears as a door state, which may confuse. |
| phone clue | 5 | Clear object label. |
| A phone is on the desk. It can start the room check. | 3 | "Start the room check" is mechanical. Prefer "Use it for the room check." |
| camera clue | 5 | Clear object label. |
| The camera is behind the curtain by the window. Find the hidden view. | 2 | "Hidden view" sounds odd. Prefer "hidden clue." |
| hidden bag | 5 | Clear object label. |
| A bag is under the chair. There may be a clue inside. | 5 | Natural and clear. |
| supply message | 5 | Clear object label. |
| This message is for later. I need the village welcome list first. | 3 | "Village welcome list" is awkward. Prefer "village list". |
| The village list is on the desk. Send the plan: We help the village. | 3 | Understandable, but "list" and "plan" blur together. |
| mission board | 5 | Clear object label. |
| This mission board shows the safe flat. There is a door, a window, and a desk. | 3 | "Safe flat" issue. |
| computer station | 5 | Clear object label. |
| The computer is on the desk. There are notes next to the screen. | 5 | Clear. |
| Phone challenge 1/3. Which word means the object on the desk? | 5 | Clear. |
| Phone challenge 2/3. ___ a phone on the desk. | 5 | Clear. |
| Phone challenge 3/3. Choose the best sentence. | 5 | Clear. |
| Camera challenge 1/3. Which word means a small picture machine? | 4 | Understandable, but "picture machine" is not natural. Prefer "machine for taking pictures." |
| Camera challenge 2/3. Where is the camera? The camera is ___ the curtain. | 5 | Clear. |
| Camera challenge 3/3. Choose the sentence about two clues. | 5 | Clear. |
| Bag challenge 1/3. Which word means a small travel pack? | 5 | Clear. |
| Bag challenge 2/3. The bag is ___ the chair. | 5 | Clear. |
| Bag challenge 3/3. Choose the best sentence. | 5 | Clear. |
| Supply challenge 1/3. Which sentence starts the message? | 5 | Clear. |
| Supply challenge 2/3. Complete: They need ___, fruit, and a football. | 5 | Clear. |
| Supply challenge 3/3. Choose the full supply plan. | 5 | Clear. |

## Level 3: Friendly Village Camp List

Overall: this level has the most awkward child-facing text. The core learning targets are fine, but "village welcome list", "map room path", and the bread note intro should be rewritten.

| Text | Score | Notes |
|---|---:|---|
| Friendly Village Camp List | 2 | Not a natural level title. Prefer "Village Picnic List". |
| The hero visits a friendly village camp to learn what friends do and what they need for a picnic. | 4 | Clear, but a little abstract. |
| Village visit in progress | 5 | Clear. |
| Read the welcome board first. | 5 | Clear. |
| Find the bread note. | 5 | Clear. |
| Find the football clue. | 5 | Clear. |
| Read the teacher's map. | 5 | Clear. |
| Talk to the Teacher. | 5 | Clear. |
| Use the map room path. | 3 | Understandable, but "map room path" sounds odd. Prefer "Go back to the map room." |
| Collect the bread note, football clue, and teacher map first. | 5 | Clear. |
| The village list is ready. Take it back to the map room. | 4 | Clear, but "village list" could be "picnic list" if that is the real goal. |
| Village check. What do we do? | 4 | Understandable, slightly abrupt. |
| Good. Read the village list. What do they need? | 5 | Clear. |
| map room path | 3 | Label sounds like a nav node. Prefer "path to map room". |
| The path waits. I need the village welcome list first. | 2 | Odd and unnatural. Prefer "I need the village list before I go back." |
| bread note | 5 | Clear object label. |
| A cook has bread on the table. I make bread for friends. | 2 | Speaker mismatch. Prefer "The cook has bread on the table. She makes bread for friends." |
| football clue | 5 | Clear object label. |
| Children play football in the garden. They play after school. | 5 | Clear. |
| teacher map | 5 | Clear object label. |
| The teacher has a map. You read the map and help the village. | 5 | Clear. |
| welcome board | 5 | Clear object label. |
| The welcome board says: We help at the village. They eat fruit after the game. | 3 | "Help at the village" is less natural than "help the village". |
| garden table | 5 | Clear object label. |
| There is fruit on the table. There are friends in the garden. | 5 | Clear. |
| Bread challenge 1/3. Which word is food on the table? | 5 | Clear. |
| Bread challenge 2/3. Complete the sentence: I ___ bread. | 5 | Clear. |
| Bread challenge 3/3. Choose the sentence about the cook. | 5 | Clear. |
| Football challenge 1/3. Which word is a game? | 5 | Clear. |
| Football challenge 2/3. They ___ football after school. | 5 | Clear. |
| Football challenge 3/3. Choose the best sentence. | 5 | Clear. |
| Map challenge 1/3. Which word shows a path? | 4 | Understandable, but "map shows a path" would be better. |
| Map challenge 2/3. You ___ the map. | 5 | Clear. |
| Map challenge 3/3. Choose the sentence about the village. | 5 | Clear. |

## Level 4: Guard Animal Trail

Overall: mostly understandable, but the "guard animal / quiet gate" framing sounds generated. The animal sentences are clear for grammar practice.

| Text | Score | Notes |
|---|---:|---|
| Guard Animal Trail | 3 | Understandable, but "guard animal" is unusual. Prefer "Animal Trail". |
| The hero studies a guard animal's habits and finds the quiet time to pass the base gate. | 3 | Understandable but unnatural. Prefer "finds the best time to pass the gate." |
| Animal trail in progress | 5 | Clear. |
| Excellent trail work, Agent Alex. | 5 | Clear reward text. |
| Read the field board first. | 5 | Clear. |
| Find the animal report. | 5 | Clear. |
| Check the meat bowl. | 5 | Clear. |
| Check the trail camera. | 5 | Clear. |
| Talk to Ranger Nadia. | 5 | Clear. |
| Use the quiet gate. | 3 | Understandable, but "quiet gate" is odd. |
| Collect the animal report, meat bowl, and trail camera first. | 5 | Clear. |
| The quiet gate is open. Pass in the morning. | 3 | "Pass in the morning" is understandable but stiff. Prefer "Go through in the morning." |
| Animal report. What does the tiger do in the morning? | 4 | Clear, slightly fragmentary. |
| Good. Does it eat fruit? | 5 | Clear. |
| quiet gate | 3 | Unusual object label. |
| The gate is quiet, but I need Ranger Nadia's animal check first. | 2 | Very odd. Prefer "The gate is closed..." |
| animal report | 5 | Clear object label. |
| A nature report says: The tiger sleeps in the morning. It walks at night. | 3 | Understandable, but "a nature report says" is stiff. Prefer "The report says..." |
| meat bowl | 5 | Clear object label. |
| The guard animal eats meat. It doesn't eat fruit. | 4 | Clear, but "guard animal" is unusual. |
| trail camera | 5 | Clear object label. |
| The trail camera shows a snake habitat behind the rock. Does it hide during the day? | 4 | Understandable. "Habitat" is advanced but likely target vocabulary. |
| field board | 4 | Understandable, but "field board" is less common than "trail board". |
| The field board says: Read the animal report. The quiet gate opens after the ranger check. | 3 | Understandable but generated-sounding. |
| rock shadow | 4 | Clear enough as a label, though "rock" alone may be better. |
| There is a safe habitat behind the rock. A snake hides there during the day. | 5 | Clear. |
| Report challenge 1/3. Which animal is in the report? | 5 | Clear. |
| Report challenge 2/3. The tiger ___ in the morning. | 5 | Clear. |
| Report challenge 3/3. True or false: The tiger walks at night. | 5 | Clear. |
| Meat challenge 1/3. Which word is food for the guard animal? | 4 | Clear, but "guard animal" is unusual. |
| Meat challenge 2/3. It ___ eat fruit. | 5 | Clear. |
| Meat challenge 3/3. Choose the true food sentence. | 5 | Clear. |
| Camera challenge 1/3. Which word means the safe animal home behind the rock? | 4 | Understandable, but "safe animal home" is babyish. |
| Camera challenge 2/3. ___ it hide during the day? | 5 | Clear. |
| Camera challenge 3/3. Does it hide behind the rock? | 5 | Clear. |

## Repeated UI Text

| Text | Score | Notes |
|---|---:|---|
| Choose the Bulgarian mission plan. | 4 | Understandable, but "mission plan" may be a little abstract. |
| Choose the Bulgarian translation before you pick it up. | 5 | Clear. |
| Choose the Bulgarian translation before you send it. | 5 | Clear. |
| Validating... | 4 | Understandable, but system-like. For kids, "Checking..." may be warmer. |
| Read the mission once more. | 5 | Clear. |
| Read the English sentence once more. | 5 | Clear. |
| Great work, Agent Alex. | 5 | Clear and positive. |

## Intentional Wrong English Options

These are visible, but they are quiz distractors. They are okay if the goal is error recognition, though too many silly semantic distractors can make the game feel less story-like.

Generally acceptable:

- They are Agent Alex.
- They is the mission plan.
- It are the mission plan.
- There are a phone on the desk.
- There is clues in the room.
- We helps friends.
- They needs water, fruit, and a football.
- It sleep in the morning.
- No, it don't. It eat meat.

Potentially too silly or story-breaking:

- He is a badge.
- They is a badge.
- I read football for friends.
- We eat the map.
- We help the room.
- There are a door in the room.

Better pattern: keep wrong answers close to the teaching target, but avoid bizarre meanings unless the exercise is explicitly playful.

## Suggested Copy Principles For Regeneration

- Prefer concrete object names over spy jargon: "apartment" instead of "safe flat".
- Avoid poetic object states in locked text: "The path waits" and "The gate is quiet" sound strange.
- Keep the speaker stable inside each object statement. If a sentence starts about "the cook", do not switch to "I" unless the cook is clearly speaking.
- Use goal nouns children can picture: "picnic list" is better than "village welcome list".
- Keep challenge prompts in the child's world, not the generator's world: "Which word goes on a badge?" is better than "Which word means the person label on a badge?"
