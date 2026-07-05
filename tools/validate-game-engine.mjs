import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCENARIOS = ["james-bond-level-01-content.json", "james-bond-level-02-content.json"];
const SUPPORTED_ACTIONS = new Set([
  "fact.set", "counter.increment", "inventory.add", "inventory.remove", "inventory.clear",
  "puzzle.start", "puzzle.complete", "flag.set", "ui.status.set", "ui.toast", "ui.vocab.show",
  "exit.refresh", "dialog.show", "event.emit", "scene.transition", "campaign.complete",
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
}

const contents = [];
for (const filename of SCENARIOS) {
  const content = JSON.parse(await readFile(path.join(ROOT, "scenarios", filename), "utf8"));
  const engine = JSON.parse(await readFile(
    path.join(ROOT, "game-engine", "missions", filename.replace("-content", "")),
    "utf8",
  ));
  const bundle = { content, engine };
  validateGraph(bundle, filename);
  contents.push(bundle);
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

const fresh = API.create(contents[0].engine, {
  storage: new API.MemoryStorage(),
  content: contents[0].content,
  bridge,
});
fresh.emit("exit.reached", { target: "training_door" });
if (!dialogs.length || transitions.length) fail("locked Level 01 exit did not remain locked");
fresh.destroy();
dialogs.length = 0;

const level1 = API.create(contents[0].engine, { storage, content: contents[0].content, bridge });
level1.emit("mission.understood", { target: contents[0].content.scene_id });
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

const level2 = API.create(contents[1].engine, { storage, content: contents[1].content, bridge });
if (level2.getSnapshot().state.puzzles.level01_enter_training_door !== "completed") {
  fail("campaign state did not persist across levels");
}
level2.emit("mission.understood", { target: contents[1].content.scene_id });
for (const id of ["phone_clue", "camera_clue", "hidden_bag"]) {
  level2.emit("collectible.completed", { target: id });
}
level2.emit("guide.completed", { target: "director" });
level2.emit("exit.reached", { target: "safe_flat_door" });
const snapshot = level2.getSnapshot();
if (level2.getPuzzleStatus("level02_complete_surveillance") !== "completed") {
  fail("Level 02 final puzzle not completed");
}
if (snapshot.state.facts["campaign.levels_01_02_complete"] !== true) {
  fail("campaign completion fact missing");
}
level2.destroy();

console.log("Validated Puzzle Dependency Graph + ECA runtime for James Bond Levels 01 and 02.");
