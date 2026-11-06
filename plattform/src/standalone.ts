import { parseUnit, type Unit } from "./model";
import css from "./standalone.css?raw";

// This function is embedded after TypeScript compilation. Keep it dependency-free.
function learnerRuntime(unit: Unit) {
  const root = document.getElementById("lesson")!;
  const key = "lernraum.learn.v1:" + JSON.stringify(unit);
  let answers: Record<string, string[] | string> = Object.create(null);
  const controls: Array<() => void> = [];
  const status = document.getElementById("storage-status")!;
  const progress = document.getElementById("progress") as HTMLProgressElement;
  const progressText = document.getElementById("progress-text")!;
  const tasks = unit.blocks.filter((b) => b.type !== "text");
  function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    return el;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved: unknown = JSON.parse(raw);
      if (!saved || typeof saved !== "object" || Array.isArray(saved))
        throw Error();
      for (const b of tasks) {
        const value = (saved as Record<string, unknown>)[b.id];
        if (b.type === "free" && typeof value === "string")
          answers[b.id] = value;
        if (
          (b.type === "single" || b.type === "multiple") &&
          Array.isArray(value)
        ) {
          const ids = [
            ...new Set(
              value.filter(
                (v): v is string =>
                  typeof v === "string" && b.options.some((o) => o.id === v),
              ),
            ),
          ];
          answers[b.id] = b.type === "single" ? ids.slice(0, 1) : ids;
        }
      }
    }
    status.textContent =
      "Antworten und Fortschritt werden nur in diesem Browser auf diesem Gerät gespeichert.";
  } catch {
    status.textContent =
      "Lokaler Speicher nicht verfügbar oder gespeicherter Lernstand beschädigt. Du kannst weiterarbeiten; die Speicherung ist nicht gesichert.";
  }
  function updateProgress() {
    const count = tasks.filter((b) => {
      const value = answers[b.id];
      return typeof value === "string"
        ? value.trim().length > 0
        : Array.isArray(value) && value.length > 0;
    }).length;
    progress.max = tasks.length || 1;
    progress.value = count;
    progressText.textContent = `${count} von ${tasks.length} Aufgaben bearbeitet`;
  }
  function save() {
    updateProgress();
    try {
      localStorage.setItem(key, JSON.stringify(answers));
      status.textContent =
        "Lernstand auf diesem Gerät gespeichert. Keine Übermittlung an Lehrpersonen.";
    } catch {
      status.textContent =
        "Speichern nicht möglich. Antworten bleiben nur bis zum Schließen oder Neuladen erhalten.";
    }
  }
  for (const [index, b] of unit.blocks.entries()) {
    const article = node("article");
    article.className = "card";
    const typeNames = {
      text: "Text",
      single: "Single Choice",
      multiple: "Multiple Choice",
      free: "Freitext",
    };
    const meta = node("p", `${index + 1} / ${typeNames[b.type]}`);
    meta.className = "meta";
    article.append(meta);
    if (b.type === "text") {
      const p = node("p", b.content);
      p.className = "prose";
      article.append(p);
    } else if (b.type === "free") {
      const label = node("label", b.question);
      const area = node("textarea");
      area.rows = 5;
      area.value =
        typeof answers[b.id] === "string" ? (answers[b.id] as string) : "";
      area.addEventListener("input", () => {
        answers[b.id] = area.value;
        toggle.disabled = !area.value.trim();
        if (toggle.disabled) {
          solution.hidden = true;
          toggle.textContent = "Musterlösung anzeigen";
          toggle.setAttribute("aria-expanded", "false");
        }
        save();
      });
      label.append(area);
      const toggle = node("button", "Musterlösung anzeigen");
      toggle.disabled = !area.value.trim();
      const hint = node("p", "Schreibe zuerst deine eigene Antwort. Danach kannst du die Musterlösung vergleichen.");
      hint.className = "hint";
      const solution = node("div", b.solution);
      solution.className = "feedback prose";
      solution.hidden = true;
      solution.id = `solution-${index}`;
      toggle.setAttribute("aria-controls", solution.id);
      toggle.setAttribute("aria-expanded", "false");
      toggle.addEventListener("click", () => {
        if (!area.value.trim()) return;
        solution.hidden = !solution.hidden;
        toggle.textContent = solution.hidden
          ? "Musterlösung anzeigen"
          : "Musterlösung ausblenden";
        toggle.setAttribute("aria-expanded", String(!solution.hidden));
      });
      controls.push(() => {
        area.value = "";
        toggle.disabled = true;
        solution.hidden = true;
        toggle.textContent = "Musterlösung anzeigen";
        toggle.setAttribute("aria-expanded", "false");
      });
      article.append(label, hint, toggle, solution);
    } else {
      const fieldset = node("fieldset");
      fieldset.append(
        node("legend", b.question),
        node(
          "p",
          b.type === "single"
            ? "Wähle eine Antwort."
            : "Wähle alle zutreffenden Antworten. Das Feedback bewertet deine aktuelle Auswahl.",
        ),
      );
      const feedback = node("div");
      feedback.className = "feedback";
      feedback.setAttribute("role", "status");
      const inputs: HTMLInputElement[] = [];
      const choice = b;
      function refresh() {
        const selected = Array.isArray(answers[choice.id])
          ? (answers[choice.id] as string[])
          : [];
        const correct = choice.options
          .filter((o) => o.correct)
          .map((o) => o.id);
        const ok =
          selected.length === correct.length &&
          correct.every((id) => selected.includes(id));
        feedback.hidden = selected.length === 0;
        feedback.textContent = `${ok ? "Richtig!" : "Noch nicht ganz."} ${choice.explanation}`;
        feedback.className = `feedback ${ok ? "correct" : "retry"}`;
        inputs.forEach((input, i) => {
          input.checked = selected.includes(choice.options[i].id);
        });
      }
      b.options.forEach((o) => {
        const label = node("label");
        label.className = "answer";
        const input = node("input");
        input.type = b.type === "single" ? "radio" : "checkbox";
        input.name = `question-${index}`;
        inputs.push(input);
        input.addEventListener("change", () => {
          answers[b.id] =
            b.type === "single"
              ? [o.id]
              : b.options
                  .filter((_, i) => inputs[i].checked)
                  .map((option) => option.id);
          refresh();
          save();
        });
        label.append(input, node("span", o.text));
        fieldset.append(label);
      });
      refresh();
      controls.push(refresh);
      article.append(fieldset, feedback);
    }
    root.append(article);
  }
  document.getElementById("reset")!.addEventListener("click", () => {
    if (
      !confirm(
        "Alle Antworten und den Fortschritt dieser Einheit auf diesem Gerät zurücksetzen?",
      )
    )
      return;
    answers = Object.create(null);
    controls.forEach((reset) => reset());
    updateProgress();
    try {
      localStorage.removeItem(key);
      status.textContent = "Antworten und Fortschritt wurden zurückgesetzt.";
    } catch {
      status.textContent =
        "Ansicht zurückgesetzt. Der gespeicherte Lernstand konnte nicht entfernt werden. Bitte Browserdaten löschen.";
    }
  });
  updateProgress();
}

export function createStandaloneHtml(input: Unit): string {
  const unit = parseUnit(JSON.stringify(input));
  // Escaping '<' prevents closing the data script, including malicious </script>.
  const data = JSON.stringify(unit)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>${escape(unit.title)} · Lernraum</title><style>${css}</style></head>
<body><header>Lernraum <span>Deine Unterrichtseinheit</span></header><main><h1>${escape(unit.title)}</h1><p class="prose description">${escape(unit.description)}</p><p id="storage-status" role="status"></p><p id="progress-text"></p><progress id="progress" aria-label="Bearbeitungsfortschritt"></progress><div id="lesson"></div><button id="reset">Antworten und Fortschritt zurücksetzen</button><p class="hint">Der Fortschritt zählt bearbeitete Aufgaben, nicht richtige Lösungen. Keine sensiblen oder personenbezogenen Daten eingeben. Musterlösungen dienen der Selbstkontrolle.</p><noscript>Bitte JavaScript aktivieren, damit Inhalte und Aufgaben angezeigt werden.</noscript></main><script id="unit-data" type="application/json">${data}</script><script>(${learnerRuntime.toString()})(JSON.parse(document.getElementById('unit-data').textContent));</script></body></html>`;
}
