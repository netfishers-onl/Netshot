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
package onl.netfishers.netshot.device.script.helper;

import java.io.File;

import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.HostAccess.Export;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.access.Cli;
import onl.netfishers.netshot.device.access.Ssh;
import onl.netfishers.netshot.device.attribute.AttributeDefinition;
import onl.netfishers.netshot.device.attribute.ConfigBinaryAttribute;
import onl.netfishers.netshot.device.attribute.ConfigBinaryFileAttribute;
import onl.netfishers.netshot.device.attribute.ConfigLongTextAttribute;
import onl.netfishers.netshot.device.attribute.ConfigNumericAttribute;
import onl.netfishers.netshot.device.attribute.ConfigTextAttribute;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeLevel;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeType;
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
	private Cli cli;
	
	public JsConfigHelper(Device device, Config config, Cli cli, TaskLogger taskLogger) {
		this.device = device;
		this.config = config;
		this.cli = cli;
		this.taskLogger = taskLogger;
	}

	@Export
	public void set(String key, Value value) {
		if (value == null) {
			return;
		}
		try {
			DeviceDriver driver = device.getDeviceDriver();
			for (AttributeDefinition attribute : driver.getAttributes()) {
				if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
					switch (attribute.getType()) {
					case BINARY:
						config.addAttribute(new ConfigBinaryAttribute(config, key, value.asBoolean()));
						break;
					case NUMERIC:
						config.addAttribute(new ConfigNumericAttribute(config, key, value.asDouble()));
						break;
					case LONGTEXT:
						config.addAttribute(new ConfigLongTextAttribute(config, key, value.asString()));
						break;
					case TEXT:
						config.addAttribute(new ConfigTextAttribute(config, key, value.asString()));
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

	/**
	 * Download a binary file from the device, using SCP.
	 * @param key the name of the config attribute
	 * @param method "scp" for now
	 * @param remoteFileName the file (including full path) to download from the device
	 * @param storeFileName the file name to store (null to use remoreFileName)
	 */
	@Export
	public void download(String key, String method, String remoteFileName, String storeFileName) throws Exception {
		if (remoteFileName == null) {
			return;
		}
		String storeName = storeFileName;
		if (storeName != null) {
			storeName = storeName.trim();
			if ("".equals(storeName)) {
				storeName = null;
			}
		}
		if (storeName == null) {
			try {
				storeName = (new File(remoteFileName)).getName();
				storeName = storeName.trim();
				storeName = storeName.replaceAll("[^0-9_a-zA-Z\\(\\)\\%\\-\\.]", "");
			}
			catch (Exception e) {
				// Go on
			}
		}
		if (storeName != null) {
			storeName = storeName.trim();
			if ("".equals(storeName)) {
				storeName = null;
			}
		}
		try {
			DeviceDriver driver = device.getDeviceDriver();
			if ("scp".equals(method)) {
				for (AttributeDefinition attribute : driver.getAttributes()) {
					if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
						if (AttributeType.BINARYFILE.equals(attribute.getType())) {
							if (cli instanceof Ssh) {
								ConfigBinaryFileAttribute fileAttribute = new ConfigBinaryFileAttribute(config, key, storeName);
								((Ssh) cli).scpDownload(remoteFileName, fileAttribute.getFileName().toString());
								fileAttribute.setFileSize(fileAttribute.getFileName().length());
								config.addAttribute(fileAttribute);
							}
							else {
								logger.warn("Error during snapshot: can't use SCP method with non-SSH CLI access (for attribute '{}').", key);
								taskLogger.error(String.format(
									"Can't use SCP method with non-SSH CLI access (for attribute '{}').", key));
							}
						}
						else {
							logger.warn("Error during snapshot: can't use SCP download method on non-binary-file attribute '{}'.", key);
							taskLogger.error(String.format(
								"Can't use SCP download method on attribute '%s' which is not of type binary-file.", key));
						}
						break;
					}
				}
			}
			else if ("sftp".equals(method)) {
				for (AttributeDefinition attribute : driver.getAttributes()) {
					if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
						if (AttributeType.BINARYFILE.equals(attribute.getType())) {
							if (cli instanceof Ssh) {
								ConfigBinaryFileAttribute fileAttribute = new ConfigBinaryFileAttribute(config, key, storeName);
								((Ssh) cli).sftpDownload(remoteFileName, fileAttribute.getFileName().toString());
								fileAttribute.setFileSize(fileAttribute.getFileName().length());
								config.addAttribute(fileAttribute);
							}
							else {
								logger.warn("Error during snapshot: can't use SFTP method with non-SSH CLI access (for attribute '{}').", key);
								taskLogger.error(String.format(
									"Can't use SFTP method with non-SSH CLI access (for attribute '{}').", key));
							}
						}
						else {
							logger.warn("Error during snapshot: can't use SFTP download method on non-binary-file attribute '{}'.", key);
							taskLogger.error(String.format(
								"Can't use SFTPdownload method on attribute '%s' which is not of type binary-file.", key));
						}
						break;
					}
				}
			}
			else {
				logger.warn("Invalid download method '{}' during snapshot.", method);
				taskLogger.error(String.format("Invalid download method %s", method));
			}
		}
		catch (Exception e) {
			logger.warn("Error during snapshot while downloading file for attribute key '{}'.", key);
			taskLogger.error(String.format("Error while downloading file for attribute key %s: %s", key, e.getMessage()));
			throw e;
		}
	}
	
}