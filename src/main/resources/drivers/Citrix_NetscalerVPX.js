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

const Info = {
	name: "CitrixNetscalerSDX",
	description: "Citrix NetScaler SDX",
	author: "Netshot Team",
	version: "1.0"
};

const Config = {
	"sdxVersion": {
		type: "Text",
		title: "SDX version",
		comparable: true,
		searchable: true,
		checkable: true
	},
	"xenVersion": {
		type: "Text",
		title: "Xen Server version",
		comparable: true,
		searchable: true,
		checkable: true
	},
	"backupArchive": {
		type: "BinaryFile",
		title: "Backup Archive",
	},
};

var Device = {
	"hypervisorHostname": {
		type: "Text",
		title: "Hypervisor Hostname",
		searchable: true
	},
	"totalMemorySize": {
		type: "Numeric",
		title: "Total memory size (GB)",
		searchable: true
	},
	"totalCpuCount": {
		type: "Numeric",
		title: "Total CPU count",
		searchable: true
	},
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
			},
		}
	},
	cli: {
		prompt: /^([A-Za-z\-_0-9\.]> )$/,
		macros: {
			shell:  {
				cmd: "shell",
				options: [ "shell" ],
				target: "shell"
			},
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

function snapshot(cli, device, config) {

	cli.macro("cli");

	const showHostname = cli.command("show hostname");
	const hostnameMatch = showHostname.match(/^\s*Host Name: (.+)/m);
	if (hostnameMatch) {
		device.set("name", hostnameMatch[1]);
	}
	const hypHostnameMatch = showHostname.match(/^\s*Hypervisor Host Name: (.+)/m);
	if (hypHostnameMatch) {
		device.set("hypervisorHostname", hypHostnameMatch[1]);
	}

	const showSystemstatus = cli.command("show systemstatus");
	const serialMatch = showSystemstatus.match(/^\s*Serial Number: (.+)/m);
	if (serialMatch) {
		device.set("serialNumber", serialMatch[1]);
	}
	const platformMatch = showSystemstatus.match(/^\s*Platform: (.+)/m);
	if (platformMatch && serialMatch) {
		device.add("module", {
			slot: "Chassis",
			partNumber: `SDX ${platformMatch[1]}`,
			serialNumber: serialMatch[1],
		});
	}

	const buildMatch = showSystemstatus.match(/^\s*Build: (.+?)(,|$)/m);
	if (buildMatch) {
		device.set("softwareVersion", buildMatch[1]);
		config.set("sdxVersion", buildMatch[1]);	
	}

	device.set("family", "NetScaler SDX");
	device.set("networkClass", "SERVER");

	const showAppliance = cli.command("show appliance");
	const memoryMatch = showAppliance.match(/^\s*Total Memory\s*: ([0-9]+]) GB/m);
	if (memoryMatch) {
		device.set("totalMemorySize", parseInt(memoryMatch[1]));
	}
	const cpuMatch = showAppliance.match(/^\s*Total CPUs\s*: ([0-9]+)/m);
	if (cpuMatch) {
		device.set("totalCpuCount", parseInt(cpuMatch[1]));
	}
	const xenVersionMatch = showAppliance.match(/^\s*Version\s*: (.+)/m);
	if (xenVersionMatch) {
		device.set("xenVersion", xenVersionMatch[1]);
	}

	// Switch to Linux shell
	cli.macro("shell");

	// Parse iproute ip addr output
	const ipAddressShow = cli.command("ip address show");
	const interfaces = cli.findSections(ipAddressShow,
			/^([0-9]+): ([-\.a-zA-Z0-9]+): <([A-Z_,]+)> .*/m);
	for (const intf of interfaces) {
		const flags = intf.match[3].split(",");
		const networkInterface = {
			name: intf.match[2],
			ip: [],
			enabled: flags.includes("UP"),
		};
		const macMatch = intf.config.match(/link\/ether ([0-9a-f:]+)/);
		if (macMatch && macMatch[1] !== "00:00:00:00:00:00") {
			networkInterface.mac = macMatch[1];
		}

		const ipPattern = /^\s+inet (\d+\.\d+\.\d+\.\d+)\/(\d+)/mg;
		while (true) {
			const ipMatch = ipPattern.exec(intf.config);
			if (!ipMatch) break;
			networkInterface.ip.push({
				ip: ipMatch[1],
				mask: parseInt(ipMatch[2]),
				usage: "PRIMARY"
			});
		}

		const ip6Pattern = /^\s+inet6 ([a-f0-9:]+)\/(\d+)/mg;
		while (true) {
			const ipMatch = ip6Pattern.exec(intf.config);
			if (!ipMatch) break;
			networkInterface.ip.push({
				ipv6: ipMatch[1],
				mask: parseInt(ipMatch[2]),
				usage: "PRIMARY"
			});
		}

		device.add("networkInterface", networkInterface);
	}

	// Delete any legacy backup archive
	cli.command("rm -f /var/mps/backup/NetshotBackup*");
	cli.macro("exit");
	// Start backup
	cli.command("add backup backup_file_name=NetshotBackup");

	cli.macro("shell");
	let maxLoops = 12 * 30; // 30 minutes
	while (true) {
		const backupSum = cli.command("sha256sum var/mps/backup/NetshotBackup*");
		const backupMatch = backupSum.match(/^([0-9a-f]{64})\s+(\/var\/mps\/backup\/NetshotBackup.*\.tgz)$/m);
		if (backupMatch) {
			const checksum = backupMatch[1];
			const backupPath = backupMatch[2];
			try {
				config.download("backupArchive", backupPath, { method: "sftp", checksum, newSession: true });
			}
			catch (e) {
				var text = "" + e;
				throw e;
			}
			finally {
				cli.command(`rm -f ${backupPath}`);
			}
			break;
		}
		maxLoops -= 1;
		if (maxLoops <= 0) {
			throw "The local backup took too long";
		}
		cli.sleep(5000);
	}
};

function analyzeSyslog(message) {
	return false;
}

function analyzeTrap(trap, debug) {
	return false;
}

function snmpAutoDiscover(sysObjectID, sysDesc) {
	if (sysObjectID.startsWith("1.3.6.1.4.1.5951.6") && sysDesc.match(/NETSCALER/i)) {
		return true;
	}
	return false;
}
