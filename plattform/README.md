# Lernraum – interaktive Unterrichtseinheiten

Deutschsprachiger Prototyp mit React, TypeScript und Vite. Die bereits vorhandene statische Lernseite im Repository bleibt separat erhalten.

## Start

Voraussetzung: Node.js 22 oder neuer und npm.

```sh
cd plattform
npm ci
npm run dev
```

Die im Terminal angezeigte lokale Adresse öffnen (standardmäßig http://localhost:5173). Für ein Smartphone im selben Netzwerk die Netzwerkadresse des Entwicklungsrechners verwenden. Den Entwicklungsserver nur in vertrauenswürdigen Netzen einsetzen.

```sh
npm test           # Formatprüfung und Auswertung
npm run build     # TypeScript-Prüfung und Produktionsbuild in dist/
```

`dist/` kann über einen statischen Webserver ausgeliefert werden. Kein Backend und keine Umgebungsvariablen erforderlich. Nicht per Doppelklick als file:// öffnen.

## Nutzung

- Beim ersten Start öffnet sich die vollständige Beispieleinheit „Sicherer Umgang mit Passwörtern“ (Lernziele, Wissenstexte, drei Aufgabentypen, Transfer und Abschluss). Sie liegt auch als `public/passwoerter.json` vor.
- Im Editor Titel, Beschreibung und Blöcke ändern. Mit den Pfeilen Blöcke verschieben; diese Bedienung funktioniert auch per Tastatur und auf Touchscreens. Neue Bausteine unten ergänzen; Löschen wird bestätigt.
- Bei Single Choice genau eine richtige Antwort, bei Multiple Choice mindestens eine markieren. Antworten ergänzen oder entfernen (2 bis 20).
- Vorschau und Schüleransicht zeigen interaktive Aufgaben. Auswahlfragen aktualisieren das Feedback unmittelbar. Bei Multiple Choice wird die gesamte aktuelle Auswahl bewertet, auch während des Auswählens. Freitext wird nicht automatisch bewertet; die Musterlösung erscheint nur auf Wunsch.
- Antworten können zurückgesetzt werden. Sie existieren nur in der geöffneten Ansicht und gehen beim Ansichtswechsel oder Neuladen verloren.
- Die aktuelle Einheit wird bei Änderungen automatisch in `localStorage` unter `lernraum.unit.v1` gespeichert. Auch unvollständige Entwürfe werden gespeichert. Ein beim Laden ungültiger Entwurf wird durch das Beispiel in der Oberfläche ersetzt, jedoch erst nach der nächsten bewussten Änderung überschrieben. Speicherausfälle werden angezeigt: dann JSON exportieren.
- JSON exportieren sichert eine gültige Einheit als Datei. JSON importieren prüft zuerst die Datei und ersetzt erst nach Bestätigung die aktuelle Einheit. Fehler lassen die aktuelle Einheit unverändert. Vor einem Austausch eigene Inhalte exportieren.

## Datenformat (Version 1)

JSON-Datei in UTF-8, höchstens 1.000.000 Bytes. Top-Level:

```json
{
  "version": 1,
  "title": "Meine Einheit",
  "description": "Lernziele und Dauer",
  "blocks": [
    {"id":"info","type":"text","content":"Informationstext"},
    {"id":"frage1","type":"single","question":"Was stimmt?","explanation":"A ist richtig.","options":[
      {"id":"a","text":"A","correct":true},
      {"id":"b","text":"B","correct":false}
    ]},
    {"id":"frage2","type":"multiple","question":"Welche Aussagen stimmen?","explanation":"Beide stimmen.","options":[
      {"id":"a","text":"A","correct":true},
      {"id":"b","text":"B","correct":true}
    ]},
    {"id":"frage3","type":"free","question":"Begründe deine Antwort.","solution":"Eine mögliche Begründung."}
  ]
}
```

Titel: 1–200 Zeichen (äußere Leerzeichen werden entfernt). Bis zu 100 Blöcke; eine leere Einheit ist erlaubt. Texte maximal 20.000 Zeichen. Inhalt, Frage, Musterlösung und Antworttexte dürfen nicht leer sein. Beschreibung und Erklärung dürfen leer sein. IDs: 1–100 Zeichen; Block-IDs innerhalb der Einheit und Antwort-IDs innerhalb einer Frage müssen eindeutig sein. `correct` muss ein Boolean sein. Single Choice verlangt genau eine richtige Option; Multiple Choice mindestens eine. Unbekannte zusätzliche Felder werden beim Import entfernt. Keine Markdown-/HTML-Auswertung: Zeilenumbrüche bleiben erhalten, HTML und JavaScript werden als gewöhnlicher Text angezeigt. Die verbindliche Laufzeitprüfung steht in `src/model.ts`.

## Grenzen

Kein Backend, keine Konten, keine zentrale Antwortspeicherung und kein Mehrgeräteabgleich. Es gibt jeweils eine aktuelle Einheit pro Browser und Ursprung. Browserdaten löschen entfernt sie; private Browserfenster und Gerätespeicher sind kein verlässliches Backup. Gleichzeitiges Bearbeiten in mehreren Tabs kann Änderungen überschreiben. JSON-Dateien daher regelmäßig sichern.

Lösungen sind Bestandteil der Einheit und im Browser bzw. Export einsehbar. Dies ist ein Lernwerkzeug, kein manipulationssicheres Prüfungssystem. Keine echten Passwörter oder personenbezogenen Schülerdaten eingeben. Freitextantworten werden nur zur Selbstkontrolle verwendet. Keine Medien, HTML, Links, Drag-and-drop, zentrale Veröffentlichung oder automatische Benotung. Die Entwicklungswerkzeuge benötigen beim Installieren Internet; die gebaute Oberfläche lädt keine externen Schriften oder Skripte.

## Prüfung

`npm test` prüft Beispiel-Roundtrip, Schemafehler, eindeutige IDs, Lösungskonfiguration, exakte Multiple-Choice-Auswertung, Textbehandlung und Größenlimit. Zusätzlich wurden die zentralen Bedienabläufe mit Chromium geprüft; siehe `TESTS.md`.
