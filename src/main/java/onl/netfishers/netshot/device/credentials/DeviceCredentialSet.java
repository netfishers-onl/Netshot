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

import java.util.Date;
import java.util.UUID;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
import javax.persistence.Version;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlID;
import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.device.Domain;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

import org.hibernate.annotations.NaturalId;
import org.hibernate.annotations.Parameter;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;
import org.jasypt.hibernate5.type.EncryptedStringType;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;

import lombok.Getter;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;

/**
 * A credential set. Authentication data to access a device.
 */
@Entity @Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@XmlAccessorType(value = XmlAccessType.NONE)
@XmlRootElement()
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
	@Type(value = DeviceSnmpv1Community.class, name = "SNMP v1"),
	@Type(value = DeviceSnmpv2cCommunity.class, name = "SNMP v2"),
	@Type(value = DeviceSnmpv3Community.class, name = "SNMP v3"),
	@Type(value = DeviceSshAccount.class, name = "SSH"),
	@Type(value = DeviceSshKeyAccount.class, name = "SSH Key"),
	@Type(value = DeviceTelnetAccount.class, name = "Telnet")
})
@TypeDefs({
	@TypeDef(
		name = "credentialString",
		typeClass = EncryptedStringType.class,
		parameters = {
			@Parameter(name = "encryptorRegisteredName", value = "credentialEncryptor")
		}
	)
})
abstract public class DeviceCredentialSet {
	
	static public String generateSpecificName() {
		return String.format("DEVICESPECIFIC-%s", UUID.randomUUID());
	}

	/** The change date. */
	@Getter
	@Setter
	protected Date changeDate;
	
	@Getter(onMethod=@__({
		@Version
	}))
	@Setter
	private int version;
	
	/** The id. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@XmlID, @Id, @GeneratedValue(strategy = GenerationType.IDENTITY)
	}))
	@Setter
	protected long id;
	
	/** The name. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@NaturalId(mutable = true)
	}))
	@Setter
	protected String name;
	
	/** The mgmtDomain. */
	@Getter(onMethod=@__({
		@ManyToOne,
		@XmlElement, @JsonView(DefaultView.class),
	}))
	@Setter
	protected Domain mgmtDomain;
	
	/** Device-specific credential set */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected boolean deviceSpecific = false;

	/**
	 * Instantiates a new device credential set.
	 */
	protected DeviceCredentialSet() {
		// Reserved for Hibernate
	}

	/**
	 * Instantiates a new device credential set.
	 *
	 * @param name the name
	 */
	public DeviceCredentialSet(String name) {
		this.name = name;
	}

	/**
	 * Removes sensitive data (password) from this object.
	 */
	public abstract void removeSensitive();

	/* (non-Javadoc)
	 * @see java.lang.Object#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (obj == null) {
			return false;
		}
		if (!(obj instanceof DeviceCredentialSet)) {
			return false;
		}
		DeviceCredentialSet other = (DeviceCredentialSet) obj;
		if (name == null) {
			if (other.name != null) {
				return false;
			}
		} else if (!name.equals(other.name)) {
			return false;
		}
		return true;
	}
	
	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((name == null) ? 0 : name.hashCode());
		return result;
	}

	@Override
	public String toString() {
		return "Device Credential Set " + id + " (name '" + name + "', type " + this.getClass().getSimpleName() + ")";
	}
	
}
