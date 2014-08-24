/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.AttributeOverride;
import javax.persistence.AttributeOverrides;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.DiscriminatorColumn;
import javax.persistence.ElementCollection;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.Transient;
import javax.persistence.Version;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.netshot.NetshotDatabase;
import org.netshot.compliance.CheckResult;
import org.netshot.compliance.Exemption;
import org.netshot.compliance.Rule;
import org.netshot.compliance.SoftwareRule;
import org.netshot.compliance.SoftwareRule.ConformanceLevel;
import org.netshot.device.credentials.DeviceCredentialSet;
import org.netshot.work.tasks.CheckComplianceTask;
import org.netshot.work.tasks.TakeSnapshotTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.snmp4j.PDU;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * A device - abstract.
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "os")
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@JsonTypeInfo(use = JsonTypeInfo.Id.MINIMAL_CLASS, include = JsonTypeInfo.As.PROPERTY, property = "type")
abstract public class Device {
	
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
	
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(Device.class);
	
	/** The Constant DEVICE_CLASSES. */
	private static final Set<Class<? extends Device>> DEVICE_CLASSES;
	
	static {
		DEVICE_CLASSES = new HashSet<Class<? extends Device>>();
		try {
	    for (Class<?> clazz : NetshotDatabase.listClassesInPackage("org.netshot.device.vendors")) {
	    	if (Device.class.isAssignableFrom(clazz)) {
	    		@SuppressWarnings("unchecked")
	        Class<? extends Device> deviceClass = (Class<? extends Device>) clazz;
	    		DEVICE_CLASSES.add(deviceClass);
	    	}
	    }
    }
    catch (Exception e) {
    	logger.error("Error while scanning the device classes.", e);
    }
	}
	
	/**
	 * Analyze syslog.
	 *
	 * @param message the message
	 * @param ipAddress the ip address
	 * @return true, if successful
	 */
	public static boolean analyzeSyslog(String message, Network4Address ipAddress) {
		return false;
	}
	
	/**
	 * Analyze trap.
	 *
	 * @param pdu the pdu
	 * @param ipAddress the ip address
	 * @return true, if successful
	 */
	public static boolean analyzeTrap(PDU pdu, Network4Address ipAddress) {
		return false;
	}
	
	/**
	 * Gets the device classes.
	 *
	 * @return the device classes
	 */
	public static final Set<Class<? extends Device>> getDeviceClasses() {
		return DEVICE_CLASSES;
	}
	
	/**
	 * Gets the device type.
	 *
	 * @return the device type
	 */
	@Transient
	@ConfigItem(name = "Type", type = ConfigItem.Type.CHECKABLE)
	public static String getDeviceType() {
		return "Unknown";
	}
	
	/**
	 * Gets the device type - in a non static manner to include it with JAXB.
	 * 
	 * @return the device type
	 */
	@Transient
	@XmlElement
	public abstract String getRealDeviceType();

	/** The auto try credentials. */
	protected boolean autoTryCredentials = true;
	
	/** The change date. */
	protected Date changeDate;
	
	/** The comments. */
	protected String comments = "";
	
	/** The compliance exemptions. */
	protected Set<Exemption> complianceExemptions = new HashSet<Exemption>();
	
	/** The compliance check results. */
	protected Set<CheckResult> complianceCheckResults = new HashSet<CheckResult>();
	
	/** The configs. */
	protected List<Config> configs = new ArrayList<Config>();
	
	/** The contact. */
	protected String contact = "";
	
	/** The created date. */
	protected Date createdDate = new Date();
	
	/** The credential sets. */
	protected Set<DeviceCredentialSet> credentialSets = new HashSet<DeviceCredentialSet>();

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
	
	/** The Constant DEFAULTNAME. */
	public static final String DEFAULTNAME = "[NONAME]";
	
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
	
	/** The check compliance tasks. */
	protected List<CheckComplianceTask> checkComplianceTasks = new ArrayList<CheckComplianceTask>();
	
	/** The status. */
	protected Status status = Status.INPRODUCTION;
	
	/** The virtual devices. */
	protected Set<String> virtualDevices = new HashSet<String>();
	
	/** The vrf instances. */
	protected Set<String> vrfInstances = new HashSet<String>();
	
	/** The software level. */
	protected SoftwareRule.ConformanceLevel softwareLevel = ConformanceLevel.UNKNOWN;
	
	/** The software version. */
	protected String softwareVersion = "";
	
	/** End of Life Date. */
	protected Date eolDate = null;
	/** End of Life responsible component. */
	protected Module eolModule = null;
	
	/** End of Sale Date. */
	protected Date eosDate = null;
	/** End of Sale responsible component. */
	protected Module eosModule = null;
	
	/**
	 * Instantiates a new device.
	 */
	public Device() {
		
	}


	/**
	 * Instantiates a new device.
	 *
	 * @param address the address
	 * @param domain the domain
	 */
	public Device(Network4Address address, Domain domain) {
		this.mgmtAddress = address;
		this.mgmtDomain = domain;
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
	
	/**
	 * Gets the change date.
	 *
	 * @return the change date
	 */
	@Version
	@XmlElement
	@ConfigItem(name = "Last change date", type = {ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE}, comparator = ConfigItem.Comparator.DATE)
	public Date getChangeDate() {
		return changeDate;
	}

	/**
	 * Gets the comments.
	 *
	 * @return the comments
	 */
	@XmlElement
	@ConfigItem(name = "Comments", type = {ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE}, comparator = ConfigItem.Comparator.TEXT)
	public String getComments() {
		return comments;
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
	 * Gets the compliance check results.
	 *
	 * @return the compliance check results
	 */
	@OneToMany(fetch = FetchType.LAZY, mappedBy = "key.device", cascade = CascadeType.ALL, orphanRemoval = true)
	public Set<CheckResult> getComplianceCheckResults() {
		return complianceCheckResults;
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
	@ConfigItem(name = "Contact", type = {ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE}, comparator = ConfigItem.Comparator.TEXT)
	public String getContact() {
		return contact;
	}

	/**
	 * Gets the created date.
	 *
	 * @return the created date
	 */
	@XmlElement
	@ConfigItem(name = "Creation date", type = {ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE}, comparator = ConfigItem.Comparator.DATE)
	public Date getCreatedDate() {
		return createdDate;
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
	
	/**
	 * Gets the family.
	 *
	 * @return the family
	 */
	@XmlElement
	@ConfigItem(name = "Family", type = {ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE}, comparator = ConfigItem.Comparator.TEXT)
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
	@XmlElement
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
	@ConfigItem(name = "Location", type = {ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE}, comparator = ConfigItem.Comparator.TEXT)
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
	@ConfigItem(name = "Management IP", type = ConfigItem.Type.CHECKABLE, alias = "ip")
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
	@ConfigItem(name = "Domain", type = {ConfigItem.Type.CHECKABLE, ConfigItem.Type.SEARCHABLE})
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
	@ConfigItem(name = "Modules", type = ConfigItem.Type.CHECKABLE)
	public List<Module> getModules() {
		return modules;
	}


	/**
	 * Gets the name.
	 *
	 * @return the name
	 */
	@XmlElement
	@ConfigItem(name = "Name", type = {ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE}, comparator = ConfigItem.Comparator.TEXT)
	public String getName() {
		return name;
	}


	/**
	 * Gets the network class.
	 *
	 * @return the network class
	 */
	@XmlElement
	@ConfigItem(name = "Network class", type = {ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE}, comparator = ConfigItem.Comparator.ENUM)
	public NetworkClass getNetworkClass() {
		return networkClass;
	}


	/**
	 * Gets the network interfaces.
	 *
	 * @return the network interfaces
	 */
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "device", orphanRemoval = true)
	@ConfigItem(name = "Interfaces", type = {ConfigItem.Type.CHECKABLE})
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
	 * Gets the serial number.
	 *
	 * @return the serial number
	 */
	@XmlElement
	@ConfigItem(name = "Serial number", type = {ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE}, comparator = ConfigItem.Comparator.DATE)
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
	 * Gets the check compliance tasks.
	 *
	 * @return the check compliance tasks
	 */
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "device")
	public List<CheckComplianceTask> getCheckComplianceTasks() {
		return checkComplianceTasks;
	}


	/**
	 * Gets the status.
	 *
	 * @return the status
	 */
	@Enumerated(value = EnumType.ORDINAL)
	@XmlElement
	@ConfigItem(name = "Device status", type = {ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE}, comparator = ConfigItem.Comparator.ENUM)
	public Status getStatus() {
		return status;
	}


	/**
	 * Gets the virtual devices.
	 *
	 * @return the virtual devices
	 */
	@ElementCollection
	@ConfigItem(name = "Virtual devices", type = ConfigItem.Type.CHECKABLE)
	public Set<String> getVirtualDevices() {
		return virtualDevices;
	}


	/**
	 * Gets the vrf instances.
	 *
	 * @return the vrf instances
	 */
	@ElementCollection
	@ConfigItem(name = "VRF instances", type = ConfigItem.Type.CHECKABLE)
	public Set<String> getVrfInstances() {
		return vrfInstances;
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
	protected void setChangeDate(Date changeDate) {
		this.changeDate = changeDate;
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
	 * Sets the compliance exemptions.
	 *
	 * @param complianceExemptions the new compliance exemptions
	 */
	protected void setComplianceExemptions(Set<Exemption> complianceExemptions) {
		this.complianceExemptions = complianceExemptions;
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
	
	/**
	 * Sets the credential sets.
	 *
	 * @param credentialSets the new credential sets
	 */
	protected void setCredentialSets(Set<DeviceCredentialSet> credentialSets) {
		this.credentialSets = credentialSets;
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
	
	/**
	 * Take snapshot.
	 *
	 * @return true, if successful
	 * @throws Exception the exception
	 */
	public abstract boolean takeSnapshot() throws Exception;


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

	/**
	 * Sets the check compliance tasks.
	 *
	 * @param checkComplianceTasks the new check compliance tasks
	 */
	public void setCheckComplianceTasks(
	    List<CheckComplianceTask> checkComplianceTasks) {
		this.checkComplianceTasks = checkComplianceTasks;
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
	 * Sets the software level.
	 *
	 * @param softwareLevel the new software level
	 */
	public void setSoftwareLevel(SoftwareRule.ConformanceLevel softwareLevel) {
		this.softwareLevel = softwareLevel;
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
	 * Sets the software version.
	 *
	 * @param softwareVersion the new software version
	 */
	public void setSoftwareVersion(String softwareVersion) {
		this.softwareVersion = softwareVersion;
	}
	
	@SuppressWarnings("unchecked")
  @Transient
	protected List<DeviceCredentialSet> getAutoCredentialSetList(Session session) throws HibernateException {
		return session
			.createQuery("from DeviceCredentialSet where mgmtDomain = :domain or mgmtDomain is null")
			.setEntity("domain", this.getMgmtDomain())
			.list();
	}

	@XmlElement
	public Date getEolDate() {
		return eolDate;
	}
	
	@XmlElement
	@Transient
	public boolean isEndOfLife() {
		return (eolDate != null && eolDate.before(new Date()));
	}

	public void setEolDate(Date eolDate) {
		this.eolDate = eolDate;
	}

	@XmlElement
	@OneToOne(fetch = FetchType.LAZY)
	public Module getEolModule() {
		return eolModule;
	}

	public void setEolModule(Module eolModule) {
		this.eolModule = eolModule;
	}

	@XmlElement
	public Date getEosDate() {
		return eosDate;
	}
	
	@XmlElement
	@Transient
	public boolean isEndOfSale() {
		return (eosDate != null && eosDate.before(new Date()));
	}

	public void setEosDate(Date eosDate) {
		this.eosDate = eosDate;
	}

	@XmlElement
	@OneToOne(fetch = FetchType.LAZY)
	public Module getEosModule() {
		return eosModule;
	}

	public void setEosModule(Module eosModule) {
		this.eosModule = eosModule;
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
	
	
}