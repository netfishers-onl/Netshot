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
	name: "HPEComware",
	description: "HPE Comware OS",
	author: "Netshot Team",
	version: "0.2"
};

const Config = {
	"cwVersion": {
		type: "Text",
		title: "Comware version",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "## Comware version:",
			preLine: "##  "
		}
	},
	"bootVersion": {
		type: "Text",
		title: "Boot version",
		comparable: true,
		searchable: true,
		checkable: true,
	},
	"currentConfig": {
		type: "LongText",
		title: "Current configuration",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "## Current configuration (taken on %when%):",
			post: "## End of current configuration"
		}
	},
	"release": {
		type: "Text",
		title: "Release",
		comparable: true,
		searchable: true,
		checkable: true
	},
};

const Device = {
};

const CLI = {
	telnet: {
		macros: {
			user: {
				options: [ "username", "password", "user" ],
				target: "user"
			},
			system: {
				options: [ "username", "password", "user", "system" ],
				target: "system"
			}
		}
	},
	ssh: {
		macros: {
			user: {
				options: [ "user" ],
				target: "user"
			},
			system: {
				options: [ "user", "system" ],
				target: "system"
			}
		}
	},
	username: {
		prompt: /^Username:$/,
		macros: {
			auto: {
				cmd: "$$NetshotUsername$$",
				options: [ "password" ]
			}
		}
	},
	password: {
		prompt: /^Password:$/,
		macros: {
			auto: {
				cmd: "$$NetshotPassword$$",
				options: [ "usernameAgain", "user" ]
			}
		}
	},
	usernameAgain: {
		prompt: /^Username:$/,
		fail: "Authentication failed - Telnet authentication failure."
	},

	user: {
		prompt: /^\x00?(<[A-Za-z\-_0-9\.]+>)$/,
		error: /^Error: /m,
		pager: {
			avoid: "screen-length disable",
			match: /^  *---- More ----$/,
			response: " "
		},
		macros: {
			system: {
				cmd: "system-view",
				options: [ "user", "system" ],
				target: "configure"
			},
			save: {
				cmd: "save",
				options: [ "user", "saveConfirm" ],
				target: "user"
			}
		}
	},
	saveConfirm: {
		prompt: /Are you sure to continue\?/,
		macros: {
			auto: {
				cmd: "y",
				options: [ "user" ]
			}
		}
	},
	
	system: {
		prompt: /^\x00*(\[(~)?[A-Za-z\-_0-9\.]+\])$/,
		error: /^Error: (.*)/m,
		clearPrompt: true,
		macros: {
			user: {
				cmd: "quit",
				options: [ "user", "system" ],
				target: "user"
			},
			commit: {
				cmd: "commit",
				options: [ "system" ],
				target: "system"
			}
		}
	}
};

function snapshot(cli, device, config) {
	
	const configCleanup = function(config) {
		return config.replace(/^\!Last configuration .*[\r\n]+/m, "");
	};
	
	cli.macro("user");
	let currentConfig = cli.command("display current-config");
	
	const author = currentConfig.match(/^\!Last configuration was updated .* by (.*)$/m);
	if (author) {
		config.set("author", author[1]);
	}
	currentConfig = configCleanup(currentConfig);
	config.set("currentConfig", currentConfig);

	const hostname = currentConfig.match(/^ *sysname (.*)$/m);
	if (hostname) {
		device.set("name", hostname[1]);
	}

	const displayVersion = cli.command("display version");

	const versionMatch = displayVersion.match(/Comware Software, Version ([0-9\.]+)/);
	const version = versionMatch ? versionMatch[1] : "Unknown";
	device.set("softwareVersion", version);
	config.set("cwVersion", version);
	const releaseMatch = displayVersion.match(/Comware Software.* Release (.*)/);
	if (releaseMatch) {
		config.set("release", releaseMatch[1]);
		device.set("softwareVersion", `${version}/${releaseMatch[1]}`);
	}
	else {
		device.set("release", "");
	}
	const bootVersionMatch = displayVersion.match(/Boot image version: ([0-9\.]+)/m);
	const bootVersion = bootVersionMatch ? bootVersionMatch[1] : "Unknown";
	config.set("bootVersion", bootVersion);

	device.set("networkClass", "SWITCHROUTER");
	
	const platformMatch = displayVersion.match(/^HPE? (.+?)(-| ).*uptime is [0-9]+ weeks/m);
	const platform = platformMatch ? platformMatch[1] : "Unknown Comware switch";
	device.set("family", platform);

	const locationMatch = currentConfig.match(/^ *snmp-agent sys-info location (.*)/m);
	device.set("location", locationMatch ? locationMatch[1] : "");
	const contactMatch = currentConfig.match(/^ *snmp-agent sys-info contact (.*)/m);
	device.set("contact", contactMatch ? contactMatch[1] : "");

	const displayDeviceManuinfo = cli.command("display device manuinfo");
	const partPattern = /(^Chassis [0-9+]:)?\n+\s*(.+):\n\s*DEVICE_NAME\s*:\s*(.+)\n\s*DEVICE_SERIAL_NUMBER\s*:\s*(.+)/mg;
	let chassis = null;
	while (true) {
		const partMatch = partPattern.exec(displayDeviceManuinfo);
		if (!partMatch) break;
		if (partMatch[1]) {
			chassis = partMatch[1];
		}
		const slot = chassis ? `${chassis} / ${partMatch[2]}` : partMatch[2];
		device.add("module", {
			slot,
			partNumber: partMatch[3],
			serialNumber: partMatch[4],
		});
	}
	
	const vrfPattern = /^ip vpn-instance (.+)/mg;
	while (true) {
		const match = vrfPattern.exec(currentConfig);
		if (!match) break;
		device.add("vrf", match[1]);
	}
	
	const interfaces = cli.findSections(currentConfig, /^interface ([^ ]+)( .+)?/m);
	for (const intf of interfaces) {
		const networkInterface = {
			name: intf.match[1],
			ip: []
		};
		const description = intf.config.match(/^ *description (.+)/m);
		if (description) {
			networkInterface.description = description[1];
		}
		const vrf = intf.config.match(/^ *ip binding vpn-instance (.+)$/m);
		if (vrf) {
			networkInterface.vrf = vrf[1];
		}
		if (intf.config.match(/^ *portswitcht$/m)) {
			networkInterface.level3 = false;
		}
		if (intf.config.match(/^ *shutdown/m)) {
			networkInterface.enabled = false;
		}
		const ipPattern = /^ *ip address (\d+\.\d+\.\d+\.\d+) (\d+\.\d+\.\d+\.\d+)( sub)?/mg;
		while (true) {
			const match = ipPattern.exec(intf.config);
			if (!match) break;
			const ip = {
				ip: match[1],
				mask: match[2],
				usage: "PRIMARY"
			};
			if (match[3] === " sub") {
				ip.usage = "SECONDARY";
			}
			networkInterface.ip.push(ip);
		}
		const fhrpPattern = /^ *(vrrp) vrid ([0-9]+) virtual-ip (\d+\.\d+\.\d+\.\d+)/mg;
		while (true) {
			const match = fhrpPattern.exec(intf.config);
			if (!match) break;
			const ip = {
				ip: match[3],
				mask: 32,
				usage: "VRRP"
			};
			networkInterface.ip.push(ip);
		}
		const ipv6Pattern = /^ *ipv6 address ([0-9A-Fa-f:]+)\/(\d+)/mg;
		while (true) {
			const match = ipv6Pattern.exec(intf.config);
			if (!match) break;
			const ip = {
				ipv6: match[1],
				mask: parseInt(match[2]),
				usage: "PRIMARY"
			};
			networkInterface.ip.push(ip);
		}
		const displayInterface = cli.command(`display interface ${networkInterface.name} | inc address|line`);
		const macAddress = displayInterface.match(/address: ([0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4})/);
		if (macAddress) {
			networkInterface.mac = macAddress[1];
		}
		device.add("networkInterface", networkInterface);
	}

};

function analyzeSyslog(message) {
	// To be confirmed
	if (message.match(/ConfigDestination=running;Configuration is changed/)) {
		return true;
	}
	return false;
}

function analyzeTrap(trap, debug) {
	// Tested on VSR1000, unable to get a trap on config changes
	return false;
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	return sysObjectID.startsWith("1.3.6.1.4.1.25506.11.1.") &&
		sysDesc.match(/Comware Platform Software/);
}
