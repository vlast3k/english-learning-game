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

async function clickActiveCorrectChoice(page) {
  const point = await page.waitForFunction(() => {
    const scene = window.phaserGame?.scene.getScene("CampScene");
    const bubble = scene?.activeBubble;
    if (!bubble) return null;
    const choice = bubble.list?.find((entry) => entry.choiceData?.isCorrect === true && entry.hitPlate);
    if (!choice) return null;
    return {
      x: bubble.x + choice.x + choice.hitPlate.x,
      y: bubble.y + choice.y + choice.hitPlate.y,
      text: choice.label?.text || "",
    };
  }, null, { timeout: 5000 });
  const { x, y } = await point.jsonValue();
  await clickScenePoint(page, x, y);
}

async function clickActiveIncorrectChoice(page) {
  const point = await page.waitForFunction(() => {
    const scene = window.phaserGame?.scene.getScene("CampScene");
    const bubble = scene?.activeBubble;
    if (!bubble) return null;
    const choice = bubble.list?.find((entry) => entry.choiceData && entry.choiceData.isCorrect !== true && entry.hitPlate);
    if (!choice) return null;
    return {
      x: bubble.x + choice.x + choice.hitPlate.x,
      y: bubble.y + choice.y + choice.hitPlate.y,
      text: choice.label?.text || "",
    };
  }, null, { timeout: 5000 });
  const { x, y } = await point.jsonValue();
  await clickScenePoint(page, x, y);
}

async function clickActiveCloseButton(page) {
  await page.waitForFunction(() => {
    const scene = window.phaserGame?.scene.getScene("CampScene");
    const bubble = scene?.activeBubble;
    if (!bubble) return null;
    const closeButton = bubble.list?.find((entry) => entry.isCloseButton && entry.hitPlate);
    if (!closeButton) return null;
    return true;
  }, null, { timeout: 5000 });
  await page.evaluate(() => {
    const scene = window.phaserGame?.scene.getScene("CampScene");
    scene?.closeBubble();
    scene?.setCommand("Gate review paused");
  });
}

async function getGateReviewState(page) {
  return page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const bubble = scene.activeBubble;
    if (!bubble) {
      return null;
    }
    const countRevealBars = (entry) => {
      const own = entry.revealBar ? 1 : 0;
      const children = entry.list || [];
      return own + children.reduce((total, child) => total + countRevealBars(child), 0);
    };
    const collectWords = (entry) => {
      const own = entry.originalText ? [entry.originalText] : [];
      const children = entry.list || [];
      return own.concat(children.flatMap((child) => collectWords(child)));
    };
    return {
      speaker: bubble.list.find((entry) => entry.text === "Gate Review")?.text || "",
      revealBars: countRevealBars(bubble),
      choices: bubble.list.filter((entry) => entry.choiceData).length,
      prompt: collectWords(bubble).join(" ").replace(/\s+([:./])/g, "$1"),
    };
  });
}

let gateProtectionsChecked = false;

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
  await page.waitForFunction(() => {
    const scene = window.phaserGame?.scene.getScene("CampScene");
    return scene?.activeBubble?.list?.some((entry) =>
      entry.text === "Gate Review") && scene.activeBubble.list.some((entry) => entry.choiceData);
  }, null, { timeout: 5000 });
  let startIndex = 0;
  if (!gateProtectionsChecked) {
    await clickActiveIncorrectChoice(page);
    const feedback = await page.waitForFunction(() => {
      const scene = window.phaserGame?.scene.getScene("CampScene");
      const note = scene?.activeBubble?.feedbackNote;
      return note?.visible && note.text.includes(" = ") ? note.text : null;
    }, null, { timeout: 5000 });
    const feedbackText = await feedback.jsonValue();
    if (!feedbackText.includes("Try again.")) {
      fail("Gate wrong-answer feedback should show the correct word pair", feedbackText);
    }
    await clickActiveCorrectChoice(page);
    await page.waitForFunction(() => {
      const scene = window.phaserGame?.scene.getScene("CampScene");
      const bubble = scene?.activeBubble;
      const collectWords = (entry) => {
        const own = entry.originalText ? [entry.originalText] : [];
        const children = entry.list || [];
        return own.concat(children.flatMap((child) => collectWords(child)));
      };
      const prompt = bubble ? collectWords(bubble).join(" ") : "";
      return prompt.includes("Gate review 2/10");
    }, null, { timeout: 5000 });
    await clickActiveCloseButton(page);
    await page.waitForFunction(() => {
      const scene = window.phaserGame?.scene.getScene("CampScene");
      return !scene?.activeBubble && scene?.commandText?.text === "Gate review paused";
    }, null, { timeout: 5000 });
    const resumedExitPoint = await page.evaluate(() => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      return {
        x: scene.exitMarker.zone.x,
        y: scene.exitMarker.zone.y,
        interactive: Boolean(scene.exitMarker.zone.input?.enabled),
      };
    });
    if (!resumedExitPoint.interactive) {
      fail("Exit should remain interactive after pausing gate review", resumedExitPoint);
    }
    await clickScenePoint(page, resumedExitPoint.x, resumedExitPoint.y);
    await page.waitForFunction(() => {
      const scene = window.phaserGame?.scene.getScene("CampScene");
      const bubble = scene?.activeBubble;
      const collectWords = (entry) => {
        const own = entry.originalText ? [entry.originalText] : [];
        const children = entry.list || [];
        return own.concat(children.flatMap((child) => collectWords(child)));
      };
      const prompt = bubble ? collectWords(bubble).join(" ") : "";
      return prompt.includes("Gate review 2/10");
    }, null, { timeout: 5000 });
    gateProtectionsChecked = true;
    startIndex = 1;
  }
  const directions = startIndex === 1 ? ["en-bg"] : [];
  for (let index = startIndex; index < 10; index += 1) {
    await page.waitForFunction((questionNumber) => {
      const scene = window.phaserGame?.scene.getScene("CampScene");
      const bubble = scene?.activeBubble;
      const collectWords = (entry) => {
        const own = entry.originalText ? [entry.originalText] : [];
        const children = entry.list || [];
        return own.concat(children.flatMap((child) => collectWords(child)));
      };
      const prompt = bubble ? collectWords(bubble).join(" ") : "";
      return bubble?.list?.some((entry) => entry.text === "Gate Review")
        && bubble.list.some((entry) => entry.choiceData)
        && prompt.includes(`Gate review ${questionNumber}/10`);
    }, index + 1, { timeout: 5000 });
    const reviewState = await getGateReviewState(page);
    if (
      reviewState?.speaker !== "Gate Review"
      || reviewState.revealBars !== 0
      || reviewState.choices !== 3
      || !reviewState.prompt.includes(`Gate review ${index + 1}/10`)
    ) {
      fail("Exit gate review question should have progress, three choices, and no hover translation bars", reviewState);
    }
    if (reviewState.prompt.includes("Bulgarian code word")) {
      directions.push("en-bg");
    } else if (reviewState.prompt.includes("English code word")) {
      directions.push("bg-en");
    } else {
      fail("Exit gate review should state the answer direction", reviewState);
    }
    await clickActiveCorrectChoice(page);
  }
  if (directions.filter((direction) => direction === "en-bg").length !== 5
    || directions.filter((direction) => direction === "bg-en").length !== 5) {
    fail("Exit gate review should ask five questions in each direction", directions);
  }
  await page.waitForFunction((puzzleId) =>
    window.__ENGLISH_GAME_ENGINE__?.getPuzzleStatus(puzzleId) === "completed",
  expectedPuzzleId);
  return exitPoint;
}

async function verifyCompletedExitSkipsGate(page) {
  const exitPoint = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    scene.closeBubble();
    return {
      x: scene.exitMarker.zone.x,
      y: scene.exitMarker.zone.y,
      interactive: Boolean(scene.exitMarker.zone.input?.enabled),
    };
  });
  if (!exitPoint.interactive) {
    fail("Completed exit should remain interactive", exitPoint);
  }
  await clickScenePoint(page, exitPoint.x, exitPoint.y);
  await page.waitForTimeout(600);
  const gateVisible = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    return scene.activeBubble?.list?.some((entry) => entry.text === "Gate Review") || false;
  });
  if (gateVisible) {
    fail("Completed exit should not show the vocabulary gate again");
  }
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
        labelAlpha: hotspot.labelText?.alpha ?? 0,
      })),
      exitZone: scene.contentModel.exit_marker.zone,
      teacherRoleLabel: scene.guide.roleLabel?.text || "",
      teacherHeight: scene.guide.sprite.displayHeight * scene.guide.scaleX,
    };
  });
  if (
    !level3Art.resources.some((resource) => resource.includes("level-03-village-camp/generated/village-camp-background.png"))
    || !level3Art.resources.some((resource) => resource.includes("level-03-village-camp/generated/interactive-props.png"))
    || !level3Art.resources.some((resource) => resource.includes("level-03-village-camp/generated/teacher-guide-spritesheet.png"))
    || level3Art.hotspots.some((hotspot) => !hotspot.visible || hotspot.labelAlpha < 0.95)
    || level3Art.exitZone.width <= 0
    || level3Art.exitZone.height <= 0
    || level3Art.teacherRoleLabel !== "Teacher"
    || level3Art.teacherHeight < 190
  ) {
    fail("Level 03 should render embedded village art, labels, teacher role, and a painted map-room exit zone", level3Art);
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
  if (level5PostExit.snapshot.state.facts["level06.unlocked"] !== true) {
    fail("Level 06 unlock fact is missing after Level 05", level5PostExit);
  }

  // Wait for transition to Level 6
  await page.waitForURL(
    (current) => current.searchParams.get("scenario") === "scenarios/james-bond-level-06-content.json",
    { timeout: 5000 },
  );
  await page.waitForFunction(() => window.__ENGLISH_GAME_ENGINE__?.config?.scene_id === "james-bond-level-06");

  await completeMissionFromPlanHotspotThroughUi(
    page,
    "route_board",
    "Агент Алекс изучава маршрутна станция, за да намери безопасната пътека от реката, през селото и към планината.",
    "level06_understand_mission",
  );
  await completeCollectibleThroughUi(page, "river_map", [
    "Намираш картата на реката. Къде е реката? Реката е отляво.",
    "river",
    "Where",
    "The river is on the left.",
  ], "level06_river_map");
  await completeCollectibleThroughUi(page, "boat_ticket", [
    "Това е билетът за лодката. Къде е лодката? Лодката е до моста.",
    "boat",
    "next",
    "It is next to the bridge.",
  ], "level06_boat_ticket");
  await completeCollectibleThroughUi(page, "mountain_photo", [
    "Това са планините на снимката. Къде са планините? Те са зад селото.",
    "mountain",
    "are",
    "The mountains are behind the village.",
  ], "level06_mountain_photo");
  await completeGuideThroughUi(page, [
    "The river is on the left.",
    "They are behind the village.",
  ], "level06_guide_route_check");

  const level6 = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    const scene = window.phaserGame.scene.getScene("CampScene");
    const persistedLevel5 = engine.getSnapshot().state.puzzles.level05_lab_exit;
    const inventoryIcons = scene.inventoryItems.list
      .filter((slot) => slot.isInventorySlot)
      .map((slot) => ({
        label: slot.hotspot.label,
        type: slot.icon.type,
        texture: slot.icon.texture?.key || null,
        frame: slot.icon.frame?.name || null,
      }));
    return { persistedLevel5, inventoryIcons, snapshot: engine.getSnapshot() };
  });
  const level6Exit = await clickExitThroughUi(page, "level06_mountain_path_exit");

  if (level6Exit.label !== "mountain path") {
    fail("Level 06 exit should be presented as the mountain path", level6Exit);
  }
  if (level6.persistedLevel5 !== "completed") {
    fail("Level 05 state was not retained after Level 06 navigation", level6);
  }
  if (
    level6.inventoryIcons.length !== 3
    || level6.inventoryIcons.some((icon) => icon.texture !== "interactiveProps")
    || !level6.inventoryIcons.every((icon) => typeof icon.frame === "string" && icon.frame.startsWith("inventory-"))
  ) {
    fail("Level 06 inventory should use level-specific prop-sheet icons", level6.inventoryIcons);
  }

  const level6PostExit = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    return { snapshot: engine.getSnapshot() };
  });
  if (level6PostExit.snapshot.state.puzzles.level06_mountain_path_exit !== "completed") {
    fail("Level 06 final puzzle was not completed", level6PostExit);
  }
  if (level6PostExit.snapshot.state.facts["level07.unlocked"] !== true) {
    fail("Level 07 unlock fact is missing after Level 06", level6PostExit);
  }

  // Wait for transition to Level 7
  await page.waitForURL(
    (current) => current.searchParams.get("scenario") === "scenarios/james-bond-level-07-content.json",
    { timeout: 5000 },
  );
  await page.waitForFunction(() => window.__ENGLISH_GAME_ENGINE__?.config?.scene_id === "james-bond-level-07");

  await completeMissionFromPlanHotspotThroughUi(
    page,
    "festival_board",
    "Агент Алекс помага на Host Lina да подготви новогодишния фестивал, като проверява цветни дрехи, музика и притежателни думи.",
    "level07_understand_mission",
  );
  await completeCollectibleThroughUi(page, "festival_hat", [
    "Намираш фестивалната шапка. Моята шапка е цветна. Нося моята шапка.",
    "hat",
    "My",
    "I wear my hat.",
  ], "level07_festival_hat");
  await completeCollectibleThroughUi(page, "clothes_bundle", [
    "Това са фестивални дрехи. Нейната риза е синя. Неговите ботуши са кафяви.",
    "shirt, jeans, and boots",
    "Her",
    "His boots are brown.",
  ], "level07_clothes_bundle");
  await completeCollectibleThroughUi(page, "music_drum", [
    "Намираш музикалния барабан. Техният инструмент е готов за музиканта.",
    "instrument",
    "Their",
    "Their instrument is on the stage.",
  ], "level07_music_drum");
  await completeGuideThroughUi(page, [
    "My hat is colorful.",
    "Their instrument is on the stage.",
  ], "level07_host_check");

  const level7 = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    const scene = window.phaserGame.scene.getScene("CampScene");
    const persistedLevel6 = engine.getSnapshot().state.puzzles.level06_mountain_path_exit;
    const resources = performance.getEntriesByType("resource").map((entry) => entry.name);
    const inventoryIcons = scene.inventoryItems.list
      .filter((slot) => slot.isInventorySlot)
      .map((slot) => ({
        label: slot.hotspot.label,
        type: slot.icon.type,
        texture: slot.icon.texture?.key || null,
        frame: slot.icon.frame?.name || null,
      }));
    return { persistedLevel6, resources, inventoryIcons, snapshot: engine.getSnapshot() };
  });
  const level7Exit = await clickExitThroughUi(page, "level07_festival_arch_exit");

  if (level7Exit.label !== "festival arch") {
    fail("Level 07 exit should be presented as the festival arch", level7Exit);
  }
  if (level7.persistedLevel6 !== "completed") {
    fail("Level 06 state was not retained after Level 07 navigation", level7);
  }
  if (
    !level7.resources.some((resource) => resource.includes("level-07-festival-puzzle/generated/festival-background-v2.png"))
    || !level7.resources.some((resource) => resource.includes("level-07-festival-puzzle/generated/interactive-props.png"))
  ) {
    fail("Level 07 should load generated background and prop assets", level7.resources);
  }
  if (
    level7.inventoryIcons.length !== 3
    || level7.inventoryIcons.some((icon) => icon.texture !== "interactiveProps")
    || !level7.inventoryIcons.every((icon) => typeof icon.frame === "string" && icon.frame.startsWith("inventory-"))
  ) {
    fail("Level 07 inventory should use level-specific prop-sheet icons", level7.inventoryIcons);
  }

  const level7PostExit = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    return { snapshot: engine.getSnapshot() };
  });
  if (level7PostExit.snapshot.state.puzzles.level07_festival_arch_exit !== "completed") {
    fail("Level 07 final puzzle was not completed", level7PostExit);
  }
  if (level7PostExit.snapshot.state.facts["campaign.levels_01_to_07_complete"] !== true) {
    fail("Level 07 campaign completion fact is missing", level7PostExit);
  }
  await verifyCompletedExitSkipsGate(page);

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
    level5: "completed",
    level6: "transitioned",
    level7: "completed",
    directLevel2: "completed",
    campaignStatePersisted: true,
  }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
