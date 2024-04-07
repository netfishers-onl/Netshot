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

var Info = {
	name: "CiscoSx",
	description: "Cisco Small Business 2/3/500 series",
	author: "NetFishers",
	version: "1.1"
};

var Config = {
	"swVersion": {
		type: "Text",
		title: "Software version",
		comparable: true,
		searchable: true,
		checkable: true
	},
	"bootVersion": {
		type: "Text",
		title: "Boot version",
		comparable: true,
		searchable: true,
		checkable: true
	},
	"runningConfig": {
		type: "LongText",
		title: "Running configuration",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "!! Running configuration (taken on %when%):",
			post: "!! End of running configuration"
		}
	}
};

var Device = {
	"hwVersion": {
		type: "Text",
		title: "Hardware version",
		searchable: true
	},
	"systemMac": {
		type: "Text",
		title: "System MAC address",
		searchable: true
	},
	"configurationSaved": {
		type: "Binary",
		title: "Configuration saved",
		searchable: true
	}
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
				target: "exec"
			}
		}
	},
	ssh: {
		macros: {
			exec: {
				options: [ "username", "password", "exec" ],
				target: "exec"
			},
			configure: {
				options: [ "username", "password", "exec" ],
				target: "exec"
			}
		}
	},
	username: {
		prompt: /^User Name:\s?$/,
		macros: {
			auto: {
				cmd: "$$NetshotUsername$$",
				options: [ "password", "usernameAgain" ]
			}
		}
	},
	password: {
		prompt: /^Password:\s?$/,
		macros: {
			auto: {
				cmd: "$$NetshotPassword$$",
				options: [ "usernameAgain", "exec" ]
			}
		}
	},
	usernameAgain: {
		prompt: /^User Name:\s?$/,
		fail: "Authentication failed - Authentication failure."
	},
	exec: {
		prompt: /^([A-Za-z\-_0-9\.\/]+#)$/,
		error: /^% (.*)/m,
		pager: {
			avoid: "terminal datadump",
			match: /^More: <space>,.*/,
			response: " "
		},
		macros: {
			configure: {
				cmd: "configure terminal",
				options: [ "exec", "configure" ],
				target: "configure"
			},
			save: {
				cmd: "copy running-config startup-config",
				options: [ "exec", "saveOverwrite" ],
				target: "exec"
			}
		}
	},
	saveOverwrite: {
		prompt: /Overwrite file \[startup config\].*/,
		macros: {
			auto: {
				cmd: "Y",
				options: [ "exec" ]
			}
		}
	},
	configure: {
		prompt: /^([A-Za-z\-_0-9\.\/]+\(conf[0-9\-a-zA-Z]+\)#)$/,
		error: /^% (.*)/m,
		clearPrompt: true,
		macros: {
			end: {
				cmd: "end",
				options: [ "exec", "configure" ],
				target: "exec"
			}
		}
	}
};

function snapshot(cli, device, config) {

	cli.macro("exec");
	const runningConfig = cli.command("show running-config");
	config.set("runningConfig", runningConfig);

	const startupConfig = cli.command("show startup-config");
	const configSaved = (startupConfig === runningConfig);
	device.set("configurationSaved", configSaved);

	const showVersion = cli.command("show version");
	const showSystem = cli.command("show system");

	const hostname = showSystem.match(/^System Name:\s+(.+)$/m);
	if (hostname) {
		device.set("name", hostname[1]);
	}

	const swVersion = showVersion.match(/^SW version\s+([0-9\.]+)/m);
	if (swVersion) {
		device.set("softwareVersion", swVersion[1]);
		config.set("swVersion", swVersion[1]);
	}

	const bootVersion = showVersion.match(/^Boot version\s+([0-9\.]+)/m);
	if (bootVersion) {
		config.set("bootVersion", bootVersion[1]);
	}

	const hwVersion = showVersion.match(/^HW version\s+([0-9A-Za-z\.]+)$/m);
	if (hwVersion) {
		device.set("hwVersion", hwVersion[1]);
	}

	const systemMac = showSystem.match(/^System MAC Address:\s+([0-9a-fA-F:]+)/m);
	if (systemMac) {
		device.set("systemMac", systemMac[1]);
	}

	device.set("networkClass", "SWITCH");
	device.set("family", "Small Business switch");

	const systemDesc = showSystem.match(/^System Description:\s+([0-9a-fA-F]+)/m);
	if (systemDesc) {
		device.set("family", `Cisco ${systemDesc[1]}`);
	}

	const sysContact = showSystem.match(/^System Contact:\s+(.+)/m);
	if (sysContact && !sysContact[1].match(/^\s*$/)) {
		device.set("contact", sysContact[1]);
	}

	const sysLocation = showSystem.match(/^System Location:\s+(.+)/m);
	if (sysLocation && !sysLocation[1].match(/^\s*$/)) {
		device.set("location", sysLocation[1]);
	}

	const showInventory = cli.command("show inventory");
	const inventoryPattern = /NAME: \"(.*)\",? +DESCR: \"(.*)\" *[\r\n]+PID: (.*?) *,? +VID: (.*),? +SN: (.*)/g;
	let match;
	while (match = inventoryPattern.exec(showInventory)) {
		const module = {
			slot: match[1],
			partNumber: match[3],
			serialNumber: match[5]
		};
		device.add("module", module);
		const partDescription = match[2];
		if (partDescription.match(/Switch/)) {
			device.set("serialNumber", module.serialNumber);
		}
	}

	const interfaces = cli.findSections(runningConfig, /^interface (.+)/m);
	interfaces.forEach((intf) => {
		const networkInterface = {
			name: intf.match[1],
			ip: []
		};
		const description = intf.config.match(/^ *description (.+)/m);
		if (description) {
			networkInterface.description = description[1];
		}
		if (intf.config.match(/^ *switchport/m)) {
			networkInterface.level3 = false;
		}
		const ipPattern = /^ *ip address (\d+\.\d+\.\d+\.\d+) (\d+\.\d+\.\d+\.\d+)( secondary)?/mg;
		while (match = ipPattern.exec(intf.config)) {
			const ip = {
				ip: match[1],
				mask: match[2],
				usage: "PRIMARY"
			};
			if (match[3] === " secondary") {
				ip.usage = "SECONDARY";
			}
			networkInterface.ip.push(ip);
		}
		const ipv6Pattern = /^ *ipv6 address ([0-9A-Fa-f:]+)\/(\d+)/mg;
		while (match = ipv6Pattern.exec(intf.config)) {
			const ip = {
				ipv6: match[1],
				mask: parseInt(match[2]),
				usage: "PRIMARY"
			};
			networkInterface.ip.push(ip);
		}
		if (networkInterface.ip.length > 0) {
			if (systemMac) {
				networkInterface.mac = systemMac[1];
			}
		}
		if (intf.config.match(/ *shutdown$/m)) {
			networkInterface.enabled = false;
		}
		device.add("networkInterface", networkInterface);
	});

};

function analyzeSyslog(message) {
	if (message.match(/%SYS\-5\-CONFIG_I: Configured from (.*) by (.*)/)) {
		return true;
	}
	return false;
}

/**
 * Not validated.
 */
function analyzeTrap(trap, debug) {
	for (var t in trap) {
		if (trap[t] === "3" && t.startsWith("1.3.6.1.4.1.9.9.43.1.1.6.1.5")) {
			return true;
		}
		if (t === "1.3.6.1.6.3.1.1.4.1.0" && trap[t] === "1.3.6.1.4.1.9.9.43.2.0.2") {
			// ccmCLIRunningConfigChanged
			return true;
		}
	}
	return false;
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	// https://www.cisco.com/c/en/us/support/docs/smb/switches/cisco-small-business-200-series-smart-switches/smb5512-cisco-small-business-switches-model-object-identifiers-oids.html
	if (sysObjectID.match(/^1\.3\.6\.1\.4\.1\.9\.6\.1\.[89][09]\..*$/)
		&& sysDesc.match(/^S[GF](200|220|250|300|302|350|500).*/)) {
		return true;
	}
	return false;
}
