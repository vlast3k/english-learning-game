import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "test-results", "browser-smoke");
const HEADLESS = process.env.HEADLESS !== "false";
const CHANNEL = process.env.BROWSER_CHANNEL || "chrome";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
]);

function fail(message, details = null) {
  console.error(`Browser smoke test failed: ${message}`);
  if (details) {
    console.error(JSON.stringify(details, null, 2));
  }
  process.exit(1);
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
    fail(
      `could not launch Playwright browser channel "${CHANNEL}". Install Chrome or set BROWSER_CHANNEL to an available channel.`,
      { cause: error.message },
    );
  }
}

async function sampleMove(page, name, x, y, start = null) {
  await page.evaluate(
    ({ targetX, targetY, startPoint }) => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      scene.closeBubble();
      if (startPoint) {
        if (scene.heroTween) {
          scene.heroTween.stop();
          scene.heroTween = null;
        }
        scene.hero.setPosition(startPoint.x, startPoint.y);
        scene.hero.setDepth(Math.round(startPoint.y));
        scene.hero.setScale(scene.getCharacterScale(startPoint.y));
        scene.setHeroIdle("down");
      }
      scene.walkHeroTo(targetX, targetY);
    },
    { targetX: x, targetY: y, startPoint: start },
  );

  const samples = [];
  for (let index = 0; index < 12; index += 1) {
    await page.waitForTimeout(100);
    samples.push(await page.evaluate(() => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      return {
        anim: scene.hero.sprite.anims.currentAnim?.key || null,
        frame: Number(scene.hero.sprite.frame.name),
        heroX: Number(scene.hero.x.toFixed(1)),
        heroY: Number(scene.hero.y.toFixed(1)),
        spriteY: Number(scene.hero.sprite.y.toFixed(2)),
        angle: Number(scene.hero.sprite.angle.toFixed(2)),
        heroTextureCount: scene.hero.list.filter((child) => child.texture?.key === "heroSprite").length,
        extraBootLayerCount: scene.hero.list.filter((child) => child.texture?.key === "heroBoots").length,
      };
    }));

    if (index === 4) {
      await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
    }
  }

  await page.waitForFunction(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    return !scene.heroTween || !scene.heroTween.isPlaying();
  }, { timeout: 4000 });
  return samples;
}

function uniqueFrames(samples) {
  return [...new Set(samples.map((sample) => sample.frame))];
}

function poseRange(samples, key) {
  const values = samples.map((sample) => sample[key]);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function validateMove(name, samples, expectedAnim, frameMin, frameMax, minUniqueFrames) {
  const movingSamples = samples.filter((sample) => sample.anim === expectedAnim);
  const frames = uniqueFrames(movingSamples).filter((frame) => frame >= frameMin && frame <= frameMax);
  const yRange = poseRange(movingSamples, "spriteY");
  const angleRange = poseRange(movingSamples, "angle");

  if (frames.length < minUniqueFrames) {
    fail(`${name} did not advance enough animation frames`, { frames, samples });
  }

  if (yRange.min > -2.4 || angleRange.max - angleRange.min < 0.8) {
    fail(`${name} body pose did not move enough`, { yRange, angleRange, samples });
  }

  if (!movingSamples.every((sample) => sample.heroTextureCount === 1 && sample.extraBootLayerCount === 0)) {
    fail(`${name} should use exactly one hero sprite and no boot overlay`, samples);
  }

  return {
    frames,
    yRange,
    angleRange,
  };
}

async function gamePointToViewport(page, x, y) {
  const canvas = await page.locator("canvas").boundingBox();
  if (!canvas) {
    fail("could not locate Phaser canvas");
  }
  return {
    x: canvas.x + (x / 1024) * canvas.width,
    y: canvas.y + (y / 576) * canvas.height,
  };
}

async function openRopeChallenge(page) {
  await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const rope = scene.hotspots.find((hotspot) => hotspot.id === "rope");
    scene.closeBubble();
    scene.openObjectQuestion(rope, 0);
  });
  await page.waitForFunction(() => Boolean(window.phaserGame.scene.getScene("CampScene").activeBubble));
}

async function validateDialogueUx(page) {
  await openRopeChallenge(page);
  await page.screenshot({ path: path.join(OUT_DIR, "dialogue-rope.png"), fullPage: true });

  const hasCloseButton = await page.evaluate(() => {
    const bubble = window.phaserGame.scene.getScene("CampScene").activeBubble;
    return bubble.list.some((child) => child.isCloseButton);
  });
  if (!hasCloseButton) {
    fail("item challenge dialogue should expose a close button");
  }

  const noBgChip = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const visit = (node) => {
      if (!node) {
        return false;
      }
      if (node.text === "BG") {
        return true;
      }
      return Array.isArray(node.list) && node.list.some((child) => visit(child));
    };
    return !visit(scene.activeBubble);
  });
  if (!noBgChip) {
    fail("dialogue should not expose a BG translation chip");
  }

  const revealCoverage = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const bubble = scene.activeBubble;
    const flow = bubble.list.find((child) => Array.isArray(child.list) && child.list.some((item) => item.originalText));
    return flow.list
      .filter((child) => /^[A-Za-z]+[.?!,;:]*$/.test(child.originalText || ""))
      .map((child) => ({
        word: child.originalText,
        translation: child.translationText,
        revealWidth: child.revealWidth,
        originalWidth: Math.ceil(child.width),
      }));
  });
  const missingTranslations = revealCoverage.filter((item) => !item.translation);
  if (missingTranslations.length > 0) {
    fail("not every prompt word has a hover translation", missingTranslations);
  }
  const badRevealWidths = revealCoverage.filter((item) => Math.abs(item.revealWidth - item.originalWidth) > 1);
  if (badRevealWidths.length > 0) {
    fail("reveal progress width should track the original English word width", badRevealWidths);
  }

  const choice = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const item = scene.activeBubble.list.find((child) => child.hitPlate);
    return {
      x: scene.activeBubble.x + item.x,
      y: scene.activeBubble.y + item.y,
      width: item.width,
      height: item.height,
      hitWidth: item.hitPlate.input.hitArea.width,
      hitHeight: item.hitPlate.input.hitArea.height,
    };
  });

  if (choice.hitWidth !== choice.width || choice.hitHeight !== choice.height) {
    fail("choice hit plate does not cover the full visual button", choice);
  }

  for (const xOffset of [5, choice.width / 2, choice.width - 5]) {
    const point = await gamePointToViewport(page, choice.x + xOffset, choice.y + choice.height / 2);
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(80);
    const hoverState = await page.evaluate(() => {
      const scene = window.phaserGame.scene.getScene("CampScene");
      return scene.activeBubble.list.find((child) => child.hitPlate).hoverState;
    });
    if (hoverState !== "hover") {
      fail("choice button did not hover across the full surface", { xOffset, hoverState, choice });
    }
  }

  const word = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const bubble = scene.activeBubble;
    const flow = bubble.list.find((child) => Array.isArray(child.list) && child.list.some((item) => item.originalText));
    const item = flow.list.find((child) => child.originalText?.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "") === "rope");
    return {
      x: bubble.x + flow.x + item.x + item.revealWidth / 2,
      y: bubble.y + flow.y + item.y + 13,
      before: item.text,
    };
  });

  const wordPoint = await gamePointToViewport(page, word.x, word.y);
  await page.mouse.move(wordPoint.x, wordPoint.y);
  await page.waitForTimeout(3200);
  await page.screenshot({ path: path.join(OUT_DIR, "dialogue-word-revealed.png"), fullPage: true });

  const revealed = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const bubble = scene.activeBubble;
    const flow = bubble.list.find((child) => Array.isArray(child.list) && child.list.some((item) => item.originalText));
    const item = flow.list.find((child) => child.originalText?.toLowerCase().startsWith("rope"));
    return {
      english: item.text,
      balloon: item.translationBalloon?.text.text || null,
      balloonFillAlpha: item.translationBalloon?.bg.commandBuffer?.some((command) => command === 1) ?? true,
    };
  });
  if (revealed.english !== word.before || revealed.balloon !== "въже") {
    fail("hover reveal did not translate the word after 3 seconds", { word, revealed });
  }

  const outPoint = await gamePointToViewport(page, 900, 520);
  await page.mouse.move(outPoint.x, outPoint.y);
  await page.waitForTimeout(120);
  const reset = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const bubble = scene.activeBubble;
    const flow = bubble.list.find((child) => Array.isArray(child.list) && child.list.some((item) => item.originalText));
    const item = flow.list.find((child) => child.originalText?.toLowerCase().startsWith("rope"));
    return {
      english: item.text,
      hasBalloon: Boolean(item.translationBalloon),
    };
  });
  if (reset.english !== word.before || reset.hasBalloon) {
    fail("hover reveal did not reset to English after pointerout", { before: word.before, reset });
  }

  await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const choices = scene.activeBubble.list.filter((child) => child.hitPlate);
    choices[1].hitPlate.emit("pointerdown");
  });
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(OUT_DIR, "dialogue-feedback.png"), fullPage: true });
  const feedback = await page.evaluate(() => {
    const bubble = window.phaserGame.scene.getScene("CampScene").activeBubble;
    return {
      visible: bubble.feedbackNote.visible,
      text: bubble.feedbackNote.text,
      height: Math.ceil(bubble.feedbackNote.height),
      color: bubble.feedbackNote.style.color,
    };
  });
  if (!feedback.visible || feedback.height > 88 || feedback.color === "#5d1616") {
    fail("feedback should be visible, bounded, and not use the old red error style", feedback);
  }

  const closed = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    const closeButton = scene.activeBubble.list.find((child) => child.isCloseButton);
    closeButton.hitPlate.emit("pointerdown");
    return {
      hasBubble: Boolean(scene.activeBubble),
      learnedWords: [...scene.learnedWords],
    };
  });
  if (closed.hasBubble || closed.learnedWords.includes("rope")) {
    fail("close button should dismiss the item challenge without completing it", closed);
  }
}

await mkdir(OUT_DIR, { recursive: true });
const { server, url } = await startServer();
let browser;

try {
  browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1024, height: 576 }, deviceScaleFactor: 1 });
  await context.route("**/*", (route) => {
    route.continue({ headers: { ...route.request().headers(), "Cache-Control": "no-cache" } });
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${url}/phaser.html?test=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  await page.waitForFunction(() => window.phaserGame?.scene?.getScene("CampScene")?.hero?.sprite?.texture?.key === "heroSprite");
  await page.screenshot({ path: path.join(OUT_DIR, "initial.png"), fullPage: true });
  const guidePlacement = await page.evaluate(() => {
    const scene = window.phaserGame.scene.getScene("CampScene");
    return { x: scene.guide.x, y: scene.guide.y };
  });
  if (guidePlacement.x < 570 || guidePlacement.x > 635 || guidePlacement.y < 430 || guidePlacement.y > 455) {
    fail("guide should stand next to the table, not in the bushes", guidePlacement);
  }
  await validateDialogueUx(page);

  const side = await sampleMove(page, "side-walk", 900, 470, { x: 360, y: 470 });
  const up = await sampleMove(page, "up-walk", 900, 350, { x: 900, y: 560 });
  const down = await sampleMove(page, "down-walk", 900, 560, { x: 900, y: 416 });
  const resources = await page.evaluate(() => performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((name) => name.includes("hero-painted") || name.includes("guide-painted")));

  if (consoleErrors.length > 0) {
    fail("browser console reported errors", consoleErrors);
  }

  if (!resources.every((resource) => resource.includes("?v="))) {
    fail("painted sprite resources were not cache-busted", resources);
  }

  if (resources.some((resource) => resource.includes("hero-painted-boots"))) {
    fail("boot overlay asset should not be loaded", resources);
  }

  const report = {
    url,
    screenshots: OUT_DIR,
    browserChannel: CHANNEL,
    resources,
    side: validateMove("side walk", side, "hero-walk-side", 16, 23, 5),
    up: validateMove("up walk", up, "hero-walk-up", 16, 23, 4),
    down: validateMove("down walk", down, "hero-walk-down", 16, 23, 5),
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) {
    await browser.close();
  }
  server.close();
}
