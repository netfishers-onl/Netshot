/**
 * Copyright 2013-2025 Netshot
 * 
 * This file is part of Netshot project.
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
package net.netshot.netshot.device;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.Type;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.Getter;
import lombok.Setter;
import net.netshot.netshot.compliance.CheckResult;
import net.netshot.netshot.compliance.Exemption;
import net.netshot.netshot.compliance.Rule;
import net.netshot.netshot.compliance.SoftwareRule;
import net.netshot.netshot.compliance.SoftwareRule.ConformanceLevel;
import net.netshot.netshot.database.InetAddressUserType;
import net.netshot.netshot.device.access.AccessOverride;
import net.netshot.netshot.device.access.Ssh;
import net.netshot.netshot.device.access.Telnet;
import net.netshot.netshot.device.attribute.AttributeDefinition.EnumAttribute;
import net.netshot.netshot.device.attribute.DeviceAttribute;
import net.netshot.netshot.device.credentials.DeviceCredentialSet;
import net.netshot.netshot.diagnostic.DiagnosticResult;
import net.netshot.netshot.rest.RestViews.DefaultView;
import net.netshot.netshot.rest.RestViews.RestApiView;

/**
 * A device.
 */
@Entity
@XmlRootElement
@XmlAccessorType(XmlAccessType.NONE)
public class Device {

	public static class MissingDeviceDriverException extends Exception {
		private static final long serialVersionUID = -7286042265874166550L;

		public MissingDeviceDriverException(String message) {
			super(message);
		}
	}

	/**
	 * The Enum NetworkClass.
	 */
	public enum NetworkClass implements EnumAttribute {

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

		/** Unknown network class. */
		UNKNOWN,

		/** Voice Gateway. */
		VOICEGATEWAY,
	}


	/**
	 * The Enum Status.
	 */
	public enum Status implements EnumAttribute {

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
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(RestApiView.class),
		@OneToMany(mappedBy = "device", orphanRemoval = true,
			cascade = CascadeType.ALL)
	}))
	@Setter
	private Set<DeviceAttribute> attributes = new HashSet<>();

	/** The auto try credentials. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private boolean autoTryCredentials = true;

	/** The change date. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Date changeDate;

	@Getter(onMethod = @__({
		@Version
	}))
	@Setter
	private int version;

	/** The comments. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String comments = "";

	/** The compliance check results. */
	@Getter(onMethod = @__({
		@OneToMany(mappedBy = "key.device", orphanRemoval = true, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
	}))
	@Setter
	private Set<CheckResult> complianceCheckResults = new HashSet<>();

	/** The compliance exemptions. */
	@Getter(onMethod = @__({
		@OneToMany(mappedBy = "key.device", orphanRemoval = true, cascade = CascadeType.ALL)
	}))
	@Setter
	private Set<Exemption> complianceExemptions = new HashSet<>();

	/** The configs. */
	@Getter(onMethod = @__({
		@OneToMany(mappedBy = "device", cascade = CascadeType.ALL)
	}))
	@Setter
	private List<Config> configs = new ArrayList<>();

	/** The diagnostic results. */
	@Getter(onMethod = @__({
		@OneToMany(mappedBy = "device", orphanRemoval = true, cascade = CascadeType.ALL)
	}))
	@Setter
	private Set<DiagnosticResult> diagnosticResults = new HashSet<>();

	/** The contact. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String contact = "";

	/** The created date. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Date createdDate = new Date();

	/** The creator. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String creator;

	/** The credential sets. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class),
		@ManyToMany(), @Fetch(FetchMode.SELECT),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	private Set<DeviceCredentialSet> credentialSets = new HashSet<>();

	/** Device-specific credential set. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class),
		@OneToOne(cascade = CascadeType.ALL)
	}))
	@Setter
	private DeviceCredentialSet specificCredentialSet;

	/** The device deviceDriver name. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String driver;

	/** End of Life Date. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Date eolDate;

	/** End of Life responsible component. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class),
		@OneToOne(fetch = FetchType.LAZY)
	}))
	@Setter
	private Module eolModule;

	/** End of Sale Date. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Date eosDate;

	/** End of Sale responsible component. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class),
		@OneToOne(fetch = FetchType.LAZY)
	}))
	@Setter
	private Module eosModule;

	/** The family. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String family = "";

	/** The id. */
	@Getter(onMethod = @__({
		@Id,
		@GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlAttribute, @JsonView(RestApiView.class)
	}))
	@Setter
	private long id;

	/** The last config. */
	@Getter(onMethod = @__({
		@OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
	}))
	@Setter
	private Config lastConfig;

	/** The location. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String location = "";

	/** The mgmt address (IPv4 literal, IPv6 literal, or FQDN, resolved lazily at connect time). */
	@Getter(onMethod = @__({
		@Column(name = "mgmt_address"),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String mgmtAddress;

	/**
	 * The last IP address that {@link #mgmtAddress} resolved to, refreshed on every
	 * successful connection attempt. Used for fast IP-based search/dedup/passive
	 * matching, since {@link #mgmtAddress} itself may be a hostname.
	 */
	@Getter(onMethod = @__({
		@Column(name = "cached_ip_address"),
		@Type(InetAddressUserType.class)
	}))
	@Setter
	private InetAddress cachedIpAddress;

	/**
	 * String view of {@link #cachedIpAddress}, exposed on the full device REST
	 * representation only (not on the lightweight device list DTO).
	 *
	 * @return the cached IP address as a string, or null if not set
	 */
	@Transient
	@XmlElement(name = "cachedIpAddress")
	@JsonProperty("cachedIpAddress")
	@JsonView(DefaultView.class)
	public String getCachedIpAddressAsString() {
		return this.cachedIpAddress == null ? null : this.cachedIpAddress.getHostAddress();
	}

	/** The mgmt domain. */
	@Getter(onMethod = @__({
		@ManyToOne(fetch = FetchType.LAZY),
		@XmlElement, @JsonView(RestApiView.class)
	}))
	@Setter
	private Domain mgmtDomain;

	/** The modules. */
	@Getter(onMethod = @__({
		@OneToMany(mappedBy = "device", orphanRemoval = true, cascade = CascadeType.ALL),
		@SQLRestriction("removed is not true")
	}))
	@Setter
	private List<Module> modules = new ArrayList<>();

	/** The name. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String name = DEFAULTNAME;

	/** The network class. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private NetworkClass networkClass = NetworkClass.UNKNOWN;

	/** The network interfaces. */
	@Getter(onMethod = @__({
		@OneToMany(mappedBy = "device", orphanRemoval = true, cascade = CascadeType.ALL)
	}))
	@Setter
	private List<NetworkInterface> networkInterfaces = new ArrayList<>();

	@Getter(onMethod = @__({
		@OneToMany(mappedBy = "key.device"),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	private Set<DeviceGroupMembership> groupMemberships = new HashSet<>();

	/** The serial number. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String serialNumber = "";

	/** The software level. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private SoftwareRule.ConformanceLevel softwareLevel = ConformanceLevel.UNKNOWN;

	/** The software version. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String softwareVersion = "";

	/** The status. */
	@Getter(onMethod = @__({
		@Enumerated(EnumType.ORDINAL),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Status status = Status.INPRODUCTION;

	/** The virtual devices. */
	@Getter(onMethod = @__({
		@ElementCollection
	}))
	@Setter
	private Set<String> virtualDevices = new HashSet<>();

	/** The vrf instances. */
	@Getter(onMethod = @__({
		@ElementCollection
	}))
	@Setter
	private Set<String> vrfInstances = new HashSet<>();

	/**
	 * Per-access connection overrides (address/port), keyed by access name
	 * (e.g. "ssh", "telnet", "https"). {@code sshPort}/{@code telnetPort}/
	 * {@code connectAddress} below are computed accessors backed by this
	 * collection's "ssh"/"telnet" rows, kept for REST/frontend backward
	 * compatibility - see {@link AccessOverride}.
	 * <p>
	 * Not exposed in the REST/XML API yet (no {@code @XmlElement}/
	 * {@code @JsonView}): a later phase will design proper dedicated
	 * endpoints for managing arbitrary per-access overrides, rather than
	 * committing to this raw collection's shape now.
	 */
	@Getter(onMethod = @__({
		@OneToMany(mappedBy = "device", orphanRemoval = true, cascade = CascadeType.ALL)
	}))
	@Setter
	private Set<AccessOverride> accessOverrides = new HashSet<>();

	/**
	 * Gets the connection override for the given access name, if any.
	 * @param accessName the access name (e.g. "ssh", "telnet", "https")
	 * @return the override, or null if none is configured
	 */
	@Transient
	public AccessOverride getAccessOverride(String accessName) {
		for (AccessOverride override : this.accessOverrides) {
			if (accessName.equals(override.getAccessName())) {
				return override;
			}
		}
		return null;
	}

	/**
	 * Gets (creating if necessary) the connection override for the given access name.
	 * @param accessName the access name
	 * @return the (possibly newly created) override
	 */
	@Transient
	private AccessOverride getOrCreateAccessOverride(String accessName) {
		AccessOverride override = this.getAccessOverride(accessName);
		if (override == null) {
			override = new AccessOverride(this, accessName);
			this.accessOverrides.add(override);
		}
		return override;
	}

	/**
	 * SSH TCP port override (0 = not set, i.e. use the driver's default port).
	 * Computed from the "ssh" access override - see {@link #accessOverrides}.
	 * @return the SSH port override, or the protocol default if none is set
	 */
	@Transient
	@XmlElement
	@JsonView(DefaultView.class)
	public int getSshPort() {
		AccessOverride override = this.getAccessOverride("ssh");
		if (override == null) {
			return Ssh.DEFAULT_PORT;
		}
		return override.getPort() == null ? 0 : override.getPort();
	}

	/**
	 * Sets the SSH TCP port override (0 to clear it).
	 * @param sshPort the port to use, or 0 to clear the override
	 */
	public void setSshPort(int sshPort) {
		this.getOrCreateAccessOverride("ssh").setPort(sshPort == 0 ? null : sshPort);
	}

	/**
	 * Telnet TCP port override (0 = not set, i.e. use the driver's default port).
	 * Computed from the "telnet" access override - see {@link #accessOverrides}.
	 * @return the Telnet port override, or the protocol default if none is set
	 */
	@Transient
	@XmlElement
	@JsonView(DefaultView.class)
	public int getTelnetPort() {
		AccessOverride override = this.getAccessOverride("telnet");
		if (override == null) {
			return Telnet.DEFAULT_PORT;
		}
		return override.getPort() == null ? 0 : override.getPort();
	}

	/**
	 * Sets the Telnet TCP port override (0 to clear it).
	 * @param telnetPort the port to use, or 0 to clear the override
	 */
	public void setTelnetPort(int telnetPort) {
		this.getOrCreateAccessOverride("telnet").setPort(telnetPort == 0 ? null : telnetPort);
	}

	/**
	 * An optional connection address (IPv4 literal, IPv6 literal, or FQDN), in case the
	 * management address can't be used to connect to the device. Historically a single
	 * device-wide value applying to both SSH and Telnet - computed here from whichever
	 * of the "ssh"/"telnet" access overrides has an address set (see {@link #accessOverrides}).
	 * @return the connect address override, or null if none is set
	 */
	@Transient
	@XmlElement
	@JsonView(DefaultView.class)
	public String getConnectAddress() {
		AccessOverride sshOverride = this.getAccessOverride("ssh");
		if (sshOverride != null && sshOverride.getAddress() != null) {
			return sshOverride.getAddress();
		}
		AccessOverride telnetOverride = this.getAccessOverride("telnet");
		if (telnetOverride != null) {
			return telnetOverride.getAddress();
		}
		return null;
	}

	/**
	 * Sets the connection address override, applied to both the "ssh" and "telnet"
	 * accesses (matching the historical, protocol-agnostic semantics of this field).
	 * @param connectAddress the address to use, or null to clear the override
	 */
	public void setConnectAddress(String connectAddress) {
		this.getOrCreateAccessOverride("ssh").setAddress(connectAddress);
		this.getOrCreateAccessOverride("telnet").setAddress(connectAddress);
	}

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
	public Device(String driver, String address, Domain domain, String creator) {
		this.driver = driver;
		this.mgmtAddress = address;
		this.mgmtDomain = domain;
		this.creator = creator;
		this.refreshCachedIpAddress();
	}

	/**
	 * Resolves {@link #mgmtAddress} and updates {@link #cachedIpAddress} accordingly
	 * (cleared to null if the address can't currently be resolved). Called when the
	 * device is created or its management address is changed; also refreshed on every
	 * successful connection attempt (see CliScript), which is where a stale cache
	 * left over from a failed resolution normally gets a chance to heal.
	 */
	public void refreshCachedIpAddress() {
		try {
			this.cachedIpAddress = InetAddress.getByName(this.mgmtAddress);
		}
		catch (UnknownHostException e) {
			this.cachedIpAddress = null;
		}
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
		this.complianceExemptions.add(exemption);
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
		this.attributes.clear();
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

	/*(non-Javadoc)
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
		if (getClass() != obj.getClass()) {
			return false;
		}
		Device other = (Device) obj;
		return id == other.id;
	}

	@Transient
	public Map<String, DeviceAttribute> getAttributeMap() {
		Map<String, DeviceAttribute> map = new HashMap<>();
		for (DeviceAttribute a : this.attributes) {
			map.put(a.getName(), a);
		}
		return map;
	}

	/**
	 * Return a device attribute based on name.
	 * @param attributeName = name of the attribute to find
	 * @return the found attribute or null if none
	 */
	@Transient
	public DeviceAttribute getAttribute(String attributeName) {
		for (DeviceAttribute attribute : this.attributes) {
			if (attribute.getName().equals(attributeName)) {
				return attribute;
			}
		}
		return null;
	}

	/**
	 * Remove the given attribute.
	 * @param attributeName the name of the attribute to remove
	 */
	public void removeAttribute(String attributeName) {
		Iterator<DeviceAttribute> attributeIt = this.attributes.iterator();
		while (attributeIt.hasNext()) {
			if (attributeIt.next().getName().equals(attributeName)) {
				attributeIt.remove();
			}
		}
		return;
	}

	@Transient
	public List<DeviceCredentialSet> getAutoCredentialSetList(Session session) throws HibernateException {
		return session
			.createQuery(
				"from DeviceCredentialSet cs where (cs.mgmtDomain = :domain or cs.mgmtDomain is null) and (not (cs.deviceSpecific))",
				DeviceCredentialSet.class)
			.setParameter("domain", this.getMgmtDomain())
			.list();
	}

	/**
	 * Return groups this device is member of.
	 * @return the groups of this device
	 */
	@Transient
	@XmlElement
	@JsonView(DefaultView.class)
	public Set<DeviceGroup> getOwnerGroups() {
		HashSet<DeviceGroup> groups = new HashSet<>();
		for (DeviceGroupMembership membership : this.groupMemberships) {
			groups.add(membership.getGroup());
		}
		return groups;
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
	 * @param interfaceName = the name of the interface to look for
	 * @return the found interface or null if none was found
	 */
	@Transient
	public NetworkInterface getNetworkInterface(String interfaceName) {
		for (NetworkInterface networkInterface : this.networkInterfaces) {
			if (networkInterface.getInterfaceName().equals(interfaceName)) {
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
	@XmlElement
	@JsonView(DefaultView.class)
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


	/*(non-Javadoc)
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
		return this.eolDate != null && this.eolDate.before(new Date());
	}

	@XmlElement
	@JsonView(DefaultView.class)
	@Transient
	public boolean isEndOfSale() {
		return this.eosDate != null && this.eosDate.before(new Date());
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
				if (result.equals(existingResult) && result.valueEquals(existingResult)) {
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
