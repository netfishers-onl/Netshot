
Netshot, a free network management and compliance tool, provided by NetFishers.

For more information, visit http://www.netfishers.onl/netshot
or contact us at netshot@netfishers.onl.


INSTALLATION AND UPGRADE INSTRUCTIONS:

Please refer to https://github.com/netfishers-onl/Netshot/wiki


RELEASE HISTORY:

0.16.1 - 2021-02-19

* Fix for IP addresses being rejected
* Fix for DB schema update


0.16.0 - 2021-02-01

* The JavaScript engine is now based on GraalVM
* Python-based compliance and diagnostic scripts
* Recurring tasks with multiply factor
* Post-task Web hooks
* SSH logger
* Ciena SAOS driver (first release)
* Cisco Viptela driver (first release)
* Cisco IOS-XR driver improvements
* OpenAPI definition and embedded UI browser
* Tokens for API access (rather than session-based)
* Improved API return codes
* New config options and files for Docker support
* Underlying library updates
* UI minor improvements
* Various fixes


0.15.2 - 2020-09-04

* Minor UI improvements/fixes
* Fix for PostgreSQL mapped table names
* SSH library upgrade and SSH parameters exposed to netshot.conf
* Fix for group folders with special characters
* More debug and logs on tasks
* Cisco IOS - fix Catalyst 3560 reported family and add more Catalyst 9k


0.15.1 - 2020-07-30

* Minor UI improvements/fixes
* Library (Hibernate) major upgrade
* Report query optimizations


0.15.0 - 2020-07-10

* Refreshed Web User Interface
* Library updates (vulnerability fixes)
* Improve audit logs
* Make device comments acessible from JS scripts
* Support device-specific accounts in DeviceListExtractor script
* Fix for software rule not properly matched
* Data export - add compliance data, device groups, and basic XLS style
* Add reports/configcompliancedevicestatuses API endpoint
* Table view for software compliance report
* Add Normalize option to text-based compliance rules


0.14.1 - 2019-10-26

* Library update (vulnerability fix)
* Fix an error which could prevent the removal of credential sets
* Add support for PKCS12 keystores (default now)


0.14.0 - 2019-08-12

* Make SNMP poller available to drivers
* Add a priority system for drivers
* Add generic SNMP driver
* Fix for Checkpoint SPLAT driver (paging)
* Add Catalyst 9000 families to Cisco IOS driver
* Library update (vulnerability)

0.13.1 - 2019-07-26

* Add more filters to the Config compliance report view
* Update libraries (vulnerability)
* Add Bouncy Castle as default security library (for better SSH algo coverage)

0.13.0 - 2019-06-26

* Add binary file attributes
* Add SCP and SFTP for the drivers to download files from the devices
* Update Checkpoint GAIA driver, and add Checkpoint SPLAT
* Updated FortiGate driver

0.12.7 - 2019-05-22

* Increase the size of basic text diagnostic result fields
* Add the ability to customize the SSH/Telnet connection timeout via netshot.conf

0.12.6 - 2019-04-11

* Fix an error which might happen while updating diagnostic results
* Add the debug checkbox option on diagnostic tasks
* Minor UI improvements

0.12.5 - 2019-03-24

* Fix a couple of bugs on the "Changes over the last days" chart
* Fix a bug on the migration schema for PostgreSQL

0.12.4 - 2019-03-06

* Fix a bug at UI loading time for some browsers

0.12.3 - 2019-02-27

* Fix the usage of device-specific credential sets

0.12.2 - 2019-02-25

* Fix the migration file for MariaDB
* Fix the SNMPv3 dialog (username field was not appearing)
* Fix deletion of diagnostics by deleting the results in cascade

0.12.1 - 2019-02-23

* Fixes (PostgreSQL support, RADIUS authentication, diagnostic edition)

0.12.0 - 2019-02-21

* Add the diagnostics feature
* Add the ability to search (and group) devices based on their family
* A few driver fixes (IOS, IOS-XR, Nokia)

0.11.O - 2019-01-27

* Fix some bugs with PostgreSQL
* Add SNMPv3 (formatted work from @eczema)
* Netshot is now using Liquibase for the DB schema migrations
* New drivers: Checkpoint Gaia, Gigamon GigaVUE
* A few other bug fixes especially in drivers

0.10.0 - 2018-10-20

* Add support for PostgreSQL as underlying database (thanks to @eczema) -- experimental for now though.

0.9.0b - 2018-08-30

* Reduce the memory footprint of data export.

0.9.0a - 2018-08-29

* Fix a bug (regression of 0.9.0) which affects the performance of data export (visible with huge lists of devices).

0.9.0 - 2018-08-26

* The command timeout value is now an idle timeout while waiting for data from the device.
* Add first version of F5 TM-OS (BIG-IP) driver.
* Add more logging options.
* Add the ability to search based on device domains, and to build dynamic groups based on device domains.
* Add the ability to filter reports based on device domains.
* Cisco IOS-XR: more device families (NCS).
* More details in SNMP trap received error message.

0.8.1 - 2018-06-05

* Improved debug mode for snapshot tasks (now log the buffer in case of timeout).
* FortiOS: increase the timeout delay on the main 'show' command.
* ScreenOS: increase the timeout delay on the main 'get config' command.
* Cisco IOS: more families.
* Add Arista EOS driver.
* Fix a bug when the 'timeout' option is used in the drivers.
* Fix a bug where Netshot wasn't properly trying the next available SSH credentials after an authentication failure.

0.8.0 - 2018-03-04

* Debug mode for snapshot tasks (hidden by default). This makes easy to debug drivers.
* Snapshot and run scripts have now access to the current device data, so they can compute some differences before
pushing a new config to the history (for example).
* Updates on FortiOS and Avaya drivers.

0.7.3 - 2018-02-19

* It is now possible to match on the part number (from hardware inventory) within the software compliance rules.
* Most of the tables within the Web interface are now sortable (by clicking on the headers).
* A few driver updates.

0.7.2 - 2017-12-22

* Allow the same connect IP address for different devices (probably using different ports)

0.7.1 - 2017-12-21

* Device-specific credentials -- fix a bug where they could be used by another device.
* Rename netshot.db.encryptionPassword to netshot.db.encryptionpassword for consistency. With backward compatibility.

0.7.0 - 2017-12-09

* Device-specific credentials
* Ability to set alternate IP address and TCP port to connect to the device (allow for connection through TCP proxy)

0.6.1 - 2017-09-14

* Add ScreenOS driver
* Various improvements on drivers

0.6.0 - 2017-08-13

* BREAKING CHANGE: Encrypt the secrets (communities, passwords) in the database
  (=> see the update notes)
* Add Palo Alto PanOS driver (from agm)
* Add Riverbed RiOS driver (from agm)
* Fix - Remove ANSI escape characters from CLI outputs
* Several minor fixes in drivers
* Fix MSCHAPv2 for RADIUS authentication


0.5.8 - 2016-01-12

* Fix for HSRPv6 in XR driver
* Improve the config compliance chart
* Improve the Junos driver
* Add a systemd unit file
* Fix a bug on the device compliance page


0.5.7 - 2016-12-26

* Fixes for a couple of bugs on the charts


0.5.6 - 2016-12-07

* Update the charts (now using Chart.js version 2) in reports. This fixes
  the size of the charts for the high resolution screens.
* Update the Junos driver (now storing the configuration in "set" version
  as well).


0.5.5 - 2016-09-02

* Various updates on drivers. This includes the addition of Citrix
  NetScaler and Avaya ERS basic drivers (to be improved).
* A bug on the removal of backspaces (when using paging) has been fixed.
* The code is now released under GPLv3.
* The strict prompt check feature has been improved (i.e. when Netshot
  tries to find the saved prompt rather than simply using the prompt
  regex).
* Most of the underlying libraries have been updated to the last
  available version (in the same train).
* A few UI fixes.
* There was a bug on Excel export function: interfaces without IP
  address were not exported.


0.5.4 - 2016-07-02

* A 'sleep' function is now available for the drivers which need it.
* The 'noCr' option prevents the automatic sending of Carriage Return to
  the device after a command.


0.5.1 - 2015-10-01

* Ability to select the protocol used over RADIUS to authenticate
  a remote user, using the netshot.aaa.radius.method config line


0.5.0 - 2015-07-14

* Key-based SSH authentication to access devices
* MySQL 5.6 compatibility
* Automatic purge of old configurations using the Purge Database task
* Source IP of improper SNMP traps now displayed in the logs
* 'comment' field in the result of JavaScript rules now properly truncated to 255 characters
* Search toolbox bug fix ([IP address] vs [IP])


0.4.5 - 2015-03-23

This release includes bug fixes only:
* Huawei NE, Fortinet, ASA drivers
* Rule exemptions
* Saving text rules
* Displaying XML configurations

0.4.4 - 2014-12-07

* Fix for the 'dump' feature (dump the last configuration as a file after each
  snapshot on the local system) which never worked in the previous public
  releases.
    This requires a specific option in the Netshot configuration file:
        netshot.snapshots.dump = /path/to/a/local/folder
    The Config attributes with the 'dump' option set to true or to an object
    with additional parameters will be written to the file.


0.4.3a - 2014-11-18

The distribution package now includes a RedHat/CentOS compatible start script.
No change in Netshot itself.
 

0.4.3 - 2014-11-16

The initial public release.
