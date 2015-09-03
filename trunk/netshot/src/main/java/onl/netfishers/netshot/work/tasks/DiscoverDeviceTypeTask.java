/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
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
import onl.netfishers.netshot.work.Task;

import org.hibernate.Hibernate;
import org.hibernate.HibernateException;
import org.hibernate.Session;
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
		logger.debug("Trying SNMP discovery.");
		String sysObjectId;
		String sysDesc;
		try {
			sysDesc = poller.getAsString("1.3.6.1.2.1.1.1.0");
			sysObjectId = poller.getAsString("1.3.6.1.2.1.1.2.0");
			this.logIt("Got sysDesc = " + sysDesc, 7);
			this.logIt("Got sysObjectID = " + sysObjectId, 7);
			logger.trace("Got sysDesc '{}' and sysObjectID '{}'.", sysDesc,
					sysObjectId);
			// Iterates over possible device classes
			for (DeviceDriver driver : DeviceDriver.getAllDrivers()) {
				if (driver.snmpAutoDiscover(this, sysObjectId, sysDesc)) {
					logger.trace("The driver {} did accept the OID.", driver.getName());
					this.discoveredDeviceType = driver.getName();
					return true;
				}
			}
		}
		catch (IOException e) {
			logger.warn("Error while polling the device via SNMP.", e);
			this.logIt("Error while polling the device via SNMP.", 3);
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
		logger.trace("SNMPv1 discovery with community {}.",
				community.getCommunity());
		this.logIt("Trying SNMPv1 discovery.", 5);
		try {
			Snmp poller = new Snmp(deviceAddress, community.getCommunity(), true);
			return snmpDiscover(poller);
		}
		catch (UnknownHostException e) {
			logger.warn("SNMPv1 unknown host error.", e);
			this.logIt("SNMPv1 unknown host error: " + e.getMessage(), 3);
		}
		catch (Exception e) {
			logger.error("SNMPv1 error while polling the device.", e);
			this.logIt("Error while SNMPv1 polling the device: " + e.getMessage(), 3);
		}
		return false;
	}

	private boolean snmpv2cDiscover(DeviceSnmpCommunity community) {
		this.logIt("Trying SNMPv2c discovery.", 5);
		try {
			Snmp poller = new Snmp(deviceAddress, community.getCommunity());
			return snmpDiscover(poller);
		}
		catch (UnknownHostException e) {
			logger.warn("SNMPv2 unknown host error.", e);
			this.logIt("SNMPv2 unknown host error: " + e.getMessage(), 3);
		}
		catch (Exception e) {
			logger.error("SNMPv2 error while polling the device.", e);
			this.logIt("Error while SNMPv2 polling the device: " + e.getMessage(), 3);
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
		logger.debug("Starting autodiscovery process.");
		boolean didTrySnmp = false;

		logger.trace("{} credential sets in the list.", credentialSets.size());
		for (DeviceCredentialSet credentialSet : credentialSets) {
			if (credentialSet instanceof DeviceSnmpv1Community) {
				logger.trace("SNMPv1 credential set.");
				didTrySnmp = true;
				DeviceSnmpCommunity community = (DeviceSnmpv1Community) credentialSet;
				if (snmpv1Discover(community)) {
					this.status = Status.SUCCESS;
					this.successCredentialSet = credentialSet;
					break;
				}
			}
			else if (credentialSet instanceof DeviceSnmpv2cCommunity) {
				logger.trace("SNMPv2c credential set.");
				didTrySnmp = true;
				DeviceSnmpCommunity community = (DeviceSnmpv2cCommunity) credentialSet;
				if (snmpv2cDiscover(community)) {
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
						"Automatic snapshot after discovery", author);
				session.save(snapshotTask);
				session.getTransaction().commit();
				this.snapshotTaskId = snapshotTask.getId();
			}
			catch (HibernateException e) {
				session.getTransaction().rollback();
				logger.error("Couldn't save the new device.", e);
				this.logIt("Database error while adding the device", 3);
			}
			catch (Exception e) {
				logger.error("Error while saving the new device or the new task.", e);
				this.logIt("Couldn't add the device after discovery", 3);
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
				logger.error("Error while registering the new task.", e);
			}

			return;
		}
		if (!didTrySnmp) {
			logger.warn("No available SNMP credential set.");
			this.logIt(
					"No available SNMP credential set... can't start autodiscovery.", 2);
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
	public long getDeviceId() {
		return deviceId;
	}

	/**
	 * Gets the snapshot task id.
	 * 
	 * @return the snapshot task id
	 */
	@XmlElement
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

}
