/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.device;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import javax.persistence.AttributeOverride;
import javax.persistence.AttributeOverrides;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.Transient;
import javax.persistence.Version;
import javax.script.ScriptException;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.compliance.CheckResult;
import onl.netfishers.netshot.compliance.Exemption;
import onl.netfishers.netshot.compliance.Rule;
import onl.netfishers.netshot.compliance.SoftwareRule;
import onl.netfishers.netshot.compliance.SoftwareRule.ConformanceLevel;
import onl.netfishers.netshot.device.DeviceDriver.DriverProtocol;
import onl.netfishers.netshot.device.access.Cli;
import onl.netfishers.netshot.device.access.Ssh;
import onl.netfishers.netshot.device.access.Telnet;
import onl.netfishers.netshot.device.attribute.DeviceAttribute;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
import onl.netfishers.netshot.device.credentials.DeviceSshAccount;
import onl.netfishers.netshot.device.credentials.DeviceSshKeyAccount;
import onl.netfishers.netshot.device.credentials.DeviceTelnetAccount;
import onl.netfishers.netshot.work.tasks.CheckComplianceTask;
import onl.netfishers.netshot.work.tasks.RunDeviceScriptTask;
import onl.netfishers.netshot.work.tasks.TakeSnapshotTask;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A device.
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class Device {

	public static class InvalidCredentialsException extends Exception {
		private static final long serialVersionUID = 2762061771246688828L;

		public InvalidCredentialsException(String message) {
			super(message);
		}
	}

	public static class MissingDeviceDriverException extends Exception {
		private static final long serialVersionUID = -7286042265874166550L;

		public MissingDeviceDriverException(String message) {
			super(message);
		}
	}

	/**
	 * The Enum NetworkClass.
	 */
	public static enum NetworkClass {

		/** The firewall. */
		FIREWALL,

		/** The loadbalancer. */
		LOADBALANCER,

		/** The router. */
		ROUTER,

		/** The server. */
		SERVER,

		/** The switch. */
		SWITCH,

		/** The switchrouter. */
		SWITCHROUTER,

		/** The unknown. */
		UNKNOWN
	}


	/**
	 * The Enum Status.
	 */
	public static enum Status {

		/** The disabled. */
		DISABLED,

		/** The inproduction. */
		INPRODUCTION,

		/** The preproduction. */
		PREPRODUCTION
	}
	
	/** The Constant DEFAULTNAME. */
	public static final String DEFAULTNAME = "[NONAME]";

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(Device.class);

	/** The attributes. */
	private Set<DeviceAttribute> attributes = new HashSet<DeviceAttribute>();

	/** The auto try credentials. */
	protected boolean autoTryCredentials = true;
	
	/** The change date. */
	protected Date changeDate;
	
	private int version;

	/** The check compliance tasks. */
	protected List<CheckComplianceTask> checkComplianceTasks = new ArrayList<CheckComplianceTask>();
	
	protected List<RunDeviceScriptTask> runDeviceScriptTasks = new ArrayList<RunDeviceScriptTask>();

	/** The comments. */
	protected String comments = "";

	/** The compliance check results. */
	protected Set<CheckResult> complianceCheckResults = new HashSet<CheckResult>();

	/** The compliance exemptions. */
	protected Set<Exemption> complianceExemptions = new HashSet<Exemption>();

	/** The configs. */
	protected List<Config> configs = new ArrayList<Config>();

	/** The contact. */
	protected String contact = "";

	/** The created date. */
	protected Date createdDate = new Date();

	private String creator;

	/** The credential sets. */
	protected Set<DeviceCredentialSet> credentialSets = new HashSet<DeviceCredentialSet>();

	/** The device driver name. */
	protected String driver;

	/** End of Life Date. */
	protected Date eolDate = null;

	/** End of Life responsible component. */
	protected Module eolModule = null;

	/** End of Sale Date. */
	protected Date eosDate = null;

	/** End of Sale responsible component. */
	protected Module eosModule = null;

	/** The family. */
	protected String family = "";

	/** The id. */
	protected long id;

	/** The last config. */
	protected Config lastConfig = null;

	/** The location. */
	protected String location = "";

	/** The log. */
	protected transient List<String> log  = new ArrayList<String>();

	/** The mgmt address. */
	protected Network4Address mgmtAddress;

	/** The mgmt domain. */
	protected Domain mgmtDomain;

	/** The modules. */
	protected List<Module> modules = new ArrayList<Module>();

	/** The name. */
	protected String name = DEFAULTNAME;

	/** The network class. */
	protected NetworkClass networkClass = NetworkClass.UNKNOWN;

	/** The network interfaces. */
	protected List<NetworkInterface> networkInterfaces = new ArrayList<NetworkInterface>();

	/** The owner groups. */
	protected Set<DeviceGroup> ownerGroups = new HashSet<DeviceGroup>();

	/** The serial number. */
	protected String serialNumber = "";

	/** The snapshot tasks. */
	protected List<TakeSnapshotTask> snapshotTasks = new ArrayList<TakeSnapshotTask>();

	/** The software level. */
	protected SoftwareRule.ConformanceLevel softwareLevel = ConformanceLevel.UNKNOWN;

	/** The software version. */
	protected String softwareVersion = "";

	/** The status. */
	protected Status status = Status.INPRODUCTION;

	/** The virtual devices. */
	protected Set<String> virtualDevices = new HashSet<String>();

	/** The vrf instances. */
	protected Set<String> vrfInstances = new HashSet<String>();
	/**
	 * Instantiates a new device.
	 */
	protected Device() {

	}

	/**
	 * Instantiates a new device.
	 *
	 * @param address the address
	 * @param domain the domain
	 */
	public Device(String driver, Network4Address address, Domain domain, String creator) {
		this.driver = driver;
		this.mgmtAddress = address;
		this.mgmtDomain = domain;
		this.creator = creator;
	}

	public void addAttribute(DeviceAttribute attribute) {
		this.attributes.add(attribute);
	}

	/**
	 * Adds the compliance exception.
	 *
	 * @param rule the rule
	 * @param expiration the expiration
	 */
	public void addComplianceException(Rule rule, Date expiration) {
		Exemption exemption = new Exemption(rule, this, expiration);
		complianceExemptions.add(exemption);
	}


	/**
	 * Adds the credential set.
	 *
	 * @param credentialSet the credential set
	 */
	public void addCredentialSet(DeviceCredentialSet credentialSet) {
		this.credentialSets.add(credentialSet);
	}


	/**
	 * Adds the virtual device.
	 *
	 * @param virtualDevice the virtual device
	 */
	public void addVirtualDevice(String virtualDevice) {
		this.virtualDevices.add(virtualDevice);
	}

	/**
	 * Adds the vrf instance.
	 *
	 * @param vrfInstance the vrf instance
	 */
	public void addVrfInstance(String vrfInstance) {
		this.vrfInstances.add(vrfInstance);
	}

	public void clearAttributes() {
		attributes.clear();
	}

	/**
	 * Clear credential sets.
	 */
	public void clearCredentialSets() {
		this.credentialSets.clear();
	}

	/**
	 * Clear virtual devices.
	 */
	public void clearVirtualDevices() {
		this.virtualDevices.clear();
	}


	/**
	 * Clear vrf instance.
	 */
	public void clearVrfInstance() {
		this.vrfInstances.clear();
	}
	
	/* (non-Javadoc)
	 * @see java.lang.Object#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Device other = (Device) obj;
		if (id != other.id)
			return false;
		return true;
	}
	
	@XmlElement
	@OneToMany(cascade = CascadeType.ALL, mappedBy = "device", orphanRemoval = true)
	public Set<DeviceAttribute> getAttributes() {
		return attributes;
	}

	@SuppressWarnings("unchecked")
	@Transient
	protected List<DeviceCredentialSet> getAutoCredentialSetList(Session session) throws HibernateException {
		return session
				.createQuery("from DeviceCredentialSet where mgmtDomain = :domain or mgmtDomain is null")
				.setEntity("domain", this.getMgmtDomain())
				.list();
	}

	/**
	 * Gets the change date.
	 *
	 * @return the change date
	 */
	@XmlElement
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
	 * Gets the check compliance tasks.
	 *
	 * @return the check compliance tasks
	 */
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "device")
	public List<CheckComplianceTask> getCheckComplianceTasks() {
		return checkComplianceTasks;
	}
	
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "device")
	public List<RunDeviceScriptTask> getRunDeviceScriptTasks() {
		return runDeviceScriptTasks;
	}

	/**
	 * Gets the comments.
	 *
	 * @return the comments
	 */
	@XmlElement
	public String getComments() {
		return comments;
	}

	/**
	 * Gets the compliance check results.
	 *
	 * @return the compliance check results
	 */
	@OneToMany(fetch = FetchType.LAZY, mappedBy = "key.device", cascade = CascadeType.ALL, orphanRemoval = true)
	public Set<CheckResult> getComplianceCheckResults() {
		return complianceCheckResults;
	}

	/**
	 * Gets the compliance exemptions.
	 *
	 * @return the compliance exemptions
	 */
	@OneToMany(fetch = FetchType.LAZY, mappedBy = "key.device", cascade = CascadeType.ALL, orphanRemoval = true)
	public Set<Exemption> getComplianceExemptions() {
		return complianceExemptions;
	}

	/**
	 * Gets the configs.
	 *
	 * @return the configs
	 */
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "device")
	public List<Config> getConfigs() {
		return configs;
	}

	/**
	 * Gets the contact.
	 *
	 * @return the contact
	 */
	@XmlElement
	public String getContact() {
		return contact;
	}

	/**
	 * Gets the created date.
	 *
	 * @return the created date
	 */
	@XmlElement
	public Date getCreatedDate() {
		return createdDate;
	}

	@XmlElement
	public String getCreator() {
		return creator;
	}

	/**
	 * Gets the credential set ids.
	 *
	 * @return the credential set ids
	 */
	@XmlElement
	@Transient
	public List<Long> getCredentialSetIds() {
		List<Long> l = new ArrayList<Long>();
		for (DeviceCredentialSet credentialSet : credentialSets) {
			l.add(credentialSet.getId());
		}
		return l;
	}

	/**
	 * Gets the credential sets.
	 *
	 * @return the credential sets
	 */
	@ManyToMany(fetch = FetchType.LAZY) @Fetch(FetchMode.SELECT)
	public Set<DeviceCredentialSet> getCredentialSets() {
		return credentialSets;
	}
	
	@Transient
	public DeviceDriver getDeviceDriver() throws MissingDeviceDriverException {
		if (driver == null) {
			String message = String.format("The device with ID %d has no associated driver.", id);
			this.logIt(message, 1);
			throw new MissingDeviceDriverException(message);
		}
		DeviceDriver deviceDriver = DeviceDriver.getDriverByName(driver);
		if (deviceDriver == null) {
			String message = String.format("Unable to locate the driver %s for device %d.", driver, id);
			this.logIt(message, 1);
			throw new MissingDeviceDriverException(message);
		}
		return deviceDriver;
	}

	@XmlElement
	public String getDriver() {
		return driver;
	}

	@XmlElement
	public Date getEolDate() {
		return eolDate;
	}

	@XmlElement
	@OneToOne(fetch = FetchType.LAZY)
	public Module getEolModule() {
		return eolModule;
	}

	@XmlElement
	public Date getEosDate() {
		return eosDate;
	}

	@XmlElement
	@OneToOne(fetch = FetchType.LAZY)
	public Module getEosModule() {
		return eosModule;
	}

	/**
	 * Gets the family.
	 *
	 * @return the family
	 */
	@XmlElement
	public String getFamily() {
		return family;
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@Id
	@GeneratedValue
	@XmlAttribute
	public long getId() {
		return id;
	}

	/**
	 * Gets the last config.
	 *
	 * @return the last config
	 */
	@OneToOne(fetch = FetchType.LAZY)
	public Config getLastConfig() {
		return lastConfig;
	}


	/**
	 * Gets the location.
	 *
	 * @return the location
	 */
	@XmlElement
	public String getLocation() {
		return location;
	}


	/**
	 * Gets the log.
	 *
	 * @return the log
	 */
	@Transient
	public List<String> getLog() {
		return log;
	}


	/**
	 * Gets the mgmt address.
	 *
	 * @return the mgmt address
	 */
	@Embedded
	@AttributeOverrides({
		@AttributeOverride(name = "address", column = @Column(name = "ipv4_address", unique = true)),
		@AttributeOverride(name = "prefixLength", column = @Column(name = "ipv4_pfxlen")),
		@AttributeOverride(name = "addressUsage", column = @Column(name = "ipv4_usage")),
	})
	@XmlElement
	public Network4Address getMgmtAddress() {
		return mgmtAddress;
	}


	/**
	 * Gets the mgmt domain.
	 *
	 * @return the mgmt domain
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	@XmlElement
	public Domain getMgmtDomain() {
		return mgmtDomain;
	}

	/**
	 * Gets the modules.
	 *
	 * @return the modules
	 */
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "device", orphanRemoval = true)
	public List<Module> getModules() {
		return modules;
	}


	/**
	 * Gets the name.
	 *
	 * @return the name
	 */
	@XmlElement
	public String getName() {
		return name;
	}


	/**
	 * Gets the network class.
	 *
	 * @return the network class
	 */
	@XmlElement
	public NetworkClass getNetworkClass() {
		return networkClass;
	}

	/**
	 * Gets the network interfaces.
	 *
	 * @return the network interfaces
	 */
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "device", orphanRemoval = true)
	public List<NetworkInterface> getNetworkInterfaces() {
		return networkInterfaces;
	}


	/**
	 * Gets the owner groups.
	 *
	 * @return the owner groups
	 */
	@XmlElement
	@ManyToMany(fetch = FetchType.LAZY, mappedBy = "cachedDevices")
	public Set<DeviceGroup> getOwnerGroups() {
		return ownerGroups;
	}


	/**
	 * Gets the plain log.
	 *
	 * @return the plain log
	 */
	@Transient
	public String getPlainLog() {
		StringBuffer buffer = new StringBuffer();
		for (String log : this.log) {
			buffer.append(log);
			buffer.append("\n");
		}
		return buffer.toString();
	}


	/**
	 * Gets the device type - in a non static manner to include it with JAXB.
	 * 
	 * @return the device type
	 */
	@Transient
	@XmlElement
	public String getRealDeviceType() {
		DeviceDriver driver;
		try {
			driver = getDeviceDriver();
			return driver.getDescription();
		}
		catch (MissingDeviceDriverException e) {
			return "Unknown driver";
		}
	}


	/**
	 * Gets the serial number.
	 *
	 * @return the serial number
	 */
	@XmlElement
	public String getSerialNumber() {
		return serialNumber;
	}

	/**
	 * Gets the snapshot tasks.
	 *
	 * @return the snapshot tasks
	 */
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "device")
	public List<TakeSnapshotTask> getSnapshotTasks() {
		return snapshotTasks;
	}


	/**
	 * Gets the software level.
	 *
	 * @return the software level
	 */
	@XmlElement
	public SoftwareRule.ConformanceLevel getSoftwareLevel() {
		return softwareLevel;
	}


	/**
	 * Gets the software version.
	 *
	 * @return the software version
	 */
	@XmlElement
	public String getSoftwareVersion() {
		return softwareVersion;
	}


	/**
	 * Gets the status.
	 *
	 * @return the status
	 */
	@Enumerated(value = EnumType.ORDINAL)
	@XmlElement
	public Status getStatus() {
		return status;
	}


	/**
	 * Gets the virtual devices.
	 *
	 * @return the virtual devices
	 */
	@ElementCollection
	public Set<String> getVirtualDevices() {
		return virtualDevices;
	}


	/**
	 * Gets the vrf instances.
	 *
	 * @return the vrf instances
	 */
	@ElementCollection
	public Set<String> getVrfInstances() {
		return vrfInstances;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + (int) (id ^ (id >>> 32));
		return result;
	}

	/**
	 * Checks if is auto try credentials.
	 *
	 * @return true, if is auto try credentials
	 */
	@XmlElement
	public boolean isAutoTryCredentials() {
		return autoTryCredentials;
	}

	/**
	 * Checks if is compliant.
	 *
	 * @return true, if is compliant
	 */
	@XmlElement
	@Transient
	public boolean isCompliant() {
		for (CheckResult check : this.getComplianceCheckResults()) {
			if (check.getResult().equals(CheckResult.ResultOption.NONCONFORMING)) {
				return false;
			}
		}
		return true;
	}

	@XmlElement
	@Transient
	public boolean isEndOfLife() {
		return (eolDate != null && eolDate.before(new Date()));
	}

	@XmlElement
	@Transient
	public boolean isEndOfSale() {
		return (eosDate != null && eosDate.before(new Date()));
	}

	/**
	 * Checks if is exempted.
	 *
	 * @param rule the rule
	 * @return true, if is exempted
	 */
	public boolean isExempted(Rule rule) {
		Date now = new Date();
		for (Exemption exemption : this.getComplianceExemptions()) {
			if (exemption.getRule().equals(rule) && exemption.getExpirationDate().after(now)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Log it.
	 *
	 * @param log the log
	 * @param level the level
	 */
	protected void logIt(String log, int level) {
		this.log.add("[" + level + "] " + log);
	}

	/**
	 * Resets the EoL/EoS status.
	 */
	public void resetEoX() {
		this.eosDate = null;
		this.eosModule = null;
		this.eolDate = null;
		this.eolModule = null;
	}

	public void setAttributes(Set<DeviceAttribute> attributes) {
		this.attributes = attributes;
	}

	/**
	 * Sets the auto try credentials.
	 *
	 * @param autoTryCredentials the new auto try credentials
	 */
	public void setAutoTryCredentials(boolean autoTryCredentials) {
		this.autoTryCredentials = autoTryCredentials;
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
	 * Sets the check compliance tasks.
	 *
	 * @param checkComplianceTasks the new check compliance tasks
	 */
	public void setCheckComplianceTasks(
			List<CheckComplianceTask> checkComplianceTasks) {
		this.checkComplianceTasks = checkComplianceTasks;
	}
	
	public void setRunDeviceScriptTasks(List<RunDeviceScriptTask> tasks) {
		this.runDeviceScriptTasks = tasks;
	}

	/**
	 * Sets the comments.
	 *
	 * @param comments the new comments
	 */
	public void setComments(String comments) {
		this.comments = comments;
	}

	/**
	 * Sets the compliance check results.
	 *
	 * @param complianceChecks the new compliance check results
	 */
	protected void setComplianceCheckResults(Set<CheckResult> complianceChecks) {
		this.complianceCheckResults = complianceChecks;
	}

	/**
	 * Sets the compliance exemptions.
	 *
	 * @param complianceExemptions the new compliance exemptions
	 */
	protected void setComplianceExemptions(Set<Exemption> complianceExemptions) {
		this.complianceExemptions = complianceExemptions;
	}

	/**
	 * Sets the configs.
	 *
	 * @param configs the new configs
	 */
	public void setConfigs(List<Config> configs) {
		this.configs = configs;
	}

	/**
	 * Sets the contact.
	 *
	 * @param contact the new contact
	 */
	public void setContact(String contact) {
		this.contact = contact;
	}

	/**
	 * Sets the created date.
	 *
	 * @param createdDate the new created date
	 */
	protected void setCreatedDate(Date createdDate) {
		this.createdDate = createdDate;
	}

	public void setCreator(String creator) {
		this.creator = creator;
	}

	/**
	 * Sets the credential sets.
	 *
	 * @param credentialSets the new credential sets
	 */
	protected void setCredentialSets(Set<DeviceCredentialSet> credentialSets) {
		this.credentialSets = credentialSets;
	}

	public void setDriver(String driver) {
		this.driver = driver;
	}

	public void setEolDate(Date eolDate) {
		this.eolDate = eolDate;
	}

	public void setEolModule(Module eolModule) {
		this.eolModule = eolModule;
	}


	public void setEosDate(Date eosDate) {
		this.eosDate = eosDate;
	}

	public void setEosModule(Module eosModule) {
		this.eosModule = eosModule;
	}

	/**
	 * Sets the family.
	 *
	 * @param family the new family
	 */
	public void setFamily(String family) {
		this.family = family;
	}

	/**
	 * Sets the id.
	 *
	 * @param id the new id
	 */
	protected void setId(long id) {
		this.id = id;
	}

	/**
	 * Sets the last config.
	 *
	 * @param lastConfig the new last config
	 */
	public void setLastConfig(Config lastConfig) {
		this.lastConfig = lastConfig;
	}

	/**
	 * Sets the location.
	 *
	 * @param location the new location
	 */
	public void setLocation(String location) {
		this.location = location;
	}

	/**
	 * Sets the mgmt address.
	 *
	 * @param mgmtAddress the new mgmt address
	 */
	public void setMgmtAddress(Network4Address mgmtAddress) {
		this.mgmtAddress = mgmtAddress;
	}

	/**
	 * Sets the mgmt domain.
	 *
	 * @param mgmtDomain the new mgmt domain
	 */
	public void setMgmtDomain(Domain mgmtDomain) {
		this.mgmtDomain = mgmtDomain;
	}

	/**
	 * Sets the modules.
	 *
	 * @param modules the new modules
	 */
	public void setModules(List<Module> modules) {
		this.modules = modules;
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
	 * Sets the network class.
	 *
	 * @param networkClass the new network class
	 */
	public void setNetworkClass(NetworkClass networkClass) {
		this.networkClass = networkClass;
	}

	/**
	 * Sets the network interfaces.
	 *
	 * @param networkInterfaces the new network interfaces
	 */
	public void setNetworkInterfaces(List<NetworkInterface> networkInterfaces) {
		this.networkInterfaces = networkInterfaces;
	}

	/**
	 * Sets the owner groups.
	 *
	 * @param ownerGroups the new owner groups
	 */
	public void setOwnerGroups(Set<DeviceGroup> ownerGroups) {
		this.ownerGroups = ownerGroups;
	}

	/**
	 * Sets the serial number.
	 *
	 * @param serialNumber the new serial number
	 */
	public void setSerialNumber(String serialNumber) {
		this.serialNumber = serialNumber;
	}

	/**
	 * Sets the snapshot tasks.
	 *
	 * @param snapshotTaks the new snapshot tasks
	 */
	protected void setSnapshotTasks(List<TakeSnapshotTask> snapshotTaks) {
		this.snapshotTasks = snapshotTaks;
	}

	/**
	 * Sets the software level.
	 *
	 * @param softwareLevel the new software level
	 */
	public void setSoftwareLevel(SoftwareRule.ConformanceLevel softwareLevel) {
		this.softwareLevel = softwareLevel;
	}

	/**
	 * Sets the software version.
	 *
	 * @param softwareVersion the new software version
	 */
	public void setSoftwareVersion(String softwareVersion) {
		this.softwareVersion = softwareVersion;
	}

	/**
	 * Sets the status.
	 *
	 * @param status the new status
	 */
	public void setStatus(Status status) {
		this.status = status;
	}


	/**
	 * Sets the virtual devices.
	 *
	 * @param virtualDevices the new virtual devices
	 */
	public void setVirtualDevices(Set<String> virtualDevices) {
		this.virtualDevices = virtualDevices;
	}

	/**
	 * Sets the vrf instances.
	 *
	 * @param vrfInstances the new vrf instances
	 */
	public void setVrfInstances(Set<String> vrfInstances) {
		this.vrfInstances = vrfInstances;
	}

	public void takeSnapshot() throws IOException, MissingDeviceDriverException, InvalidCredentialsException, ScriptException {
		this.execute(null);
	}
	
	public void runScript(String script) throws IOException, MissingDeviceDriverException, InvalidCredentialsException, ScriptException {
		this.execute(script);
	}
	
	private void execute(String script) throws IOException, MissingDeviceDriverException, InvalidCredentialsException, ScriptException {
		DeviceDriver deviceDriver = getDeviceDriver();
		
		boolean sshOpened = true;
		boolean telnetOpened = true;
		
		if (deviceDriver.getProtocols().contains(DriverProtocol.SSH)) {
			for (DeviceCredentialSet credentialSet : credentialSets) {
				if (credentialSet instanceof DeviceSshAccount) {
					Cli cli;
					if (credentialSet instanceof DeviceSshKeyAccount) {
						cli = new Ssh(mgmtAddress, ((DeviceSshKeyAccount) credentialSet).getUsername(),
								((DeviceSshKeyAccount) credentialSet).getPublicKey(),
								((DeviceSshKeyAccount) credentialSet).getPrivateKey(),
								((DeviceSshKeyAccount) credentialSet).getPassword());
					}
					else {
						cli = new Ssh(mgmtAddress, ((DeviceSshAccount) credentialSet).getUsername(),
								((DeviceSshAccount) credentialSet).getPassword());
					}
					try {
						cli.connect();
						deviceDriver.runScript(this, cli, DriverProtocol.SSH, (DeviceCliAccount) credentialSet, script);
						return;
					}
					catch (InvalidCredentialsException e) {
						logIt(String.format("Authentication failed using SSH credential set %s.", credentialSet.getName()), 1);
					}
					catch (ScriptException e) {
						throw e;
					}
					catch (Exception e) {
						logger.warn("Unable to open an SSH connection to {}.", mgmtAddress, e);
						if (e.getMessage().contains("Auth fail")) {
							logIt(String.format("Authentication failed using SSH credential set %s.", credentialSet.getName()), 1);
						}
						else {
							logIt("Unable to open an SSH socket to the device.", 2);
							sshOpened = false;
							break;
						}
					}
					finally {
						cli.disconnect();
					}
				}
			}
		}
		if (deviceDriver.getProtocols().contains(DriverProtocol.TELNET)) {
			for (DeviceCredentialSet credentialSet : credentialSets) {
				if (credentialSet instanceof DeviceTelnetAccount) {
					Cli cli = new Telnet(mgmtAddress);
					try {
						cli.connect();
						deviceDriver.runScript(this, cli, DriverProtocol.TELNET, (DeviceCliAccount) credentialSet, script);
						return;
					}
					catch (InvalidCredentialsException e) {
						logIt(String.format("Authentication failed using Telnet credential set %s.", credentialSet.getName()), 1);
					}
					catch (ScriptException e) {
						throw e;
					}
					catch (IOException e) {
						logger.warn("Unable to open a Telnet connection to {}.", mgmtAddress, e);
						logIt("Unable to open a Telnet socket to the device.", 2);
						telnetOpened = false;
						break;
					}
					finally {
						cli.disconnect();
					}
				}
			}
		}
		if (this.autoTryCredentials && (sshOpened || telnetOpened)) {
			Session session = Database.getSession();
			try {
				List<DeviceCredentialSet> globalCredentialSets = this
						.getAutoCredentialSetList(session);
				if (sshOpened) {
					for (DeviceCredentialSet credentialSet : globalCredentialSets) {
						if (credentialSet instanceof DeviceSshAccount) {
							logIt(String.format("Will try SSH credentials %s.", credentialSet.getName()), 5);
							Cli cli;
							if (credentialSet instanceof DeviceSshKeyAccount) {
								cli = new Ssh(mgmtAddress, ((DeviceSshKeyAccount) credentialSet).getUsername(),
										((DeviceSshKeyAccount) credentialSet).getPublicKey(),
										((DeviceSshKeyAccount) credentialSet).getPrivateKey(),
										((DeviceSshKeyAccount) credentialSet).getPassword());
							}
							else {
								cli = new Ssh(mgmtAddress, ((DeviceSshAccount) credentialSet).getUsername(),
										((DeviceSshAccount) credentialSet).getPassword());
							}
							try {
								cli.connect();
								deviceDriver.runScript(this, cli, DriverProtocol.SSH, (DeviceCliAccount) credentialSet, script);
								Iterator<DeviceCredentialSet> ci = credentialSets.iterator();
								while (ci.hasNext()) {
									DeviceCredentialSet c = ci.next();
									if (c instanceof DeviceCliAccount) {
										ci.remove();
									}
								}
								credentialSets.add(credentialSet);
								return;
							}
							catch (InvalidCredentialsException e) {
								logIt(String.format("Authentication failed using Telnet credential set %s.", credentialSet.getName()), 1);
							}
							catch (ScriptException e) {
								throw e;
							}
							catch (IOException e) {
								logger.warn("Unable to open an SSH connection to {}.", mgmtAddress, e);
								if (e.getMessage().contains("Auth fail")) {
									logIt(String.format("Authentication failed using SSH credential set %s.", credentialSet.getName()), 1);
								}
								else {
									logIt("Unable to open an SSH socket to the device.", 2);
									break;
								}
							}
							finally {
								cli.disconnect();
							}
						}
					}
				}
				if (telnetOpened) {
					for (DeviceCredentialSet credentialSet : globalCredentialSets) {
						if (credentialSet instanceof DeviceTelnetAccount) {
							logIt(String.format("Will try Telnet credentials %s.", credentialSet.getName()), 5);
							Cli cli = new Telnet(mgmtAddress);
							try {
								cli.connect();
								deviceDriver.runScript(this, cli, DriverProtocol.TELNET, (DeviceCliAccount) credentialSet, script);
								Iterator<DeviceCredentialSet> ci = credentialSets.iterator();
								while (ci.hasNext()) {
									DeviceCredentialSet c = ci.next();
									if (c instanceof DeviceCliAccount) {
										ci.remove();
									}
								}
								credentialSets.add(credentialSet);
								return;
							}
							catch (InvalidCredentialsException e) {
								logIt(String.format("Authentication failed using Telnet credential set %s.", credentialSet.getName()), 1);
							}
							catch (ScriptException e) {
								throw e;
							}
							catch (IOException e) {
								logger.warn("Unable to open a Telnet connection to {}.", mgmtAddress, e);
								logIt("Unable to open a Telnet socket to the device.", 2);
								telnetOpened = false;
								break;
							}
							finally {
								cli.disconnect();
							}
						}
					}
				}
			}
			catch (HibernateException e) {
				session.getTransaction().rollback();
				this.logIt("Error while retrieving the global credentials.", 2);
				logger.error("Error while retrieving the global credentials.", e);
			}
			finally {
				session.close();
			}
		}
		if (!sshOpened && !telnetOpened) {
			throw new IOException("Couldn't open either SSH or Telnet socket with the device.");
		}
		throw new InvalidCredentialsException("Couldn't find valid credentials.");
	}

}