
var Info = {
	name: "CiscoNXOS",
	description: "Cisco NX-OS 5.x/6.x",
	author: "NetFishers",
	version: "1.1"
};

var Config = {
	"systemImageFile": {
		type: "Text",
		title: "System image file",
		comparable: true,
		searchable: true,
		checkable: true
	},
	"kickstartImageFile": {
		type: "Text",
		title: "Kickstart image file",
		comparable: true,
		searchable: true,
		checkable: true
	},
	"nxosVersion": {
		type: "Text",
		title: "NX-OS version",
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
	
	cli.macro("exec");
	var showVersion = cli.command("show version");
	
	var hostname = showVersion.match(/Device name: *(.*)/m);
	if (hostname) {
		device.set("name", hostname[1]);
	}
	var image = showVersion.match(/kickstart image file is: *(.*)/m);
	if (image) {
		config.set("kickstartImageFile", image[1]);
	}
	var image = showVersion.match(/system image file is: *(.*)/m);
	if (image) {
		config.set("systemImageFile", image[1]);
	}
	var memory = showVersion.match(/with (\d+) kB of memory/m);
	if (memory) {
		memory = parseInt(memory[1]);
		memory = Math.round(memory / 1024 / 4) * 4;
		device.set("memorySize", memory);
	}
	var flash = showVersion.match(/bootflash: *(\d+) kB/m);
	if (flash) {
		flash = parseInt(flash[1]);
		flash = Math.round(flash / 1024 / 4) * 4;
		device.set("flashSize", flash);
	}
	device.set("networkClass", "SWITCH");
	device.set("family", "Unknown NX-OS device");
	var chassis = showVersion.match(/cisco (.*?)( \(.*\))? Chassis/m);
	if (chassis) {
		device.set("family", chassis[1]);
	}
	
	var version = showVersion.match(/system: *version (.*)/m);
	if (version) {
		device.set("softwareVersion", version[1]);
		config.set("nxosVersion", version[1]);
	}
	
	var showInventory = cli.command("show inventory");
	var inventoryPattern = /NAME: \"(.*)\", +DESCR: \"(.*)\" *[\r\n]+PID: (.*?) *, +VID: (.*), +SN: (.*)/g;
	var match;
	while (match = inventoryPattern.exec(showInventory)) {
		var module = {
			slot: match[1],
			partNumber: match[3],
			serialNumber: match[5]
		};
		device.add("module", module);
		if (module.slot.match(/Chassis/)) {
			device.set("serialNumber", module.serialNumber);
		}
	}
	
	var configCleanup = function(config) {
		var p = config.search(/^[a-z]/m);
		if (p > 0) {
			config = config.slice(p);
		}
		config = config.replace(/^\!Time.*$/mg, "");
		return config;
	};
	
	
	var runningConfig = cli.command("show running-config vdc-all");

	runningConfig = configCleanup(runningConfig);
	config.set("runningConfig", runningConfig);
	
	var startupConfig = cli.command("show startup-config vdc-all");
	startupConfig = configCleanup(startupConfig);
	device.set("configurationSaved", startupConfig == runningConfig);
	
	var vdcConfigs = runningConfig.split(/[\r\n]+\!Running config for vdc: .*[\r\n]+/);
	for (var v in vdcConfigs) {
		var vdcConfig = vdcConfigs[v];
		
		var vdcName = vdcConfig.match(/^switchto vdc (.*)$/m);
		if (vdcName) {
			vdcName = vdcName[1];
			cli.command("switchto vdc " + vdcName, { clearPrompt: true });
			device.add("virtualDevice", vdcName);
		}
		else {
			vdcName = "";
			var location = vdcConfig.match(/^snmp-server location (.*)/m);
			if (location) {
				device.set("location", location[1]);
			}
			else {
				device.set("location", "");
			}
			var contact = vdcConfig.match(/^snmp-server contact (.*)/m);
			if (contact) {
				device.set("contact", contact[1]);
			}
			else {
				device.set("contact", "");
			}
		}
		
		var vrfPattern = /^^vrf context (.+)$/mg;
		while (match = vrfPattern.exec(vdcConfig)) {
			device.add("vrf", match[1]);
		}
		
		var interfaces = cli.findSections(vdcConfig, /^interface ([^ ]+)/m);
		for (var i in interfaces) {
			if (interfaces[i].match[1].match(/cmp-mgmt/)) {
				continue;
			}
			var networkInterface = {
				name: interfaces[i].match[1],
				ip: []
			};
			var description = interfaces[i].config.match(/^ *description (.+)/m);
			if (description) {
				networkInterface.description = description[1];
			}
			var vrf = interfaces[i].config.match(/^ *vrf member (.+)$/m);
			if (vrf) {
				networkInterface.vrf = vrf[1];
			}
			if (interfaces[i].config.match(/^ *switchport$/m)) {
				networkInterface.level3 = false;
			}
			var ipPattern = /^ *ip address (\d+\.\d+\.\d+\.\d+)\/(\d+)( secondary)?/mg;
			while (match = ipPattern.exec(interfaces[i].config)) {
				var ip = {
					ip: match[1],
					mask: parseInt(match[2]),
					usage: "PRIMARY"
				};
				if (match[3] == " secondary") {
					ip.usage = "SECONDARY";
				}
				networkInterface.ip.push(ip);
			}
			var fhrpGroups = cli.findSections(interfaces[i].config, /^ *(hsrp|vrrp|glbp) (\d+)/m);
			for (var g in fhrpGroups) {
				var fhrpConfig = fhrpGroups[g].config;
				var fhrpPattern = /^ *ip (\d+\.\d+\.\d+\.\d+)( secondary)?/mg;
				while (match = fhrpPattern.exec(fhrpConfig)) {
					var ip = {
						ip: match[1],
						mask: 32,
						usage: "HSRP"
					};
					if (fhrpGroups[g].match[1] == "vrrp") {
						ip.usage = "VRRP";
					}
					if (match[4] == " secondary") {
						ip.usage = "SECONDARY" + ip.usage;
					}
					networkInterface.ip.push(ip);
				}
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
			var showInterface = cli.command("show interface " + networkInterface.name + " | inc \"(address| is down)\"");
			var macAddress = showInterface.match(/([0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4})/);
			if (macAddress) {
				networkInterface.mac = macAddress[1];
			}
			if (showInterface.match(/(Administratively down|SFP not inserted)/)) {
				networkInterface.enabled = false;
			}
			if (vdcName != "") {
				networkInterface.virtualDevice = vdcName;
			}
			device.add("networkInterface", networkInterface);
		}
		
		if (vdcName != "") {
			cli.command("switchback", { clearPrompt: true });
		}
		
	}

};

function runCommands(command) {
	
}

function analyzeSyslog(message) {
	if (message.match(/%VSHD-5-VSHD_SYSLOG_CONFIG_I: Configured from (.*) by (.*) on .*/)) {
		return true;
	}
	return false;
}

function analyzeTrap(trap, debug) {
	for (var t in trap) {
		if (trap[t].substring(0, 24) == "1.3.6.1.4.1.9.9.43.2.0.2" || t.substring(0, 24) == "1.3.6.1.4.1.9.9.43.1.1.1") {
			return true;
		}
	}
	return false;
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	if (sysObjectID.substring(0, 17) == "1.3.6.1.4.1.9.12." && sysDesc.match(/^Cisco NX-OS.*/)) {
		return true;
	}
	return false;
}
