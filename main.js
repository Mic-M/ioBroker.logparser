'use strict';
/**
 *     ioBroker Log Parser Adapter
 *
 *     https://github.com/Mic-M/ioBroker.logparser
 * 
 *     © 2020 Mic-M <iob.micm@gmail.com>
 * 
 *     License: MIT
 */
// Used VB Code Extensions: https://github.com/aaron-bond/better-comments


/**
 * Global variables. We are using "g_" for ease of identification.
 */
let adapter; // The adapter instance object. In this case we do not add "g_" to the variable name for ease of use for anyone.
const g_ioBrokerUtils = require('@iobroker/adapter-core'); // The adapter-core module
const g_path = require('path'); const helper = require(g_path.join(__dirname, 'lib', 'mic-functions.js'));// Helper Functions
const g_forbiddenCharsA = /[\][*,;'"`<>\\?]/g;    // Several chars but allows spaces
const g_forbiddenCharsB = /[\][*,;'"`<>\\\s?]/g; // Several chars and no spaces allowed
const g_ignore = '[LOG_IGNORE]'; // Specific log string portion to ignore a certain log. Used for debugging to avoid endless loop.
const g_globalBlacklist = [];  // the global blacklist (per admin settings. either type RegExp or string)
const g_activeFilters = []; // the names of all filters activated per admin settings
const g_allLogs = {}; // All logs which were coming in, prepared for JSON output to states
const g_changeIndicator = {};
const g_intervalTimers = []; // All adapter setInterval timers come into this array for ease of use.
let   g_midnightTimeoutTimer = null; // setInterval timer for callAtMidnight()
let   g_jsonKeys = []; // keys for JSON as array. From adapter admin settings, like: "date,severity,from,message". ts is always added.
const g_tableFilters = []; // for each logparser.0.visualization.tableX, we hold the selection state here. So table0 = array index 0, etc.
const g_minUpdateInterval = 2; // Minimum update interval in seconds.
const g_defaultUpdateInterval = 10; // Default update interval in seconds.

/**
 * Main function
 * Called once the adapter is initialized.
 */
function main() {

    // ? This will - most likely - never being needed at this point.
    helper.killIntervalTimers(g_intervalTimers); // Kill all existing timers, just in case.

    // Verify and get adapter settings
    initializeConfigValues( (passedInit) => {

        if (!passedInit) {
            adapter.log.error('Adapter not initialized due to user configuration error(s).');
            return;
        }

        const statesToProcess = prepareAdapterObjects();

        // Create all objects (states), and delete the ones no longer needed.
        helper.createAdapterObjects(adapter, statesToProcess, () => {

            // Get previous JSON Logs from states into global variable g_allLogs
            getJsonStates( () => {

                // Subscribe to new logs coming in from all adapters
                subscribeToAdapterLogs();
                adapter.log.debug('Subscribing to new logs coming in from all adapters.');

                // Timer for updating states
                g_intervalTimers.push(setInterval(scheduleUpdateStates, parseInt(adapter.config.updateInterval) * 1000));
                adapter.log.debug('State updates scheduled... Interval: ' + adapter.config.updateInterval + ' seconds.');

                // Subscribe to certain adapter states
                adapter.subscribeStates('filters*.emptyJson');
                adapter.subscribeStates('emptyAllJson');
                adapter.subscribeStates('forceUpdate');
                if(adapter.config.visTables > 0) {
                    adapter.subscribeStates('visualization.table*.selection');
                    adapter.subscribeStates('visualization.table*.emptyJson');
                }

                adapter.log.debug('Subscribing to certain adapter states.');                

                // Timer for updating Today/Yesterday in Json every midnight
                callAtMidnight(updateTodayYesterday);
                adapter.log.debug('Update of "Today/Yesterday" in JSON scheduled for every midnight.');

                // Update Today/Yesterday now.
                updateTodayYesterday();

                // Initially get visualization selection state values
                for(let i = 0; i < adapter.config.visTables; i++) {
                    adapter.getState('logparser.0.visualization.table' + i + '.selection', function (err, state) {
                        if (!err && state && !helper.isLikeEmpty(state.val)) {
                            g_tableFilters[i] = state.val;
                        } else {
                            g_tableFilters[i] = '';
                        }
                    });                    
                }

            });

        });

    });

}


/**
 * Get json Logs from states and set to g_allLogs
 * 
 * @param {object} callback     Callback function
 * @return {object}             Callback function
 */
function getJsonStates(callback) {
    let index = g_activeFilters.length;
    help(); // Helper function: This is a "callback loop" through a function. Inspired by https://forum.iobroker.net/post/152418
    function help() {
        index--;
        if (index >= 0) {
            adapter.getState('filters.' + g_activeFilters[index] + '.json', function (err, state) {
                // Value = state.val, ack = state.ack, time stamp = state.ts, last changed = state.lc
                if (!err && state && !helper.isLikeEmpty(state.val)) {
                    const logArray = JSON.parse(state.val);
                    // If it is sorted ascending, convert to descending
                    if (logArray.length >= 2) {
                        if( (logArray[0].ts) < (logArray[logArray.length - 1].ts) ) logArray.reverse();
                    }
                    g_allLogs[g_activeFilters[index]] = logArray;
                }
                setImmediate(help); // Call function again. We use node.js setImmediate() to avoid stack overflows.
            });
        } else {
            return callback(); // All processed.
        }
    }
}


/**
 * Calls a function every midnight.
 * This way, we don't need to use node-schedule which would be an overkill for this simple task.
 * https://stackoverflow.com/questions/26306090/
 * @param {object}  func   function to call at midnight
 */
function callAtMidnight(func) {
    if (g_midnightTimeoutTimer) clearTimeout(g_midnightTimeoutTimer);
    g_midnightTimeoutTimer = null;
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // the next day, ...
        0, 0, 0 // ...at 00:00:00 hours
    );
    const offset = 1000; // we add one additional second, just in case.
    const msToMidnight = night.getTime() - now.getTime() + offset;
    g_midnightTimeoutTimer = setTimeout(function() {
        func();              //      <-- This is the function being called at midnight.
        callAtMidnight(func);    //      Then, reset again next midnight.
    }, msToMidnight);
}


/**
 * Update Today/Yesterday in g_allLogs.
 * Typically called every midnight.
 */
function updateTodayYesterday() {
    adapter.log.debug('updateTodayYesterday() called.');
    for (const lpFilterName of g_activeFilters) {
        const lpLogObjects = g_allLogs[lpFilterName];
        for (let i = 0; i < lpLogObjects.length; i++) {
            const lpLogObject = lpLogObjects[i];
            const f = helper.objArrayGetObjByVal(adapter.config.parserRules, 'name', lpFilterName); // the filter object
            g_allLogs[lpFilterName][i].date = helper.tsToDateString(lpLogObject.ts, f.dateformat, adapter.config.txtToday, adapter.config.txtYesterday);
        }
    }
}

/**
 * Called once a subscribed state changes
 * @param {string} statePath   State Path
 * @param {any}    obj         State object
 */
function stateChanges(statePath, obj) {

    if (obj) {

        // A subscribed state has changed

        // Get state parts from like logparser.0.filters.WarnAndError.emptyJson
        const fromEnd1 = statePath.split('.')[statePath.split('.').length - 1]; // [emptyJson]
        const fromEnd2 = statePath.split('.')[statePath.split('.').length - 2]; // [WarnAndError]
        const fromEnd3 = statePath.split('.')[statePath.split('.').length - 3]; // [filters]
        const allExceptLast = statePath.substr(0, statePath.length - fromEnd1.length - 1); // [logparser.0.filters.WarnAndError]

        // Empty all JSON
        if (fromEnd1 == 'emptyAllJson' && obj.val && !obj.ack) {
            for (const filterName of g_activeFilters) {
                emptyJson(filterName);
            }

        // Empty a JSON of a filter
        } else if (fromEnd3 == 'filters' && fromEnd1 == 'emptyJson' && obj.val && !obj.ack) {

            emptyJson(fromEnd2);

        // Force Update
        } else if (fromEnd1 == 'forceUpdate' && obj.val && !obj.ack) {

            for (const filterName of g_activeFilters) {
                const visTableNums = [];
                if (adapter.config.visTables > 0) {
                    for(let i = 0; i < adapter.config.visTables; i++) {
                        visTableNums.push(i);
                    }
                }
                updateJsonStates(filterName, {updateFilters:true, tableNum:visTableNums});
                // Looks like it throws an error per issue #12: https://github.com/Mic-M/ioBroker.logparser/issues/12
                // adapter.setState(statePath, {ack:true}); // Send ack:true to acknowledge the positive response
            }
            adapter.setState('lastTimeUpdated', {val:Date.now(), ack: true});

        // Visualization: Changed selection
        } else if (fromEnd3 == 'visualization' && fromEnd1 == 'selection' && obj.val && !obj.ack) {

            if (g_activeFilters.indexOf(obj.val) != -1) {
                
                // get number from 'visualization.table0', 'visualization.table1', etc.
                const matches = allExceptLast.match(/\d+$/); // https://stackoverflow.com/questions/6340180/
                if (matches) {
                    // We have got a number.
                    const number = parseInt(matches[0]);
                    if(g_tableFilters != obj.val) { // continue only if new selection is different to old
                        g_tableFilters[number] = obj.val; // global variable
                        updateJsonStates(obj.val, {updateFilters:false, tableNum:[number]});
                        // Looks like it throws an error per issue #12: https://github.com/Mic-M/ioBroker.logparser/issues/12
                        // adapter.setState(statePath, {ack:true}); // Send ack:true to acknowledge the positive response
                    }
                }                
            }

        // Visualization: emptyJson
        } else if (fromEnd3 == 'visualization' && fromEnd1 == 'emptyJson' && obj.val && !obj.ack) {

            adapter.getState(allExceptLast + '.selection', function (err, state) {
                // Value = state.val, ack = state.ack, time stamp = state.ts, last changed = state.lc
                if (!err && state && !helper.isLikeEmpty(state.val)) {            
                    if (g_activeFilters.indexOf(state.val) != -1) {
                        emptyJson(state.val);
                        adapter.setState(statePath, {ack:true}); // just send ack:true. We acknowledge the positive response
                    }
                }
            });
        }

    }

    function emptyJson(filterName) {

        // in variable
        g_allLogs[filterName] = [];

        // in filters states
        adapter.setState('filters.' + filterName + '.json', {val:'[]', ack: true});
        adapter.setState('filters.' + filterName + '.jsonCount', {val:0, ack: true});
        adapter.setState('filters.' + filterName + '.mostRecentLogTime', {val:0, ack: true});

        // in visualization states
        if(adapter.config.visTables > 0) {
            for(let i = 0; i < adapter.config.visTables; i++) {
                if(g_tableFilters[i] && g_tableFilters[i] == filterName) {
                    adapter.setState('visualization.table' + i + '.json', {val:'[]', ack: true});
                    adapter.setState('visualization.table' + i + '.jsonCount', {val:0, ack: true});
                    adapter.setState('visualization.table' + i + '.mostRecentLogTime', {val:0, ack: true});
                }
            }
        }
        adapter.setState(statePath, {ack:true}); // just send ack:true. We acknowledge the positive response
    }

}


/**
* Scheduled Timer: Update states every x seconds
 */
function scheduleUpdateStates() {
    adapter.log.debug('Updating states per schedule...');

    for (const filterName of g_activeFilters) {

        if(!helper.isLikeEmpty(g_allLogs[filterName])) {
            // Update states only if there was/were actually new log(s) coming in.
            // We add a buffer as offset to make sure we catch new logs.
            const tsNewest = g_allLogs[filterName][0].ts;
            const updateIntMs = adapter.config.updateInterval * 1000;
            const buffer = 2000;
            if ( (tsNewest + updateIntMs + buffer) < Date.now() ) {
                adapter.log.debug('Filter ' + filterName + ': No recent log update, last log line was on: ' + helper.dateToLocalIsoString(new Date(tsNewest)));
            } else {
                adapter.log.debug('Filter ' + filterName + ': JSON states updated, most recent log from: ' + helper.dateToLocalIsoString(new Date(tsNewest)));
                const visTableNums = [];
                if (adapter.config.visTables > 0) {
                    for(let i = 0; i < adapter.config.visTables; i++) {
                        visTableNums.push(i);
                    }
                }
                updateJsonStates(filterName, {updateFilters:true, tableNum:visTableNums});
            }
        } else {
            adapter.log.debug('Filter ' + filterName + ': No logs so far.');
        }
    }
    adapter.setState('lastTimeUpdated', {val:Date.now(), ack: true});

}

/**
 * Subscribe to new logs coming in from all adapters
 * See: https://github.com/ioBroker/ioBroker.js-controller/blob/master/doc/LOGGING.md
 * The logObject looks like this (for "test.0 2020-03-28 17:27:08.489 error (4536) adapter disabled"):
 * {from:'test.0', message: 'test.0 (12504) adapter disabled', severity: 'error', ts:1585413238439}
 */
function subscribeToAdapterLogs() {
    adapter.requireLog(true);
    adapter.on('log', function (obj) {
        const logObject = prepareNewLogObject(obj);
        if(logObject.message != '') {
            for (const filterName of g_activeFilters) {
                addNewLogToAllLogsVar(filterName, logObject, (result) => {
                    if(result == true) {
                        // We are done at this point.
                    }
                });
            }            
        }
    });      
}



/**
 * update JSON Log states
 * Updates JSON states under filters and under visualization.tableXX
 * visualization is optional. If not set, just the states under filters will be updated.
 * If set, it expects an object: {updateFilters:false, tableNum:[0, 2]}
 *   - updateFilters: if states under filters should also be updated.
 *   - tableNum: which visualization tables to be updated.
 * @param {string} filterName       Name of the filter
 * @param {object} [visualization]  Optional: If not set, just filters are updated. But if set, it expects an object: 
 *                                  {updateFilters:false, tableNum:'logparser.0.visualization.table1'}
 *                                  - updateFilters: if states under filters should also be updated.
 *                                  - tableNum: table numbers to be updated, as array.
  */
function updateJsonStates(filterName, visualization = undefined) {

    let doFilters = true;        
    const helperArray = [...g_allLogs[filterName]]; // We use array spreads '...' to copy array since reverse() changes the original array.
    let mostRecentLogTime = 0;
    if(!helper.isLikeEmpty(helperArray)) {
        mostRecentLogTime = helperArray[0].ts;
        if (!adapter.config.sortDescending) helperArray.reverse();
    }

    if (visualization) {
        doFilters = visualization.updateFilters; // to update the filters, if true

        // Prepare the visualization states.
        // We need these in an array.
        const finalPaths = []; // all state paths, like logparser.0.visualization.table0, etc.
        if(!helper.isLikeEmpty(visualization.tableNum)) {
            for (const lpTableNum of visualization.tableNum) {
                if (g_tableFilters[lpTableNum] == filterName) {
                    // The chosen filter in logparser.0.visualization.tableX matches with filterName
                    finalPaths.push('visualization.table' + lpTableNum);
                }
                
            }
            if (!helper.isLikeEmpty(finalPaths)) {
                for (const lpPath of finalPaths) {
                    adapter.setState(lpPath + '.json', {val:JSON.stringify(helperArray), ack: true});
                    adapter.setState(lpPath + '.jsonCount', {val:helperArray.length, ack: true});
                    adapter.setState(lpPath + '.mostRecentLogTime', {val:mostRecentLogTime, ack: true});
                }
            }
        }
    }

    if (doFilters && !helper.isLikeEmpty(helperArray)) {
        adapter.setState('filters.' + filterName + '.json', {val:JSON.stringify(helperArray), ack: true});
        adapter.setState('filters.' + filterName + '.jsonCount', {val:helperArray.length, ack: true});
        adapter.setState('filters.' + filterName + '.mostRecentLogTime', {val:mostRecentLogTime, ack: true});
    }

}


/**
 * Add any incoming log to g_allLogs{"filterName":logObject} and g_allLogs, if all checks passed.
 * @param {string} filterName   Name of the filter to be updated
 * @param {object} logObject    The log line object, which looks like:
 *                              {from:'test.0', message: 'test.0 adapter disabled', 
 *                               severity: 'error', ts:1585413238439}
 * @param {object} callback     Callback function. Returns true, if added, and falls if not (so if checks not passed)
 */
function addNewLogToAllLogsVar(filterName, logObject, callback) {

    // Prepare variables
    const f = helper.objArrayGetObjByVal(adapter.config.parserRules, 'name', filterName); // the filter object
    const whiteListAnd = helper.stringConfigListToArray(f.whitelistAnd);
    const whiteListOr = helper.stringConfigListToArray(f.whitelistOr);
    const blacklist = helper.stringConfigListToArray(f.blacklist);
    const removeList = helper.stringConfigListToArray(f.clean);
    
    // Check: if no match for filter name or if filter is not active.
    if (f == undefined || !f.active) return callback(false);

    // Check: if severity is matching or not
    if(!f[logObject.severity]) return callback(false);

    // Check: WhitelistAnd.
    // If white list is empty, we treat as *
    if(!helper.isLikeEmpty(whiteListAnd)) {
        if (!helper.stringMatchesList(logObject.message, whiteListAnd, true)) {
            return callback(false); // No hit, so we go out.
        }
    }
    // Check: WhitelistOr.
    // If white list is empty, we treat as *
    if(!helper.isLikeEmpty(whiteListOr)) {
        if (!helper.stringMatchesList(logObject.message, whiteListOr, false)) {
            return callback(false); // No hit, so we go out.
        }
    }

    // Check: Blacklist
    if(!helper.isLikeEmpty(blacklist)) {
        if (helper.stringMatchesList(logObject.message, blacklist, false)) {
            return callback(false); // We have a hit, so we go out.
        }
    }

    // Clean: remove string portions from log message
    if(!helper.isLikeEmpty(removeList)) {
        for (const lpListItem of removeList) {
            logObject.message = logObject.message.replace(lpListItem, '');
        }
    }

    // Remove adapter instance from log message, like: 'test.0 adapter disabled' -> 'adapter disabled'
    if (logObject.message.startsWith(logObject.from)) {
        logObject.message = logObject.message.substring(logObject.from.length + 1);
    }

    // Add new key "date" to logObject
    logObject.date = helper.tsToDateString(logObject.ts, f.dateformat, adapter.config.txtToday, adapter.config.txtYesterday);


    /**
     * Support individual items in column provided through log
     * Syntax: 'This is a log message ##{"message":"Individual msg", "from":"other source"}##'
     */
    const regexArr = logObject.message.match(/##(\{\s?".*"\s?\})##/);
    if (regexArr != null && regexArr[1] != undefined) {
        const replacer = JSON.parse(regexArr[1]);
        if (replacer['date'] != undefined)     logObject.date = replacer['date'];
        if (replacer['severity'] != undefined) logObject.severity = replacer['severity'];
        if (replacer['from'] != undefined)     logObject.from = replacer['from'];
        if (replacer['message'] != undefined)  logObject.message = replacer['message'];
    }

    /**
     * Apply Max Length
     */    
    if(!helper.isLikeEmpty(f.maxLength)) {
        if (parseInt(f.maxLength) > 3) {
            logObject.message = logObject.message.substr(0, parseInt(f.maxLength));
        }
    }    
     

    // Merge
    // TODO: Bessere Konfiguration erlauben, also z.B. "(# Einträge)", wo dann # durch die Anzahl ersetzt wird.
    if (f.merge) {
        // Returns the position where the element was found, or -1 if not found -- https://javascript.info/array-methods#filter
        const foundPosition = g_allLogs[filterName].findIndex(item => item.message.indexOf(logObject.message) >=0);
        if (foundPosition >= 0) {
            const foundMsg = g_allLogs[filterName][foundPosition].message;
            let mergeNum = getMergeNumber(foundMsg); //number of '[xxx Entries]'
            if (mergeNum != -1) {
                // We found '[xxx Entries]', so we increase by 1
                mergeNum++;
            } else {
                // No '[xxx Entries]' found, so we start with 2 ( 1='the new log line coming in' + 1='the old one')
                mergeNum = 2;
            }
            // Add merge number to log message
            const mergeText = adapter.config.txtMerge.replace('#', mergeNum);
            logObject.message = mergeText + logObject.message;
            // remove old log objects
            g_allLogs[filterName].splice(foundPosition, 1);
        }
    }

    // Rebuilding per keys and sort order of g_jsonKeys per adapter admin settings, like ['date', 'from', 'severity', 'message']
    const logObjJson = {};
    for (const lpKey of g_jsonKeys) {
        logObjJson[lpKey] = logObject[lpKey];
    }
    logObjJson.ts = logObject.ts; // Always add timestamp as last key (which will also end up in the last column of JSON table)

    // Add CSS to logObject.severity, like <span class='logWarn'>warn</span>
    logObjJson.severity = "<span class='log" + logObject.severity.charAt(0).toUpperCase() + logObject.severity.slice(1) + "'>" + logObject.severity + '</span>';

    // Finally: add logObject to g_allLogs
    g_allLogs[filterName].unshift(logObjJson);  // add element at beginning
    g_allLogs[filterName] = g_allLogs[filterName].slice(0, parseInt(adapter.config.maxLogs)); // limit number of items

    return callback(true);

}


/**
 * @param  {string}   strInput    A log message which may have leading '[123 entries]'
 * @return {number}   returns the number 123 from '[123 entries]' if any match, or -1 if not found
 */
function getMergeNumber(strInput) {
    const splitUp = adapter.config.txtMerge.split('#');
    const mergeRegExp = new RegExp(helper.escapeRegExp(splitUp[0]) + '(\\d+)' + helper.escapeRegExp(splitUp[1]) + '.*');
    const matches = mergeRegExp.exec(strInput);
    if (matches === null) {
        return -1;
    } else {
        return parseInt(matches[1]);
    }
}


/**
 * Prepares a new logObject
 * @param {object} logObject  The new log line as object with keys: from, message, severity, ts
 * @return {object}   The same object with a cleaned message. Empty message, if not passing verification.
 **/
function prepareNewLogObject(logObject) {

    // Verify message, also if globally blacklisted
    let msg = (helper.isLikeEmpty(logObject.message)) ? '' : logObject.message;  // set empty string if no message 
    msg = msg.replace(/\s+/g, ' '); // Remove multiple white-spaces, tabs and new line from log message
    if (helper.stringMatchesList(msg, g_globalBlacklist, false))  msg = '';   // If message is blacklisted, we set an empty string.
    if (msg.includes(g_ignore)) msg = ''; // Ignore msg per the g_ignore string

    // Verify log level (severity)
    if (msg != '' && helper.isLikeEmpty(logObject.severity)) {
        msg = '';
    } else if (msg != '' && !['debug', 'info', 'warn', 'error'].includes(logObject.severity)) {
        msg = '';  // We expect one of the above log levels
    }

    // Remove PID
    if (msg != '' && adapter.config.removePid) msg = helper.removePid(msg);

    // Verify source
    if (msg != '' && helper.isLikeEmpty(logObject.from)) msg = '';

    // Verify timestamp
    if (msg != '' && helper.isLikeEmpty(logObject.ts) && typeof logObject.ts != 'number' ) msg = '';

    logObject.message = msg;

    return(logObject);

}


/**
 * Checks and validates the configuration values of adapter settings
 * Provides result in "config" variable and returns true if all successfully validated, and false if not.
 * TODO: Write separate function for validation of user inputs for all data types like number, string, etc.
 * TODO:    This could be generic for all adapters. Also, look into possible npm scripts available.
 * 
 *  @param {object} [callback]     Optional: a callback function
 *  @return {object}               Callback with parameter success (true/false)
 */
function initializeConfigValues(callback) {

    const errorMsg = [];

    // Verify "txtToday"
    if(!helper.isLikeEmpty(adapter.config.txtToday)) {
        adapter.config.txtToday = adapter.config.txtToday.replace(g_forbiddenCharsA, '').trim();
        if (adapter.config.txtToday == '') {
            adapter.config.txtToday = 'Today';
            adapter.log.debug('Corrected txtToday option and set to "Today"');
        }
    } else {
        adapter.config.txtToday = 'Today';
        adapter.log.debug('Corrected txtToday option and set to "Today"');
    }
    
    // Verify "txtYesterday"
    if(!helper.isLikeEmpty(adapter.config.txtYesterday)) {
        adapter.config.txtYesterday = adapter.config.txtYesterday.replace(g_forbiddenCharsA, '').trim();
        if (adapter.config.txtYesterday == '') {
            adapter.config.txtYesterday = 'Yesterday';
            adapter.log.debug('Corrected txtYesterday option and set to "Yesterday"');
        }
    } else {
        adapter.config.txtYesterday = 'Yesterday';
        adapter.log.debug('Corrected txtYesterday option and set to "Yesterday"');
    }


    // Verify filter table "parserRules"
    if(!helper.isLikeEmpty(adapter.config.parserRules)) {
        let anyRuleActive = false;
        for (let i = 0; i < adapter.config.parserRules.length; i++) {
            // Just some basics. We do further verification when going thru the filters
            if(!helper.isLikeEmpty(adapter.config.parserRules[i].active) && adapter.config.parserRules[i].active == true ) {
                anyRuleActive = true;
                const name = adapter.config.parserRules[i].name.replace(g_forbiddenCharsB, '');
                if(name.length > 0) {   // We need at least one char. 
                    adapter.config.parserRules[i].name = name;
                    g_activeFilters.push(name); // All active filters go here
                    g_allLogs[name] = [];   // Prepare g_allLogs variable;
                    g_changeIndicator[name] = false; // Prepare change indicator variable
                } else {
                    errorMsg.push('Removed forbidden chars of filter name, and name now results in length = 0.');
                }
            }
        }
        if(!anyRuleActive) {
            errorMsg.push('No active filters (parser rules) defined in the adapter configuration.');
        }

    } else {
        errorMsg.push('No filters (parser rules) defined in the adapter configuration.');
    }

    // Verify "jsonColumns"
    if(!helper.isLikeEmpty(adapter.config.jsonColumns)) {
        g_jsonKeys = adapter.config.jsonColumns.split(',');
    } else {
        g_jsonKeys = ['date', 'severity', 'from', 'message'];
        adapter.config.jsonColumns = 'date,severity,from,message';
        adapter.log.warn('No column order in adapter configuration chosen, so we set to "date, severity, from, message"');
    }
    
    // Verify "visTables"
    if(!helper.isLikeEmpty(adapter.config.visTables)) {
        const numvisTables = parseInt(adapter.config.visTables);
        if (numvisTables > 50) {
            adapter.config.visTables = 50;
            adapter.log.warn('Configuration corrected: More than 50 VIS views is not allowed, so set to 50.');
        } else if (numvisTables < 0) {
            adapter.config.visTables = 0;
            adapter.log.warn('Configuration corrected: More than 50 VIS views is not allowed, so set to 50.');            
        } else {
            adapter.config.visTables = numvisTables;
        }
    } else {
        adapter.config.visTables = 0;
        adapter.log.warn('No VIS view number provided in settings, so set to 0.');
    }

    // Verify "updateInterval"
    if(!helper.isLikeEmpty(adapter.config.updateInterval)) {
        const uInterval = parseInt(adapter.config.updateInterval);
        if (uInterval < g_minUpdateInterval) {
            adapter.config.updateInterval = g_minUpdateInterval;
            adapter.log.warn('Configuration corrected: Update interval < ' + g_minUpdateInterval + ' seconds is not allowed, so set to ' + g_minUpdateInterval + ' seconds.');
        } else {
            adapter.config.updateInterval = uInterval;
        }
    } else {
        adapter.config.updateInterval = g_defaultUpdateInterval;
        adapter.log.warn('No update interval was provided in settings, so set to 20 seconds.');
    }

    // Verify "maxLogs"
    if(!helper.isLikeEmpty(adapter.config.maxLogs)) {
        const maxLogs = parseInt(adapter.config.maxLogs);
        if (maxLogs < 1) {
            adapter.config.maxLogs = 1;
            adapter.log.warn('Configuration corrected: maxLogs < 1 is not allowed, so set to 1.');
        } else if (maxLogs > 500) {
            adapter.config.maxLogs = 500;
            adapter.log.warn('Configuration corrected: maxLogs > 500 is not allowed, so set to 500');
        } else {
            adapter.config.maxLogs = maxLogs;
        }
    } else {
        adapter.config.maxLogs = 100;
        adapter.log.warn('No maxLogs number was provided in settings, so set to 100.');
    }

    // Verify and convert "g_globalBlacklist"
    if(!helper.isLikeEmpty(adapter.config.globalBlacklist)) {
        for (const lpConfBlacklist of adapter.config.globalBlacklist) {
            if(lpConfBlacklist.active) {
                if (!helper.isLikeEmpty(lpConfBlacklist.item)) {
                    // See description of function convertRegexpString().
                    g_globalBlacklist.push(helper.convertRegexpString(lpConfBlacklist.item));
                }
            }
        }
    }

    // Finalize
    let success;
    if (errorMsg.length == 0) {
        success = true;
    } else {
        success = false;
        adapter.log.warn(errorMsg.length + ' configuration error(s): ' + errorMsg.join('; '));
    }
    if (typeof callback === 'function') { // execute if a function was provided to parameter callback
        return callback(success);
    } else {
        return success;
    }    
}


/**
 * Build arrays of objects which we need to create.
 * Also, we delete states no longer needed.
 * @return {object} Array if arrays containing: [string:Statepath, boolean:forceCreation, object:common]
 */
function prepareAdapterObjects() {

    const finalStates = [];

    /*********************************
     * A: Build all states needed
     *********************************/
    // Regular states for each filter
    for (const lpFilterName of g_activeFilters) {
        finalStates.push(['filters.' + lpFilterName + '.name', false, {name:'Name', type:'string', read:true, write:false, role:'text', def:lpFilterName }]);
        finalStates.push(['filters.' + lpFilterName + '.json', false, {name:'JSON', type:'string', read:true, write:false, role:'json', def:'[]' }]);
        finalStates.push(['filters.' + lpFilterName + '.jsonCount', false, {name:'Number of log lines in json', type:'number', read:true, write:false, role:'value', def:0 }]);
        finalStates.push(['filters.' + lpFilterName + '.emptyJson', false, {name:'Empty the json state', type:'boolean', read:false, write:true, role:'button', def:false }]);
        finalStates.push(['filters.' + lpFilterName + '.mostRecentLogTime', false, {name:'Date/time of most recent log (timestamp)', type:'number', read:true, write:false, role:'value.time', def:0 }]);
    }

    // General states
    finalStates.push(['emptyAllJson', false, {name:'Empty all json states', type:'boolean', read:false, write:true, role:'button', def:false }]);
    finalStates.push(['forceUpdate', false, {name:'Force updating all states immediately', type:'boolean', read:false, write:true, role:'button', def:false }]);
    finalStates.push(['lastTimeUpdated', false, {name:'Date/time of last update (timestamp)', type:'number', read:true, write:false, role:'value.time', def:0 }]);

    // States for VIS tables
    if(parseInt(adapter.config.visTables) > 0) {
        const dropdown = {};
        for (const lpFilterName of g_activeFilters) {
            dropdown[lpFilterName] = lpFilterName;
        }
        for (let i = 0; i < parseInt(adapter.config.visTables); i++) {
            const lpVisTable = 'visualization.table' + (i);
            finalStates.push( [lpVisTable + '.selection', true, {name:'Selected log filter', type:'string', read:false, write:true, role:'value', states:dropdown, def:g_activeFilters[0] }]);
            finalStates.push([lpVisTable + '.json', false, {name:'JSON of selection', type:'string', read:true, write:false, role:'json', def:'[]' }]);
            finalStates.push([lpVisTable + '.jsonCount', false, {name:'Number of log lines in json of selection', type:'number', read:true, write:false, role:'value', def:0 }]);
            finalStates.push([lpVisTable + '.mostRecentLogTime', false, {name:'Date/time of most recent log of selection', type:'number', read:true, write:false, role:'value.time', def:0 }]);
            finalStates.push([lpVisTable + '.emptyJson', false, {name:'Empty the json state of selection', type:'boolean', read:false, write:true, role:'button', def:false }]);
        }
    }

    /*********************************
     * B: Delete all objects which are no longer used.
     *********************************/

    // Let's get all states and devices, which we still need, into an array
    const statesUsed = [];
    for (const lpStateObj of finalStates) {
        const lpState = lpStateObj[0].toString(); // like: "_visualization.table1.selection"
        statesUsed.push(adapter.namespace + '.' + lpState);
    }

    // Next, delete all states no longer needed.
    adapter.getStatesOf(function(err, result) {
        if (result != undefined) {
            for (const lpState of result) {
                const statePath = lpState._id;
                if (statesUsed.indexOf(statePath) == -1) {
                    // State is no longer used.
                    adapter.log.info('Delete state [' + statePath + '], since it is no longer used.');
                    adapter.delObject(statePath); // Delete state.
                }
            }
        }
    });

    return finalStates;

}




/**************************************************************************************************************************************
 * DONE. Here comes all the rest needed for an adapter.
 * This is basically from the adapter creator. Our modifications/additions:
 *  - rename utils to g_ioBrokerUtils
 *  - add killIntervalTimers() and clearTimeout for g_midnightTimeoutTimer
 *  - add call of stateChanges() function
 *  - changed logs from info to debug severity
 **************************************************************************************************************************************/

/**
 * Starts the adapter instance
 * @param {Partial<ioBroker.AdapterOptions>} [options]
 */
function startAdapter(options) {
    // Create the adapter and define its methods
    return adapter = g_ioBrokerUtils.adapter(Object.assign({}, options, {
        name: 'logparser',

        // The ready callback is called when databases are connected and adapter received configuration.
        // start here!
        ready: main, // Main method defined below for readability

        // is called when adapter shuts down - callback has to be called under any circumstances!
        unload: (callback) => {
            helper.killIntervalTimers(g_intervalTimers); // Ending all interval timers...
            if (g_midnightTimeoutTimer) clearTimeout(g_midnightTimeoutTimer);
            g_midnightTimeoutTimer = null;
            try {
                adapter.log.info('cleaned everything up...');
                callback();
            } catch (e) {
                callback();
            }
        },

        // is called if a subscribed object changes
        objectChange: (id, obj) => {
            if (obj) {
                // The object was changed
                adapter.log.debug(`object ${id} changed: ${JSON.stringify(obj)}`);
            } else {
                // The object was deleted
                adapter.log.debug(`object ${id} deleted`);
            }
        },

        // is called if a subscribed state changes
        stateChange: (id, state) => {
            stateChanges(id, state); // Mic-M
            if (state) {
                // The state was changed
                adapter.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
            } else {
                // The state was deleted
                adapter.log.debug(`state ${id} deleted`);
            }
        },

    }));
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export startAdapter in compact mode
    module.exports = startAdapter;
} else {
    // otherwise start the instance directly
    startAdapter();
}