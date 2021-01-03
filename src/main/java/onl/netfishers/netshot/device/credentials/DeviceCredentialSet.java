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
public class DeviceCredentialSet {

	/** The change date. */
	protected Date changeDate;
	
	private int version;
	
	/** The id. */
	protected long id;
	
	/** The name. */
	protected String name;
	
	/** The mgmtDomain. */
	protected Domain mgmtDomain;
	
	/** Device-specific credential set */
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

	/**
	 * Gets the change date.
	 *
	 * @return the change date
	 */
	public Date getChangeDate() {
		return changeDate;
	}
	
	@Version
	public int getVersion() {
		return version;
	}
	
	public void setVersion(int version) {
		this.version = version;
	}
	
	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@XmlElement @JsonView(DefaultView.class)
	@XmlID
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public long getId() {
		return id;
	}

	/**
	 * Gets the name.
	 *
	 * @return the name
	 */
	@XmlElement @JsonView(DefaultView.class)
	@NaturalId(mutable = true)
	public String getName() {
		return name;
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
	
	/**
	 * Sets the change date.
	 *
	 * @param changeDate the new change date
	 */
	public void setChangeDate(Date changeDate) {
		this.changeDate = changeDate;
	}

	/**
	 * Sets the id.
	 *
	 * @param id the new id
	 */
	public void setId(long id) {
		this.id = id;
	}

	/**
	 * Sets the name.
	 *
	 * @param name the new name
	 */
	public void setName(String name) {
		this.name = name;
	}

	/**
	 * Gets the mgmtDomain.
	 *
	 * @return the mgmtDomain
	 */
	@XmlElement @JsonView(DefaultView.class)
	@ManyToOne()
	public Domain getMgmtDomain() {
		return mgmtDomain;
	}

	/**
	 * Sets the mgmtDomain.
	 *
	 * @param mgmtDomain the new mgmtDomain
	 */
	public void setMgmtDomain(Domain domain) {
		this.mgmtDomain = domain;
	}

	/**
	 * Is the credential set specific to a device?
	 * @return true if the credential set is specific;
	 */
	@XmlElement @JsonView(DefaultView.class)
	public boolean isDeviceSpecific() {
		return deviceSpecific;
	}

	/**
	 * Sets whether the credential set is specific to a device.
	 * @param specific true if the credential set is specific.
	 */
	public void setDeviceSpecific(boolean specific) {
		this.deviceSpecific = specific;
	}
	
	static public String generateSpecificName() {
		return String.format("DEVICESPECIFIC-%s", UUID.randomUUID());
	}

	@Override
	public String toString() {
		return "Device Credential Set " + id + " (name '" + name + "', type " + this.getClass().getSimpleName() + ")";
	}
	
}
