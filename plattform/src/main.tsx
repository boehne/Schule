import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Download,
  Upload,
  Eye,
  Pencil,
  GraduationCap,
  Check,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Block, Unit, createBlock, isCorrect, parseUnit } from "./model";
import { createStandaloneHtml } from "./standalone";
import example from "../public/passwoerter.json";
import "./style.css";
const KEY = "lernraum.unit.v1";
const names = {
  text: "Text",
  single: "Single Choice",
  multiple: "Multiple Choice",
  free: "Freitext",
};
function initial(): { unit: Unit; notice: string } {
  try {
    const raw = localStorage.getItem(KEY);
    return {
      unit: raw ? parseUnit(raw) : parseUnit(JSON.stringify(example)),
      notice: "",
    };
  } catch {
    return {
      unit: parseUnit(JSON.stringify(example)),
      notice:
        "Gespeicherte Daten konnten nicht geladen werden. Die Beispieleinheit ist geöffnet; die beschädigte Speicherung wird nicht automatisch überschrieben.",
    };
  }
}
function Field({
  label,
  value,
  onChange,
  large = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  large?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {large ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
export function Student({ unit }: { unit: Unit }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [written, setWritten] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const answered = unit.blocks.filter(
    (b) =>
      b.type !== "text" && (answers[b.id]?.length || written[b.id]?.trim()),
  ).length;
  const total = unit.blocks.filter((b) => b.type !== "text").length;
  return (
    <>
      <div className="learner-meta">
        <span>DEIN LERNPFAD</span>
        <span>
          {answered} von {total} Aufgaben bearbeitet
        </span>
      </div>
      <progress max={total || 1} value={answered} />
      <h1>{unit.title}</h1>
      <p className="description">{unit.description}</p>
      <p className="hint">
        Deine Antworten bleiben nur in dieser geöffneten Ansicht. Bitte keine
        echten Passwörter eingeben.
      </p>
      {unit.blocks.map((b, i) => (
        <article className="card" key={b.id}>
          <div className="eyebrow">
            {String(i + 1).padStart(2, "0")} / {names[b.type]}
          </div>
          {b.type === "text" ? (
            <p className="prose">{b.content}</p>
          ) : (
            <>
              <h2>{b.question}</h2>
              {b.type === "free" ? (
                <>
                  <Field
                    large
                    label="Deine Antwort"
                    value={written[b.id] || ""}
                    onChange={(s) => {
                      setWritten({ ...written, [b.id]: s });
                      if (!s.trim()) setShown({ ...shown, [b.id]: false });
                    }}
                  />
                  <p className="hint">Schreibe zuerst deine eigene Antwort. Danach kannst du die Musterlösung vergleichen.</p>
                  <button
                    disabled={!written[b.id]?.trim()}
                    onClick={() => setShown({ ...shown, [b.id]: !shown[b.id] })}
                  >
                    {shown[b.id]
                      ? "Musterlösung ausblenden"
                      : "Musterlösung anzeigen"}
                  </button>
                  {shown[b.id] && written[b.id]?.trim() && (
                    <div className="feedback prose">{b.solution}</div>
                  )}
                </>
              ) : (
                <>
                  <p className="hint">
                    {b.type === "single"
                      ? "Wähle eine Antwort."
                      : "Wähle alle zutreffenden Antworten. Feedback aktualisiert sich bei jeder Auswahl."}
                  </p>
                  <fieldset>
                    <legend className="sr-only">{b.question}</legend>
                    {b.options.map((o) => (
                      <label
                        className={
                          "answer " +
                          (answers[b.id]?.includes(o.id) ? "selected" : "")
                        }
                        key={o.id}
                      >
                        <input
                          type={b.type === "single" ? "radio" : "checkbox"}
                          name={b.id}
                          checked={answers[b.id]?.includes(o.id) || false}
                          onChange={() => {
                            const old = answers[b.id] || [];
                            setAnswers({
                              ...answers,
                              [b.id]:
                                b.type === "single"
                                  ? [o.id]
                                  : old.includes(o.id)
                                    ? old.filter((id) => id !== o.id)
                                    : [...old, o.id],
                            });
                          }}
                        />
                        {o.text}
                      </label>
                    ))}
                  </fieldset>
                  {answers[b.id]?.length > 0 && (
                    <div
                      role="status"
                      className={
                        "feedback " +
                        (isCorrect(b, answers[b.id]) ? "correct" : "retry")
                      }
                    >
                      <strong>
                        {isCorrect(b, answers[b.id])
                          ? "Richtig!"
                          : "Noch nicht ganz."}
                      </strong>{" "}
                      {b.explanation}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </article>
      ))}
      <button
        onClick={() => {
          setAnswers({});
          setWritten({});
          setShown({});
        }}
      >
        Antworten zurücksetzen
      </button>
    </>
  );
}
function App() {
  const [start] = useState(initial);
  const [unit, setUnit] = useState(start.unit);
  const [mode, setMode] = useState<"edit" | "preview" | "student">("edit");
  const [notice, setNotice] = useState(start.notice);
  const [save, setSave] = useState("");
  const [changed, setChanged] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (start.notice && !changed) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(unit));
      setSave("Auf diesem Gerät gespeichert");
    } catch {
      setSave("Speichern nicht möglich – bitte JSON exportieren.");
    }
  }, [unit, changed, start.notice]);
  function update(next: Unit) {
    setUnit(next);
    setChanged(true);
  }
  function change(b: Block) {
    update({
      ...unit,
      blocks: unit.blocks.map((x) => (x.id === b.id ? b : x)),
    });
  }
  function move(index: number, delta: number) {
    const blocks = [...unit.blocks];
    [blocks[index], blocks[index + delta]] = [
      blocks[index + delta],
      blocks[index],
    ];
    update({ ...unit, blocks });
  }
  function exportUnit() {
    try {
      parseUnit(JSON.stringify(unit));
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(unit, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "unterrichtseinheit.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("JSON-Datei exportiert.");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function exportHtml() {
    try {
      const html = createStandaloneHtml(unit);
      const url = URL.createObjectURL(
        new Blob([html], { type: "text/html;charset=utf-8" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "unterrichtseinheit.html";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(
        "HTML-Datei exportiert. Sie kann direkt im Browser geöffnet und weitergegeben werden.",
      );
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  async function importUnit(f: File) {
    try {
      if (f.size > 1000000)
        throw new Error("Die Datei ist zu groß. Erlaubt sind höchstens 1 MB.");
      const next = parseUnit(await f.text());
      if (
        !confirm(
          "Die aktuelle Einheit durch die importierte Einheit ersetzen? Vorher bei Bedarf exportieren.",
        )
      )
        return;
      update(next);
      setNotice("Einheit erfolgreich importiert.");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  const tasks = unit.blocks.filter((b) => b.type !== "text").length;
  return (
    <>
      <header>
        <a className="brand" href="#">
          <span className="brand-icon">
            <BookOpen size={23} />
          </span>
          Lernraum<span className="beta">PROTOTYP</span>
        </a>
        <span className="header-note">
          Unterricht, der zum Mitmachen einlädt.
        </span>
        <span className="local">
          <span /> Lokal & privat
        </span>
      </header>
      <div className="workspace">
        <aside>
          <div className="sidebar-label">DEIN ARBEITSPLATZ</div>
          <nav aria-label="Arbeitsweise">
            {(
              [
                ["edit", Pencil, "Einheit bearbeiten"],
                ["preview", Eye, "Vorschau"],
                ["student", GraduationCap, "Schüleransicht"],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                className={mode === id ? "active" : ""}
                onClick={() => setMode(id)}
              >
                <Icon size={19} />
                {label}
              </button>
            ))}
          </nav>
          <div className="sidebar-label section-label">EINHEIT AUSTAUSCHEN</div>
          <button className="side-button" onClick={() => file.current?.click()}>
            <Upload size={18} />
            JSON importieren
          </button>
          <button className="side-button" onClick={exportUnit}>
            <Download size={18} />
            JSON exportieren
          </button>
          <button className="side-button" onClick={exportHtml}>
            <Download size={18} /> HTML für Lernende exportieren
          </button>
          <input
            ref={file}
            className="sr-only"
            aria-label="JSON-Datei importieren"
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importUnit(f);
              e.target.value = "";
            }}
          />
          <div className="privacy">
            <ShieldCheck size={24} />
            <strong>Dein Gerät. Deine Inhalte.</strong>
            <p>
              Einheiten werden nur in diesem Browser gespeichert. Mit JSON
              kannst du sie sichern und weitergeben.
            </p>
          </div>
          <button
            className="example"
            onClick={() => {
              if (
                confirm("Beispieleinheit laden und aktuelle Einheit ersetzen?")
              ) {
                update(parseUnit(JSON.stringify(example)));
                setNotice("Beispieleinheit geladen.");
              }
            }}
          >
            Beispieleinheit laden ↗
          </button>
        </aside>
        <main>
          <div className="topline">
            <span>
              UNTERRICHTSEINHEITEN /{" "}
              {mode === "edit"
                ? "EDITOR"
                : mode === "preview"
                  ? "VORSCHAU"
                  : "LERNEN"}
            </span>
            <span className="save">
              <Check size={14} />
              {save}
            </span>
          </div>
          {notice && (
            <div role="alert" className="notice">
              {notice}
              <button
                aria-label="Meldung schließen"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}
          {mode === "edit" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">RAUM FÜR GUTE IDEEN</div>
                  <h1>Deine nächste Lernstunde.</h1>
                  <p>Wissen vermitteln. Fragen stellen. Lernen ermöglichen.</p>
                </div>
                <button className="primary" onClick={() => setMode("preview")}>
                  <Eye size={17} />
                  Vorschau
                </button>
              </div>
              <section className="card unit-info">
                <div className="card-title">
                  <FileText size={20} />
                  <h2>Über diese Einheit</h2>
                  <span>GRUNDLAGEN</span>
                </div>
                <Field
                  label="Titel der Einheit"
                  value={unit.title}
                  onChange={(title) => update({ ...unit, title })}
                />
                <Field
                  large
                  label="Beschreibung"
                  value={unit.description}
                  onChange={(description) => update({ ...unit, description })}
                />
              </section>
              <div className="blocks-heading">
                <h2>
                  Inhalte & Aufgaben <span>{unit.blocks.length}</span>
                </h2>
                <p>{tasks} Aufgaben · Reihenfolge mit den Pfeilen ändern</p>
              </div>
              {unit.blocks.map((b, i) => (
                <section className="card block" key={b.id}>
                  <div className="block-toolbar">
                    <span className="block-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <strong>{names[b.type]}</strong>
                    <div className="tools">
                      <button
                        title="Nach oben"
                        aria-label={`Block ${i + 1} nach oben`}
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp size={17} />
                      </button>
                      <button
                        title="Nach unten"
                        aria-label={`Block ${i + 1} nach unten`}
                        disabled={i === unit.blocks.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown size={17} />
                      </button>
                      <button
                        title="Löschen"
                        aria-label={`Block ${i + 1} löschen`}
                        onClick={() => {
                          if (confirm("Diesen Block löschen?"))
                            update({
                              ...unit,
                              blocks: unit.blocks.filter((x) => x.id !== b.id),
                            });
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                  {b.type === "text" ? (
                    <Field
                      large
                      label="Textinhalt"
                      value={b.content}
                      onChange={(content) => change({ ...b, content })}
                    />
                  ) : (
                    <>
                      <Field
                        large
                        label="Aufgabenstellung"
                        value={b.question}
                        onChange={(question) => change({ ...b, question })}
                      />
                      {b.type === "free" ? (
                        <Field
                          large
                          label="Musterlösung (erst auf Wunsch sichtbar)"
                          value={b.solution}
                          onChange={(solution) => change({ ...b, solution })}
                        />
                      ) : (
                        <>
                          <p className="hint">
                            {b.type === "single"
                              ? "Markiere genau eine richtige Antwort."
                              : "Markiere alle richtigen Antworten (mindestens eine)."}
                          </p>
                          {b.options.map((o, j) => (
                            <div className="option-editor" key={o.id}>
                              <input
                                aria-label={`Antwort ${j + 1} richtig`}
                                type={
                                  b.type === "single" ? "radio" : "checkbox"
                                }
                                name={`correct-${b.id}`}
                                checked={o.correct}
                                onChange={() =>
                                  change({
                                    ...b,
                                    options: b.options.map((x) => ({
                                      ...x,
                                      correct:
                                        b.type === "single"
                                          ? x.id === o.id
                                          : x.id === o.id
                                            ? !x.correct
                                            : x.correct,
                                    })),
                                  })
                                }
                              />
                              <input
                                aria-label={`Antwort ${j + 1}`}
                                value={o.text}
                                onChange={(e) =>
                                  change({
                                    ...b,
                                    options: b.options.map((x) =>
                                      x.id === o.id
                                        ? { ...x, text: e.target.value }
                                        : x,
                                    ),
                                  })
                                }
                              />
                              <button
                                aria-label={`Antwort ${j + 1} entfernen`}
                                disabled={b.options.length <= 2}
                                onClick={() =>
                                  change({
                                    ...b,
                                    options: b.options.filter(
                                      (x) => x.id !== o.id,
                                    ),
                                  })
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            disabled={b.options.length >= 20}
                            onClick={() =>
                              change({
                                ...b,
                                options: [
                                  ...b.options,
                                  {
                                    id: crypto.randomUUID(),
                                    text: "Neue Antwort",
                                    correct: false,
                                  },
                                ],
                              })
                            }
                          >
                            <Plus size={15} />
                            Antwort ergänzen
                          </button>
                          <Field
                            large
                            label="Feedback / Erklärung"
                            value={b.explanation}
                            onChange={(explanation) =>
                              change({ ...b, explanation })
                            }
                          />
                        </>
                      )}
                    </>
                  )}
                </section>
              ))}
              <section className="add-block">
                <div className="eyebrow">BAUSTEIN HINZUFÜGEN</div>
                <h2>Was kommt als Nächstes?</h2>
                <div>
                  {(Object.keys(names) as Block["type"][]).map((type) => (
                    <button
                      disabled={unit.blocks.length >= 100}
                      key={type}
                      onClick={() =>
                        update({
                          ...unit,
                          blocks: [...unit.blocks, createBlock(type)],
                        })
                      }
                    >
                      <Plus size={17} />
                      {names[type]}
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              <div className="view-banner">
                <span>
                  {mode === "preview"
                    ? "Vorschau · So erleben Lernende deine Einheit."
                    : "Schüleransicht · Lernen in deinem Tempo."}
                </span>
                <button onClick={() => setMode("edit")}>
                  Zurück zum Editor
                </button>
              </div>
              <Student key={mode + JSON.stringify(unit)} unit={unit} />
            </>
          )}
          <footer>
            Lernraum · Für die Berufsschule gemacht.
            <span>Ohne Konto. Ohne Cloud.</span>
          </footer>
        </main>
      </div>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
