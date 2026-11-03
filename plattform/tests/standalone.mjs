import { chromium, expect } from "@playwright/test";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const fixture = process.argv[2];
if (!fixture)
  throw Error(
    "Aufruf: node tests/standalone.mjs <Einheit.json> [HTML-Ausgabepfad]",
  );
const unit = JSON.parse(await readFile(fixture, "utf8"));
const dir = await mkdtemp(join(tmpdir(), "lernraum-export-"));
const file = process.argv[3] || join(dir, "einheit.html");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  page.on("dialog", (d) => d.accept());
  await page.goto(process.env.APP_URL || "http://localhost:5174");
  await page.locator("input[type=file]").setInputFiles(fixture);
  await expect(page.getByLabel("Titel der Einheit")).toHaveValue(unit.title);
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "HTML für Lernende exportieren" })
    .click();
  await (await downloading).saveAs(file);
  const html = await readFile(file, "utf8");
  assert.ok(!html.includes("<script src="));
  assert.ok(!html.includes("<link "));
  const learner = await browser.newContext({
    offline: true,
    viewport: { width: 390, height: 844 },
  });
  const p = await learner.newPage();
  const errors = [],
    requests = [];
  if (process.env.TEST_HTML_ORIGIN)
    await p.route(process.env.TEST_HTML_ORIGIN + "/**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      await route.fulfill({
        contentType: "text/html",
        body: await readFile(
          pathname.endsWith("safe.html") ? join(dir, "safe.html") : file,
          "utf8",
        ),
      });
    });
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("request", (r) => {
    if (/^https?:/.test(r.url()) && !r.isNavigationRequest())
      requests.push(r.url());
  });
  p.on("dialog", (d) => d.accept());
  await p.goto(
    process.env.TEST_HTML_ORIGIN
      ? process.env.TEST_HTML_ORIGIN + "/einheit.html"
      : pathToFileURL(file).href,
  );
  await expect(p.locator(".card")).toHaveCount(unit.blocks.length);
  await expect(p.getByRole("heading", { name: unit.title })).toBeVisible();
  await expect(
    p.getByRole("button", { name: "Einheit bearbeiten" }),
  ).toHaveCount(0);
  const single = unit.blocks.find((b) => b.type === "single"),
    multi = unit.blocks.find((b) => b.type === "multiple"),
    free = unit.blocks.find((b) => b.type === "free");
  const card = (b) =>
    p.locator(".card").nth(unit.blocks.findIndex((x) => x.id === b.id));
  if (single) {
    await card(single)
      .getByRole("radio")
      .nth(single.options.findIndex((o) => o.correct))
      .check();
    await expect(card(single).getByRole("status")).toContainText("Richtig!");
  }
  if (multi) {
    for (const [i, o] of multi.options.entries())
      if (o.correct) await card(multi).getByRole("checkbox").nth(i).check();
    await expect(card(multi).getByRole("status")).toContainText("Richtig!");
  }
  if (free) {
    await card(free).locator("textarea").fill("Mein lokaler Lernstand");
    await expect(card(free).locator(".feedback")).toBeHidden();
    await card(free).getByRole("button").click();
    await expect(card(free).locator(".feedback")).toBeVisible();
  }
  const before = await p.locator("#progress-text").textContent();
  await p.reload();
  await expect(p.locator("#progress-text")).toHaveText(before);
  if (free) {
    await expect(card(free).locator("textarea")).toHaveValue(
      "Mein lokaler Lernstand",
    );
    await expect(card(free).locator(".feedback")).toBeHidden();
  }
  assert.ok(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await p
    .getByRole("button", { name: "Antworten und Fortschritt zurücksetzen" })
    .click();
  await expect(p.locator("#progress-text")).toHaveText(
    `0 von ${unit.blocks.filter((b) => b.type !== "text").length} Aufgaben bearbeitet`,
  );
  await p.reload();
  await expect(p.locator("#progress")).toHaveJSProperty("value", 0);
  assert.deepEqual(requests, []);
  assert.deepEqual(errors, []);
  // Text must not become markup, including when it closes a script or title.
  const attack =
    '</script><script>window.injection=1</script><img src=x onerror="window.injection=2">';
  await page.locator("input[type=file]").setInputFiles({
    name: "x.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        title: "</title>" + attack,
        description: attack,
        blocks: [
          { id: "__proto__", type: "free", question: attack, solution: attack },
          { id: "txt", type: "text", content: attack },
        ],
      }),
    ),
  });
  await expect(page.getByLabel("Titel der Einheit")).toHaveValue(
    "</title>" + attack,
  );
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "HTML für Lernende exportieren" })
    .click();
  const unsafeFile = join(dir, "safe.html");
  await (await pending).saveAs(unsafeFile);
  await p.goto(
    process.env.TEST_HTML_ORIGIN
      ? process.env.TEST_HTML_ORIGIN + "/safe.html"
      : pathToFileURL(unsafeFile).href,
  );
  await expect(p.locator(".card")).toHaveCount(2);
  assert.equal(await p.evaluate(() => window.injection), undefined);
  assert.equal(await p.locator("img").count(), 0);
  // Blocked storage must leave interactivity available and report the limitation.
  await p.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value() {
        throw Error("blocked");
      },
    });
    Object.defineProperty(Storage.prototype, "getItem", {
      value() {
        throw Error("blocked");
      },
    });
  });
  await p.reload();
  await p.locator("textarea").fill("Weiterarbeiten");
  await expect(p.locator("#storage-status")).toContainText(
    "Speichern nicht möglich",
  );
  console.log(
    `HTML-Export bestanden: ${unit.title}, ${unit.blocks.length} Blöcke; offline (Ursprung: ${process.env.TEST_HTML_ORIGIN || "file://"}), Feedback, lokale Wiederherstellung, Reset, mobile Ansicht, keine externen Requests, Injection-Schutz, Speicherausfall. Datei: ${file}`,
  );
  await learner.close();
} finally {
  await browser.close();
}
