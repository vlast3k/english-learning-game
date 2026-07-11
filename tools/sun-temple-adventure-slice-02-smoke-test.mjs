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
  throw new Error(`Sun Temple slice-two smoke test failed: ${message}${details ? `\n${JSON.stringify(details, null, 2)}` : ""}`);
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
    return { scene: scene.contentModel.scene_id, inventory: state.inventory, facts: state.facts, puzzles: state.puzzles,
      visible: scene.hotspots.filter((hotspot) => hotspot.zone?.visible).map((hotspot) => hotspot.id),
      overlays: (scene.adventureOverlays || []).filter((overlay) => overlay.image.visible).map((overlay) => overlay.spec.id) };
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
    const hotspot = await page.evaluate((hotspotId) => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      return scene.hotspots.find((entry) => entry.id === hotspotId);
    }, id);
    if (!hotspot) fail(`could not find hotspot ${id}`);
    await click(hotspot.x, hotspot.y);
  };
  const clickMapMarker = async (id) => {
    const marker = await page.evaluate((markerId) => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      const marker = scene.contentModel.map.markers.find((entry) => entry.id === markerId);
      if (!marker) return null;
      const point = scene.getTornMapMarkerPosition?.(markerId) || marker;
      return { x: 512 + point.x, y: 288 + point.y };
    }, id);
    if (!marker) fail(`could not find map marker ${id}`);
    await click(marker.x, marker.y);
  };
  const inventory = (index) => click(56 + index * 50, 84);
  const closeBubble = () => page.evaluate(() => window.phaserGame.scene.getScene("CampScene").closeBubble());
  const assistantHint = () => page.evaluate(() => window.phaserGame.scene.getScene("CampScene").getAssistantHint());

  try {
    await page.goto(`${(await serverInfo).url}/phaser.html?scenario=scenarios/sun-temple-adventure-base-camp-table-content.json&reset=1`, { waitUntil: "domcontentloaded" });
    await waitForScene("sun-temple-adventure-base-camp-table");
    await closeBubble();
    await page.evaluate(() => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      Object.assign(scene.gameEngine.state.data.facts, {
        "map.ui_unlocked": true, "location.base_camp.discovered": true, "location.camp_edge.discovered": true,
        "location.jungle_path.discovered": true, "location.broken_bridge.discovered": true, "location.village_garden.discovered": true,
        "location.waterfall_cave.revealed": true, "compass.green_lens_placed": true, "slice.green_lens_complete": true, "lina.helped": true,
      });
      scene.gameEngine.state.data.inventory = ["valley_map"];
      scene.gameEngine.state.data.puzzles.sun_temple_slice_01_complete = "completed";
      scene.gameEngine.state.persist();
      scene.refreshAdventureScreenState();
    });

    await page.evaluate(() => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      scene.gameEngine.state.data.inventory = ["valley_map", "empty_jar"];
    });
    const jarHint = await assistantHint();
    if (!/Waterfall Cave/.test(jarHint.text) || !/glowing leaf/.test(jarHint.text)) {
      fail("Help should trace the empty jar to the reachable glow leaf, not skip to the Blue Lens", jarHint);
    }
    await page.evaluate(() => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      scene.gameEngine.state.data.inventory = ["valley_map"];
    });

    await click(872, 92); await clickMapMarker("waterfall-mouth"); await waitForScene("sun-temple-adventure-waterfall-mouth");
    const glowLeafLabelVisible = await page.evaluate(() => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      const hotspot = scene.hotspots.find((entry) => entry.id === "glow_leaf");
      return hotspot.marker.list.some((child) => child.text === "glow leaf" && child.alpha === 1);
    });
    if (!glowLeafLabelVisible) fail("glow leaf should have a persistent visual label");
    await clickHotspot("glow_leaf"); await assert("glow leaf should be collected", (s) => s.inventory.includes("glow_leaf")); await closeBubble();
    await click(872, 92); await clickMapMarker("village-garden"); await waitForScene("sun-temple-adventure-village-garden");
    await clickHotspot("exit_keeper_hut"); await waitForScene("sun-temple-adventure-keeper-hut");
    await clickHotspot("empty_jar"); await assert("empty jar should be collected", (s) => s.inventory.includes("empty_jar")); await closeBubble();
    await inventory(1); await inventory(2); await assert("jar and leaf should combine", (s) => s.inventory.join(",") === "valley_map,glow_jar" && s.facts["craft.glow_jar_made"] === true); await closeBubble();

    await click(872, 92); await clickMapMarker("waterfall-mouth"); await waitForScene("sun-temple-adventure-waterfall-mouth");
    await inventory(1); await clickHotspot("dark_cave_entrance"); await assert("glow jar should light the cave", (s) => s.facts["waterfall.cave_lit"] === true && s.visible.includes("exit_dark_cave") && s.overlays.includes("cave_lit_glow")); await closeBubble();
    const caveLightAlignment = await page.evaluate(() => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      const entrance = scene.hotspots.find((entry) => entry.id === "dark_cave_entrance");
      const glow = scene.adventureOverlays.find((entry) => entry.spec.id === "cave_lit_glow")?.image;
      return { entrance: { x: entrance.x, y: entrance.y }, glow: { x: glow.x, y: glow.y } };
    });
    if (caveLightAlignment.entrance.x !== caveLightAlignment.glow.x || caveLightAlignment.entrance.y !== caveLightAlignment.glow.y) {
      fail("cave light should be centred on the dark-cave entrance", caveLightAlignment);
    }
    await page.screenshot({ path: path.join(OUT_DIR, "07-waterfall-cave-lit.png"), fullPage: true });
    await clickHotspot("exit_dark_cave"); await waitForScene("sun-temple-adventure-dark-cave");
    await clickHotspot("cave_wall"); await assert("wall inspection should reveal the key", (s) => s.visible.includes("stone_key")); await closeBubble();
    await clickHotspot("stone_key"); await assert("stone key should be collected", (s) => s.inventory.includes("stone_key")); await closeBubble();
    await inventory(2); await clickHotspot("blue_stone_box"); await assert("stone key should open the box", (s) => s.facts["dark_cave.box_open"] === true && s.visible.includes("blue_lens") && s.overlays.includes("blue_stone_box_open")); await closeBubble();
    await clickHotspot("blue_lens"); await assert("Blue Lens should be collected", (s) => s.inventory.includes("blue_lens")); await closeBubble();
    await page.screenshot({ path: path.join(OUT_DIR, "08-blue-lens-found.png"), fullPage: true });

    await click(872, 92); await clickMapMarker("base-camp-table"); await waitForScene("sun-temple-adventure-base-camp-table");
    await inventory(2); await clickHotspot("sun_compass"); await assert("Blue Lens should complete slice two", (s) => s.facts["slice.blue_lens_complete"] === true && s.facts["location.temple_steps.revealed"] === true && s.puzzles.sun_temple_slice_02_complete === "completed" && s.overlays.includes("sun_compass_blue_lens"));
    await page.screenshot({ path: path.join(OUT_DIR, "09-slice-two-complete.png"), fullPage: true });
    if (pageErrors.length) fail("browser page error", { pageErrors });
  } finally {
    await browser.close();
  }
}

const serverInfo = startServer();
try {
  await run();
  console.log("Sun Temple slice-two smoke test passed.");
} finally {
  (await serverInfo).server.close();
}
