/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device.credentials;

import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlRootElement;

/**
 * A Telnet account.
 */
@Entity
@XmlRootElement()
public class DeviceTelnetAccount extends DeviceCliAccount {

	/**
	 * Instantiates a new device telnet account.
	 */
	protected DeviceTelnetAccount() {
		
	}
	
	/**
	 * Instantiates a new device telnet account.
	 *
	 * @param username the username
	 * @param password the password
	 * @param superPassword the super password
	 * @param name the name
	 */
	public DeviceTelnetAccount(String username, String password,
			String superPassword, String name) {
		super(username, password, superPassword, name);
	}

	/* (non-Javadoc)
	 * @see org.netshot.device.credentials.DeviceCliAccount#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + ((name == null) ? 0 : name.hashCode());
		return result;
	}

	/* (non-Javadoc)
	 * @see org.netshot.device.credentials.DeviceCliAccount#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (!super.equals(obj)) {
			return false;
		}
		if (!(obj instanceof DeviceTelnetAccount)) {
			return false;
		}
		DeviceTelnetAccount other = (DeviceTelnetAccount) obj;
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
