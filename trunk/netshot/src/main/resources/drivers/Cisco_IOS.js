
var Info = {
	name: "CiscoIOS12",
	description: "Cisco IOS and IOS-XE",
	author: "NetFishers",
	version: "1.3"
};

var Config = {
	"iosImageFile": {
		type: "Text",
		title: "IOS image file",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "!! IOS image file:",
			preLine: "!!  "
		}
	},
	"iosVersion": {
		type: "Text",
		title: "IOS version",
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
	"mainMemorySize": {
		type: "Numeric",
		title: "Main memory size (MB)",
		searchable: true
	},
	"configRegister": {
		type: "Text",
		title: "IOS config register",
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
		prompt: /^[Uu]sername: $/,
		macros: {
			auto: {
				cmd: "$$NetshotUsername$$",
				options: [ "password", "usernameAgain" ]
			}
		}
	},
	password: {
		prompt: /^[Pp]assword: $/,
		macros: {
			auto: {
				cmd: "$$NetshotPassword$$",
				options: [ "usernameAgain", "disable", "enable" ]
			}
		}
	},
	usernameAgain: {
		prompt: /^[Uu]sername: $/,
		fail: "Authentication failed - Telnet authentication failure."
	},
	disable: {
		prompt: /^([A-Za-z\-_0-9\.]+\>)$/,
		pager: {
			avoid: "terminal length 0",
			match: /^--More--$/,
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
		prompt: /^[Pp]assword: /m,
		macros: {
			auto: {
				cmd: "$$NetshotSuperPassword$$",
				options: [ "disable", "enable", "enableSecretAgain" ]
			}
		}
	},
	enableSecretAgain: {
		prompt: /^[Pp]assword: /m,
		fail: "Authentication failed - Wrong enable password."
	},

	enable: {
		prompt: /^([A-Za-z\-_0-9\.]+#)$/,
		error: /^% (.*)/m,
		pager: {
			avoid: "terminal length 0",
			match: /^ --More--$/,
			response: " "
		},
		macros: {
			configure: {
				cmd: "configure terminal",
				options: [ "enable", "configure" ],
				target: "configure"
			},
			save: {
				cmd: "copy running-config startup-config",
				options: [ "enable", "saveTarget", "saveOverwrite" ],
				target: "enable"
			}
		}
	},
	saveTarget: {
		prompt: /Destination filename \[startup-config\]/,
		macros: {
			auto: {
				cmd: "",
				options: [ "enable", "saveOverwrite" ]
			}
		}
	},
	saveOverwrite: {
		prompt: /Overwrite the previous NVRAM configuration/,
		macros: {
			auto: {
				cmd: "",
				options: [ "enable" ]
			}
		}
	},
	
	configure: {
		prompt: /^([A-Za-z\-_0-9\.]+\(conf[0-9\-a-zA-Z]+\)#)$/,
		error: /^% (.*)/m,
		clearPrompt: true,
		macros: {
			end: {
				cmd: "end",
				options: [ "enable", "configure" ],
				target: "enable"
			}
		}
	}
};

function snapshot(cli, device, config, debug) {
	
	var configCleanup = function(config) {
		config = config.replace(/^ntp clock-period [0-9]+$/m, "");
		var p = config.search(/^[a-z]/m);
		if (p > 0) {
			config = config.slice(p);
		}
		return config;
	};
	
	cli.macro("enable");
	var runningConfig = cli.command("show running-config");
	
	var author = runningConfig.match(/^\! Last configuration change .* by (.*)$/m);
	if (author != null) {
		config.set("author", author[1]);
	}
	runningConfig = configCleanup(runningConfig);
	config.set("runningConfig", runningConfig);
	
	var startupConfig = cli.command("show startup-config");
	startupConfig = configCleanup(startupConfig);
	device.set("configurationSaved", startupConfig == runningConfig);
	
	var showVersion = cli.command("show version");
	
	var hostname = showVersion.match(/^ *(.*) uptime is/m);
	if (hostname != null) {
		device.set("name", hostname[1]);
	}
	
	var version = showVersion.match(/(?:Cisco )?IOS.*Software.*Version ([0-9\.A-Za-z\(\):]+)/m);
	if (version != null) {
		device.set("softwareVersion", version[1]);
		config.set("iosVersion", version[1]);
	}
	var image = showVersion.match(/^System image file is "(.*)"/m);
	if (image != null) {
		config.set("iosImageFile", image[1]);
	}
	var versionDetails = showVersion.match(/^(.*) with (\d+)K(\/(\d+)K)? bytes of memory/m);
	device.set("networkClass", "ROUTER");
	device.set("family", "Unknown IOS device");
	if (versionDetails != null) {
		var memory = parseInt(versionDetails[2]);
		if (typeof(versionDetails[4]) != "undefined") {
			memory += parseInt(versionDetails[4]);
		}
		memory = Math.round(memory / 1024);
		device.set("mainMemorySize", memory);
		var system = versionDetails[1];
		if (system.match(/.*CSC4.*/)) {
			device.set("family", "Cisco AGS+");
		}
		else if (system.match(/.*1900.*/)) {
			device.set("family", "Cisco Catalyst 1900");
			device.set("networkClass", "SWITCH");
		}
		else if (system.match(/^(AS)?25[12][12].*/)) {
			device.set("family", "Cisco 2500");
		}
		else if (system.match(/.*26[12][01].*/)) {
			device.set("family", "Cisco 2600");
		}
		else if (system.match(/.*Cisco 28\d\d .*/)) {
			device.set("family", "Cisco ISR 2800");
		}
		else if (system.match(/.*WS-C29.*/)) {
			device.set("family", "Cisco Catalyst 2900");
			device.set("networkClass", "SWITCH");
		}
		else if (system.match(/.*CISCO29\d\d.*/)) {
			device.set("family", "Cisco ISR-G2 2900");
		}
		else if (system.match(/.*WS-C355.*/)) {
			device.set("family", "Cisco Catalyst 3550");
			device.set("networkClass", "SWITCH");
		}
		else if (system.match(/.*WS-C35.*/)) {
			device.set("family", "Cisco Catalyst 3500XL");
			device.set("networkClass", "SWITCH");
		}
		else if (system.match(/^36[0246][0-9].*/)) {
			device.set("family", "Cisco 3600");
		}
		else if (system.match(/^([Cc]isco )?37.*/)) {
			device.set("family", "Cisco 3700");
		}
		else if (system.match(/.*WS-C3750.*/)) {
			device.set("family", "Cisco Catalyst 3750");
			device.set("networkClass", "SWITCH");
		}
		else if (system.match(/^(Cisco )?38\d\d.*/)) {
			device.set("family", "Cisco ISR 3800");
		}
		else if (system.match(/.*CISCO39\d\d.*/)) {
			device.set("family", "Cisco ISR-G2 3900");
		}
		else if (system.match(/.*WS-C45.*/)) {
			device.set("family", "Cisco Catalyst 4500");
			device.set("networkClass", "SWITCH");
		}
		else if (system.match(/.*6000.*/)) {
			device.set("family", "Cisco Catalyst 6000");
			device.set("networkClass", "SWITCH");
		}
		else if (system.match(/.*WS-C65.*/)) {
			device.set("family", "Cisco Catalyst 6500");
			device.set("networkClass", "SWITCHROUTER");
		}
		else if (system.match(/.*720[246].*/)) {
			device.set("family", "Cisco 7200");
		}
		else if (system.match(/.*(OSR-|CISCO)76.*/)) {
			device.set("family", "Cisco 7600");
		}
		else if (system.match(/.* ASR100[0-9].*/)) {
			device.set("family", "Cisco ASR 1000");
		}
		else if (system.match(/cisco OS-CIGESM.*/)) {
			device.set("family", "Cisco CIGESM Blade");
		}
	}
	var configRegister = showVersion.match(/^Configuration register is (.*)/m);
	if (configRegister != null) {
		device.set("configRegister", configRegister[1]);
	}
	
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

	try {	
		var showInventory = cli.command("show inventory");
		var inventoryPattern = /NAME: \"(.*)\", +DESCR: \"(.*)\"[\r\n]+PID: (.*?) *, +VID: (.*), +SN: (.*)/g;
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
	}
	catch (e) {
		debug("show inventory not supported on this device?");
	}
	
	var vrfPattern = /^(?:ip vrf|vrf definition) (.+)/mg;
	while (match = vrfPattern.exec(runningConfig)) {
		device.add("vrf", match[1]);
	}
	
	var interfaces = cli.findSections(runningConfig, /^interface ([^ ]+)/m);
	for (var i in interfaces) {
		var networkInterface = {
			name: interfaces[i].match[1],
			ip: []
		};
		var description = interfaces[i].config.match(/^ *description (.+)/m);
		if (description) {
			networkInterface.description = description[1];
		}
		var vrf = interfaces[i].config.match(/^ *(?:ip )?vrf forwarding (.+)$/m);
		if (vrf) {
			networkInterface.vrf = vrf[1];
		}
		if (interfaces[i].config.match(/^ *switchport$/m)) {
			networkInterface.level3 = false;
		}
		var ipPattern = /^ *ip address (\d+\.\d+\.\d+\.\d+) (\d+\.\d+\.\d+\.\d+)( secondary)?/mg;
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
		var fhrpPattern = /^ *(standby|vrrp|glbp)( [0-9]+)? ip (\d+\.\d+\.\d+\.\d+)( secondary)?/mg;
		while (match = fhrpPattern.exec(interfaces[i].config)) {
			var ip = {
				ip: match[3],
				mask: 32,
				usage: "HSRP"
			};
			if (match[1] == "vrrp") {
				ip.usage = "VRRP";
			}
			if (match[4] == " secondary") {
				ip.usage = "SECONDARY" + ip.usage;
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
		try {
			var showInterface = cli.command("show interface " + networkInterface.name + " | inc address|line protocol");
			var macAddress = showInterface.match(/address is ([0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4})/);
			if (macAddress) {
				networkInterface.mac = macAddress[1];
			}
			if (showInterface.match(/ is administratively down/)) {
				networkInterface.enabled = false;
			}
		}
		catch (e) {
		}
		device.add("networkInterface", networkInterface);
	}

};

function analyzeSyslog(message) {
	if (message.match(/%SYS\-5\-CONFIG_I: Configured from (.*) by (.*)/)) {
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
		&& sysDesc.match(/^Cisco (IOS|Internetwork Operating System) Software.*/)) {
		return true;
	}
	return false;
}
