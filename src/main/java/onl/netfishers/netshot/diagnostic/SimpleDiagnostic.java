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
package onl.netfishers.netshot.diagnostic;

import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.HostAccess.Export;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeType;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * This is a simple diagnostic: runs a CLI command in a CLI mode, and optionally
 * transforms the result using a regular expression.
 * 
 * @author sylvain.cadilhac
 */
@Entity
@XmlRootElement
@XmlAccessorType(value = XmlAccessType.NONE)
public class SimpleDiagnostic extends Diagnostic {

	/**
	 * A simple object to store command and CLI mode, to be passed to Javascript for execution.
	 */
	static public class JsSimpleDiagnostic {
		private String mode;
		private String command;

		public JsSimpleDiagnostic(String mode, String command) {
			this.mode = mode;
			this.command = command;
		}

		@Export
		public String getCommand() {
			return command;
		}

		public void setCommand(String command) {
			this.command = command;
		}

		@Export
		public String getMode() {
			return mode;
		}

		public void setMode(String mode) {
			this.mode = mode;
		}
	}

	/**
	 * Instantiates a new SimpleDiagnostic. For Hibernate.
	 */
	protected SimpleDiagnostic() {
	}

	/**
	 * Instantiates a new diagnostic.
	 * 
	 * @param name
	 *                              The name
	 * @param enabled
	 *                              True to enable the diagnostic
	 * @param targetGroup
	 *                              The group of devices the diagnostic applies to
	 * @param resultType
	 *                              The type of result expected by this diagnostic
	 * @param cliMode
	 *                              The CLI mode
	 * @param command
	 *                              The CLI command to issue
	 * @param modifierPattern
	 *                              The pattern to match
	 * @param modifierReplacement
	 *                              The replacement script if the pattern is matched
	 */
	public SimpleDiagnostic(String name, boolean enabled, DeviceGroup targetGroup, AttributeType resultType,
			String deviceDriver, String cliMode, String command, String modifierPattern, String modifierReplacement) {
		super(name, enabled, targetGroup, resultType);
		this.deviceDriver = deviceDriver;
		this.cliMode = cliMode;
		this.command = command;
		this.modifierPattern = modifierPattern;
		this.modifierReplacement = modifierReplacement;
	}

	/**
	 * The type of device this diagnostic applies to.
	 */
	private String deviceDriver;

	/**
	 * The CLI mode to run the command in.
	 */
	private String cliMode;

	/**
	 * The CLI command to run.
	 */
	private String command;

	/**
	 * The pattern to search for in the result string.
	 */
	private String modifierPattern;

	/**
	 * The replacement string (to replace the modifierPattern with). Also supports
	 * regular expression backreferences.
	 */
	private String modifierReplacement;

	/**
	 * Gets the device driver this diagnostic applies to.
	 * 
	 * @return the device driver.
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getDeviceDriver() {
		return deviceDriver;
	}

	/**
	 * Sets the device driver
	 * 
	 * @param deviceDriver
	 *                       the new device driver
	 */
	public void setDeviceDriver(String deviceDriver) {
		this.deviceDriver = deviceDriver;
	}

	/**
	 * Gets the cli mode.
	 *
	 * @return the cli mode
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getCliMode() {
		return cliMode;
	}

	/**
	 * Sets the cli mode.
	 *
	 * @param cliMode
	 *                  the new cli mode
	 */
	public void setCliMode(String cliMode) {
		this.cliMode = cliMode;
	}

	/**
	 * Gets the command.
	 *
	 * @return the command
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getCommand() {
		return command;
	}

	/**
	 * Sets the command.
	 *
	 * @param command
	 *                  the new command
	 */
	public void setCommand(String command) {
		this.command = command;
	}

	/**
	 * Gets the modifier pattern.
	 *
	 * @return the modifier pattern
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getModifierPattern() {
		return modifierPattern;
	}

	/**
	 * Sets the modifier pattern.
	 *
	 * @param modifierPattern
	 *                          the new modifier pattern
	 */
	public void setModifierPattern(String modifierPattern) {
		this.modifierPattern = modifierPattern;
	}

	/**
	 * Gets the modifier replacement.
	 *
	 * @return the modifier replacement
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getModifierReplacement() {
		return modifierReplacement;
	}

	/**
	 * Sets the modifier replacement.
	 *
	 * @param modifierReplacement
	 *                              the new modifier replacement
	 */
	public void setModifierReplacement(String modifierReplacement) {
		this.modifierReplacement = modifierReplacement;
	}

	/**
	 * Gets the description of the device driver. To be sent along with the
	 * diagnostic.
	 * 
	 * @return the description of the device driver
	 */
	@Transient
	@XmlElement @JsonView(DefaultView.class)
	public String getDeviceDriverDescription() {
		if ("".equals(deviceDriver)) {
			return "";
		}
		try {
			DeviceDriver d = DeviceDriver.getDriverByName(deviceDriver);
			return d.getDescription();
		}
		catch (Exception e) {
			return "Unknown driver";
		}
	}

	@Transient
	@Override
	public void addResultToDevice(Device device, String value) {
		String newValue = value;
		if (this.getModifierPattern() != null) {
			newValue = value.replaceAll(this.getModifierPattern(), this.getModifierReplacement());
		}
		super.addResultToDevice(device, newValue);
	}

	@Override
	public Value getJsObject(Device device, Context context) {
		if (!device.getDriver().equals(this.getDeviceDriver())) {
			return null;
		}
		return Value.asValue(new JsSimpleDiagnostic(this.cliMode, this.command));
	}
	
}
