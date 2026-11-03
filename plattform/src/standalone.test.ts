import { describe, expect, it } from "vitest";
import { createStandaloneHtml } from "./standalone";
import example from "../public/passwoerter.json";
import { parseUnit } from "./model";
describe("Eigenständiger HTML-Export", () => {
  it("bettet alle Inhalte und lokale Logik ohne externe Ressourcen ein", () => {
    const unit = parseUnit(JSON.stringify(example));
    const html = createStandaloneHtml(unit);
    expect(html).toContain('id="unit-data"');
    expect(html).toContain("localStorage");
    expect(html).toContain("Antworten und Fortschritt zurücksetzen");
    expect(html).not.toMatch(/<script[^>]+src=|<link|@import/);
    const raw = html.match(
      /<script id="unit-data" type="application\/json">(.*?)<\/script>/s,
    )![1];
    expect(JSON.parse(raw)).toEqual(unit);
  });
  it("verhindert Script- und Titel-Ausbruch durch importierte Texte", () => {
    const unit = parseUnit(JSON.stringify(example));
    const attack = "</script><script>alert(1)</script>";
    unit.title = "</title>" + attack;
    unit.description = attack;
    const html = createStandaloneHtml(unit);
    expect(html).not.toContain(attack);
    expect(html).toContain("\\u003c/script>");
    expect(html).toContain("&lt;/title&gt;");
  });
  it("weist ungültige Entwürfe vor dem Export zurück", () => {
    const unit = parseUnit(JSON.stringify(example));
    unit.title = "";
    expect(() => createStandaloneHtml(unit)).toThrow("Formatfehler");
  });
});
