/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device.credentials;

import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlRootElement;

/**
 * A SNMPv1 community.
 */
@Entity
@XmlRootElement
public class DeviceSnmpv1Community extends DeviceSnmpCommunity {

	/**
	 * Instantiates a new device snmpv1 community.
	 */
	protected DeviceSnmpv1Community() {
		
	}
	
	/**
	 * Instantiates a new device snmpv1 community.
	 *
	 * @param community the community
	 * @param name the name
	 */
	public DeviceSnmpv1Community(String community, String name) {
		super(community, name);
	}

	/* (non-Javadoc)
	 * @see org.netshot.device.credentials.DeviceSnmpCommunity#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + ((name == null) ? 0 : name.hashCode());
		return result;
	}

	/* (non-Javadoc)
	 * @see org.netshot.device.credentials.DeviceSnmpCommunity#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (!super.equals(obj)) {
			return false;
		}
		if (!(obj instanceof DeviceSnmpv1Community)) {
			return false;
		}
		DeviceSnmpv1Community other = (DeviceSnmpv1Community) obj;
		if (name == null) {
			if (other.name != null) {
				return false;
			}
		} else if (!name.equals(other.name)) {
			return false;
		}
		return true;
	}

}
