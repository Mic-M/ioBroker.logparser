/* eslint-disable no-irregular-whitespace */
/* eslint-disable-next-line no-undef */
/* eslint-env jquery, browser */               // https://eslint.org/docs/user-guide/configuring#specifying-environments
/* global systemLang, common, values2table, table2values, M, */  // for eslint
/**
 * List of some global constants
 *
 * systemLang - 'en', 'de', 'ru', ect. // iobroker.admin/www/js/adapter-settings.js
 * instance - instance of Adapter - number
 */


/**
 * ioBroker function explanation
 * onChange(boolean) - if set true, grayed out save button turns to blue and being activated, and vice versa if false
 * _(string) - the provided translation key will be translated into ioBroker's admin language (words.js)
 * 
 */

//const adapterNamespace = `logparser.${instance}`;

// This will be called by the admin adapter when the settings page loads
let globalBlacklist = [];   // For table "globalBlacklist"
let parserRules = [];   // For table "parserRules"

function load(settings, onChange) {  /*eslint-disable-line no-unused-vars*/

    // Adapter Settings
    if (!settings) return;

    // Set adapter version
    const adapterVersion = common.version;
    $('#adapter-version').html(adapterVersion);

    /**
     * Apply markdown for documentation through https://github.com/zerodevx/zero-md
     */

    // index_m.html: All ids defined in <zero-md> tags, like ['md-start', 'md-targetDevices', ...]
    const mdIds = $('zero-md[manual-render]').map((i, el) => el.getAttribute('id')).get(); // https://stackoverflow.com/a/54392415
    for (const mdId of mdIds) {

        const mdFilePath = $('zero-md#' + mdId).attr('src'); // like 'doc-md/start_en.md'
        if (mdFilePath) {
            
            if (systemLang !== 'en') { // English is always required
                const newFilePath = mdFilePath.slice(0, -5) + `${systemLang}.md`; // remove last 5 chars 'en.js' and add <lang>.js
                if (fileExists(newFilePath)) {
                    $('zero-md#' + mdId).attr('src', newFilePath); // set new file path src of <zero-md>                      
                } else {
                    // Fallback is English. We add a note to the HTML
                    $(`
                        <p class='translation-required'>
                            Your current ioBroker language is <strong>${systemLang.toUpperCase()}</strong>, however, the following instructions have not yet been translated into your language, so English is used as fallback.
                            If you are fluently speaking ${systemLang.toUpperCase()}, please help and translate into your language.
                            The English file is <a target="_blank" href="https://github.com/Mic-M/ioBroker.logparser/blob/master/admin/${mdFilePath}">located on Github</a>: <code>https://github.com/Mic-M/ioBroker.logparser/blob/master/admin/${mdFilePath}</code>.
                            Please translate and provide a Github pull request for adding a new file '${newFilePath}' with your ${systemLang.toUpperCase()} translation. Thank you!
                        </p>
                    `).insertBefore('zero-md#' + mdId);
                }
            }
        } else {
            console.warn(`load(): mdFilePath for '${mdId}' is undefined, so we use English.`);
        }

        // Finally, render zero-md - https://github.com/zerodevx/zero-md#public-methods
        // We add a slight delay, just in case
        setTimeout(() => {
            const el = document.querySelector('zero-md#' + mdId);
            if(el) el.render();
        }, 100);

    }




    $('.value').each(function () {
        const $key = $(this);
        const id = $key.attr('id');
        if ($key.attr('type') === 'checkbox') {
            // do not call onChange direct, because onChange could expect some arguments
            $key.prop('checked', settings[id])
                .on('change', () => onChange())
            ;
        } else {
            // do not call onChange direct, because onChange could expect some arguments
            $key.val(settings[id])
                .on('change', () => onChange())
                .on('keyup', () => onChange())
            ;
        }
    });

    globalBlacklist = settings.globalBlacklist || [];   // For table "globalBlacklist"
    parserRules = settings.parserRules || [];   // For table "parserRules"
    onChange(false);
    values2table('globalBlacklist', globalBlacklist, onChange);   // For table "globalBlacklist"
    values2table('parserRules', parserRules, onChange);   // For table "parserRules"

    // Enhance Tabs with onTabShow-Function. Source: iQontrol Adapter.
    // This allows using JavaScript to perform certain actions as defined in function onTabShow(), since we have
    // several tabs in this adapter configuration.
    const tabs = ['#tab-start', '#tab-filter', '#tab-further', '#tab-visualization', '#tab-blacklist', '#tab-expert'];
    for (const tab of tabs) {
        onTabShow(tab);
    }
    $('ul.tabs li a').on('click', function() { 
        onTabShow($(this).attr('href'));
    });

    function onTabShow(tabId) { // eslint-disable-line no-unused-vars

        // for all tabs:
        $('.collapsible').collapsible(); // https://materializecss.com/collapsible.html

    }        






    // From ioBroker Adapter Creator:
    // Re-initialize all the Materialize labels on the page if you are dynamically adding inputs.
    // @ts-ignore - Property 'updateTextFields' does not exist on type 'typeof M'.ts(2339)
    if (M) M.updateTextFields();
}

/**
 * Save Options - Called by the admin adapter when the user clicks save
 * @param {function} callback(settingsObject) - callback function containing the settings object to be saved.
 */
function save(callback) { /*eslint-disable-line no-unused-vars*/

    /**
     * Select elements with class=value and build settings object
     * (from Adapter Creator)
     */ 
    const obj = {};
    $('.value').each(function () {
        const $this = $(this);
        if ($this.attr('type') === 'checkbox') {
            obj[$this.attr('id')] = $this.prop('checked');
        } else {
            obj[$this.attr('id')] = $this.val();
        }
    });
    obj.globalBlacklist = table2values('globalBlacklist');    // For table "globalBlacklist"
    obj.parserRules = table2values('parserRules');    // For table "parserRules"
    callback(obj);
}


/**
 * Checks if a file exists
 * Source: https://stackoverflow.com/a/58344215
 * @param url {string} path to file
 * @return {boolean} true if file exists, false if not
 */
function fileExists(url) {
    const http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status!=404;
}

