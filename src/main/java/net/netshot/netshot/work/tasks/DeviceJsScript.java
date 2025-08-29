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
package net.netshot.netshot.work.tasks;

import java.util.Map;

import org.hibernate.annotations.NaturalId;

import com.fasterxml.jackson.annotation.JsonView;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Transient;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.Getter;
import lombok.Setter;
import net.netshot.netshot.device.DeviceDriver;
import net.netshot.netshot.device.script.JsCliScript;
import net.netshot.netshot.device.script.JsCliScript.UserInputDefinition;
import net.netshot.netshot.rest.RestViews.DefaultView;

@Entity
@XmlRootElement
@XmlAccessorType(XmlAccessType.NONE)
public class DeviceJsScript {

	@Getter(onMethod = @__({
		@Id, @GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlAttribute, @JsonView(DefaultView.class)
	}))
	@Setter
	private long id;

	@Getter(onMethod = @__({
		@NaturalId,
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String name;

	@Getter(onMethod = @__({
		@Column(length = 10000000),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String script;

	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String deviceDriver;

	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String author;

	@Getter(onMethod = @__({
		@Transient,
		@XmlElement, @JsonView(DefaultView.class)
	}))
	private Map<String, UserInputDefinition> userInputDefinitions;

	protected DeviceJsScript() {

	}

	public DeviceJsScript(String name, String deviceDriver, String script, String author) {
		this.name = name;
		this.script = script;
		this.deviceDriver = deviceDriver;
		this.author = author;
	}

	@Transient
	@XmlElement
	@JsonView(DefaultView.class)
	public String getRealDeviceType() {
		DeviceDriver driver = DeviceDriver.getDriverByName(this.deviceDriver);
		if (driver == null) {
			return "Unknwon driver";
		}
		return driver.getDescription();
	}

	/**
	 * Actually populate user input definitions by evaluating the script and extract Input variable.
	 * @throws IllegalAccessException
	 */
	public void extractUserInputDefinitions() throws IllegalArgumentException {
		if (this.userInputDefinitions == null) {
			final JsCliScript jsScript = new JsCliScript(this.deviceDriver, this.script, false);
			this.userInputDefinitions = jsScript.extractInputDefinitions();
		}
	}

	/**
	 * Validate passed user inputs against input definitions.
	 * @param userInputs = the data to validate
	 * @throws IllegalArgumentException
	 */
	public void validateUserInputs(Map<String, String> userInputs) throws IllegalArgumentException {
		final JsCliScript jsScript = new JsCliScript(this.deviceDriver, this.script, false);
		jsScript.setUserInputValues(userInputs);
		jsScript.validateUserInputs();
	}

	@Override
	public String toString() {
		return "Device JavaScript script " + id + " (name '" + name + "', author '" + author + "')";
	}
}
