import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "test-results", "sun-temple-adventure-smoke");
const HEADLESS = process.env.HEADLESS !== "false";
const CHANNEL = process.env.BROWSER_CHANNEL || "chrome";
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 576;

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
]);

function fail(message, details = null) {
  const suffix = details ? `\n${JSON.stringify(details, null, 2)}` : "";
  throw new Error(`Sun Temple smoke test failed: ${message}${suffix}`);
}

function startServer() {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      const pathname = requestUrl.pathname === "/" ? "/phaser.html" : requestUrl.pathname;
      const decodedPath = decodeURIComponent(pathname);
      const filePath = path.normalize(path.join(ROOT, decodedPath));

      if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type": mimeTypes.get(path.extname(filePath)) || "application/octet-stream",
        "Cache-Control": "no-store, max-age=0",
      });
      response.end(body);
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

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: CHANNEL, headless: HEADLESS });
  } catch (error) {
    fail(`could not launch Playwright browser channel "${CHANNEL}".`, { cause: error.message });
  }
}

async function waitForScene(page, expectedScene) {
  await page.waitForFunction((sceneId) => {
    const scene = window.phaserGame?.scene?.getScene?.("CampScene");
    return Boolean(
      scene?.contentModel
      && scene.gameEngine
      && scene.contentModel.scene_id === sceneId
      && scene.hotspots?.length > 0,
    );
  }, expectedScene, { timeout: 12000 });
  await page.waitForTimeout(120);
}

async function getAdventureState(page) {
  return page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const snapshot = scene.gameEngine.getSnapshot().state;
    return {
      scene: scene.contentModel.scene_id,
      inventory: [...snapshot.inventory],
      facts: { ...snapshot.facts },
      puzzles: { ...snapshot.puzzles },
      selected: scene.selectedInventoryItemId || null,
      visibleHotspots: (scene.hotspots || [])
        .filter((hotspot) => hotspot.zone?.visible && hotspot.zone?.input?.enabled !== false)
        .map((hotspot) => hotspot.id),
      npcId: scene.getPrimaryNpcContent?.()?.id || scene.contentModel.guide?.id || null,
      mapButton: scene.adventureMapButton
        ? { visible: scene.adventureMapButton.visible, enabled: scene.adventureMapButton.enabled }
        : null,
      mapPanelOpen: Boolean(scene.adventureMapPanel),
      overlayVisible: (scene.adventureOverlays || [])
        .filter((overlay) => overlay.image.visible)
        .map((overlay) => overlay.spec.id),
    };
  });
}

async function assertState(page, label, predicate) {
  try {
    await page.waitForFunction((source) => {
      const scene = window.phaserGame?.scene?.getScene?.("CampScene");
      if (!scene?.contentModel || !scene?.gameEngine) {
        return false;
      }
      const snapshot = scene.gameEngine.getSnapshot().state;
      const state = {
        scene: scene.contentModel.scene_id,
        inventory: [...snapshot.inventory],
        facts: { ...snapshot.facts },
        puzzles: { ...snapshot.puzzles },
        selected: scene.selectedInventoryItemId || null,
        visibleHotspots: (scene.hotspots || [])
          .filter((hotspot) => hotspot.zone?.visible && hotspot.zone?.input?.enabled !== false)
          .map((hotspot) => hotspot.id),
        npcId: scene.getPrimaryNpcContent?.()?.id || scene.contentModel.guide?.id || null,
        mapButton: scene.adventureMapButton
          ? { visible: scene.adventureMapButton.visible, enabled: scene.adventureMapButton.enabled }
          : null,
        mapPanelOpen: Boolean(scene.adventureMapPanel),
        overlayVisible: (scene.adventureOverlays || [])
          .filter((overlay) => overlay.image.visible)
          .map((overlay) => overlay.spec.id),
      };
      return (0, eval)(source)(state);
    }, `(${predicate.toString()})`, { timeout: 12000 });
  } catch (error) {
    fail(label, {
      cause: error.message,
      state: await getAdventureState(page).catch((stateError) => ({ error: stateError.message })),
    });
  }
}

async function gamePointToViewport(page, x, y) {
  const canvas = await page.locator("canvas").boundingBox();
  if (!canvas) {
    fail("could not locate Phaser canvas");
  }
  return {
    x: canvas.x + (x / GAME_WIDTH) * canvas.width,
    y: canvas.y + (y / GAME_HEIGHT) * canvas.height,
  };
}

async function clickGame(page, x, y) {
  const point = await gamePointToViewport(page, x, y);
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(120);
}

async function clickHotspot(page, id) {
  const hotspot = await page.evaluate((hotspotId) => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    return scene.hotspots.find((entry) => entry.id === hotspotId);
  }, id);
  if (!hotspot) {
    fail(`could not find hotspot ${id}`);
  }
  await clickGame(page, hotspot.x, hotspot.y);
}

async function clickMapMarker(page, id) {
  const marker = await page.evaluate((markerId) => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    return scene.contentModel.map.markers.find((entry) => entry.id === markerId);
  }, id);
  if (!marker) {
    fail(`could not find map marker ${id}`);
  }
  await clickGame(page, 152 + 360 + marker.x, 84 + 209 + marker.y);
}

async function clickPrimaryNpc(page) {
  const npc = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    return scene.getPrimaryNpcContent?.();
  });
  if (!npc?.position) {
    fail("could not find primary NPC");
  }
  await clickGame(page, npc.position.x, npc.position.y - 62);
}

async function clickInventory(page, index) {
  await clickGame(page, 56 + index * 50, 84);
}

async function closeBubble(page) {
  await page.evaluate(() => window.phaserGame?.scene?.getScene?.("CampScene")?.closeBubble?.());
  await page.waitForTimeout(60);
}

async function saveScreenshot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
}

async function runSunTempleSmokeTest(baseUrl) {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(
      `${baseUrl}/phaser.html?scenario=scenarios/sun-temple-adventure-base-camp-table-content.json&reset=1`,
      { waitUntil: "domcontentloaded" },
    );
    await waitForScene(page, "sun-temple-adventure-base-camp-table");
    await assertState(page, "base should start with Mira and disabled map button", (state) => (
      state.npcId === "mira" && state.mapButton?.visible === true && state.mapButton.enabled === false
    ));
    await saveScreenshot(page, "01-base-start");
    await page.waitForFunction(() => Boolean(window.phaserGame?.scene?.getScene?.("CampScene")?.activeBubble), null, { timeout: 12000 });
    await closeBubble(page);

    await clickHotspot(page, "sun_flower");
    await page.waitForFunction(() => Boolean(window.phaserGame?.scene?.getScene?.("CampScene")?.activeBubble), null, { timeout: 12000 });
    await closeBubble(page);

    await clickHotspot(page, "sun_compass");
    await assertState(page, "Sun Compass inspection should set progress fact", (state) => (
      state.facts["compass.inspected"] === true
    ));
    await closeBubble(page);

    await clickHotspot(page, "torn_map");
    await assertState(page, "taking the torn map should unlock HUD map travel", (state) => (
      state.inventory.includes("torn_map")
      && state.facts["map.ui_unlocked"] === true
      && state.mapButton?.enabled === true
      && !state.visibleHotspots.includes("torn_map")
    ));
    await closeBubble(page);

    await clickHotspot(page, "exit_supply_tent");
    await waitForScene(page, "sun-temple-adventure-camp-supply-tent");
    await assertState(page, "supply tent should not show an NPC", (state) => state.npcId === null);

    await clickHotspot(page, "rope");
    await assertState(page, "taking rope should add inventory and hide rope hotspot", (state) => (
      state.inventory.includes("torn_map")
      && state.inventory.includes("rope")
      && state.facts["item.rope.taken"] === true
      && !state.visibleHotspots.includes("rope")
    ));
    await closeBubble(page);

    await clickHotspot(page, "exit_base_camp");
    await waitForScene(page, "sun-temple-adventure-base-camp-table");
    await clickHotspot(page, "exit_camp_edge");
    await waitForScene(page, "sun-temple-adventure-camp-edge");
    await assertState(page, "camp edge should not show a guide and map piece should start hidden", (state) => (
      state.npcId === null
      && state.visibleHotspots.includes("fallen_branch")
      && !state.visibleHotspots.includes("map_piece_01")
    ));

    await clickHotspot(page, "fallen_branch");
    await assertState(page, "first branch click should reveal a hint but not move the branch", (state) => (
      state.facts["camp_edge.branch_inspected"] === true
      && state.visibleHotspots.includes("fallen_branch")
    ));
    await closeBubble(page);

    await clickHotspot(page, "fallen_branch");
    await assertState(page, "second branch click should reveal the map piece", (state) => (
      state.facts["camp_edge.branch_moved"] === true
      && !state.visibleHotspots.includes("fallen_branch")
      && state.visibleHotspots.includes("map_piece_01")
    ));
    await closeBubble(page);

    await clickHotspot(page, "map_piece_01");
    await assertState(page, "taking the map piece should add it to inventory", (state) => (
      state.inventory.includes("torn_map")
      && state.inventory.includes("rope")
      && state.inventory.includes("map_piece_01")
    ));
    await closeBubble(page);

    await clickInventory(page, 0);
    await assertState(page, "torn map should become selected", (state) => state.selected === "torn_map");
    await clickInventory(page, 2);
    await assertState(page, "combining map pieces should create the valley map and unlock the jungle", (state) => (
      JSON.stringify(state.inventory) === JSON.stringify(["rope", "valley_map"])
      && state.facts["map.valley_map_made"] === true
      && state.facts["location.jungle_path.discovered"] === true
      && state.selected === null
    ));
    await closeBubble(page);
    await saveScreenshot(page, "02-valley-map-made");

    await clickHotspot(page, "exit_jungle_path");
    await waitForScene(page, "sun-temple-adventure-jungle-path");
    await assertState(page, "jungle path should not show an NPC", (state) => state.npcId === null);

    await clickHotspot(page, "exit_broken_bridge");
    await waitForScene(page, "sun-temple-adventure-broken-bridge");
    await assertState(page, "bridge should start unrepaired with the basket out of reach", (state) => (
      state.npcId === null
      && state.visibleHotspots.includes("lost_basket_far")
      && !state.visibleHotspots.includes("lost_basket")
    ));

    await clickInventory(page, 0);
    await assertState(page, "rope should become selected at the bridge", (state) => state.selected === "rope");
    await clickHotspot(page, "broken_bridge");
    await assertState(page, "using rope should repair the bridge and consume the rope", (state) => (
      JSON.stringify(state.inventory) === JSON.stringify(["valley_map"])
      && state.facts["bridge.repaired"] === true
      && state.overlayVisible.includes("bridge_rope_tied")
      && state.visibleHotspots.includes("lost_basket")
      && !state.visibleHotspots.includes("lost_basket_far")
    ));
    await closeBubble(page);
    await saveScreenshot(page, "03-bridge-repaired");

    await clickHotspot(page, "lost_basket");
    await assertState(page, "taking the basket should add it to inventory", (state) => (
      JSON.stringify(state.inventory) === JSON.stringify(["valley_map", "lost_basket"])
      && state.facts["item.lost_basket.taken"] === true
    ));
    await closeBubble(page);

    await clickHotspot(page, "exit_village_garden");
    await waitForScene(page, "sun-temple-adventure-village-garden");
    await assertState(page, "village should show Lina and keep the Green Lens hidden", (state) => (
      state.npcId === "lina" && !state.visibleHotspots.includes("green_lens")
    ));

    await clickInventory(page, 1);
    await assertState(page, "basket should become selected", (state) => state.selected === "lost_basket");
    await clickPrimaryNpc(page);
    await assertState(page, "giving basket to Lina should remove the basket and set Lina helped", (state) => (
      JSON.stringify(state.inventory) === JSON.stringify(["valley_map"])
      && state.facts["lina.helped"] === true
    ));
    await closeBubble(page);

    await clickHotspot(page, "flower_pot");
    await assertState(page, "checking the flower pot after helping Lina should reveal the Green Lens", (state) => (
      state.facts["village.flower_pot_checked"] === true
      && state.visibleHotspots.includes("green_lens")
      && state.overlayVisible.includes("flower_pot_green_hint")
    ));
    await closeBubble(page);

    await clickHotspot(page, "green_lens");
    await assertState(page, "taking the Green Lens should add it to inventory and hide the hotspot", (state) => (
      JSON.stringify(state.inventory) === JSON.stringify(["valley_map", "green_lens"])
      && state.facts["item.green_lens.taken"] === true
      && !state.visibleHotspots.includes("green_lens")
    ));
    await closeBubble(page);
    await saveScreenshot(page, "04-green-lens-taken");

    await clickGame(page, 872, 92);
    await assertState(page, "HUD map button should open the map panel", (state) => state.mapPanelOpen === true);
    await saveScreenshot(page, "05-map-panel");

    await clickMapMarker(page, "base-camp-table");
    await waitForScene(page, "sun-temple-adventure-base-camp-table");
    await assertState(page, "map travel should return to base with the Green Lens still held", (state) => (
      state.npcId === "mira"
      && JSON.stringify(state.inventory) === JSON.stringify(["valley_map", "green_lens"])
    ));

    await clickInventory(page, 1);
    await assertState(page, "Green Lens should become selected", (state) => state.selected === "green_lens");
    await clickHotspot(page, "sun_compass");
    await assertState(page, "placing the Green Lens should complete slice one and reveal Waterfall Cave", (state) => (
      JSON.stringify(state.inventory) === JSON.stringify(["valley_map"])
      && state.facts["compass.green_lens_placed"] === true
      && state.facts["location.waterfall_cave.revealed"] === true
      && state.facts["slice.green_lens_complete"] === true
      && state.overlayVisible.includes("sun_compass_green_lens")
      && state.puzzles["sun_temple_slice_01_complete"] === "completed"
    ));
    await closeBubble(page);
    await saveScreenshot(page, "06-slice-complete");

    await clickGame(page, 872, 92);
    await clickMapMarker(page, "waterfall-mouth");
    await waitForScene(page, "sun-temple-adventure-waterfall-mouth");
    await page.goto(`${baseUrl}/phaser.html`, { waitUntil: "domcontentloaded" });
    await waitForScene(page, "sun-temple-adventure-waterfall-mouth");
    await assertState(page, "bare game URL should resume the saved room and campaign state", (state) => (
      state.facts["compass.green_lens_placed"] === true
      && JSON.stringify(state.inventory) === JSON.stringify(["valley_map"])
    ));

    if (pageErrors.length > 0) {
      fail("browser page error", { pageErrors });
    }
  } finally {
    await browser.close();
  }
}

async function runExplorationModeSmokeTest(baseUrl) {
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    await page.goto(
      `${baseUrl}/phaser.html?scenario=scenarios/sun-temple-adventure-camp-edge-content.json&reset=1&explore=1`,
      { waitUntil: "domcontentloaded" },
    );
    await waitForScene(page, "sun-temple-adventure-camp-edge");
    await assertState(page, "exploration mode should unlock the HUD map immediately", (state) => state.mapButton?.enabled === true);
    await clickHotspot(page, "exit_jungle_path");
    await waitForScene(page, "sun-temple-adventure-jungle-path");
    if (new URL(page.url()).searchParams.get("explore") !== "1") {
      fail("exploration mode should remain enabled after room travel", { url: page.url() });
    }
  } finally {
    await browser.close();
  }
}

const { server, url } = await startServer();
try {
  await runExplorationModeSmokeTest(url);
  await runSunTempleSmokeTest(url);
  console.log("Sun Temple adventure smoke test passed.");
} finally {
  server.close();
}
