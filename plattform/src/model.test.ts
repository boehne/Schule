import { describe, it, expect } from "vitest";
import { createBlock, isCorrect, parseUnit } from "./model";
import example from "../public/passwoerter.json";
describe("JSON-Format und Auswertung", () => {
  it("importiert und exportiert die vollständige Beispieleinheit verlustfrei", () => {
    const u = parseUnit(JSON.stringify(example));
    expect(parseUnit(JSON.stringify(u))).toEqual(u);
    expect(new Set(u.blocks.map((b) => b.type)).size).toBe(4);
  });
  it("meldet Syntaxfehler verständlich", () =>
    expect(() => parseUnit("{")).toThrow("Ungültiges JSON"));
  it("weist falsche Version, Typen und fehlende Felder zurück", () => {
    for (const input of [
      { ...example, version: 2 },
      { ...example, blocks: [{ id: "x", type: "script" }] },
      { title: 5 },
    ])
      expect(() => parseUnit(JSON.stringify(input))).toThrow("Formatfehler");
  });
  it("prüft richtige Antworten und eindeutige IDs", () => {
    const b = createBlock("single");
    if (b.type !== "single") throw Error();
    expect(() =>
      parseUnit(
        JSON.stringify({
          ...example,
          blocks: [
            { ...b, options: b.options.map((o) => ({ ...o, correct: true })) },
          ],
        }),
      ),
    ).toThrow("Genau eine");
    expect(() =>
      parseUnit(JSON.stringify({ ...example, blocks: [b, b] })),
    ).toThrow("eindeutig");
  });
  it("wertet Mehrfachauswahl nur bei exakter Übereinstimmung korrekt", () => {
    const b = createBlock("multiple");
    if (b.type !== "multiple") throw Error();
    expect(isCorrect(b, [b.options[0].id])).toBe(true);
    expect(isCorrect(b, [])).toBe(false);
    expect(
      isCorrect(
        b,
        b.options.map((o) => o.id),
      ),
    ).toBe(false);
  });
  it("behandelt HTML und JavaScript ausschließlich als Text", () => {
    const content = "<script>alert(1)</script><img src=x onerror=alert(2)>";
    expect(
      parseUnit(
        JSON.stringify({
          ...example,
          blocks: [{ id: "x", type: "text", content }],
        }),
      ).blocks[0],
    ).toMatchObject({ content });
  });
  it("begrenzt die Importgröße", () =>
    expect(() => parseUnit(" ".repeat(1000001))).toThrow("zu groß"));
});
