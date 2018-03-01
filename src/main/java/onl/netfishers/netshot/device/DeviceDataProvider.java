package onl.netfishers.netshot.device;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.persistence.Transient;

import org.hibernate.HibernateException;
import org.hibernate.ObjectNotFoundException;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.device.Device.MissingDeviceDriverException;
import onl.netfishers.netshot.device.DeviceDriver.AttributeDefinition;
import onl.netfishers.netshot.device.DeviceDriver.AttributeLevel;
import onl.netfishers.netshot.device.attribute.ConfigAttribute;
import onl.netfishers.netshot.device.attribute.DeviceAttribute;

/**
 * This class is to provide data about devices and configs to the JavaScript scripts.
 */
public class DeviceDataProvider {
	
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(DeviceDataProvider.class);
	
	/** The device. */
	private Device device = null;

	/** The session. */
	private Session session;
	
	/** Buffer of logs. */
	private List<String> log = new ArrayList<String>();

	/**
	 * Instantiates a new JavaScript data provider.
	 *
	 * @param session the session
	 * @param device the device
	 */
	public DeviceDataProvider(Session session, Device device) {
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
				networkInterface.put("enabled", ni.isEnabled());
				networkInterface.put("level3", ni.isLevel3());
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
	 * Resolve an hostname or an IP (reverse).
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
	 * Log a debug message.
	 *
	 * @param message the message
	 */
	public void debug(String message) {
		logIt("DEBUG: " + message, 5);
	}
	
	/**
	 * Log a message. Add it to the local buffer.
	 *
	 * @param log the log
	 * @param level the level
	 */
	protected void logIt(String log, int level) {
		this.log.add("[" + level + "] " + log);
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
}
