/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.compliance;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.persistence.UniqueConstraint;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.compliance.CheckResult.ResultOption;
import onl.netfishers.netshot.compliance.rules.JavaScriptRule;
import onl.netfishers.netshot.compliance.rules.TextRule;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.Device.MissingDeviceDriverException;
import onl.netfishers.netshot.device.DeviceDriver.AttributeDefinition;
import onl.netfishers.netshot.device.DeviceDriver.AttributeLevel;
import onl.netfishers.netshot.device.Module;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.device.Network6Address;
import onl.netfishers.netshot.device.NetworkInterface;
import onl.netfishers.netshot.device.attribute.ConfigAttribute;
import onl.netfishers.netshot.device.attribute.DeviceAttribute;

import org.hibernate.HibernateException;
import org.hibernate.ObjectNotFoundException;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonTypeInfo;


/**
 * A rule defines a number of constraints that a device should comply with.
 * A concrete implementation is the Javascript-based script rule.
 */
@Entity @Inheritance(strategy = InheritanceType.JOINED)
@Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"policy", "name"})})
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@JsonTypeInfo(use = JsonTypeInfo.Id.MINIMAL_CLASS, include = JsonTypeInfo.As.PROPERTY, property = "type")
public abstract class Rule {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(Rule.class);

	/** The set of real rule types. */
	private static final Set<Class<? extends Rule>> RULE_CLASSES;

	static {
		RULE_CLASSES = new HashSet<Class<? extends Rule>>();
		RULE_CLASSES.add(JavaScriptRule.class);
		RULE_CLASSES.add(TextRule.class);
	}

	/**
	 * Gets the rule classes.
	 *
	 * @return the rule classes
	 */
	public static final Set<Class<? extends Rule>> getRuleClasses() {
		return RULE_CLASSES;
	}

	/**
	 * The Class RuleDataProvider.
	 */
	public class RuleDataProvider {

		/** The device. */
		private Device device = null;

		/** The session. */
		private Session session;

		/**
		 * Instantiates a new js data provider.
		 *
		 * @param session the session
		 * @param device the device
		 */
		public RuleDataProvider(Session session, Device device) {
			this.session = session;
			this.device = device;
		}

		/**
		 * Gets the device item.
		 *
		 * @param device the device
		 * @param item the item
		 * @return the device item
		 */
		private Object getDeviceItem(Device device, String item) {
			DeviceDriver driver;
			try {
				driver = device.getDeviceDriver();
			}
			catch (MissingDeviceDriverException e) {
				return null;
			}
			if ("type".equals(item)) {
				return driver.getDescription();
			}
			else if ("name".equals(item)) {
				return device.getName();
			}
			else if ("family".equals(item)) {
				return device.getFamily();
			}
			else if ("location".equals(item)) {
				return device.getLocation();
			}
			else if ("contact".equals(item)) {
				return device.getContact();
			}
			else if ("softwareVersion".equals(item)) {
				return device.getSoftwareVersion();
			}
			else if ("serialNumber".equals(item)) {
				return device.getSerialNumber();
			}
			else if ("networkClass".equals(item)) {
				return (device.getNetworkClass() == null ? null : device.getNetworkClass().toString());
			}
			else if ("virtualDevices".equals(item)) {
				return device.getVirtualDevices().toArray();
			}
			else if ("vrfs".equals(item)) {
				return device.getVrfInstances().toArray();
			}
			else if ("modules".equals(item)) {
				List<Map<String, String>> modules = new ArrayList<Map<String, String>>();
				for (Module m : device.getModules()) {
					Map<String, String> module = new HashMap<String, String>();
					module.put("slot", m.getSlot());
					module.put("partNumber", m.getPartNumber());
					module.put("serialNumber", m.getSerialNumber());
					modules.add(module);
				}
				return modules.toArray();
			}
			else if ("interfaces".equals(item)) {
				List<Map<String, Object>> networkInterfaces = new ArrayList<Map<String, Object>>();
				for (NetworkInterface ni : device.getNetworkInterfaces()) {
					Map<String, Object> networkInterface = new HashMap<String, Object>();
					networkInterface.put("name", ni.getInterfaceName());
					networkInterface.put("description", ni.getDescription());
					networkInterface.put("mac", ni.getMacAddress());
					networkInterface.put("virtualDevice", ni.getVirtualDevice());
					networkInterface.put("vrf", ni.getVrfInstance());
					List<Map<String, String>> ips = new ArrayList<Map<String, String>>();
					for (Network4Address address : ni.getIp4Addresses()) {
						Map<String, String> ip = new HashMap<String, String>();
						ip.put("ip", address.getIp());
						ip.put("mask", Integer.toString(address.getPrefixLength()));
						ip.put("usage", address.getAddressUsage().toString());
						ips.add(ip);
					}
					for (Network6Address address : ni.getIp6Addresses()) {
						Map<String, String> ip = new HashMap<String, String>();
						ip.put("ipv6", address.getIp());
						ip.put("mask", Integer.toString(address.getPrefixLength()));
						ip.put("usage", address.getAddressUsage().toString());
						ips.add(ip);
					}
					networkInterface.put("ip", ips.toArray());
					networkInterfaces.add(networkInterface);
				}
				return networkInterfaces.toArray();
			}
			else {
				for (AttributeDefinition definition : driver.getAttributes()) {
					if ((definition.getName().equals(item) || definition.getTitle().equals(item)) && definition.isCheckable()) {
						if (definition.getLevel() == AttributeLevel.CONFIG && device.getLastConfig() != null) {
							for (ConfigAttribute attribute : device.getLastConfig().getAttributes()) {
								if (attribute.getName().equals(item)) {
									return attribute.getData();
								}
							}
						}
						else if (definition.getLevel() == AttributeLevel.DEVICE) {
							for (DeviceAttribute attribute : device.getAttributes()) {
								if (attribute.getName().equals(item)) {
									return attribute.getData();
								}
							}
						}
					}
				}
			}
			return null;
		}

		/**
		 * Gets the.
		 *
		 * @param item the item
		 * @return the object
		 */
		public Object get(String item) {
			logger.debug("JavaScript request for item {} on current device.", item);
			return this.getDeviceItem(this.device, item);
		}

		/**
		 * Load device.
		 *
		 * @param id the id
		 * @return the device
		 * @throws HibernateException the hibernate exception
		 */
		private Device loadDevice(long id) throws HibernateException {
			Device device = (Device) session
					.createQuery("from Device d join fetch d.lastConfig where d.id = :id")
					.setLong("id", id)
					.uniqueResult();
			return device;
		}

		private Device loadDevice(String name) throws HibernateException {
			Device device = (Device) session
					.createQuery("from Device d join fetch d.lastConfig where d.name = :name")
					.setString("name", name)
					.uniqueResult();
			return device;
		}

		/**
		 * Destroy.
		 */
		public void destroy() {
		}

		/**
		 * Gets the.
		 *
		 * @param item the item
		 * @param deviceId the device id
		 * @return the object
		 */
		public Object get(String item, long deviceId) {
			logger.debug("JavaScript request for item {} on device {}.", item,
					deviceId);
			if (deviceId == this.device.getId()) {
				return this.get(item);
			}
			try {
				device = loadDevice(deviceId);
				Object result = this.getDeviceItem(device, item);
				session.evict(device);
				return result;
			}
			catch (ObjectNotFoundException e) {
				logger.error("Device not found on JavaScript get, item {}, device {}.",
						item, deviceId, e);
				logIt(String.format("Unable to find the device %d.", deviceId), 3);
			}
			catch (Exception e) {
				logger.error("Error on JavaScript get, item {}, device {}.", item,
						deviceId, e);
				logIt(String.format("Unable to get data %s for device %d.", deviceId),
						3);
			}
			return null;
		}

		public Object get(String item, String deviceName) {
			logger.debug("JavaScript request for item {} on device named {}.", item,
					deviceName);
			try {
				if (device.getName().equals(deviceName)) {
					return this.get(item);
				}
				device = loadDevice(deviceName);
				Object result = this.getDeviceItem(device, item);
				session.evict(device);
				return result;
			}
			catch (ObjectNotFoundException e) {
				logger.error("Device not found on JavaScript get, item {}, device named {}.",
						item, deviceName, e);
				logIt(String.format("Unable to find the device named %s.", deviceName), 3);
			}
			catch (Exception e) {
				logger.error("Error on JavaScript get, item {}, device named {}.", item,
						deviceName, e);
				logIt(String.format("Unable to get data %s for device named %s.", deviceName), 3);
			}
			return null;
		}

		/**
		 * Nslookup.
		 *
		 * @param host the host
		 * @return the object
		 */
		public Object nslookup(String host) {
			String name = "";
			String address = "";
			try {
				InetAddress ip = InetAddress.getByName(host);
				name = ip.getHostName();
				address = ip.getHostAddress();
			}
			catch (UnknownHostException e) {
			}
			Map<String, String> result = new HashMap<String, String>();
			result.put("name", name);
			result.put("address", address);
			return result;
		}

		/**
		 * Debug.
		 *
		 * @param message the message
		 */
		public void debug(String message) {
			logIt("DEBUG: " + message, 5);
		}

	}


	/** The enabled. */
	protected boolean enabled = false;

	/** The id. */
	protected long id;

	/** The policy. */
	protected Policy policy = null;

	/** The name. */
	protected String name = "";

	/** The log. */
	private List<String> log = new ArrayList<String>();

	/** The exemptions. */
	private Set<Exemption> exemptions = new HashSet<Exemption>();

	/** The check results. */
	private Set<CheckResult> checkResults = new HashSet<CheckResult>();

	/**
	 * Instantiates a new rule.
	 */
	protected Rule() {

	}

	/**
	 * Instantiates a new rule.
	 *
	 * @param name the name
	 * @param policy the policy
	 */
	public Rule(String name, Policy policy) {
		this.name = name;
		this.policy = policy;
	}

	/**
	 * Sets the check result.
	 *
	 * @param device the device
	 * @param result the result
	 * @param comment the comment
	 * @param session the session
	 */
	protected void setCheckResult(Device device, CheckResult.ResultOption result, String comment, Session session) {
		CheckResult checkResult = new CheckResult(this, device, result);
		checkResult.setComment(comment);
		if (session.contains(this)) {
			session.saveOrUpdate(checkResult);
		}
		else {
			this.checkResults.add(checkResult);
		}
	}

	/**
	 * Check.
	 *
	 * @param device the device
	 * @param session the session
	 */
	public void check(Device device, Session session) {
		logger.warn("Called generic rule check.");
		if (!this.isEnabled()) {
			this.setCheckResult(device, ResultOption.DISABLED, "", session);
		}
		else if (device.isExempted(this)) {
			this.setCheckResult(device, ResultOption.EXEMPTED, "", session);
		}
		else {
			this.setCheckResult(device, ResultOption.NOTAPPLICABLE, "", session);
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
		Rule other = (Rule) obj;
		if (id != other.id)
			return false;
		return true;
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@Id
	@GeneratedValue
	@XmlElement
	public long getId() {
		return id;
	}

	/**
	 * Gets the policy.
	 *
	 * @return the policy
	 */
	@ManyToOne
	public Policy getPolicy() {
		return policy;
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
	 * Checks if is enabled.
	 *
	 * @return true, if is enabled
	 */
	@XmlElement
	public boolean isEnabled() {
		return enabled;
	}

	/**
	 * Sets the enabled.
	 *
	 * @param enabled the new enabled
	 */
	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
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
	 * Sets the policy.
	 *
	 * @param policy the new policy
	 */
	public void setPolicy(Policy policy) {
		this.policy = policy;
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
	 * Sets the name.
	 *
	 * @param name the new name
	 */
	public void setName(String name) {
		this.name = name;
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
	 * Log it.
	 *
	 * @param log the log
	 * @param level the level
	 */
	protected void logIt(String log, int level) {
		this.log.add("[" + level + "] " + log);
	}

	/**
	 * Gets the exemptions.
	 *
	 * @return the exemptions
	 */
	@OneToMany(fetch = FetchType.LAZY, mappedBy = "key.rule", cascade = CascadeType.ALL, orphanRemoval = true)
	public Set<Exemption> getExemptions() {
		return exemptions;
	}

	/**
	 * Sets the exemptions.
	 *
	 * @param exemptions the new exemptions
	 */
	public void setExemptions(Set<Exemption> exemptions) {
		this.exemptions = exemptions;
	}

	/**
	 * Delete exemption.
	 *
	 * @param exemption the exemption
	 */
	public void deleteExemption(Exemption exemption) {
		this.exemptions.remove(exemption);
	}

	/**
	 * Adds the exemption.
	 *
	 * @param exemption the exemption
	 */
	public void addExemption(Exemption exemption) {
		this.exemptions.add(exemption);
	}

	/**
	 * Clear exemptions.
	 */
	public void clearExemptions() {
		this.exemptions.clear();
	}

	/**
	 * Gets the check results.
	 *
	 * @return the check results
	 */
	@OneToMany(fetch = FetchType.LAZY, mappedBy = "key.rule", cascade = CascadeType.ALL, orphanRemoval = true)
	public Set<CheckResult> getCheckResults() {
		return checkResults;
	}

	/**
	 * Sets the check results.
	 *
	 * @param checkResults the new check results
	 */
	public void setCheckResults(Set<CheckResult> checkResults) {
		this.checkResults = checkResults;
	}

	/**
	 * Delete check result.
	 *
	 * @param checkResult the check result
	 * @return true, if successful
	 */
	public boolean deleteCheckResult(CheckResult checkResult) {
		return this.checkResults.remove(checkResult);
	}

	/**
	 * Adds the check result.
	 *
	 * @param checkResult the check result
	 * @return true, if successful
	 */
	public boolean addCheckResult(CheckResult checkResult) {
		return this.checkResults.add(checkResult);
	}

	/**
	 * Clear check results.
	 */
	public void clearCheckResults() {
		this.checkResults.clear();
	}

}
