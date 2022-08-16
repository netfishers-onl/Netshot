/**
 * Copyright 2022 Bernhard Kresina
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
 * The Info object contains the needed information for the driver, so that is accepted by Netshot
 * name: Short name for the driver
 * description: An informative text
 * author: The author of the driver
 * version: The version of the driver
 */
var Info = {
	name: "HirschmannHiOS8",
	description: "Hirschmann HiOS",
	author: "Bernhard Kresina",
	version: "1.2"
};

/**
 * The Config object contains information which is versioned across snapshots
 * type: Enumeration AttributeType from file src/main/java/onl/netfishers/netshot/device/attribute/AttributeDefinition.java
 * title: A descriptive title
 * *ables: Defined in src/main/java/onl/netfishers/netshot/device/attribute/AttributeDefinition.java
 * dump: Defined in src/main/java/onl/netfishers/netshot/device/attribute/AttributeDefinition.java
 * Other items: Can be defined individually
 */
var Config = {
	"runningConfig": {
		type: "LongText",
		title: "Running Configuration",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "!! Running configuration (taken on %when%):",
			post: "!! End of running configuration"
		}
	},

    "firmwareSoftwareReleaseRam": {
        type: "Text",
        title: "Firmware Software Release (RAM)",
        searchable: true
    },

    "firmwareSoftwareReleaseFlash": {
        type: "Text",
        title: "Firmware Software Release (Flash)",
        searchable: true
    }
};

/**
 * The Device object contains information which is not versioned across snapshots
 * type: Enumeration AttributeType from file src/main/java/onl/netfishers/netshot/device/attribute/AttributeDefinition.java
 * *ables: Defined in src/main/java/onl/netfishers/netshot/device/attribute/AttributeDefinition.java
 */
var Device = {

    "systemDescription": {
        type: "Text",
        title: "System Description",
        searchable: true
    },

    "deviceHardwareDescription": {
        type: "Text",
        title: "Device Hardware Description",
        searchable: true
    },

    "deviceHardwareRevision": {
        type: "Text",
        title: "Device Hardware Revision",
        searchable: true
    },

    "macAddress": {
        type: "Text",
        title: "MAC Address",
        searchable: true
    },

    "softwareLevel": {
        type: "Text",
        title: "Software Level",
        searchable: true
    }
};

/**
 * The CLI object contains the state machine, which is used to interact with the device. If it contains telnet/ssh/snmp macros the according functions are enabled in Netshot.
 * macros: The macro object contains the state machine targets, which can be reached by the currently active state e.g. ssh login --> authenticated with lowest privileges at the device
 * options: Potentially reachable state machine targets
 * target: The next state machine target after the current one
 * cmd: The command to reach the next state machine target
 * prompt: Regex for the standard prompt at the current state machine target
 * error: Regex for the error prompt at the current state machine target
 * pager: Describes the device's pagination functionality
 * avoid: CLI command to avoid pagination entirely
 * match: Prompt, if the pagination feature is active
 * respone: Keypress, which is sent, if the pagination feature is active
 */
var CLI = {

	ssh: {
		macros: {
			authenticated: {
				options: [ "authenticated" ],
				target: "authenticated"
			}
		}
	},
   
    authenticated: {
        prompt: /^\*?.*>$/m,
        error: /^Error: (.*)/m,
        pager: {
            avoid: "cli numlines 0",
            match: /^--More-- or \(q\)uit$/,
            response: " "
        },
        macros: {
                enable: {
                    cmd: "enable",
                    options: [ "enable" ],
                    target: "enable"
                }
        }
    },

    enable: {
        prompt: /^\*?.*#$/m,
        error: /^Error: (.*)/m,
        pager: {
            avoid: "cli numlines 0",
            match: /^--More-- or \(q\)uit$/,
            response: " "
        },
        macros: {
            configure: {
                cmd: "configure",
                options: [ "configure" ],
                target: "configure"
            },
            exit: {
                cmd: "exit",
                options: [ "authenticated" ],
                target: "authenticated"
            }
        }
    },

    configure: {
        prompt: /^\*?.*\(Config\)#$/m,
        error: /^Error: (.*)/m,
        pager: {
            match: /^--More-- or \(q\)uit$/,
            response: " "
        },
        macros: {
                exit: {
                    cmd: "exit",
                    options: [ "enable" ],
                    target: "enable"
                }
        }
    }
};

/**
 * Creates a snapshot of the device, extracting all configuration and device parameters
 * @param {*} cli Reference to the devices command line interface. Used to execute commands on the device
 * @param {*} device Dictionary containing all non-transient parameters
 * @param {*} config Dictionary containing versionable, transient parameters
 */
function snapshot(cli, device, config) {
    
    //change to enable mode
    cli.macro("authenticated");
    cli.macro("enable");

    systemInfo = cli.command("show system info");

    device.set("systemDescription",getSystemDescription(systemInfo));
    device.set("name",getSystemName(systemInfo));
    device.set("location",getSystemLocation(systemInfo));
    device.set("contact",getSystemContact(systemInfo));
    device.set("deviceHardwareDescription",getDeviceHardwareDescription(systemInfo));
    device.set("deviceHardwareRevision",getDeviceHardwareRevision(systemInfo));
    device.set("serialNumber",getSerialNumber(systemInfo));
    device.set("macAddress",getMacAddress(systemInfo));
    device.set("softwareVersion",getFirmwareSoftwareReleaseRam(systemInfo));

    getDeviceModules(device, cli);

    //change to configure mode
    cli.macro("configure")

    runningConfig = cli.command("show running-config script");

    config.set("firmwareSoftwareReleaseRam",getFirmwareSoftwareReleaseRam(systemInfo));
    config.set("firmwareSoftwareReleaseFlash",getFirmwareSoftwareReleaseFlash(systemInfo));
    device.set("family",getDeviceFamily(runningConfig));
    device.set("networkClass",getDeviceNetworkClass(runningConfig));
    config.set("runningConfig", runningConfig);
    device.set("softwareLevel",getDeviceSoftwareLevel(runningConfig));

    populateInterfaces(device, runningConfig, systemInfo);
};

/**
 * Extracts the system description of the device
 * @param {*} systemInfo Output from show system info
 * @returns The system description
 */
function getSystemDescription(systemInfo) {
    var systemDescription = systemInfo.match(/^System Description\.*(.*)$/m);
    if(systemDescription){
        return systemDescription[1];
    }

    return "";
}

/**
 * Extracts the system name of the device
 * @param {*} systemInfo Output from show system info
 * @returns The system name
 */
function getSystemName(systemInfo) {
    var systemName = systemInfo.match(/^System name\.*(.*)$/m);
    if(systemName){
        return systemName[1];
    }

    return "";
}

/**
 * Extracts the system location of the device
 * @param {*} systemInfo Output from show system info
 * @returns The system location
 */
function getSystemLocation(systemInfo) {
    var systemLocation = systemInfo.match(/^System location\.*(.*)$/m);
    if(systemLocation){
        return systemLocation[1];
    }

    return "";
}

/**
 * Extracts the system contact of the device
 * @param {*} systemInfo Output from show system info
 * @returns The system contact
 */
function getSystemContact(systemInfo) {
    var systemContact = systemInfo.match(/^System contact\.*(.*)$/m);
    if(systemContact){
        return systemContact[1];
    }

    return "";
}

/**
 * Extracts the hardware description of the device
 * @param {*} systemInfo Output from show system info
 * @returns The hardware description
 */
function getDeviceHardwareDescription(systemInfo) {
    var deviceHardwareDescription = systemInfo.match(/^Device hardware description\.*(.*)$/m);
    if(deviceHardwareDescription){
        return deviceHardwareDescription[1];
    }

    return "";
}

/**
 * Extracts the hardware revision of the device
 * @param {*} systemInfo Output from show system info
 * @returns The hardware revision
 */
function getDeviceHardwareRevision(systemInfo) {
    var deviceHardwareRevision = systemInfo.match(/^Device hardware revision\.*(.*)$/m);
    if(deviceHardwareRevision){
        return deviceHardwareRevision[1];
    }

    return "";
}

/**
 * Extracts the serialnumber of the device
 * @param {*} systemInfo Output from show system info
 * @returns The serialnumber
 */
function getSerialNumber(systemInfo) {
    var serialNumber = systemInfo.match(/^Serial number\.*(.*)$/m);
    if(serialNumber){
        return serialNumber[1];
    }

    return "";
}

/**
 * Extracts the MAC address of the device
 * @param {*} systemInfo Output from show system info
 * @returns The MAC address
 */
function getMacAddress(systemInfo) {
    var macAddress = systemInfo.match(/^MAC address \(management\)\.*(.*)$/m);
    if(macAddress){
        return macAddress[1];
    }

    return "";
}

/**
 * Extracts the IP address of the device
 * @param {*} systemInfo Output from show system info
 * @returns The IP address
 */
function getManagementIP(systemInfo) {
    var ipAddress = systemInfo.match(/^IP address \(management\)\.*(.*)$/m);
    if(ipAddress){
        return ipAddress[1];
    }

    return "";
}

/**
 * Extracts the firmware software release (in RAM) of the device
 * @param {*} systemInfo Output from show system info
 * @returns The firmware software release (in RAM)
 */
function getFirmwareSoftwareReleaseRam(systemInfo){
    var firmwareSoftwareReleaseRam = systemInfo.match(/^Firmware software release \(RAM\)\.*(.*)$/m);
    if(firmwareSoftwareReleaseRam){
        return firmwareSoftwareReleaseRam[1];
    }

    return "";
}

/**
 * Extracts the firmware software release (in flash) of the device
 * @param {*} systemInfo Output from show system info
 * @returns The firmware software release (in flash)
 */
function getFirmwareSoftwareReleaseFlash(systemInfo){
    var firmwareSoftwareReleaseFlash = systemInfo.match(/^Firmware software release \(FLASH\)\.*(.*)$/m);
    if(firmwareSoftwareReleaseFlash){
        return firmwareSoftwareReleaseFlash[1];
    }

    return "";
}

/**
 * Extracts the device family from the running config
 * @param {*} runningConfig Output from show running-config script
 * @returns The device family
 */
function getDeviceFamily(runningConfig) {
    var deviceFamily = runningConfig.match(/^!\s(.*) Configuration$/m);
    if(deviceFamily) {
        return deviceFamily[1];
    }

    return "";
}

/**
 * Extracts the device's network class from the running config
 * The network class is an enum in src/main/java/onl/netfishers/netshot/device/Device.java
 * @param {*} runningConfig Output from show running-config script
 * @returns The network class
 */
function getDeviceNetworkClass(runningConfig) {
    var osiLayer = getDeviceOSILayer(runningConfig);
    var networkClassDictionary = {
        2 : "SWITCH",
        3 : "ROUTER"
    };

    if(osiLayer){
        return networkClassDictionary[osiLayer];
    }

    return "";
}

/**
 * Helper function to extract the device OSI layer from running config
 * @param {*} runningConfig Output from show running-config script
 * @returns The OSI layer
 */
function getDeviceOSILayer(runningConfig) {
    var osiLayer = runningConfig.match(/^.*Version: HiOS-([2-3]).*-.*$/m);
    if(osiLayer) {
        return parseInt(osiLayer[1]);
    }

    return 1;
}

/**
 * Gets the device software level from running config
 * @param {*} runningConfig Output from show running-config script
 * @returns The software level
 */
function getDeviceSoftwareLevel(runningConfig) {
    var firmwareLevel = runningConfig.match(/^.*Version: HiOS-[23]([A,E,S])-.*$/m);
    var firmwareLevelDictionary = {
        "A" : "Advanced",
        "E" : "Embedded",
        "S" : "Standard"
    };

    if(firmwareLevel){
        return firmwareLevelDictionary[firmwareLevel[1]];
    }

    return "";
}

/**
 * Helper function to convert a dotted decimals subnetmask to CIDR notation
 * @param {*} runningConfig Output from show running-config script
 * @returns The subnetmask in CIDR notation
 */
function getManagementSubnetMaskCIDR(runningConfig) {
    var mask = runningConfig.match(/^network parms ((.*) (.*) (.*) )$/m);
    if(mask) {
        const splittedMask = mask[3].split(".");
        var binaryMask = "";

        for(var i = 0; i < splittedMask.length; i++) {
            //Save to use because there are only positive numbers in the range 0-255
            binaryMask += parseInt(splittedMask[i]).toString(2);
        }

        return binaryMask.match(/1/g).length;
    }

    return 32;
}

/**
 * Gets the device's network interfaces
 * @param {*} runningConfig Output from show running-config script
 * @returns The network interfaces
 */
function getInterfaces(runningConfig) {
    var interfaces = runningConfig.match(/^interface.*$/mg);
    var endToken = "exit";
    var interfaceCount = interfaces.length;
    var runningConfigLineByLine = runningConfig.split(/\r?\n/);
    var runningConfigLineIndex = 0;
    var returnInterfaces = [];

    for(var i = 0; i < interfaceCount; i++) {
        
        var networkInterface = {
            name: "",
            config: "",
        };

        /*search for interface; we do not need to reset the runningConfigLineIndex because the interfaces are ordered
        from top to bottom in the running config. Trim is needed because runningConfig can't be split without ending whitespaces*/
        while(!(interfaces[i] === runningConfigLineByLine[runningConfigLineIndex].trim())) {
            runningConfigLineIndex++;
        }

        networkInterface.name = runningConfigLineByLine[runningConfigLineIndex].replace("interface ", "").trim();
        runningConfigLineIndex++;

        //Populate configuration
        while(!(runningConfigLineByLine[runningConfigLineIndex].trim() === endToken)) {
            networkInterface.config += runningConfigLineByLine[runningConfigLineIndex].trim();
            networkInterface.config += "\n";
            runningConfigLineIndex++;
        }

        returnInterfaces.push(networkInterface);
    }

    return returnInterfaces;
}

/**
 * Populates the device interfaces in Netshot
 * Interface properties can be viewed in https://github.com/netfishers-onl/Netshot/blob/master/src/main/java/onl/netfishers/netshot/device/NetworkInterface.java
 * @param {*} device The device object
 * @param {*} runningConfig Output from show running-config script
 * @param {*} systemInfo Output from show system info
 */
function populateInterfaces(device, runningConfig, systemInfo) {
    var interfaces = getInterfaces(runningConfig);

    for(var i = 0; i < interfaces.length; i++) {
        var networkInterface = {
            name: interfaces[i].name,
            ip: []
        };
        
        //Fetch the interface description
        var description = interfaces[i].config.match(/^name (.+)$/m);
        if(description){
            networkInterface.description = description[1];
        }

        //All interfaces but cpu are L2 for now
        networkInterface.level3 = false;

        //Fetch the enabled status
        var shutdown = interfaces[i].config.match(/^(shutdown)$/m);
        if(shutdown) {
            networkInterface.enabled = false;
        }

        device.add("networkInterface", networkInterface);
    }

    var cpuInterface = {
        name: "cpu/1",
        ip: [],
        mac: getMacAddress(systemInfo),
        level3: true,
        enable: true,
        description: "Management"
    };

    var ip = {
        ip: getManagementIP(systemInfo),
        mask: getManagementSubnetMaskCIDR(runningConfig),
    };

    cpuInterface.ip.push(ip);
    device.add("networkInterface", cpuInterface);
    
}

/**
 * Gets the device's modules e.g. SFPs, external USB memory, ...
 * @param {*} device The device object
 * @param {*} cli The command line interface object
 * @returns the device's modules
 */
function getDeviceModules(device, cli) {
    var sfpText = cli.command("show sfp");
    var sfpSlotNumbers = sfpText.match(/\d\/\d/g);

    if(sfpSlotNumbers) {
        for(var i = 0; i < sfpSlotNumbers.length; i++) {
            var command = "show sfp ".concat(sfpSlotNumbers[i]);
            var sfpInfo = cli.command(command)
            var module = {
                slot: "SFP ".concat(sfpSlotNumbers[i]),
                partNumber: sfpInfo.match(/^Part number\.*(.*)/m)[1],
                serialNumber: sfpInfo.match(/^Serial number\.*(.*)/m)[1]
            };

            device.add("module", module)
        }
    }

    var envmText = cli.command("show config envm properties");
    if(!envmText) {
        return;
    }

    var envmSplit = envmText.split(/\r?\n/);

    if(envmSplit.length < 3) {
        return;
    }

    //Remove unnecessary header lines and footer lines
    envmSplit = envmSplit.slice(2,envmSplit.length-3);

    var typeColumnIndex = 0;
    var nameColumnIndex = 6;
    var serialNumberColumnIndex = 7;

    for (var i = 0; i < envmSplit.length; i++) {
        var singleLineSplit = envmSplit[i].split(/\s+/)
        var module = {
                        slot: (singleLineSplit[typeColumnIndex]).toUpperCase(),
                        partNumber: singleLineSplit[nameColumnIndex],
                        serialNumber: singleLineSplit[serialNumberColumnIndex]
        };

        device.add("module", module);
    }
}

/**
 * Analyzes syslog messages
 * @param {*} message The syslog message 
 * @returns true if the message can be handled, otherwise false
 */
function analyzeSyslog(message) {
	return false;
}

/**
 * Captures SNMP traps
 * @param {*} trap The SNMP trap
 * @param {*} debug true activates enhanced debugging
 * @returns true if the trap can be handled, otherwise false
 */
function analyzeTrap(trap, debug) {
	return false;
}

/**
 * Enables device autodiscovery via SNMP
 * @param {*} sysObjectID The SNMP object numerical id
 * @param {*} sysDesc The system description
 * @returns true if auto discovery parameters match, otherwise false
 */
function snmpAutoDiscover(sysObjectID, sysDesc) {
	
    /*  
        OID 1.3.6.1.2.1.1.2.0 = Contains the vendors sub OID space
        OID 1.3.6.1.4.1.248.11.2.1.15 = Hirschmann products
        sysDesc comes from OID 1.3.6.1.2.1.1.1.0
    */
    if(sysObjectID.startsWith("1.3.6.1.4.1.248.11.2.1.15") && sysDesc.match(/^Hirschmann.*/)) {
        return true;
    }

    return false;
}