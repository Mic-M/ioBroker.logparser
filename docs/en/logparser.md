## Log parser adapter for parsing (filtering) of ioBroker logs

With this adapter the ioBroker logs of all adapters can be parsed, i.e. filtered, accordingly.

# Installation
The adapter is not yet in the "latest repository". So please [Install adapter from own URL](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/admin/adapter.md). Then add an adapter instance.


# Configuration

## Tab "General"

**Remove PID**: JS controller version 2.0 or greater adds the PID in brackets to the front of logs, e.g. `(12234) Terminated: Without reason`. If activated, the PIDs including brackets, like (1234), are removed from the log lines.

**Number of JSON tables used in VIS**: 
This option adds additional states for better Visualization in VIS. You will then be able to select certain filters, which are then shown accordingly in the JSON table (e.g. 'Homematic', 'Warnings', 'Errors' etc.).

Specify the number of different JSON tables you need. The states of these are being created under 'visualization.table0', 'visualization.table1', etc. Enter 0 to deactivate.


## Tab "Parser Rules (Filter)"

### Table for the filter rules

For each set filter (rule), states are created under `logparser.[instance].filters`.


| **Column**            | **Description** |
|-----------------------|-----------------------------------------------------------------------|
| Active                | Activate/deactivate filters |
| Name                  | Any name (spaces and special characters are automatically removed), used as state under 'filters' |
| Whitelist: AND        | All these expressions must be present. If you enter wildcard `*`, or leave it empty, this rule is being skipped. |
| Whitelist: OR       | At least one of these expressions must occur. If you enter wildcard `*`, or leave it empty, this rule is being skipped. |
| Blacklist             |  As soon as one of these expressions is present, the log is not taken over, no matter what other filters are defined. |
| Debug/Info/Warn/Error | Which log levels should be considered? |
| Clean            | Remove unwanted strings from log line. |
| Max                   | Maximum number of characters of the log line, everything longer than this will be truncated. Leave empty if not used. |
| Merge                 | This merges log entries with the same content and precedes them with a counter.<br>Without Merge:<br>`2019-08-17 20:00:00 - Retrieve weather data.`<br>`2019-08-17 20:15:00 - Retrieve weather data.`<br>`2019-08-17 20:30:00 - Retrieve weather data.`<br>Merge activated:<br>`2019-08-17 20:30:00 - [3 Entries] Retrieve weather data.` |
| Date format          | `YYYY` = year 4-digit, `YY` = year 2-digit, `MM` = month, `DD` = day, `hh` = hour, `mm` = minute, `ss` = second. Parts within `#` characters are replaced by "Today" or "Yesterday". |

#### String / Regex
In the columns *Whitelist AND*, *Whitelist OR*, *Blacklist*, and *Clean*, both normal text (string) and regex are allowed. Separate multiple expressions with commas. Please place regex between `/` and `/`, so that the adapter recognizes if it is a regexp. If String: it is always checked for partial matches. To ignore/disable: leave empty.


### Further Options:

* **Replace date with "today" / "yesterday"**: In the filters, you can replace today's or yesterday's date with 'Today' or 'Yesterday' in the date format column by using hash characters (#). In these fields, other terms instead of "Today"/"Yesterday" can be defined.
* **Text for "Merge"** This text is placed in front of each log line if Merge is activated. The # character is then replaced by the number of logs with the same content. Special characters like `[](){}/\` etc. are allowed. Examples (without quotation marks): "`[# entries] `", "`(#) `", "`# entries: `"


## Tab "Global Blacklist"

If one of these phrases/terms is contained in a log line, then the log entry is ignored by this adapter, regardless of what is set in the parser rules (filter). Both string and regex are allowed. If string: it is checked for partial match, i.e. if you enter e.g. "echo", then every log line containing "echo" will be filtered out, also e.g. "Command sent to echo in kitchen".
Please place regex between `/` and `/`, so that the adapter recognizes if it is a regexp.

In the column "Comment" you can comment/explain the respective entry as you like, for example so that you can later understand why you have set this blacklist entry.

## Tab "Advanced Settings"

* **Interval for updating states**: New incoming log entries are collected and regularly written to the data points. Hereby the interval can be defined. Note: The states are only updated if there has been a change. However, from a performance point of view, it does not make sense to set an interval that is too short here. Less than 2 seconds is not allowed.

* **Maximum number of log entries**: The maximum number of log entries that are retained in the states (older entries are removed). Please do not set a too large number, the larger the number, the more load for the adapter and thus your ioBroker server. A number of 100 has proven to be good.
* **Column order for JSON table**: Here you can change the order of the columns. As additional column ts (timestamp) is always added. In VIS etc. simply hide it if necessary.
If you need less than 4 columns: Simply select one entry of the first columns you need and then hide the rest with the VIS JSON table widget (or similar).
* **Sorting**: If activated: sorts the log entries in descending order, newest at the top. If deactivated: Sorts the log entries in ascending order, i.e. oldest on top. Sorting in descending order is recommended, so activate this option.


# Visualization (Showing logs in VIS)

This is an example of a VIS project, which you can import in VIS: [vis-project-ex_logparser-adapter.zip](https://github.com/Mic-M/ioBroker.logparser/raw/master/accessories/vis/vis-project-ex_logparser-adapter.zip). 
Just download this zip file. Then, in VIS, navigate to menu `Setup > Projekt-Export/Import > Import` and select this zip file accordingly.
Please note that you will also need the [Material Design Widgets](https://github.com/Scrounger/ioBroker.vis-materialdesign) to use this project.

![main.jpg](img/visintro.gif)


# Further functions

## Manipulation of the JSON column contents by log

This adapter provides the possibility to use JavaScript, Blockly, etc. and influence which content is placed in the log columns 'date', 'severity', 'from', 'message' of the JSON tables.

**Example:**
The following command is executed in a JavaScript:
`log('[Alexa-Log-Script] ##{"message":"' + 'Command [Turn on music].' + '", "from":"' + 'Alexa Kitchen' + '"}##');`

The part `##{"message":"' + 'Command [Turn on music].' + '", "from":"' + 'Alexa Kitchen' + '"}##` will be extracted, and log message will become 'Command [Turn on music].', and source will be 'Alexa Kitchen' (instead of javascript.0).

**Syntax:**
Add the following to the log line: `##{"date":"", "severity":"", "from":"", "message":""}##`
Individual parameters can be removed, e.g. just to change the log text (message), take `##{"message": "text comes here."}##`
