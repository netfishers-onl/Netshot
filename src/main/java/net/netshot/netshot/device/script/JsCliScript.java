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

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.Value;
import org.hibernate.Session;

import com.fasterxml.jackson.annotation.JsonView;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.Device.InvalidCredentialsException;
import net.netshot.netshot.device.Device.MissingDeviceDriverException;
import net.netshot.netshot.device.DeviceDriver;
import net.netshot.netshot.device.DeviceDriver.DriverProtocol;
import net.netshot.netshot.device.access.Cli;
import net.netshot.netshot.device.access.Snmp;
import net.netshot.netshot.device.credentials.DeviceCliAccount;
import net.netshot.netshot.device.credentials.DeviceCredentialSet;
import net.netshot.netshot.device.credentials.DeviceSnmpCommunity;
import net.netshot.netshot.device.script.helper.JsCliHelper;
import net.netshot.netshot.device.script.helper.JsCliScriptOptions;
import net.netshot.netshot.device.script.helper.JsDeviceHelper;
import net.netshot.netshot.device.script.helper.JsSnmpHelper;
import net.netshot.netshot.rest.RestViews.DefaultView;
import net.netshot.netshot.work.TaskLogger;

/**
 * A JavaScript-based script to execute on a device.
 * @author sylvain.cadilhac
 *
 */
@Slf4j
public class JsCliScript extends CliScript {

	public enum UserInputType {
		STRING,
	}

	/**
	 * Definition of user input data.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class UserInputDefinition {
		@Getter(onMethod = @__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String name;

		@Getter(onMethod = @__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private UserInputType type;

		@Getter(onMethod = @__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String label;

		@Getter(onMethod = @__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String description;

		public UserInputDefinition(String name) {
			this.name = name;
			this.label = StringUtils.capitalize(name);
			this.type = UserInputType.STRING;
		}

		public UserInputDefinition(String name, UserInputType type, String label, String description) {
			this.name = name;
			this.label = label;
			this.description = description;
			this.type = type;
		}
	}


	@Getter
	private String driverName;

	// The JavaScript code to execute
	@Getter
	private String code;

	@Getter
	@Setter
	private Map<String, String> userInputValues;

	/**
	 * Instantiates a JS-based script.
	 * @param driverName = The name of the driver
	 * @param code = The JavaScript code
	 * @param logger = The task logger
	 */
	public JsCliScript(String driverName, String code, TaskLogger logger) {
		super(logger);
		this.driverName = driverName;
		this.code = code;
	}

	@Override
	protected void run(Session session, Device device, Cli cli, Snmp snmp, DriverProtocol protocol, DeviceCredentialSet account)
		throws InvalidCredentialsException, IOException, UnsupportedOperationException, MissingDeviceDriverException {
		JsCliHelper jsCliHelper = null;
		JsSnmpHelper jsSnmpHelper = null;
		switch (protocol) {
			case SNMP:
				jsSnmpHelper = new JsSnmpHelper(snmp, (DeviceSnmpCommunity) account, this.taskLogger);
				break;
			case TELNET:
			case SSH:
			default:
				jsCliHelper = new JsCliHelper(cli, (DeviceCliAccount) account, this.taskLogger);
				break;
		}
		DeviceDriver driver = device.getDeviceDriver();
		try (Context context = driver.getContext()) {
			driver.loadCode(context);
			context.eval("js", code);
			JsCliScriptOptions options = new JsCliScriptOptions(jsCliHelper, jsSnmpHelper, this.taskLogger);
			options.setDeviceHelper(new JsDeviceHelper(device, cli, null, this.taskLogger, false));
			options.setUserInputs(this.userInputValues);
			context
				.getBindings("js")
				.getMember("_connect")
				.execute("run", protocol.value(), options);
		}
		catch (PolyglotException e) {
			log.error("Error while running script using driver {}.", driver.getName(), e);
			this.taskLogger.error("Error while running script  using driver {}: '{}'.",
				driver.getName(), e.getMessage());
			if (e.getMessage().contains("Authentication failed")) {
				throw new InvalidCredentialsException("Authentication failed");
			}
			else {
				throw e;
			}
		}
		catch (UnsupportedOperationException e) {
			log.error("No such method while using driver {}.", driver.getName(), e);
			this.taskLogger.error("No such method while using driver {} to execute script: '{}'.",
				driver.getName(), e.getMessage());
			throw e;
		}
	}

	public void validateUserInputs() throws IllegalArgumentException {
		final DeviceDriver driver = DeviceDriver.getDriverByName(this.driverName);
		try (Context context = driver.getContext()) {
			driver.loadCode(context);
			context.eval("js", this.code);
			JsCliScriptOptions options = new JsCliScriptOptions(null, null, null);
			options.setUserInputs(this.userInputValues);
			context
				.getBindings("js")
				.getMember("_validate")
				.execute("runInputs", options);
		}
		catch (PolyglotException e) {
			log.error("Error while validating user inputs.", e);
			throw new IllegalArgumentException(e.getMessage());
		}
		catch (IOException e) {
			log.error("Error while validating user inputs.", e);
			throw new IllegalArgumentException("Error while validating user inputs", e);
		}

	}

	public Map<String, UserInputDefinition> extractInputDefinitions() throws IllegalArgumentException {
		final Map<String, UserInputDefinition> definitions = new HashMap<>();
		final DeviceDriver driver = DeviceDriver.getDriverByName(this.driverName);
		if (driver == null) {
			return definitions;
		}
		try (Context context = driver.getContext()) {
			driver.loadCode(context);
			context.eval("js", this.code);
			JsCliScriptOptions options = new JsCliScriptOptions(null, null, null);
			options.setUserInputs(this.userInputValues);
			context
				.getBindings("js")
				.getMember("_validate")
				.execute("runScript", options);

			final Value input = context.getBindings("js").getMember("Input");
			if (input == null) {
				log.debug("No 'Input' object was found in the script");
				return definitions;
			}
			if (!input.hasMembers()) {
				throw new IllegalArgumentException("Invalid 'Input' object in the script");
			}
			for (String name : input.getMemberKeys()) {
				final Value member = input.getMember(name);
				final UserInputDefinition definition = new UserInputDefinition(name);
				if (member == null || !member.hasMembers()) {
					throw new IllegalArgumentException(String.format("Invalid input definition '%s'", name));
				}
				final Value descriptionValue = member.getMember("description");
				if (descriptionValue != null) {
					if (!descriptionValue.isString()) {
						throw new IllegalArgumentException(String.format("Invalid 'description' type in definition of '%s'", name));
					}
					definition.setDescription(descriptionValue.asString());
				}
				final Value labelValue = member.getMember("label");
				if (labelValue != null) {
					if (!labelValue.isString()) {
						throw new IllegalArgumentException(String.format("Invalid 'label' type in definition of '%s'", name));
					}
					definition.setLabel(labelValue.asString());
				}
				definitions.put(name, definition);
			}
		}
		catch (PolyglotException e) {
			log.error("Error while validating script.", e);
			throw new IllegalArgumentException(e.getMessage());
		}
		catch (IOException e) {
			log.error("Error while validating script.", e);
			throw new IllegalArgumentException("Error while validating script", e);
		}
		return definitions;
	}
}
