import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "test-results", "sun-temple-adventure-smoke");
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 576;

function fail(message, details = null) {
  throw new Error(`Sun Temple slice-three smoke test failed: ${message}${details ? `\n${JSON.stringify(details, null, 2)}` : ""}`);
}

function startServer() {
  const types = new Map([[".html", "text/html"], [".js", "text/javascript"], [".json", "application/json"], [".css", "text/css"], [".png", "image/png"], [".ttf", "font/ttf"]]);
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
    const filePath = path.normalize(path.join(ROOT, decodeURIComponent(pathname === "/" ? "/phaser.html" : pathname)));
    if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "Content-Type": types.get(path.extname(filePath)) || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(await readFile(filePath));
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, url: `http://${address.address}:${address.port}` });
    });
  });
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: process.env.HEADLESS !== "false" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const sceneState = () => page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const state = scene.gameEngine.getSnapshot().state;
    return {
      scene: scene.contentModel.scene_id,
      inventory: state.inventory,
      facts: state.facts,
      puzzles: state.puzzles,
      visible: scene.hotspots.filter((hotspot) => hotspot.zone?.visible).map((hotspot) => hotspot.id),
      overlays: (scene.adventureOverlays || []).filter((overlay) => overlay.image.visible).map((overlay) => overlay.spec.id),
    };
  });
  const waitForScene = (id) => page.waitForFunction((expected) => window.phaserGame?.scene?.getScene?.("CampScene")?.contentModel?.scene_id === expected, id);
  const assert = async (label, predicate) => {
    let state = await sceneState();
    for (let attempt = 0; attempt < 50 && !predicate(state); attempt += 1) {
      await page.waitForTimeout(100);
      state = await sceneState();
    }
    if (!predicate(state)) fail(label, state);
  };
  const click = async (x, y) => {
    const box = await page.locator("canvas").boundingBox();
    await page.mouse.click(box.x + x * box.width / GAME_WIDTH, box.y + y * box.height / GAME_HEIGHT);
    await page.waitForTimeout(80);
  };
  const clickHotspot = async (id) => {
    const hotspot = await page.evaluate((hotspotId) => window.phaserGame.scene.getScene("CampScene").hotspots.find((entry) => entry.id === hotspotId), id);
    if (!hotspot) fail(`could not find hotspot ${id}`);
    await click(hotspot.x, hotspot.y);
  };
  const clickMapMarker = async (id) => {
    const marker = await page.evaluate((markerId) => window.phaserGame.scene.getScene("CampScene").contentModel.map.markers.find((entry) => entry.id === markerId), id);
    if (!marker) fail(`could not find map marker ${id}`);
    await click(512 + marker.x, 293 + marker.y);
  };
  const inventory = (index) => click(56 + index * 50, 84);
  const closeBubble = () => page.evaluate(() => window.phaserGame.scene.getScene("CampScene").closeBubble());

  try {
    await page.goto(`${(await serverInfo).url}/phaser.html?scenario=scenarios/sun-temple-adventure-base-camp-table-content.json&reset=1`, { waitUntil: "domcontentloaded" });
    await waitForScene("sun-temple-adventure-base-camp-table");
    await closeBubble();
    await page.evaluate(() => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      Object.assign(scene.gameEngine.state.data.facts, {
        "map.ui_unlocked": true,
        "location.base_camp.discovered": true,
        "location.waterfall_cave.revealed": true,
        "location.temple_steps.revealed": true,
        "compass.green_lens_placed": true,
        "compass.blue_lens_placed": true,
        "slice.green_lens_complete": true,
        "slice.blue_lens_complete": true,
      });
      scene.gameEngine.state.data.inventory = [];
      scene.gameEngine.state.data.puzzles.sun_temple_slice_01_complete = "completed";
      scene.gameEngine.state.data.puzzles.sun_temple_slice_02_complete = "completed";
      scene.gameEngine.state.persist();
      scene.refreshAdventureScreenState();
    });

    await click(872, 92); await clickMapMarker("temple-steps"); await waitForScene("sun-temple-adventure-temple-steps");
    await assert("Temple Steps should begin with cup and closed gate", (s) => s.visible.includes("stone_cup") && s.overlays.includes("closed_gate"));
    await clickHotspot("stone_cup"); await assert("stone cup should be collected", (s) => s.inventory.includes("stone_cup") && !s.visible.includes("stone_cup")); await closeBubble();

    await click(872, 92); await clickMapMarker("waterfall-mouth"); await waitForScene("sun-temple-adventure-waterfall-mouth");
    await inventory(0); await clickHotspot("waterfall_pool"); await assert("waterfall should fill the stone cup", (s) => s.inventory.includes("water_cup") && !s.inventory.includes("stone_cup") && s.facts["craft.water_cup_made"] === true); await closeBubble();

    await click(872, 92); await clickMapMarker("temple-steps"); await waitForScene("sun-temple-adventure-temple-steps");
    await inventory(0); await clickHotspot("sun_channel"); await assert("water should open the temple gate", (s) => s.facts["temple.gate_open"] === true && s.visible.includes("exit_sun_courtyard") && s.overlays.includes("channel_flow_gate") && !s.overlays.includes("closed_gate")); await closeBubble();
    await page.screenshot({ path: path.join(OUT_DIR, "10-temple-gate-open.png"), fullPage: true });

    await clickHotspot("exit_sun_courtyard"); await waitForScene("sun-temple-adventure-sun-courtyard");
    await closeBubble();
    await assert("Stone Lens should be visible in the courtyard", (s) => s.visible.includes("stone_lens") && s.overlays.includes("stone_lens"));
    await clickHotspot("stone_lens"); await assert("Stone Lens should be collected", (s) => s.inventory.includes("stone_lens") && !s.visible.includes("stone_lens")); await closeBubble();
    await page.screenshot({ path: path.join(OUT_DIR, "11-stone-lens-found.png"), fullPage: true });

    await click(872, 92); await clickMapMarker("base-camp-table"); await waitForScene("sun-temple-adventure-base-camp-table");
    await inventory(0); await clickHotspot("sun_compass"); await assert("Stone Lens should reveal the Mirror Hall", (s) => s.facts["slice.stone_lens_complete"] === true && s.facts["location.mirror_hall.revealed"] === true && s.puzzles.sun_temple_slice_03_complete === "completed" && s.overlays.includes("sun_compass_stone_lens"));
    await page.screenshot({ path: path.join(OUT_DIR, "12-slice-three-complete.png"), fullPage: true });
    if (pageErrors.length) fail("browser page error", { pageErrors });
  } finally {
    await browser.close();
  }
}

const serverInfo = startServer();
try {
  await run();
  console.log("Sun Temple slice-three smoke test passed.");
} finally {
  (await serverInfo).server.close();
}
