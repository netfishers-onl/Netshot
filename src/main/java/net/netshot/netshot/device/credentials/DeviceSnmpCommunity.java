/**
 * Copyright 2013-2025 Netshot
 * 
 * This file is part of Netshot project.
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
package net.netshot.netshot.device.credentials;

import com.fasterxml.jackson.annotation.JsonView;

import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.xml.bind.annotation.XmlElement;
import lombok.Getter;
import lombok.Setter;
import net.netshot.netshot.database.StringEncryptorConverter;
import net.netshot.netshot.rest.RestViews.DefaultView;


/**
 * A SNMP community to poll a device.
 */
@Entity
public abstract class DeviceSnmpCommunity extends DeviceCredentialSet {

	/** The community. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class),
		@Convert(converter = StringEncryptorConverter.class)
	}))
	@Setter
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

	/*(non-Javadoc)
	 * @see net.netshot.netshot.device.credentials.DeviceCredentialSet#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + (name == null ? 0 : name.hashCode());
		return result;
	}

	/*(non-Javadoc)
	 * @see net.netshot.netshot.device.credentials.DeviceCredentialSet#equals(java.lang.Object)
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
		}
		else if (!name.equals(other.name)) {
			return false;
		}
		return true;
	}

}
