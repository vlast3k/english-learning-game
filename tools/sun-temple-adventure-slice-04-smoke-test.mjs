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
  throw new Error(`Sun Temple slice-four smoke test failed: ${message}${details ? `\n${JSON.stringify(details, null, 2)}` : ""}`);
}

function startServer() {
  const types = new Map([[".html", "text/html"], [".js", "text/javascript"], [".json", "application/json"], [".css", "text/css"], [".png", "image/png"], [".ttf", "font/ttf"]]);
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
    const filePath = path.normalize(path.join(ROOT, decodeURIComponent(pathname === "/" ? "/phaser.html" : pathname)));
    if (!filePath.startsWith(ROOT) || !existsSync(filePath)) return response.writeHead(404).end();
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

const serverInfo = startServer();
try {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: process.env.HEADLESS !== "false" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const state = () => page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const snapshot = scene.gameEngine.getSnapshot().state;
    return {
      scene: scene.contentModel.scene_id,
      inventory: snapshot.inventory,
      facts: snapshot.facts,
      puzzles: snapshot.puzzles,
      visible: scene.hotspots.filter((hotspot) => hotspot.zone?.visible).map((hotspot) => hotspot.id),
      overlays: (scene.adventureOverlays || []).filter((overlay) => overlay.image.visible).map((overlay) => overlay.spec.id),
    };
  });
  const waitForScene = (id) => page.waitForFunction((expected) => window.phaserGame?.scene?.getScene?.("CampScene")?.contentModel?.scene_id === expected, id);
  const assert = async (label, predicate) => {
    let snapshot = await state();
    for (let attempt = 0; attempt < 50 && !predicate(snapshot); attempt += 1) {
      await page.waitForTimeout(100);
      snapshot = await state();
    }
    if (!predicate(snapshot)) fail(label, snapshot);
  };
  const click = async (x, y) => {
    const box = await page.locator("canvas").boundingBox();
    await page.mouse.click(box.x + x * box.width / GAME_WIDTH, box.y + y * box.height / GAME_HEIGHT);
    await page.waitForTimeout(100);
  };
  const clickHotspot = async (id) => {
    const hotspot = await page.evaluate((hotspotId) => window.phaserGame.scene.getScene("CampScene").hotspots.find((entry) => entry.id === hotspotId), id);
    if (!hotspot) fail(`missing hotspot ${id}`);
    await click(hotspot.x, hotspot.y);
  };
  const closeBubble = () => page.evaluate(() => window.phaserGame.scene.getScene("CampScene").closeBubble());
  const inventory = (index) => click(56 + index * 50, 84);
  try {
    await page.goto(`${(await serverInfo).url}/phaser.html?scenario=scenarios/sun-temple-adventure-base-camp-table-content.json&reset=1`, { waitUntil: "domcontentloaded" });
    await waitForScene("sun-temple-adventure-base-camp-table");
    await closeBubble();
    await page.evaluate(() => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      Object.assign(scene.gameEngine.state.data.facts, {
        "map.ui_unlocked": true,
        "location.base_camp.discovered": true,
        "location.mirror_hall.revealed": true,
        "compass.green_lens_placed": true,
        "compass.blue_lens_placed": true,
        "compass.stone_lens_placed": true,
        "slice.green_lens_complete": true,
        "slice.blue_lens_complete": true,
        "slice.stone_lens_complete": true,
      });
      scene.gameEngine.state.data.inventory = [];
      scene.gameEngine.state.data.puzzles.sun_temple_slice_01_complete = "completed";
      scene.gameEngine.state.data.puzzles.sun_temple_slice_02_complete = "completed";
      scene.gameEngine.state.data.puzzles.sun_temple_slice_03_complete = "completed";
      scene.gameEngine.state.persist();
      scene.refreshAdventureScreenState();
    });

    await click(872, 92); await click(722, 501); await waitForScene("sun-temple-adventure-mirror-hall"); await closeBubble();
    await assert("Mirror Hall should begin with first beam state and closed panel", (s) => s.overlays.includes("near_mirror_start") && s.overlays.includes("far_mirror_start") && s.overlays.includes("sun_panel_closed") && s.overlays.includes("beam_near_wrong") && !s.visible.includes("mirror_lens"));
    await page.screenshot({ path: path.join(OUT_DIR, "20-mirror-hall-start.png"), fullPage: true });

    await clickHotspot("near_mirror"); await assert("Near mirror should extend beam to far mirror", (s) => s.facts["mirror_hall.near_mirror_aligned"] === true && s.overlays.includes("near_mirror_aligned") && s.overlays.includes("beam_near_far") && s.overlays.includes("beam_far_wrong")); await closeBubble();
    await clickHotspot("far_mirror"); await assert("Far mirror should open sun panel", (s) => s.facts["mirror_hall.beam_path_complete"] === true && s.facts["mirror_hall.sun_panel_open"] === true && s.overlays.includes("sun_panel_open") && s.overlays.includes("beam_far_panel") && s.visible.includes("mirror_lens")); await closeBubble();
    await page.screenshot({ path: path.join(OUT_DIR, "21-mirror-hall-panel-open.png"), fullPage: true });

    await clickHotspot("mirror_lens"); await assert("Mirror Lens should enter inventory", (s) => s.inventory.includes("mirror_lens") && s.facts["item.mirror_lens.taken"] === true && !s.visible.includes("mirror_lens")); await closeBubble();
    await click(872, 92); await click(262, 189); await waitForScene("sun-temple-adventure-base-camp-table");
    await inventory(0); await clickHotspot("sun_compass"); await assert("Mirror Lens should complete Slice 4 and reveal observatory hook", (s) => s.facts["compass.mirror_lens_placed"] === true && s.facts["location.observatory_approach.revealed"] === true && s.puzzles.sun_temple_slice_04_complete === "completed" && s.overlays.includes("sun_compass_mirror_lens"));
    await page.screenshot({ path: path.join(OUT_DIR, "22-slice-four-complete.png"), fullPage: true });
    if (pageErrors.length) fail("browser page error", { pageErrors });
  } finally {
    await browser.close();
  }
  console.log("Sun Temple slice-four smoke test passed.");
} finally {
  (await serverInfo).server.close();
}
