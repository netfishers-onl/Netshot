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

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import onl.netfishers.netshot.database.Database;
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
import onl.netfishers.netshot.rest.RestViews.HookView;
import onl.netfishers.netshot.work.Task;

import org.hibernate.Hibernate;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.quartz.JobKey;

/**
 * This task discovers the type of the given device.
 */
@Entity
@Slf4j
public class DiscoverDeviceTypeTask extends Task implements DeviceBasedTask, DomainBasedTask {

	/** The credential sets. */
	@Getter(onMethod=@__({
		@ManyToMany,
		@Fetch(FetchMode.SELECT)
	}))
	@Setter
	private Set<DeviceCredentialSet> credentialSets = new HashSet<DeviceCredentialSet>();

	/** The device address. */
	@Getter(onMethod=@__({
		@Embedded,
		@AttributeOverrides({
			@AttributeOverride(name = "address", column = @Column(name = "ipv4_address")),
			@AttributeOverride(name = "prefixLength", column = @Column(name = "ipv4_pfxlen")),
			@AttributeOverride(name = "addressUsage", column = @Column(name = "ipv4_usage"))}),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Network4Address deviceAddress;

	/** The success credential set. */
	@Getter(onMethod=@__({
		@Transient
	}))
	@Setter
	private DeviceCredentialSet successCredentialSet = null;

	@Getter
	@Setter
	private String discoveredDeviceType = null;

	/** The domain. */
	@Getter(onMethod=@__({
		@ManyToOne(fetch = FetchType.LAZY)
	}))
	@Setter
	private Domain domain;

	/** The device. */
	@Getter(onMethod=@__({
		@ManyToOne(fetch = FetchType.LAZY),
		@XmlElement, @JsonView(HookView.class)
	}))
	@Setter
	private Device device = null;

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

	/**
	 * Gets the discovered device type description.
	 * 
	 * @return the discovered device type description
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getDiscoveredDeviceTypeDescription() {
		String description = "Unknown";
		DeviceDriver driver = DeviceDriver.getDriverByName(discoveredDeviceType);
		if (driver == null) {
			log.debug("No driver named {}.", discoveredDeviceType);
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


	private boolean snmpDiscover(Snmp poller) {
		log.debug("Task {}. Trying SNMP discovery.", this.getId());
		String sysObjectId;
		String sysDesc;
		try {
			sysDesc = poller.getAsString("1.3.6.1.2.1.1.1.0");
			sysObjectId = poller.getAsString("1.3.6.1.2.1.1.2.0");
			this.debug("Got sysDesc = " + sysDesc);
			this.debug("Got sysObjectID = " + sysObjectId);
			log.trace("Got sysDesc '{}' and sysObjectID '{}'.", sysDesc,
					sysObjectId);
			
			// Iterates over possible device classes
			for (DeviceDriver driver : DeviceDriver.getAllDrivers()) {
				if (driver.snmpAutoDiscover(this, sysObjectId, sysDesc, this.getJsLogger())) {
					log.trace("The driver {} did accept the OID.", driver.getName());
					this.discoveredDeviceType = driver.getName();
					return true;
				}
			}
		}
		catch (IOException e) {
			log.warn("Error while polling the device via SNMP.", e);
			this.error("Error while polling the device via SNMP.");
		}
		finally {
			try {
				poller.stop();
			}
			catch (IOException e) {
			}
		}
		log.debug("No driver has accepted the OID.");
		return false;
	}

	private boolean snmpv1Discover(DeviceSnmpCommunity community) {
		log.trace("Task {}. SNMPv1 discovery with credential set {}.",
				this.getId(), community.getName());
		this.trace(String.format("Trying SNMPv1 discovery (credential set %s)", community.getName()));
		try {
			Snmp poller = new Snmp(deviceAddress, community);
			return snmpDiscover(poller);
		}
		catch (UnknownHostException e) {
			log.warn("Task {}. SNMPv1 unknown host error.", this.getId(), e);
			this.warn("SNMPv1 unknown host error: " + e.getMessage());
		}
		catch (Exception e) {
			log.error("Task {}. SNMPv1 error while polling the device.", this.getId(), e);
			this.warn("Error while SNMPv1 polling the device: " + e.getMessage());
		}
		return false;
	}

	private boolean snmpv2cDiscover(DeviceSnmpCommunity community) {
		log.trace("Task {}. SNMPv2c discovery with credential set {}.",
				this.getId(), community.getName());
		this.trace(String.format("Trying SNMPv2c discovery (credential set %s)", community.getName()));
		try {
			Snmp poller = new Snmp(deviceAddress, community);
			return snmpDiscover(poller);
		}
		catch (UnknownHostException e) {
			log.warn("Task {}. SNMPv2 unknown host error.", this.getId(), e);
			this.warn("SNMPv2 unknown host error: " + e.getMessage());
		}
		catch (Exception e) {
			log.error("Task {}. SNMPv2 error while polling the device.", this.getId(), e);
			this.warn("Error while SNMPv2 polling the device: " + e.getMessage());
		}
		return false;
	}

	private boolean snmpv3Discover(DeviceSnmpv3Community cred) {
		log.trace("Task {}. SNMPv3 discovery with credential set {}.",
				this.getId(), cred.getName());
		this.trace(String.format("Trying SNMPv3 discovery (credential set %s)", cred.getName()));
		try {
			Snmp poller = new Snmp(deviceAddress, cred);
			return snmpDiscover(poller);
		}
		catch (UnknownHostException e) {
			log.warn("Task {}. SNMPv3 unknown host error.", this.getId(), e);
			this.warn("SNMPv3 unknown host error: " + e.getMessage());
		}
		catch (Exception e) {
			log.error("Task {}. SNMPv3 error while polling the device.", this.getId(), e);
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
		log.debug("Task {}. Starting autodiscovery process.", this.getId());
		boolean didTrySnmp = false;

		log.trace("Task {}. {} credential sets in the list.", this.getId(), credentialSets.size());
		for (DeviceCredentialSet credentialSet : credentialSets) {
			if (credentialSet instanceof DeviceSnmpv1Community) {
				log.trace("Task {}. SNMPv1 credential set.", this.getId());
				didTrySnmp = true;
				DeviceSnmpCommunity community = (DeviceSnmpv1Community) credentialSet;
				if (snmpv1Discover(community)) {
					this.status = Status.SUCCESS;
					this.successCredentialSet = credentialSet;
					break;
				}
			}
			else if (credentialSet instanceof DeviceSnmpv2cCommunity) {
				log.trace("Task {}. SNMPv2c credential set.", this.getId());
				didTrySnmp = true;
				DeviceSnmpCommunity community = (DeviceSnmpv2cCommunity) credentialSet;
				if (snmpv2cDiscover(community)) {
					this.status = Status.SUCCESS;
					this.successCredentialSet = credentialSet;
					break;
				}
			}
			else if (credentialSet instanceof DeviceSnmpv3Community) {
				log.trace("Task {}. SNMPv3 credential set.", this.getId());
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
			this.device = null;
			try {
				session.beginTransaction();
				device = new Device(this.discoveredDeviceType, deviceAddress, domain, this.author);
				device.addCredentialSet(successCredentialSet);
				session.save(device);
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
					log.error("Task {}. Error during transaction rollback.", this.getId(), e1);
				}
				log.error("Task {}. Couldn't save the new device.", this.getId(), e);
				this.error("Database error while adding the device");
			}
			catch (Exception e) {
				log.error("Task {}. Error while saving the new device or the new task.", this.getId(), e);
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
				log.error("Task {}. Error while registering the new snapshot task.", this.getId(), e);
			}

			return;
		}
		if (!didTrySnmp) {
			log.warn("Task {}. No available SNMP credential set.", this.getId());
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

	/*
	 * (non-Javadoc)
	 * 
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Device autodiscovery";
	}

	/**
	 * Gets the snapshot task id.
	 * 
	 * @return the snapshot task id
	 */
	@XmlElement @JsonView(DefaultView.class)
	public long getSnapshotTaskId() {
		return snapshotTaskId;
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

	/**
	 * Get the ID of the device
	 * 
	 * @return the ID of the device
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	protected long getDeviceId() {
		if (device == null) {
			return 0;
		}
		return device.getId();
	}

}
