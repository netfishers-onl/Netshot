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
	name: "CitrixNetscaler",
	description: "Citrix NetScaler",
	author: "NetFishers",
	version: "0.1"
};

var Config = {
	"nsVersion": {
		type: "Text",
		title: "NetScaler version",
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
			pre: "# Running configuration (taken on %when%):",
			post: "# End of running configuration"
		}
	},
	"nsLicense": {
		type: "LongText",
		title: "License",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "# License status:",
			preLine: "# ",
			post: "# End of license"
		}
	}
};

var Device = {
	"haNode": {
		type: "Text",
		title: "Other HA node IP",
		searchable: true
	},
	"configurationSaved": {
		type: "Binary",
		title: "Configuration saved",
		searchable: true
	}
};

var CLI = {
	ssh: {
		macros: {
			cli: {
				options: [ "cli", "shell" ],
				target: "cli"
			},
			shell: {
				options: [ "cli", "shell" ],
				target: "shell"
			}
		}
	},
	cli: {
		prompt: /^([^\s\r\n]*> )$/,
		error: /^ERROR: /m,
		pager: {
			avoid: "set cli mode -page OFF",
			match: /^.--More--/,
			response: " "
		},
		macros: {
			shell:  {
				cmd: "shell",
				options: [ "shell" ],
				target: "shell"
			},
			save: {
				cmd: "save ns config",
				options: [ "cli" ],
				target: "cli"
			}
		}
	},
	shell: {
		prompt: /^([^\s\r\n]*# )$/,
		macros: {
			cli: {
				cmd: "exit",
				options: [ "cli" ],
				target: "cli"
			}
		}
	}
};

function snapshot(cli, device, config, debug) {
	
	var configCleanup = function(runningConfig, savedConfig) {
		var config = runningConfig
			.replace(/[\r\n]+\s+Done[\r\n\s]+$/, "")
			.replace(/^# Last modified .*/m, "");
		
		// The ENCMTH-encrypted passwords are generated each type the configuration is retrieved
		// To avoid the differences between configurations, we take the encrypted passwords
		// from the saved configuration.
		// This means that if a change on the running config affects such a password only
		// it won't be detected until the configuration is saved.
		var savedPasswords = {};
		var passPattern = /^(.* )([0-9a-f]+)( \-encrypted \-encryptmethod ENCMTHD.*)$/mg;
		var passMatch;
		while (passMatch = passPattern.exec(savedConfig)) {
			savedPasswords[passMatch[1] + passMatch[3]] = passMatch[2];
		}
	
		config = config.replace(passPattern, function(match, prefix, pass, suffix) {
			return prefix + (savedPasswords[prefix + suffix] ? savedPasswords[prefix + suffix] : pass) + suffix;
		});
	
		return config;
	};


	var parseInterfaces = function(partition, configuration) {
		var vlanInterfaces = {};
		var ipVlans = {};
		var arpTable = {};

		var match;

		var showArp = cli.command("show arp");
		var arpPattern = /([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\s+([0-9a-f:]+)\s.*([0-9]+)\s*$/mg;
		while (match = arpPattern.exec(showArp)) {
			arpTable[match[1] + "_" + match[3]] = match[2];
		}

		var bindVlanPattern = /^bind vlan ([0-9]+).*\-ifnum (\S+)/mg;
		while (match = bindVlanPattern.exec(configuration)) {
			vlanInterfaces[match[1]] = match[2];
		}

		var bindVlanIpPattern = /bind vlan ([0-9]+) .*\-IPAddress ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+) ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+).*(\-td ([0-9]+))?/mg;
		while (match = bindVlanIpPattern.exec(configuration)) {
			var td = match[5] ? match[5] : "0";
			ipVlans[match[2] + "_" + match[3] + "_" + td] = match[1];
		}
		var addIp = function(ip, mask, description, td) {
			if (!td) td = "0";
			var networkInterface = {
				name: "",
				ip: [{ ip: ip, mask: mask, usage: "PRIMARY" }],
				virtualDevice: partition,
				vrf: "TD " + td,
				description: description
			};
			var vlan = ipVlans[ip + "_" + mask + "_" + td];
			if (vlan) {
				networkInterface.name = "Vlan" + vlan;
				if (vlanInterfaces[vlan]) {
					networkInterface.name = networkInterface.name + " (" + vlanInterfaces[vlan] + ")";
				}
			}
			var mac = arpTable[ip + "_" + td];
			if (mac) {
				networkInterface.mac = mac;
			}
			device.add("networkInterface", networkInterface);

		}


		var addIpPattern = /add ns ip ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+) ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+).*(\-type ([A-Z]+))?.*(\-td ([0-9]+))?/mg;
		while (match = addIpPattern.exec(configuration)) {
			var td = match[6] ? match[6] : "0";
			var type = match[4] ? match[4] : "NSIP";
			var ip = match[1];
			var mask = match[2];
			addIp(ip, mask, type, td);
			
		}
		var nsIp = configuration.match(/^set ns config \-IPAddress ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+) \-netmask ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/m);
		if (nsIp) {
			var td = 0;
			var ip = nsIp[1];
			var mask = nsIp[2];
			addIp(ip, mask, "NetScaler IP", td);
		}
	}
	
	cli.macro("cli");

	var runningConfig = cli.command("show ns runningConfig");
	var savedConfig = cli.command("show ns savedConfig");
	runningConfig = configCleanup(runningConfig, savedConfig);

	var showNsHostname = cli.command("show ns hostname");
	var hostname = showNsHostname.match(/Hostname:\s+(.+)/);
	if (hostname) {
		device.set("name", hostname[1]);
	}

	var showNsLicense = cli.command("show ns license");
	config.set("nsLicense", showNsLicense);

	var showNsConfig = cli.command("show ns config");
	var saved = false;
	var lastChange = showNsConfig.match(/Last Config Changed Time: (.* [0-9][0-9][0-9][0-9])/);
	var lastSaved  = showNsConfig.match(/Last Config Saved Time: (.* [0-9][0-9][0-9][0-9])/);
	if (lastChange && lastSaved) {
		lastChange = new Date(lastChange[1]);
		lastSaved = new Date(lastSaved[1]);
		saved = lastSaved >= lastChange;
	}
	device.set("configurationSaved", saved);

	var showNsVersion = cli.command("show ns version");
	var version = showNsVersion.match(/NetScaler (NS.+?),/i);
	if (version) {
		device.set("softwareVersion", version[1]);
		config.set("nsVersion", version[1]);
	}

	device.set("networkClass", "LOADBALANCER");

	var showNsHardware = cli.command("show ns hardware");
	var serialNumber = showNsHardware.match(/Serial no: +(.+)/);
	if (serialNumber) {
		serialNumber = serialNumber[1];
		device.set("serialNumber", serialNumber);
	}

	var family = "NetScaler";
	var platform = showNsHardware.match(/Platform: +(.+)/);
	if (platform) {
		platform = platform[1];
		if (platform.match(/Virtual Appliance/)) {
			family = "NetScaler VPX";
		}
		else if (platform.match(/MPX/)) {
			family = "NetScaler MPX";
		}
	}
	device.set("family", family);


	if (serialNumber && platform) {
		device.add("module", { slot: "NetScaler", partNumber: platform, serialNumber: serialNumber });
	}

	var location = runningConfig.match(/^set snmp mib .*\-contact "(.+?)"/m);
	if (location) {
		device.set("location", location[1]);
	}
	else {
		device.set("location", "");
	}
	var contact = runningConfig.match(/^set snmp mib .*\-location "(.+?)"/m);
	if (contact) {
		device.set("contact", contact[1]);
	}
	else {
		device.set("contact", "");
	}

	var haNodePattern = /^add HA node ([0-9]+) ([0-9\.]+)/mg;
	var haNodes = [];
	var haNode;
	while (haNode = haNodePattern.exec(runningConfig)) {
		haNodes.push(haNode[2]);
	}
	device.set("haNode", haNodes.join(", "));

	parseInterfaces("", runningConfig);

	var partitionPattern = /^add ns partition (\S+)/mg;
	var partition;
	while (partition = partitionPattern.exec(runningConfig)) {
		var partitionName = partition[1];
		cli.command("switch ns partition " + partitionName, { clearPrompt: true });
		var partRunningConfig = cli.command("show ns runningConfig");
		var partSavedConfig = cli.command("show ns savedConfig");
		partRunningConfig = configCleanup(partRunningConfig, partSavedConfig);
		runningConfig += "\r\n\r\n### Partition " + partitionName + "\r\n";
		runningConfig += "switch ns partition " + partitionName + "\r\n\r\n";
		runningConfig += partRunningConfig;
		parseInterfaces(partitionName, runningConfig);
	}
	config.set("runningConfig", runningConfig);

};

function analyzeSyslog(message) {
	return !!message.match(/netScalerConfigChange/);
}


/*
 * Trigger a snapshot upon configuration change.
 *
 * NetScaler configuration:
 *  > add snmp trap specific 1.1.1.1 -version V2 -destPort 162 -communityName Netsh01 -severity Unknown -allPartitions ENABLED
 *
 */

function analyzeTrap(trap, debug) {
	return !!trap["1.3.6.1.4.1.5951.4.1.10.2.5.0"];
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	if (sysObjectID.substring(0, 17) == "1.3.6.1.4.1.5951." && sysDesc.match(/NetScaler/)) {
		return true;
	}
	return false;
}
