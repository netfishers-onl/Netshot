/**
 * Copyright 2013-2024 Netshot
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
package onl.netfishers.netshot.compliance;

import java.util.Date;
import java.util.regex.PatternSyntaxException;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.device.Module;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * The Class HardwareRule.
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class HardwareRule {

	/** The id. */
	@Getter(onMethod=@__({
		@Id, @GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlAttribute, @JsonView(DefaultView.class)
	}))
	@Setter
	private long id;

	/** The device class. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String driver = null;

	/** The target group. */
	@Getter(onMethod=@__({
		@ManyToOne,
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private DeviceGroup targetGroup;

	/** The family. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String family = "";

	/** The family reg exp. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private boolean familyRegExp = false;

	/** The part number. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String partNumber;

	/** The part number reg exp. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private boolean partNumberRegExp = false;

	/** The end of sale. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Date endOfSale;

	/** The end of life. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Date endOfLife;

	/**
	 * Instantiates a new hardware rule.
	 */
	protected HardwareRule() {

	}

	public HardwareRule(String driver,
			DeviceGroup targetGroup, String family, boolean familyRegExp,
			String partNumber, boolean partNumberRegExp, Date endOfSale,
			Date endOfLife) {
		this.driver = driver;
		this.targetGroup = targetGroup;
		this.family = family;
		this.familyRegExp = familyRegExp;
		this.partNumber = partNumber;
		this.partNumberRegExp = partNumberRegExp;
		this.endOfSale = endOfSale;
		this.endOfLife = endOfLife;
	}

	/**
	 * Gets the device type.
	 *
	 * @return the device type
	 */
	@Transient
	@XmlElement @JsonView(DefaultView.class)
	public String getDeviceType() {
		DeviceDriver deviceDriver = DeviceDriver.getDriverByName(driver);
		if (deviceDriver == null) {
			return "";
		}
		return deviceDriver.getDescription();
	}

	/**
	 * Check.
	 *
	 * @param device the device
	 */
	public void check(Device device) {
		if (targetGroup != null && !targetGroup.getCachedDevices().contains(device)) {
			return;
		}
		if (driver != null && !driver.equals(device.getDriver())) {
			return;
		}
		if (familyRegExp) {
			try {
				if (!device.getFamily().matches(family)) {
					return;
				}
			}
			catch (PatternSyntaxException e) {
				return;
			}
		}
		else {
			if (!family.equals("") && !device.getFamily().equals(family)) {
				return;
			}
		}

		for (Module module : device.getModules()) {
			if (partNumberRegExp) {
				try {
					if (!module.getPartNumber().matches(partNumber)) {
						continue;
					}
				}
				catch (PatternSyntaxException e) {
					return;
				}
			}
			else {
				if (!partNumber.equals("") && !module.getPartNumber().equals(partNumber)) {
					continue;
				}
			}
			if (endOfLife != null && (device.getEolDate() == null || endOfLife.before(device.getEolDate()))) {
				device.setEolDate(endOfLife);
				device.setEolModule(module);
			}
			if (endOfSale != null && (device.getEosDate() == null || endOfSale.before(device.getEosDate()))) {
				device.setEosDate(endOfSale);
				device.setEosModule(module);
			}
		}
	}

	@Override
	public String toString() {
		return "Hardware compliance rule " + id;
	}
}
