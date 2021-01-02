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
package onl.netfishers.netshot.work.tasks;

import java.io.IOException;
import java.net.UnknownHostException;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.AttributeOverride;
import javax.persistence.AttributeOverrides;
import javax.persistence.Column;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.Domain;
import onl.netfishers.netshot.device.DynamicDeviceGroup;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.device.access.Snmp;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
import onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity;
import onl.netfishers.netshot.device.credentials.DeviceSnmpv1Community;
import onl.netfishers.netshot.device.credentials.DeviceSnmpv2cCommunity;
import onl.netfishers.netshot.device.credentials.DeviceSnmpv3Community;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.Task;

import org.hibernate.Hibernate;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task discovers the type of the given device.
 */
@Entity
public class DiscoverDeviceTypeTask extends Task {

	/** The logger. */
	private static Logger logger = LoggerFactory
			.getLogger(DiscoverDeviceTypeTask.class);

	/** The credential sets. */
	private Set<DeviceCredentialSet> credentialSets = new HashSet<DeviceCredentialSet>();

	/** The device address. */
	private Network4Address deviceAddress;

	/** The success credential set. */
	private DeviceCredentialSet successCredentialSet = null;

	private String discoveredDeviceType = null;

	/** The domain. */
	private Domain domain;

	/** The device id. */
	private long deviceId = 0;

	/** The snapshot task id. */
	private long snapshotTaskId = 0;

	/**
	 * Instantiates a new discover device type task.
	 */
	protected DiscoverDeviceTypeTask() {
	}

	/**
	 * Instantiates a new discover device type task.
	 * 
	 * @param deviceAddress
	 *          the device address
	 * @param domain
	 *          the domain
	 * @param comments
	 *          the comments
	 */
	public DiscoverDeviceTypeTask(Network4Address deviceAddress, Domain domain,
			String comments, String author) {
		super(comments, deviceAddress.getIp(), author);
		this.deviceAddress = deviceAddress;
		this.domain = domain;
	}


	public String getDiscoveredDeviceType() {
		return discoveredDeviceType;
	}

	public void setDiscoveredDeviceType(String discoveredDeviceType) {
		this.discoveredDeviceType = discoveredDeviceType;
	}

	/**
	 * Gets the discovered device type description.
	 * 
	 * @return the discovered device type description
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Transient
	public String getDiscoveredDeviceTypeDescription() {
		String description = "Unknown";
		DeviceDriver driver = DeviceDriver.getDriverByName(discoveredDeviceType);
		if (driver == null) {
			logger.debug("No driver named {}.", discoveredDeviceType);
		}
		else {
			description = driver.getDescription();
		}
		return description;
	}

	/**
	 * Adds the credential set.
	 * 
	 * @param credentialSet
	 *          the credential set
	 */
	public void addCredentialSet(DeviceCredentialSet credentialSet) {
		credentialSets.add(credentialSet);
	}

	/**
	 * Gets the success credential set.
	 * 
	 * @return the success credential set
	 */
	@Transient
	public DeviceCredentialSet getSuccessCredentialSet() {
		return successCredentialSet;
	}


	private boolean snmpDiscover(Snmp poller) {
		logger.debug("Task {}. Trying SNMP discovery.", this.getId());
		String sysObjectId;
		String sysDesc;
		try {
			sysDesc = poller.getAsString("1.3.6.1.2.1.1.1.0");
			sysObjectId = poller.getAsString("1.3.6.1.2.1.1.2.0");
			this.debug("Got sysDesc = " + sysDesc);
			this.debug("Got sysObjectID = " + sysObjectId);
			logger.trace("Got sysDesc '{}' and sysObjectID '{}'.", sysDesc,
					sysObjectId);
			
			// Iterates over possible device classes
			for (DeviceDriver driver : DeviceDriver.getAllDrivers()) {
				if (driver.snmpAutoDiscover(this, sysObjectId, sysDesc, this.getJsLogger())) {
					logger.trace("The driver {} did accept the OID.", driver.getName());
					this.discoveredDeviceType = driver.getName();
					return true;
				}
			}
		}
		catch (IOException e) {
			logger.warn("Error while polling the device via SNMP.", e);
			this.error("Error while polling the device via SNMP.");
		}
		finally {
			try {
				poller.stop();
			}
			catch (IOException e) {
			}
		}
		logger.debug("No driver has accepted the OID.");
		return false;
	}

	private boolean snmpv1Discover(DeviceSnmpCommunity community) {
		logger.trace("Task {}. SNMPv1 discovery with community {}.",
				this.getId(), community.getCommunity());
		this.trace("Trying SNMPv1 discovery.");
		try {
			Snmp poller = new Snmp(deviceAddress, community);
			return snmpDiscover(poller);
		}
		catch (UnknownHostException e) {
			logger.warn("Task {}. SNMPv1 unknown host error.", this.getId(), e);
			this.warn("SNMPv1 unknown host error: " + e.getMessage());
		}
		catch (Exception e) {
			logger.error("Task {}. SNMPv1 error while polling the device.", this.getId(), e);
			this.warn("Error while SNMPv1 polling the device: " + e.getMessage());
		}
		return false;
	}

	private boolean snmpv2cDiscover(DeviceSnmpCommunity community) {
		this.trace("Trying SNMPv2c discovery.");
		try {
			Snmp poller = new Snmp(deviceAddress, community);
			return snmpDiscover(poller);
		}
		catch (UnknownHostException e) {
			logger.warn("Task {}. SNMPv2 unknown host error.", this.getId(), e);
			this.warn("SNMPv2 unknown host error: " + e.getMessage());
		}
		catch (Exception e) {
			logger.error("Task {}. SNMPv2 error while polling the device.", this.getId(), e);
			this.warn("Error while SNMPv2 polling the device: " + e.getMessage());
		}
		return false;
	}

	private boolean snmpv3Discover(DeviceSnmpv3Community cred) {
		this.trace("Trying SNMPv3 discovery.");
		try {
			Snmp poller = new Snmp(deviceAddress, cred);
			return snmpDiscover(poller);
		}
		catch (UnknownHostException e) {
			logger.warn("Task {}. SNMPv3 unknown host error.", this.getId(), e);
			this.warn("SNMPv3 unknown host error: " + e.getMessage());
		}
		catch (Exception e) {
			logger.error("Task {}. SNMPv3 error while polling the device.", this.getId(), e);
			this.warn("Error while SNMPv3 polling the device: " + e.getMessage());
		}
		return false;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see onl.netfishers.netshot.work.Task#prepare()
	 */
	@Override
	public void prepare() {
		Hibernate.initialize(this.getCredentialSets());
		this.getDomain().getId();
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see onl.netfishers.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		logger.debug("Task {}. Starting autodiscovery process.", this.getId());
		boolean didTrySnmp = false;

		logger.trace("Task {}. {} credential sets in the list.", this.getId(), credentialSets.size());
		for (DeviceCredentialSet credentialSet : credentialSets) {
			if (credentialSet instanceof DeviceSnmpv1Community) {
				logger.trace("Task {}. SNMPv1 credential set.", this.getId());
				didTrySnmp = true;
				DeviceSnmpCommunity community = (DeviceSnmpv1Community) credentialSet;
				if (snmpv1Discover(community)) {
					this.status = Status.SUCCESS;
					this.successCredentialSet = credentialSet;
					break;
				}
			}
			else if (credentialSet instanceof DeviceSnmpv2cCommunity) {
				logger.trace("Task {}. SNMPv2c credential set.", this.getId());
				didTrySnmp = true;
				DeviceSnmpCommunity community = (DeviceSnmpv2cCommunity) credentialSet;
				if (snmpv2cDiscover(community)) {
					this.status = Status.SUCCESS;
					this.successCredentialSet = credentialSet;
					break;
				}
			}
			else if (credentialSet instanceof DeviceSnmpv3Community) {
				logger.trace("Task {}. SNMPv3 credential set.", this.getId());
				didTrySnmp = true;
				DeviceSnmpv3Community DeviceSnmpcred = (DeviceSnmpv3Community) credentialSet;
				if (snmpv3Discover(DeviceSnmpcred)) {
					this.status = Status.SUCCESS;
					this.successCredentialSet = credentialSet;
					break;
				}
			}
		}
		if (this.status == Status.SUCCESS) {
			Task snapshotTask = null;
			Session session = Database.getSession();
			Device device = null;
			try {
				session.beginTransaction();
				device = new Device(this.discoveredDeviceType, deviceAddress, domain, this.author);
				device.addCredentialSet(successCredentialSet);
				session.save(device);
				this.deviceId = device.getId();
				snapshotTask = new TakeSnapshotTask(device,
						"Automatic snapshot after discovery", author, true, false, false);
				session.save(snapshotTask);
				session.getTransaction().commit();
				this.snapshotTaskId = snapshotTask.getId();
			}
			catch (HibernateException e) {
				try {
					session.getTransaction().rollback();
				}
				catch (Exception e1) {
					logger.error("Task {}. Error during transaction rollback.", this.getId(), e1);
				}
				logger.error("Task {}. Couldn't save the new device.", this.getId(), e);
				this.error("Database error while adding the device");
			}
			catch (Exception e) {
				logger.error("Task {}. Error while saving the new device or the new task.", this.getId(), e);
				this.error("Couldn't add the device after discovery");
			}
			finally {
				session.close();
			}

			if (device != null) {
				DynamicDeviceGroup.refreshAllGroups(device);
			}

			try {
				if (snapshotTask != null) {
					TaskManager.addTask(snapshotTask);
				}
			}
			catch (Exception e) {
				logger.error("Task {}. Error while registering the new snapshot task.", this.getId(), e);
			}

			return;
		}
		if (!didTrySnmp) {
			logger.warn("Task {}. No available SNMP credential set.", this.getId());
			this.error(
					"No available SNMP credential set... can't start autodiscovery.");
		}
		this.status = Status.FAILURE;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see onl.netfishers.netshot.work.Task#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result
				+ ((creationDate == null) ? 0 : creationDate.hashCode());
		result = prime * result
				+ ((deviceAddress == null) ? 0 : deviceAddress.hashCode());
		return result;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see onl.netfishers.netshot.work.Task#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (!super.equals(obj)) {
			return false;
		}
		if (!(obj instanceof DiscoverDeviceTypeTask)) {
			return false;
		}
		DiscoverDeviceTypeTask other = (DiscoverDeviceTypeTask) obj;
		if (creationDate == null) {
			if (other.creationDate != null) {
				return false;
			}
		}
		else if (!creationDate.equals(other.creationDate)) {
			return false;
		}
		if (deviceAddress == null) {
			if (other.deviceAddress != null) {
				return false;
			}
		}
		else if (!deviceAddress.equals(other.deviceAddress)) {
			return false;
		}
		return true;
	}

	/**
	 * Gets the domain.
	 * 
	 * @return the domain
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	public Domain getDomain() {
		return domain;
	}

	/**
	 * Sets the domain.
	 * 
	 * @param domain
	 *          the new domain
	 */
	public void setDomain(Domain domain) {
		this.domain = domain;
	}

	/**
	 * Gets the device address.
	 * 
	 * @return the device address
	 */
	@Embedded
	@AttributeOverrides({
		@AttributeOverride(name = "address", column = @Column(name = "ipv4_address")),
		@AttributeOverride(name = "prefixLength", column = @Column(name = "ipv4_pfxlen")),
		@AttributeOverride(name = "addressUsage", column = @Column(name = "ipv4_usage"))})
	@XmlElement
	@JsonView(DefaultView.class)
	public Network4Address getDeviceAddress() {
		return deviceAddress;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Device autodiscovery";
	}

	/**
	 * Gets the device id.
	 * 
	 * @return the device id
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public long getDeviceId() {
		return deviceId;
	}

	/**
	 * Gets the snapshot task id.
	 * 
	 * @return the snapshot task id
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public long getSnapshotTaskId() {
		return snapshotTaskId;
	}

	/**
	 * Gets the credential sets.
	 * 
	 * @return the credential sets
	 */
	@ManyToMany(fetch = FetchType.LAZY)
	protected Set<DeviceCredentialSet> getCredentialSets() {
		return credentialSets;
	}

	/**
	 * Sets the credential sets.
	 * 
	 * @param credentialSets
	 *          the new credential sets
	 */
	protected void setCredentialSets(Set<DeviceCredentialSet> credentialSets) {
		this.credentialSets = credentialSets;
	}

	/**
	 * Sets the device address.
	 * 
	 * @param deviceAddress
	 *          the new device address
	 */
	protected void setDeviceAddress(Network4Address deviceAddress) {
		this.deviceAddress = deviceAddress;
	}

	/**
	 * Sets the success credential set.
	 * 
	 * @param successCredentialSet
	 *          the new success credential set
	 */
	protected void setSuccessCredentialSet(
			DeviceCredentialSet successCredentialSet) {
		this.successCredentialSet = successCredentialSet;
	}



	/**
	 * Sets the device id.
	 * 
	 * @param deviceId
	 *          the new device id
	 */
	protected void setDeviceId(long deviceId) {
		this.deviceId = deviceId;
	}

	/**
	 * Sets the snapshot task id.
	 * 
	 * @param snapshotTaskId
	 *          the new snapshot task id
	 */
	protected void setSnapshotTaskId(long snapshotTaskId) {
		this.snapshotTaskId = snapshotTaskId;
	}

	/*
	 * (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getIdentity()
	 */
	@Override
	@Transient
	public JobKey getIdentity() {
		return new JobKey(String.format("Task_%d", this.getId()),
				String.format("DiscoverDeviceType_%s", this.getDeviceAddress().getIp()));
	}

}
