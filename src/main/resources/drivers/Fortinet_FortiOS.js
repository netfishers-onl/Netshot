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
 * 'Info' object = Meta data of the driver.
 */
var Info = {
	name: "FortinetFortiOS", /* Unique identifier of the driver within Netshot. */
	description: "Fortinet FortiOS", /* Description to be used in the UI. */
	author: "Netshot Team",
	version: "6.2" /* Version will appear in the Admin tab. */
};

/**
 * 'Config' object = Data fields to be included in each configuration revision.
 */
var Config = {
	"osVersion": { /* This stores the detected FortiOS version on each snapshot. */
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
	"configuration": { /* This stores the full textual configuration of the device on each snapshot. */
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

/**
 * 'Device' object = Data fields to add to devices of this type.
 */
var Device = {
	"haPeer": { /* This stores the name of an optional HA peer. */
		type: "Text",
		title: "HA peer name",
		searchable: true,
		checkable: true
	}
};

/**
 * 'CLI' object = Definition of the finite state machine to recognize and handle the CLI prompt changes.
 */
var CLI = {
	telnet: { /* Entry point for Telnet access. */
		macros: { /* List of available macros in the CLI mode. */
			basic: { /* 'basic' macro (will be called in the snapshot procedure. */
				options: [ "login", "password", "basic", "postLoginBanner" ], /* Possible next modes, Netshot will test the associated prompt regexp's. */
				target: "basic" /* Netshot will target this mode. */
			}
		}
	},
	ssh: { /* Entry point for SSH access. */
		macros: {
			basic: {
				options: [ "basic", "postLoginBanner" ],
				target: "basic"
			}
		}
	},
	login: { /* 'login' prompt: send the username and expect the password prompt. */
		prompt: / login: $/,
		macros: {
			auto: {
				cmd: "$$NetshotUsername$$",
				options: [ "password" ]
			}
		}
	},
	password: { /* 'password' prompt: send the password, and expect the basic prompt. */
		prompt: /^Password: $/,
		macros: {
			auto: {
				cmd: "$$NetshotPassword$$",
				options: [ "loginAgain", "basic" ]
			}
		}
	},
	loginAgain: { /* 'login' prompt again: this means that authentication failed. */
		prompt: / login: $/,
		fail: "Authentication failed - Telnet authentication failure."
	},
	postLoginBanner: { /* Post login banner. */
		prompt: /^\(Press 'a' to accept\):/,
		macros: {
			auto: {
				cmd: "a",
				noCr: true,
				options: [ "basic" ]
			}
		}
	},
	basic: { /* The basic FortiOS prompt. */
		prompt: /^[A-Za-z0-9_\-\~]+?\s(\([A-Za-z0-9_\-\~\.]+?\)\s)?[#$]\s?$/,
		error: /^(Unknown action|Command fail)/m,
		pager: { /* 'pager': define how to handle the pager for long outputs. */
			match: /^--More-- /,
			response: " "
		},
		macros: {
		}
	}
};

/**
 * The 'snapshot' function entry point = Will be called by Netshot when initiating a snapshot of this type of device.
 * @param cli = object used to interact with the current device via CLI.
 * @param device = used to store data at the device level.
 * @param config = used to store data at the configuration revision level.
 */
function snapshot(cli, device, config) {
	// Targets the 'basic' CLI mode.
	cli.macro("basic");

	// 'status' will be used to read the version, hostname, etc.
	var status = cli.command("get system status");

	// Read version and family from the 'status' output.
	var version = status.match(/Version: (.*) v([0-9]+.*)/);
	var family = (version ? version[1] : "FortiOS device");
	device.set("family", family);
	version = (version ? version[2] : "Unknown");
	device.set("softwareVersion", version);
	config.set("osVersion", version);

	device.set("networkClass", "FIREWALL");

	// Whether to use SCP to download the configuration rather than show
	var useScp = false;
	// The main configuration
	var configuration = null;
	// Configuration of 'global' mode
	var globalConfig = null;

	// Read the HA peer hostname from a 'get system ha status' in global mode.
	var vdomMode = true;
	try {
		cli.command("config global", { clearPrompt: true });
	}
	catch (e) {
		vdomMode = false;
	}

	try {
		var getSystemGlobalAdminScp = cli.command("get system global | grep admin-scp");
		if (getSystemGlobalAdminScp.match(/enable/)) {
			useScp = true;
		}
	}
	catch (e) {
		// Ignore
	}

	// Store the interface config block
	var showSystemInterface = cli.command("show system interface | grep .");
	// Store the SNMP config block
	var showSystemSnmp = cli.command("show system snmp sysinfo | grep .");
	// Store the HA status
	var getHa = cli.command("get system ha status | grep .");


	if (vdomMode) {
		if (!useScp && version.match(/^6\.2\..*/)) {
			// In 6.2, some config blocks are missing from the root 'show'
			// We'll take a 'show' in 'config global' mode and replace
			globalConfig = cli.command("show | grep .", { timeout: 120000 });
		}

		cli.command("end", { clearPrompt: true });
	}

	var configuration;
	if (useScp) {
		try {
			configuration = device.textDownload("sys_config", { method: "scp" });
		}
		catch (e) {
			cli.debug("Error with SCP method, falling back to show command");
			useScp = false;
		}
	}

	if (!useScp) {
		// The configuration is retrieved by a simple 'show' at the root level. Add grep to avoid paging.
		configuration = cli.command("show | grep .", { timeout: 120000 });
		if (globalConfig) {
			configuration = configuration.replace(/^(config global\r?\n)(?:.*\r?\n)*?(^end\r?\nconfig vdom)/m,
					function(m, p, s) { return p + globalConfig + s; });
		}
	}

	// Read the device hostname from the 'status' output.
	var hostname = status.match(/Hostname: (.*)$/m);
	if (hostname) {
		hostname = hostname[1];
		device.set("name", hostname);
	}
	// Read the serial number from the 'status' output.
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

	// Read the contact and location fields from the configuration directly.
	device.set("contact", "");
	device.set("location", "");
	var sysInfos = cli.findSections(showSystemSnmp, /config system snmp sysinfo/);
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
	var peerPattern = /^(Master|Slave|Primary|Secondary) *: (.+?) *, +([A-Z0-9]+)(, HA cluster index = [0-9]|, cluster index = [0-9])*$/gm;
	var match;
	while (match = peerPattern.exec(getHa)) {
		if (match[2] != hostname) {
			device.set("haPeer", match[2]);
			break;
		}
	}

	// Read the list of interfaces.
	var vdomArp = {};
	var interfaces = cli.findSections(showSystemInterface, /^ *edit "(.*)"/m);
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
				var arp;
				if (vdomMode) {
					cli.command("config global", { clearPrompt: true });
					arp = cli.command("sudo " + vdom + " get system arp | grep .");
					cli.command("end", { clearPrompt: true });
				}
				else {
					arp = cli.command("get system arp | grep .");
				}

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
		var descMatch = interfaces[i].config.match(/set description "(.+)"/);
		if (descMatch) {
			networkInterface.description = descMatch[1];
		}
		device.add("networkInterface", networkInterface);
	}

	var removeChangingParts = function(text) {
		var cleaned = text;
		cleaned = cleaned.replace(/^#conf_file_ver=.*/mg, "");
		cleaned = cleaned.replace(/^ *set (passphrase|password|passwd|secondary-secret) ENC .*$/mg, "");
		cleaned = cleaned.replace(/^ *set private-key "(.|[\r\n])*?"$/mg, "");
		return cleaned;
	}

	if (typeof config.computeHash === "function") {
		// Possible starting with Netshot 0.21
		// Sets the config hash based on configuration without salted/encrypted parts.
		config.computeHash(removeChangingParts(configuration));
		config.set("configuration", configuration);
	}
	else {
		// Legacy mode
		// If only the passwords are changing (they are hashed with a new salt at each 'show') then
		// just keep the previous configuration.
		// That means we could miss a password change in the history of configurations, but no choice...
		var previousConfiguration = device.get("configuration");
		if (typeof previousConfiguration === "string" &&
				removeChangingParts(previousConfiguration) === removeChangingParts(configuration)) {
			config.set("configuration", previousConfiguration);
		}
		else {
			config.set("configuration", configuration);
		}
	}

};

// No known log message upon configuration change

/**
 * The 'analyzeTrap' function entry point = Will be called when receiving a trap for a device of this type.
 * @param trap = the SNMP data embedded in the trap.
 * @returns true if the trap indicates a configuration changes (this means to initiate a new snapshot).
 */
function analyzeTrap(trap) {
	return trap["1.3.6.1.6.3.1.1.4.1.0"] == "1.3.6.1.4.1.12356.101.6.0.1003" ||
		trap["1.3.6.1.6.3.1.1.4.1.0"] == "1.3.6.1.2.1.47.2.0.1";
}

/**
 * The 'snmpAutoDiscover' function entry point = Will be called with the sysObjectID and sysDesc
 * of a device when auto discovering the type of a device.
 * @param sysObjectID = The SNMP sysObjectID of a device being discovered.
 * @param sysDesc = The SNMP sysDesc of a device being discovered.
 * @returns true if the scanned device is supported by this driver.
 */
function snmpAutoDiscover(sysObjectID, sysDesc) {
	return (sysObjectID.substring(0, 22) == "1.3.6.1.4.1.12356.101.");
}
