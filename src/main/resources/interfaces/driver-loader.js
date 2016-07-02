function _connect(_cli, _protocol, _function, _device, _config) {
	
	var cli = {
		
		_mode: _protocol,
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
			this._mode = nextOne.options[_cli.lastExpectMatchIndex];
			this._strictPrompt = _cli.getLastExpectMatchGroup(1);
			if (this._mode == this._runningTarget) {
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
				throw "Couldn't switch to mode " + this._runningTarget + " using macro " + this._runningMacro + " from mode " + this._originalMode + " (reached mode " + this._mode + ").";
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
			if (clearPrompt) {
				this._strictPrompt = null;
			}
			if (typeof(this._strictPrompt) == "string") {
				var prompt = this._strictPrompt.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
				prompt = "(" + prompt + ")";
				prompts.push(prompt);
			}
			else {
				prompts.push(mode.prompt.source);
			}
			
			if (typeof(this.pagerMatch) != "undefined") {
				prompts.push(this.pagerMatch.source);
			}
			
			var result = "";
			var toSend = command;
			if (!noCr) {
			 toSend += this.CR;
		 	}
			while (true) {
				var buffer;
				if (typeof(options) == "object" && typeof(options.timeout) == "number") {
					buffer = _cli.send(toSend, prompts, timeout);
				}
				else {
					buffer = _cli.send(toSend, prompts);
				}
				if (_cli.isErrored()) {
					throw "Error while waiting for a response from the device after command '" + command + "'";
				}
				if (_cli.lastExpectMatchIndex == 1) {
					result += _cli.lastFullOutput;
					toSend = this.pagerResponse;
				}
				else {
					result += buffer;
					break;
				}
			}
			while (true) {
				var cleanResult = result.replace(/[^[\b]][\b]/, "");
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
		}
		
	};
	

	
	var debug = function(message) {
		if (typeof(message) == "string") {
			message = String(message);
			_device.debug(message);
		}
	}
	
	if (_function == "snapshot") {
		
		var config = {
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
				_config.set(key, value);
			}
		};
		
		var device = {
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
				_device.set(key, value);
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
				_device.add(collection, value);
			}
		};
		
		_device.reset();
		snapshot(cli, device, config, debug);
	}
	else if (_function == "run") {

		var device = {
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
				_device.set(key, value);
			}
		};

		if (typeof(run) != "function") {
			throw "No 'run' function";
		}
		
		run(cli, device, config, debug);
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