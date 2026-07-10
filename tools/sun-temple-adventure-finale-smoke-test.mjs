import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
  const filePath = path.normalize(path.join(ROOT, decodeURIComponent(pathname === "/" ? "/phaser.html" : pathname)));
  if (!filePath.startsWith(ROOT) || !existsSync(filePath)) return response.writeHead(404).end();
  response.writeHead(200, { "Content-Type": new Map([[".html", "text/html"], [".js", "text/javascript"], [".json", "application/json"], [".css", "text/css"], [".png", "image/png"], [".ttf", "font/ttf"]]).get(path.extname(filePath)) || "application/octet-stream", "Cache-Control": "no-store" });
  response.end(await readFile(filePath));
});
const listen = new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", () => resolve(server.address())); });
const fail = (message, state) => { throw new Error(`Finale smoke test failed: ${message}${state ? `\n${JSON.stringify(state, null, 2)}` : ""}`); };
const address = await listen;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: process.env.HEADLESS !== "false" });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const state = () => page.evaluate(() => { const scene = window.phaserGame.scene.getScene("CampScene"); const s = scene.gameEngine.getSnapshot().state; return { scene: scene.contentModel.scene_id, inventory: s.inventory, facts: s.facts, visible: scene.hotspots.filter((h) => h.zone?.visible).map((h) => h.id), overlays: (scene.adventureOverlays || []).filter((o) => o.image.visible).map((o) => o.spec.id) }; });
  const wait = (id) => page.waitForFunction((expected) => window.phaserGame?.scene?.getScene?.("CampScene")?.contentModel?.scene_id === expected, id);
  const assert = async (message, predicate) => { let s = await state(); for (let i = 0; i < 40 && !predicate(s); i += 1) { await page.waitForTimeout(100); s = await state(); } if (!predicate(s)) fail(message, s); };
  const close = () => page.evaluate(() => window.phaserGame.scene.getScene("CampScene").closeBubble());
  const hotspot = async (id) => { const point = await page.evaluate((hotspotId) => { const h = window.phaserGame.scene.getScene("CampScene").hotspots.find((x) => x.id === hotspotId); return h && { x: h.x, y: h.y }; }, id); if (!point) fail(`missing ${id}`); const box = await page.locator("canvas").boundingBox(); await page.mouse.click(box.x + point.x * box.width / 1024, box.y + point.y * box.height / 576); await page.waitForTimeout(100); };
  const mapTo = async (id) => { const point = await page.evaluate((markerId) => { const m = window.phaserGame.scene.getScene("CampScene").contentModel.map.markers.find((x) => x.id === markerId); return m && { x: 512 + m.x, y: 293 + m.y }; }, id); const box = await page.locator("canvas").boundingBox(); await page.mouse.click(box.x + 872 * box.width / 1024, box.y + 92 * box.height / 576); await page.mouse.click(box.x + point.x * box.width / 1024, box.y + point.y * box.height / 576); };
  await page.goto(`http://${address.address}:${address.port}/phaser.html?scenario=scenarios/sun-temple-adventure-base-camp-table-content.json&reset=1`, { waitUntil: "domcontentloaded" }); await wait("sun-temple-adventure-base-camp-table"); await close();
  await page.evaluate(() => { const scene = window.phaserGame.scene.getScene("CampScene"); Object.assign(scene.gameEngine.state.data.facts, { "map.ui_unlocked": true, "location.base_camp.discovered": true, "compass.green_lens_placed": true, "compass.blue_lens_placed": true, "compass.stone_lens_placed": true, "compass.mirror_lens_placed": true, "location.observatory_approach.revealed": true }); scene.gameEngine.state.persist(); scene.refreshAdventureScreenState(); });
  await mapTo("observatory-approach"); await wait("sun-temple-adventure-observatory-approach"); await close(); await hotspot("light_receiver"); await close(); await assert("receiver should open niche", (s) => s.facts["observatory.sun_lens_niche_open"] && s.visible.includes("sun_lens")); await hotspot("sun_lens"); await close(); await assert("Sun Lens should be collected", (s) => s.inventory.includes("sun_lens"));
  await mapTo("base-camp-table"); await wait("sun-temple-adventure-base-camp-table"); await page.mouse.click((await page.locator("canvas").boundingBox()).x + 56, (await page.locator("canvas").boundingBox()).y + 84); await hotspot("sun_compass"); await close(); await assert("Compass should be complete", (s) => s.facts["compass.sun_lens_placed"] && s.overlays.includes("sun_compass_complete"));
  await mapTo("observatory-approach"); await wait("sun-temple-adventure-observatory-approach"); await hotspot("exit_observatory_door"); await wait("sun-temple-adventure-observatory-door"); await hotspot("compass_socket"); await close(); await hotspot("exit_sun_observatory"); await wait("sun-temple-adventure-sun-observatory"); await hotspot("great_sun_mirror"); await assert("great mirror should restore valley", (s) => s.facts["valley.light_restored"] && s.facts["map.complete"] && s.overlays.includes("great_mirror_on")); await close();
  await mapTo("village-garden"); await wait("sun-temple-adventure-village-garden"); await assert("garden restoration should persist", (s) => s.overlays.includes("garden_restored"));
  console.log("Sun Temple finale smoke test passed.");
} finally { await browser.close(); server.close(); }
