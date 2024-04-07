/**
 * Copyright 2013-2024 Netshot
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


const validateRunScript = () => {
	if (typeof run !== "function") {
		throw "'run' is not defined or is not a function.";
	}
	if (typeof Input === "object") {
		Object.entries(Input).forEach(([inputName, inputDef]) => {
			if (typeof inputName !== "string") {
				throw "Invalid type for key in Input object";
			}
			if (!inputName.match(/^[a-zA-Z0-9_]+$/)) {
				throw `Invalid input name '${inputName}': allowed characters are {a to z, A to Z, 0 to 9, _}.`
			}
			inputDef.name = inputName;
			if (typeof inputDef.label == "undefined") {
				inputDef.label = inputDef.name;
				inputDef.label = inputDef.label[0].toUpperCase() + inputDef.label.slice(1);
			}
			if (typeof inputDef.label !== "string") {
				throw `The 'label' field in '${inputName}' input definition should be a string.`;
			}
			if (typeof inputDef.description !== "undefined") {
				if (typeof inputDef.description !== "string") {
					throw `The 'description' field in '${inputName}' input definition should be a string.`;
				}
			}
			if (typeof inputDef.optional === "undefined") {
				inputDef.optional = false;
			}
			if (typeof inputDef.optional !== "boolean") {
				throw `The 'optional' field in '${inputName}' input definition should be a boolean.`;
			}
			if (typeof inputDef.regExp !== "undefined") {
				if (typeof inputDef.regExp !== "object" || !(inputDef.regExp instanceof RegExp)) {
					throw `The 'regExp' field in '${inputName}' input definition should be a RegExp object.`;
				}
			}
		});
	}
	else if (typeof Input === "undefined") {
		// OK
	}
	else {
		throw "Input should be an object";
	}
};

const validateUserInputs = (inputs) => {
	const cleanInputs = {};
	if (typeof Input === "object") {
		Object.entries(Input).forEach(([inputName, inputDef]) => {
			const inputVal = inputs && inputs[inputName];
			if (!inputVal) {
				if (!inputDef.optional) {
					throw `${inputDef.label} is missing.`;
				}
				return;
			}
			if (typeof inputVal === "string") {
				if (inputDef.regExp) {
					if (!inputVal.match(inputDef.regExp)) {
						throw `${inputDef.label} input value is invalid (doesn't match regexp).`
					}
				}
			}
			else {
				throw `Invalid type for ${inputName} input.`;
			}
			cleanInputs[inputName] = inputVal;
		});
	}
	return cleanInputs;
};


const _validate = (_target, _options) => {
	if (_target === "runScript") {
		validateRunScript();
	}
	else if (_target === "runInputs") {
		validateRunScript();
		validateUserInputs(_options.getUserInputs());
	}
}

const _connect = (_function, _protocol, _options) => {
	
	const _cli = _options.getCliHelper();
	const _snmp = _options.getSnmpHelper();
	const _deviceHelper = _options.getDeviceHelper();
	const _logger = _options.getTaskLogger();

	const debug = (message) => {
		if (typeof message  === "string") {
			message = String(message);
			_logger.debug(message);
		}
	};

	const _toNative = function(o) {
		if (o == null || typeof(o) == "undefined") {
			return null;
		}
		if (typeof(o) == "object" && (o instanceof Array || o.class.toString().match(/^class \[/))) {
			return o.map(i => _toNative(i));
		}
		if (typeof(o) == "object") {
			return Object.entries(o).reduce((p, [k, v]) => p[k] = _toNative(v), {});
		}
		return o;
	};
	
	const cli = {
		
		_mode: _protocol,
		_modeHistory: [_protocol],
		_strictPrompt: null,
		CR: "\r",
		_recursion: 0,

		_applyPager: function(mode, name) {
			const pager = mode.pager;
			if (pager) {
				delete this.pagerMatch;
				if (typeof pager !== "object") {
					throw `In CLI mode ${name}, the pager is not an object.`;
				}
				if (pager.match) {
					if (!(pager.match instanceof RegExp)) {
						throw `In CLI mode ${name}, the pager match entry is not a RegExp.`;
					}
					if (typeof(pager.response) !== "string") {
						throw `In CLI mode ${name} the pager response is not a string.`;
					}
					this.pagerMatch = pager.match;
					this.pagerResponse = pager.response;
				}
				if (pager.avoid) {
					let avoid = pager.avoid;
					if (typeof(avoid) === "string") {
						avoid = [avoid];
					}
					if (typeof(avoid) !== "object" || !(avoid instanceof Array)) {
						throw `In CLI mode ${name}, the pager avoid command is invalid.`;
					}
					avoid.forEach((avoidCommand) => {
						if (typeof(avoidCommand) !== "string") {
							throw `In CLI mode ${name}, one of the avoid commands is invalid.`;
						}
						try { 
							this.command(avoidCommand);
						}
						catch(e) {
						}
					});
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

			if (typeof(CLI[this._mode]) !== "object") {
				throw `No mode ${this._mode} could be found in CLI object.`;
			}
			this._applyPager(CLI[this._mode], this._mode);
		},
		
		_macro: function(macro) {
			_cli.trace(`Macro '${macro}' was called (current mode is '${this._mode}').`);
			if (this.recursion++ > 10) {
				throw "Too many steps while switching to a new mode.";
			}
			if (typeof(macro) !== "string") {
				throw "Invalid called macro.";
			}
			if (typeof(CLI[this._mode]) !== "object") {
				throw `No mode ${this._mode} could be found in CLI object.`;
			}
			if (typeof(CLI[this._mode].macros) !== "object") {
				throw `No targets array in ${this._mode} mode in CLI object.`;
			}
			const nextOne = CLI[this._mode].macros[macro];
			if (typeof(nextOne) != "object") {
				throw `Cannot find macro ${macro} in macros of mode ${this._mode} in CLI object.`;
			}
			if (this._runningTarget === null) {
				const target = nextOne.target;
				if (typeof(target) !== "string") {
					throw `Cannot find target in macro ${macro} of mode ${this._mode} in CLI object.`;
				}
				if (typeof(CLI[target]) !== "object") {
					throw `No mode ${target} in CLI.`;
				}
				this._runningTarget = target;
			}
			let cmd = undefined;
			if (typeof(nextOne.cmd) !== "undefined") {
				if (typeof(nextOne.cmd) !== "string") {
					throw `Invalid 'cmd' in macro of mode ${this._mode} in CLI object.`;
				}
				cmd = nextOne.cmd;
			}
			const prompts = [];
			if (!(nextOne.options instanceof Array)) {
				throw `Invalid 'options' array in macro of mode ${this._mode} in CLI object.`;
			}
			nextOne.options.forEach((option) => {
				if (typeof option !== "string") {
					throw `Invalid option in macro of ${this._mode} in CLI object.`;
				}
				if (typeof CLI[option] !== "object") {
					throw `No mode ${option} can be found in CLI object.`;
				}
				if (!(CLI[option].prompt instanceof RegExp)) {
					throw `No regexp prompt in ${option} mode in CLI object.`;
				}
				prompts.push(CLI[option].prompt.source);
			});
			if (cmd === undefined) {
				cmd = "";
			}
			else if (nextOne.noCr !== true) {
				cmd += this.CR;
			}
			if (typeof(nextOne.waitBefore) === "number") {
				this.sleep(nextOne.waitBefore);
			}
			const output = (typeof(nextOne.timeout) === "number") ? _cli.send(cmd, prompts, nextOne.timeout) : _cli.send(cmd, prompts);
			if (typeof(nextOne.waitAfter) === "number") {
				this.sleep(nextOne.waitAfter);
			}
			if (_cli.isErrored()) {
				throw `Error while running CLI macro '${macro}'.`;
			}
			if (CLI[this._mode].error instanceof RegExp) {
				const errorMatch = CLI[this._mode].error.exec(output);
				if (errorMatch) {
					const messageParts = [];
					messageParts.push("CLI error returned by the device");
					if (errorMatch[1]) {
						messageParts.push(`: '${errorMatch[1]}'`);
					}
					messageParts.push(` after command '${command}'.`);
					const message = messageParts.join("");
					throw message;
				}
			}
			this._mode = nextOne.options[_cli.getLastExpectMatchIndex()];
			this._modeHistory.push(this._mode);
			this._strictPrompt = _cli.getLastExpectMatchGroup(1);
			if (this._mode === this._runningTarget) {
				_cli.trace(`Reached target mode '${this._mode}'.`);
				return;
			}
			if (typeof(CLI[this._mode].fail) === "string") {
				throw `In mode ${this._mode}: ${CLI[this._mode].fail}`;
			}
			if (typeof(CLI[this._mode].macros) === "object" && typeof(CLI[this._mode].macros.auto) === "object") {
				this._macro("auto");
			}
			else if (typeof(CLI[this._mode].macros) === "object" && typeof(CLI[this._mode].macros[this._runningMacro]) === "object") {
				this._macro(this._runningMacro);
			}
			if (this._mode !== this._runningTarget) {
				throw `Couldn't switch to mode ${this._runningTarget} using macro ${this._runningMacro} from mode ${this._originalMode} (reached mode ${this._mode}).`;
			}
		},
		
		command: function(command, options) {
			let mode;
			let clearPrompt = false;
			let noCr = false;
			if (typeof(options) === "object" && typeof(options.mode) === "string") {
				mode = CLI[options.mode];
				if (typeof(mode) !== "object") {
					throw `No mode ${option.mode} can be found in CLI object.`;
				}
				this._applyPager(mode, options.mode);
			}
			else if (typeof(options) === "object" && typeof(options.mode) === "object") {
				mode = options.mode;
				this._applyPager(mode, "[temp]");
			}
			else if (typeof(options) === "object" && typeof(options.mode) !== "undefined") {
				throw "Invalid mode parameters in 'command' options";
			}
			else if (typeof(CLI[this._mode]) !== "object") {
				throw `No mode ${this._mode} in CLI object.`;
			}
			else {
				mode = CLI[this._mode];
			}
			if (!(mode.prompt instanceof RegExp)) {
				throw "No regexp prompt in the selected mode.";
			}
			
			const prompts = [];
			if (mode.clearPrompt === true) {
				clearPrompt = true;
			}
			if (typeof(options) === "object" && options.clearPrompt === true) {
				clearPrompt = true;
			}
			if (typeof options === "object" && options.noCr === true) {
				noCr = true;
			}
			if (clearPrompt) {
				this._strictPrompt = null;
			}
			let prompt = mode.prompt.source;
			prompt = stripPreviousMatch(prompt, this._strictPrompt);
			prompts.push(prompt);
			if (typeof(this.pagerMatch) !== "undefined") {
				prompts.push(this.pagerMatch.source);
			}
			
			let result = "";
			let toSend = command;
			if (!noCr) {
				toSend += this.CR;
			}
			while (true) {
				let buffer;
				
				if (typeof(options) === "object" && typeof(options.timeout) === "number") {
					buffer = _cli.send(toSend, prompts, options.timeout);
				}
				else {
					buffer = _cli.send(toSend, prompts);
				}
				if (_cli.isErrored()) {
					throw `Error while waiting for a response from the device after command '${command}'`;
				}
				if (_cli.getLastExpectMatchIndex() === 1) {
					result += _cli.getLastFullOutput();
					toSend = this.pagerResponse;
				}
				else {
					result += buffer;
					break;
				}
			}
			while (true) {
				let cleanResult = result.replace(/[^\b][\b]/, "");
				cleanResult = cleanResult.replace(/.*\r(.+)/, "$1");
				if (cleanResult === result) {
					break;
				}
				result = cleanResult;
			}
			result = _cli.removeEcho(result, command);
			if (mode.error instanceof RegExp) {
				const errorMatch = mode.error.exec(result);
				if (errorMatch) {
					const messageParts = [];
					messageParts.push("CLI error returned by the device");
					if (errorMatch[1]) {
						messageParts.push(`: '${errorMatch[1]}'`);
					}
					messageParts.push(` after command '${command}'.`);
					const message = messageParts.join("");
					throw message;
				}
			}
			return result;
		},
		
		findSections: function(text, regex) {
			if (typeof(text) !== "string") {
				throw "Invalid text string in findSections.";
			}
			if (typeof(regex) !== "object" || !(regex instanceof RegExp)) {
				throw "Invalid regex parameter in findSections.";
			}
			const sections = [];
			let section;
			let indent = -1;
			const lines = text.split(/[\r\n]+/g);
			for (let l in lines) {
				const line = lines[l];
				const i = line.search(/[^\t\s]/);
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
					const match = regex.exec(line);
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
			sections.forEach((section) => {
				section.config = section.lines.join("\n");
			});
			return sections;
		},
		
		sleep: function(millis) {
			if (typeof(millis) !== "number") {
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
			debug(message);
		},
		
	};


	const poller = {
		get: function(oid) {
			if (typeof(oid) == "string") {
				oid = String(oid);
			}
			else {
				throw "The OID should be a string in poller.get.";
			}
			const result = _snmp.getAsString(oid);
			if (_snmp.isErrored()) {
				throw `Error while SNMP polling OID ${oid}`;
			}
			return result;
		},

		walk: function(oid, reindex) {
			if (typeof(oid) === "string") {
				oid = String(oid);
			}
			else {
				throw "The OID should be a string in poller.walk.";
			}
			const results = _snmp.walkAsString(oid);
			if (_snmp.isErrored()) {
				throw `Error while SNMP polling OID ${oid}`;
			}
			const resultMap = {}
			results.forEach((r) => {
				if (reindex) {
					if (r.startsWith(oid + ".")) {
						resultMap[r.slice(oid.length + 1)] = results[r];
					}
				}
				else {
					resultMap[r] = results[r];
				}
			});
			return resultMap;
		},

		sleep: function(millis) {
			if (typeof(millis) !== "number") {
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
	
	const stripPreviousMatch = (prompt, strictPrompt) => {
		if (typeof(strictPrompt) === "string") {
			const groups = [];
			for (let p = 0; p < prompt.length; p++) {
				if (prompt[p] === '(') {
					groups.push({ start: p });
				}
				else if (prompt[p] === ')') {
					for (let g = groups.length; g > 0; g--) {
						if (typeof groups[g - 1].end === "undefined") {
							groups[g - 1].end = p;
							break;
						}
					}
				}
			}
			for (let i = 0; i < groups.length; i++) {
				const s = groups[i].start;
				const e = groups[i].end;
				if (prompt.substr(s, 3) === '(?:') continue;
				prompt = prompt.substr(0, s + 1) + strictPrompt.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")
				  + prompt.substr(e);
				break;
			}
		}
		return prompt;
	};
	
	const deviceHelper = {
		set: function(key, value) {
			if (typeof(key) === "string") {
				key = String(key);
			}
			else {
				throw "The key should be a string in device.set.";
			}
			if (typeof(value) === "undefined") {
				throw `Undefined value used in device.set, for key ${key}.`;
			}
			else if (typeof(value) === "string") {
				value = String(value);
			}
			_deviceHelper.set(key, value);
		},
		add: function(collection, value) {
			if (typeof(collection) === "string") {
				collection = String(collection);
			}
			else {
				throw "The collection should be a string in device.add.";
			}
			if (typeof(value) === "undefined") {
				throw `Undefined value used in device.add, for collection ${collection}.`;
			}
			else if (typeof(value) === "object") {
				value["__"] = {};
			}
			else if (typeof(value) === "string") {
				value = String(value);
			}
			_deviceHelper.add(collection, value);
		},
		get: function(key, id) {
			if (typeof(key) === "string") {
				key = String(key);
				if (typeof(id) === "undefined") {
					return _toNative(_deviceHelper.get(key));
				}
				else if (typeof(id) === "number" && !isNaN(id)) {
					return _toNative(_deviceHelper.get(key, id));
				}
				else if (typeof(id) === "string") {
					const name = String(id);
					return _toNative(_deviceHelper.get(key, name));
				}
				else {
					throw "Invalid device id to retrieve data from.";
				}
			}
			throw "Invalid key to retrieve.";
		},
		textDownload: function(fileName, options) {
			if (typeof(fileName) === "string") {
				fileName = String(fileName);
			}
			else {
				throw "The fileName should be a string in device.textDownload.";
			}
			let method = "sftp";
			let charset = "UTF-8";
			let newSession = false;
			if (typeof options === "object") {
				if (typeof options.charset === "string") {
					charset = String(options.charset);
				}
				else if (typeof options.charset !== "undefined") {
					throw "The charset should be a string in device.textDownload";
				}
				if (typeof options.newSession === "boolean") {
					newSession = options.newSession;
				}
				else if (typeof options.newSession !== "undefined") {
					throw "Invalid option type newSession (should be a boolean) in device.textDowload";
				}
				if (options.method === "sftp" || options.method === "scp") {
					method = options.method;
				}
				else {
					throw "Invalid 'method' option in device.textDownload";
				}
			}
			else {
				throw "Invalid argument in device.textDownload";
			}
			return _deviceHelper.textDownload(method, fileName, charset, newSession);
		},
	};
	
	const configHelper = {
		set: function(key, value) {
			if (typeof(key) === "string") {
				key = String(key);
			}
			else {
				throw "The key should be a string in config.set.";
			}
			if (typeof(value) === "undefined") {
				throw `Undefined value used in config.set, for key ${key}.`;
			}
			else if (typeof(value) === "string") {
				value = String(value);
			}
			_options.getConfigHelper().set(key, value);
		},
		download: function(key, fileName, options) {
			if (typeof(key) === "string") {
				key = String(key);
			}
			else {
				throw "The key should be a string in config.download.";
			}
			if (typeof(fileName) === "string") {
				fileName = String(fileName);
			}
			else {
				throw "The fileName should be a string in config.download.";
			}
			let storeFileName = String("");
			let method = "sftp";
			let newSession = false;
			if (typeof options === "object") {
				if (typeof options.newSession === "boolean") {
					newSession = options.newSession;
				}
				else if (typeof options.newSession !== "undefined") {
					throw "Invalid option type newSession (should be a boolean) in config.download";
				}
				if (options.method === "sftp" || options.method === "scp") {
					method = options.method;
				}
				else {
					throw "Invalid 'method' option in config.download";
				}
				if (typeof options.storeFileName === "string") {
					storeFileName = String(options.storeFileName);
				}
				else if (typeof options.storeFileName !== "undefined") {
					throw "Invalid 'storeFileName' option in config.download.";
				}
			}
			else if (typeof options !== "undefined") {
				throw "Invalid type for options argument in config.download";
			}

			_options.getConfigHelper().download(key, method, fileName, storeFileName, newSession);
		}
	};
	
	const diagnosticHelper = {
		setKey: function(key) {
			this.currentKey = key;
		},
		set: function(key, value) {
			if (typeof(value) === "undefined") {
				value = key;
				_options.getDiagnosticHelper().set(this.currentKey, value);
			}
			else {
				if (typeof(key) === "string") {
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

	let commandHelper = cli;
	if (_protocol == "snmp") {
		commandHelper = poller;
	}
	
	if (_function === "snapshot") {
		_deviceHelper.reset();
		snapshot(commandHelper, deviceHelper, configHelper);
	}
	else if (_function === "run") {
		validateRunScript();
		commandHelper.userInputs = validateUserInputs(_options.getUserInputs() || {});
		run(commandHelper, deviceHelper, configHelper);
	}
	else if (_function === "diagnostics") {
		const diagnostics = _options.getDiagnosticHelper().getDiagnostics();
		for (let name in diagnostics) {
			try {
				const diagnostic = diagnostics[name];
				diagnosticHelper.setKey(name);
				if (typeof diagnostic === "function") {
					const diagnose = diagnostic;
					diagnose(commandHelper, deviceHelper, diagnosticHelper);
				}
				else {
					cli.macro(diagnostic.getMode());
					const output = cli.command(diagnostic.getCommand());
					diagnosticHelper.set(output);
				}
			}
			catch (diagError) {
				_logger.warn(`Error while running diagnostic '${name}'`);
				_logger.warn(String(diagError));
			}
		}
	}
}


const _analyzeSyslog = (_message, _logger) => {
	if (typeof(analyzeSyslog) === "function") {
		const debug = (message) => {
			if (typeof(message) === "string") {
				_logger.debug(message);
			}
		};
		return analyzeSyslog(_message, debug);
	}
	else {
		throw "No analyzeSyslog function.";
	}
}

const _snmpAutoDiscover = (_sysObjectID, _sysDesc, _logger) => {
	if (typeof(snmpAutoDiscover) === "function") {
		const debug = (message) => {
			if (typeof(message) === "string") {
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


const _analyzeTrap = (_data, _logger) => {
	if (typeof(analyzeTrap) === "function") {
		const data = { ..._data };
		const debug = (message) => {
			if (typeof(message) === "string") {
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
