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
package net.netshot.netshot.device.script;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.Date;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;

import org.apache.poi.openxml4j.exceptions.InvalidOperationException;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.PolyglotException;
import org.hibernate.HibernateException;
import org.hibernate.Session;

import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.database.Database;
import net.netshot.netshot.Netshot;
import net.netshot.netshot.device.Config;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.Device.InvalidCredentialsException;
import net.netshot.netshot.device.Device.MissingDeviceDriverException;
import net.netshot.netshot.device.DeviceDriver;
import net.netshot.netshot.device.DeviceDriver.DriverProtocol;
import net.netshot.netshot.device.access.Cli;
import net.netshot.netshot.device.access.Snmp;
import net.netshot.netshot.device.attribute.AttributeDefinition;
import net.netshot.netshot.device.attribute.ConfigAttribute;
import net.netshot.netshot.device.attribute.AttributeDefinition.AttributeLevel;
import net.netshot.netshot.device.credentials.DeviceCliAccount;
import net.netshot.netshot.device.credentials.DeviceCredentialSet;
import net.netshot.netshot.device.credentials.DeviceSnmpCommunity;
import net.netshot.netshot.device.script.helper.JsCliHelper;
import net.netshot.netshot.device.script.helper.JsCliScriptOptions;
import net.netshot.netshot.device.script.helper.JsConfigHelper;
import net.netshot.netshot.device.script.helper.JsDeviceHelper;
import net.netshot.netshot.device.script.helper.JsSnmpHelper;
import net.netshot.netshot.work.TaskLogger;

@Slf4j
public class SnapshotCliScript extends CliScript {

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
		try (Context context = driver.getContext()) {
			driver.loadCode(context);
			JsCliScriptOptions options = new JsCliScriptOptions(jsCliHelper, jsSnmpHelper, taskLogger);
			options.setDeviceHelper(new JsDeviceHelper(device, cli, session, taskLogger, false));
			Config config = new Config(device);
			Config lastConfig = Database.unproxy(device.getLastConfig());
			options.setConfigHelper(new JsConfigHelper(device, config, lastConfig, cli, taskLogger));
			context.getBindings("js").getMember("_connect").execute("snapshot", protocol.value(), options, taskLogger);

			// Check whether the config has actually changed
			boolean different = false;
			if (lastConfig == null) {
				different = true;
			}
			else if (lastConfig.getCustomHash() == null && config.getCustomHash() == null) {
				Map<String, ConfigAttribute> oldAttributes = lastConfig.getAttributeMap();
				Map<String, ConfigAttribute> newAttributes = config.getAttributeMap();
				for (AttributeDefinition definition : driver.getAttributes()) {
					if (definition.getLevel() != AttributeLevel.CONFIG) {
						continue;
					}
					ConfigAttribute oldAttribute = oldAttributes.get(definition.getName());
					ConfigAttribute newAttribute = newAttributes.get(definition.getName());
					if (oldAttribute != null) {
						if (!oldAttribute.valueEquals(newAttribute)) {
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
			else {
				different = !Objects.equals(lastConfig.getCustomHash(), config.getCustomHash());
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
					log.warn("Couldn't write the configuration into file.", e);
					taskLogger.warn("Unable to write the configuration as a file.");
				}
			}
		}
		catch (PolyglotException e) {
			log.error("Error while running snapshot using driver {}.", driver.getName(), e);
			taskLogger.error(String.format("Error while running snapshot using driver %s: '%s'.",
					driver.getName(), e.getMessage()));
			if (e.getMessage() != null && e.getMessage().contains("Authentication failed")) {
				throw new InvalidCredentialsException("Authentication failed");
			}
			else {
				throw e;
			}
		}
		catch (InvalidOperationException e) {
			log.error("No such method 'snapshot' while using driver {}.", driver.getName(), e);
			taskLogger.error(String.format("No such method 'snapshot' while using driver %s to take snapshot: '%s'.",
					driver.getName(), e.getMessage()));
			throw e;
		}
	}

}
