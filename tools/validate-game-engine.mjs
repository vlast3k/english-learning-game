import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCENARIOS_DIR = path.join(ROOT, "scenarios");
const MISSIONS_DIR = path.join(ROOT, "game-engine", "missions");
const SUPPORTED_ACTIONS = new Set([
  "fact.set", "counter.increment", "inventory.add", "inventory.remove", "inventory.clear",
  "puzzle.start", "puzzle.complete", "flag.set", "ui.status.set", "ui.toast", "ui.vocab.show",
  "exit.refresh", "dialog.show", "event.emit", "scene.transition", "campaign.complete",
]);
const SUPPORTED_CONDITION_KEYS = new Set([
  "puzzle", "status", "fact", "equals", "inventory_contains", "inventory_missing",
  "counter", "at_least", "at_most", "all", "any", "not", "event",
]);

function fail(message) {
  throw new Error(`Game engine validation failed: ${message}`);
}

function refs(condition, out = []) {
  if (!condition) return out;
  if (condition.puzzle) out.push(condition.puzzle);
  for (const key of ["all", "any"]) {
    for (const entry of condition[key] || []) refs(entry, out);
  }
  if (condition.not) refs(condition.not, out);
  return out;
}

function validateCondition(condition, filename, ownerLabel) {
  if (!condition || typeof condition !== "object") return;
  for (const key of Object.keys(condition)) {
    if (!SUPPORTED_CONDITION_KEYS.has(key)) {
      fail(`${filename}: ${ownerLabel} uses unsupported condition key ${key}`);
    }
  }
  for (const key of ["all", "any"]) {
    if (condition[key] !== undefined && !Array.isArray(condition[key])) {
      fail(`${filename}: ${ownerLabel}.${key} must be an array`);
    }
    for (const entry of condition[key] || []) {
      validateCondition(entry, filename, ownerLabel);
    }
  }
  if (condition.not) validateCondition(condition.not, filename, ownerLabel);
}

function validateGraph(bundle, filename) {
  const { content, engine } = bundle;
  if (!engine || engine.scene_id !== content.scene_id) {
    fail(`${filename}: missing/mismatched game engine manifest`);
  }

  const ids = new Set();
  for (const node of engine.puzzles || []) {
    if (!node.id || ids.has(node.id)) fail(`${filename}: invalid/duplicate puzzle ${node.id}`);
    ids.add(node.id);
  }
  for (const node of engine.puzzles) {
    validateCondition(node.requires, filename, `${node.id}.requires`);
    for (const ref of refs(node.requires)) {
      if (!ids.has(ref)) fail(`${filename}: ${node.id} requires unknown ${ref}`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) fail(`${filename}: dependency cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    const node = engine.puzzles.find((entry) => entry.id === id);
    for (const ref of refs(node.requires)) visit(ref);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of ids) visit(id);

  if (!engine.puzzles.some((node) => node.final)) fail(`${filename}: no final puzzle`);

  const ruleIds = new Set();
  for (const rule of engine.rules || []) {
    if (!rule.id || ruleIds.has(rule.id)) fail(`${filename}: invalid/duplicate rule ${rule.id}`);
    ruleIds.add(rule.id);
    if (!rule.event?.type) fail(`${filename}: ${rule.id} missing event type`);
    validateCondition(rule.condition, filename, `${rule.id}.condition`);
    for (const action of rule.actions || []) {
      if (!SUPPORTED_ACTIONS.has(action.type)) fail(`${filename}: ${rule.id} unsupported action ${action.type}`);
      if (action.type === "puzzle.complete" && !ids.has(action.puzzle)) {
        fail(`${filename}: ${rule.id} completes unknown puzzle`);
      }
      if (action.type === "scene.transition" && !existsSync(path.join(ROOT, action.scenario))) {
        fail(`${filename}: ${rule.id} transition target is missing`);
      }
    }
  }

  const collectibleIds = new Set(content.hotspots.filter((hotspot) => hotspot.kind === "collectible").map((hotspot) => hotspot.id));
  for (const hotspot of content.hotspots || []) {
    validateCondition(hotspot.visible_when, filename, `${hotspot.id}.visible_when`);
    validateCondition(hotspot.hidden_when, filename, `${hotspot.id}.hidden_when`);
  }
  for (const [index, prompt] of (content.state_prompts || []).entries()) {
    validateCondition(prompt.when, filename, `state_prompts[${index}].when`);
  }
  for (const [index, state] of (content.exit_marker?.states || []).entries()) {
    validateCondition(state.when, filename, `exit_marker.states[${index}].when`);
  }
  for (const id of collectibleIds) {
    const puzzleId = engine.bindings?.hotspots?.[id]?.puzzle_id;
    if (!ids.has(puzzleId)) fail(`${filename}: ${id} has unknown puzzle binding`);
  }
  for (const rule of engine.rules.filter((entry) => entry.event.type === "collectible.completed")) {
    if (!collectibleIds.has(rule.event.target)) fail(`${filename}: rule targets unknown collectible`);
  }
  if (!ids.has(engine.bindings?.guide?.puzzle_id) || !ids.has(engine.bindings?.exit?.puzzle_id)) {
    fail(`${filename}: guide/exit puzzle binding invalid`);
  }
  for (const [index, state] of (engine.bindings?.exit?.states || []).entries()) {
    validateCondition(state.when, filename, `bindings.exit.states[${index}].when`);
    if (state.requires_puzzle && !ids.has(state.requires_puzzle)) {
      fail(`${filename}: bindings.exit.states[${index}] requires unknown puzzle ${state.requires_puzzle}`);
    }
  }
  if (content.assistant?.hints) {
    for (const puzzleId of Object.keys(content.assistant.hints)) {
      if (!ids.has(puzzleId)) fail(`${filename}: assistant hint targets unknown puzzle ${puzzleId}`);
    }
    for (const puzzleId of ids) {
      if (!content.assistant.hints[puzzleId]) fail(`${filename}: assistant missing hint for ${puzzleId}`);
    }
  }
}

const scenarioFiles = (await readdir(SCENARIOS_DIR))
  .filter((filename) => filename.endsWith("-content.json"))
  .sort();
const contentBySceneId = new Map();
for (const filename of scenarioFiles) {
  const content = JSON.parse(await readFile(path.join(SCENARIOS_DIR, filename), "utf8"));
  contentBySceneId.set(content.scene_id, { filename, content });
}

const missionFiles = (await readdir(MISSIONS_DIR))
  .filter((filename) => filename.endsWith(".json"))
  .sort();
if (missionFiles.length === 0) {
  fail("no game-engine mission manifests found");
}
const contents = [];
for (const filename of missionFiles) {
  const engine = JSON.parse(await readFile(path.join(MISSIONS_DIR, filename), "utf8"));
  const contentEntry = contentBySceneId.get(engine.scene_id);
  if (!contentEntry) {
    fail(`${filename}: no scenario content found for scene_id ${engine.scene_id}`);
  }
  const bundle = { content: contentEntry.content, engine, filename, contentFilename: contentEntry.filename };
  validateGraph(bundle, filename);
  contents.push(bundle);
}

const jamesBondContents = contents.filter((bundle) => bundle.engine.scene_id.startsWith("james-bond-level-"));
if (jamesBondContents.length >= 11) {
  for (let index = 0; index < 11; index += 1) {
    const expectedSceneId = `james-bond-level-${String(index + 1).padStart(2, "0")}`;
    if (jamesBondContents[index]?.engine.scene_id !== expectedSceneId) {
      fail(`James Bond regression expected ${expectedSceneId}, found ${jamesBondContents[index]?.engine.scene_id || "nothing"}`);
    }
  }
}

const source = await readFile(path.join(ROOT, "game-engine", "runtime.js"), "utf8");
const sandbox = { window: {}, console, URL, setTimeout, clearTimeout };
vm.runInNewContext(source, sandbox, { filename: "runtime.js" });
const API = sandbox.window.EnglishGameEngine;
if (!API?.create) fail("runtime did not expose EnglishGameEngine");

const storage = new API.MemoryStorage();
const transitions = [];
const dialogs = [];
const bridge = {
  addInventoryItem() {},
  removeInventoryItem() {},
  clearInventory() {},
  setFlag() {},
  setStatus() {},
  showToast() {},
  showVocabulary() {},
  refreshExit() {},
  showDialog(action) { dialogs.push(action); },
  transitionScene(action) { transitions.push(action); },
};

let snapshot = null;

if (jamesBondContents.length >= 11) {
  const campaignContents = jamesBondContents;

const fresh = API.create(campaignContents[0].engine, {
  storage: new API.MemoryStorage(),
  content: campaignContents[0].content,
  bridge,
});
fresh.emit("exit.reached", { target: "training_door" });
if (!dialogs.length || transitions.length) fail("locked Level 01 exit did not remain locked");
fresh.destroy();
dialogs.length = 0;

const level1 = API.create(campaignContents[0].engine, { storage, content: campaignContents[0].content, bridge });
level1.emit("mission.understood", { target: campaignContents[0].content.scene_id });
for (const id of ["agent_badge", "dossier_clue", "profile_form"]) {
  level1.emit("collectible.completed", { target: id });
}
level1.emit("guide.completed", { target: "director" });
level1.emit("exit.reached", { target: "training_door" });
if (level1.getPuzzleStatus("level01_enter_training_door") !== "completed") {
  fail("Level 01 final puzzle not completed");
}
if (transitions.at(-1)?.scenario !== "scenarios/james-bond-level-02-content.json") {
  fail("Level 01 did not transition to Level 02");
}
if (level1.getSnapshot().state.inventory.length) fail("Level 01 inventory was not cleared at transition");
level1.destroy();

const level2 = API.create(campaignContents[1].engine, { storage, content: campaignContents[1].content, bridge });
if (level2.getSnapshot().state.puzzles.level01_enter_training_door !== "completed") {
  fail("campaign state did not persist across levels");
}
level2.emit("mission.understood", { target: campaignContents[1].content.scene_id });
for (const id of ["phone_clue", "camera_clue", "hidden_bag"]) {
  level2.emit("collectible.completed", { target: id });
}
level2.emit("guide.completed", { target: "director" });
level2.emit("exit.reached", { target: "safe_flat_door" });
snapshot = level2.getSnapshot();
if (level2.getPuzzleStatus("level02_enter_village_path") !== "completed") {
  fail("Level 02 final puzzle not completed");
}
if (snapshot.state.facts["level03.unlocked"] !== true) {
  fail("Level 03 unlock fact missing");
}
if (transitions.at(-1)?.scenario !== "scenarios/james-bond-level-03-content.json") {
  fail("Level 02 did not transition to Level 03");
}
level2.destroy();

const level3 = API.create(campaignContents[2].engine, { storage, content: campaignContents[2].content, bridge });
if (level3.getSnapshot().state.puzzles.level02_enter_village_path !== "completed") {
  fail("campaign state did not persist into Level 03");
}
level3.emit("mission.understood", { target: campaignContents[2].content.scene_id });
for (const id of ["bread_note", "football_clue", "teacher_map"]) {
  level3.emit("collectible.completed", { target: id });
}
level3.emit("guide.completed", { target: "teacher" });
level3.emit("exit.reached", { target: "map_room_path" });
snapshot = level3.getSnapshot();
if (level3.getPuzzleStatus("level03_return_to_map_room") !== "completed") {
  fail("Level 03 final puzzle not completed");
}
if (snapshot.state.facts["level02.return_unlocked"] !== true) {
  fail("Level 02 return unlock fact missing");
}
if (transitions.at(-1)?.scenario !== "scenarios/james-bond-level-02-content.json") {
  fail("Level 03 did not transition back to Level 02");
}
level3.destroy();

const level2Return = API.create(campaignContents[1].engine, { storage, content: campaignContents[1].content, bridge });
if (level2Return.getSnapshot().state.facts["level02.return_unlocked"] !== true) {
  fail("Level 02 did not receive return unlock fact");
}
level2Return.emit("mission.understood", { target: campaignContents[1].content.scene_id });
level2Return.emit("collectible.completed", { target: "supply_message" });
level2Return.emit("exit.reached", { target: "safe_flat_door" });
snapshot = level2Return.getSnapshot();
if (level2Return.getPuzzleStatus("level02_complete_village_loop") !== "completed") {
  fail("Level 02 returned final puzzle not completed");
}
if (snapshot.state.facts["level04.unlocked"] !== true) {
  fail("Level 04 unlock fact missing");
}
if (transitions.at(-1)?.scenario !== "scenarios/james-bond-level-04-content.json") {
  fail("Level 02 return did not transition to Level 04");
}
level2Return.destroy();

const level4 = API.create(campaignContents[3].engine, { storage, content: campaignContents[3].content, bridge });
if (level4.getSnapshot().state.puzzles.level02_complete_village_loop !== "completed") {
  fail("campaign state did not persist into Level 04");
}
level4.emit("mission.understood", { target: campaignContents[3].content.scene_id });
for (const id of ["animal_report", "meat_bowl", "trail_camera"]) {
  level4.emit("collectible.completed", { target: id });
}
level4.emit("guide.completed", { target: "ranger_nadia" });
level4.emit("exit.reached", { target: "quiet_gate" });
snapshot = level4.getSnapshot();
if (level4.getPuzzleStatus("level04_quiet_gate") !== "completed") {
  fail("Level 04 final puzzle not completed");
}
if (snapshot.state.facts["level05.unlocked"] !== true) {
  fail("Level 05 unlock fact missing");
}
if (transitions.at(-1)?.scenario !== "scenarios/james-bond-level-05-content.json") {
  fail("Level 04 did not transition to Level 05");
}
level4.destroy();

const level5 = API.create(campaignContents[4].engine, { storage, content: campaignContents[4].content, bridge });
if (level5.getSnapshot().state.puzzles.level04_quiet_gate !== "completed") {
  fail("campaign state did not persist into Level 05");
}
level5.emit("mission.understood", { target: campaignContents[4].content.scene_id });
for (const id of ["gadget_watch", "gadget_glasses", "gadget_jacket"]) {
  level5.emit("collectible.completed", { target: id });
}
level5.emit("guide.completed", { target: "agent_q" });
level5.emit("exit.reached", { target: "security_door" });
snapshot = level5.getSnapshot();
if (level5.getPuzzleStatus("level05_lab_exit") !== "completed") {
  fail("Level 05 final puzzle not completed");
}
if (snapshot.state.facts["level06.unlocked"] !== true) {
  fail("Level 06 unlock fact missing");
}
if (transitions.at(-1)?.scenario !== "scenarios/james-bond-level-06-content.json") {
  fail("Level 05 did not transition to Level 06");
}
level5.destroy();

const level6 = API.create(campaignContents[5].engine, { storage, content: campaignContents[5].content, bridge });
if (level6.getSnapshot().state.puzzles.level05_lab_exit !== "completed") {
  fail("campaign state did not persist into Level 06");
}
level6.emit("mission.understood", { target: campaignContents[5].content.scene_id });
for (const id of ["river_map", "boat_ticket", "mountain_photo"]) {
  level6.emit("collectible.completed", { target: id });
}
level6.emit("guide.completed", { target: "guide_mira" });
level6.emit("exit.reached", { target: "mountain_path" });
snapshot = level6.getSnapshot();
if (level6.getPuzzleStatus("level06_mountain_path_exit") !== "completed") {
  fail("Level 06 final puzzle not completed");
}
if (snapshot.state.facts["level07.unlocked"] !== true) {
  fail("Level 07 unlock fact missing");
}
if (transitions.at(-1)?.scenario !== "scenarios/james-bond-level-07-content.json") {
  fail("Level 06 did not transition to Level 07");
}
level6.destroy();

const level7 = API.create(campaignContents[6].engine, { storage, content: campaignContents[6].content, bridge });
if (level7.getSnapshot().state.puzzles.level06_mountain_path_exit !== "completed") {
  fail("campaign state did not persist into Level 07");
}
level7.emit("mission.understood", { target: campaignContents[6].content.scene_id });
for (const id of ["festival_hat", "clothes_bundle", "music_drum"]) {
  level7.emit("collectible.completed", { target: id });
}
level7.emit("guide.completed", { target: "host_lina" });
level7.emit("exit.reached", { target: "festival_arch" });
snapshot = level7.getSnapshot();
if (level7.getPuzzleStatus("level07_festival_arch_exit") !== "completed") {
  fail("Level 07 final puzzle not completed");
}
if (snapshot.state.facts["campaign.levels_01_to_07_complete"] !== true) {
  fail("Level 07 campaign progress fact missing");
}
if (snapshot.state.facts["level08.unlocked"] !== true) {
  fail("Level 08 unlock fact missing");
}
if (transitions.at(-1)?.scenario !== "scenarios/james-bond-level-08-content.json") {
  fail("Level 07 did not transition to Level 08");
}
level7.destroy();

const level8 = API.create(campaignContents[7].engine, { storage, content: campaignContents[7].content, bridge });
if (level8.getSnapshot().state.puzzles.level07_festival_arch_exit !== "completed") {
  fail("campaign state did not persist into Level 08");
}
level8.emit("mission.understood", { target: campaignContents[7].content.scene_id });
for (const id of ["shape_tiles", "number_stones", "sequence_cards"]) {
  level8.emit("collectible.completed", { target: id });
}
level8.emit("guide.completed", { target: "keeper_maya" });
level8.emit("exit.reached", { target: "temple_gate" });
snapshot = level8.getSnapshot();
if (level8.getPuzzleStatus("level08_temple_gate_exit") !== "completed") {
  fail("Level 08 final puzzle not completed");
}
if (snapshot.state.facts["level09.unlocked"] !== true) {
  fail("Level 09 unlock fact missing");
}
if (transitions.at(-1)?.scenario !== "scenarios/james-bond-level-09-content.json") {
  fail("Level 08 did not transition to Level 09");
}
level8.destroy();

const level9 = API.create(campaignContents[8].engine, { storage, content: campaignContents[8].content, bridge });
if (level9.getSnapshot().state.puzzles.level08_temple_gate_exit !== "completed") {
  fail("campaign state did not persist into Level 09");
}
level9.emit("mission.understood", { target: campaignContents[8].content.scene_id });
for (const id of ["spring_leaf", "summer_flower", "winter_snow_card"]) {
  level9.emit("collectible.completed", { target: id });
}
level9.emit("guide.completed", { target: "gardener_mira" });
level9.emit("exit.reached", { target: "garden_gate" });
snapshot = level9.getSnapshot();
if (level9.getPuzzleStatus("level09_garden_gate_exit") !== "completed") {
  fail("Level 09 final puzzle not completed");
}
if (snapshot.state.facts["level10.unlocked"] !== true) {
  fail("Level 10 unlock fact missing");
}
if (transitions.at(-1)?.scenario !== "scenarios/james-bond-level-10-content.json") {
  fail("Level 09 did not transition to Level 10");
}
level9.destroy();

const level10 = API.create(campaignContents[9].engine, { storage, content: campaignContents[9].content, bridge });
if (level10.getSnapshot().state.puzzles.level09_garden_gate_exit !== "completed") {
  fail("campaign state did not persist into Level 10");
}
level10.emit("mission.understood", { target: campaignContents[9].content.scene_id });
for (const id of ["recycling_bin", "reuse_box", "seed_packet"]) {
  level10.emit("collectible.completed", { target: id });
}
level10.emit("guide.completed", { target: "ranger_nia" });
level10.emit("exit.reached", { target: "earth_gate" });
snapshot = level10.getSnapshot();
if (level10.getPuzzleStatus("level10_earth_gate_exit") !== "completed") {
  fail("Level 10 final puzzle not completed");
}
if (snapshot.state.facts["campaign.levels_01_to_10_complete"] !== true) {
  fail("Level 10 campaign completion fact missing");
}
level10.destroy();

const level11 = API.create(campaignContents[10].engine, { storage, content: campaignContents[10].content, bridge });
level11.emit("mission.understood", { target: campaignContents[10].content.scene_id });
for (const id of ["city_postcard", "country_postcard", "routine_card"]) {
  level11.emit("collectible.completed", { target: id });
}
level11.emit("guide.completed", { target: "agent_nora" });
level11.emit("exit.reached", { target: "final_academy_gate" });
snapshot = level11.getSnapshot();
if (level11.getPuzzleStatus("level11_final_gate_exit") !== "completed") {
  fail("Level 11 final puzzle not completed");
}
if (snapshot.state.facts["campaign.levels_01_to_11_complete"] !== true) {
  fail("Level 11 campaign completion fact missing");
}
level11.destroy();
}

const eventEmitStorage = new API.MemoryStorage();
const eventEmitManifest = {
  schema_version: 1,
  campaign_id: "eca-regression",
  storage_key: "eca-regression",
  scene_id: "eca-regression",
  mission_puzzle: "eca_start",
  initial_state: { facts: {}, inventory: [], counters: {}, puzzles: {} },
  puzzles: [
    { id: "eca_start", title: "Start", type: "mission_briefing", requires: null },
    {
      id: "eca_emitted",
      title: "Event emitted",
      type: "learning_puzzle",
      final: true,
      requires: { "puzzle": "eca_start", "status": "completed" },
    },
  ],
  rules: [
    {
      id: "eca-start",
      event: { type: "external.start", target: "test" },
      actions: [
        { type: "puzzle.complete", puzzle: "eca_start" },
        {
          type: "event.emit",
          event: "custom.answer",
          target: "relay",
          payload: { answer: "correct" },
        },
      ],
    },
    {
      id: "eca-custom-answer",
      event: { type: "custom.answer", target: "relay" },
      condition: { event: "answer", equals: "correct" },
      actions: [{ type: "puzzle.complete", puzzle: "eca_emitted" }],
    },
    {
      id: "eca-puzzle-completed-event",
      event: { type: "puzzle.completed", target: "eca_emitted" },
      actions: [{ type: "fact.set", fact: "eca.puzzle_completed_event_seen", value: true }],
    },
  ],
  bindings: {
    hotspots: {},
    guide: { id: "guide", puzzle_id: "eca_start" },
    exit: { id: "exit", puzzle_id: "eca_emitted", requires_puzzle: "eca_start" },
  },
};
const eventEmitEngine = API.create(eventEmitManifest, {
  storage: eventEmitStorage,
  content: { scene_id: "eca-regression" },
  bridge,
});
eventEmitEngine.emit("external.start", { target: "test" });
snapshot = eventEmitEngine.getSnapshot();
if (eventEmitEngine.getPuzzleStatus("eca_emitted") !== "completed") {
  fail("event.emit did not dispatch a typed event");
}
if (snapshot.state.facts["eca.puzzle_completed_event_seen"] !== true) {
  fail("puzzle.complete did not dispatch puzzle.completed event");
}
eventEmitEngine.destroy();

console.log(`Validated ${contents.length} puzzle dependency graph(s), ECA runtime behavior, and current campaign regression flow.`);
