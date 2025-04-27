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

const Info = {
	name: "AudioCodesMediant",
	description: "AudioCodes Mediant MG/SBC",
	author: "Netshot Team",
	version: "1.0"
};

const Config = {
	"runningConfig": {
		type: "LongText",
		title: "Running configuration",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "# Running configuration (taken on %when%):",
			post: "# End of running configuration"
		}
	},
	"iniFile": {
		type: "LongText",
		title: "INI file",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "# INI file (taken on %when%):",
			post: "# End of INI file"
		}
	},
	"productKey": {
		type: "Text",
		title: "Product Key",
		comparable: true,
		searchable: true,
		checkable: true,
	},
	"softVersion": {
		type: "Text",
		title: "Software version",
		comparable: true,
		searchable: true,
		checkable: true
	},
};

const Device = {
	"ramSize": {
		type: "Numeric",
		title: "RAM size (MB)",
		searchable: true
	},
	"flashSize": {
		type: "Numeric",
		title: "Flash size (MB)",
		searchable: true
	},
	"coreSpeed": {
		type: "Numeric",
		title: "Core speed (MHz)",
		searchable: true
	}
};

const CLI = {
	telnet: {
		macros: {
			enable: {
				options: [ "username", "password", "enable", "disable" ],
				target: "enable"
			},
			configure: {
				options: [ "username", "password", "enable", "disable" ],
				target: "configure"
			}
		}
	},
	ssh: {
		macros: {
			disable: {
				options: [ "enable", "disable" ],
				target: "disable",
			},
			enable: {
				options: [ "enable", "disable" ],
				target: "enable"
			},
			configure: {
				options: [ "enable", "disable" ],
				target: "configure"
			}
		}
	},
	username: {
		prompt: /^Username: $/,
		macros: {
			auto: {
				cmd: "$$NetshotUsername$$",
				options: [ "password", "usernameAgain" ]
			}
		}
	},
	password: {
		prompt: /^Password: $/,
		macros: {
			auto: {
				cmd: "$$NetshotPassword$$",
				options: [ "usernameAgain", "disable", "enable" ]
			}
		}
	},
	usernameAgain: {
		prompt: /^Username: $/,
		fail: "Authentication failed - Telnet authentication failure."
	},
	disable: {
		prompt: /^([A-Za-z\-_0-9\.\/]+\> )$/,
		pager: {
			avoid: "terminal length 0",
			match: /^\s*--MORE--$/,
			response: " "
		},
		macros: {
			enable: {
				cmd: "enable",
				options: [ "enable", "disable", "enableSecret" ],
				target: "enable"
			},
			configure: {
				cmd: "enable",
				options: [ "enable", "disable", "enableSecret" ],
				target: "configure"
			}
		}
	},
	enableSecret: {
		prompt: /^Password: /m,
		macros: {
			auto: {
				cmd: "$$NetshotSuperPassword$$",
				options: [ "disable", "enable", "enableSecretAgain" ]
			}
		}
	},
	enableSecretAgain: {
		prompt: /^Password: /m,
		fail: "Authentication failed - Wrong enable password."
	},

	enable: {
		prompt: /^([A-Za-z\-_0-9\.\/]+# )$/,
		macros: {
			disable: {
				cmd: "disable",
				options: [ "disable" ],
				target: "disable"
			},
			configureNetwork: {
				cmd: "configure network",
				options: [ "enable", "configure" ],
				target: "configure"
			},
			configureSystem: {
				cmd: "configure system",
				options: [ "enable", "configure" ],
				target: "configure"
			},
			configureTroubleshoot: {
				cmd: "configure troubleshoot",
				options: [ "enable", "configure" ],
				target: "configure"
			},
			configureVoip: {
				cmd: "configure voip",
				options: [ "enable", "configure" ],
				target: "configure"
			},
			write: {
				cmd: "write",
				options: [ "enable" ],
				target: "enable"
			}
		}
	},

	configure: {
		prompt: /^([A-Za-z\-_0-9\.\/]+\(conf[0-9\-a-zA-Z]+\)# )$/,
		clearPrompt: true,
		macros: {
			exit: {
				cmd: "exit",
				options: [ "enable", "configure" ],
				target: "enable"
			}
		}
	}
};

function snapshot(cli, device, config) {

	// disable mode is enough for the commands we need
	cli.macro("disable");

	// Version info
	const showVersion = cli.command("show system version");

	const hostnameMatch = showVersion.match(/^;Board: (.+)/m);
	if (hostnameMatch) {
		device.set("name", hostnameMatch[1]);
	}

	const versionMatch = showVersion.match(/^;Software Version: (.+)/m);
	if (versionMatch) {
		device.set("softwareVersion", versionMatch[1]);
		config.set("softVersion", versionMatch[1]);
	}

	const serialMatch = showVersion.match(/^;Serial Number: (.+)/m);
	const serialNumber = serialMatch ? serialMatch[1] : undefined;
	if (serialNumber) {
		device.set("serialNumber", serialNumber);
	}

	const keyMatch = showVersion.match(/^;Product Key: (.+)/m);
	if (keyMatch) {
		config.set("productKey", keyMatch[1]);
	}

	const ramMatch = showVersion.match(/Ram size: ([0-9]+)M/m);
	if (ramMatch) {
		device.set("ramSize", parseInt(ramMatch[1]));
	}
	const flashMatch = showVersion.match(/Flash size: ([0-9]+)M/m);
	if (flashMatch) {
		device.set("flashSize", parseInt(flashMatch[1]));
	}
	const coreMatch = showVersion.match(/Core speed: ([0-9]+)Mhz/m);
	if (coreMatch) {
		device.set("coreSpeed", parseInt(coreMatch[1]));
	}

	device.set("family", "Unknown MGW/SBC");
	const hardwareMatch = showVersion.match(/^HardwareVersion: (.+)/m);
	if (hardwareMatch) {
		const hardwareVersion = hardwareMatch[1];
		const familyMatch = hardwareVersion.match(/^M(.+?)-/);
		if (familyMatch) {
			device.set("family", `Mediant ${familyMatch[1]}`);
		}
	}
	const slotMatch = showVersion.match(/^;Slot Number: ([0-9]+)/m);
	const boardSlot = slotMatch ? slotMatch[1] : undefined;

	const showAssembly = cli.command("show system assembly");
	const tableMatch = showAssembly.match(/^Board Assembly Info:[\s\r\n]*((\|.*\r?\n)*)/m);
	if (tableMatch) {
		const tableContent = tableMatch[1];
		const rowPattern = /^\| *([0-9]+) +\| (.*?) *\| (.+?) *\|/mg;
		while (true) {
			const rowMatch = rowPattern.exec(tableContent);
			if (!rowMatch) {
				break;
			}
			const module = {
				slot: rowMatch[1],
				partNumber: rowMatch[3],
			};
			if (module.slot === boardSlot && serialNumber) {
				module.serialNumber = serialNumber;
			}
			device.add("module", module);
		}
	}

	// Running-config
	const runningConfig = cli.command("show running-config");
	config.set("runningConfig", runningConfig);

	if (typeof config.computeHash === "function") {
		// Netshot 0.21+
		config.computeHash(runningConfig);
	}

	// INI file
	const iniFile = cli.command("show ini-file");
	config.set("iniFile", iniFile);

	device.set("networkClass", "ROUTER");
	// If supported on Netshot version (0.21.2+)
	device.set("networkClass", "VOICEGATEWAY");

	const contactMatch = runningConfig.match(/^\s+sys-contact "(.+)"$/m);
	device.set("contact", contactMatch ? contactMatch[1] : "");
	const locationMatch = runningConfig.match(/^\s+sys-location "(.+)"$/m);
	device.set("location", locationMatch ? locationMatch[1] : "");

	// Network interfaces
	const showIntf = cli.command("show network interface");
	const intfPattern = /^  Name: (.+)\r?\n((.*\r?\n)*?)  Uptime:/mg;
	while (true) {
		const intfMatch = intfPattern.exec(showIntf);
		if (!intfMatch) {
			break;
		}
		const ni = {
			name: intfMatch[1],
			ip: [],
		};
		const macMatch = intfMatch[2].match(/^\s*Hardware address is: ([0-9a-f-]+)/m);
		if (macMatch) {
			ni.mac = macMatch[1];
		}
		device.add("networkInterface", ni);
		const sintfPattern = /^  Name: (.+)\r?\n((    .*\r?\n)*)/mg;
		while (true) {
			const sintfMatch = sintfPattern.exec(intfMatch[2]);
			if (!sintfMatch) {
				break;
			}
			const sni = {
				name: sintfMatch[1],
				ip: [],
			};
			if (macMatch) {
				sni.mac = macMatch[1];
			}
			const ipMatch = sintfMatch[2].match(/\s*IP address: (\d+\.\d+\.\d+\.\d+)\/(\d+)/m);
			if (ipMatch) {
				sni.ip.push({
					ip: ipMatch[1],
					mask: parseInt(ipMatch[2]),
					usage: "PRIMARY",
				});
			}
			device.add("networkInterface", sni);
		}
	}
};

function analyzeSyslog(message) {
	if (message.match(/%SYS\-5\-CONFIG_I: Configured from (.*) by (.*)/)) {
		return true;
	}
	return false;
}

/**
 * As per doc the device can send entConfigChange traps.
 * Not tested.
 */
function analyzeTrap(trap, debug) {
	return trap["1.3.6.1.6.3.1.1.4.1.0"] == "1.3.6.1.2.1.47.2.0.1";
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	if (sysObjectID.startsWith("1.3.6.1.4.1.5003.8.1.1.")) {
		return true;
	}
	return false;
}
