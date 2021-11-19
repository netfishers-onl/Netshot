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
	name: "ArbOS",
	description: "Arbor ArbOS 7.2+",
	author: "Mathieu Poussin",
	version: "1.0"
};

var Config = {
	"systemVersion": {
		type: "Text",
		title: "System version",
		comparable: true,
		searchable: true,
		checkable: true
	},
	"systemConfiguration": {
		type: "LongText",
		title: "System Configuration",
		comparable: true,
		searchable: true,
		checkable: true
	},
	"systemHardware": {
		type: "LongText",
		title: "System Hardware",
		comparable: true,
		searchable: false,
		checkable: true
	}
};

var Device = {
	"memorySize": {
		type: "Numeric",
		title: "Memory size (MB)",
		searchable: true
	},
	"configurationCommitted": {
		type: "Binary",
		title: "Configuration committed",
		searchable: true
	}
};

var CLI = {
	ssh: {
		macros: {
			exec: {
				options: [ "exec" ],
				target: "exec"
			}
		}
	},
	exec: {
		prompt: /^([A-Za-z0-9\.\-_]+@[A-Za-z\-_0-9\.]+):\//,
	}
};

function snapshot(cli, device, config) {
	var systemHardwareCleanup = function(config) {
		config = config.replace(/^Boot time.*$/mg, "");
		config = config.replace(/^Load averages.*$/mg, "");
		return config;
	};

	cli.macro("exec");

	var systemVersionResult = cli.command("system version");

	systemVersion = systemVersionResult.match(/Version: (.*)/m);
	if (systemVersion != null) {
	    config.set("systemVersion", systemVersion[1]);
		device.set("softwareVersion", systemVersion[1]);
	}

	device.set("networkClass", "SERVER");
	device.set("family", "Arbor ArbOS");

	var systemHardwareResult = systemHardwareCleanup(cli.command("system hardware"));
	config.set("systemHardware", systemHardwareResult);

	var memoryPattern = /Memory Device: (.*) MB .*/mg;
	var memory = 0;
	var memoryMatch;
	while (memoryMatch = memoryPattern.exec(systemHardwareResult)) {
	        memory += parseInt(memoryMatch[1]);
	}
	device.set("memorySize", memory);

    var serialMatch = systemHardwareResult.match(/Serial Number: (.*)/m);
    if (serialMatch != null) {
	    device.set("serialNumber", serialMatch[1]);
    }

	var systemConfiguration = cli.command("config show");
	config.set("systemConfiguration", systemConfiguration);
	
	var hostname = systemConfiguration.match(/^system name set (.+)$/m);
	if (hostname != null) {
		device.set("name", hostname[1]);
	}
	
	var location = systemConfiguration.match(/^services sp device edit .* snmp location set (.+)$/m);
	if (location != null) {
		device.set("location", location[1]);
	}
	
	var contact = systemConfiguration.match(/^services sp preferences support_email set (.+)$/m);
	if (contact != null) {
		device.set("contact", contact[1]);
	}
};

function runCommands(command) {
	
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	if (sysObjectID.substring(0, 16) == "1.3.6.1.4.1.9694" && sysDesc.match(/^Peakflow.*/)) {
		return true;
	}
	return false;
}
