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

var Info = {
	name: "CiscoIOSXR",
	description: "Cisco IOS-XR",
	author: "NetFishers",
	version: "1.7"
};

var Config = {
	"xrVersion": {
		type: "Text",
		title: "IOS-XR version",
		comparable: true,
		searchable: true
	},
	"xrPackages": {
		type: "LongText",
		title: "XR packages",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "!! IOS-XR active packages:",
			preLine: "!!  ",
			post: "!! End of XR packages"
		}
	},
	"configuration": {
		type: "LongText",
		title: "Configuration",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "!! Configuration (taken on %when%):",
			post: "!! End of configuration"
		}
	},
	"adminConfiguration": {
		type: "LongText",
		title: "Admin configuration",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "!! Admin configuration (taken on %when%):",
			post: "!! End of admin configuration"
		}
	}
};

var Device = {
};

var CLI = {
	telnet: {
		macros: {
			exec: {
				options: [ "username", "password", "exec" ],
				target: "exec"
			},
			configure: {
				options: [ "username", "password", "exec" ],
				target: "configure"
			}
		},
	},
	ssh: {
		macros: {
			exec: {
				options: [ "exec" ],
				target: "exec"
			},
			configure: {
				options: [ "exec" ],
				target: "configure"
			}
		}
	},
	username: {
		prompt: /^Username: $/,
		macros: {
			auto: {
				cmd: "$$NetshotUsername$$",
				options: [ "password" ]
			}
		}
	},
	password: {
		prompt: /^Password: $/,
		macros: {
			auto: {
				cmd: "$$NetshotPassword$$",
				options: [ "usernameAgain", "exec" ]
			}
		}
	},
	usernameAgain: {
		prompt: /^Username: $/,
		fail: "Authentication failed - Telnet authentication failure."
	},
	exec: {
		prompt: /^([A-Z0-9\/]+:[A-Za-z\-_0-9\.]+#)$/,
		error: /^% (.*)/m,
		pager: {
			avoid: [ "terminal length 0", "terminal no-timestamp", "terminal exec prompt no-timestamp" ],
			match: /^ --More--$/,
			response: " "
		},
		macros: {
			configure: {
				cmd: "configure terminal",
				options: [ "exec", "configure" ],
				target: "configure"
			}
		}

	},
	configure: {
		prompt: /^([A-Z0-9\/]+:[A-Za-z\-_0-9\.]+\(conf[0-9\-a-zA-Z]+\)#)$/,
		error: /^% (.*)/m,
		clearPrompt: true,
		macros: {
			abort: {
				cmd: "abort",
				options: [ "exec", "configure" ],
				target: "exec"
			},
			commit: {
				cmd: "commit",
				options: [ "configure" ],
				target: "configure"
			}
		}
	}
};


function snapshot(cli, device, config) {

	var configCleanup = function(config) {
		var p = config.search(/^[a-z]/m);
		if (p > 0) {
			config = config.slice(p);
		}
		return config;
	};

	cli.macro("exec");
	var runningConfig = cli.command("show running-config");

	var author = runningConfig.match(/^\!\! Last configuration change .* by (.*)$/m);
	if (author != null) {
		config.set("author", author[1]);
	}
	runningConfig = configCleanup(runningConfig);
	config.set("configuration", runningConfig);

	var adminConfig = cli.command("admin show running-config");
	adminConfig = configCleanup(adminConfig);
	config.set("adminConfiguration", adminConfig);

	var showVersion = cli.command("show version");
	var showInventory = cli.command("admin show inventory");
	showInventory += cli.command("show inventory");
	var showInstall = cli.command("admin show install active");

	var hostname = runningConfig.match(/^hostname (.+)/m);
	if (!hostname) {
		hostname = showVersion.match(/^ *(.*) uptime is/m);
	}
	if (hostname) {
		device.set("name", hostname[1]);
	}
	device.set("networkClass", "ROUTER");

	var version = showVersion.match(/^(Cisco )?IOS XR Software.*Version ([0-9\\.A-Z\\(\\):]+)/m);
	if (version != null) {
		device.set("softwareVersion", version[2]);
		config.set("xrVersion", version[2]);
	}

	device.set("family", "IOS-XR device");
	var versionDetails = showVersion.match(/^(.*) with (\d+)K(\/(\d+)K)? bytes of memory/m);
	if (versionDetails) {
		var system = versionDetails[1];
		if (system.match(/cisco 12\d\d\d.*/)) {
			device.set("family", "Cisco 12000");
		}
		else if (system.match(/cisco CRS.*/)) {
			device.set("family", "Cisco CRS");
		}
		else if (system.match(/cisco ASR9.*/)) {
			device.set("family", "Cisco ASR9000");
		}
		else if (system.match(/cisco IOS XRv Series.*/)) {
			device.set("family", "Cisco XRv");
		}
	}
	if (showVersion.match(/IOS-XRv 9000 /)) {
		device.set("family", "Cisco XRv 9000");
	}

	config.set("xrPackages", showInstall);

	var location = runningConfig.match(/^snmp-server location (.*)/m);
	if (location) {
		device.set("location", location[1]);
	}
	else {
		device.set("location", "");
	}
	var contact = runningConfig.match(/^snmp-server contact (.*)/m);
	if (contact) {
		device.set("contact", contact[1]);
	}
	else {
		device.set("contact", "");
	}

	var removeQuotes = function(info) {
		var match = info.match(/^\"(.*)\"$/);
		if (match) {
			info = match[1];
		}
		info = info.trim();
		return info;
	};
	var inventoryPattern = /NAME: (.*), +DESCR: (.*)[\r\n]+PID: (.*?) *, +VID: (.*), +SN: (.*)/g;
	var match;
	var knownModules = [];
	while (match = inventoryPattern.exec(showInventory)) {
		var module = {
			slot: removeQuotes(match[1]),
			partNumber: removeQuotes(match[3]),
			serialNumber: removeQuotes(match[5])
		};
		var existing = false;
		for (var m in knownModules) {
			if (module.slot === knownModules[m].slot &&
			    module.partNumber === knownModules[m].partNumber &&
			    module.serialNumber === knownModules[m].serialNumber) {
				existing = true;
				break;
			}
		}
		if (existing) {
			continue;
		}
		device.add("module", module);
		if (module.slot.match(/Chassis|Rack 0/)) {
			device.set("serialNumber", module.serialNumber);
			if (module.partNumber.match(/NCS-?55[0-9A-Z][0-9A-Z]/)) {
				device.set("family", "Cisco NCS5500");
			}
			else if (module.partNumber.match(/NCS-?5[0-9A-Z][0-9A-Z][0-9A-Z]/)) {
				device.set("family", "Cisco NCS5000");
			}
			else if (module.partNumber.match(/NCS-?6[0-9A-Z][0-9A-Z][0-9A-Z]/)) {
				device.set("family", "Cisco NCS6000");
			}
			else if (module.partNumber.match(/ASR-99[0-9][0-9]/)) {
				device.set("family", "Cisco ASR9000");
			}
		}
	}

	var vrfPattern = /^vrf (.+)/mg;
	while (match = vrfPattern.exec(runningConfig)) {
		device.add("vrf", match[1]);
	}

	var fhrpAddresses = {};
	var fhrpConfig = cli.findSections(runningConfig, /^ *router (hsrp|vrrp)/m);
	for (var c in fhrpConfig) {
		var usage = fhrpConfig[c].match[1].toUpperCase();
		var fhrpIntConfig = cli.findSections(fhrpConfig[c].config, /^ *interface ([^ ]+)/m);
		for (var i in fhrpIntConfig) {
			var intName = fhrpIntConfig[i].match[1];
			fhrpAddresses[intName] = [];
			var ipPattern = /^ *address (\d+\.\d+\.\d+\.\d+)( secondary)?$/mg;
			var ipMatch;
			while (ipMatch = ipPattern.exec(fhrpIntConfig[i].config)) {
				var ip = {
					ip: ipMatch[1],
					mask: 32,
					usage: usage
				};
				if (ipMatch[2] == " secondary") {
					ip.usage = "SECONDARY" + ip.usage;
				}
				fhrpAddresses[intName].push(ip);
			}
			var ipv6Pattern = /^ *address (global|linklocal) ([0-9A-Fa-f:]+)$/mg;
			var ipv6Match;
			while (ipv6Match = ipv6Pattern.exec(fhrpIntConfig[i].config)) {
				var ip = {
					ipv6: ipv6Match[2],
					mask: 128,
					usage: usage
				};
				if (ipv6Match[2] == " secondary") {
					ip.usage = "SECONDARY" + ip.usage;
				}
				fhrpAddresses[intName].push(ip);
			}
		}
	}


	var showInterfaces = cli.command("show interface | inc \", address is |line protocol\"");
	var interfaceStatuses = {};
	var ifPattern = /^([A-Za-z0-9\-\.]+) is .*, line protocol is (.+)\r?\n( +.*, address is ([0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}))?/mg;
	while (match = ifPattern.exec(showInterfaces)) {
		interfaceStatuses[match[1]] = {
			adminDown: match[2] === "administratively down",
			mac: match[4],
		};
	}

	var interfaces = cli.findSections(runningConfig, /^interface (preconfigure )?([^ ]+)( .+)?/m);
	for (var i in interfaces) {
		var ifName = interfaces[i].match[2];
		var networkInterface = {
			name: ifName,
			ip: []
		};
		var description = interfaces[i].config.match(/^ *description (.+)/m);
		if (description) {
			networkInterface.description = description[1];
		}
		var vrf = interfaces[i].config.match(/^ *vrf (.+)$/m);
		if (vrf) {
			networkInterface.vrf = vrf[1];
		}
		if (interfaces[i].config.match(/^ *shutdown$/m)) {
			networkInterface.enabled = false;
		}
		var ipPattern = /^ *ipv4 address (\d+\.\d+\.\d+\.\d+) (\d+\.\d+\.\d+\.\d+)( secondary)?/mg;
		while (match = ipPattern.exec(interfaces[i].config)) {
			var ip = {
				ip: match[1],
				mask: match[2],
				usage: "PRIMARY"
			};
			if (match[3] == " secondary") {
				ip.usage = "SECONDARY";
			}
			networkInterface.ip.push(ip);
		}
		var ipv6Pattern = /^ *ipv6 address ([0-9A-Fa-f:]+)\/(\d+)/mg;
		while (match = ipv6Pattern.exec(interfaces[i].config)) {
			var ip = {
				ipv6: match[1],
				mask: parseInt(match[2]),
				usage: "PRIMARY"
			};
			networkInterface.ip.push(ip);
		}
		var interfaceStatus = interfaceStatuses[ifName];
		if (interfaceStatus) {
			if (interfaceStatus.adminDown) {
				networkInterface.enabled = false;
			}
			if (interfaceStatus.mac) {
				networkInterface.mac = interfaceStatus.mac;
			}
		}
		var otherAddresses = fhrpAddresses[networkInterface.name];
		if (typeof(otherAddresses) == "object") {
			for (var o in otherAddresses) {
				networkInterface.ip.push(otherAddresses[o]);
			}
		}
		if ((interfaces[i].match[3] && interfaces[i].match[3].match(/l2transport/)) ||
				interfaces[i].config.match(/^ *l2transport$/m)) {
			networkInterface.level3 = false;
		}
		device.add("networkInterface", networkInterface);
	}

};

function runCommands(command) {

}

function analyzeSyslog(message) {
	if (message.match(/COMMIT : Configuration committed by user '(.*)'/)) {
		return true;
	}
	return false;
}

function analyzeTrap(trap, debug) {
	for (var t in trap) {
		if (trap[t] == "3" && t.substring(0, 28) == "1.3.6.1.4.1.9.9.43.1.1.6.1.5") {
			return true;
		}
	}
	return false;
}


function snmpAutoDiscover(sysObjectID, sysDesc) {
	if (sysObjectID.substring(0, 16) == "1.3.6.1.4.1.9.1."
		&& sysDesc.match(/^Cisco IOS XR Software.*/)) {
		return true;
	}
	return false;
}
