# Prüfprotokoll

Geprüft am 3. November 2026 mit Node.js 24 und Chromium.

- `npm run build`: TypeScript-Prüfung und Vite-Produktionsbuild erfolgreich.
- `npm test`: sieben Tests erfolgreich (Schema, Export-/Import-Roundtrip, Lösungen, IDs, Größenlimit, Textbehandlung).
- `node tests/browser.mjs`: erfolgreich bei 1440 × 1000 und 390 × 844 Pixeln. Geprüft: Titel bearbeiten und nach Neuladen wiederherstellen, Textblock hinzufügen/verschieben/löschen, Single- und Multiple-Choice-Feedback, Freitextlösung erst auf Wunsch, JSON-Download, verständlicher Syntaxfehler ohne Datenverlust, gültiger Import sowie HTML-/Script-Inhalt als sichtbarer Text ohne erzeugte HTML-Elemente. Kein horizontaler Überlauf und keine JavaScript-Laufzeitfehler.

Browserprüfung reproduzieren: zuerst `npm run dev` in einem separaten Terminal starten, dann `node tests/browser.mjs`. Erwartet Chromium unter `/usr/bin/chromium`; alternativ `CHROMIUM_PATH` auf die lokale Browserdatei setzen. Der Test verwendet einen frischen Browserkontext mit eigenem Speicher und bestätigt Ersetzungs-/Löschdialoge automatisch. Er benötigt keine Benutzerdaten.

Nicht geprüft: Safari, Firefox, reale Mobilgeräte, Screenreader und parallele Bearbeitung in mehreren Tabs.
