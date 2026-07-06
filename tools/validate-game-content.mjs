import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCENARIOS_DIR = path.join(ROOT, "scenarios");
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

const html = await readFile(HTML_PATH, "utf8");
const adapterSource = await readFile(ADAPTER_PATH, "utf8");
const gameSource = await readFile(path.join(ROOT, "phaser-game.js"), "utf8");

if (!html.includes("phaser-content.js")) {
  fail("phaser.html must load phaser-content.js before phaser-game.js");
}
if (html.indexOf("phaser-content.js") > html.indexOf("phaser-game.js")) {
  fail("phaser-content.js must load before phaser-game.js");
}

function requirePoint(value, pathLabel) {
  if (!Number.isFinite(value?.x) || !Number.isFinite(value?.y)) {
    fail(`${pathLabel} must define numeric x and y`);
  }
}

function extractBuiltInTranslations(source) {
  const entries = new Map();
  const mapBody = source.match(/const REVEAL_TRANSLATIONS = new Map\(\[([\s\S]*?)\]\);/)?.[1] || "";
  for (const match of mapBody.matchAll(/\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g)) {
    entries.set(match[1], match[2]);
  }
  return entries;
}

function normalizeTranslationToken(token) {
  return token.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
}

function englishTokens(text) {
  return text
    .match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)
    ?.map(normalizeTranslationToken)
    .filter(Boolean) || [];
}

function collectTranslatableTexts(content) {
  const texts = [];
  texts.push({ pathLabel: "level_plan.mission", text: content.level_plan.mission });
  for (const hotspot of content.hotspots) {
    if (hotspot.locked_text) {
      texts.push({ pathLabel: `${hotspot.id}.locked_text`, text: hotspot.locked_text });
    }
    if (hotspot.kind === "collectible") {
      texts.push({ pathLabel: `${hotspot.id}.intro.text`, text: hotspot.intro.text });
      if (hotspot.inventory?.detail?.text) {
        texts.push({ pathLabel: `${hotspot.id}.inventory.detail.text`, text: hotspot.inventory.detail.text });
      }
    } else {
      texts.push({ pathLabel: `${hotspot.id}.description.text`, text: hotspot.description.text });
    }
  }
  for (const [quizId, questions] of Object.entries(content.quizzes)) {
    for (const question of questions) {
      texts.push({ pathLabel: `${quizId}.${question.id}.text`, text: question.text });
    }
  }
  texts.push({ pathLabel: "guide.locked_text", text: content.guide.locked_text });
  for (const [index, message] of (content.guide.completed_messages || []).entries()) {
    if (message.text) {
      texts.push({ pathLabel: `guide.completed_messages[${index}].text`, text: message.text });
    }
  }
  if (content.guide.dialogue_tree) {
    for (const [nodeId, node] of Object.entries(content.guide.dialogue_tree.nodes)) {
      texts.push({ pathLabel: `guide.dialogue_tree.nodes.${nodeId}.npc_text`, text: node.npc_text });
    }
  }
  if (content.exit_marker?.locked_text) {
    texts.push({ pathLabel: "exit_marker.locked_text", text: content.exit_marker.locked_text });
  }
  for (const [index, prompt] of (content.state_prompts || []).entries()) {
    if (prompt.status_text) {
      texts.push({ pathLabel: `state_prompts[${index}].status_text`, text: prompt.status_text });
    }
    if (prompt.command_text) {
      texts.push({ pathLabel: `state_prompts[${index}].command_text`, text: prompt.command_text });
    }
  }
  if (content.assistant) {
    if (content.assistant.complete_text) {
      texts.push({ pathLabel: "assistant.complete_text", text: content.assistant.complete_text });
    }
    for (const [puzzleId, hint] of Object.entries(content.assistant.hints || {})) {
      if (hint.text) {
        texts.push({ pathLabel: `assistant.hints.${puzzleId}.text`, text: hint.text });
      }
    }
  }
  return texts;
}

const builtInTranslations = extractBuiltInTranslations(gameSource);

function validateTranslationCheck(translationCheck, pathLabel) {
  if (!translationCheck || typeof translationCheck !== "object") {
    fail(`${pathLabel} must be an object`);
  }
  if (translationCheck.prompt !== undefined) {
    requireString(translationCheck.prompt, `${pathLabel}.prompt`);
  }
  requireString(translationCheck.validating_text, `${pathLabel}.validating_text`);
  if (translationCheck.retry_text !== undefined) {
    requireString(translationCheck.retry_text, `${pathLabel}.retry_text`);
  }
  if (!Array.isArray(translationCheck.options) || translationCheck.options.length !== 3) {
    fail(`${pathLabel}.options must contain exactly three choices`);
  }
  const correctTranslationOptions = translationCheck.options.filter((option) => option.isCorrect === true);
  if (correctTranslationOptions.length !== 1) {
    fail(`${pathLabel}.options must have exactly one correct choice`);
  }
  for (const [optionIndex, option] of translationCheck.options.entries()) {
    requireString(option.text, `${pathLabel}.options[${optionIndex}].text`);
  }
}

function validateInventoryPresentation(hotspot, pathLabel) {
  if (!hotspot.inventory) {
    return;
  }
  if (hotspot.inventory.detail !== undefined) {
    requireString(hotspot.inventory.detail?.text, `${pathLabel}.inventory.detail.text`);
    requireString(hotspot.inventory.detail?.bg, `${pathLabel}.inventory.detail.bg`);
  }
  if (hotspot.inventory.icon !== undefined) {
    const icon = hotspot.inventory.icon;
    requireString(icon.texture || icon.source, `${pathLabel}.inventory.icon.texture`);
    const frame = icon.frame;
    if (!frame || typeof frame !== "object") {
      fail(`${pathLabel}.inventory.icon.frame must be an object`);
    }
    for (const field of ["x", "y", "width", "height"]) {
      if (!Number.isFinite(frame[field])) {
        fail(`${pathLabel}.inventory.icon.frame.${field} must be numeric`);
      }
    }
    if (frame.width <= 0 || frame.height <= 0) {
      fail(`${pathLabel}.inventory.icon.frame must have positive width and height`);
    }
  }
}

function validateContent(content, fileLabel) {
  if (content.schema_version !== 1) {
    fail(`${fileLabel}: schema_version must be 1`);
  }
  requireString(content.scene_id, `${fileLabel}.scene_id`);
  if (!content.translations || typeof content.translations !== "object") {
    fail(`${fileLabel}.translations must be an object`);
  }
  requireString(content.level_plan?.title, `${fileLabel}.level_plan.title`);
  requireString(content.level_plan?.mission, `${fileLabel}.level_plan.mission`);
  requireString(content.level_plan?.mission_bg, `${fileLabel}.level_plan.mission_bg`);
  validateTranslationCheck(content.level_plan?.translation_check, `${fileLabel}.level_plan.translation_check`);

  const hotspotIds = new Set();
  const collectibleIds = new Set();
  for (const [index, hotspot] of content.hotspots.entries()) {
    requireString(hotspot.id, `${fileLabel}.hotspots[${index}].id`);
    requireString(hotspot.label, `${fileLabel}.hotspots[${index}].label`);
    requireString(hotspot.english, `${fileLabel}.hotspots[${index}].english`);
    requireString(hotspot.bg, `${fileLabel}.hotspots[${index}].bg`);
    if (hotspotIds.has(hotspot.id)) {
      fail(`${fileLabel}: duplicate hotspot id: ${hotspot.id}`);
    }
    hotspotIds.add(hotspot.id);

    if (!["collectible", "scenery"].includes(hotspot.kind)) {
      fail(`${fileLabel}.${hotspot.id}.kind must be collectible or scenery`);
    }
    if (!Number.isFinite(hotspot.x) || !Number.isFinite(hotspot.y) || !Number.isFinite(hotspot.radius)) {
      fail(`${fileLabel}.${hotspot.id} must define numeric x, y, and radius`);
    }
    requirePoint(hotspot.walk_to, `${fileLabel}.${hotspot.id}.walk_to`);

    if (hotspot.kind === "collectible") {
      collectibleIds.add(hotspot.id);
      requireString(hotspot.intro?.text, `${fileLabel}.${hotspot.id}.intro.text`);
      requireString(hotspot.intro?.bg, `${fileLabel}.${hotspot.id}.intro.bg`);
      validateTranslationCheck(
        hotspot.intro?.translation_check,
        `${fileLabel}.${hotspot.id}.intro.translation_check`,
      );
      validateInventoryPresentation(hotspot, `${fileLabel}.${hotspot.id}`);
      requireString(hotspot.learning?.vocabulary_target, `${fileLabel}.${hotspot.id}.learning.vocabulary_target`);
      requireString(hotspot.learning?.curriculum_source, `${fileLabel}.${hotspot.id}.learning.curriculum_source`);
      if (!Array.isArray(hotspot.learning?.grammar_targets) || hotspot.learning.grammar_targets.length === 0) {
        fail(`${fileLabel}.${hotspot.id}.learning.grammar_targets must not be empty`);
      }
    } else {
      requireString(hotspot.description?.text, `${fileLabel}.${hotspot.id}.description.text`);
      requireString(hotspot.description?.bg, `${fileLabel}.${hotspot.id}.description.bg`);
    }
  }

  requireString(content.guide?.locked_text, `${fileLabel}.guide.locked_text`);
  requireString(content.guide?.locked_text_bg, `${fileLabel}.guide.locked_text_bg`);
  requireString(content.guide?.dialogue_start_node, `${fileLabel}.guide.dialogue_start_node`);
  requirePoint(content.guide?.walk_to, `${fileLabel}.guide.walk_to`);
  for (const itemId of content.guide.required_items) {
    if (!collectibleIds.has(itemId)) {
      fail(`${fileLabel}: guide requires unknown collectible: ${itemId}`);
    }
  }

  for (const collectibleId of collectibleIds) {
    const quiz = content.quizzes[collectibleId];
    if (!Array.isArray(quiz) || quiz.length === 0) {
      fail(`${fileLabel}.${collectibleId} must have at least one quiz question`);
    }
    const questionIds = new Set();
    for (const [index, question] of quiz.entries()) {
      requireString(question.id, `${fileLabel}.${collectibleId}.quizzes[${index}].id`);
      requireString(question.exercise_type, `${fileLabel}.${question.id}.exercise_type`);
      requireString(question.curriculum_stage, `${fileLabel}.${question.id}.curriculum_stage`);
      requireString(question.text, `${fileLabel}.${question.id}.text`);
      requireString(question.bg, `${fileLabel}.${question.id}.bg`);
      if (questionIds.has(question.id)) {
        fail(`${fileLabel}: duplicate question id: ${question.id}`);
      }
      questionIds.add(question.id);
      if (![1, 2, 3].includes(question.difficulty)) {
        fail(`${fileLabel}.${question.id}.difficulty must be 1, 2, or 3`);
      }
      if (!Array.isArray(question.options) || question.options.length < 2) {
        fail(`${fileLabel}.${question.id} must have at least two options`);
      }
      const correctOptions = question.options.filter((option) => option.isCorrect === true);
      if (correctOptions.length !== 1) {
        fail(`${fileLabel}.${question.id} must have exactly one correct option`);
      }
      for (const option of question.options) {
        requireString(option.text, `${fileLabel}.${question.id}.option.text`);
        if (!option.isCorrect) {
          requireString(option.feedback, `${fileLabel}.${question.id}.incorrect-option.feedback`);
        }
      }
    }
  }

  for (const quizId of Object.keys(content.quizzes)) {
    if (!collectibleIds.has(quizId)) {
      fail(`${fileLabel}: quiz exists for non-collectible hotspot: ${quizId}`);
    }
  }

  if (content.navigation) {
    if (!Array.isArray(content.navigation.walkable_polygon) || content.navigation.walkable_polygon.length < 3) {
      fail(`${fileLabel}.navigation.walkable_polygon must have at least 3 points`);
    }
    content.navigation.walkable_polygon.forEach((point, index) =>
      requirePoint(point, `${fileLabel}.navigation.walkable_polygon[${index}]`));
    if (!Array.isArray(content.navigation.obstacles)) {
      fail(`${fileLabel}.navigation.obstacles must be an array`);
    }
    for (const [index, obstacle] of content.navigation.obstacles.entries()) {
      requireString(obstacle.id, `${fileLabel}.navigation.obstacles[${index}].id`);
      for (const field of ["x1", "y1", "x2", "y2"]) {
        if (!Number.isFinite(obstacle[field])) {
          fail(`${fileLabel}.navigation.obstacles[${index}].${field} must be numeric`);
        }
      }
      if (obstacle.x1 >= obstacle.x2 || obstacle.y1 >= obstacle.y2) {
        fail(`${fileLabel}.navigation.obstacles[${index}] must have increasing bounds`);
      }
    }
  }

  if (content.exit_marker) {
    requireString(content.exit_marker.label, `${fileLabel}.exit_marker.label`);
    requireString(content.exit_marker.required_flag, `${fileLabel}.exit_marker.required_flag`);
    requireString(content.exit_marker.locked_text, `${fileLabel}.exit_marker.locked_text`);
    requireString(content.exit_marker.locked_text_bg, `${fileLabel}.exit_marker.locked_text_bg`);
    requirePoint(content.exit_marker, `${fileLabel}.exit_marker`);
    requirePoint(content.exit_marker.walk_to, `${fileLabel}.exit_marker.walk_to`);
  }

  if (content.assistant !== undefined) {
    requireString(content.assistant.speaker, `${fileLabel}.assistant.speaker`);
    if (content.assistant.complete_text !== undefined) {
      requireString(content.assistant.complete_text, `${fileLabel}.assistant.complete_text`);
      requireString(content.assistant.complete_bg, `${fileLabel}.assistant.complete_bg`);
    }
    if (content.assistant.fallback_bg !== undefined) {
      requireString(content.assistant.fallback_bg, `${fileLabel}.assistant.fallback_bg`);
    }
    if (!content.assistant.hints || typeof content.assistant.hints !== "object") {
      fail(`${fileLabel}.assistant.hints must be an object`);
    }
    for (const [puzzleId, hint] of Object.entries(content.assistant.hints)) {
      requireString(hint.text, `${fileLabel}.assistant.hints.${puzzleId}.text`);
      requireString(hint.bg, `${fileLabel}.assistant.hints.${puzzleId}.bg`);
    }
  }

  if (content.guide.dialogue_tree) {
    const tree = content.guide.dialogue_tree;
    requireString(tree.start_node, `${fileLabel}.guide.dialogue_tree.start_node`);
    if (!tree.nodes?.[tree.start_node]) {
      fail(`${fileLabel}.guide.dialogue_tree.start_node must reference a node`);
    }
    if (!tree.nodes?.[content.guide.dialogue_start_node]) {
      fail(`${fileLabel}.guide.dialogue_start_node must reference a dialogue tree node`);
    }
  }

  const missingTranslations = [];
  for (const { pathLabel, text } of collectTranslatableTexts(content)) {
    for (const token of englishTokens(text)) {
      if (!content.translations[token] && !builtInTranslations.has(token)) {
        missingTranslations.push(`${pathLabel}:${token}`);
      }
    }
  }
  if (missingTranslations.length > 0) {
    fail(`${fileLabel} missing translations for ${missingTranslations.join(", ")}`);
  }

  return {
    fileLabel,
    hotspotCount: content.hotspots.length,
    collectibleCount: collectibleIds.size,
    questionCount: Object.values(content.quizzes).flat().length,
  };
}

const scenarioFiles = (await readdir(SCENARIOS_DIR))
  .filter((file) => file.endsWith("-content.json"))
  .sort();
const validationResults = [];
let content = null;
for (const file of scenarioFiles) {
  const parsed = JSON.parse(await readFile(path.join(SCENARIOS_DIR, file), "utf8"));
  validationResults.push(validateContent(parsed, file));
  if (file === "james-bond-level-01-content.json") {
    content = parsed;
  }
}
if (!content) {
  fail("james-bond-level-01-content.json must exist");
}

const sandbox = {
  URLSearchParams,
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
    this.loadedImages = [];
    this.loadedSpritesheets = [];
    this.load = {
      image: (key, url) => { this.loadedImages.push({ key, url }); },
      json: (key, url) => { this.loadedJson = { key, url }; },
      spritesheet: (key, url, config) => { this.loadedSpritesheets.push({ key, url, config }); },
    };
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
if (stubScene.loadedJson?.key !== "gameContent" || !stubScene.loadedJson.url.includes("james-bond-level-01-content.json")) {
  fail("data-driven scene must preload james-bond-level-01-content.json by default");
}
stubScene.contentModel = content;
if (stubScene.createObjectQuizzes() !== content.quizzes) {
  fail("data-driven scene must return quizzes from default content");
}
if (stubScene.getWordTranslation("Agent!") !== "агент") {
  fail("data-driven scene must resolve translations from default content");
}

console.log(
  `Validated ${validationResults.length} content files: ${validationResults.map((result) =>
    `${result.fileLabel} (${result.hotspotCount} hotspots, ${result.collectibleCount} collectibles, ${result.questionCount} questions)`).join("; ")}.`,
);
