import { z } from "zod";
const text = z.string().max(20000);
const id = z.string().min(1).max(100);
const option = z.object({ id, text: text.min(1), correct: z.boolean() });
const choice = {
  id,
  question: text.min(1),
  explanation: text,
  options: z.array(option).min(2).max(20),
};
export const unitSchema = z
  .object({
    version: z.literal(1),
    title: z.string().trim().min(1).max(200),
    description: text,
    blocks: z
      .array(
        z.discriminatedUnion("type", [
          z.object({ id, type: z.literal("text"), content: text.min(1) }),
          z.object({ ...choice, type: z.literal("single") }),
          z.object({ ...choice, type: z.literal("multiple") }),
          z.object({
            id,
            type: z.literal("free"),
            question: text.min(1),
            solution: text.min(1),
          }),
        ]),
      )
      .max(100),
  })
  .superRefine((unit, ctx) => {
    if (new Set(unit.blocks.map((b) => b.id)).size !== unit.blocks.length)
      ctx.addIssue({
        code: "custom",
        path: ["blocks"],
        message: "Block-IDs müssen eindeutig sein.",
      });
    unit.blocks.forEach((b, i) => {
      if (b.type === "single" || b.type === "multiple") {
        const count = b.options.filter((o) => o.correct).length;
        if (
          (b.type === "single" && count !== 1) ||
          (b.type === "multiple" && count < 1)
        )
          ctx.addIssue({
            code: "custom",
            path: ["blocks", i, "options"],
            message:
              b.type === "single"
                ? "Genau eine richtige Antwort markieren."
                : "Mindestens eine richtige Antwort markieren.",
          });
        if (new Set(b.options.map((o) => o.id)).size !== b.options.length)
          ctx.addIssue({
            code: "custom",
            path: ["blocks", i, "options"],
            message: "Antwort-IDs müssen eindeutig sein.",
          });
      }
    });
  });
export type Unit = z.infer<typeof unitSchema>;
export type Block = Unit["blocks"][number];
export const uid = () => crypto.randomUUID();
export function parseUnit(raw: string): Unit {
  if (new TextEncoder().encode(raw).length > 1000000)
    throw new Error("Die Datei ist zu groß. Erlaubt sind höchstens 1 MB.");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      "Ungültiges JSON. Bitte Anführungszeichen, Kommas und Klammern prüfen.",
    );
  }
  const result = unitSchema.safeParse(data);
  if (!result.success)
    throw new Error(
      "Formatfehler: " +
        result.error.issues
          .slice(0, 5)
          .map(
            (e) =>
              `${e.path.join(".") || "Einheit"}: ${e.code === "custom" ? e.message : "Feld fehlt oder hat einen ungültigen Wert. Bitte Datenformat im README prüfen."}`,
          )
          .join(" · "),
    );
  return result.data;
}
export function isCorrect(
  block: Extract<Block, { type: "single" | "multiple" }>,
  selected: string[],
) {
  const expected = block.options.filter((o) => o.correct).map((o) => o.id);
  return (
    expected.length === selected.length &&
    expected.every((id) => selected.includes(id))
  );
}
export function createBlock(type: Block["type"]): Block {
  const id = uid();
  if (type === "text") return { id, type, content: "Neuer Informationstext" };
  if (type === "free")
    return {
      id,
      type,
      question: "Neue Freitextfrage",
      solution: "Musterlösung ergänzen",
    };
  return {
    id,
    type,
    question: "Neue Auswahlfrage",
    explanation: "Erklärung ergänzen",
    options: [
      { id: uid(), text: "Antwort 1", correct: true },
      { id: uid(), text: "Antwort 2", correct: false },
    ],
  };
}
