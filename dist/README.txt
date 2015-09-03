
Netshot, a free network management and compliance tool, provided by NetFishers.

For more information, visit http://www.netfishers.onl/netshot
or contact us at netshot@netfishers.onl.



RELEASE HISTORY:


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
