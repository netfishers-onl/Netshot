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
package onl.netfishers.netshot.device.script;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.Date;
import java.util.Map;
import java.util.regex.Matcher;

import org.apache.poi.openxml4j.exceptions.InvalidOperationException;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.PolyglotException;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.Device.InvalidCredentialsException;
import onl.netfishers.netshot.device.Device.MissingDeviceDriverException;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.DeviceDriver.DriverProtocol;
import onl.netfishers.netshot.device.access.Cli;
import onl.netfishers.netshot.device.access.Snmp;
import onl.netfishers.netshot.device.attribute.AttributeDefinition;
import onl.netfishers.netshot.device.attribute.ConfigAttribute;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeLevel;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
import onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity;
import onl.netfishers.netshot.device.script.helper.JsCliHelper;
import onl.netfishers.netshot.device.script.helper.JsCliScriptOptions;
import onl.netfishers.netshot.device.script.helper.JsConfigHelper;
import onl.netfishers.netshot.device.script.helper.JsDeviceHelper;
import onl.netfishers.netshot.device.script.helper.JsSnmpHelper;
import onl.netfishers.netshot.work.TaskLogger;

public class SnapshotCliScript extends CliScript {
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(SnapshotCliScript.class);

	public SnapshotCliScript(boolean cliLogging) {
		super(cliLogging);
	}

	@Override
	protected void run(Session session, Device device, Cli cli, Snmp snmp, DriverProtocol protocol, DeviceCredentialSet account)
			throws InvalidCredentialsException, IOException, InvalidOperationException, MissingDeviceDriverException {

		TaskLogger taskLogger = this.getJsLogger();
		JsCliHelper jsCliHelper = null;
		JsSnmpHelper jsSnmpHelper = null;
		switch (protocol) {
		case SNMP:
			jsSnmpHelper = new JsSnmpHelper(snmp, (DeviceSnmpCommunity)account, taskLogger);
			break;
		case TELNET:
		case SSH:
			jsCliHelper = new JsCliHelper(cli, (DeviceCliAccount)account, taskLogger, this.getCliLogger());
			break;
		}

		DeviceDriver driver = device.getDeviceDriver();
		try {
			Context context = driver.getContext();
			JsCliScriptOptions options = new JsCliScriptOptions(jsCliHelper, jsSnmpHelper);
			options.setDevice(new JsDeviceHelper(device, session, taskLogger, false));
			Config config = new Config(device);
			options.setConfigHelper(new JsConfigHelper(device, config, cli, taskLogger));
			context.getBindings("js").getMember("_connect").execute("snapshot", protocol.value(), options, taskLogger);
			boolean different = false;
			try {
				Config lastConfig = Database.unproxy(device.getLastConfig());
				if (lastConfig == null) {
					different = true;
				}
				else {
					Map<String, ConfigAttribute> oldAttributes = lastConfig.getAttributeMap();
					Map<String, ConfigAttribute> newAttributes = config.getAttributeMap();
					for (AttributeDefinition definition : driver.getAttributes()) {
						if (definition.getLevel() != AttributeLevel.CONFIG) {
							continue;
						}
						ConfigAttribute oldAttribute = oldAttributes.get(definition.getName());
						ConfigAttribute newAttribute = newAttributes.get(definition.getName());
						if (oldAttribute != null) {
							if (!oldAttribute.equals(newAttribute)) {
								different = true;
								break;
							}
						}
						else if (newAttribute != null) {
							different = true;
							break;
						}
					}
				}
			}
			catch (Exception e) {
				logger.error("Error while comparing old and new configuration. Will save the new configuration.", e);
			}
			if (different) {
				device.setLastConfig(config);
				device.getConfigs().add(config);
			}
			else {
				taskLogger.info("The configuration hasn't changed. Not storing a new one in the DB.");
			}
			

			String path = Netshot.getConfig("netshot.snapshots.dump");
			if (path != null) {
				try {
					BufferedWriter output = new BufferedWriter(
							new FileWriter(Paths.get(path, device.getName()).normalize().toFile()));
					Map<String, ConfigAttribute> newAttributes = config.getAttributeMap();
					for (AttributeDefinition definition : driver.getAttributes()) {
						if (!definition.isDump()) {
							continue;
						}
						String preText = definition.getPreDump();
						if (preText != null) {
							preText = preText.replaceAll("%when%",
									Matcher.quoteReplacement(new Date().toString()));
							output.write(preText);
							output.write("\r\n");
						}
						ConfigAttribute newAttribute = newAttributes.get(definition.getName());
						if (newAttribute != null) {
							String text = newAttribute.getAsText();
							if (text != null) {
								if (definition.getPreLineDump() != null || definition.getPostLineDump() != null) {
									String[] lines = text.split("\\r?\\n");
									for (String line : lines) {
										if (definition.getPreLineDump() != null) {
											output.write(definition.getPreLineDump());
										}
										output.write(line);
										if (definition.getPostLineDump() != null) {
											output.write(definition.getPostLineDump());
										}
										output.write("\r\n");
									}
								}
								else {
									output.write(text);
								}
							}
						}
						String postText = definition.getPostDump();
						if (postText != null) {
							postText = postText.replaceAll("%when%",
									Matcher.quoteReplacement(new Date().toString()));
							output.write(postText);
							output.write("\r\n");
						}
					}
					output.close();
					taskLogger.info("The configuration has been saved as a file in the dump folder.");
				}
				catch (Exception e) {
					logger.warn("Couldn't write the configuration into file.", e);
					taskLogger.warn("Unable to write the configuration as a file.");
				}
			}
		}
		catch (PolyglotException e) {
			logger.error("Error while running snapshot using driver {}.", driver.getName(), e);
			taskLogger.error(String.format("Error while running snapshot using driver %s: '%s'.",
					driver.getName(), e.getMessage()));
			if (e.getMessage().contains("Authentication failed")) {
				throw new InvalidCredentialsException("Authentication failed");
			}
			else {
				throw e;
			}
		}
		catch (InvalidOperationException e) {
			logger.error("No such method 'snapshot' while using driver {}.", driver.getName(), e);
			taskLogger.error(String.format("No such method 'snapshot' while using driver %s to take snapshot: '%s'.",
					driver.getName(), e.getMessage()));
			throw e;
		}
	}

}
