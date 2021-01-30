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

const NONCONFORMING = "NONCONFORMING";
const NOTAPPLICABLE = "NOTAPPLICABLE";
const CONFORMING = "CONFORMING";

function _check(_deviceHelper) {

	const debug = (message) => {
		if (typeof message  === "string") {
			message = String(message);
			_deviceHelper.debug(message);
		}
	};

	const _toNative = (o) => {
		if (o == null || typeof o === "undefined") {
			return null;
		}
		if (typeof o === "object" && (o instanceof Array || o.class.toString().match(/^class \[/))) {
			return o.map(_toNative);
		}
		if (typeof o === "object") {
			const m = {};
			Object.entries(o).forEach(([k, v]) => {
				m[k] = _toNative(v);
			});
			return m;
		}
		return o;
	};

	const device = {
	
		get(key, id) {
			if (typeof key === "string") {
				key = String(key);
				if (typeof id === "undefined") {
					return _toNative(_deviceHelper.get(key));
				}
				else if (typeof id === "number" && !isNaN(id)) {
					return _toNative(_deviceHelper.get(key, id));
				}
				else if (typeof id === "string") {
					const name = String(id);
					return _toNative(_deviceHelper.get(key, name));
				}
				else {
					throw "Invalid device id to retrieve data from.";
				}
			}
			throw "Invalid key to retrieve.";
		},

		nslookup(host) {
			if (typeof host === "string") {
				return _toNative(_deviceHelper.nslookup(String(host)));
			}
			throw "Invalid host to resolve.";
		},
		
		findSections(text, regex) {
			if (typeof text !== "string") {
				throw "Invalid text string in findSections.";
			}
			if (typeof regex !== "object" || !(regex instanceof RegExp)) {
				throw "Invalid regex parameter in findSections.";
			}
			const sections = [];
			let section;
			let indent = -1;
			const lines = text.split(/[\r\n]+/g);
			lines.forEach((line) => {
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
			});
			sections.forEach((section) => {
				section.config = section.lines.join("\n");
			});
			return sections;
		}
	};


	const r = check(device, debug);

	if (typeof r === "string") {
		return {
			result: String(r),
			comment: "",
		};
	}
	return r;
}