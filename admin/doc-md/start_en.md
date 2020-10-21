<!-- Markdown Collapsible Section, see https://gist.github.com/pierrejoubert73/902cc94d79424356a8d20be2b382e1ab -->
<details>
  <summary style="font-size:1.3em; border:1px solid #ddd; background-color:#E0EBF3; color:black; padding:10px 0 10px 5px">About this adapter</summary> <!-- Header -->
  <!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<br>

This adapter parses (filters) all logs of ioBroker adapters and provides the results as JSON in states for each filter as configured in tab "PARSER RULES (FILTER)". Resulting JSON can then be used in VIS for visualization. States for emptying (clearing) old logs are provided as well (like `logparser.0.filters.Homematic.emptyJson` for emptying a specific filter, or `logparser.0.emptyAllJson` to empty all filters.)

</details>
<!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<details>
  <summary style="font-size:1.3em; border:1px solid #ddd; background-color:#E0EBF3; color:black; padding:10px 0 10px 5px">How to start?</summary> <!-- Header -->
  <!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<br>

In the tab "PARSER RULES (FILTER)" you configure the according filter rules you need. You can expand an explanation of all options by clicking on the blue "bar heading":

![image](https://github.com/Mic-M/ioBroker.logparser/blob/master/admin/doc-md/img/parser-rules-expand-help-animated.gif?raw=true)

After that you go through the further settings in the other tabs, which are explained there accordingly.

</details>
<!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->


<details>
  <summary style="font-size:1.3em; border:1px solid #ddd; background-color:#E0EBF3; color:black; padding:10px 0 10px 5px">Visualization (Showing logs in VIS)</summary> <!-- Header -->
  <!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<br>

Here is an example of a VIS project, which you can import in VIS: [vis-project-ex_logparser-adapter.zip](https://github.com/Mic-M/ioBroker.logparser/raw/master/accessories/vis/vis-project-ex_logparser-adapter.zip). 
Just download this zip file. Then, in VIS, navigate to menu `Setup > Project Export/Import > Import` and select this zip file accordingly.

Please note that you will also need the [Material Design Widgets](https://github.com/Scrounger/ioBroker.vis-materialdesign) to use this project.

![image](https://github.com/Mic-M/ioBroker.logparser/blob/master/admin/doc-md/img/visintro-animated.gif?raw=true)

</details>
<!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<details>
  <summary style="font-size:1.3em; border:1px solid #ddd; background-color:#E0EBF3; color:black; padding:10px 0 10px 5px">Further functions</summary> <!-- Header -->
  <!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

<br>

## Manipulation of the JSON column contents by log

This adapter provides the possibility to use JavaScript, Blockly, etc. and influence which content is placed in the log columns 'date', 'severity', 'from', 'message' of the JSON tables.

**Example:**
The following command is executed in a JavaScript:
`log('[Alexa-Log-Script] ##{"message":"' + 'Command [Turn on music].' + '", "from":"' + 'Alexa Kitchen' + '"}##');`

The part `##{"message":"' + 'Command [Turn on music].' + '", "from":"' + 'Alexa Kitchen' + '"}##` will be extracted, and log message will become 'Command [Turn on music].', and source will be 'Alexa Kitchen' (instead of javascript.0).

**Syntax:**
Add the following to the log line: `##{"date":"", "severity":"", "from":"", "message":""}##`
Individual parameters can be removed, e.g. just to change the log text (message), take `##{"message": "text comes here."}##`

</details>
<!-- Markdown Collapsible Section - We must have an empty line below (per link above)  -->

