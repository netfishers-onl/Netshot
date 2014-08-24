/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device;

import org.netshot.device.access.Snmp;

/**
 * A device class which implements this interface can be discovered by SNMP.
 */
public interface AutoSnmpDiscoverableDevice {

	/**
	 * Snmp auto discover.
	 *
	 * @param sysObjectId the sys object id
	 * @param sysDesc the sys desc
	 * @param poller the poller
	 * @return true, if the SNMP result matches this type of result
	 */
	public boolean snmpAutoDiscover(String sysObjectId, String sysDesc, Snmp poller);
	
}
