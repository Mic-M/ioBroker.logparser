![Logo](admin/logparser.png)
# ioBroker.logparser

[![NPM version](http://img.shields.io/npm/v/iobroker.logparser.svg)](https://www.npmjs.com/package/iobroker.logparser)
[![Downloads](https://img.shields.io/npm/dm/iobroker.logparser.svg)](https://www.npmjs.com/package/iobroker.logparser)
![Number of Installations (latest)](http://iobroker.live/badges/logparser-installed.svg)
![Number of Installations (stable)](http://iobroker.live/badges/logparser-stable.svg)
[![Dependency Status](https://img.shields.io/david/Mic-M/iobroker.logparser.svg)](https://david-dm.org/Mic-M/iobroker.logparser)
[![Known Vulnerabilities](https://snyk.io/test/github/Mic-M/ioBroker.logparser/badge.svg)](https://snyk.io/test/github/Mic-M/ioBroker.logparser)

[![NPM](https://nodei.co/npm/iobroker.logparser.png?downloads=true)](https://nodei.co/npm/iobroker.logparser/)

**Tests:** [![Travis-CI](http://img.shields.io/travis/Mic-M/ioBroker.logparser/master.svg)](https://travis-ci.org/Mic-M/ioBroker.logparser)

## logparser adapter for ioBroker

Parsing (filtering) log

## Please note

Detailed documentation will be following very soon.
For the meantime, please see [ioBroker-Log-Script](https://github.com/Mic-M/iobroker.logfile-script/blob/master/README.md). This Log Parser adapter replaces my log script entirely, and several options are similiar.



## Changelog

### 0.4.3
* (Mic-M) Fix multiple regex/string config values separated by comma

### 0.4.2
* (Mic-M) Fix issue #12 ('state is missing the required property val')
* (Mic-M) Fix issue with visualization.tableX.json and .selection. See https://forum.iobroker.net/post/408513

### 0.4.1
* (Mic-M) Fix 'Yesterday' for date, 2. Fix multiple filters, 3. Add description to settings page

### 0.4.0
* (Mic-M) Add new option "maxLength" to limit the length of each log message

### 0.3.0
* (Mic-M) initial public release

## License
MIT License

Copyright (c) 2020 Mic-M

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.