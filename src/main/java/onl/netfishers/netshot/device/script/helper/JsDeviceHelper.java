package onl.netfishers.netshot.device.script.helper;

import javax.script.Bindings;
import javax.script.ScriptEngine;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeLevel;
import onl.netfishers.netshot.work.TaskLogger;
import onl.netfishers.netshot.device.attribute.DeviceBinaryAttribute;
import onl.netfishers.netshot.device.attribute.DeviceLongTextAttribute;
import onl.netfishers.netshot.device.attribute.DeviceNumericAttribute;
import onl.netfishers.netshot.device.attribute.DeviceTextAttribute;

/**
 * Class used to access and set data on a device object from JavaScript.
 * @author sylvain.cadilhac
 *
 */
public class JsDeviceHelper {
	
	private static Logger logger = LoggerFactory.getLogger(JsDeviceHelper.class);
	
	public static Bindings toBindings(Object o, String key) throws IllegalArgumentException {
		Object v = toObject(o, key);
		if (!(v instanceof Bindings)) {
			throw new IllegalArgumentException(String.format("The value of %s is not a Javascript object.", key));
		}
		return (Bindings) v;
	}

	public static Boolean toBoolean(Object o, String key) throws IllegalArgumentException {
		return toBoolean(o, key, null);
	}

	public static Boolean toBoolean(Object o, String key, Boolean defaultValue) throws IllegalArgumentException {
		Object v = toObject(o, key, defaultValue);
		if (!(v instanceof Boolean)) {
			throw new IllegalArgumentException(String.format("The value of %s is not a boolean.", key));
		}
		return (Boolean) v;
	}

	public static Integer toInteger(Object o, String key) throws IllegalArgumentException {
		return toInteger(o, key, null);
	}

	public static Integer toInteger(Object o, String key, Integer defaultValue) throws IllegalArgumentException {
		Object v = toObject(o, key, defaultValue);
		if (!(v instanceof Integer)) {
			throw new IllegalArgumentException(String.format("The value of %s is not an integer.", key));
		}
		return (Integer) v;
	}

	public static Object toObject(Object o, String key) throws IllegalArgumentException {
		return toObject(o, key, null);
	}

	public static Object toObject(Object o, String key, Object defaultValue) throws IllegalArgumentException {
		if (o == null || !(o instanceof Bindings || o instanceof ScriptEngine)) {
			throw new IllegalArgumentException("Invalid object.");
		}
		Object v = null;
		if (o instanceof Bindings) {
			v = ((Bindings) o).get(key);
		}
		if (o instanceof ScriptEngine) {
			v = ((ScriptEngine) o).get(key);
		}
		if (v == null) {
			if (defaultValue == null) {
				throw new IllegalArgumentException(String.format("The key '%s' doesn't exist.", key));
			}
			else {
				return defaultValue;
			}
		}
		return v;
	}

	public static String toString(Object o, String key) throws IllegalArgumentException {
		return toString(o, key, null);
	}

	public static String toString(Object o, String key, String defaultValue) throws IllegalArgumentException {
		Object v = toObject(o, key, defaultValue);
		if (!(v instanceof String)) {
			throw new IllegalArgumentException(String.format("The value of %s is not a string.", key));
		}
		String s = (String) v;
		if (s.trim().equals("")) {
			throw new IllegalArgumentException(String.format("The value of %s cannot be empty.", key));
		}
		return s;
	}
	
	private Device device;
	private TaskLogger taskLogger;
	
	public JsDeviceHelper(Device device, TaskLogger taskLogger) throws MissingDeviceDriverException {
		this.device = device;
		this.taskLogger = taskLogger;
	}
	
	public void add(String key, Bindings data) {
		if (data == null) {
			return;
		}
		try {
			if ("module".equals(key)) {
				Module module = new Module(
						(String) data.getOrDefault("slot", ""),
						(String) data.getOrDefault("partNumber", ""),
						(String) data.getOrDefault("serialNumber", ""),
						device
				);
				device.getModules().add(module);
			}
			else if ("networkInterface".equals(key)) {
				Object enabled = data.getOrDefault("enabled", true);
				enabled = (enabled == null ? false : enabled);
				Object level3 = data.getOrDefault("level3", true);
				level3 = (level3 == null ? false : level3);
				NetworkInterface networkInterface = new NetworkInterface(
						device,
						(String) data.get("name"),
						(String) data.getOrDefault("virtualDevice", ""),
						(String) data.getOrDefault("vrf", ""),
						(Boolean) enabled,
						(Boolean) level3,
						(String) data.getOrDefault("description", "")
				);
				networkInterface.setPhysicalAddress(new PhysicalAddress((String) data.getOrDefault("mac", "0000.0000.0000")));
				Bindings ipAddresses = (Bindings) (data.get("ip"));
				if (ipAddresses != null) {
					for (Object ipAddress : ipAddresses.values()) {
						Bindings ip = (Bindings) ipAddress;
						NetworkAddress address = null;
						if (ip.get("ipv6") != null) {
							address = new Network6Address((String) ip.get("ipv6"), ((Number) ip.get("mask")).intValue());
						}
						else if (ip.get("mask") instanceof Number) {
							address = new Network4Address((String) ip.get("ip"), ((Number) ip.get("mask")).intValue());
						}
						else {
							address = new Network4Address((String) ip.get("ip"), (String) ip.get("mask"));
						}
						Object usage = ip.get("usage");
						if (usage != null) {
							address.setAddressUsage(AddressUsage.valueOf((String) usage));
						}
						networkInterface.addIpAddress(address);
					}
				}
				
				device.getNetworkInterfaces().add(networkInterface);
			}
		}
		catch (Exception e) {
			logger.warn("Error during snapshot while adding device attribute key '{}'.", key, e);
			taskLogger.error(String.format("Can't add device attribute %s: %s", key, e.getMessage()));
		}
	}
	
	public void add(String key, String value) {
		if (value == null) {
			return;
		}
		try {
			if ("vrf".equals(key)) {
				device.addVrfInstance(value);
			}
			else if ("virtualDevice".equals(key)) {
				device.addVirtualDevice(value);
			}
		}
		catch (Exception e) {
			logger.warn("Error during snapshot while adding device attribute key '{}'.", key, e);
			taskLogger.error(String.format("Can't add device attribute %s: %s", key, e.getMessage()));
		}
	}
	
	public void reset() {
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

	public void set(String key, Boolean value) {
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
			logger.warn("Error during snapshot while setting device attribute key '{}'.", key);
			taskLogger.error(String.format("Can't add device attribute %s: %s", key, e.getMessage()));
		}
	}
	
	
	public void set(String key, Double value) {
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
			logger.warn("Error during snapshot while setting device attribute key '{}'.", key);
			taskLogger.error(String.format("Can't add device attribute %s: %s", key, e.getMessage()));
		}
	}
	
	public void set(String key, String value) {
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
			else if ("softwareVersion".equals(key)) {
				device.setSoftwareVersion(value);
			}
			else if ("serialNumber".equals(key)) {
				device.setSerialNumber(value);
			}
			else if ("comments".equals(key)) {
				device.setComments(value);
			}
			else if ("networkClass".equals(key)) {
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
			logger.warn("Error during snapshot while setting device attribute key '{}'.", key);
			taskLogger.error(String.format("Can't add device attribute %s: %s", key, e.getMessage()));
		}
	}
	
}