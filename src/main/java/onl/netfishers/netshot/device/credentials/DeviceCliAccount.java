/**
 * Copyright 2013-2024 Netshot
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

import lombok.Getter;
import lombok.Setter;

import org.hibernate.annotations.Type;

import onl.netfishers.netshot.rest.RestViews.RestApiView;

/**
 * A CLI account.
 */
@Entity
@XmlRootElement
public abstract class DeviceCliAccount extends DeviceCredentialSet {

	/** The username. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(RestApiView.class)
	}))
	@Setter
	private String username;
	
	/** The password. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(RestApiView.class),
		@Type(type = "credentialString")
	}))
	@Setter
	private String password;
	
	/** The super password. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(RestApiView.class),
		@Type(type = "credentialString")
	}))
	@Setter
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

	public void removeSensitive() {
		this.password = "-";
		this.superPassword = "-";
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
