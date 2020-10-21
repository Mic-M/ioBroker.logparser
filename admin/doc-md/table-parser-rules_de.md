Für jeden gesetzten Filter Filter (Regel) werden jeweils Datenpunkte unterhalb von `logparser.[instanz].filters` angelegt.

| **Spalte**            | **Erklärung** |
|-----------------------|-----------------------------------------------------------------------|
| ![image](https://github.com/Mic-M/ioBroker.logparser/blob/master/admin/doc-md/img/check_box-24px.svg?raw=true) | Filter aktivieren/deaktivieren |
| Name                  | Beliebiger Name (Leerzeichen und Sonderzeichen werden automatisch entfernt), wird als Datenpunkt unter 'filters' verwendet |
| Whitelist: UND        | All diese Ausdrücke müssen vorkommen. Um diese Regel zu überspringen, einfach `*` eintragen oder leer lassen. |
| Whitelist: ODER       | Mindestens einer dieser Ausdrücke muss vorkommen. Um diese Regel zu überspringen, einfach `*` eintragen oder leer lassen. |
| Blacklist             | Sobald einer dieser Ausdrücke vorhanden ist, wird das Log nicht übernommen, egal was sonst für Filter definiert sind. |
| Debug/Info/Warn/Error | Welche Log-Level sollen berücksichtigt werden? |
| Bereinigen            | Ungewünschte Zeichenfolgen aus Logzeile entfernen. |
| Max                   | Maximale Anzahl Zeichen der Logzeile, alles was länger ist, wird abgeschnitten. Leer lassen, falls nicht gebraucht. |
| Merge                 | Hiermit werden Logeinträge mit gleichem Inhalt zusammengefasst und ein Zähler vorangestellt.<br>Ohne Merge:<br>`2019-08-17 20:00:00 - Wetterdaten abrufen.`<br>`2019-08-17 20:15:00 - Wetterdaten abrufen.`<br>`2019-08-17 20:30:00 - Wetterdaten abrufen.`<br>Mit Merge:<br>`2019-08-17 20:30:00 - [3 Einträge] Wetterdaten abrufen.`<br>D.h. es wird dann daraus nur noch eine Logzeile mit letztem Datum/Uhrzeit und hinzügefügtem "[3 Einträge]". |
| Datumsformat          | `YYYY` = Jahr 4-stellig, `YY` = Jahr 2-stellig, `MM` = Monat, `DD` = Tag, `hh` = Stunde, `mm` = Minute, `ss` = Sekunde. Teile innerhalb `#`-Zeichen werden durch "Heute" bzw. "Gestern" ersetzt.<br>Beispiele:<br>Aus `#DD.MM.# hh:mm` wird 'Heute 20:35', falls der Log von heute ist.<br>Aus `#DD.MM.YYYY# hh:mm` wird 'Gestern 20:35',  falls der Log von gestern ist.<br>Aus `#DD.MM.YYYY# hh:mm` wird '18.02.2020 20:35', falls der Log nicht von heute oder gestern ist. |

#### String / Regex
Bei den Spalten *Whitelist: UND*, *Whitelist: ODER*, *Blacklist* und *Bereinigen* ist sowohl normaler Text (String) als auch Regex erlaubt. Mehrere Ausdrücke mit Komma trennen. Regex bitte zwischen `/` und `/` setzen, damit erkennt der Adapter, ob es sich um eine Regexp handelt. Falls String: es wird stets auf teilweise Übereinstimmung geprüft. Zum ignorieren/deaktivieren: leer lassen.

Beispiele für Einträge unter "Bereinigen":

| **Eintrag**           | **Erklärung** |
|-----------------------|-----------------------------------------------------------------------|
| `/script\.js\.[^:]*: /, +++, !!!!` | Entfernen der Zeichenfolgen "script.js.xxxx:" (per Regex), sowie aller Vorkommnisse von "+++" und "!!!!" |
| `+++, !!!!` | Entfernen aller Vorkommnisse von "+++" und "!!!!" |
