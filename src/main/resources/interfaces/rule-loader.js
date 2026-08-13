/**
 * Copyright 2013-2025 Netshot
 * 
 * This file is part of Netshot project.
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

const PUBLIC_COMPLIANCE_DEVICE_MEMBERS = ["get", "nslookup", "findSections"];

/**
 * Wraps `target` in a new, frozen object exposing only bound copies of the
 * named public members - see driver-loader.js's freezeFacade for the full
 * rationale (kept as a separate, differently-named copy here since
 * rule-loader.js is evaluated as an entirely independent GraalJS source
 * from driver-loader.js, with no shared scope to reuse a common helper).
 */
function freezeComplianceFacade(target, memberNames) {
	const facade = {};
	for (const name of memberNames) {
		const member = target[name];
		if (member === undefined) {
			continue;
		}
		facade[name] = (typeof member === "function" ? member.bind(target) : member);
	}
	return Object.freeze(facade);
}

function _check(_deviceHelper) {

	const debug = (message) => {
		if (typeof message  === "string") {
			message = String(message);
			_deviceHelper.debug(message);
		}
	};

	const _toNative = (o) => o;

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


	const r = check(freezeComplianceFacade(device, PUBLIC_COMPLIANCE_DEVICE_MEMBERS), debug);

	if (typeof r === "string") {
		return {
			result: String(r),
			comment: "",
		};
	}
	return r;
}