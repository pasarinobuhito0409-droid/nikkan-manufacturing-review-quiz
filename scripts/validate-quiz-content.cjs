const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
const vm = require("node:vm");

const appRoot = path.resolve(__dirname, "..");
const dataFile = path.join(appRoot, "quiz-data.js");
const failures = [];
const PAPER_PHASES = ["what", "how", "why", "result"];
const RASTER_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp"]);

function fail(location, message) {
  failures.push(`${location}: ${message}`);
}

function loadSets() {
  const window = {};
  vm.runInNewContext(fs.readFileSync(dataFile, "utf8"), { window }, { filename: dataFile });
  if (!Array.isArray(window.NIKKAN_QUIZ_SETS)) {
    throw new Error("quiz-data.js did not define window.NIKKAN_QUIZ_SETS as an array");
  }
  return window.NIKKAN_QUIZ_SETS;
}

function textFromLine(line) {
  return typeof line === "string" ? line : line && typeof line === "object" ? line.text : "";
}

function validateLines(value, location) {
  if (!Array.isArray(value)) {
    fail(location, "must be an array");
    return;
  }
  value.forEach((line, index) => {
    const text = textFromLine(line);
    if (typeof text !== "string" || !text.trim()) {
      fail(`${location}[${index}]`, "line must contain non-empty text");
    } else if (Array.from(text.trim()).length > 25) {
      fail(`${location}[${index}]`, "line exceeds the 25-character breath limit");
    }
  });
}

function localAssetPath(reference) {
  if (typeof reference !== "string" || !reference.trim()) return null;
  if (/^(?:[a-z]+:)?\/\//i.test(reference) || /^data:/i.test(reference)) return null;
  return path.resolve(appRoot, reference.split(/[?#]/, 1)[0]);
}

function validateReferencedImages(value, location, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    const childLocation = `${location}.${key}`;
    if (typeof child === "string" && /(?:^image$|image$|zoomImage$)/i.test(key)) {
      const assetPath = localAssetPath(child);
      if (assetPath && !fs.existsSync(assetPath)) fail(childLocation, `file does not exist: ${child}`);
    } else if (child && typeof child === "object") {
      validateReferencedImages(child, childLocation, seen);
    }
  }
}

function validateAllLineFields(value, location, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    const childLocation = `${location}.${key}`;
    if (key === "breathLines" || key === "answerParagraphs") {
      validateLines(child, childLocation);
    } else if (child && typeof child === "object") {
      validateAllLineFields(child, childLocation, seen);
    }
  }
}

function imageKey(reference) {
  const normalized = path.normalize(reference.split(/[?#]/, 1)[0]);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function rasterAssetPath(reference) {
  const assetPath = localAssetPath(reference);
  if (!assetPath || !RASTER_EXTENSIONS.has(path.extname(assetPath).toLowerCase())) return null;
  return assetPath;
}

function fileSha256(assetPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(assetPath)).digest("hex");
}

function registerUniqueImage(reference, location, imageRegistry) {
  if (typeof reference !== "string" || !reference.trim()) return;
  const normalized = imageKey(reference);
  if (imageRegistry.has(normalized)) {
    fail(location, `duplicates ${imageRegistry.get(normalized)}`);
  } else {
    imageRegistry.set(normalized, location);
  }
}

function validateVisualItems(items, location, imageRegistry) {
  if (!Array.isArray(items)) {
    fail(location, "must be an array");
    return;
  }
  items.forEach((item, index) => {
    const itemLocation = `${location}[${index}]`;
    if (!item || typeof item !== "object") {
      fail(itemLocation, "must be an object");
      return;
    }
    if (typeof item.teachingImage !== "string" || !item.teachingImage.trim()) {
      fail(itemLocation, "teachingImage is required");
    }
    if (typeof item.image !== "string" || !item.image.trim()) {
      fail(itemLocation, "source image is required");
    }
    if (item.teachingImage && item.image && imageKey(item.teachingImage) === imageKey(item.image)) {
      fail(itemLocation, "teachingImage and source image must use different paths");
    }
    registerUniqueImage(item.teachingImage, `${itemLocation}.teachingImage`, imageRegistry);
    registerUniqueImage(item.image, `${itemLocation}.image`, imageRegistry);
    if (!Array.isArray(item.breathLines) || !item.breathLines.length) {
      fail(`${itemLocation}.breathLines`, "a non-empty breathLines array is required");
    }
  });
}

function addSourceReference(reference, location, sourceRegistry) {
  if (typeof reference !== "string" || !reference.trim()) return;
  const assetPath = rasterAssetPath(reference);
  if (!assetPath) return;
  sourceRegistry.set(imageKey(reference), location);
}

function collectSourceReferences(value, location, sourceRegistry, sourceContext = false, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((child, index) => collectSourceReferences(child, `${location}[${index}]`, sourceRegistry, sourceContext, seen));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (["frames", "teachingFrames", "answerFrames"].includes(key)) continue;
    const childLocation = `${location}.${key}`;
    const nextSourceContext = sourceContext || /source|evidence|article/i.test(key);
    if (typeof child === "string" && nextSourceContext && /image|source|evidence/i.test(key)) {
      addSourceReference(child, childLocation, sourceRegistry);
    } else if (child && typeof child === "object") {
      collectSourceReferences(child, childLocation, sourceRegistry, nextSourceContext, seen);
    }
  }
}

function paperFrameList(item) {
  for (const field of ["frames", "teachingFrames", "answerFrames"]) {
    if (Array.isArray(item && item[field])) return { field, frames: item[field] };
  }
  return null;
}

function validatePaperAsset(reference, location, frameRegistry, hashRegistry, sourceRegistry) {
  if (typeof reference !== "string" || !reference.trim()) {
    fail(location, "a local raster image path is required");
    return null;
  }
  const assetPath = rasterAssetPath(reference);
  if (!assetPath) {
    fail(location, "must be a local raster image path");
    return null;
  }
  if (!fs.existsSync(assetPath)) {
    fail(location, `file does not exist: ${reference}`);
    return null;
  }
  const key = imageKey(reference);
  if (sourceRegistry.has(key)) {
    fail(location, `reuses source image path from ${sourceRegistry.get(key)}`);
  }
  if (frameRegistry.has(key)) {
    fail(location, `duplicates ${frameRegistry.get(key)}`);
  } else {
    frameRegistry.set(key, location);
  }
  const digest = fileSha256(assetPath);
  if (hashRegistry.has(digest)) {
    fail(location, `has the same SHA-256 content as ${hashRegistry.get(digest)}`);
  } else {
    hashRegistry.set(digest, location);
  }
  return key;
}

function validatePaperZoomAsset(reference, location, imageReference, sourceRegistry) {
  if (reference === undefined) return;
  if (typeof reference !== "string" || !reference.trim()) {
    fail(location, "zoomImage must be a local raster image path when provided");
    return;
  }
  const assetPath = rasterAssetPath(reference);
  if (!assetPath) {
    fail(location, "must be a local raster image path");
    return;
  }
  if (!fs.existsSync(assetPath)) {
    fail(location, `file does not exist: ${reference}`);
  }
  const key = imageKey(reference);
  if (sourceRegistry.has(key)) {
    fail(location, `reuses source image path from ${sourceRegistry.get(key)}`);
  }
  if (imageReference && key === imageKey(imageReference)) return;
}

function validatePaperFrameItem(item, location, sourceRegistry, frameRegistry, hashRegistry) {
  if (!item || typeof item !== "object") {
    fail(location, "must be an object");
    return;
  }
  const frameInfo = paperFrameList(item);
  if (!frameInfo || frameInfo.frames.length !== 4) {
    fail(`${location}.frames`, "must contain exactly four frames");
    return;
  }
  frameInfo.frames.forEach((frame, index) => {
    const frameLocation = `${location}.${frameInfo.field}[${index}]`;
    if (!frame || typeof frame !== "object") {
      fail(frameLocation, "must be an object");
      return;
    }
    const expectedPhase = PAPER_PHASES[index];
    if (frame.phase !== expectedPhase) {
      fail(`${frameLocation}.phase`, `must be ${expectedPhase}`);
    }
    if (frame.order !== index + 1) {
      fail(`${frameLocation}.order`, `must be ${index + 1}`);
    }
    if (typeof frame.phaseLabel !== "string" || !frame.phaseLabel.trim()) {
      fail(`${frameLocation}.phaseLabel`, "a non-empty label is required");
    }
    const labels = Array.isArray(frame.requiredLabels) ? frame.requiredLabels : frame.labels;
    if (!Array.isArray(labels) || !labels.length || labels.some((label) => typeof label !== "string" || !label.trim())) {
      fail(`${frameLocation}.requiredLabels`, "at least one non-empty label is required");
    }
    if (index === 3 && frame.result !== true) {
      fail(`${frameLocation}.result`, "the final result frame must set result:true");
    }
    if (index < 3 && frame.result === true) {
      fail(`${frameLocation}.result`, "only the final frame may set result:true");
    }
    validatePaperAsset(frame.image, `${frameLocation}.image`, frameRegistry, hashRegistry, sourceRegistry);
    validatePaperZoomAsset(frame.zoomImage, `${frameLocation}.zoomImage`, frame.image, sourceRegistry);
  });
}

function validatePaperFrameItems(items, location, sourceRegistry, frameRegistry, hashRegistry) {
  if (!Array.isArray(items)) {
    fail(location, "must be an array");
    return;
  }
  items.forEach((item, index) => validatePaperFrameItem(item, `${location}[${index}]`, sourceRegistry, frameRegistry, hashRegistry));
}

function validatePaperTheaterSet(set, location) {
  if (set.paperTheater && typeof set.paperTheater === "object") {
    if (set.paperTheater.frameCount !== 4) {
      fail(`${location}.paperTheater.frameCount`, "must be 4");
    }
    if (Array.isArray(set.paperTheater.phases) && JSON.stringify(set.paperTheater.phases) !== JSON.stringify(PAPER_PHASES)) {
      fail(`${location}.paperTheater.phases`, "must be what, how, why, result in order");
    }
  }
  const sourceRegistry = new Map();
  addSourceReference(set.articleEvidence && set.articleEvidence.image, `${location}.articleEvidence.image`, sourceRegistry);
  addSourceReference(set.articleEvidence && set.articleEvidence.zoomImage, `${location}.articleEvidence.zoomImage`, sourceRegistry);
  ["curiosityPoints", "importantPoints"].forEach((field) => {
    (Array.isArray(set[field]) ? set[field] : []).forEach((item, index) => {
      addSourceReference(item && item.image, `${location}.${field}[${index}].image`, sourceRegistry);
      addSourceReference(item && item.zoomImage, `${location}.${field}[${index}].zoomImage`, sourceRegistry);
    });
  });
  collectSourceReferences(set.questions, `${location}.questions`, sourceRegistry);

  const frameRegistry = new Map();
  const hashRegistry = new Map();
  validatePaperFrameItems(set.curiosityPoints, `${location}.curiosityPoints`, sourceRegistry, frameRegistry, hashRegistry);
  validatePaperFrameItems(set.importantPoints, `${location}.importantPoints`, sourceRegistry, frameRegistry, hashRegistry);
  if (!Array.isArray(set.questions)) {
    fail(`${location}.questions`, "must be an array");
    return;
  }
  if (set.questions.length !== 3) {
    fail(`${location}.questions`, "paper-theater review sets must contain exactly three questions");
  }
  set.questions.forEach((question, index) => {
    validatePaperFrameItem(question, `${location}.questions[${index}]`, sourceRegistry, frameRegistry, hashRegistry);
  });
}

let sets;
try {
  sets = loadSets();
} catch (error) {
  console.error(`Quiz content validation failed to load: ${error.message}`);
  process.exit(1);
}

const strictSets = sets.filter((set) => set && set.strictVisuals === true);
const paperSets = sets.filter((set) => set && set.paperTheater);
const validationSets = [...new Set([...strictSets, ...paperSets])];
sets.forEach((set, index) => {
  if (!set || set.responseMode === undefined) return;
  if (set.responseMode !== "say-it") {
    fail(`set(${set.id || index}).responseMode`, 'must be "say-it" when provided');
  }
});
validationSets.forEach((set, setIndex) => {
  const location = `set(${set.id || setIndex})`;
  const imageRegistry = new Map();
  if (set.strictVisuals === true) {
    registerUniqueImage(set.heroImage, `${location}.heroImage`, imageRegistry);
    if (!set.paperTheater) {
      validateVisualItems(set.curiosityPoints, `${location}.curiosityPoints`, imageRegistry);
      validateVisualItems(set.importantPoints, `${location}.importantPoints`, imageRegistry);
    }

    if (!Array.isArray(set.questions)) {
      fail(`${location}.questions`, "must be an array");
    } else {
      if (set.questions.length !== 3) {
        fail(`${location}.questions`, "strict review sets must contain exactly three questions");
      }
      set.questions.forEach((question, questionIndex) => {
        const questionLocation = `${location}.questions[${questionIndex}]`;
        if (!question || typeof question !== "object") {
          fail(questionLocation, "must be an object");
          return;
        }
        if (!set.paperTheater && (typeof question.image !== "string" || !question.image.trim())) {
          fail(questionLocation, "image is required");
        } else if (!set.paperTheater && question.image) {
          registerUniqueImage(question.image, `${questionLocation}.image`, imageRegistry);
        }
        if (!Array.isArray(question.answerParagraphs) || !question.answerParagraphs.length) {
          fail(`${questionLocation}.answerParagraphs`, "a non-empty answerParagraphs array is required");
        }
        if (set.responseMode !== "say-it" && (!Array.isArray(question.choices) || question.choices.length < 2)) {
          fail(`${questionLocation}.choices`, "at least two choices are required");
        }
        if (set.responseMode !== "say-it" && (!Number.isInteger(question.correctIndex) || !Array.isArray(question.choices) || question.correctIndex < 0 || question.correctIndex >= question.choices.length)) {
          fail(`${questionLocation}.correctIndex`, "must point to an existing choice");
        }
      });
    }
  }

  if (set.paperTheater) validatePaperTheaterSet(set, location);
  validateAllLineFields(set, location);
  validateReferencedImages(set, location);
});

if (failures.length) {
  console.error(`Quiz content validation failed with ${failures.length} violation(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Quiz content validation passed (${strictSets.length} strict set(s)).`);
