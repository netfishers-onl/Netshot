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

var Info = {
	name: "HPEArubaOSSwitch",
	description: "HPE ArubaOS-Switch",
	author: "Netshot Team",
	version: "1.2"
};

var Config = {
	"swVersion": {
		type: "Text",
		title: "Software version",
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
	"romVersion": {
		type: "Text",
		title: "ROM version",
		searchable: true
	},
	"primaryVersion": {
		type: "Text",
		title: "Primary image version",
		searchable: true
	},
	"secondaryVersion": {
		type: "Text",
		title: "Secondary image version",
		searchable: true
	},
	"bootImage": {
		type: "Text",
		title: "Boot image",
		searchable: true
	}
};

var CLI = {
	telnet: {
		macros: {
			enable: {
				options: [ "continue", "username", "enable", "disable" ],
				target: "enable"
			},
			configure: {
				options: [ "continue", "username", "enable", "disable" ],
				target: "configure"
			}
		}
	},
	ssh: {
		macros: {
			enable: {
				options: [ "continue", "enable", "disable" ],
				target: "enable"
			},
			configure: {
				options: [ "continue", "enable", "disable" ],
				target: "configure"
			}
		}
	},
	continue: {
		prompt: /Press any key to continue/,
		macros: {
			auto: {
				cmd: "",
				options: [ "username", "disable", "enable" ]
			}
		}
	},
	username: {
		prompt: /^Username:/,
		macros: {
			auto: {
				cmd: "$$NetshotUsername$$",
				options: [ "password", "incorrectCredentials" ]
			}
		}
	},
	password: {
		prompt: /^Password:/,
		macros: {
			auto: {
				cmd: "$$NetshotPassword$$",
				options: [ "incorrectCredentials", "disable", "enable" ]
			}
		}
	},
	incorrectCredentials: {
		prompt: /Incorrect Credentials/,
		fail: "Authentication failed - Telnet authentication failure."
	},
	disable: {
		prompt: /([A-Za-z\-_0-9\.]+ ?>) $/,
		error: /^Invalid input: .*/m,
		pager: {
			avoid: [ "no pag" ],
			match: /-- MORE --, next page: Space, next line: Enter/,
			response: " "
		},
		macros: {
			enable: {
				cmd: "enable",
				options: [ "enable" ],
				target: "enable"
			},
			configure: {
				cmd: "enable",
				options: [ "enable" ],
				target: "configure"
			}
		}
	},
	enable: {
		prompt: /([A-Za-z\-_0-9\.]+ ?#) $/,
		error: /^Invalid input: .*/m,
		pager: {
			avoid: [ "no pag" ], // page or paging
			match: /-- MORE --, next page: Space, next line: Enter/,
			response: " "
		},
		macros: {
			configure: {
				cmd: "configure terminal",
				options: [ "enable", "configure" ],
				target: "configure"
			},
			save: {
				cmd: "write memory",
				options: [ "enable" ],
				target: "enable"
			}
		}
	},
	configure: {
		prompt: /([A-Za-z\-_0-9\.]+\(.+\) ?#) $/,
		error: /^Invalid input: .*/m,
		clearPrompt: true,
		macros: {
			end: {
				cmd: "end",
				options: [ "enable" ],
				target: "enable"
			}
		}
	}
};

function snapshot(cli, device, config) {
	
	cli.macro("enable");

	const showRunning = cli.command("show running-config");
	const runningConfig = showRunning.replace(/^Running configuration:\s*\n*/m, "");
	config.set("runningConfig", runningConfig);

	if (typeof config.computeHash === "function") {
		config.computeHash(runningConfig);
	}

	const showVersion = cli.command("show version");
	const showSystem = cli.command("show system");

	const nameMatch = showSystem.match(/^\s*System Name *: *(.+)/m);
	if (nameMatch) {
		device.set("name", nameMatch[1]);
	}

	const bootImageMatch = showVersion.match(/Boot Image *: *(.+?)(\s|$)/m);
	device.set("bootImage", bootImageMatch ? bootImageMatch[1] : "");
	const romVersionMatch = showSystem.match(/ROM Version *: *(.+?)(\s|$)/m);
	device.set("romVersion", romVersionMatch ? romVersionMatch[1] : "");
	const softwareMatch = showSystem.match(/Software revision *: *(.+?)(\s|$)/m);
	if (softwareMatch) {
		device.set("softwareVersion", softwareMatch[1]);
		config.set("swVersion", softwareMatch[1]);
	}
	
	const contactMatch = showSystem.match(/System Contact *: *(.+)/m);
	device.set("contact", contactMatch ? contactMatch[1] : "");
	const locationMatch = showSystem.match(/System Location *: *(.+)/m);
	device.set("location", locationMatch ? locationMatch[1] : "");

	device.set("networkClass", "SWITCH");

	const showFlash = cli.command("show flash");
	const primaryMatch = showFlash.match(/^Primary Image *: *(\d+) *([\d\/]+) *([A-Z0-9\.]+) *$/m);
	device.set("primaryVersion", primaryMatch ? primaryMatch[3] : "");
	const secondaryMatch = showFlash.match(/^Secondary Image *: *(\d+) *([\d\/]+) *([A-Z0-9\.]+) *$/m);
	device.set("secondaryVersion", secondaryMatch ? secondaryMatch[3] : "");

	device.set("family", "Avaya switch");
	let foundSerial = false;
	try {
		const showModules = cli.command("show modules");
		// Chassis: 3800-24G-PoE+-2SFP+ J9573A Serial Number: xxxxxxxxxx
		const chassisMatch = showModules.match(/Chassis: (.+) +(J.+) +Serial Number: +(.+)/);
		if (chassisMatch) {
			const model = chassisMatch[1];
			const partNumber = chassisMatch[2];
			const serialNumber = chassisMatch[3];
			const platform = model.replace(/-.*/, "");
			device.set("family", `Avaya ${platform}`);
			device.set("serialNumber", serialNumber);
			foundSerial = true;
			device.add("module", {
				slot: "Chassis",
				partNumber: `${partNumber} ${model}`,
				serialNumber,
			});
		}
	}
	catch (err) {
		cli.debug("show modules doesn't seem to be supported");
	}

	if (!foundSerial) {
		const showDhcpClient = cli.command("show dhcp client vendor-specific");
		// Vendor Class Id = HP J9773A 2530-24G-PoEP Switch
		// Vendor Class Id = Aruba JL075A 3810M-16SFP+-2-slot Switch
		const classMatch = showDhcpClient.match(/Vendor Class Id = (HP|Aruba) (J[A-Z0-9]+) (.+?)-/m);
		const serialMatch = showSystem.match(/Serial Number +: +([A-Z0-9]+)/);
		if (classMatch && serialMatch) {
			const partNumber = classMatch[2];
			const model = classMatch[3];
			const platform = model.replace(/-.*/, "");
			const serialNumber = serialMatch[1];
			device.set("family", `Avaya ${platform}`);
			device.set("serialNumber", serialNumber);
			foundSerial = true;
			device.add("module", {
				slot: "Chassis",
				partNumber: `${partNumber} ${model}`,
				serialNumber,
			});
		}
	}

	try {
		const showStackingDetail = cli.command("show stacking detail");

		// Switch(config)# show stacking detail                              

		// Stack ID         : 00013863-bbc40700                                           
																																									
		// MAC Address      : 3863bb-c40745                                               
		// Stack Topology   : Mesh                                                        
		// Stack Status     : Active                                                      
		// Split Policy     : One-Fragment-Up                                             
		// Uptime           : 0d 1h 9m                                                    
		// Software Version : KB.16.02.0000x                                              

		// Name             : Aruba-Stack-3810M
		// Contact          :                  
		// Location         :                  

		// Member ID        : 1 
		// Mac Address      : 3863bb-c40700
		// Type             : JL076A       
		// Model            : JL076A 3810M-40G-8SR-PoE+-1-slot Switch               
		// Priority         : 128                                                         
		// Status           : Commander                                                   
		// ROM Version      : KB.16.01.0005                                               
		// Serial Number    : SG4ZGYZ092                                                   
		// Uptime           : 0d 1h 10m                                                    
		// CPU Utilization  : 2%                                                           
		// Memory - Total   : 699,207,680 bytes                                            
		// Free             : 516,210,096 bytes                                            
		// Stack Ports -                                                                   
		// #1 : Active, Peer member 2                                                      
		// #2 : Active, Peer member 3                                                      
		// #3 : Active, Peer member 2                                                      
		// #4 : Active, Peer member 3                                                      

		// Member ID        : 2 
		// ...

		const memberPattern = /^Member ID *: *([0-9]+)\s*\n(.*\s*\n)*?Type *: *(J[A-Z0-9]+)\s*\n(.*\s*\n)*?Model *: *((Aruba|HP) )?(J[A-Z0-9]+) +(.+?)\s*\n(.*\s*\n)*?Serial Number *: *(.+?)\s*\n/mg;
		while (true) {
			const memberMatch = memberPattern.exec(showStackingDetail);
			if (!memberMatch) break;
			const id = memberMatch[1];
			const partNumber = memberMatch[3];
			const model = memberMatch[8];
			const serialNumber = memberMatch[10];
			const platform = model.replace(/-.*/, "");
			if (!foundSerial) {
				foundSerial = true;
				device.set("serialNumber", serial);
				device.set("family", `Avaya ${platform}`);
			}
			device.add("module", {
				slot: `Switch ${id}`,
				partNumber: `${partNumber} ${model}`,
				serialNumber,
			});
		}
	}
	catch (err) {
		cli.debug("show stacking doesn't seem to be supported");
	}

	// Switch ports
	const interfaceDescriptions = {};
	const interfaces = cli.findSections(showRunning, /^interface ([A-Za-z0-9\/]+)/m);
	for (const intf of interfaces) {
		const ifName = intf.match[1];
		const description = intf.config.match(/^\s*name "(.+)"/m);
		if (description) {
			interfaceDescriptions[ifName] = description[1];
		}
	}

	const showIntfConfig = cli.command("show interfaces config");
	const portPattern = /^ *([A-Za-z0-9\/]+?)(-.+?)? +.* | (Yes|No) .*/mg;
	while (true) {
		const portMatch = portPattern.exec(showIntfConfig);
		if (!portMatch) break;
		const ifName = portMatch[1];
		if (ifName === "Port") continue;
		const networkInterface = {
			name: ifName,
			level3: false,
			disabled: portMatch[2] !== "Yes",
		};
		if (interfaceDescriptions[ifName]) {
			networkInterface.description = interfaceDescriptions[ifName];
		}
		device.add("networkInterface", networkInterface);
	}

	// VLAN interfaces
	const vlans = cli.findSections(showRunning, /^vlan ([0-9]+)/m);
	for (const intf of vlans) {
		const ifName = `Vlan${intf.match[1]}`
		const networkInterface = {
			name: ifName,
			ip: [],
		};
		const description = intf.config.match(/^\s*name "(.+)"/m);
		if (description) {
			networkInterface.description = description[1];
		}
		const ipPattern = /^\s*ip address (\d+\.\d+\.\d+\.\d+) (\d+\.\d+\.\d+\.\d+)/mg;
		while (true) {
			const ipMatch = ipPattern.exec(intf.config);
			if (!ipMatch) break;
			const ip = {
				ip: ipMatch[1],
				mask: ipMatch[2],
				usage: "PRIMARY"
			};
			networkInterface.ip.push(ip);
		}
		const ipv6Pattern = /^\s*ipv6 address ([0-9A-Fa-f:]+)\/(\d+)/mig;
		while (true) {
			const ipMatch = ipv6Pattern.exec(intf.config);
			if (!ipMatch) break;
			const ip = {
				ipv6: ipMatch[1],
				mask: parseInt(ipMatch[2]),
				usage: "PRIMARY"
			};
			networkInterface.ip.push(ip);
		}
		device.add("networkInterface", networkInterface);
	}

};

function analyzeSyslog(message) {
	return !!message.match(/Running configuration changed by/);
}

/*
 * Trigger a snapshot upon configuration save.
 */
function analyzeTrap(trap, debug) {
	// 1.3.6.1.4.1.11.2.14.11.5.1.7.1.29.1.0.7 = hpSwitchRunningConfigChange
	return trap["1.3.6.1.6.3.1.1.4.1.0"] === "1.3.6.1.4.1.11.2.14.11.5.1.7.1.29.1.0.7";
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	if (sysObjectID.startsWith("1.3.6.1.4.1.11.2.3.7.11.") && sysDesc.match(/HP /)) {
		return true;
	}
	return false;
}
