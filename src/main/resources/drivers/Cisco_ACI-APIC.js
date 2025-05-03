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

/**
 * 
 * Cisco ACI APIC driver
 * In Cisco ACI the APIC is the controller(s), and devices that are controlled by them no longer 
 * operate as normal NX-OS devices, the entire configuration for the fabric is kept in the 
 * controllers, but they are also not "normal" network devices, so some shenanigans are needed
 * to get the data out.
 */

var Info = {
	name: "CiscoACIAPIC",
	description: "Cisco ACI APIC controller",
	author: "Anders",
	version: "0.9.0",
};

var Config = {
	"systemImageFile": {
		type: "Text",
		title: "System image file",
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
	},
	"cACILicense": {
		type: "LongText",
		title: "License",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "!! License information:",
			preLine: "!! ",
			post: "!! End of license information"
		}
	},
	"cACIVersions": {
		type: "LongText",
		title: "ACI Fabric software version",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "!! ACI Fabric software version:",
			preLine: "!!  ",
			post: "!! End of ACI Fabric software version"
		}
	},
	"cACISwitchFabric": {
		type: "LongText",
		title: "Switch fabric",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "!! Switch fabric:",
			preLine: "!!  ",
			post: "!! End of switch fabric"
		}
	},
};

var Device = {
	"memorySize": {
		type: "Numeric",
		title: "Memory size (MB)",
		searchable: true
	},
	"flashSize": {
		type: "Numeric",
		title: "Flash size (MB)",
		searchable: true
	},
	"configurationSaved": {
		type: "Binary",
		title: "Configuration saved",
		searchable: true
	},
	"fabricName": {
		type: "Text",
		title: "Fabric name",
		searchable: true
	},
	"fabricSize": {
		type: "Text",
		title: "Fabric size",
		searchable: true
	},
	"inbandIPv4": {
		type: "Text",
		title: "Inband IPv4 address",
		searchable: true
	},
	"inbandIPv6": {
		type: "Text",
		title: "Inband IPv6 address",
		searchable: true
	},
	"outbandIPv4": {
		type: "Text",
		title: "Outband IPv4 address",
		searchable: true
	},
	"outbandIPv6": {
		type: "Text",
		title: "Outband IPv6 address",
		searchable: true
	},
	"certificateStatus": {
		type: "Text",
		title: "Certificate status",
		searchable: true
	},
	"certificateEndDate": {
		type: "Text",
		title: "Certificate end date",
		searchable: true
	},
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
		}
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
		prompt: /^login: $/,
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
		prompt: /^login: $/,
		fail: "Authentication failed - Telnet authentication failure."
	},
	exec: {
		prompt: /^([A-Za-z\-_0-9\.]+#) $/,
		error: /^% (.*)/m,
		pager: {
			avoid: "terminal length 0",
			match: /^ --More--$/,
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
				options: [ "exec" ],
				target: "exec"
			},
			saveAll: {
				cmd: "copy running-config startup-config vdc-all",
				options: [ "exec" ],
				target: "exec"
			},
		}

	},
	configure: {
		prompt: /^([A-Za-z\-_0-9\.]+\(conf[0-9\-a-zA-Z]+\)#) $/,
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
	
	// in the controller status we are looking for the controller marked with a "*", that is the one we are logged in to, 
	// it is its number followed by "*", so if we are on controller 1, "1*" will be the line, if we are on controller 2, "2*" will the one.

	var controllerStatus = cli.command("show controller");
	var controllerId = controllerStatus.match(/^\s+([0-9]+)\*.*$/m);
	if (controllerId) {
		controllerId = controllerId[1];
	} else {
		cli.debug("No controller marked with a * in the output of 'show controller', assuming we are on controller 1");
		controllerId = 1; // assume 1 if not, since you need to have at least one controller.
	}

	// we also want to have the fabric name, and sizes. 
	var fabricName = controllerStatus.match(/^\s*Fabric Name *: (.*)$/m);
	var fabricSize = controllerStatus.match(/^\s*Operational Size *: (.*)$/m);
	if (fabricName) {
		fabricName = fabricName[1];
	} else {
		cli.debug("No fabric name in the output of 'show controller', assuming default");
		fabricName = "Default";
	}
	if (fabricSize) {
		fabricSize = fabricSize[1];
	} else {
		cli.debug("No fabric size in the output of 'show controller', assuming default");
		fabricSize = 1;
	}

	// get Controller status in detatils. 
	var controllerStatus = cli.command("show controller detail id " + controllerId);
	var name = controllerStatus.match(/^\s*Name *: (.*)$/m);
	var address = controllerStatus.match(/^\s*Address *: (.*)$/m);
	var inbandIPv4 = controllerStatus.match(/^\s*In-Band IPv4 Address *: (.*)$/m);
	var inbandIPv6 = controllerStatus.match(/^\s*In-Band IPv6 Address *: (.*)$/m);
	var outbandIPv4 = controllerStatus.match(/^\s*OOB IPv4 Address *: (.*)$/m);
	var outbandIPv6 = controllerStatus.match(/^\s*OOB IPv6 Address *: (.*)$/m);
	var serialNumber = controllerStatus.match(/^\s*Serial Number *: (.*)$/m);
	var version = controllerStatus.match(/^\s*Version *: (.*)$/m);
	var certificateStatus = controllerStatus.match(/^\s*Valid Certificate *: (.*)$/m);
	var certificateEndDate = controllerStatus.match(/^\s*Validity End *: (.*)$/m);

	if (name) {
		device.set("name", name[1]);
	}
	if (inbandIPv4) {
		device.set("inbandIPv4", inbandIPv4[1]);
	}
	if (inbandIPv6) {
		device.set("inbandIPv6", inbandIPv6[1]);
	}
	if (outbandIPv4) {
		device.set("outbandIPv4", outbandIPv4[1]);
	}
	if (outbandIPv6) {
		device.set("outbandIPv6", outbandIPv6[1]);
	}
	if (serialNumber) {
		device.set("serialNumber", serialNumber[1]);
	}
	if (certificateStatus) {
		device.set("certificateStatus", certificateStatus[1]);
	}
	if (certificateEndDate) {
		device.set("certificateEndDate", certificateEndDate[1]);
	}
	if (serialNumber) {
		device.set("serialNumber", serialNumber[1]);
	}
	if (version) {
		device.set("softwareVersion", version[1]);
	}

	device.set("networkClass", "SWITCH");
	device.set("family", "ACI Fabric");

	// Create banner for switch fabric data. 
	var switchFabricString = "!! Switch fabric: " + fabricName + " Fabric size: " + fabricSize;
	switchFabricString.concat(cli.command("show switch"));
	config.set("cACISwitchFabric", switchFabricString);
			
	var licensestatus = cli.command("show license all");
	config.set("cACILicense", licensestatus);
	
	var configCleanup = function(config) {
		var p = config.search(/^[a-z]/m);
		if (p > 0) {
			config = config.slice(p);
		}
		config = config.replace(/^\!Time.*$/mg, "");
		return config;
	};
	
	var runningConfig;
	try {
		runningConfig = cli.command("show running-config");
	}
	catch (error) {
		cli.debug("Error getting running config");
	}
	var runningDate = NaN;
	var runningDateMatch = runningConfig.match(/^# Time: (.+)/m);
	if (runningDateMatch) {
		runningDate = Date.parse(runningDateMatch[1]);
	}
	runningConfig = configCleanup(runningConfig);
	config.set("runningConfig", runningConfig);
	if (!isNaN(runningDate)) {
		device.set("configurationSaved", runningDate);
	} else {
		device.set("configurationSaved", false);
	}
	
};

function runCommands(command) {
	
}

function analyzeSyslog(message) {
	return false;
}

function analyzeTrap(trap, debug) {
	return false;
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	if (sysObjectID.substring(0, 20) == "1.3.6.1.4.1.9.1.2238" && sysDesc.match(/^APIC.*/)) {
		return true;
	}
	return false;
}
