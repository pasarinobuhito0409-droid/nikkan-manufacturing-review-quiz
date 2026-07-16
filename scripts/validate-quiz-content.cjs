const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appRoot = path.resolve(__dirname, "..");
const dataFile = path.join(appRoot, "quiz-data.js");
const failures = [];

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
  const normalized = path.normalize(reference);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
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

let sets;
try {
  sets = loadSets();
} catch (error) {
  console.error(`Quiz content validation failed to load: ${error.message}`);
  process.exit(1);
}

const strictSets = sets.filter((set) => set && set.strictVisuals === true);
strictSets.forEach((set, setIndex) => {
  const location = `set(${set.id || setIndex})`;
  const imageRegistry = new Map();
  registerUniqueImage(set.heroImage, `${location}.heroImage`, imageRegistry);
  validateVisualItems(set.curiosityPoints, `${location}.curiosityPoints`, imageRegistry);
  validateVisualItems(set.importantPoints, `${location}.importantPoints`, imageRegistry);

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
      if (typeof question.image !== "string" || !question.image.trim()) {
        fail(questionLocation, "image is required");
      } else {
        registerUniqueImage(question.image, `${questionLocation}.image`, imageRegistry);
      }
      if (!Array.isArray(question.answerParagraphs) || !question.answerParagraphs.length) {
        fail(`${questionLocation}.answerParagraphs`, "a non-empty answerParagraphs array is required");
      }
      if (!Array.isArray(question.choices) || question.choices.length < 2) {
        fail(`${questionLocation}.choices`, "at least two choices are required");
      }
      if (!Number.isInteger(question.correctIndex) || !Array.isArray(question.choices) || question.correctIndex < 0 || question.correctIndex >= question.choices.length) {
        fail(`${questionLocation}.correctIndex`, "must point to an existing choice");
      }
    });
  }

  validateAllLineFields(set, location);
  validateReferencedImages(set, location);
});

if (failures.length) {
  console.error(`Quiz content validation failed with ${failures.length} violation(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Quiz content validation passed (${strictSets.length} strict set(s)).`);
