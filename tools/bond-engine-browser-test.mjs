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
    engine.emit("exit.reached", { target: "training_door" });
    return {
      puzzles: beforeExit.state.puzzles,
      inventory: inventoryBeforeExit,
      flag: scene.flags.training_door_open,
    };
  });
  if (level1.puzzles.level01_director_approval !== "completed" || !level1.flag || level1.inventory.length !== 3) {
    fail("Level 01 did not complete through the puzzle/ECA bridge", level1);
  }

  await page.waitForURL(
    (current) => current.searchParams.get("scenario") === "scenarios/james-bond-level-02-content.json",
    { timeout: 5000 },
  );
  await page.waitForFunction(() => window.__ENGLISH_GAME_ENGINE__?.config?.scene_id === "james-bond-level-02");
  const level2 = await page.evaluate(() => {
    const engine = window.__ENGLISH_GAME_ENGINE__;
    const persistedLevel1 = engine.getSnapshot().state.puzzles.level01_enter_training_door;
    engine.emit("mission.understood", { target: "james-bond-level-02" });
    for (const id of ["phone_clue", "camera_clue", "hidden_bag"]) {
      engine.emit("collectible.completed", { target: id });
    }
    engine.emit("guide.completed", { target: "director" });
    engine.emit("exit.reached", { target: "safe_flat_door" });
    return { persistedLevel1, snapshot: engine.getSnapshot() };
  });
  if (level2.persistedLevel1 !== "completed") {
    fail("Level 01 state was not retained after navigation", level2);
  }
  if (level2.snapshot.state.puzzles.level02_complete_surveillance !== "completed") {
    fail("Level 02 final puzzle was not completed", level2);
  }
  if (level2.snapshot.state.facts["campaign.levels_01_02_complete"] !== true) {
    fail("Campaign completion fact is missing", level2);
  }
  if (errors.length) fail("Browser console reported errors", errors);

  console.log(JSON.stringify({
    level1: "completed",
    level2: "completed",
    campaignStatePersisted: true,
  }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
