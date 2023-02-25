package onl.netfishers.netshot.device.script.helper;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.HostAccess.Export;
import org.graalvm.polyglot.proxy.ProxyArray;
import org.graalvm.polyglot.proxy.ProxyHashMap;
import org.hibernate.HibernateException;
import org.hibernate.ObjectNotFoundException;
import org.hibernate.Session;

import lombok.extern.slf4j.Slf4j;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.Module;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.device.Network6Address;
import onl.netfishers.netshot.device.NetworkAddress;
import onl.netfishers.netshot.device.NetworkInterface;
import onl.netfishers.netshot.device.PhysicalAddress;
import onl.netfishers.netshot.device.Device.MissingDeviceDriverException;
import onl.netfishers.netshot.device.Device.NetworkClass;
import onl.netfishers.netshot.device.NetworkAddress.AddressUsage;
import onl.netfishers.netshot.device.attribute.AttributeDefinition;
import onl.netfishers.netshot.device.attribute.ConfigAttribute;
import onl.netfishers.netshot.device.attribute.DeviceAttribute;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeLevel;
import onl.netfishers.netshot.diagnostic.DiagnosticResult;
import onl.netfishers.netshot.work.TaskLogger;
import onl.netfishers.netshot.device.attribute.DeviceBinaryAttribute;
import onl.netfishers.netshot.device.attribute.DeviceLongTextAttribute;
import onl.netfishers.netshot.device.attribute.DeviceNumericAttribute;
import onl.netfishers.netshot.device.attribute.DeviceTextAttribute;

/**
 * Class used to get  and set data on a device object from Python.
 * @author sylvain.cadilhac
 *
 */
@Slf4j
public class PyDeviceHelper {

	private Device device;
	private Session session;
	private TaskLogger taskLogger;
	private boolean readOnly;

	public static String getStringMember(Value value, String key, String defaultResult) {
		Value result = value.getHashValue(key);
		if (result != null) {
			return result.asString();
		}
		return defaultResult;
	}

	public static boolean getBooleanMember(Value value, String key, boolean defaultResult) {
		Value result = value.getHashValue(key);
		if (result != null) {
			return result.asBoolean();
		}
		return defaultResult;
	}

	/**
	 * Change a pythonic key into camel case, e.g. 'running_config' into 'runningConfig'.
	 * @param field = the field name to change
	 * @return the JS version if applicable, the original field otherwise
	 */
	private static String pythonicToJavascriptic(String field) {
		if (field.matches("^[a-z0-9_]+$")) {
			String[] parts = field.split("_");
			for (int i = 1; i < parts.length; i++) {
				parts[i] = StringUtils.capitalize(parts[i]);
			}
			return String.join("", parts);
		}
		return field;
	}

	public PyDeviceHelper(Device device, Session session, TaskLogger taskLogger, boolean readOnly)
			throws MissingDeviceDriverException {
		this.device = device;
		this.taskLogger = taskLogger;
		this.readOnly = readOnly;
		this.session = session;
	}
	
	@Export
	public void add(String key, Value data) {
		if (readOnly) {
			log.warn("Adding key '{}' is forbidden.", key);
			taskLogger.error(String.format("Adding key %s is forbidden", key));
			return;
		}
		if (data == null) {
			return;
		}
		try {
			if ("module".equals(key)) {
				
				Module module = new Module(
						getStringMember(data, "slot", ""),
						getStringMember(data, "part_number", ""),
						getStringMember(data, "serial_number", ""),
						device
				);
				device.getModules().add(module);
			}
			else if ("network_interface".equals(key)) {
				NetworkInterface networkInterface = new NetworkInterface(
						device,
						data.getHashValue("name").asString(),
						getStringMember(data, "virtual_device", ""),
						getStringMember(data, "vrf", ""),
						getBooleanMember(data, "enabled", true),
						getBooleanMember(data, "level3", true),
						getStringMember(data, "description", "")
				);
				networkInterface.setPhysicalAddress(new PhysicalAddress(
						getStringMember(data, "mac", "0000.0000.0000")));
				Value ipAddresses = data.getHashValue("ip");
				if (ipAddresses != null) {
					for (long i = 0; i < ipAddresses.getArraySize(); i++) {
						Value ip = ipAddresses.getArrayElement(i);
						NetworkAddress address = null;
						if (ip.hasMember("ipv6")) {
							address = new Network6Address(ip.getHashValue("ipv6").asString(), ip.getHashValue("mask").asInt());
						}
						else if (ip.getHashValue("mask").isNumber()) {
							address = new Network4Address(ip.getHashValue("ip").asString(), ip.getHashValue("mask").asInt());
						}
						else {
							address = new Network4Address(ip.getHashValue("ip").asString(), ip.getHashValue("mask").asString());
						}
						Value usage = ip.getHashValue("usage");
						if (usage != null) {
							address.setAddressUsage(AddressUsage.valueOf(usage.asString()));
						}
						networkInterface.addIpAddress(address);
					}
				}
				
				device.getNetworkInterfaces().add(networkInterface);
			}
			else if ("vrf".equals(key)) {
				device.addVrfInstance(data.asString());
			}
			else if ("virtual_device".equals(key)) {
				device.addVirtualDevice(data.asString());
			}
		}
		catch (Exception e) {
			log.warn("Error during snapshot while adding device attribute key '{}'.", key, e);
			taskLogger.error(String.format("Can't add device attribute %s: %s", key, e.getMessage()));
		}
	}
	
	@Export
	public void reset() {
		if (readOnly) {
			log.warn("Resetting device is forbidden.");
			taskLogger.error(String.format("Resetting key is forbidden"));
			return;
		}
		device.setFamily("");
		device.setLocation("");
		device.setContact("");
		device.setSoftwareVersion("");
		device.setNetworkClass(NetworkClass.UNKNOWN);
		device.clearAttributes();
		device.clearVrfInstance();
		device.clearVirtualDevices();
		device.getNetworkInterfaces().clear();
		device.getModules().clear();
		device.setEolModule(null);
		device.setEosModule(null);
		device.setEolDate(null);
		device.setEosDate(null);
	}

	@Export
	public void set(String key, Boolean value) {
		if (readOnly) {
			log.warn("Setting key '{}' is forbidden.", key);
			taskLogger.error(String.format("Setting key %s is forbidden", key));
			return;
		}
		if (value == null) {
			return;
		}
		try {
			DeviceDriver driver = device.getDeviceDriver();
			for (AttributeDefinition attribute : driver.getAttributes()) {
				if (attribute.getLevel().equals(AttributeLevel.DEVICE) && attribute.getName().equals(key)) {
					switch (attribute.getType()) {
					case BINARY:
						device.addAttribute(new DeviceBinaryAttribute(device, key, value));
						break;
					default:
					}
					break;
				}
			}
		}
		catch (Exception e) {
			log.warn("Error during snapshot while setting device attribute key '{}'.", key);
			taskLogger.error(String.format("Can't add device attribute %s: %s", key, e.getMessage()));
		}
	}
	
	
	@Export
	public void set(String key, Double value) {
		if (readOnly) {
			log.warn("Setting key '{}' is forbidden.", key);
			taskLogger.error(String.format("Setting key %s is forbidden", key));
			return;
		}
		if (value == null) {
			return;
		}
		try {
			DeviceDriver driver = device.getDeviceDriver();
			for (AttributeDefinition attribute : driver.getAttributes()) {
				if (attribute.getLevel().equals(AttributeLevel.DEVICE) && attribute.getName().equals(key)) {
					switch (attribute.getType()) {
					case NUMERIC:
						device.addAttribute(new DeviceNumericAttribute(device, key, value));
						break;
					default:
					}
					break;
				}
			}
		}
		catch (Exception e) {
			log.warn("Error during snapshot while setting device attribute key '{}'.", key);
			taskLogger.error(String.format("Can't add device attribute %s: %s", key, e.getMessage()));
		}
	}
	
	@Export
	public void set(String key, String value) {
		if (readOnly) {
			log.warn("Setting key '{}' is forbidden.", key);
			taskLogger.error(String.format("Setting key %s is forbidden", key));
			return;
		}
		if (value == null) {
			return;
		}
		try {
			if ("name".equals(key)) {
				device.setName(value);
			}
			else if ("family".equals(key)) {
				device.setFamily(value);
			}
			else if ("location".equals(key)) {
				device.setLocation(value);
			}
			else if ("contact".equals(key)) {
				device.setContact(value);
			}
			else if ("software_version".equals(key)) {
				device.setSoftwareVersion(value);
			}
			else if ("serial_number".equals(key)) {
				device.setSerialNumber(value);
			}
			else if ("comments".equals(key)) {
				device.setComments(value);
			}
			else if ("network_class".equals(key)) {
				NetworkClass nc = NetworkClass.valueOf(value);
				if (nc != null) {
					device.setNetworkClass(nc);
				}
			}
			else {
				DeviceDriver driver = device.getDeviceDriver();
				for (AttributeDefinition attribute : driver.getAttributes()) {
					if (attribute.getLevel().equals(AttributeLevel.DEVICE) && attribute.getName().equals(key)) {
						switch (attribute.getType()) {
						case LONGTEXT:
							device.addAttribute(new DeviceLongTextAttribute(device, key, value));
							break;
						case TEXT:
							device.addAttribute(new DeviceTextAttribute(device, key, value));
							break;
						default:
						}
						break;
					}
				}
			}
		}
		catch (Exception e) {
			log.warn("Error during snapshot while setting device attribute key '{}'.", key);
			taskLogger.error(String.format("Can't add device attribute %s: %s", key, e.getMessage()));
		}
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
		else if ("management_ip_address".equals(item)) {
			return device.getMgmtAddress().getIp();
		}
		else if ("management_domain".equals(item)) {
			return device.getMgmtDomain().getName();
		}
		else if ("location".equals(item)) {
			return device.getLocation();
		}
		else if ("contact".equals(item)) {
			return device.getContact();
		}
		else if ("software_version".equals(item)) {
			return device.getSoftwareVersion();
		}
		else if ("serial_number".equals(item)) {
			return device.getSerialNumber();
		}
		else if ("comments".equals(item)) {
			return device.getComments();
		}
		else if ("network_class".equals(item)) {
			return (device.getNetworkClass() == null ? null : device.getNetworkClass().toString());
		}
		else if ("virtual_devices".equals(item)) {
			return ProxyArray.fromList(List.copyOf(device.getVirtualDevices()));
		}
		else if ("vrfs".equals(item)) {
			return ProxyArray.fromList(List.copyOf(device.getVrfInstances()));
		}
		else if ("modules".equals(item)) {
			List<Object> modules = new ArrayList<>();
			for (Module m : device.getModules()) {
				Map<Object, Object> module = new HashMap<>();
				module.put("slot", Value.asValue(m.getSlot()));
				module.put("part_number", Value.asValue(m.getPartNumber()));
				module.put("serial_number", Value.asValue(m.getSerialNumber()));
				modules.add(ProxyHashMap.from(module));
			}
			return ProxyArray.fromList(modules);
		}
		else if ("interfaces".equals(item)) {
			List<Object> networkInterfaces = new ArrayList<>();
			for (NetworkInterface ni : device.getNetworkInterfaces()) {
				Map<Object, Object> networkInterface = new HashMap<>();
				networkInterface.put("name", ni.getInterfaceName());
				networkInterface.put("description", ni.getDescription());
				networkInterface.put("mac", ni.getMacAddress());
				networkInterface.put("virtual_device", ni.getVirtualDevice());
				networkInterface.put("vrf", ni.getVrfInstance());
				networkInterface.put("enabled", ni.isEnabled());
				networkInterface.put("level3", ni.isLevel3());
				List<Object> ips = new ArrayList<>();
				for (Network4Address address : ni.getIp4Addresses()) {
					Map<Object, Object> ip = new HashMap<>();
					ip.put("ip", address.getIp());
					ip.put("mask", Integer.toString(address.getPrefixLength()));
					ip.put("usage", address.getAddressUsage().toString());
					ips.add(ProxyHashMap.from(ip));
				}
				for (Network6Address address : ni.getIp6Addresses()) {
					Map<Object, Object> ip = new HashMap<>();
					ip.put("ipv6", address.getIp());
					ip.put("mask", Integer.toString(address.getPrefixLength()));
					ip.put("usage", address.getAddressUsage().toString());
					ips.add(ProxyHashMap.from(ip));
				}
				networkInterface.put("ip", ProxyArray.fromList(ips));
				networkInterfaces.add(ProxyHashMap.from(networkInterface));
			}
			return ProxyArray.fromList(networkInterfaces);
		}
		else {
			String jsItem = pythonicToJavascriptic(item);
			for (AttributeDefinition definition : driver.getAttributes()) {
				if ((definition.getName().equals(jsItem) || definition.getTitle().equals(jsItem)) && definition.isCheckable()) {
					if (definition.getLevel() == AttributeLevel.CONFIG && device.getLastConfig() != null) {
						for (ConfigAttribute attribute : device.getLastConfig().getAttributes()) {
							if (attribute.getName().equals(jsItem)) {
								return attribute.getData();
							}
						}
					}
					else if (definition.getLevel() == AttributeLevel.DEVICE) {
						for (DeviceAttribute attribute : device.getAttributes()) {
							if (attribute.getName().equals(jsItem)) {
								return attribute.getData();
							}
						}
					}
				}
			}
			for (DiagnosticResult diagnosticResult : device.getDiagnosticResults()) {
				String diagnosticName = diagnosticResult.getDiagnosticName();
				if (diagnosticName != null && diagnosticName.equals(item)) {
					return diagnosticResult.getData();
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
	@Export
	public Object get(String item) {
		log.debug("Python request for item {} on current device.", item);
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
				.setParameter("id", id)
				.uniqueResult();
		return device;
	}

	private Device loadDevice(String name) throws HibernateException {
		Device device = (Device) session
				.createQuery("from Device d join fetch d.lastConfig where d.name = :name")
				.setParameter("name", name)
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
	@Export
	public Object get(String item, long deviceId) {
		log.debug("Python request for item {} on device {}.", item,
				deviceId);
		if (deviceId == this.device.getId()) {
			return this.get(item);
		}
		try {
			Device device = loadDevice(deviceId);
			Object result = this.getDeviceItem(device, item);
			session.evict(device);
			return result;
		}
		catch (ObjectNotFoundException e) {
			log.error("Device not found on Python get, item {}, device {}.",
					item, deviceId, e);
			this.taskLogger.warn(String.format("Unable to find the device %d.", deviceId));
		}
		catch (Exception e) {
			log.error("Error on Python get, item {}, device {}.", item,
					deviceId, e);
			this.taskLogger.warn(String.format("Unable to get data %s for device %d.", item, deviceId));
		}
		return null;
	}

	@Export
	public Object get(String item, String deviceName) {
		log.debug("Python request for item {} on device named {}.", item,
				deviceName);
		try {
			if (device.getName().equals(deviceName)) {
				return this.get(item);
			}
			Device device = loadDevice(deviceName);
			Object result = this.getDeviceItem(device, item);
			session.evict(device);
			return result;
		}
		catch (ObjectNotFoundException e) {
			log.error("Device not found on Python get, item {}, device named {}.",
					item, deviceName, e);
			this.taskLogger.warn(String.format("Unable to find the device named %s.", deviceName));
		}
		catch (Exception e) {
			log.error("Error on Python get, item {}, device named {}.", item,
					deviceName, e);
			this.taskLogger.warn(String.format("Unable to get data %s for device named %s.", item, deviceName));
		}
		return null;
	}

	@Export
	public void debug(String message) {
		taskLogger.debug(message);
	}

	/**
	 * Resolve an hostname or an IP (reverse).
	 *
	 * @param host the host
	 * @return the object
	 */
	@Export
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
		Map<Object, Object> result = new HashMap<>();
		result.put("name", name);
		result.put("address", address);
		return ProxyHashMap.from(result);
	}
}
