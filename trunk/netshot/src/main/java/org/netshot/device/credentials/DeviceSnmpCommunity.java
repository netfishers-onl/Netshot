/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device.credentials;

import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlElement;


/**
 * A SNMP community to poll a device.
 */
@Entity
public abstract class DeviceSnmpCommunity extends DeviceCredentialSet {
	
	/** The community. */
	private String community;
	
	/**
	 * Instantiates a new device snmp community.
	 */
	protected DeviceSnmpCommunity() {
		
	}
	
	/**
	 * Instantiates a new device snmp community.
	 *
	 * @param community the community
	 * @param name the name
	 */
	public DeviceSnmpCommunity(String community, String name) {
		super(name);
		this.community = community;
	}
	
	/**
	 * Gets the community.
	 *
	 * @return the community
	 */
	@XmlElement
	public String getCommunity() {
		return community;
	}
	
	/**
	 * Sets the community.
	 *
	 * @param community the new community
	 */
	public void setCommunity(String community) {
		this.community = community;
	}

	/* (non-Javadoc)
	 * @see org.netshot.device.credentials.DeviceCredentialSet#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + ((name == null) ? 0 : name.hashCode());
		return result;
	}

	/* (non-Javadoc)
	 * @see org.netshot.device.credentials.DeviceCredentialSet#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (!super.equals(obj)) {
			return false;
		}
		if (!(obj instanceof DeviceSnmpCommunity)) {
			return false;
		}
		DeviceSnmpCommunity other = (DeviceSnmpCommunity) obj;
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
