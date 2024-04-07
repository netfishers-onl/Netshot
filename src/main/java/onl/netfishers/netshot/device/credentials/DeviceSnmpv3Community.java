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
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

import javax.xml.bind.annotation.XmlElement;
import org.hibernate.annotations.Type;

import onl.netfishers.netshot.rest.RestViews.DefaultView;


/**
 * The Class DeviceSnmpv3Community.
 */
@Entity
@XmlRootElement
public class DeviceSnmpv3Community extends DeviceSnmpCommunity {

	/** The username. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@Type(type = "credentialString")
	}))
	@Setter
	private String username;
		/** The auth type. */

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@Type(type = "credentialString")
	}))
	@Setter
	private String authType;
	
	/** The auth key. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@Type(type = "credentialString")
	}))
	@Setter
	private String authKey;
	
	/** The priv type. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@Type(type = "credentialString")
	}))
	@Setter
	private String privType;
	
	/** The priv key. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@Type(type = "credentialString")
	}))
	@Setter
	private String privKey;

	/**
	 * Instantiates a new device snmpv 3 community.
	 */
	protected DeviceSnmpv3Community() {

	}

	/**
	 * Instantiates a new device snmpv 3 community.
	 *
	 * @param community the community
	 * @param name the name
	 * @param username the username
	 * @param authType the auth type
	 * @param authKey the auth key
	 * @param privType the priv type
	 * @param privKey the priv key
	 */
	public DeviceSnmpv3Community(String community, String name, String username, String authType,
			String authKey, String privType, String privKey) {
		super(community, name);
		this.username = username;
		this.authType = authType;
		this.authKey = authKey;
		this.privType = privType;
		this.privKey = privKey;
	}

	public void removeSensitive() {
		this.authKey = "-";
		this.privKey = "-";
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + ((name == null) ? 0 : name.hashCode());
		return result;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity#equals(java.
	 * lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (!super.equals(obj)) {
			return false;
		}
		if (!(obj instanceof DeviceSnmpv3Community)) {
			return false;
		}
		DeviceSnmpv3Community other = (DeviceSnmpv3Community) obj;
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
