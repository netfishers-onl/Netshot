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

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.Where;

import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import lombok.Getter;
import lombok.Setter;
import onl.netfishers.netshot.compliance.CheckResult;
import onl.netfishers.netshot.compliance.Exemption;
import onl.netfishers.netshot.compliance.Rule;
import onl.netfishers.netshot.compliance.SoftwareRule;
import onl.netfishers.netshot.compliance.SoftwareRule.ConformanceLevel;
import onl.netfishers.netshot.device.attribute.DeviceAttribute;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
import onl.netfishers.netshot.diagnostic.DiagnosticResult;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.rest.RestViews.RestApiView;

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
		
		/** The accesspoint. */
		ACCESSPOINT,
		
		/** The wirelesscontroller. */
		WIRELESSCONTROLLER,

		/** The consoleserver. */
		CONSOLESERVER,

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
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(RestApiView.class),
		@OneToMany(mappedBy = "device", orphanRemoval = true,
				cascade = CascadeType.ALL),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	private Set<DeviceAttribute> attributes = new HashSet<>();

	/** The auto try credentials. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected boolean autoTryCredentials = true;
	
	/** The change date. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date changeDate;
	
	@Getter(onMethod=@__({
		@Version
	}))
	@Setter
	private int version;

	/** The comments. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String comments = "";

	/** The compliance check results. */
	@Getter(onMethod=@__({
		@OneToMany(mappedBy = "key.device", orphanRemoval = true, cascade = CascadeType.ALL),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	protected Set<CheckResult> complianceCheckResults = new HashSet<>();

	/** The compliance exemptions. */
	@Getter(onMethod=@__({
		@OneToMany(fetch = FetchType.LAZY, mappedBy = "key.device", cascade = CascadeType.ALL, orphanRemoval = true),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	protected Set<Exemption> complianceExemptions = new HashSet<>();

	/** The configs. */
	@Getter(onMethod=@__({
		@OneToMany(mappedBy = "device", cascade = CascadeType.ALL),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	protected List<Config> configs = new ArrayList<>();

	/** The diagnostic results. */
	@Getter(onMethod=@__({
		@OneToMany(mappedBy = "device", orphanRemoval = true, cascade = CascadeType.ALL),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	protected Set<DiagnosticResult> diagnosticResults = new HashSet<>();

	/** The contact. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String contact = "";

	/** The created date. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date createdDate = new Date();

	/** The creator. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String creator;

	/** The credential sets. */
	@Getter(onMethod=@__({
		@XmlElement, @ManyToMany(), @Fetch(FetchMode.SELECT)
	}))
	@Setter
	protected Set<DeviceCredentialSet> credentialSets = new HashSet<>();

	/** Device-specific credential set */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@OneToOne(cascade = CascadeType.ALL)
	}))
	@Setter
	protected DeviceCredentialSet specificCredentialSet;

	/** The device deviceDriver name. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String driver;

	/** End of Life Date. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date eolDate = null;

	/** End of Life responsible component. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@OneToOne(fetch = FetchType.LAZY)
	}))
	@Setter
	protected Module eolModule = null;

	/** End of Sale Date. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date eosDate = null;

	/** End of Sale responsible component. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@OneToOne(fetch = FetchType.LAZY)
	}))
	@Setter
	protected Module eosModule = null;

	/** The family. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String family = "";

	/** The id. */
	@Getter(onMethod=@__({
		@Id,
		@GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlAttribute, @JsonView(RestApiView.class)
	}))
	@Setter
	protected long id;

	/** The last config. */
	@Getter(onMethod=@__({
		@OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
	}))
	@Setter
	protected Config lastConfig = null;

	/** The location. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String location = "";

	/** The mgmt address. */
	@Getter(onMethod=@__({
		@Embedded,
		@AttributeOverrides({
			@AttributeOverride(name = "address", column = @Column(name = "ipv4_address", unique = true)),
			@AttributeOverride(name = "prefixLength", column = @Column(name = "ipv4_pfxlen")),
			@AttributeOverride(name = "addressUsage", column = @Column(name = "ipv4_usage")),
		}),
		@XmlElement, @JsonView(DefaultView.class),
		@JsonSerialize(using = Network4Address.AddressOnlySerializer.class),
		@JsonDeserialize(using = Network4Address.AddressOnlyDeserializer.class)
	}))
	@Setter
	protected Network4Address mgmtAddress;

	/** The mgmt domain. */
	@Getter(onMethod=@__({
		@ManyToOne(fetch = FetchType.LAZY),
		@XmlElement, @JsonView(RestApiView.class)
	}))
	@Setter
	protected Domain mgmtDomain;

	/** The modules. */
	@Getter(onMethod=@__({
		@OneToMany(mappedBy = "device", orphanRemoval = true, cascade = CascadeType.ALL),
		@Where(clause = "removed is not true"),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	protected List<Module> modules = new ArrayList<>();

	/** The name. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String name = DEFAULTNAME;

	/** The network class. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected NetworkClass networkClass = NetworkClass.UNKNOWN;

	/** The network interfaces. */
	@Getter(onMethod=@__({
		@OneToMany(mappedBy = "device", orphanRemoval = true, cascade = CascadeType.ALL),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	protected List<NetworkInterface> networkInterfaces = new ArrayList<>();

	/** The owner groups. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(RestApiView.class),
		@ManyToMany(mappedBy = "cachedDevices")
	}))
	@Setter
	protected Set<DeviceGroup> ownerGroups = new HashSet<>();

	/** The serial number. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String serialNumber = "";

	/** The software level. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected SoftwareRule.ConformanceLevel softwareLevel = ConformanceLevel.UNKNOWN;

	/** The software version. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String softwareVersion = "";

	/** The status. */
	@Getter(onMethod=@__({
		@Enumerated(value = EnumType.ORDINAL),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Status status = Status.INPRODUCTION;

	/** The virtual devices. */
	@Getter(onMethod=@__({
		@ElementCollection
	}))
	@Setter
	protected Set<String> virtualDevices = new HashSet<>();

	/** The vrf instances. */
	@Getter(onMethod=@__({
		@ElementCollection
	}))
	@Setter
	protected Set<String> vrfInstances = new HashSet<>();
	
	/** SSH TCP port, 22 by default */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected int sshPort = 0;
	
	/** Telnet TCP port, 23 by default */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected int telnetPort = 0;
	
	/** An optional connection address, in case the management address can't be used to connect to the device. */
	@Getter(onMethod=@__({
		@Embedded,
		@AttributeOverrides({
			@AttributeOverride(name = "address", column = @Column(name = "connect_ipv4_address")),
			@AttributeOverride(name = "prefixLength", column = @Column(name = "connect_ipv4_pfxlen")),
			@AttributeOverride(name = "addressUsage", column = @Column(name = "connect_ipv4_usage")),
		}),
		@XmlElement, @JsonView(DefaultView.class),
		@JsonSerialize(using = Network4Address.AddressOnlySerializer.class),
		@JsonDeserialize(using = Network4Address.AddressOnlyDeserializer.class)
	}))
	@Setter
	protected Network4Address connectAddress;
	
	/**
	 * Instantiates a new device.
	 */
	protected Device() {

	}

	/**
	 * Instantiates a new device.
	 *
	 * @param driver the driver name
	 * @param address the address
	 * @param domain the domain
	 * @param creator the username who is creating the device
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
	 * Clear VRF instance.
	 */
	public void clearVrfInstance() {
		this.vrfInstances.clear();
	}

	/**
	 * Set all modules as removed.
	 */
	public void setModulesRemoved() {
		for (Module module : this.modules) {
			module.setRemoved(true);
		}
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
		return id == other.id;
	}

	/**
	 * Return a device attribute based on name
	 * @param name = name of the attribute to find
	 * @return the found attribute or null if none
	 */
	@Transient
	public DeviceAttribute getAttribute(String name) {
		for (DeviceAttribute attribute : this.attributes) {
			if (attribute.getName().equals(name)) {
				return attribute;
			}
		}
		return null;
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
	 * Gets the credential set ids.
	 *
	 * @return the credential set ids
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public List<Long> getCredentialSetIds() {
		List<Long> l = new ArrayList<>();
		for (DeviceCredentialSet credentialSet : credentialSets) {
			l.add(credentialSet.getId());
		}
		return l;
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


	/**
	 * Get a network interface based on its name.
	 * @param name = the name of the interface to look for
	 * @return the found interface or null if none was found
	 */
	@Transient
	public NetworkInterface getNetworkInterface(String name) {
		for (NetworkInterface networkInterface: this.networkInterfaces) {
			if (networkInterface.getInterfaceName().equals(name)) {
				return networkInterface;
			}
		}
		return null;
	}


	/**
	 * Gets the device type - in a non static manner to include it with JAXB.
	 * 
	 * @return the device type
	 */
	@Transient
	@XmlElement @JsonView(DefaultView.class)
	public String getRealDeviceType() {
		DeviceDriver deviceDriver;
		try {
			deviceDriver = getDeviceDriver();
			return deviceDriver.getDescription();
		}
		catch (MissingDeviceDriverException e) {
			return "Unknown driver";
		}
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
	 * Checks if is compliant.
	 *
	 * @return true, if is compliant
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public boolean isCompliant() {
		for (CheckResult check : this.getComplianceCheckResults()) {
			if (check.getResult().equals(CheckResult.ResultOption.NONCONFORMING)) {
				return false;
			}
		}
		return true;
	}

	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public boolean isEndOfLife() {
		return (eolDate != null && eolDate.before(new Date()));
	}

	@XmlElement @JsonView(DefaultView.class)
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


	public void addDiagnosticResult(DiagnosticResult result) {
		if (result == null) {
			return;
		}
		boolean doAdd = true;
		Iterator<DiagnosticResult> existingIterator = this.diagnosticResults.iterator();
		while (existingIterator.hasNext()) {
			DiagnosticResult existingResult = existingIterator.next();
			if (existingResult.getDiagnostic().equals(result.getDiagnostic())) {
				if (result.equals(existingResult)) {
					existingResult.setLastCheckDate(result.getLastCheckDate());
					doAdd = false;
				}
				else {
					existingIterator.remove();
				}
				break;
			}
		}
		if (doAdd) {
			this.diagnosticResults.add(result);
		}
	}

	@Override
	public String toString() {
		return "Device " + id + " (name '" + name + "', driver '" + driver + "', IP address " + mgmtAddress + ")";
	}

}
