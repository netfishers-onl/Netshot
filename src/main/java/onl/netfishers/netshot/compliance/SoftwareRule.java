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
package onl.netfishers.netshot.compliance;

import java.util.regex.PatternSyntaxException;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.device.Module;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * A software rule defines constraints that apply to the software versions.
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class SoftwareRule implements Comparable<SoftwareRule> {

	/** The id. */
	protected long id;

	/** The priority, to determine which software rule should apply first. */
	protected double priority;

	/** The target group. */
	protected DeviceGroup targetGroup;

	/**
	 * Instantiates a new software rule.
	 */
	protected SoftwareRule() {

	}

	public SoftwareRule(double priority, DeviceGroup targetGroup,
			String driver, String family, boolean familyRegExp,
			String version, boolean versionRegExp, String partNumber,
			boolean partNumberRegExp, ConformanceLevel level) {
		this.priority = priority;
		this.targetGroup = targetGroup;
		this.driver = driver;
		this.family = family;
		this.familyRegExp = familyRegExp;
		this.version = version;
		this.versionRegExp = versionRegExp;
		this.partNumber = partNumber;
		this.partNumberRegExp = partNumberRegExp;
		this.level = level;
	}



	/**
	 * The Enum ConformanceLevel.
	 */
	public static enum ConformanceLevel {

		/** The gold. */
		GOLD,

		/** The silver. */
		SILVER,

		/** The bronze. */
		BRONZE,

		/** The unknown. */
		UNKNOWN
	}


	private String driver = null;

	/** The family. */
	private String family = "";

	/** The family is a regular expression. */
	private boolean familyRegExp = false;

	/** The version. */
	private String version = "";

	/** The version is a regular expression. */
	private boolean versionRegExp = false;

	/** The part number. */
	private String partNumber;

	/** The part number reg exp. */
	private boolean partNumberRegExp = false;

	/** The level. */
	protected ConformanceLevel level = ConformanceLevel.GOLD;

	/* (non-Javadoc)
	 * @see java.lang.Comparable#compareTo(java.lang.Object)
	 */
	@Override
	public int compareTo(SoftwareRule o) {
		return Double.compare(this.priority, o.priority);
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@XmlElement @JsonView(DefaultView.class)
	public long getId() {
		return id;
	}

	/**
	 * Sets the id.
	 *
	 * @param id the new id
	 */
	public void setId(long id) {
		this.id = id;
	}

	/**
	 * Gets the priority.
	 *
	 * @return the priority
	 */
	@XmlElement @JsonView(DefaultView.class)
	public double getPriority() {
		return priority;
	}

	/**
	 * Sets the priority.
	 *
	 * @param priority the new priority
	 */
	public void setPriority(double priority) {
		this.priority = priority;
	}

	/**
	 * Gets the target group.
	 *
	 * @return the target group
	 */
	@ManyToOne
	@XmlElement @JsonView(DefaultView.class)
	public DeviceGroup getTargetGroup() {
		return targetGroup;
	}

	/**
	 * Sets the target group.
	 *
	 * @param targetGroup the new target group
	 */
	public void setTargetGroup(DeviceGroup targetGroup) {
		this.targetGroup = targetGroup;
	}


	/**
	 * Gets the device driver.
	 *
	 * @return the device driver
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getDriver() {
		return driver;
	}
	
	public void setDriver(String driver) {
		this.driver = driver;
	}

	/**
	 * Gets the family.
	 *
	 * @return the family
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getFamily() {
		return family;
	}

	/**
	 * Sets the family.
	 *
	 * @param family the new family
	 */
	public void setFamily(String family) {
		this.family = family;
	}

	/**
	 * Gets the version.
	 *
	 * @return the version
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getVersion() {
		return version;
	}

	/**
	 * Sets the version.
	 *
	 * @param version the new version
	 */
	public void setVersion(String version) {
		this.version = version;
	}

	/**
	 * Gets the part number.
	 *
	 * @return the part number
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getPartNumber() {
		return partNumber;
	}

	/**
	 * Sets the part number.
	 *
	 * @param partNumber the new part number
	 */
	public void setPartNumber(String partNumber) {
		this.partNumber = partNumber;
	}

	/**
	 * Checks if is part number reg exp.
	 *
	 * @return true, if is part number reg exp
	 */
	@XmlElement @JsonView(DefaultView.class)
	public boolean isPartNumberRegExp() {
		return partNumberRegExp;
	}

	/**
	 * Sets the part number reg exp.
	 *
	 * @param partNumberRegExp the new part number reg exp
	 */
	public void setPartNumberRegExp(boolean partNumberRegExp) {
		this.partNumberRegExp = partNumberRegExp;
	}

	/**
	 * Gets the level.
	 *
	 * @return the level
	 */
	@XmlElement @JsonView(DefaultView.class)
	public ConformanceLevel getLevel() {
		return level;
	}

	/**
	 * Sets the level.
	 *
	 * @param level the new level
	 */
	public void setLevel(ConformanceLevel level) {
		this.level = level;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + (int) (id ^ (id >>> 32));
		return result;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		SoftwareRule other = (SoftwareRule) obj;
		return id == other.id;
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
		device.setSoftwareLevel(ConformanceLevel.UNKNOWN);
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
		if (versionRegExp) {
			try {
				if (!device.getSoftwareVersion().matches(version)) {
					return;
				}
			}
			catch (PatternSyntaxException e) {
				return;
			}
		}
		else {
			if (!version.equals("") && !device.getSoftwareVersion().equals(version)) {
				return;
			}
		}
		if (partNumber != null && !partNumber.equals("")) {
			boolean moduleMatches = false;
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
				moduleMatches = true;
				break;
			}
			if (!moduleMatches) {
				return;
			}
		}
		device.setSoftwareLevel(this.level);
	}

	@XmlElement @JsonView(DefaultView.class)
	public boolean isFamilyRegExp() {
		return familyRegExp;
	}

	public void setFamilyRegExp(boolean familyRegExp) {
		this.familyRegExp = familyRegExp;
	}

	@XmlElement @JsonView(DefaultView.class)
	public boolean isVersionRegExp() {
		return versionRegExp;
	}

	public void setVersionRegExp(boolean versionRegExp) {
		this.versionRegExp = versionRegExp;
	}

	@Override
	public String toString() {
		return "Software compliance rule " + id;
	}

}
