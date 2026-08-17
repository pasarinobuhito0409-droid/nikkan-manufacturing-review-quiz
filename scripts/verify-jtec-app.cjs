const path = require("node:path");
const fs = require("node:fs");

const playwrightPath = process.env.PLAYWRIGHT_PATH || "C:/Users/今林拓也/AppData/Local/OpenAI/Codex/runtimes/cua_node/f1bf3cd3a5929acd/bin/node_modules/playwright";
const executablePath = process.env.BROWSER_PATH || "C:/Users/今林拓也/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe";
const { chromium } = require(playwrightPath);

const baseUrl = process.argv[2] || "http://127.0.0.1:8765/";
const screenshotPath = path.resolve(process.argv[3] || "tmp/verify-jtec-summary.png");

async function must(locator, label) {
  if (!(await locator.count())) throw new Error(`missing: ${label}`);
}

async function answer(page, label) {
  const choice = page.locator(".say-it-choice", { hasText: label });
  if (!(await choice.count())) {
    console.error(`say-it choice missing: ${label}`);
    console.error((await page.locator("body").innerText()).slice(0, 2500));
    await page.screenshot({ path: "tmp/verify-jtec-failure.png", fullPage: true });
    throw new Error(`missing say-it choice: ${label}`);
  }
  await choice.first().click();
  await page.locator("#revealButton").click();
  await page.locator(".answer-panel").waitFor();
}

async function openJtec(page) {
  await page.goto(`${baseUrl}?v=64`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.locator("#shelfOpenButton").click();
  const latest = page.locator("#setList .set-row").first();
  await must(latest, "latest set");
  const label = await latest.textContent();
  if (!label.includes("再生医療ツアー")) throw new Error(`latest set mismatch: ${label}`);
  await latest.click();
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  try {
    await openJtec(page);
    await page.locator('button.mode-tab[data-mode="evidence"]').click();
    await must(page.locator(".evidence-header"), "evidence header");
    await must(page.locator('img[src*="2026-08-17-jtec-source-marked"]'), "source evidence image");
    if (await page.locator(".evidence-paper-theater").count() !== 3) throw new Error("paper theater count is not 3");
    await page.locator('button.mode-tab[data-mode="recall"]').click();
    await must(page.locator(".recall-scenario"), "scenario lines");
    await answer(page, "言えた");
    await must(page.locator('img[src*="2026-08-17-jtec-q1-01"]'), "q1 answer image");
    await page.locator("#nextButton").click();
    await answer(page, "言えた");
    await page.locator("#nextButton").click();
    await answer(page, "言えた");
    await must(page.locator("#sayItCopyText"), "copy text");
    const perfect = await page.locator(".say-it-score").textContent();
    if (!perfect.includes("言えた 3/3")) throw new Error(`perfect score mismatch: ${perfect}`);

    const partialContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const partialPage = await partialContext.newPage();
    try {
      await openJtec(partialPage);
      await answer(partialPage, "言えなかった");
      await partialPage.locator("#nextButton").click();
      await answer(partialPage, "言えた");
      await partialPage.locator("#nextButton").click();
      await answer(partialPage, "言えた");
      const partial = await partialPage.locator(".say-it-score").textContent();
      if (!partial.includes("言えた 2/3")) throw new Error(`partial score mismatch: ${partial}`);
      const missed = await partialPage.locator(".say-it-missed").textContent();
      if (!missed.includes("ツアーの狙いは？")) throw new Error("missed list is missing q1");
      await partialPage.locator(".say-it-summary").scrollIntoViewIfNeeded();
      await partialPage.locator("#learningStage").evaluate((element) => { element.scrollTop = element.scrollHeight; });
      await partialPage.waitForTimeout(1200);
      const summaryBox = await partialPage.locator(".say-it-summary").boundingBox();
      if (!summaryBox) throw new Error("summary bounding box is missing");
      const cdp = await partialPage.context().newCDPSession(partialPage);
      const captured = await cdp.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
        clip: { ...summaryBox, scale: 1 }
      });
      fs.writeFileSync(screenshotPath, Buffer.from(captured.data, "base64"));
      const overflow = await partialPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (overflow) throw new Error("horizontal overflow on mobile viewport");
      console.log(JSON.stringify({ ok: true, url: baseUrl, paperTheaters: 3, perfect, partial, screenshotPath }));
    } finally {
      await partialContext.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
