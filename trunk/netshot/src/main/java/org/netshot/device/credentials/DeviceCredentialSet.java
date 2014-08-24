/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device.credentials;

import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
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

import org.hibernate.annotations.NaturalId;
import org.netshot.device.Domain;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * A credential set. Authentication data to access a device.
 */
@Entity @Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@XmlAccessorType(value = XmlAccessType.NONE)
@XmlRootElement()
@JsonTypeInfo(use = JsonTypeInfo.Id.MINIMAL_CLASS, include = JsonTypeInfo.As.PROPERTY, property = "type") 
public class DeviceCredentialSet {

	/** The change date. */
	protected Date changeDate;
	
	/** The id. */
	protected long id;
	
	/** The name. */
	protected String name;
	
	/** The mgmtDomain. */
	protected Domain mgmtDomain;

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
	@Version
	public Date getChangeDate() {
		return changeDate;
	}
	
	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@XmlElement
	@XmlID
	@Id
	@GeneratedValue
	public long getId() {
		return id;
	}

	/**
	 * Gets the name.
	 *
	 * @return the name
	 */
	@XmlElement
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
	@XmlElement
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
}
