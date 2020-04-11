'use strict';
module.exports = {
    removePid,
    killIntervalTimers,
    createAdapterObjects,
    tsToDateString,
    dateToLocalIsoString,
    escapeRegExp,
    stringConfigListToArray,
    convertRegexpString,
    stringMatchesList,
    objArrayGetObjByVal,
    isLikeEmpty,
};



/**
 * Remove PID from log message 
 * The js-controller version 2.0+ adds the PID number inside brackets to the beginning of
 * the message, like 'javascript.0 (123) Logtext 123 Logtext 123 Logtext 123 Logtext 123'
 * @param {string} msg   The log message, like: 'javascript.0 (123) Logtext 123 Logtext 123 Logtext 123 Logtext 123'
 * @return {string}      The log message without the PID number
 */
function removePid(msg) {

    const matchesArray = msg.match(/^(\S+)\s(.*)/);
    if (matchesArray != null) {
        const partOne = matchesArray[1]; // like 'javascript.0'
        let partTwo = matchesArray[2]; // like '(123) Logtext 123 Logtext 123 Logtext 123 Logtext 123'
        partTwo = partTwo.replace(/^\([0-9]{1,9}\)\s/, ''); // Remove the PID
        msg = partOne + ' ' + partTwo; // re-build the full message without the PID
    }
    return msg;

}




/**
 * Kill All Interval Timers
 * 
 * @param {array}  timers   Array of timers
 */
function killIntervalTimers(timers) {
    if(timers) {
        for (let lpTimer of timers) {
            if (lpTimer) clearInterval(lpTimer);
            lpTimer = null;
        }
    }
}

/**
 * Create Adapter Objects
 * 
 * @param {object}  adapter     The adapter object
 * @param {array}  objects      Array of states array to create. Like [[string:State path, boolean:forceCreation, object:common]]
 * @param {object} callback     Callback function, so once all objects are created.
 * @return {object}             Callback function
 */
function createAdapterObjects(adapter, objects, callback) {

    let numStates = objects.length;
    helper();    
    /**
     * Helper function: This is a "callback loop" through a function. Inspired by https://forum.iobroker.net/post/152418
     */
    function helper() {
        numStates--;
        if (numStates >= 0) {
            if(objects[numStates][1]) {
                // Force Creation is true
                adapter.setObject(objects[numStates][0], {type:'state', common:objects[numStates][2], native: {}}, function(err, obj) {
                    if (!err && obj) adapter.log.debug('Object created (force:true): ' + objects[numStates][0]);
                    setImmediate(helper); // we call function again. We use node.js setImmediate() to avoid stack overflows.
                });
            } else {
                // Force Creation is false
                adapter.setObjectNotExists(objects[numStates][0], {type:'state', common:objects[numStates][2], native: {}}, function(err, obj) {
                    if (!err && obj) adapter.log.debug('Object created  (force:false): ' + objects[numStates][0]);
                    setImmediate(helper); // we call function again. We use node.js setImmediate() to avoid stack overflows.
                });
            }
        } else {
            // All objects processed
            return callback();
        }
    }

}

/**
 * Convert timestamp to a string and format accordingly.
 * @param {string}  ts          Timestamp
 * @param {string}  format      Like 'yyyy-mm-dd HH:MM:SS'. Both upper case and lower case letters are allowed.
 *                              If date is within hash (#), so like '#yyyy-mm-dd# HH:MM:SS', it will be replaced
 *                              with "Today"/"Yesterday" if date is today/yesterday.
 * @param {string}  [today]     String for "Today"
 * @param {string}  [yesterday] String for "Yesterday"
 * @return {string}  Returns the resulting date string
 */
function tsToDateString(ts, format, today = 'Today', yesterday = 'Yesterday') {

    const dateObj = new Date(ts);
    const isoDateStrHelper = dateToLocalIsoString(dateObj); // like: '2020-02-20T19:52:13.634'

    const todayStr = (!isLikeEmpty(today)) ? today : 'Today';
    const yesterdayStr = (!isLikeEmpty(yesterday)) ? yesterday : 'Yesterday';

    let strResult = format;

    // 1. Replace today's date and yesterday's date with adapter.config.txtToday / adapter.config.txtYesterday
    const hashMatch = strResult.match(/#(.*)#/);
    if (hashMatch != null) {
        const todayYesterdayTxt = todayYesterday(dateObj);
        if(todayYesterdayTxt != '') {
            // We have either today or yesterday, so set according txt
            strResult = strResult.replace('#'+hashMatch[1]+'#', todayYesterdayTxt);
        } else {
            // Neither today nor yesterday, so remove all ##
            strResult = strResult.replace(/#/g, '');
        }        
    }

    // 2. Replace all the rest.
    strResult = strResult.replace('YYYY', isoDateStrHelper.substr(0,4));
    strResult = strResult.replace('YY', isoDateStrHelper.substr(2,2));
    strResult = strResult.replace('MM', isoDateStrHelper.substr(5,2));
    strResult = strResult.replace('DD', isoDateStrHelper.substr(8,2));
    strResult = strResult.replace('hh', isoDateStrHelper.substr(11,2));
    strResult = strResult.replace('mm', isoDateStrHelper.substr(14,2));
    strResult = strResult.replace('ss', isoDateStrHelper.substr(17,2));
    strResult = strResult.replace('ms', isoDateStrHelper.substr(20,3));

    return strResult;

    /**
     * todayYesterday
     * @param {object} dateGiven   Date object, created with new Date()
     * @return {string}            'Heute', if today, 'Gestern' if yesterday, empty string if neither today nor yesterday
     */
    function todayYesterday(dateGiven) {
        const today = new Date();
        const yesterday = new Date(); 
        yesterday.setDate(today.getDate() - 1);
        if (dateGiven.toLocaleDateString() == today.toLocaleDateString()) {
            return todayStr;
        } else if (dateGiven.toLocaleDateString() == yesterday.toLocaleDateString()) {
            return yesterdayStr;
        } else {
            return '';
        }
    }

}




/**
 * Convert date/time to a local ISO string
 * This function is needed since toISOString() uses UTC +0 (Zulu) as time zone.
 * https://stackoverflow.com/questions/10830357/
 * Mic-M, 04/Apr/2020
 * @param {object}  date    Date object
 * @return {string}  string like "2015-01-26T06:40:36.181", without trailing Z (which would represent Zulu time zone)
 */
function dateToLocalIsoString(date) {
    const timezoneOffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    return (new Date(date.getTime() - timezoneOffset)).toISOString().slice(0, -1);
}

/**
 * Escapes a string for use in RegEx as (part of) pattern
 * Source: https://stackoverflow.com/questions/3446170/
 * @param {string}   inputStr  The input string to be escaped
 * @return {string}  The escaped string
 */
function escapeRegExp(inputStr) {
    return inputStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


/**
 * Convert a comma-separated string into array of regex objects.
 * The string can both contain strings and regex. Ex: "/script.js.[^:]*: /, ABC, +++"
 * If addGlobal = true, then an additional  global flag 'g' will be added to the string.
 * This will not affect any regex, but just limited to provided strings.
 * 
 * @param {string}  input   String
 * @param {boolean} [addGlobal=false]   If true and if it is a string, we will add the global flag 'g'
 * @return {array}          Array of white/black list items as regex
 */
function stringConfigListToArray(input, addGlobal=false) {
    const result = [];
    if(!isLikeEmpty(input)) {
        input = input.replace(/,\s/g, ','); // replace all ", " with ","
        const inputArray = input.split(','); // returns array with one element of input, if nothing to split up.
        for (const lpItem of inputArray) {
            // See description of function convertRegexpString().
            result.push(convertRegexpString(lpItem, addGlobal));
        }
    }
    return result;
}


/**
 * The adapter config allows both strings (like 'Hello world!') and regex as string, so like '/.*Hello$/i'). 
 * With this function, we convert a string recognized as regex into a RegExp type variable, and
 * if no regex recognized and it is a string, we convert the string to a regexp.
 * The return value is being used in replace function.
 * Inspired by https://stackoverflow.com/questions/874709/
 * Mic-M – 09/Apr/2020
 * 
 * @param {string}  input               The input string
 * @param {boolean} [addGlobal=false]   If true and if it is a string, we will add the global flag 'g'
 * @return {RegExp|string}              regexp or string
 */
function convertRegexpString(input, addGlobal=false) {
    const regParts = input.match(/^\/(.*?)\/([gim]*)$/);
    if (regParts) {
        // The parsed pattern had delimiters and modifiers, so it is a regex.
        return new RegExp(regParts[1], regParts[2]);
    } else {
        // No delimiters and modifiers, so it is a plain string
        // We convert to regex and do optionally apply a global to match all occurrences
        const gbl = (addGlobal) ? 'g' : '';
        return new RegExp(escapeRegExp(input), gbl);
    }
}

/**
 * Checks a string against an array of strings or regexp.
 * March 2020 | Mic-M
 * @param {string}      stringToCheck   String to check against array
 * @param {array}       listArray       Array of blacklist. Both strings and regexp are allowed.
 * @param {boolean}    all            If true, then ALL items of listArray must match to return true.
                                        If false, one match or more will return true
 * @return {boolean}    true if matching, false if not. 
 */
function stringMatchesList(stringToCheck, listArray, all) {

    if(isLikeEmpty(listArray)) return true;
    let count = 0;
    let hit = 0;
    for (const lpListItem of listArray) {
        if(! isLikeEmpty(lpListItem)) {
            count = count + 1;
            if (lpListItem instanceof RegExp) { // https://stackoverflow.com/questions/4339288/typeof-for-regexp
                // We have a regex
                if ( (stringToCheck.match(lpListItem) != null) ) {
                    hit = hit + 1;
                }
            } else if (typeof lpListItem == 'string') {
                // No regex, we have a string
                if(stringToCheck.includes(lpListItem)) {
                    hit = hit + 1;
                }
            }
        }
    }
    if (count == 0)  return true;
    if(all) {
        return (count == hit) ? true : false;
    } else {
        return (hit > 0) ? true : false;
    }

}


/**
 * Checks an array of objects for property matching value, and returns first hit.
 * Inspired: https://stackoverflow.com/questions/13964155/
 * 31 Mar 2020 | Mic-M
 * 
 * @param {array}   objects  Array of objects
 * @param {string}  key      Key name
 * @param {*}       value    Value of the key we are looking for.
 * @return {*}               Full object (so: element of array) of which property is matching value.
 *                           We return first match, assuming provided value is unique.
 *                           If not found, we return undefined.
 */
function objArrayGetObjByVal(objects, key, value) {
    const result = objects.filter(obj => {
        return obj[key] === value;
    });
    if (result.length == 0) {
        return undefined;
    } else {
        return result[0]; // we return first match, assuming provided value is unique.
    }
}


/**
 * Checks if Array or String is not undefined, null or empty.
 * Array or String containing just white spaces or >'< or >"< or >[< or >]< is considered empty
 * 08-Sep-2019: added check for [ and ] to also catch arrays with empty strings.
 * @param  {any}  inputVar   Input Array or String, Number, etc.
 * @return {boolean} True if it is undefined/null/empty, false if it contains value(s)
 */
function isLikeEmpty(inputVar) {
    if (typeof inputVar !== 'undefined' && inputVar !== null) {
        let strTemp = JSON.stringify(inputVar);
        strTemp = strTemp.replace(/\s+/g, ''); // remove all white spaces
        strTemp = strTemp.replace(/"+/g, '');  // remove all >"<
        strTemp = strTemp.replace(/'+/g, '');  // remove all >'<
        strTemp = strTemp.replace(/\[+/g, '');  // remove all >[<
        strTemp = strTemp.replace(/\]+/g, '');  // remove all >]<
        if (strTemp !== '') {
            return false;
        } else {
            return true;
        }
    } else {
        return true;
    }
}

