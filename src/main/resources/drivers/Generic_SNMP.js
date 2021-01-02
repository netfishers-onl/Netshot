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
	name: "GenericSNMP",
	description: "Generic SNMP device",
	author: "NetFishers",
	version: "1.1",
	priority: 1024, /* Less than default */
};

var Config = {
};

var Device = {
	"sysObjectId": {
		type: "Text",
		title: "SNMP sysObjectID",
		searchable: true
	},
	"sysDescr": {
		type: "Text",
		title: "SNMP sysDescr",
		searchable: true
	},
};

var CLI = {
	/* No mode = no CLI */
};

var SNMP = {
	/* Enable SNMP */
};

function snapshot(poller, device, config, debug) {

	var hostname = poller.get("1.3.6.1.2.1.1.5.0"); /* sysName.0 */
	device.set("name", hostname);

	var contact = poller.get("1.3.6.1.2.1.1.4.0");
	device.set("contact", contact);

	var location = poller.get("1.3.6.1.2.1.1.6.0");
	device.set("location", location);

	var sysObjectId = poller.get("1.3.6.1.2.1.1.2.0");
	device.set("sysObjectId", sysObjectId);
	var sysDescr = poller.get("1.3.6.1.2.1.1.1.0");
	device.set("sysDescr", sysDescr);

	var ifDescr = poller.walk("1.3.6.1.2.1.2.2.1.2", true);
	var ifAlias = poller.walk("1.3.6.1.2.1.31.1.1.1.18", true);
	var ifAdminStatus = poller.walk("1.3.6.1.2.1.2.2.1.7", true);
	/* IPv4 only with this OID :( */
	var ipAdEntAddr    = poller.walk("1.3.6.1.2.1.4.20.1.1", true);
	var ipAdEntIfIndex = poller.walk("1.3.6.1.2.1.4.20.1.2", true);
	var ipAdEntNetMask = poller.walk("1.3.6.1.2.1.4.20.1.3", true);
	var ifPhysAddress = poller.walk("1.3.6.1.2.1.2.2.1.6", true);

	for (var ifIndex in ifDescr) {
		var networkInterface = {
			name: ifDescr[ifIndex],
			description: ifAlias[ifIndex] || undefined,
			enabled: ifAdminStatus[ifIndex] != 2,
			ip: [],
		};
		var mac = ifPhysAddress[ifIndex];
		if (mac) {
			var digits = mac.split(":");
			for (var d in digits) {
				digits[d] = ("00" + digits[d]).slice(-2);
			}
			mac = digits.join(":");
			networkInterface.mac = mac;
		}
		for (var a in ipAdEntIfIndex) {
			if (ipAdEntIfIndex[a] == ifIndex && typeof(ipAdEntAddr[a]) == "string" && typeof(ipAdEntNetMask[a] == "string")) {
				networkInterface.ip.push({
					ip: ipAdEntAddr[a],
					mask: ipAdEntNetMask[a],
					usage: networkInterface.ip.length > 0 ? "SECONDARY" : "PRIMARY"
				});
			}
		}
		device.add("networkInterface", networkInterface);
	}

};

function analyzeSyslog(message) {
	return false;
}

function analyzeTrap(trap, debug) {
	return false;
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	// Accept any device which replied to SNMP polls.
	return true;
}
