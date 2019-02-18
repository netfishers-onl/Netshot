/**
 * Copyright 2013-2019 Sylvain Cadilhac (NetFishers)
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
package onl.netfishers.netshot.device.script.helper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.attribute.AttributeDefinition;
import onl.netfishers.netshot.device.attribute.ConfigBinaryAttribute;
import onl.netfishers.netshot.device.attribute.ConfigLongTextAttribute;
import onl.netfishers.netshot.device.attribute.ConfigNumericAttribute;
import onl.netfishers.netshot.device.attribute.ConfigTextAttribute;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeLevel;
import onl.netfishers.netshot.work.TaskLogger;

/**
 * Class used to control a device config from JavaScript.
 * @author sylvain.cadilhac
 *
 */
public class JsConfigHelper {
	private static Logger logger = LoggerFactory.getLogger(JsConfigHelper.class);
	
	private final Device device;
	private Config config;
	private TaskLogger taskLogger;
	
	public JsConfigHelper(Device device, Config config, TaskLogger taskLogger) {
		this.device = device;
		this.config = config;
		this.taskLogger = taskLogger;
	}
	
	public void set(String key, Double value) {
		if (value == null) {
			return;
		}
		try {
			DeviceDriver driver = device.getDeviceDriver();
			for (AttributeDefinition attribute : driver.getAttributes()) {
				if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
					switch (attribute.getType()) {
					case NUMERIC:
						config.addAttribute(new ConfigNumericAttribute(config, key, value));
						break;
					default:
					}
					break;
				}
			}
		}
		catch (Exception e) {
			logger.warn("Error during snapshot while setting config attribute key '{}'.", key);
			
		}
	}
	
	public void set(String key, Boolean value) {
		if (value == null) {
			return;
		}
		try {
			DeviceDriver driver = device.getDeviceDriver();
			for (AttributeDefinition attribute : driver.getAttributes()) {
				if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
					switch (attribute.getType()) {
					case BINARY:
						config.addAttribute(new ConfigBinaryAttribute(config, key, value));
						break;
					default:
					}
					break;
				}
			}
		}
		catch (Exception e) {
			logger.warn("Error during snapshot while setting config attribute key '{}'.", key);
			taskLogger.error(String.format("Can't set device attribute %s: %s", key, e.getMessage()));
		}
	}
	
	public void set(String key, Object value) {
		if (value == null) {
			return;
		}
		try {
			DeviceDriver driver = device.getDeviceDriver();
			if ("author".equals(key)) {
				config.setAuthor((String) value);
			}
			else {
				for (AttributeDefinition attribute : driver.getAttributes()) {
					if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
						switch (attribute.getType()) {
						case LONGTEXT:
							config.addAttribute(new ConfigLongTextAttribute(config, key, (String) value));
							break;
						case TEXT:
							config.addAttribute(new ConfigTextAttribute(config, key, (String) value));
							break;
						default:
							break;
						}
						break;
					}
				}
			}
		}
		catch (Exception e) {
			logger.warn("Error during snapshot while setting config attribute key '{}'.", key);
			taskLogger.error(String.format("Can't set device attribute %s: %s", key, e.getMessage()));
		}
	}
	
}