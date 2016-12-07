
Netshot, a free network management and compliance tool, provided by NetFishers.

For more information, visit http://www.netfishers.onl/netshot
or contact us at netshot@netfishers.onl.



RELEASE HISTORY:

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
