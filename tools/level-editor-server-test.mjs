import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLevelEditorServer } from "./level-editor-server.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEST_FILES = [
  "scenarios/__level-editor-save-no-root-presentation.json",
  "scenarios/__level-editor-save-partial-root-presentation.json",
];

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://${address.address}:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function postSave(baseUrl, scenario) {
  const response = await fetch(`${baseUrl}/__level-editor/save-hotspots`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      scenario,
      hotspots: [{ id: "badge", x: 130.4, y: 240.6, radius: 55.2 }],
      actors: {
        hero: { x: 301.2, y: 421.7, scale_multiplier: 1.61 },
        guide: { x: 802.1, y: 389.9, scale_multiplier: 1.74 },
      },
      obstacles: [],
      depth_scale: null,
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, body.error);
  assert.equal(body.ok, true);
  return body;
}

function makeScenario(extra = {}) {
  return {
    schema_version: 1,
    scene_id: "level-editor-save-test",
    assets: {},
    ...extra,
    hero_start: { x: 300, y: 420 },
    guide: {
      id: "director",
      position: { x: 800, y: 390 },
      dialogue: [],
    },
    navigation: { obstacles: [] },
    hotspots: [
      {
        id: "badge",
        label: "Badge",
        english: "badge",
        bg: "значка",
        kind: "collectible",
        x: 120,
        y: 230,
        radius: 45,
        presentation: {
          sprite: "badge-icon",
        },
      },
    ],
  };
}

async function main() {
  const server = createLevelEditorServer();
  const baseUrl = await listen(server);
  try {
    const noRootPresentation = TEST_FILES[0];
    await fs.writeFile(
      path.join(ROOT, noRootPresentation),
      `${JSON.stringify(makeScenario(), null, 2)}\n`,
    );
    await postSave(baseUrl, noRootPresentation);
    const inserted = JSON.parse(await fs.readFile(path.join(ROOT, noRootPresentation), "utf8"));
    assert.equal(inserted.presentation.character_scale_multiplier, 1.61);
    assert.equal(inserted.presentation.guide_scale_multiplier, 1.74);
    assert.equal(inserted.hero_start.x, 301);
    assert.equal(inserted.guide.position.y, 390);
    assert.equal(inserted.hotspots[0].presentation.sprite, "badge-icon");
    assert.equal(inserted.hotspots[0].presentation.character_scale_multiplier, undefined);

    const partialRootPresentation = TEST_FILES[1];
    await fs.writeFile(
      path.join(ROOT, partialRootPresentation),
      `${JSON.stringify(makeScenario({
        presentation: {
          character_depth_scale: {
            back_y: 220,
            back_scale: 0.8,
            front_y: 520,
            front_scale: 1.2,
          },
        },
      }), null, 2)}\n`,
    );
    await postSave(baseUrl, partialRootPresentation);
    const updated = JSON.parse(await fs.readFile(path.join(ROOT, partialRootPresentation), "utf8"));
    assert.equal(updated.presentation.character_scale_multiplier, 1.61);
    assert.equal(updated.presentation.guide_scale_multiplier, 1.74);
    assert.equal(updated.presentation.character_depth_scale.back_y, 220);
  } finally {
    await Promise.all(TEST_FILES.map((file) => fs.rm(path.join(ROOT, file), { force: true })));
    await close(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
