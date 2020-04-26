/******************************************************************************************************
 * JavaScript Adapter Script for Log-Parser-Adapter: https://github.com/Mic-M/ioBroker.logparser
 * --------------------------------------------------------------
 * Purpose: Get the history of all spoken Alexa commands into the log
 *          Required: Alexa adapter - https://github.com/Apollon77/ioBroker.alexa2
 * Source:  https://github.com/Mic-M/ioBroker.logparser
 * Autor:   Mic-M (Github) | Mic (ioBroker)
 * --------------------------------------------------------------------------------------
 * Change Log:
 *  1.0.0  Mic-M   * Adoption to Log Parser Adapter
 *  0.1.0  Mic-M   * Initial release (for Log Script - https://github.com/Mic-M/iobroker.logfile-script).
 ******************************************************************************************************/

/******************************************************************************************************
 * Script Settings
 ******************************************************************************************************/

// **Capitalize First Letters**
// The spoken command to Alexa is being returned in lowercase, like "turn on kitchen light". 
// With this option set to true, the output will be "Turn On Kitchen Light" (so capitalized first letter of each word)
const g_capFirstLetters = true;


/******************************************************************************************************
 * End of Script Settings. Please do not change anything below here.
 ******************************************************************************************************/

main();
function main() {
    // All Alexa adapter instances, so alexa2.0.History.json, alexa2.1.History.json, alexa2.2.History.json, etc.
    on({id: /^alexa2\.\d\.History\.json$/, change:'any'}, function(obj) {

        // obj.state.val: JSON string of oject.
        // Like: {"name":"Alexa Flur","serialNumber":"xxxxxxxxxx","summary":"Wohnlicht an","creationTime":1582843794820, ... }
        let objHistory = JSON.parse(obj.state.val); 

        // ignore alexa keywords or empty value.
        if(! (['', 'alexa','echo','computer'].includes(objHistory['summary']) )) {
            // ignore "sprich mir nach"
            if (!(objHistory['summary'].includes('sprich mir nach '))) {
                log('[Alexa-Log-Script] ##{"message":"' + formatAlexaSummary(objHistory['summary']) + '", "from":"' + objHistory['name'] + '"}##');
            }
        }
    });
}

/**
 * Formats the Alexa summary text accordingly.
 * @param {string} summaryText   The summary text
 * @return {string} the formatted summary
 */
function formatAlexaSummary(summaryText) {
    if (g_capFirstLetters) summaryText = summaryText.replace(/(^|\s)\S/g, l => l.toUpperCase()); // Capitalize if set. https://stackoverflow.com/questions/2332811/
    return summaryText;
}
