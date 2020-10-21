For each set filter (rule), states are created under `logparser.[instance].filters`.


| **Column**            | **Description** |
|-----------------------|-----------------------------------------------------------------------|
| ![image](https://github.com/Mic-M/ioBroker.logparser/blob/master/admin/doc-md/img/check_box-24px.svg?raw=true) | Activate/deactivate filters |
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

