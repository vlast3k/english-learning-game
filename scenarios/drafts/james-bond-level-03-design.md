# James Bond Levels 02-03 Connected Loop Design

## Premise

Level 02 remains the map/safe-flat room where the hero practices `There is/There are`, `Where is...?`, and prepositions. After the director check, the door opens to Level 03 instead of completing the campaign.

Level 03 is a friendly village visit. The hero learns what people do and what they need for a picnic. The village teacher gives a welcome list, but the list is only useful if the hero returns to the Level 02 map room and sends the supply message from the desk station.

## Curriculum Focus

Level 02:

- `There is / There are`
- `Where is / Where are`
- `in`, `on`, `under`, `next to`, `behind`
- vocabulary: phone, camera, bag, desk, chair, window, door, clue

Level 03:

- simple present with `I`, `you`, `we`, `they`
- `I make bread.`
- `You read the map.`
- `We help friends.`
- `They play football.`
- vocabulary: village, friend, teacher, cook, garden, bread, fruit, water, football, help, play, read

Return to Level 02:

- sentence-building review
- `We help the village.`
- `They need water, fruit, and a football.`

## Flow

1. Level 02 starts with the existing safe-flat/map-room investigation.
2. The hero collects the phone clue, camera clue, and hidden bag.
3. The director check opens the door and transitions to Level 03.
4. In Level 03, the hero collects the bread note, football clue, and teacher map.
5. The teacher gives the village welcome list.
6. The hero returns to the original Level 02 scene.
7. The returned Level 02 scene reflects the new state and lets the hero send the village supply message from the map-room desk.
8. The director confirms the message.
9. The final report completes the Level 02 and Level 03 loop.

## Engine Shape

The return is implemented in the original `james-bond-level-02` scene and mission manifest. The same Level 2 scene changes behavior because campaign facts and puzzle state have changed.

Cross-level dependencies use persisted facts:

- `level03.unlocked`
- `level03.village_list_ready`
- `level02.return_unlocked`
- `level02.village_plan_sent`
- `level03.complete`
- `campaign.levels_01_02_03_complete`

Final campaign completion is moved from the old first-visit Level 02 terminal rule to a state-gated Level 02 rule that only fires after the Level 3 return fact exists and the supply message puzzle is complete.
