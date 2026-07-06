import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHANNEL = process.env.BROWSER_CHANNEL || "chrome";
const HEADLESS = process.env.HEADLESS !== "false";
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
]);

function fail(message, details) {
  throw new Error(`${message}${details ? `\n${JSON.stringify(details, null, 2)}` : ""}`);
}

function startServer() {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      const pathname = requestUrl.pathname === "/" ? "/phaser.html" : requestUrl.pathname;
      const filePath = path.normalize(path.join(ROOT, decodeURIComponent(pathname)));
      if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": mimeTypes.get(path.extname(filePath)) || "application/octet-stream",
        "Cache-Control": "no-store, max-age=0",
      });
      response.end(await readFile(filePath));
    } catch (error) {
      response.writeHead(500);
      response.end(String(error));
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, url: `http://${address.address}:${address.port}` });
    });
  });
}

async function clickActiveChoice(page, expectedText) {
  const point = await page.waitForFunction((text) => {
    const scene = window.phaserGame?.scene.getScene("CampScene");
    const bubble = scene?.activeBubble;
    if (!bubble) return null;
    const choice = bubble.list?.find((entry) => entry.choiceData && entry.label?.text === text);
    if (!choice) return null;
    return {
      x: bubble.x + choice.x + choice.hitPlate.x,
      y: bubble.y + choice.y + choice.hitPlate.y,
    };
  }, expectedText, { timeout: 5000 });
  const { x, y } = await point.jsonValue();
  await clickScenePoint(page, x, y);
}

async function clickScenePoint(page, sceneX, sceneY) {
  const canvas = await page.locator("canvas").boundingBox();
  if (!canvas) {
    fail("Could not locate Phaser canvas for scene click");
  }
  await page.mouse.click(
    canvas.x + (sceneX / 1024) * canvas.width,
    canvas.y + (sceneY / 576) * canvas.height,
  );
}

async function clickAssistantAndExpect(page, expectedText) {
  const point = await page.evaluate(() => {
    const scene = window.phaserGame?.scene.getScene("CampScene");
    scene.closeBubble();
    return {
      x: scene.assistantButton.x,
      y: scene.assistantButton.y,
      visible: scene.assistantButton.visible,
      childCount: scene.assistantButton.list.length,
    };
  });
  if (!point.visible || point.childCount < 3) {
    fail("Assistant button should be visible and interactive", point);
  }
  const canvas = await page.locator("canvas").boundingBox();
  if (!canvas) {
    fail("Could not locate Phaser canvas for assistant click");
  }
  await page.mouse.click(
    canvas.x + (point.x / 1024) * canvas.width,
    canvas.y + (point.y / 576) * canvas.height,
  );
  await page.waitForFunction((text) => {
    const scene = window.phaserGame?.scene.getScene("CampScene");
    return scene?.activeBubble?.assistantHint?.text === text;
  }, expectedText, { timeout: 5000 });
  const result = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    return {
      text: scene.activeBubble.assistantHint.text,
      bg: scene.activeBubble.assistantHint.bg,
      choices: scene.activeBubble.list
        .filter((entry) => entry.choiceData && entry.label)
        .map((entry) => entry.label.text),
    };
  });
  await clickActiveChoice(page, "OK");
  return result;
}

async function completeSupplyMessageThroughUi(page) {
  const hotspotPoint = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const supply = scene.hotspots.find((entry) => entry.id === "supply_message");
    const computer = scene.hotspots.find((entry) => entry.id === "computer_station");
    return {
      x: supply.x,
      y: supply.y,
      supplyVisible: supply.zone.visible && supply.marker.visible,
      supplyInteractive: Boolean(supply.zone.input?.enabled),
      computerVisible: computer.zone.visible && computer.marker.visible,
      commandBefore: scene.commandText.text,
    };
  });
  if (!hotspotPoint.supplyVisible || !hotspotPoint.supplyInteractive || hotspotPoint.computerVisible) {
    fail("Returned Level 02 should expose only the supply message at the desk station", hotspotPoint);
  }

  await clickScenePoint(page, hotspotPoint.x, hotspotPoint.y);
  await page.waitForFunction(() => {
    const scene = window.phaserGame?.scene.getScene("CampScene");
    return scene?.activeBubble?.list?.some((entry) =>
      entry.label?.text === "Списъкът от селото е на бюрото. Изпрати плана: Ние помагаме на селото.");
  });
  await clickActiveChoice(page, "Списъкът от селото е на бюрото. Изпрати плана: Ние помагаме на селото.");
  await clickActiveChoice(page, "We help the village.");
  await clickActiveChoice(page, "water");
  await clickActiveChoice(page, "We help the village. They need water, fruit, and a football.");
  await page.waitForFunction(() =>
    window.__ENGLISH_GAME_ENGINE__?.getPuzzleStatus("level02_send_village_plan") === "completed");
}

async function completeMissionFromPlanHotspotThroughUi(page, hotspotId, correctTranslation, expectedPuzzleId) {
  const hotspotPoint = await page.evaluate((id) => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    scene.closeBubble();
    const hotspot = scene.hotspots.find((entry) => entry.id === id);
    return {
      x: hotspot.x,
      y: hotspot.y,
      visible: hotspot.zone.visible && hotspot.marker.visible,
      interactive: Boolean(hotspot.zone.input?.enabled),
    };
  }, hotspotId);
  if (!hotspotPoint.visible || !hotspotPoint.interactive) {
    fail(`Mission plan hotspot ${hotspotId} should be visible and interactive`, hotspotPoint);
  }
  await clickScenePoint(page, hotspotPoint.x, hotspotPoint.y);
  await clickActiveChoice(page, correctTranslation);
  await page.waitForFunction((puzzleId) =>
    window.__ENGLISH_GAME_ENGINE__?.getPuzzleStatus(puzzleId) === "completed",
  expectedPuzzleId);
}

async function completeCollectibleThroughUi(page, hotspotId, answers, expectedPuzzleId) {
  const hotspotPoint = await page.evaluate((id) => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const hotspot = scene.hotspots.find((entry) => entry.id === id);
    return {
      x: hotspot.x,
      y: hotspot.y,
      visible: hotspot.zone.visible && hotspot.marker.visible,
      interactive: Boolean(hotspot.zone.input?.enabled),
      commandBefore: scene.commandText.text,
    };
  }, hotspotId);
  if (!hotspotPoint.visible || !hotspotPoint.interactive) {
    fail(`Hotspot ${hotspotId} should be visible and interactive`, hotspotPoint);
  }
  await clickScenePoint(page, hotspotPoint.x, hotspotPoint.y);
  for (const answer of answers) {
    await clickActiveChoice(page, answer);
  }
  await page.waitForFunction((puzzleId) =>
    window.__ENGLISH_GAME_ENGINE__?.getPuzzleStatus(puzzleId) === "completed",
  expectedPuzzleId);
}

async function completeGuideThroughUi(page, answers, expectedPuzzleId) {
  const guidePoint = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    scene.closeBubble();
    return {
      x: scene.guide.zone.x,
      y: scene.guide.zone.y,
      visible: scene.guide.zone.visible,
      interactive: Boolean(scene.guide.zone.input?.enabled),
    };
  });
  if (!guidePoint.visible || !guidePoint.interactive) {
    fail("Guide should be visible and interactive", guidePoint);
  }
  await clickScenePoint(page, guidePoint.x, guidePoint.y);
  for (const answer of answers) {
    await clickActiveChoice(page, answer);
  }
  await page.waitForFunction((puzzleId) =>
    window.__ENGLISH_GAME_ENGINE__?.getPuzzleStatus(puzzleId) === "completed",
  expectedPuzzleId);
}

async function clickExitThroughUi(page, expectedPuzzleId) {
  const exitPoint = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    scene.closeBubble();
    return {
      x: scene.exitMarker.zone.x,
      y: scene.exitMarker.zone.y,
      label: scene.exitMarker.label.text,
      interactive: Boolean(scene.exitMarker.zone.input?.enabled),
    };
  });
  if (!exitPoint.interactive) {
    fail("Exit should be interactive", exitPoint);
  }
  await clickScenePoint(page, exitPoint.x, exitPoint.y);
  await page.waitForFunction((puzzleId) =>
    window.__ENGLISH_GAME_ENGINE__?.getPuzzleStatus(puzzleId) === "completed",
  expectedPuzzleId);
  return exitPoint;
}

const { server, url } = await startServer();
let browser;
try {
  browser = await chromium.launch({ channel: CHANNEL, headless: HEADLESS });
  const context = await browser.newContext({ viewport: { width: 1024, height: 576 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  const level1Scenario = "scenarios/james-bond-level-01-content.json";
  await page.goto(`${url}/phaser.html?scenario=${encodeURIComponent(level1Scenario)}&test=bond-engine`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() => window.__ENGLISH_GAME_ENGINE__?.config?.scene_id === "james-bond-level-01");
  const initialAssistant = await clickAssistantAndExpect(page, "Read the mission screen first.");
  if (!initialAssistant.bg || !initialAssistant.choices.includes("OK")) {
    fail("Initial assistant hint should be child-friendly and dismissible", initialAssistant);
  }
  const level1 = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    const scene = window.phaserGame.scene.getScene("CampScene");
    scene.closeBubble();
    engine.emit("mission.understood", { target: "james-bond-level-01" });
    for (const id of ["agent_badge", "dossier_clue", "profile_form"]) {
      engine.emit("collectible.completed", { target: id });
    }
    engine.emit("guide.completed", { target: "director" });
    const beforeExit = engine.getSnapshot();
    const inventoryBeforeExit = [...scene.learnedWords];
    const inventoryIcons = scene.inventoryItems.list
      .filter((slot) => slot.isInventorySlot)
      .map((slot) => ({
        label: slot.hotspot.label,
        type: slot.icon.type,
        texture: slot.icon.texture?.key || null,
        frame: slot.icon.frame?.name || null,
      }));
    engine.emit("exit.reached", { target: "training_door" });
    return {
      puzzles: beforeExit.state.puzzles,
      inventory: inventoryBeforeExit,
      inventoryIcons,
      flag: scene.flags.training_door_open,
    };
  });
  if (level1.puzzles.level01_director_approval !== "completed" || !level1.flag || level1.inventory.length !== 3) {
    fail("Level 01 did not complete through the puzzle/ECA bridge", level1);
  }
  if (level1.inventoryIcons.length !== 3 || level1.inventoryIcons.some((icon) => icon.texture !== "interactiveProps")) {
    fail("Level 01 inventory should use generated prop-sheet icons", level1.inventoryIcons);
  }

  await page.waitForURL(
    (current) => current.searchParams.get("scenario") === "scenarios/james-bond-level-02-content.json",
    { timeout: 5000 },
  );
  await page.waitForFunction(() => window.__ENGLISH_GAME_ENGINE__?.config?.scene_id === "james-bond-level-02");
  const level2 = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    const scene = window.phaserGame.scene.getScene("CampScene");
    const persistedLevel1 = engine.getSnapshot().state.puzzles.level01_enter_training_door;
    engine.emit("mission.understood", { target: "james-bond-level-02" });
    for (const id of ["phone_clue", "camera_clue", "hidden_bag"]) {
      engine.emit("collectible.completed", { target: id });
    }
    const inventoryIcons = scene.inventoryItems.list
      .filter((slot) => slot.isInventorySlot)
      .map((slot) => ({
        label: slot.hotspot.label,
        type: slot.icon.type,
        texture: slot.icon.texture?.key || null,
        frame: slot.icon.frame?.name || null,
      }));
    engine.emit("guide.completed", { target: "director" });
    engine.emit("exit.reached", { target: "safe_flat_door" });
    return { persistedLevel1, inventoryIcons, snapshot: engine.getSnapshot() };
  });
  if (level2.persistedLevel1 !== "completed") {
    fail("Level 01 state was not retained after navigation", level2);
  }
  if (level2.snapshot.state.puzzles.level02_enter_village_path !== "completed") {
    fail("Level 02 final puzzle was not completed", level2);
  }
  if (level2.snapshot.state.facts["level03.unlocked"] !== true) {
    fail("Level 03 unlock fact is missing", level2);
  }
  if (level2.inventoryIcons.length !== 3 || level2.inventoryIcons.some((icon) => icon.texture !== "interactiveProps")) {
    fail("Level 02 inventory should use generated prop-sheet icons", level2.inventoryIcons);
  }

  await page.waitForURL(
    (current) => current.searchParams.get("scenario") === "scenarios/james-bond-level-03-content.json",
    { timeout: 5000 },
  );
  await page.waitForFunction(() => window.__ENGLISH_GAME_ENGINE__?.config?.scene_id === "james-bond-level-03");
  const level3Art = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    scene.closeBubble();
    return {
      resources: performance.getEntriesByType("resource").map((entry) => entry.name),
      hotspots: scene.hotspots.map((hotspot) => ({
        id: hotspot.id,
        scenery: hotspot.scenery,
        visible: hotspot.marker.visible,
        hasSceneIcon: Boolean(hotspot.sceneIcon),
        labelAlpha: hotspot.labelText?.alpha ?? 0,
      })),
      exitHasSceneIcon: Boolean(scene.exitMarker.sceneIcon),
      exitIconFrame: scene.contentModel.exit_marker.scene_icon.frame,
      teacherRoleLabel: scene.guide.roleLabel?.text || "",
      teacherHeight: scene.guide.sprite.displayHeight * scene.guide.scaleX,
    };
  });
  if (
    !level3Art.resources.some((resource) => resource.includes("level-03-village-camp/generated/village-camp-background.png"))
    || !level3Art.resources.some((resource) => resource.includes("level-03-village-camp/generated/interactive-props.png"))
    || !level3Art.resources.some((resource) => resource.includes("level-03-village-camp/generated/teacher-guide-spritesheet.png"))
    || !level3Art.exitHasSceneIcon
    || level3Art.hotspots.some((hotspot) => !hotspot.visible || hotspot.labelAlpha < 0.95)
    || level3Art.hotspots.some((hotspot) => !hotspot.scenery && hotspot.hasSceneIcon)
    || level3Art.hotspots.some((hotspot) => hotspot.scenery && !hotspot.hasSceneIcon)
    || level3Art.exitIconFrame.x !== 1152
    || level3Art.exitIconFrame.y !== 512
    || level3Art.teacherRoleLabel !== "Teacher"
    || level3Art.teacherHeight < 205
  ) {
    fail("Level 03 should render readable village art, labels, teacher role, and distinct map-room exit cue", level3Art);
  }
  await page.evaluate(() => window.__ENGLISH_GAME_ENGINE__.emit("mission.understood", { target: "james-bond-level-03" }));
  await completeCollectibleThroughUi(page, "bread_note", [
    "Готвачът има хляб на масата. Готвачът казва: Аз правя хляб за приятели.",
    "bread",
    "make",
    "I make bread for friends.",
  ], "level03_bread_note");
  const level3 = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    const scene = window.phaserGame.scene.getScene("CampScene");
    const persistedLevel2 = engine.getSnapshot().state.puzzles.level02_enter_village_path;
    for (const id of ["football_clue", "teacher_map"]) {
      engine.emit("collectible.completed", { target: id });
    }
    const inventoryIcons = scene.inventoryItems.list
      .filter((slot) => slot.isInventorySlot)
      .map((slot) => ({
        label: slot.hotspot.label,
        type: slot.icon.type,
        texture: slot.icon.texture?.key || null,
        frame: slot.icon.frame?.name || null,
      }));
    engine.emit("guide.completed", { target: "teacher" });
    engine.emit("exit.reached", { target: "map_room_path" });
    return { persistedLevel2, inventoryIcons, snapshot: engine.getSnapshot() };
  });
  if (level3.persistedLevel2 !== "completed") {
    fail("Level 02 state was not retained after Level 03 navigation", level3);
  }
  if (level3.snapshot.state.puzzles.level03_return_to_map_room !== "completed") {
    fail("Level 03 final puzzle was not completed", level3);
  }
  if (level3.snapshot.state.facts["level02.return_unlocked"] !== true) {
    fail("Level 02 return unlock fact is missing", level3);
  }
  if (level3.inventoryIcons.length !== 3 || level3.inventoryIcons.some((icon) => icon.texture !== "interactiveProps")) {
    fail("Level 03 inventory should use generated prop-sheet icons", level3.inventoryIcons);
  }

  await page.waitForURL(
    (current) => current.searchParams.get("scenario") === "scenarios/james-bond-level-02-content.json",
    { timeout: 5000 },
  );
  await page.waitForFunction(() => window.__ENGLISH_GAME_ENGINE__?.config?.scene_id === "james-bond-level-02");
  const returnAssistant = await clickAssistantAndExpect(page, "Send the supply message.");
  if (!returnAssistant.bg || !returnAssistant.choices.includes("OK")) {
    fail("Returned Level 02 assistant should explain the state-specific task", returnAssistant);
  }
  await completeSupplyMessageThroughUi(page);
  const level2Return = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    const scene = window.phaserGame.scene.getScene("CampScene");
    const returnUnlocked = engine.getSnapshot().state.facts["level02.return_unlocked"];
    const inventoryIcons = scene.inventoryItems.list
      .filter((slot) => slot.isInventorySlot)
      .map((slot) => ({
        label: slot.hotspot.label,
        type: slot.icon.type,
        texture: slot.icon.texture?.key || null,
        frame: slot.icon.frame?.name || null,
      }));
    const commandText = scene.commandText.text;
    const statusText = scene.statusText.text;
    const exitLabel = scene.exitMarker.label.text;
    engine.emit("exit.reached", { target: "safe_flat_door" });
    return { returnUnlocked, inventoryIcons, commandText, statusText, exitLabel, snapshot: engine.getSnapshot() };
  });
  if (level2Return.returnUnlocked !== true) {
    fail("Returned Level 02 scene did not receive return unlock fact", level2Return);
  }
  if (
    level2Return.statusText !== "Village supply plan sent"
    || level2Return.exitLabel !== "final report"
    || !level2Return.commandText.includes("supply message")
  ) {
    fail("Returned Level 02 UI did not communicate the state-specific supply task", level2Return);
  }
  if (level2Return.snapshot.state.puzzles.level02_complete_village_loop !== "completed") {
    fail("Level 02 return final puzzle was not completed", level2Return);
  }
  if (level2Return.snapshot.state.facts["level04.unlocked"] !== true) {
    fail("Level 04 unlock fact is missing", level2Return);
  }
  if (level2Return.inventoryIcons.length !== 1 || level2Return.inventoryIcons.some((icon) => icon.texture !== "interactiveProps")) {
    fail("Level 02 return inventory should use a generated prop-sheet icon", level2Return.inventoryIcons);
  }

  await page.waitForURL(
    (current) => current.searchParams.get("scenario") === "scenarios/james-bond-level-04-content.json",
    { timeout: 5000 },
  );
  await page.waitForFunction(() => window.__ENGLISH_GAME_ENGINE__?.config?.scene_id === "james-bond-level-04");
  await completeMissionFromPlanHotspotThroughUi(
    page,
    "field_board",
    "Героят изучава навиците на животно и намира най-доброто време, за да мине през портата на базата.",
    "level04_understand_mission",
  );
  await completeCollectibleThroughUi(page, "animal_report", [
    "Докладът казва: Тигърът спи сутрин. Той ходи през нощта.",
    "tiger",
    "sleeps",
    "true",
  ], "level04_animal_report");
  await completeCollectibleThroughUi(page, "meat_bowl", [
    "Животното яде месо. То не яде плод.",
    "meat",
    "doesn't",
    "It eats meat.",
  ], "level04_meat_bowl");
  await completeCollectibleThroughUi(page, "trail_camera", [
    "Камерата на пътеката показва местообитание на змия зад камъка. Крие ли се тя през деня?",
    "habitat",
    "Does",
    "Yes, it does.",
  ], "level04_trail_camera");
  await completeGuideThroughUi(page, [
    "It sleeps in the morning.",
    "No, it doesn't. It eats meat.",
  ], "level04_ranger_check");
  const level4 = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    const scene = window.phaserGame.scene.getScene("CampScene");
    const persistedLevel2Return = engine.getSnapshot().state.puzzles.level02_complete_village_loop;
    const inventoryIcons = scene.inventoryItems.list
      .filter((slot) => slot.isInventorySlot)
      .map((slot) => ({
        label: slot.hotspot.label,
        type: slot.icon.type,
        texture: slot.icon.texture?.key || null,
        frame: slot.icon.frame?.name || null,
      }));
    return { persistedLevel2Return, inventoryIcons, snapshot: engine.getSnapshot() };
  });
  const level4Exit = await clickExitThroughUi(page, "level04_quiet_gate");
  if (level4Exit.label !== "base gate") {
    fail("Level 04 exit should be presented as the base gate", level4Exit);
  }
  if (level4.persistedLevel2Return !== "completed") {
    fail("Level 02 return state was not retained after Level 04 navigation", level4);
  }
  if (
    level4.inventoryIcons.length !== 3
    || level4.inventoryIcons.some((icon) => icon.texture !== "interactiveProps")
    || !level4.inventoryIcons.every((icon) => typeof icon.frame === "string" && icon.frame.startsWith("inventory-"))
  ) {
    fail("Level 04 inventory should use level-specific prop-sheet icons", level4.inventoryIcons);
  }

  // Wait for transition to Level 5
  await page.waitForURL(
    (current) => current.searchParams.get("scenario") === "scenarios/james-bond-level-05-content.json",
    { timeout: 5000 },
  );
  await page.waitForFunction(() => window.__ENGLISH_GAME_ENGINE__?.config?.scene_id === "james-bond-level-05");

  await completeMissionFromPlanHotspotThroughUi(
    page,
    "briefing_board",
    "Героят посещава лабораторията на Q, за да провери своите шпионски джаджи и да се научи да използва have, has и притежателни форми.",
    "level05_understand_mission",
  );
  await completeCollectibleThroughUi(page, "gadget_watch", [
    "Намираш часовника на Q. Аз имам малък часовник на ръката си.",
    "watch",
    "have",
    "This is Q's watch.",
  ], "level05_gadget_watch");
  await completeCollectibleThroughUi(page, "gadget_glasses", [
    "Това са неговите очила. Имаш ли очила, за да виждаш в тъмното?",
    "glasses",
    "Do",
    "Yes, I do.",
  ], "level05_gadget_glasses");
  await completeCollectibleThroughUi(page, "gadget_jacket", [
    "Той има голямо яке. Той няма ботуши в своята кола.",
    "jacket",
    "has",
    "He doesn't have boots.",
  ], "level05_gadget_jacket");
  await completeGuideThroughUi(page, [
    "I have the watch.",
    "He has a big jacket.",
  ], "level05_q_approval");

  const level5 = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    const scene = window.phaserGame.scene.getScene("CampScene");
    const inventoryIcons = scene.inventoryItems.list
      .filter((slot) => slot.isInventorySlot)
      .map((slot) => ({
        label: slot.hotspot.label,
        type: slot.icon.type,
        texture: slot.icon.texture?.key || null,
        frame: slot.icon.frame?.name || null,
      }));
    return { inventoryIcons, snapshot: engine.getSnapshot() };
  });
  const level5Exit = await clickExitThroughUi(page, "level05_lab_exit");

  if (level5Exit.label !== "security door") {
    fail("Level 05 exit should be presented as the security door", level5Exit);
  }
  if (
    level5.inventoryIcons.length !== 3
    || level5.inventoryIcons.some((icon) => icon.texture !== "interactiveProps")
    || !level5.inventoryIcons.every((icon) => typeof icon.frame === "string" && icon.frame.startsWith("inventory-"))
  ) {
    fail("Level 05 inventory should use level-specific prop-sheet icons", level5.inventoryIcons);
  }

  const level5PostExit = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    return { snapshot: engine.getSnapshot() };
  });
  if (level5PostExit.snapshot.state.puzzles.level05_lab_exit !== "completed") {
    fail("Level 05 final puzzle was not completed", level5PostExit);
  }
  if (level5PostExit.snapshot.state.facts["campaign.levels_01_to_05_complete"] !== true) {
    fail("Level 05 campaign completion fact is missing", level5PostExit);
  }

  if (errors.length) fail("Browser console reported errors", errors);

  await page.goto(`${url}/phaser.html?level=2&reset=1&test=level2-direct`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() => window.__ENGLISH_GAME_ENGINE__?.config?.scene_id === "james-bond-level-02");
  const directLevel2 = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    const scene = window.phaserGame.scene.getScene("CampScene");
    scene.closeBubble();
    const initial = engine.getSnapshot();
    const characterCheck = {
      heroTexture: scene.hero.sprite.texture.key,
      guideTexture: scene.guide.sprite.texture.key,
      heroSource: scene.textures.get("heroSprite").source[0].image?.src || "",
      guideSource: scene.textures.get("guideSprite").source[0].image?.src || "",
      heroHeight: Number(scene.hero.sprite.displayHeight.toFixed(1)),
      guideHeight: Number(scene.guide.sprite.displayHeight.toFixed(1)),
      heroScale: Number(scene.hero.scaleX.toFixed(3)),
      guideScale: Number(scene.guide.scaleX.toFixed(3)),
      renderedHeroHeight: Number((scene.hero.sprite.displayHeight * scene.hero.scaleX).toFixed(1)),
      renderedGuideHeight: Number((scene.guide.sprite.displayHeight * scene.guide.scaleX).toFixed(1)),
    };
    engine.emit("mission.understood", { target: "james-bond-level-02" });
    for (const id of ["phone_clue", "camera_clue", "hidden_bag"]) {
      engine.emit("collectible.completed", { target: id });
    }
    engine.emit("guide.completed", { target: "director" });
    engine.emit("exit.reached", { target: "safe_flat_door" });
    return {
      initialCurrentScene: initial.state.currentScene,
      initialLevel1Complete: initial.state.puzzles.level01_enter_training_door || null,
      characterCheck,
      resources: performance.getEntriesByType("resource").map((entry) => entry.name),
      final: engine.getSnapshot(),
    };
  });
  if (directLevel2.initialCurrentScene !== "james-bond-level-02" || directLevel2.initialLevel1Complete) {
    fail("Direct Level 02 test URL should start Level 02 from clean campaign state", directLevel2);
  }
  if (
    !directLevel2.resources.some((resource) => resource.includes("hero-spy-natural-spritesheet.png"))
    || !directLevel2.resources.some((resource) => resource.includes("director-guide-spritesheet.png"))
    || directLevel2.characterCheck.renderedHeroHeight < 230
    || directLevel2.characterCheck.renderedGuideHeight < 250
  ) {
    fail("Direct Level 02 should use correctly scaled spy character sprites", {
      characterCheck: directLevel2.characterCheck,
      resources: directLevel2.resources.filter((resource) =>
        resource.includes("spritesheet") || resource.includes("portraits")),
    });
  }
  if (directLevel2.final.state.puzzles.level02_enter_village_path !== "completed") {
    fail("Direct Level 02 test URL did not allow Level 02 transition completion", directLevel2);
  }

  console.log(JSON.stringify({
    level1: "completed",
    level2: "transitioned",
    level3: "returned",
    level2Return: "transitioned",
    level4: "completed",
    directLevel2: "completed",
    campaignStatePersisted: true,
  }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
