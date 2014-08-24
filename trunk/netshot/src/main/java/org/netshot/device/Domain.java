/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.AttributeOverride;
import javax.persistence.AttributeOverrides;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.Version;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.hibernate.annotations.NaturalId;
import org.netshot.device.credentials.DeviceCredentialSet;
import org.netshot.work.tasks.DiscoverDeviceTypeTask;
import org.netshot.work.tasks.ScanSubnetsTask;

/**
 * A domain identifies a part of the network managed from the same IP address.
 */
@Entity
@XmlRootElement
@XmlAccessorType(value = XmlAccessType.NONE)
public class Domain {

	/** The id. */
	private long id;

	/** The change date. */
	private Date changeDate;

	/** The name. */
	private String name;

	/** The description. */
	private String description;

	/** The domain credential sets/. */
	private Set<DeviceCredentialSet> credentialSets = new HashSet<DeviceCredentialSet>();

	/** The server4 address. */
	private Network4Address server4Address;

	/** The server6 address. */
	private Network6Address server6Address;

	/**
	 * Instantiates a new domain.
	 */
	protected Domain() {
		// Hibernate only
	}

	/**
	 * Instantiates a new domain.
	 * 
	 * @param name
	 *          the name
	 * @param description
	 *          the description
	 * @param server4Address
	 *          the server4 address
	 * @param server6Address
	 *          the server6 address
	 */
	public Domain(String name, String description,
	    Network4Address server4Address, Network6Address server6Address) {
		this.name = name;
		this.description = description;
		this.server4Address = server4Address;
		this.server6Address = server6Address;
	}

	/**
	 * Gets the id.
	 * 
	 * @return the id
	 */
	@XmlAttribute
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

	/**
	 * Gets the description.
	 * 
	 * @return the description
	 */
	@XmlElement
	public String getDescription() {
		return description;
	}

	/**
	 * Sets the description.
	 * 
	 * @param description
	 *          the new description
	 */
	public void setDescription(String description) {
		this.description = description;
	}

	/**
	 * Gets the server4 address.
	 * 
	 * @return the server4 address
	 */
	@XmlElement
	@AttributeOverrides({
    @AttributeOverride(name = "address", column = @Column(name = "ipv4_address")),
    @AttributeOverride(name = "prefixLength", column = @Column(name = "ipv4_pfxlen")),
    @AttributeOverride(name = "addressUsage", column = @Column(name = "ipv4_usage")) })
	public Network4Address getServer4Address() {
		return server4Address;
	}

	/**
	 * Gets the server6 address.
	 * 
	 * @return the server6 address
	 */
	@AttributeOverrides({
    @AttributeOverride(name = "address1", column = @Column(name = "ipv6_address1")),
    @AttributeOverride(name = "address2", column = @Column(name = "ipv6_address2")),
    @AttributeOverride(name = "prefixLength", column = @Column(name = "ipv6_pfxlen")),
    @AttributeOverride(name = "addressUsage", column = @Column(name = "ipv6_usage")) })
	public Network6Address getServer6Address() {
		return server6Address;
	}

	/**
	 * Sets the name.
	 * 
	 * @param name
	 *          the new name
	 */
	public void setName(String name) {
		this.name = name;
	}

	/**
	 * Sets the server4 address.
	 * 
	 * @param server4Address
	 *          the new server4 address
	 */
	public void setServer4Address(Network4Address server4Address) {
		this.server4Address = server4Address;
	}

	/**
	 * Sets the server6 address.
	 * 
	 * @param server6Address
	 *          the new server6 address
	 */
	public void setServer6Address(Network6Address server6Address) {
		this.server6Address = server6Address;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((name == null) ? 0 : name.hashCode());
		return result;
	}

	/*
	 * (non-Javadoc)
	 * 
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
		if (!(obj instanceof Domain)) {
			return false;
		}
		Domain other = (Domain) obj;
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

	/**
	 * Gets the credential sets.
	 * 
	 * @return the credential sets
	 */
	@OneToMany(mappedBy = "mgmtDomain", cascade = CascadeType.ALL)
	public Set<DeviceCredentialSet> getCredentialSets() {
		return credentialSets;
	}

	/**
	 * Sets the credential sets.
	 * 
	 * @param credentialSets
	 *          the new credential sets
	 */
	public void setCredentialSets(Set<DeviceCredentialSet> credentialSets) {
		this.credentialSets = credentialSets;
	}

	@Version
	protected Date getChangeDate() {
		return changeDate;
	}

	protected void setChangeDate(Date changeDate) {
		this.changeDate = changeDate;
	}

	protected void setId(long id) {
		this.id = id;
	}
	
	private Set<DiscoverDeviceTypeTask> discoverDeviceTypeTasks;
	private Set<ScanSubnetsTask> scanSubnetsTasks;

	@OneToMany(mappedBy = "domain", cascade = CascadeType.ALL)
	public Set<DiscoverDeviceTypeTask> getDiscoverDeviceTypeTasks() {
		return discoverDeviceTypeTasks;
	}

	public void setDiscoverDeviceTypeTasks(
	    Set<DiscoverDeviceTypeTask> discoverDeviceTypeTasks) {
		this.discoverDeviceTypeTasks = discoverDeviceTypeTasks;
	}

	@OneToMany(mappedBy = "domain", cascade = CascadeType.ALL)
	public Set<ScanSubnetsTask> getScanSubnetsTasks() {
		return scanSubnetsTasks;
	}

	public void setScanSubnetsTasks(Set<ScanSubnetsTask> scanSubnetsTasks) {
		this.scanSubnetsTasks = scanSubnetsTasks;
	}
	
}
