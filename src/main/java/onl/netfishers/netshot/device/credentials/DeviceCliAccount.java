/**
 * Copyright 2013-2021 Sylvain Cadilhac (NetFishers)
 * 
 * This file is part of Netshot.
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
package onl.netfishers.netshot.device.credentials;

import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import org.hibernate.annotations.Type;

import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * A CLI account.
 */
@Entity
@XmlRootElement
public abstract class DeviceCliAccount extends DeviceCredentialSet {

	/** The username. */
	private String username;
	
	/** The password. */
	private String password;
	
	/** The super password. */
	private String superPassword;
	
	/**
	 * Instantiates a new device cli account.
	 */
	protected DeviceCliAccount() {
		// Reserved for Hibernate
	}
	
	/**
	 * Instantiates a new device cli account.
	 *
	 * @param username the username
	 * @param password the password
	 * @param superPassword the super password
	 * @param name the name
	 */
	public DeviceCliAccount(String username, String password,
			String superPassword, String name) {
		super(name);
		this.username = username;
		this.password = password;
		this.superPassword = superPassword;
	}
	
	/**
	 * Gets the username.
	 *
	 * @return the username
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public String getUsername() {
		return username;
	}
	
	/**
	 * Sets the username.
	 *
	 * @param username the new username
	 */
	public void setUsername(String username) {
		this.username = username;
	}
	
	/**
	 * Gets the password.
	 *
	 * @return the password
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Type(type = "credentialString")
	public String getPassword() {
		return password;
	}
	
	/**
	 * Sets the password.
	 *
	 * @param password the new password
	 */
	public void setPassword(String password) {
		this.password = password;
	}
	
	/**
	 * Gets the super password.
	 *
	 * @return the super password
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Type(type = "credentialString")
	public String getSuperPassword() {
		return superPassword;
	}
	
	/**
	 * Sets the super password.
	 *
	 * @param superPassword the new super password
	 */
	public void setSuperPassword(String superPassword) {
		this.superPassword = superPassword;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.credentials.DeviceCredentialSet#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + ((name == null) ? 0 : name.hashCode());
		return result;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.credentials.DeviceCredentialSet#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (!super.equals(obj)) {
			return false;
		}
		if (!(obj instanceof DeviceCliAccount)) {
			return false;
		}
		DeviceCliAccount other = (DeviceCliAccount) obj;
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
