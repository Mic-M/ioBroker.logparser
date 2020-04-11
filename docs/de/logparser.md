## Logparser Adapter für das Parsen (Filtern) von ioBroker Logs

Mit diesem Adapter können die ioBroker-Logs aller Adapter entsprechend geparsed, also gefiltert werden. 

# Installation
Der Adapter ist noch nicht im "latest Repository". Daher bitte über [5.) Adapter aus eigener URL installieren](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/de/admin/adapter.md) installieren.
Danach eine [Instanz hinzufügen](https://www.iobroker.net/docu/index-23.htm?page_id=8511&lang=de#Erzeugung_einer_Instanzeines_Adapters).



# Konfiguration

## Registerkarte "Allgemein"

**PID entfernen**: Der js-Controller Version 2.0 oder größer fügt Logs teils vorne die PID in Klammern hinzu, also z.B. `(12234) Terminated: Without reason`. Mit dieser Option lassen sich die PIDs inkl. Klammern, wie z.B. `(1234)`, aus den Logzeilen entfernen.

**Anzahl verwendeter JSON-Tabellen in VIS**: 
Hiermit werden zusätzliche Datenpunkte für die Ausgabe als JSON-Tabelle in VIS erzeugt. Damit ist es möglich, in einer VIS-Tabelle zwischen den einzelnen Filtern umzuschalten (z.B. 'Homematic', 'Warnungen', 'Fehler' usw.), die dann dynamisch jeweils in nur einer Tabelle ausgegeben werden.

Hier die Anzahl der unterschiedlichen JSON-Tabellen angeben, in denen du das brauchst. Diese werden angelegt unter 'visualization.table1', 'visualization.table2', usw. Zum deaktivieren: 0 eintragen (dann werden diese zusätzlichen Datenpunkte nicht erstellt)

## Registerkarte "Parser Regeln (Filter)"

### Tabelle für die Filter-Regeln

Pro gesetztem Filter (Regel) werden jeweils Datenpunkte unterhalb von `logparser.[instanz].filters` angelegt.

| **Spalte**            | **Erklärung** |
|-----------------------|-----------------------------------------------------------------------|
| Aktiv                 | Filter aktivieren/deaktivieren |
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


### Weitere Optionen:

* **Datum durch "Heute" / "Gestern" ersetzen**: In den Filtern kann beim Datumsformat für mittels Hash-Zeichen (#) das heutige bzw. gestrige Datum durch 'Heute' bzw. 'Gestern' ersetzt werden. Hier können andere Begriffe statt "Heute"/"Gestern" definiert werden.
* **Text für "Merge" (Logs zusammenfassen)** Dieser Text wird jeder Logzeile vorangestellt, wenn *Merge* aktiviert ist. Das `#`-Zeichen wird dabei dann durch die Anzahl der Logs mit dem gleichen Inhalt ersetzt. Sonderzeichen wie `[](){}/\` etc. sind erlaubt. Beispiele (ohne Anführungszeichen): "`[# Einträge] `", "`(#) `", "`# Einträge: `"


## Registerkarte "Globale Blacklist"

Falls einer dieser Satzteile/Begriffe in einer Logzeile enthalten ist, dann wird der Log-Eintrag von diesem Adapter ignoriert, auch unabhängig davon, was in den Parser-Regeln (Filter) eingestellt ist. Es ist sowohl String als auch Regex erlaubt. Falls String: es wird auf teilweise Übereinstimmung geprüft, d.h. wenn du z.B. „echo“ einträgst, dann wird jede Logzeile, die „echo“ enthält, ausgefiltert, also auch z.B. „Command sent to echo in kitchen.“

Regex bitte zwischen `/` und `/` setzen, damit erkennt der Adapter, ob es sich um eine Regexp handelt.

In der Spalte "Kommentar" kannst du beliebig den jeweiligen Eintrag kommentieren/erklären, etwa damit du später nachvollziehen kannst, warum du diesen Blacklist-Eintrag gesetzt hast.

## Registerkarte "Erweiterte Einstellungen"

* **Update-Intervall: Datenpunkte aktualisieren**: Neu reinkommende Logeinträge werden gesammelt und regelmäßig in die Datenpunkte geschrieben. Hiermit kann das Intervall definiert werden.<br>*Hinweis*: Die Datenpunkte werden nur geschrieben, falls es eine Änderung gab. Dennoch ist es aus Performance-Sicht nicht sinnvoll, hier ein zu kurzes Intervall einzustellen. Kleiner als 2 Sekunden ist nicht erlaubt.
* **Maximale Anzahl Logeinträge**: Die maximale Anzahl an Logeinträgen, die in den Datenpunkten behalten werden (ältere werden entfernt). Bitte keine zu hohe Anzahl, je größer, desto mehr Auslastung für den Adapter und damit deinen ioBroker-Server. Eine Zahl von 100 hat sich gut bewährt.
* **Spalten-Reihenfolge für JSON-Tabelle**: Hier kann die Reihenfolge der einzelnen Spalten verändert werden. Als zusätzliche Spalte wird immer ts (timestamp) hinzugefügt. In VIS usw. bei Bedarf einfach ausblenden.<br>Falls du weniger als 4 Spalten brauchst: Wähle einfach einen Eintrag der ersten Spalten aus, die du brauchst, und blende den Rest dann mit dem VIS JSON-Table-Widget (o.ä.) aus.
* **Sortierung**: Wenn aktiviert: sortiert die Logeinträge absteigend, also neuester oben. Wenn deaktiviert: Sortiert die Logeinträge aufsteigend, also ältester oben. Empfohlen ist absteigende Sortierung, also diese Option aktivieren.

# Visualisierung (Log-Ausgaben im VIS darstellen)

Hier ist ein VIS-Beispielprojekt, welches in VIS importiert werden kann: [vis-project-ex_logparser-adapter.zip](https://github.com/Mic-M/ioBroker.logparser/blob/master/accessories/vis/vis-project-ex_logparser-adapter.zip). Diese zip-Datei einfach herunterladen, und in VIS im Menü `Setup > Projekt-Export/Import > Import` auswählen, um dann entsprechend als Projekt zu importieren. Bitte beachte, dass du die [Material Design Widgets](https://github.com/Scrounger/ioBroker.vis-materialdesign) benötigt, denn sonst wird das nicht richtig dargestellt.

![main.jpg](img/visintro.gif)


# Weitere Funktionen

## Manipulation der JSON-Spalteninhalte durch Log

Es gibt die Möglichkeit, über JavaScript, Blockly, etc. Logs abzusetzen und dabei zu beeinflussen, welcher Inhalt in die Spalten 'date','severity','from','message' der JSON-Tabellen gesetzt wird.

**Beispiel:**
Folgender Befehl wird in einem JavaScript ausgeführt:
`log('[Alexa-Log-Script] ##{"message":"' + 'Befehl [Musik an].' + '", "from":"' + 'Alexa Flur' + '"}##');`

Damit wird nun der Teil `##{"message":"' + 'Befehl [Musik an].' + '", "from":"' + 'Alexa Flur' + '"}##` genommen, als Log-Text 'Befehl [Musik an].' (anstatt der Logzeile) angezeigt, und als Quelle wird 'Alexa Flur' (anstatt javascript.0) angezeigt.

**Syntax:**
In die Logzeile folgendes aufnehmen: `##{"date":"", "severity":"", "from":"", "message":""}##`
Dabei können einzelne Werte entfernt werden, also z.B. nur um den Logtext (message) zu ändern, nimmt man `##{"message":"hier der Text."}##`

**Use Cases:**
Da der Adapter umfangreiche Filter bietet, von denen beliebig viele angelegt werden können und dann in Datenpunkten verfügbar sind, können mit dieser Funktion einfach per [log()](https://github.com/ioBroker/ioBroker.javascript/blob/master/docs/en/javascript.md#log---gives-out-the-message-into-log) entsprechend Tabellen gefüllt werden.