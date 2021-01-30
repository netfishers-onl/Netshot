/**
 * Copyright 2013-2021 Sylvain Cadilhac (NetFishers)
 * 
 * This file is part of Netshot.
 * 
 * Netshot is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Netshot is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Netshot.  If not, see <http://www.gnu.org/licenses/>.
 */

function _connect(_function, _protocol, _options, _logger) {
	
	var _cli = _options.getCliHelper();
	var _snmp = _options.getSnmpHelper();
	
	var _toNative = function(o) {
		if (o == null || typeof(o) == "undefined") {
			return null;
		}
		if (typeof(o) == "object" && (o instanceof Array || o.class.toString().match(/^class \[/))) {
			var l = [];
			for (var i in o) {
				l.push(_toNative(o[i]));
			}
			return l;
		}
		if (typeof(o) == "object") {
			var m = {};
			for (var i in o) {
				m[i] = _toNative(o[i]);
			}
			return m;
		}
		return o;
	};
	
	var cli = {
		
		_mode: _protocol,
		_modeHistory: [_protocol],
		_strictPrompt: null,
		CR: "\r",
		_recursion: 0,

		_applyPager: function(mode, name) {
			var pager = mode.pager;
			if (typeof(pager) != "undefined") {
				delete this.pagerMatch;
				if (typeof(pager) != "object") throw "In CLI mode " + name + " the pager is not an object.";
				if (typeof(pager.match) != "undefined") {
					if (!(pager.match instanceof RegExp)) throw "In CLI mode " + name + " the pager match entry is not a regexp.";
					if (typeof(pager.response) != "string") throw "In CLI mode " + name + " the pager response is not a string.";
					this.pagerMatch = pager.match;
					this.pagerResponse = pager.response;
				}
				if (typeof(pager.avoid) != "undefined") {
					var avoid = pager.avoid;
					if (typeof(avoid) == "string") {
						avoid = [ avoid ];
					}
					if (typeof(avoid) != "object" || !(avoid instanceof Array)) throw "In CLI mode " + name + " invalid pager avoid command.";
					for (var c in avoid) {
						if (typeof(avoid[c]) != "string") throw "In CLI mode " + name + " invalid pager avoid command.";
						try { 
							this.command(avoid[c]);
						}
						catch(e) {
						}
					}
				}
			}
		},
		
		macro: function(macro) {
			if (this._mode == macro) return;
			this.recursion = 0;
			this._runningTarget = null;
			this._runningMacro = macro;
			this._originalMode = this._mode;
			this._macro(macro);

			if (typeof(CLI[this._mode]) != "object") throw "No mode " + this._mode + " in CLI.";
			this._applyPager(CLI[this._mode], this._mode);
		},
		
		_macro: function(macro) {
			_cli.trace("Macro '" + macro + "' was called (current mode is '" + this._mode + "').");
			if (this.recursion++ > 10) {
				throw "Too many steps while switching to a new mode.";
			}
			if (typeof(macro) != "string") throw "Invalid called macro.";
			if (typeof(CLI[this._mode]) != "object") throw "No mode " + this._mode + " in CLI.";
			if (typeof(CLI[this._mode].macros) != "object") throw "No targets array in " + this._mode + " mode in CLI.";
			var nextOne = CLI[this._mode].macros[macro];
			if (typeof(nextOne) != "object") throw "Can't find macro " + macro + " in macros of mode " + this._mode + " in CLI.";
			if (this._runningTarget == null) {
				var target = nextOne.target;
				if (typeof(target) != "string") throw "Can't find target in macro " + macro + " of mode " + this._mode + " in CLI";
				if (typeof(CLI[target]) != "object") throw "No mode " + target + " in CLI.";
				this._runningTarget = target;
			}
			var cmd;
			if (typeof(nextOne.cmd) != "undefined") {
				if (typeof(nextOne.cmd) != "string") throw "Invalid cmd in macro of mode " + this._mode + " in CLI.";
				cmd = nextOne.cmd;
			}
			var prompts = [];
			if (!(nextOne.options instanceof Array)) throw "Invalid options array in macro of mode " + this._mode + " in CLI.";
			for (var t in nextOne.options) {
				var option = nextOne.options[t];
				if (typeof(CLI[option]) != "object") throw "No mode " + option + " in CLI.";
				if (!(CLI[option].prompt instanceof RegExp)) throw "No regexp prompt in " + option + " mode in CLI.";
				prompts.push(CLI[option].prompt.source);
			}
			if (typeof(cmd) == "undefined") {
				cmd = "";
			}
			else if (nextOne.noCr !== true) {
				cmd += this.CR;
			}
			if (typeof(nextOne.waitBefore) == "number") {
				this.sleep(nextOne.waitBefore);
			}
			var output;
			if (typeof(nextOne.timeout) == "number") {
				output = _cli.send(cmd, prompts, nextOne.timeout);
			}
			else {
				output = _cli.send(cmd, prompts);
			}
			if (typeof(nextOne.waitAfter) == "number") {
				this.sleep(nextOne.waitAfter);
			}
			if (_cli.isErrored()) {
				throw "Error while running CLI macro '" + macro + "'";
			}
			if (CLI[this._mode].error instanceof RegExp) {
				var errorMatch = CLI[this._mode].error.exec(output);
				if (errorMatch) {
					var message = "CLI error returned by the device";
					if (errorMatch[1]) message += ": '" + errorMatch[1] + "'";
					message += " after command '" + command + "'";
					throw message;
				}
			}
			this._mode = nextOne.options[_cli.getLastExpectMatchIndex()];
			this._modeHistory.push(this._mode);
			this._strictPrompt = _cli.getLastExpectMatchGroup(1);
			if (this._mode == this._runningTarget) {
				_cli.trace("Reached target mode '" + this._mode + "'.");
				return;
			}
			if (typeof(CLI[this._mode].fail) == "string") {
				throw "In mode " + this._mode + ". " + CLI[this._mode].fail;
			}
			if (typeof(CLI[this._mode].macros) == "object" && typeof(CLI[this._mode].macros.auto) == "object") {
				this._macro("auto");
			}
			else if (typeof(CLI[this._mode].macros) == "object" && typeof(CLI[this._mode].macros[this._runningMacro]) == "object") {
				this._macro(this._runningMacro);
			}
			if (this._mode != this._runningTarget) {
				throw "Couldn't switch to mode " + this._runningTarget + " using macro " + this._runningMacro + " from mode " +
						this._originalMode + " (reached mode " + this._mode + ").";
			}
		},
		
		command: function(command, options) {
			var mode;
			var clearPrompt = false;
			var noCr = false;
			if (typeof(options) == "object" && typeof(options.mode) == "string") {
				mode = CLI[options.mode];
				if (typeof(mode) != "object") throw "No mode " + options.mode + " in CLI.";
				this._applyPager(mode, options.mode);
			}
			else if (typeof(options) == "object" && typeof(options.mode) == "object") {
				mode = options.mode;
				this._applyPager(mode, "[temp]");
			}
			else if (typeof(options) == "object" && typeof(options.mode) != "undefined") {
				throw "Invalid mode parameters in 'command' options";
			}
			else if (typeof(CLI[this._mode]) != "object") {
				throw "No mode " + this._mode + " in CLI.";
			}
			else {
				mode = CLI[this._mode];
			}
			if (!(mode.prompt instanceof RegExp)) throw "No regexp prompt in the selected mode.";
			
			var prompts = [];
			if (mode.clearPrompt === true) clearPrompt = true;
			if (typeof(options) == "object" && options.clearPrompt === true) clearPrompt = true;
			if (typeof options == "object" && options.noCr === true) noCr = true;
			if (clearPrompt) this._strictPrompt = null;
			var prompt = mode.prompt.source;
			prompt = stripPreviousMatch(prompt, this._strictPrompt);
			prompts.push(prompt);
			if (typeof(this.pagerMatch) != "undefined") {
				prompts.push(this.pagerMatch.source);
			}
			
			var result = "";
			var toSend = command;
			if (!noCr) toSend += this.CR;
			while (true) {
				var buffer;
				
				if (typeof(options) == "object" && typeof(options.timeout) == "number") {
					buffer = _cli.send(toSend, prompts, options.timeout);
				}
				else {
					buffer = _cli.send(toSend, prompts);
				}
				if (_cli.isErrored()) {
					throw "Error while waiting for a response from the device after command '" + command + "'";
				}
				if (_cli.getLastExpectMatchIndex() == 1) {
					result += _cli.lastFullOutput;
					toSend = this.pagerResponse;
				}
				else {
					result += buffer;
					break;
				}
			}
			while (true) {
				var cleanResult = result.replace(/[^\b][\b]/, "");
				cleanResult = cleanResult.replace(/.*\r(.+)/, "$1");
				if (cleanResult == result) {
					break;
				}
				result = cleanResult;
			}
			result = _cli.removeEcho(result, command);
			if (mode.error instanceof RegExp) {
				var errorMatch = mode.error.exec(result);
				if (errorMatch) {
					var message = "CLI error returned by the device";
					if (errorMatch[1]) message += ": '" + errorMatch[1] + "'";
					message += " after command '" + command + "'";
					throw message;
				}
			}
			return result;
		},
		
		findSections: function(text, regex) {
			if (typeof(text) != "string") {
				throw "Invalid text string in findSections.";
			}
			if (typeof(regex) != "object" || !(regex instanceof RegExp)) {
				throw "Invalid regex parameter in findSections.";
			}
			var sections = [];
			var section;
			var indent = -1;
			var lines = text.split(/[\r\n]+/g);
			for (var l in lines) {
				var line = lines[l];
				var i = line.search(/[^\t\s]/);
				if (i > indent) {
					if (indent > -1) {
						section.lines.push(line);
					}
				}
				else {
					indent = -1;
				}
				if (indent == -1) {
					regex.lastIndex = 0;
					var match = regex.exec(line);
					if (match) {
						indent = i;
						section = {
							match: match,
							lines: []
						};
						sections.push(section);
					}
				}
			}
			for (var s in sections) {
				sections[s].config = sections[s].lines.join("\n");
			}
			return sections;
		},
		
		sleep: function(millis) {
			if (typeof(millis) != "number") {
				throw "Invalid number of milliseconds in sleep.";
			}
			if (millis < 0) {
				throw "The number of milliseconds to wait can't be negative in sleep.";
			}
			if (millis % 1 !== 0) {
				throw "The number of milliseconds to wait must be integer in sleep.";
			}
			_cli.sleep(millis);
		},

		debug: function(message) {
			if (typeof(message) == "string") {
				message = String(message);
				_logger.debug(message);
			}
		}
		
	};


	var poller = {
		get: function(oid) {
			if (typeof(oid) == "string") {
				oid = String(oid);
			}
			else {
				throw "The OID should be a string in poller.get.";
			}
			var result = _snmp.getAsString(oid);
			if (_snmp.isErrored()) {
				throw "Error while SNMP polling OID " + oid;
			}
			return result;
		},

		walk: function(oid, reindex) {
			if (typeof(oid) == "string") {
				oid = String(oid);
			}
			else {
				throw "The OID should be a string in poller.walk.";
			}
			var results = _snmp.walkAsString(oid);
			if (_snmp.isErrored()) {
				throw "Error while SNMP polling OID " + oid;
			}
			var m = {};
			for (var r in results) {
				if (reindex) {
					if (r.startsWith(oid + ".")) {
						m[r.slice(oid.length + 1)] = results[r];
					}
				}
				else {
					m[r] = results[r];
				}
			}
			return m;
		},

		sleep: function(millis) {
			if (typeof(millis) != "number") {
				throw "Invalid number of milliseconds in sleep.";
			}
			if (millis < 0) {
				throw "The number of milliseconds to wait can't be negative in sleep.";
			}
			if (millis % 1 !== 0) {
				throw "The number of milliseconds to wait must be integer in sleep.";
			}
			_snmp.sleep(millis);
		}
	};
	
	var stripPreviousMatch = function(prompt, strictPrompt) {
		if (typeof(strictPrompt) == "string") {
			var groups = [];
			for (var p = 0; p < prompt.length; p++) {
				if (prompt[p] === '(') {
					groups.push({ start: p });
				}
				else if (prompt[p] === ')') {
					for (var g = groups.length; g > 0; g--) {
						if (typeof groups[g - 1].end == "undefined") {
							groups[g - 1].end = p;
							break;
						}
					}
				}
			}
			for (var i = 0; i < groups.length; i++) {
				var s = groups[i].start;
				var e = groups[i].end;
				if (prompt.substr(s, 3) === '(?:') continue;
				prompt = prompt.substr(0, s + 1) + strictPrompt.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")
				  + prompt.substr(e);
				break;
			}
		}
		return prompt;
	};
	
	var debug = function(message) {
		if (typeof(message) == "string") {
			message = String(message);
			_logger.debug(message);
		}
	};
	
	var deviceHelper = {
		set: function(key, value) {
			if (typeof(key) == "string") {
				key = String(key);
			}
			else {
				throw "The key should be a string in device.set.";
			}
			if (typeof(value) == "undefined") {
				throw "Undefined value used in device.set, for key " + key + ".";
			}
			else if (typeof(value) == "string") {
				value = String(value);
			}
			_options.getDeviceHelper().set(key, value);
		},
		add: function(collection, value) {
			if (typeof(collection) == "string") {
				collection = String(collection);
			}
			else {
				throw "The collection should be a string in device.add.";
			}
			if (typeof(value) == "undefined") {
				throw "Undefined value used in device.add, for collection " + collection + ".";
			}
			else if (typeof(value) == "object") {
				value["__"] = {};
			}
			else if (typeof(value) == "string") {
				value = String(value);
			}
			_options.getDeviceHelper().add(collection, value);
		},
		get: function(key, id) {
			if (typeof(key) == "string") {
				key = String(key);
				if (typeof(id) == "undefined") {
					return _toNative(_options.getDeviceHelper().get(key));
				}
				else if (typeof(id) == "number" && !isNaN(id)) {
					return _toNative(_options.getDeviceHelper().get(key, id));
				}
				else if (typeof(id) == "string") {
					var name = String(id);
					return _toNative(_options.getDeviceHelper().get(key, name));
				}
				else {
					throw "Invalid device id to retrieve data from.";
				}
			}
			throw "Invalid key to retrieve.";
		},
	};
	
	var configHelper = {
		set: function(key, value) {
			if (typeof(key) == "string") {
				key = String(key);
			}
			else {
				throw "The key should be a string in config.set.";
			}
			if (typeof(value) == "undefined") {
				throw "Undefined value used in config.set, for key " + key + ".";
			}
			else if (typeof(value) == "string") {
				value = String(value);
			}
			_options.getConfigHelper().set(key, value);
		},
		download: function(key, method, fileName, storeFileName) {
			if (typeof(key) === "string") {
				key = String(key);
			}
			else {
				throw "The key should be a string in config.download.";
			}
			if (typeof(method) === "string") {
				method = String(method);
			}
			else {
				throw "The method should be a string in config.download.";
			}
			if (typeof(fileName) === "string") {
				fileName = String(fileName);
			}
			else {
				throw "The fileName should be a string in config.download.";
			}
			if (typeof(storeFileName) === "string") {
				storeFileName = String(storeFileName);
			}
			else if (typeof(storeFileName) === "undefined") {
				storeFileName = String("");
			}
			else {
				throw "The storeFileName should be a string in config.download.";
			}

			_options.getConfigHelper().download(key, method, fileName, storeFileName);
		}
	};
	
	var diagnosticHelper = {
		setKey: function(key) {
			this.currentKey = key;
		},
		set: function(key, value) {
			if (typeof(value) == "undefined") {
				value = key;
				_options.getDiagnosticHelper().set(this.currentKey, value);
			}
			else {
				if (typeof(key) == "string") {
					key = String(key);
				}
				else {
					throw "The key should be a string in diagnostic.set.";
				}
				value = String(value);
				_options.getDiagnosticHelper().set(key, value);
			}
		}
	};

	var commandHelper = cli;
	if (_protocol == "snmp") {
		commandHelper = poller;
	}
	
	if (_function === "snapshot") {
		_options.getDeviceHelper().reset();
		snapshot(commandHelper, deviceHelper, configHelper);
	}
	else if (_function === "run") {
		if (typeof(run) != "function") {
			throw "No 'run' function";
		}
		
		run(commandHelper, deviceHelper, configHelper);
	}
	else if (_function === "diagnostics") {
		var diagnostics = _options.getDiagnosticHelper().getDiagnostics();
		for (var name in diagnostics) {
			var diagnostic = diagnostics[name];
			diagnosticHelper.setKey(name);
			if (typeof diagnostic === "function") {
				var diagnose = diagnostic;
				diagnose(commandHelper, deviceHelper, diagnosticHelper);
			}
			else {
				cli.macro(diagnostic.getMode());
				var output = cli.command(diagnostic.getCommand());
				diagnosticHelper.set(output);
			}
		}
	}
}


function _analyzeSyslog(_message, _logger) {
	if (typeof(analyzeSyslog) == "function") {
		var debug = function(message) {
			if (typeof(message) == "string") {
				_logger.debug(message);
			}
		};
		return analyzeSyslog(_message, debug);
	}
	else {
		throw "No analyzeSyslog function.";
	}
}

function _snmpAutoDiscover(_sysObjectID, _sysDesc, _logger) {
	if (typeof(snmpAutoDiscover) == "function") {
		var debug = function(message) {
			if (typeof(message) == "string") {
				_logger.debug(message);
			}
		};
		if (snmpAutoDiscover(_sysObjectID, _sysDesc, debug)) {
			return true;
		}
		else {
			return false;
		}
	}
	else {
		throw "No snmpAutoDiscover function.";
	}
}


function _analyzeTrap(_data, _logger) {
	if (typeof(analyzeTrap) == "function") {
		var data = {};
		for (var d in _data) {
			data[d] = _data[d];
		}
		var debug = function(message) {
			if (typeof(message) == "string") {
				_logger.debug(message);
			}
		};
		if (analyzeTrap(data, debug)) {
			return true;
		}
		else {
			return false;
		}
	}
	else {
		throw "No analyzeTrap function.";
	}
}