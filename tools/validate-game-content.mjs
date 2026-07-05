import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_PATH = path.join(ROOT, "scenarios", "camp-content.json");
const HTML_PATH = path.join(ROOT, "phaser.html");
const ADAPTER_PATH = path.join(ROOT, "phaser-content.js");

function fail(message) {
  throw new Error(`Game content validation failed: ${message}`);
}

function requireString(value, pathLabel) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${pathLabel} must be a non-empty string`);
  }
}

const content = JSON.parse(await readFile(CONTENT_PATH, "utf8"));
const html = await readFile(HTML_PATH, "utf8");
const adapterSource = await readFile(ADAPTER_PATH, "utf8");

if (content.schema_version !== 1) {
  fail("schema_version must be 1");
}
if (content.scene_id !== "camp") {
  fail("scene_id must be camp");
}
if (!html.includes("phaser-content.js")) {
  fail("phaser.html must load phaser-content.js before phaser-game.js");
}
if (html.indexOf("phaser-content.js") > html.indexOf("phaser-game.js")) {
  fail("phaser-content.js must load before phaser-game.js");
}

const hotspotIds = new Set();
const collectibleIds = new Set();
for (const [index, hotspot] of content.hotspots.entries()) {
  requireString(hotspot.id, `hotspots[${index}].id`);
  requireString(hotspot.label, `hotspots[${index}].label`);
  requireString(hotspot.english, `hotspots[${index}].english`);
  requireString(hotspot.bg, `hotspots[${index}].bg`);
  if (hotspotIds.has(hotspot.id)) {
    fail(`duplicate hotspot id: ${hotspot.id}`);
  }
  hotspotIds.add(hotspot.id);

  if (!["collectible", "scenery"].includes(hotspot.kind)) {
    fail(`${hotspot.id}.kind must be collectible or scenery`);
  }
  if (!Number.isFinite(hotspot.x) || !Number.isFinite(hotspot.y) || !Number.isFinite(hotspot.radius)) {
    fail(`${hotspot.id} must define numeric x, y, and radius`);
  }
  if (!Number.isFinite(hotspot.walk_to?.x) || !Number.isFinite(hotspot.walk_to?.y)) {
    fail(`${hotspot.id}.walk_to must define numeric x and y`);
  }

  if (hotspot.kind === "collectible") {
    collectibleIds.add(hotspot.id);
    requireString(hotspot.intro?.text, `${hotspot.id}.intro.text`);
    requireString(hotspot.intro?.bg, `${hotspot.id}.intro.bg`);
    requireString(hotspot.learning?.vocabulary_target, `${hotspot.id}.learning.vocabulary_target`);
    requireString(hotspot.learning?.curriculum_source, `${hotspot.id}.learning.curriculum_source`);
    if (!Array.isArray(hotspot.learning?.grammar_targets) || hotspot.learning.grammar_targets.length === 0) {
      fail(`${hotspot.id}.learning.grammar_targets must not be empty`);
    }
  } else {
    requireString(hotspot.description?.text, `${hotspot.id}.description.text`);
    requireString(hotspot.description?.bg, `${hotspot.id}.description.bg`);
  }
}

for (const itemId of content.guide.required_items) {
  if (!collectibleIds.has(itemId)) {
    fail(`guide requires unknown collectible: ${itemId}`);
  }
}

for (const collectibleId of collectibleIds) {
  const quiz = content.quizzes[collectibleId];
  if (!Array.isArray(quiz) || quiz.length === 0) {
    fail(`${collectibleId} must have at least one quiz question`);
  }
  const questionIds = new Set();
  for (const [index, question] of quiz.entries()) {
    requireString(question.id, `${collectibleId}.quizzes[${index}].id`);
    requireString(question.exercise_type, `${question.id}.exercise_type`);
    requireString(question.curriculum_stage, `${question.id}.curriculum_stage`);
    requireString(question.text, `${question.id}.text`);
    requireString(question.bg, `${question.id}.bg`);
    if (questionIds.has(question.id)) {
      fail(`duplicate question id: ${question.id}`);
    }
    questionIds.add(question.id);
    if (![1, 2, 3].includes(question.difficulty)) {
      fail(`${question.id}.difficulty must be 1, 2, or 3`);
    }
    if (!Array.isArray(question.options) || question.options.length < 2) {
      fail(`${question.id} must have at least two options`);
    }
    const correctOptions = question.options.filter((option) => option.isCorrect === true);
    if (correctOptions.length !== 1) {
      fail(`${question.id} must have exactly one correct option`);
    }
    for (const option of question.options) {
      requireString(option.text, `${question.id}.option.text`);
      if (!option.isCorrect) {
        requireString(option.feedback, `${question.id}.incorrect-option.feedback`);
      }
    }
  }
}

for (const quizId of Object.keys(content.quizzes)) {
  if (!collectibleIds.has(quizId)) {
    fail(`quiz exists for non-collectible hotspot: ${quizId}`);
  }
}

const sandbox = {
  Phaser: {
    Game: class StubGame {
      constructor(config) {
        this.config = config;
      }
    },
  },
  window: {},
};
vm.runInNewContext(adapterSource, sandbox, { filename: "phaser-content.js" });
if (!sandbox.window.EnglishGameContent) {
  fail("phaser-content.js must expose its content registration metadata");
}

class StubScene {
  constructor() {
    this.loadedJson = null;
    this.load = { json: (key, url) => { this.loadedJson = { key, url }; } };
    this.cache = { json: { get: () => content } };
  }

  preload() {}
  create() {}
  createObjectQuizzes() { return {}; }
  createHotspots() {}
  onGuideClicked() {}
  getWordTranslation() { return null; }
}

const stubGame = new sandbox.Phaser.Game({ scene: [StubScene] });
const DataDrivenScene = stubGame.config.scene[0];
const stubScene = new DataDrivenScene();
stubScene.preload();
if (stubScene.loadedJson?.key !== "campContent" || !stubScene.loadedJson.url.includes("camp-content.json")) {
  fail("data-driven scene must preload camp-content.json");
}
stubScene.contentModel = content;
if (stubScene.createObjectQuizzes() !== content.quizzes) {
  fail("data-driven scene must return quizzes from camp content");
}
if (stubScene.getWordTranslation("Rope!") !== "въже") {
  fail("data-driven scene must resolve translations from camp content");
}

console.log(
  `Validated ${content.hotspots.length} hotspots, ${collectibleIds.size} collectible learning objects, and ${Object.values(content.quizzes).flat().length} quiz questions.`,
);
