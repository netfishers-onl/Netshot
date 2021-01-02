/**
 * Copyright 2013-2021 Sylvain Cadilhac (NetFishers)
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
	name: "F5TMOS",
	description: "F5 TM-OS, 11.x and newer",
	author: "NetFishers",
	version: "1.0"
};

var Config = {
	"tmosVersion": {
		type: "Text",
		title: "TM-OS version",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "# TM-OS version:",
			preLine: "#  "
		}
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
	"license": {
		type: "LongText",
		title: "Licensing information",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "# Licensing information:",
			preLine: "#  "
		}
	}
};

var Device = {
	"product": {
		type: "Text",
		title: "Product",
		searchable: true,
	}
};

var CLI = {
	telnet: {
		fail: "Telnet access is not supported."
	},
	ssh: {
		macros: {
			bash: {
				options: [ "bash", "tmsh" ],
				target: "bash"
			},
			tmsh: {
				options: [ "bash", "tmsh" ],
				target: "tmsh"
			}
		}
	},
	bash: {
		prompt: /^(\[.*@.*] .* # )$/,
		macros: {
			tmsh: {
				cmd: "tmsh",
				options: [ "tmsh" ],
				target: "tmsh"
			}
		}
	},
	tmsh: {
		prompt: /^([A-Za-z\-_0-9\.]+@\(.+\)\(.+\)\(.+\)\(.+\)\(tmos\)# )$/,
		error: /^(Syntax Error: .*)/,
		macros: {
			bash: {
				cmd: "bash",
				options: [ "bash" ],
				target: "bash"
			},
			saveSysAll: {
				cmd: "save /sys config partitions all",
				target: "tmsh"
			}
		}
	}
};

function snapshot(cli, device, config, debug) {
	cli.macro("bash");
	var runningConfig = cli.command("tmsh -q -c 'cd /; show running-config recursive'");
	runningConfig = runningConfig.replace(/^[^\{]*\r?\n/, ""); // Remove first line if doesn't contain {
	config.set("runningConfig", runningConfig);
	
	var lastTransaction = cli.command("grep transaction /var/log/audit | tail -n1");
	if (lastTransaction) {
		var user = lastTransaction.match(/user (.+) - transaction/);
		if (user) {
			config.set("author", user[1]);
		}
	}
	
	var showCmDevice = cli.command("tmsh -q show /cm device");
	var hostname = showCmDevice.match(/^Hostname +(.+)/m);
	if (hostname) {
		device.set("name", hostname[1]);
	}
	
	var showSysVersion = cli.command("tmsh -q show /sys version");
	var version = showSysVersion.match(/^ *Version +(.*)$/m);
	if (version) {
		device.set("softwareVersion", version[1]);
		config.set("tmosVersion", version[1]);
	}
	var product = showSysVersion.match(/^ *Product +(.*)$/m);
	if (product) {
		device.set("product", product[1]);
	}
	
	var showSysHardware = cli.command("tmsh -q show /sys hardware");
	var platformSections = cli.findSections(showSysHardware, /^Platform/m);
	for (var p in platformSections) {
		var details = platformSections[p].config;
		var family = details.match(/^ *Name +(.*)/m);
		if (family) {
			device.set("family", family[1]);
		}
	}
	var systemSections = cli.findSections(showSysHardware, /^System Information/m);
	for (var s in systemSections) {
		var details = systemSections[p].config;
		var applianceSerial = details.match(/^ *Appliance Serial +(.*)/m);
		var partNumber = details.match(/^ *Part Number +(.*)/m);
		var chassisSerial = details.match(/^ *Chassis Serial +(.*)/m);
		var type = details.match(/^ *Type +(.*)/m);
		if (partNumber) {
			partNumber = partNumber[1];
		}
		else if (type) {
			partNumber = type[1];
		}
		else {
			partNumber = "";
		}

		if (applianceSerial) {
			device.add("module", {
				slot: "Appliance",
				partNumber: partNumber,
				serialNumber: applianceSerial[1]
			});
			device.set("serialNumber", applianceSerial[1]);
		}
		if (chassisSerial) {
			device.add("module", {
				slot: "Chassis",
				partNumber: partNumber,
				serialNumber: chassisSerial[1]
			});
			device.set("serialNumber", chassisSerial[1]);
		}
	}
	var hardwarePattern = /^  Name +(.*)\r?\n  Type +(.*)\r?\n  Model +(.*)\r?\n  Parameters.*\r?\n((^              .*\r?\n)*)/mg;
	var hardwareMatch;
	while (hardwareMatch = hardwarePattern.exec(showSysHardware)) {
		var parameters = hardwareMatch[4];
		var serialNumber = parameters.match(/^ *Serial number +(.*)/m);
		device.add("module", {
			slot: hardwareMatch[1],
			partNumber: hardwareMatch[3],
			serialNumber: serialNumber ? serialNumber[1] : "",
		});
	}
	
	var platform = showSysHardware.match(/^Platform\r?\n +Name +(.*)/m);
	if (platform) {
		device.set("family", platform[1]);
	}
	device.set("networkClass", "LOADBALANCER");
	

	var license = cli.command("tmsh -q -c 'cd /; show /sys license'");
	config.set("license", license);
	
	
	var snmpSections = cli.findSections(runningConfig, /^sys snmp \{$/mg);
	for (var s in snmpSections) {
		var snmpConfig = snmpSections[s].config;
		var sysContact = snmpConfig.match(/^ *sys-contact (.+)/m);
		var sysLocation = snmpConfig.match(/^ *sys-location (.+)/m);
		device.set("contact", sysContact ? sysContact[1].replace(/^"(.*)"$/, "$1") : "");
		device.set("location", sysLocation ? sysLocation[1].replace(/^"(.*)"$/, "$1") : "");
	}
	
	var ifRouteDomains = {};
	var routeDomains = cli.findSections(runningConfig, /^net route-domain (.+) \{/mg);
	for (var r in routeDomains) {
		var idMatch = routeDomains[r].config.match(/^ *id +([0-9]+)/);
		var id = idMatch ? idMatch[1] : "";
		var routeDomain = routeDomains[r].match[1] + " (" + id + ")";
		var vlanMatch = routeDomains[r].config.match(/^( +)vlans \{((\r|\n|.)*)^\1\}/m);
		if (vlanMatch) {
			var vlans = vlanMatch[2].trim().split(/[\r\n ]+/);
			for (var v in vlans) {
				ifRouteDomains[vlans[v]] = routeDomain;
			}
		}
	}
	
	var vlanIps = {};
	var selfIps = cli.findSections(runningConfig, /^net self (.+) \{/mg);
	for (var i in selfIps) {
		var ipMatch = selfIps[i].config.match(/^ *address ([0-9a-fA-F:\.]+)(%[0-9]+)?\/([0-9]+)/m);
		var vlanMatch = selfIps[i].config.match(/^ *vlan (.+)/m);
		if (ipMatch && vlanMatch) {
			var vlan = vlanMatch[1];
			if (!vlanIps[vlan]) {
				vlanIps[vlan] = [];
			}
			var ip = {
				mask: parseInt(ipMatch[3]),
				usage: "PRIMARY"
			};
			ip[ipMatch[1].match(/:/) ? "ipv6" : "ip"] = ipMatch[1];
			vlanIps[vlan].push(ip);
		}
	}
	
	var vlanMac = {};
	try {
		var showVlan = cli.command("tmsh -q -c 'cd /; show /net vlan'");
		var macPattern = /^Interface Name +(.+)\r?\nMac Address.* +([0-9A-Za-z:]+)$/mg;
		while (match = macPattern.exec(showVlan)) {
			vlanMac[match[1]] = match[2];
		}
	}
	catch (error) {
		// Go on
	}
	
	var interfaces = cli.findSections(runningConfig, /^net interface (.+) \{/mg);
	for (var i in interfaces) {
		var networkInterface = {
			name: interfaces[i].match[1],
			ip: [],
			level3: false
		};
		if (interfaces[i].config.match(/^ *disabled$/m)) {
			networkInterface.enabled = false;
		}
		var macMatch = interfaces[i].config.match(/^ *mac-address ([0-9A-Za-z:]+)/m);
		if (macMatch) {
			networkInterface.mac = macMatch[1];
		}
		device.add("networkInterface", networkInterface);
	}
	var trunks = cli.findSections(runningConfig, /^net trunk (.+) \{/mg);
	for (var t in trunks) {
		var networkInterface = {
			name: trunks[t].match[1],
			ip: [],
			level3: false
		};
		var interfacesMatch = trunks[t].config.match(/^( +)interfaces \{((\r|\n|.)*)^\1\}/m);
		if (interfacesMatch) {
			var interfaceNames = interfacesMatch[2].trim().split(/[\r\n ]+/);
			networkInterface.description = "Trunk (" + interfaceNames.join(", ") + ")";
		}
		device.add("networkInterface", networkInterface);
	}
	
	var vlans = cli.findSections(runningConfig, /^net vlan (.+) \{/mg);
	for (var v in vlans) {
		var vlanName = vlans[v].match[1];
		var networkInterface = {
			name: vlanName.replace(/^.*\//, ""),
			virtualDevice: vlanName.replace(/^(.*)\/.*/, "$1"),
			ip: vlanIps[vlanName] || []
		};
		if (ifRouteDomains[vlanName]) {
			networkInterface.vrf = ifRouteDomains[vlanName].replace(/^Common\//, "");
		}
		if (vlanMac[vlanName]) {
			networkInterface.mac = vlanMac[vlanName];
		}
		var tagMatch = vlans[v].config.match(/ *tag +([0-9]+)/m);
		if (tagMatch) {
			networkInterface.name = networkInterface.name + " (Vlan" + tagMatch[1] + ")";
		}
		var descriptionMatch = vlans[v].config.match(/ *description +(.*)/);
		if (descriptionMatch) {
			networkInterface.description = descriptionMatch[1].replace(/^"(.*)"$/, "$1");;
		}
		
		device.add("networkInterface", networkInterface);
	}
};


// To forward the audit logs to the Netshot server, use the following command line in tmsh:
// # modify /sys syslog include "destination d_netshot {udp(\"a.b.c.d\" port (514));};log {source(s_syslog_pipe);filter(f_audit);destination(d_netshot);};"
//  where a.b.c.d is the actual Netshot IP address
function analyzeSyslog(message) {
	if (message.match(/AUDIT - client (.+?), user (.+?) - transaction #/)) {
		return true;
	}
	return false;
}

// Add the Netshot server as a SNMP trap destination:
// # modify /sys snmp traps add { iNetshot { community Netsh01 host a.b.c.d version 2c network mgmt } }
// where a.b.c.d is the actual Netshot IP address.
// To generate traps upon configuration changes, edit the file /config/user_alert.conf, and add the following:
// /*
//  * Generate traps upon configuration change
//  */
// alert BIGIP_AUDIT_TRANSACTION "AUDIT - client (.*?), user (.*?) - transaction #" {
//     snmptrap OID=".1.3.6.1.4.1.3375.2.4.0.899"
// }
//
function analyzeTrap(trap) {
	if (trap["1.3.6.1.6.3.1.1.4.1.0"] === "1.3.6.1.4.1.3375.2.4.0.899") {
		return true;
	}
	var message = trap["1.3.6.1.4.1.3375.2.4.1.1"];
	if (typeof message === "string" && message.match(/AUDIT - client (.+?), user (.+?) - transaction #/)) {
		return true;
	}
	return false;
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	if (sysObjectID.substring(0, 23) === "1.3.6.1.4.1.3375.2.1.3." && sysDesc.match(/BIG-IP software/)) {
		return true;
	}
	return false;
}
