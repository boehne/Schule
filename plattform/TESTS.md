# Prüfprotokoll

Geprüft am 3. November 2026 mit Node.js 24 und Chromium.

- `npm run build`: TypeScript-Prüfung und Vite-Produktionsbuild erfolgreich.
- `npm test`: sieben Tests erfolgreich (Schema, Export-/Import-Roundtrip, Lösungen, IDs, Größenlimit, Textbehandlung).
- `node tests/browser.mjs`: erfolgreich bei 1440 × 1000 und 390 × 844 Pixeln. Geprüft: Titel bearbeiten und nach Neuladen wiederherstellen, Textblock hinzufügen/verschieben/löschen, Single- und Multiple-Choice-Feedback, Freitextlösung erst auf Wunsch, JSON-Download, verständlicher Syntaxfehler ohne Datenverlust, gültiger Import sowie HTML-/Script-Inhalt als sichtbarer Text ohne erzeugte HTML-Elemente. Kein horizontaler Überlauf und keine JavaScript-Laufzeitfehler.

Browserprüfung reproduzieren: zuerst `npm run dev` in einem separaten Terminal starten, dann `node tests/browser.mjs`. Erwartet Chromium unter `/usr/bin/chromium`; alternativ `CHROMIUM_PATH` auf die lokale Browserdatei setzen. Der Test verwendet einen frischen Browserkontext mit eigenem Speicher und bestätigt Ersetzungs-/Löschdialoge automatisch. Er benötigt keine Benutzerdaten.

Nicht geprüft: Safari, Firefox, reale Mobilgeräte, Screenreader und parallele Bearbeitung in mehreren Tabs.

## HTML-Bereitstellung (3. November 2026)

Produktionsbuild und 10 automatisierte Tests erfolgreich. Zusätzlich `tests/standalone.mjs` gegen den Produktionsbuild mit der hochgeladenen Einheit **„Rechte und Pflichten von Lehrlingen – Pflegeassistenz“** geprüft: 21 Blöcke, darunter 4 Single-Choice-, 3 Multiple-Choice- und 7 Freitextaufgaben. Import über die Oberfläche und HTML-Download erfolgreich. Geprüft: keine Editorfunktionen in der exportierten Ansicht, Auswahlfeedback, Freitextlösung erst auf Wunsch, Wiederherstellung von Antworten und Fortschritt nach Reload, bestätigtes Zurücksetzen einschließlich Reload, 390px ohne Überlauf, keine externen Ressourcenanfragen oder Laufzeitfehler. Zusätzliche manipulierte Inhalte mit schließenden Script-/Titel-Tags werden als Text behandelt; bei gesperrtem Speicher bleiben Aufgaben nutzbar und eine Meldung erscheint.

Die Cloud-Browserrichtlinie sperrt `file://` mit `ERR_BLOCKED_BY_ADMINISTRATOR`. Deshalb ist direktes Öffnen per Doppelklick hier **nicht verifiziert**. Der identische HTML-Export wurde im Offline-Browser über einen abgefangenen lokalen HTTP-Ursprung ausgeliefert (keine Server-/Netzwerkabhängigkeit für den Inhalt). Dauerhafte `file://`-Speicherung bleibt wie dokumentiert browserabhängig.

Reproduktion: Produktionsbuild mit `npm run build`, dann `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5174` starten. In einem zweiten Terminal `node tests/standalone.mjs /pfad/zur/einheit.json` ausführen. Optional zweites Argument: Zielpfad der exportierten HTML-Datei. In Umgebungen mit file://-Sperre zusätzlich `TEST_HTML_ORIGIN=http://localhost:5175` setzen; der Test beantwortet ausschließlich die Dokumentanfrage selbst mit der lokalen Exportdatei. Auf Windows Umgebungsvariablen entsprechend über `set` setzen. Die hochgeladene Unterrichtseinheit wird nicht als Testfixture im Repository veröffentlicht.

Freitext-Freigabe ergänzt: Browsertest prüft gesperrte Musterlösung bei leerer Antwort und Leerzeichen, Freigabe nach eigener Antwort sowie erneutes Ausblenden/Sperren nach Löschen im HTML-Export. Der Plattform-Browsertest prüft ebenfalls die Freigabe erst nach eigener Antwort.
