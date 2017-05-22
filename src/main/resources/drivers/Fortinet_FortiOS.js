/**
 * Copyright 2013-2016 Sylvain Cadilhac (NetFishers)
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
	name: "FortinetFortiOS",
	description: "Fortinet FortiOS",
	author: "NetFishers",
	version: "1.4"
};

var Config = {
	"osVersion": {
		type: "Text",
		title: "FortiOS version",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "## FortiOS version:",
			preLine: "##  "
		}
	},
	"configuration": {
		type: "LongText",
		title: "Configuration",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "## Configuration (taken on %when%):",
			post: "## End of configuration"
		}
	}
};

var Device = {
	"haPeer": {
		type: "Text",
		title: "HA peer name",
		searchable: true,
		checkable: true
	}
};

var CLI = {
	telnet: {
		macros: {
			basic: {
				options: [ "login", "password", "basic" ],
				target: "basic"
			}
		}
	},
	ssh: {
		macros: {
			basic: {
				options: [ "basic" ],
				target: "basic"
			}
		}
	},
	login: {
		prompt: / login: $/,
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
				options: [ "loginAgain", "basic" ]
			}
		}
	},
	loginAgain: {
		prompt: / login: $/,
		fail: "Authentication failed - Telnet authentication failure."
	},
	basic: {
		prompt: /^([A-Za-z0-9_\-]+? (\([A-Za-z0-9_\-]+?\) )?[#$] )$/,
		pager: {
			match: /^--More-- /,
			response: " "
		},
		macros: {
		}

	}
};

function snapshot(cli, device, config, debug) {
	
	cli.macro("basic");

	var status = cli.command("get system status");
	var configuration = cli.command("show");
	config.set("configuration", configuration);
	
	var hostname = status.match(/Hostname: (.*)$/m);
	if (hostname) {
		hostname = hostname[1];
		device.set("name", hostname);
	} 

	var version = status.match(/Version: (.*) v([0-9]+.*)/);
	var family = (version ? version[1] : "FortiOS device");
	device.set("family", family);
	version = (version ? version[2] : "Unknown");
	device.set("softwareVersion", version);
	config.set("osVersion", version);

	device.set("networkClass", "FIREWALL");


	var serial = status.match(/Serial-Number: (.*)/);
	if (serial) {
		var module = {
			slot: "Chassis",
			partNumber: family,
			serialNumber: serial[1]
		};
		device.add("module", module);
		device.set("serialNumber", serial[1]);
	}
	else {
		device.set("serialNumber", "");
	}

	device.set("contact", "");
	device.set("location", "");
	var sysInfos = cli.findSections(configuration, /config system snmp sysinfo/);
	for (var s in sysInfos) {
		var contact = sysInfos[s].config.match(/set contact-info "(.*)"/);
		if (contact) {
			device.set("contact", contact[1]);
		}
		var location = sysInfos[s].config.match(/set location "(.*)"/);
		if (location) {
			device.set("location", location[1]);
		}
	}

	cli.command("config global", { clearPrompt: true });
	var getHa = cli.command("get system ha status");
	cli.command("end", { clearPrompt: true });
	var peerPattern = /^(Master|Slave) *:[0-9]+ *(.+?) *([A-Z0-9]+) [0-9]/gm;
	var match;
	while (match = peerPattern.exec(getHa)) {
		if (match[2] != hostname) {
			device.set("haPeer", match[2]);
			break;
		}
	}


	var systemInterfaceConfig = cli.findSections(configuration, /^config system interface/m);
	var vdomArp = {};
	for (var c in systemInterfaceConfig) {
		var interfaces = cli.findSections(systemInterfaceConfig[c].config, /^ *edit "(.*)"/m);
		for (var i in interfaces) {
			var networkInterface = {
				name: interfaces[i].match[1],
				ip: []
			};
			var ipAddress = interfaces[i].config.match(/set ip (\d+\.\d+\.\d+\.\d+) (\d+\.\d+\.\d+\.\d+)/);
			if (ipAddress) {
				var ip = {
					ip: ipAddress[1],
					mask: ipAddress[2],
					usage: "PRIMARY"
				};
				networkInterface.ip.push(ip);
			}
			var vdom = interfaces[i].config.match(/set vdom "(.*?)"/);
			if (vdom) {
				vdom = vdom[1];
				networkInterface.virtualDevice = vdom;
				if (typeof(vdomArp[vdom]) != "object") {
					cli.command("config vdom", { clearPrompt: true });
					cli.command("edit " + vdom, { clearPrompt: true });
					var arp = cli.command("get system arp");
					cli.command("end", { clearPrompt: true });
					vdomArp[vdom] = {};
					var arpPattern = /^(\d+\.\d+\.\d+\.\d+) +[0-9]+ +([0-9a-f:]+) (.*)/gm;
					var match;
					while (match = arpPattern.exec(arp)) {
						vdomArp[vdom][match[3]] = match[2];
					}
				}
				if (typeof(vdomArp[vdom]) == "object") {
					if (typeof(vdomArp[vdom][networkInterface.name]) == "string") {
						networkInterface.mac = vdomArp[vdom][networkInterface.name];
					}
				}
				
			}
			if (interfaces[i].config.match(/set status down/)) {
				networkInterface.disabled = true;
			}
			device.add("networkInterface", networkInterface);
		}
	}	

};

// No known log message upon configuration change

function analyzeTrap(trap, debug) {
	return trap["1.3.6.1.6.3.1.1.4.1.0"] == "1.3.6.1.4.1.12356.101.6.0.1003" ||
		trap["1.3.6.1.6.3.1.1.4.1.0"] == "1.3.6.1.2.1.47.2.0.1";
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	return (sysObjectID.substring(0, 22) == "1.3.6.1.4.1.12356.101.");
}
