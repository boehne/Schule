import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
await page.goto("http://localhost:5173");
await page.getByLabel("Titel der Einheit").fill("Meine Testeinheit");
await page.reload();
await page.getByLabel("Titel der Einheit").waitFor();
assert.equal(
  await page.getByLabel("Titel der Einheit").inputValue(),
  "Meine Testeinheit",
);
await page.getByRole("button", { name: "Text", exact: true }).click();
await expect(page.getByLabel("Textinhalt")).toHaveCount(4);
await page
  .getByRole("button", { name: "Block 7 nach oben", exact: true })
  .click();
assert.equal(
  await page.locator(".block").nth(5).getByLabel("Textinhalt").inputValue(),
  "Neuer Informationstext",
);
await page
  .getByRole("button", { name: "Block 6 löschen", exact: true })
  .click();
await expect(page.locator(".block")).toHaveCount(6);
await page
  .getByRole("button", { name: "Vorschau", exact: true })
  .first()
  .click();
await page.getByRole("radio").nth(1).check();
assert.ok((await page.getByRole("status").innerText()).includes("Richtig!"));
await page.getByRole("checkbox").nth(0).check();
assert.ok(
  (await page.getByRole("status").last().innerText()).includes(
    "Noch nicht ganz",
  ),
);
await page.getByRole("checkbox").nth(1).check();
await page.getByRole("checkbox").nth(3).check();
assert.ok(
  (await page.getByRole("status").last().innerText()).includes("Richtig!"),
);
assert.equal(
  await page.getByText("1. Link nicht öffnen", { exact: false }).count(),
  0,
);
await expect(page.getByRole("button", { name: "Musterlösung anzeigen" })).toBeDisabled();
await page.getByLabel("Deine Antwort").fill("Meine eigene Antwort");
await page.getByRole("button", { name: "Musterlösung anzeigen" }).click();
assert.equal(
  await page.getByText("1. Link nicht öffnen", { exact: false }).count(),
  1,
);
await page.getByRole("button", { name: "Zurück zum Editor" }).click();
const download = page.waitForEvent("download");
await page.getByRole("button", { name: "JSON exportieren" }).click();
const dl = await download;
assert.equal(dl.suggestedFilename(), "unterrichtseinheit.json");
await page
  .locator("input[type=file]")
  .setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{"),
  });
await page.getByRole("alert").filter({ hasText: "Ungültiges JSON" }).waitFor();
assert.equal(
  await page.getByLabel("Titel der Einheit").inputValue(),
  "Meine Testeinheit",
);
await page.locator("input[type=file]").setInputFiles("public/passwoerter.json");
await page
  .getByRole("alert")
  .filter({ hasText: "erfolgreich importiert" })
  .waitFor();
assert.equal(
  await page.getByLabel("Titel der Einheit").inputValue(),
  "Sicherer Umgang mit Passwörtern",
);
const content = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
await page
  .locator("input[type=file]")
  .setInputFiles({
    name: "safe.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        title: "Sicherer Text",
        description: "",
        blocks: [{ id: "x", type: "text", content }],
      }),
    ),
  });
await page.getByRole("button", { name: "Schüleransicht", exact: true }).click();
await page.getByText(content, { exact: true }).waitFor();
assert.equal(await page.locator("main img,main script").count(), 0);
await page.getByRole("button", { name: "Einheit bearbeiten" }).click();
await page.getByRole("button", { name: "Beispieleinheit laden" }).click();
await page.setViewportSize({ width: 390, height: 844 });
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.getByRole("button", { name: "Schüleransicht", exact: true }).click();
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.getByRole("radio").nth(1).check();
assert.deepEqual(errors, []);
console.log(
  "Browserprüfung erfolgreich: Editor, Reihenfolge, Löschen, Speicherung, Feedback, Musterlösung, JSON-Austausch, XSS-Text, 1440px/390px.",
);
await browser.close();
