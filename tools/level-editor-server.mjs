import { createReadStream, promises as fs } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 9231);

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
]);

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function safeWorkspacePath(urlPath) {
  const withoutQuery = String(urlPath || "").split("?")[0];
  const decoded = decodeURIComponent(withoutQuery).replace(/^\/+/, "");
  const resolved = path.resolve(ROOT, decoded || "phaser.html");
  if (!resolved.startsWith(`${ROOT}${path.sep}`) && resolved !== ROOT) {
    return null;
  }
  return resolved;
}

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function normalizeHotspotPatch(rawHotspots) {
  if (!Array.isArray(rawHotspots)) {
    throw new Error("hotspots must be an array");
  }
  return rawHotspots.map((entry) => {
    const id = String(entry?.id || "").trim();
    const x = Number(entry?.x);
    const y = Number(entry?.y);
    const radius = Number(entry?.radius);
    if (!id || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius)) {
      throw new Error("each hotspot needs id, x, y, and radius");
    }
    return {
      id,
      x: Math.round(x),
      y: Math.round(y),
      radius: Math.round(radius),
    };
  });
}

function normalizeActorPatch(rawActors) {
  if (!rawActors || typeof rawActors !== "object") {
    return {};
  }
  const normalizeActor = (actor, label) => {
    if (!actor) {
      return null;
    }
    const x = Number(actor.x);
    const y = Number(actor.y);
    const scaleMultiplier = Number(actor.scale_multiplier);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(scaleMultiplier)) {
      throw new Error(`${label} needs x, y, and scale_multiplier`);
    }
    return {
      x: Math.round(x),
      y: Math.round(y),
      scale_multiplier: Number(scaleMultiplier.toFixed(2)),
    };
  };
  return {
    hero: normalizeActor(rawActors.hero, "hero"),
    guide: normalizeActor(rawActors.guide, "guide"),
  };
}

function normalizeObstaclePatch(rawObstacles) {
  if (rawObstacles === undefined) {
    return [];
  }
  if (!Array.isArray(rawObstacles)) {
    throw new Error("obstacles must be an array");
  }
  return rawObstacles.map((entry) => {
    const id = String(entry?.id || "").trim();
    const x1 = Number(entry?.x1);
    const y1 = Number(entry?.y1);
    const x2 = Number(entry?.x2);
    const y2 = Number(entry?.y2);
    if (!id || !Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) {
      throw new Error("each obstacle needs id, x1, y1, x2, and y2");
    }
    return {
      id,
      x1: Math.round(Math.min(x1, x2)),
      y1: Math.round(Math.min(y1, y2)),
      x2: Math.round(Math.max(x1, x2)),
      y2: Math.round(Math.max(y1, y2)),
    };
  });
}

function normalizeDepthScalePatch(rawScale) {
  if (!rawScale || typeof rawScale !== "object") {
    return null;
  }
  const backY = Number(rawScale.back_y);
  const backScale = Number(rawScale.back_scale);
  const frontY = Number(rawScale.front_y);
  const frontScale = Number(rawScale.front_scale);
  if (!Number.isFinite(backY) || !Number.isFinite(backScale) || !Number.isFinite(frontY) || !Number.isFinite(frontScale)) {
    throw new Error("depth_scale needs back_y, back_scale, front_y, and front_scale");
  }
  return {
    back_y: Math.round(backY),
    back_scale: Number(backScale.toFixed(3)),
    front_y: Math.round(frontY),
    front_scale: Number(frontScale.toFixed(3)),
  };
}

function findObjectStart(text, index) {
  for (let position = index; position >= 0; position -= 1) {
    if (text[position] === "{") {
      return position;
    }
  }
  return -1;
}

function findObjectEnd(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let position = start; position < text.length; position += 1) {
    const character = text[position];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = inString;
      continue;
    }
    if (character === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return position + 1;
      }
    }
  }
  return -1;
}

function replaceNumberProperty(objectText, property, value) {
  const pattern = new RegExp(`("${property}"\\s*:\\s*)-?\\d+(?:\\.\\d+)?`);
  if (!pattern.test(objectText)) {
    throw new Error(`object is missing ${property}`);
  }
  return objectText.replace(pattern, `$1${value}`);
}

function findPropertyObject(text, property, fromIndex = 0) {
  const pattern = new RegExp(`"${property}"\\s*:\\s*\\{`, "g");
  pattern.lastIndex = fromIndex;
  const match = pattern.exec(text);
  if (!match) {
    return null;
  }
  const start = text.indexOf("{", match.index);
  const end = findObjectEnd(text, start);
  if (start < 0 || end < 0) {
    return null;
  }
  return { start, end, matchIndex: match.index };
}

function findTopLevelPropertyObject(text, property) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let position = 0; position < text.length; position += 1) {
    const character = text[position];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = inString;
      continue;
    }
    if (character === "\"") {
      if (!inString && depth === 1) {
        const keyStart = position + 1;
        let keyEnd = keyStart;
        let keyEscaped = false;
        while (keyEnd < text.length) {
          const keyCharacter = text[keyEnd];
          if (keyEscaped) {
            keyEscaped = false;
          } else if (keyCharacter === "\\") {
            keyEscaped = true;
          } else if (keyCharacter === "\"") {
            break;
          }
          keyEnd += 1;
        }
        if (keyEnd < text.length && text.slice(keyStart, keyEnd) === property) {
          let valueStart = keyEnd + 1;
          while (/\s|:/.test(text[valueStart] || "")) {
            valueStart += 1;
          }
          if (text[valueStart] === "{") {
            const end = findObjectEnd(text, valueStart);
            if (end > 0) {
              return { start: valueStart, end, matchIndex: position };
            }
          }
        }
      }
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
    }
  }
  return null;
}

function findArrayEnd(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let position = start; position < text.length; position += 1) {
    const character = text[position];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = inString;
      continue;
    }
    if (character === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (character === "[") {
      depth += 1;
    } else if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        return position + 1;
      }
    }
  }
  return -1;
}

function findPropertyArray(text, property, fromIndex = 0) {
  const pattern = new RegExp(`"${property}"\\s*:\\s*\\[`, "g");
  pattern.lastIndex = fromIndex;
  const match = pattern.exec(text);
  if (!match) {
    return null;
  }
  const start = text.indexOf("[", match.index);
  const end = findArrayEnd(text, start);
  if (start < 0 || end < 0) {
    return null;
  }
  return { start, end, matchIndex: match.index };
}

function findTopLevelObjectInArrayContainingIndex(text, arrayRange, index) {
  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escaped = false;
  for (let position = arrayRange.start; position < arrayRange.end; position += 1) {
    const character = text[position];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = inString;
      continue;
    }
    if (character === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (character === "{") {
      if (depth === 0) {
        objectStart = position;
      }
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        const objectEnd = position + 1;
        if (objectStart <= index && index < objectEnd) {
          return { start: objectStart, end: objectEnd };
        }
        objectStart = -1;
      }
    }
  }
  return null;
}

function patchHotspotText(originalText, patches) {
  let text = originalText;
  const sortedPatches = [...patches].sort((left, right) => right.id.localeCompare(left.id));
  for (const patch of sortedPatches) {
    const arrayRange = findPropertyArray(text, "hotspots");
    if (!arrayRange) {
      throw new Error("could not find hotspots array");
    }
    const arrayText = text.slice(arrayRange.start, arrayRange.end);
    const idPattern = new RegExp(`"id"\\s*:\\s*${JSON.stringify(patch.id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    const match = idPattern.exec(arrayText);
    if (!match) {
      throw new Error(`could not find hotspot id ${patch.id}`);
    }
    const absoluteMatchIndex = arrayRange.start + match.index;
    const objectRange = findTopLevelObjectInArrayContainingIndex(text, arrayRange, absoluteMatchIndex);
    if (!objectRange) {
      throw new Error(`could not locate hotspot object for ${patch.id}`);
    }
    const { start, end } = objectRange;
    let objectText = text.slice(start, end);
    objectText = replaceNumberProperty(objectText, "x", patch.x);
    objectText = replaceNumberProperty(objectText, "y", patch.y);
    objectText = replaceNumberProperty(objectText, "radius", patch.radius);
    text = `${text.slice(0, start)}${objectText}${text.slice(end)}`;
  }
  return text;
}

function patchPropertyObjectNumber(text, property, values, fromIndex = 0) {
  const objectRange = findPropertyObject(text, property, fromIndex);
  if (!objectRange) {
    throw new Error(`could not find ${property}`);
  }
  let objectText = text.slice(objectRange.start, objectRange.end);
  for (const [key, value] of Object.entries(values)) {
    objectText = replaceNumberProperty(objectText, key, value);
  }
  return `${text.slice(0, objectRange.start)}${objectText}${text.slice(objectRange.end)}`;
}

function upsertNumberProperty(objectText, property, value) {
  const pattern = new RegExp(`("${property}"\\s*:\\s*)-?\\d+(?:\\.\\d+)?`);
  if (pattern.test(objectText)) {
    return objectText.replace(pattern, `$1${value}`);
  }
  const insertAt = objectText.lastIndexOf("}");
  if (insertAt < 0) {
    throw new Error(`object is missing closing brace for ${property}`);
  }
  const indent = objectText.match(/\n(\s*)"[^"]+"\s*:/)?.[1] || "  ";
  const outerIndent = indent.slice(0, Math.max(0, indent.length - 2));
  const hasProperties = /{\s*"[^"]+"\s*:/.test(objectText);
  const prefix = hasProperties ? "," : "";
  return `${objectText.slice(0, insertAt)}${prefix}\n${indent}"${property}": ${value}\n${outerIndent}${objectText.slice(insertAt)}`;
}

function patchObjectRangeNumber(text, objectRange, values, { allowMissing = false } = {}) {
  let objectText = text.slice(objectRange.start, objectRange.end);
  for (const [key, value] of Object.entries(values)) {
    objectText = allowMissing
      ? upsertNumberProperty(objectText, key, value)
      : replaceNumberProperty(objectText, key, value);
  }
  return `${text.slice(0, objectRange.start)}${objectText}${text.slice(objectRange.end)}`;
}

function patchTopLevelPropertyObjectNumber(text, property, values, options = {}) {
  const objectRange = findTopLevelPropertyObject(text, property);
  if (!objectRange) {
    throw new Error(`could not find top-level ${property}`);
  }
  return patchObjectRangeNumber(text, objectRange, values, options);
}

function ensurePresentationText(text, actors) {
  if (!actors.hero && !actors.guide && !actors.depthScale) {
    return text;
  }
  if (findTopLevelPropertyObject(text, "presentation")) {
    return text;
  }
  const heroStartMatch = /,\n\s*"hero_start"\s*:/.exec(text);
  if (!heroStartMatch) {
    throw new Error("scenario needs presentation or hero_start to save actor sizes");
  }
  const indent = heroStartMatch[0].match(/\n(\s*)"/)?.[1] || "  ";
  const heroScale = actors.hero?.scale_multiplier ?? 1;
  const guideScale = actors.guide?.scale_multiplier ?? heroScale;
  const depthScale = actors.depthScale
    ? `,\n${indent}  "character_depth_scale": {\n${indent}    "back_y": ${actors.depthScale.back_y},\n${indent}    "back_scale": ${actors.depthScale.back_scale},\n${indent}    "front_y": ${actors.depthScale.front_y},\n${indent}    "front_scale": ${actors.depthScale.front_scale}\n${indent}  }`
    : "";
  const presentation = `,\n${indent}"presentation": {\n${indent}  "character_scale_multiplier": ${heroScale},\n${indent}  "guide_scale_multiplier": ${guideScale}${depthScale}\n${indent}}`;
  return `${text.slice(0, heroStartMatch.index)}${presentation}${text.slice(heroStartMatch.index)}`;
}

function patchActorText(originalText, actors, depthScale = null) {
  let text = ensurePresentationText(originalText, { ...actors, depthScale });
  if (actors.hero) {
    text = patchPropertyObjectNumber(text, "hero_start", {
      x: actors.hero.x,
      y: actors.hero.y,
    });
    text = patchTopLevelPropertyObjectNumber(text, "presentation", {
      character_scale_multiplier: actors.hero.scale_multiplier,
    }, { allowMissing: true });
  }
  if (actors.guide) {
    const guideRange = findPropertyObject(text, "guide");
    if (!guideRange) {
      throw new Error("could not find guide");
    }
    text = patchPropertyObjectNumber(text, "position", {
      x: actors.guide.x,
      y: actors.guide.y,
    }, guideRange.start);
    text = patchTopLevelPropertyObjectNumber(text, "presentation", {
      guide_scale_multiplier: actors.guide.scale_multiplier,
    }, { allowMissing: true });
  }
  if (depthScale) {
    text = patchDepthScaleText(text, depthScale);
  }
  return text;
}

function patchDepthScaleText(originalText, depthScale) {
  const presentationRange = findTopLevelPropertyObject(originalText, "presentation");
  if (!presentationRange) {
    throw new Error("could not find presentation");
  }
  const existingRange = findPropertyObject(originalText, "character_depth_scale", presentationRange.start);
  if (existingRange && existingRange.start < presentationRange.end) {
    let objectText = originalText.slice(existingRange.start, existingRange.end);
    objectText = replaceNumberProperty(objectText, "back_y", depthScale.back_y);
    objectText = replaceNumberProperty(objectText, "back_scale", depthScale.back_scale);
    objectText = replaceNumberProperty(objectText, "front_y", depthScale.front_y);
    objectText = replaceNumberProperty(objectText, "front_scale", depthScale.front_scale);
    return `${originalText.slice(0, existingRange.start)}${objectText}${originalText.slice(existingRange.end)}`;
  }

  const presentationText = originalText.slice(presentationRange.start, presentationRange.end);
  const indent = presentationText.match(/\n(\s*)"[^"]+"\s*:/)?.[1] || "    ";
  const outerIndent = indent.slice(0, Math.max(0, indent.length - 2));
  const insert = `,\n${indent}"character_depth_scale": {\n${indent}  "back_y": ${depthScale.back_y},\n${indent}  "back_scale": ${depthScale.back_scale},\n${indent}  "front_y": ${depthScale.front_y},\n${indent}  "front_scale": ${depthScale.front_scale}\n${outerIndent}}`;
  const insertAt = presentationRange.end - 1;
  return `${originalText.slice(0, insertAt)}${insert}${originalText.slice(insertAt)}`;
}

function patchObstacleText(originalText, patches) {
  if (patches.length === 0) {
    return originalText;
  }
  const arrayRange = findPropertyArray(originalText, "obstacles");
  if (!arrayRange) {
    throw new Error("could not find navigation obstacles");
  }
  let text = originalText;
  const sortedPatches = [...patches].sort((left, right) => right.id.localeCompare(left.id));
  for (const patch of sortedPatches) {
    const currentArrayRange = findPropertyArray(text, "obstacles");
    const arrayText = text.slice(currentArrayRange.start, currentArrayRange.end);
    const idPattern = new RegExp(`"id"\\s*:\\s*${JSON.stringify(patch.id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    const match = idPattern.exec(arrayText);
    if (!match) {
      throw new Error(`could not find obstacle id ${patch.id}`);
    }
    const absoluteMatchIndex = currentArrayRange.start + match.index;
    const start = findObjectStart(text, absoluteMatchIndex);
    const end = findObjectEnd(text, start);
    if (start < currentArrayRange.start || end > currentArrayRange.end || start < 0 || end < 0) {
      throw new Error(`could not locate obstacle object for ${patch.id}`);
    }
    let objectText = text.slice(start, end);
    objectText = replaceNumberProperty(objectText, "x1", patch.x1);
    objectText = replaceNumberProperty(objectText, "y1", patch.y1);
    objectText = replaceNumberProperty(objectText, "x2", patch.x2);
    objectText = replaceNumberProperty(objectText, "y2", patch.y2);
    text = `${text.slice(0, start)}${objectText}${text.slice(end)}`;
  }
  return text;
}

async function saveHotspots(request, response) {
  try {
    const payload = await readRequestJson(request);
    const scenarioPath = safeWorkspacePath(payload.scenario);
    if (!scenarioPath || !scenarioPath.startsWith(path.join(ROOT, "scenarios") + path.sep)) {
      sendJson(response, 400, { ok: false, error: "scenario must be a file under scenarios/" });
      return;
    }

    const patches = normalizeHotspotPatch(payload.hotspots);
    const actors = normalizeActorPatch(payload.actors);
    const obstacles = normalizeObstaclePatch(payload.obstacles);
    const depthScale = normalizeDepthScalePatch(payload.depth_scale);
    const patchById = new Map(patches.map((entry) => [entry.id, entry]));
    const obstacleById = new Map(obstacles.map((entry) => [entry.id, entry]));
    const originalText = await fs.readFile(scenarioPath, "utf8");
    const content = JSON.parse(originalText);
    if (!Array.isArray(content.hotspots)) {
      sendJson(response, 400, { ok: false, error: "scenario has no hotspots array" });
      return;
    }

    const missing = [];
    for (const id of patchById.keys()) {
      if (!content.hotspots.some((hotspot) => hotspot.id === id)) {
        missing.push(id);
      }
    }
    if (missing.length > 0) {
      sendJson(response, 400, { ok: false, error: `unknown hotspot id(s): ${missing.join(", ")}` });
      return;
    }
    const missingObstacles = [];
    for (const id of obstacleById.keys()) {
      if (!content.navigation?.obstacles?.some((obstacle) => obstacle.id === id)) {
        missingObstacles.push(id);
      }
    }
    if (missingObstacles.length > 0) {
      sendJson(response, 400, { ok: false, error: `unknown obstacle id(s): ${missingObstacles.join(", ")}` });
      return;
    }

    let nextText = patchHotspotText(originalText, patches);
    nextText = patchActorText(nextText, actors, depthScale);
    nextText = patchObstacleText(nextText, obstacles);
    await fs.writeFile(scenarioPath, nextText);
    sendJson(response, 200, {
      ok: true,
      scenario: path.relative(ROOT, scenarioPath),
      saved: patchById.size,
      actors: Object.values(actors).filter(Boolean).length,
      obstacles: obstacleById.size,
      depth_scale: Boolean(depthScale),
    });
  } catch (error) {
    sendJson(response, 400, { ok: false, error: error.message });
  }
}

async function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || `localhost:${PORT}`}`);
  const filePath = safeWorkspacePath(requestUrl.pathname);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  const statPath = (await fs.stat(filePath).catch(() => null))?.isDirectory()
    ? path.join(filePath, "index.html")
    : filePath;
  const stat = await fs.stat(statPath).catch(() => null);
  if (!stat?.isFile()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "content-type": MIME_TYPES.get(path.extname(statPath)) || "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(statPath).pipe(response);
}

export function createLevelEditorServer() {
  return http.createServer((request, response) => {
    if (request.method === "POST" && request.url?.startsWith("/__level-editor/save-hotspots")) {
      saveHotspots(request, response);
      return;
    }
    if (request.method === "GET" || request.method === "HEAD") {
      serveStatic(request, response);
      return;
    }
    response.writeHead(405);
    response.end("Method not allowed");
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const server = createLevelEditorServer();
  server.listen(PORT, () => {
    console.log(`Level editor server running at http://localhost:${PORT}/`);
  });
}
