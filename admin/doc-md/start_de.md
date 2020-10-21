<!-- Markdown Collapsible Section, see https://gist.github.com/pierrejoubert73/902cc94d79424356a8d20be2b382e1ab -->
<details>
  <summary style="font-size:1.3em; border:1px solid #ddd; background-color:#E0EBF3; color:black; padding:10px 0 10px 5px">Über diesen Adapter</summary> <!-- Header -->
  <!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<br>

Dieser Adapter parst (filtert) alle Logs von ioBroker-Adaptern und liefert die Ergebnisse als JSON in Datenpunkten für jeden von dir im Reiter "PARSER-REGELN (FILTER)" angelegten Filter. 

Das resultierende JSON kann dann im VIS zur Visualisierung verwendet werden. Datenpunkte zum Leeren (Löschen) alter Logs werden ebenfalls bereitgestellt (wie `logparser.0.filters.Homematic.emptyJson` zum Leeren eines spezifischen Filters oder `logparser.0.emptyAllJson` zum Leeren aller Filter).

</details>
<!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<details>
  <summary style="font-size:1.3em; border:1px solid #ddd; background-color:#E0EBF3; color:black; padding:10px 0 10px 5px">Wie am besten starten?</summary> <!-- Header -->
  <!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<br>

Im Reiter "PARSER-REGELN (FILTER)" konfigurierst du die entsprechenden Filter-Regeln. Dort kannst du durch klicken auf die "Balkenüberschrift" eine entsprechende weiterführende Erklärung aller Optionen öffnen:

![image](https://github.com/Mic-M/ioBroker.logparser/blob/master/admin/doc-md/img/parser-rules-expand-help-animated.gif?raw=true)

Danach siehst du dir die weiteren Einstellungen in den anderen Reitern an, die dort entsprechend erklärt sind.


</details>
<!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<details>
  <summary style="font-size:1.3em; border:1px solid #ddd; background-color:#E0EBF3; color:black; padding:10px 0 10px 5px">Visualisierung (Log-Ausgaben im VIS darstellen)</summary> <!-- Header -->
  <!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<br>

Hier ist ein VIS-Beispielprojekt, welches in VIS importiert werden kann: [vis-project-ex_logparser-adapter.zip](https://github.com/Mic-M/ioBroker.logparser/raw/master/accessories/vis/vis-project-ex_logparser-adapter.zip). Diese zip-Datei einfach herunterladen, und in VIS im Menü `Setup > Projekt-Export/Import > Import` auswählen, um dann entsprechend als Projekt zu importieren. 

Bitte beachte, dass du die [Material Design Widgets](https://github.com/Scrounger/ioBroker.vis-materialdesign) benötigt, denn sonst wird das nicht richtig dargestellt.

![image](https://github.com/Mic-M/ioBroker.logparser/blob/master/admin/doc-md/img/visintro-animated.gif?raw=true)

</details>
<!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<details>
  <summary style="font-size:1.3em; border:1px solid #ddd; background-color:#E0EBF3; color:black; padding:10px 0 10px 5px">Weitere Funktionen</summary> <!-- Header -->
  <!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<br>

## Manipulation der JSON-Spalteninhalte durch Log

Es gibt die Möglichkeit, über JavaScript, Blockly, etc. Logs abzusetzen und dabei zu beeinflussen, welcher Inhalt in die Spalten 'date','severity','from','message' der JSON-Tabellen gesetzt wird.

### Beispiel
Folgender Befehl wird in einem JavaScript ausgeführt:
`log('[Alexa-Log-Script] ##{"message":"' + 'Befehl [Musik an].' + '", "from":"' + 'Alexa Flur' + '"}##');`

Damit wird nun der Teil `##{"message":"' + 'Befehl [Musik an].' + '", "from":"' + 'Alexa Flur' + '"}##` genommen, als Log-Text 'Befehl [Musik an].' (anstatt der Logzeile) angezeigt, und als Quelle wird 'Alexa Flur' (anstatt javascript.0) angezeigt.

### Syntax

In die Logzeile folgendes aufnehmen: `##{"date":"", "severity":"", "from":"", "message":""}##`
Dabei können einzelne Werte entfernt werden, also z.B. nur um den Logtext (message) zu ändern, nimmt man `##{"message":"hier der Text."}##`

### Use Cases
Da der Adapter umfangreiche Filter bietet, von denen beliebig viele angelegt werden können und dann in Datenpunkten verfügbar sind, können mit dieser Funktion einfach per [log()](https://github.com/ioBroker/ioBroker.javascript/blob/master/docs/en/javascript.md#log---gives-out-the-message-into-log) entsprechend Tabellen gefüllt werden.

### Script-Beispiel (für JavaScript-Adapter): Alexa History - alle Sprach-Kommandos im VIS ausgeben

Hier ist ein [Beispiel-Script](https://github.com/Mic-M/ioBroker.logparser/blob/master/accessories/alexa-history.js) für den JavaScript-Adapter. 

**Installation:**
1. [Script-Code](https://raw.githubusercontent.com/Mic-M/ioBroker.logparser/master/accessories/alexa-history.js) öffnen.
2. Alles kopieren (Strg + a)
3. Zur ioBroker-Administration wechseln und dort im linken Menü "Skripte" auswählen.
4. Mit dem "+"-Menüpunkt ein neues Script hinzufügen, dann "Javascript" auswählen, und einen Namen vergeben (z.B. "Alexa-History") und speichern.
5. Dieses neue Script öffnen (ist jetzt natürlich noch leer), den zuvor kopierten Code mit Strg+v einfügen und Speichern.

**Wie funktioniert das Script?**

1. Sobald ein Kommando an ein Alexa-Gerät gesprochen wird, wird der Datenpunkt `alexa2.x.History.json` entprechend gefüllt und enthält das Kommando, das an das Alexa-Gerät gesprochen wurde. Dieses Script wandelt diese Sprachkommandos in ein durch diesen Adapter verstandene Syntax um (siehe oben unter Beispiel).

2. Der Adapter erhält dann z.B. folgendes Log: `javascript.0 (12345) script.js.Alexa: [Alexa-Log-Script] ##{"msg":"Licht An", "source":"Sonos Küche"}##`

3. Dies wandelt der Adapter um in: `Licht An`, und als Quelle wird nicht mehr `javascript.0` angezeigt, sondern `Sonos Küche`.

**Einrichtung**

Sobald das Script läuft, in den Admin-Einstellungen des Adapters einen neuen Filter erstellen:
![image](https://github.com/Mic-M/ioBroker.logparser/blob/master/admin/doc-md/img/alexa-log-filter.png?raw=true)

Dabei darauf achten, dass in der Spalte "Whitelist UND" `[Alexa-Log-Script]` steht. 

**Ergebnis**

Damit werden dann nur die Logs vom Alexa-Script in diesem Filter angezeigt.

![image](https://github.com/Mic-M/ioBroker.logparser/blob/master/admin/doc-md/img/alexa-log-filter.vis.png?raw=true)

Wie zu sehen wird damit also "Quelle" (wäre hier normalerweise `javascript.0`) durch das Alexa-Gerät (hier: `Sonos Küche`) ersetzt. Außerdem wird die Message durch den gesprochenen Befehl (hier: `Licht An`) ersetzt. Genauso können auch noch das Datum (`date`) und das Log-Level (`level`) ersetzt werden.

</details>
<!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

