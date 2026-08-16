# Device drivers

Each supported type of device in Netshot relies on a single JavaScript file, often called a _driver_. This file describes the special attributes of the device type (e.g. running configuration and configuration register for a Cisco IOS device), and contains runnable code that will be executed when interacting with the device (e.g. taking a snapshot of the device).

## Driver location

The Netshot package (especially the `.jar` file) contains several built-in drivers for some well-known network device operating systems. These drivers are automatically loaded from the package without further action, which makes Netshot able to manage most router and switch devices out of the box.

Netshot also automatically loads drivers from the file system, which allows you to add your own driver files, by placing them in the directory defined in the Netshot configuration file by `netshot.drivers.path`.

If you want to make changes to an existing built-in driver, you can extract it from the `.jar` file, and copy it to the driver directory. A driver loaded from the file system takes priority over the built-in driver of the same name.

Drivers can be dynamically reloaded while Netshot runs, from the Admin page.

## Driver structure

A driver is a JavaScript file.

A driver must contain the following global objects:

* `Info`: object describing the driver.
* `Device`: object describing the specific attributes of this type of device.
* `Config`: object describing the attributes of a configuration of a device of this type (a history of these attributes is kept, as opposed to the device attributes).
* `CLI`: object containing the logic to interact with the device's CLI, as a state machine.
* `snapshot(cli, device, config, debug)`: a function called each time a snapshot on a device of this type is started.
* `analyzeSyslog(message)`: function automatically called whenever a Syslog message is received. The function must return true if it recognizes a configuration change notification for the type of device it supports.
* `analyzeTrap(trap)`: function automatically called whenever a trap message is received (with the right community). The function must return true if it recognizes a configuration change notification for the specific type of device it supports.
* `snmpAutoDiscover(sysObjectID, sysDesc)`: function called when a device is added to Netshot in autodiscovery mode. The driver looks at the `sysObjectID` and `sysDesc` and returns true if it thinks it can support this device. If it returns true, Netshot will effectively add the device to the database, and assign this driver to the device for future actions.
