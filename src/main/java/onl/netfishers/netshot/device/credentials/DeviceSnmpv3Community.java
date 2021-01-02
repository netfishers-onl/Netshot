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
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

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
	private String username;
	
	/** The auth type. */
	private String authType;
	
	/** The auth key. */
	private String authKey;
	
	/** The priv type. */
	private String privType;
	
	/** The priv key. */
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

	/**
	 * Gets the username.
	 *
	 * @return the username
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Type(type = "credentialString")
	public String getUsername() {
		return username;
	}

	/**
	 * Sets the username.
	 *
	 * @param snmpv3Username the new username
	 */
	public void setUsername(String snmpv3Username) {
		this.username = snmpv3Username;
	}

	/**
	 * Gets the auth type.
	 *
	 * @return the auth type
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Type(type = "credentialString")
	public String getAuthType() {
		return authType;
	}

	/**
	 * Sets the auth type.
	 *
	 * @param snmpv3AuthType the new auth type
	 */
	public void setAuthType(String snmpv3AuthType) {
		this.authType = snmpv3AuthType;
	}


	/**
	 * Gets the auth key.
	 *
	 * @return the auth key
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Type(type = "credentialString")
	public String getAuthKey() {
		return authKey;
	}


	/**
	 * Sets the auth key.
	 *
	 * @param snmpv3AuthKey the new auth key
	 */
	public void setAuthKey(String snmpv3AuthKey) {
		this.authKey = snmpv3AuthKey;
	}

	/**
	 * Gets the priv type.
	 *
	 * @return the priv type
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Type(type = "credentialString")
	public String getPrivType() {
		return privType;
	}

	/**
	 * Sets the priv type.
	 *
	 * @param snmpv3PrivType the new priv type
	 */
	public void setPrivType(String snmpv3PrivType) {
		this.privType = snmpv3PrivType;
	}

	/**
	 * Gets the priv key.
	 *
	 * @return the priv key
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Type(type = "credentialString")
	public String getPrivKey() {
		return privKey;
	}

	
	/**
	 * Sets the priv key.
	 *
	 * @param snmpv3PrivKey the new priv key
	 */
	public void setPrivKey(String snmpv3PrivKey) {
		this.privKey = snmpv3PrivKey;
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
