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

import com.fasterxml.jackson.annotation.JsonView;

import org.hibernate.annotations.Type;

import onl.netfishers.netshot.rest.RestViews.DefaultView;


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
	@XmlElement @JsonView(DefaultView.class)
	@Type(type = "credentialString")
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
