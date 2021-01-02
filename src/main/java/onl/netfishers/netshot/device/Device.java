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
package onl.netfishers.netshot.device;

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
import javax.persistence.GenerationType;
import javax.persistence.Id;
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

import com.fasterxml.jackson.annotation.JsonView;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import onl.netfishers.netshot.compliance.CheckResult;
import onl.netfishers.netshot.compliance.Exemption;
import onl.netfishers.netshot.compliance.Rule;
import onl.netfishers.netshot.compliance.SoftwareRule;
import onl.netfishers.netshot.compliance.SoftwareRule.ConformanceLevel;
import onl.netfishers.netshot.device.attribute.DeviceAttribute;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
import onl.netfishers.netshot.diagnostic.DiagnosticResult;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.tasks.CheckComplianceTask;
import onl.netfishers.netshot.work.tasks.RunDiagnosticsTask;
import onl.netfishers.netshot.work.tasks.RunDeviceScriptTask;
import onl.netfishers.netshot.work.tasks.TakeSnapshotTask;

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
	

	/** The attributes. */
	private Set<DeviceAttribute> attributes = new HashSet<DeviceAttribute>();

	/** The auto try credentials. */
	protected boolean autoTryCredentials = true;
	
	/** The change date. */
	protected Date changeDate;
	
	private int version;

	/** The check compliance tasks. */
	protected List<CheckComplianceTask> checkComplianceTasks = new ArrayList<CheckComplianceTask>();
	
	/** The run device script tasks. */
	protected List<RunDeviceScriptTask> runDeviceScriptTasks = new ArrayList<RunDeviceScriptTask>();
	
	/** The diagnostic tasks. */
	protected List<RunDiagnosticsTask> runDiagnosticsTasks = new ArrayList<RunDiagnosticsTask>();

	/** The comments. */
	protected String comments = "";

	/** The compliance check results. */
	protected Set<CheckResult> complianceCheckResults = new HashSet<CheckResult>();

	/** The compliance exemptions. */
	protected Set<Exemption> complianceExemptions = new HashSet<Exemption>();

	/** The configs. */
	protected List<Config> configs = new ArrayList<Config>();
	
	/** The diagnostic results. */
	protected Set<DiagnosticResult> diagnosticResults = new HashSet<DiagnosticResult>();

	/** The contact. */
	protected String contact = "";

	/** The created date. */
	protected Date createdDate = new Date();

	private String creator;

	/** The credential sets. */
	protected Set<DeviceCredentialSet> credentialSets = new HashSet<DeviceCredentialSet>();

	/** Device-specific credential set/ */
	protected DeviceCredentialSet specificCredentialSet;

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
	
	/** SSH TCP port, 22 by default */
	protected int sshPort = 0;
	
	/** Telnet TCP port, 23 by default */
	protected int telnetPort = 0;
	
	/** An optional connection address, in case the management address can't be used to connect to the device. */
	protected Network4Address connectAddress;
	
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
	@JsonView(DefaultView.class)
	@OneToMany(cascade = CascadeType.ALL, mappedBy = "device", orphanRemoval = true)
	public Set<DeviceAttribute> getAttributes() {
		return attributes;
	}

	@SuppressWarnings("unchecked")
	@Transient
	public List<DeviceCredentialSet> getAutoCredentialSetList(Session session) throws HibernateException {
		return session
				.createQuery("from DeviceCredentialSet cs where (cs.mgmtDomain = :domain or cs.mgmtDomain is null) and (not (cs.deviceSpecific = :true))")
				.setParameter("domain", this.getMgmtDomain())
				.setParameter("true", true)
				.list();
	}

	/**
	 * Gets the change date.
	 *
	 * @return the change date
	 */
	@XmlElement
	@JsonView(DefaultView.class)
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

	/**
	 * Gets the run device script tasks.
	 *
	 * @return the run device script tasks
	 */
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "device")
	public List<RunDeviceScriptTask> getRunDeviceScriptTasks() {
		return runDeviceScriptTasks;
	}

	/**
	 * Gets the run diagnostics tasks.
	 *
	 * @return the run diagnostics tasks
	 */
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "device")
	public List<RunDiagnosticsTask> getRunDiagnosticsTasks() {
		return runDiagnosticsTasks;
	}

	/**
	 * Gets the comments.
	 *
	 * @return the comments
	 */
	@XmlElement
	@JsonView(DefaultView.class)
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
	@JsonView(DefaultView.class)
	public String getContact() {
		return contact;
	}

	/**
	 * Gets the created date.
	 *
	 * @return the created date
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public Date getCreatedDate() {
		return createdDate;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getCreator() {
		return creator;
	}

	/**
	 * Gets the credential set ids.
	 *
	 * @return the credential set ids
	 */
	@XmlElement
	@JsonView(DefaultView.class)
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
			throw new MissingDeviceDriverException(message);
		}
		DeviceDriver deviceDriver = DeviceDriver.getDriverByName(driver);
		if (deviceDriver == null) {
			String message = String.format("Unable to locate the driver %s for device %d.", driver, id);
			throw new MissingDeviceDriverException(message);
		}
		return deviceDriver;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getDriver() {
		return driver;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public Date getEolDate() {
		return eolDate;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	@OneToOne(fetch = FetchType.LAZY)
	public Module getEolModule() {
		return eolModule;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public Date getEosDate() {
		return eosDate;
	}

	@XmlElement
	@JsonView(DefaultView.class)
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
	@JsonView(DefaultView.class)
	public String getFamily() {
		return family;
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
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
	@JsonView(DefaultView.class)
	public String getLocation() {
		return location;
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
	@JsonView(DefaultView.class)
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
	@JsonView(DefaultView.class)
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
	@JsonView(DefaultView.class)
	public String getName() {
		return name;
	}


	/**
	 * Gets the network class.
	 *
	 * @return the network class
	 */
	@XmlElement
	@JsonView(DefaultView.class)
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
	@JsonView(DefaultView.class)
	@ManyToMany(fetch = FetchType.LAZY, mappedBy = "cachedDevices")
	public Set<DeviceGroup> getOwnerGroups() {
		return ownerGroups;
	}


	/**
	 * Gets the device type - in a non static manner to include it with JAXB.
	 * 
	 * @return the device type
	 */
	@Transient
	@XmlElement
	@JsonView(DefaultView.class)
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
	@JsonView(DefaultView.class)
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
	@JsonView(DefaultView.class)
	public SoftwareRule.ConformanceLevel getSoftwareLevel() {
		return softwareLevel;
	}


	/**
	 * Gets the software version.
	 *
	 * @return the software version
	 */
	@XmlElement
	@JsonView(DefaultView.class)
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
	@JsonView(DefaultView.class)
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
	@JsonView(DefaultView.class)
	public boolean isAutoTryCredentials() {
		return autoTryCredentials;
	}

	/**
	 * Checks if is compliant.
	 *
	 * @return true, if is compliant
	 */
	@XmlElement
	@JsonView(DefaultView.class)
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
	@JsonView(DefaultView.class)
	@Transient
	public boolean isEndOfLife() {
		return (eolDate != null && eolDate.before(new Date()));
	}

	@XmlElement
	@JsonView(DefaultView.class)
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
	
	/**
	 * Sets the run device script tasks.
	 * @param tasks the new device script tasks
	 */
	public void setRunDeviceScriptTasks(List<RunDeviceScriptTask> tasks) {
		this.runDeviceScriptTasks = tasks;
	}
	
	/**
	 * Sets the run diagnostics tasks.
	 * @param tasks the new run diagnostics tasks
	 */
	public void setRunDiagnosticsTasks(List<RunDiagnosticsTask> tasks) {
		this.runDiagnosticsTasks = tasks;
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
	
	@XmlElement
	@JsonView(DefaultView.class)
	public int getSshPort() {
		return sshPort;
	}

	public void setSshPort(int sshPort) {
		this.sshPort = sshPort;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public int getTelnetPort() {
		return telnetPort;
	}

	public void setTelnetPort(int telnetPort) {
		this.telnetPort = telnetPort;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	@OneToOne(cascade = CascadeType.ALL)
	public DeviceCredentialSet getSpecificCredentialSet() {
		return specificCredentialSet;
	}

	public void setSpecificCredentialSet(DeviceCredentialSet specificCredentialSet) {
		this.specificCredentialSet = specificCredentialSet;
	}

	@Embedded
	@AttributeOverrides({
		@AttributeOverride(name = "address", column = @Column(name = "connect_ipv4_address")),
		@AttributeOverride(name = "prefixLength", column = @Column(name = "connect_ipv4_pfxlen")),
		@AttributeOverride(name = "addressUsage", column = @Column(name = "connect_ipv4_usage")),
	})
	@XmlElement
	@JsonView(DefaultView.class)
	public Network4Address getConnectAddress() {
		return connectAddress;
	}

	public void setConnectAddress(Network4Address connectAddress) {
		this.connectAddress = connectAddress;
	}
	
	
	
	public void addDiagnosticResult(DiagnosticResult result) {
		if (result == null) {
			return;
		}
		boolean dontAdd = false;
		Iterator<DiagnosticResult> existingIterator = this.diagnosticResults.iterator();
		while (existingIterator.hasNext()) {
			DiagnosticResult existingResult = existingIterator.next();
			if (existingResult.getDiagnostic().equals(result.getDiagnostic())) {
				if (result.equals(existingResult)) {
					existingResult.setLastCheckDate(result.getLastCheckDate());
					dontAdd = true;
				}
				else {
					existingIterator.remove();
				}
				break;
			}
		}
		if (!dontAdd) {
			this.diagnosticResults.add(result);
		}
	}


	/**
	 * Gets the diagnostic results.
	 *
	 * @return the diagnostic results
	 */
	@OneToMany(fetch = FetchType.LAZY, mappedBy = "device", cascade = CascadeType.ALL, orphanRemoval = true)
	public Set<DiagnosticResult> getDiagnosticResults() {
		return diagnosticResults;
	}
	
	public void setDiagnosticResults(Set<DiagnosticResult> diagnosticResults) {
		this.diagnosticResults = diagnosticResults;
	}

	@Override
	public String toString() {
		return "Device " + id + " (name '" + name + "', driver '" + driver + "', IP address " + mgmtAddress + ")";
	}

}