var NONCONFORMING = "NONCONFORMING";
var NOTAPPLICABLE = "NOTAPPLICABLE";
var CONFORMING = "CONFORMING";

function _check(provider) {

	var debug = function(message) {
		if (typeof(message) == "string") {
			message = String(message);
			provider.debug(message);
		}
	};

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

	var device = {
	
		get: function(key, id) {
			if (typeof(key) == "string") {
				key = String(key);
				if (typeof(id) == "undefined") {
					return _toNative(provider.get(key));
				}
				else if (typeof(id) == "number" && !isNaN(id)) {
					return _toNative(provider.get(key, id));
				}
				else if (typeof(id) == "string") {
					var name = String(id);
					return _toNative(provider.get(key, name));
				}
				else {
					throw "Invalid device id to retrieve data from.";
				}
			}
			throw "Invalid key to retrieve.";
		},

		nslookup: function(host) {
			if (typeof(host) == "string") {
				return _toNative(provider.nslookup(String(host)));
			}
			throw "Invalid host to resolve.";
		},
		
		findSections: function(text, regex) {
			var lines = text.split(/[\r\n]+/g);
			if (typeof(text) != "string") {
				throw "Invalid text string in findSections.";
			}
			if (typeof(regex) != "object" || !(regex instanceof RegExp)) {
				throw "Invalid regex parameter in findSections.";
			}
			var sections = [];
			var section;
			var indent = -1;
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
		}

	};


	var r = check(device, debug);

	if (typeof(r) == "string") {
		r = String(r);
		return {
			result: r,
			comment: ""
		};
	}
	return r;

}