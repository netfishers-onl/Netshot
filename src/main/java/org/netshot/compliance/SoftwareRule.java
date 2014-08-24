/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.compliance;

import java.util.regex.PatternSyntaxException;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.netshot.device.Device;
import org.netshot.device.DeviceGroup;

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
	
	/**
	 * Instantiates a new software rule.
	 *
	 * @param priority the priority
	 * @param targetGroup the target group
	 * @param deviceClass the device class
	 * @param family the family
	 * @param familyRegExp whether the family is coded as a RegExp
	 * @param version the version
	 * @param versionRegExp whether the version is coded as a RegExp
	 * @param level the level
	 */
	public SoftwareRule(double priority, DeviceGroup targetGroup,
      Class<? extends Device> deviceClass, String family, boolean familyRegExp,
      String version, boolean versionRegExp, ConformanceLevel level) {
	  this.priority = priority;
	  this.targetGroup = targetGroup;
	  this.deviceClass = deviceClass;
	  this.family = family;
	  this.familyRegExp = familyRegExp;
	  this.version = version;
	  this.versionRegExp = versionRegExp;
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
	
	/** The device class. */
	private Class<? extends Device> deviceClass = Device.class;
	
	/** The family. */
	private String family = "";
	
	/** The family is a regular expression. */
	private boolean familyRegExp = false;

	/** The version. */
	private String version = "";
	
	/** The version is a regular expression. */
	private boolean versionRegExp = false;

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
	@GeneratedValue
	@XmlElement
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
	@XmlElement
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
	@XmlElement
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
	 * Gets the device class.
	 *
	 * @return the device class
	 */
	@XmlElement
	public Class<? extends Device> getDeviceClass() {
		return deviceClass;
	}

	/**
	 * Sets the device class.
	 *
	 * @param deviceClass the new device class
	 */
	public void setDeviceClass(Class<? extends Device> deviceClass) {
		this.deviceClass = deviceClass;
	}

	/**
	 * Gets the family.
	 *
	 * @return the family
	 */
	@XmlElement
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
	@XmlElement
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
	 * Gets the level.
	 *
	 * @return the level
	 */
	@XmlElement
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
	  if (id != other.id)
		  return false;
	  return true;
  }
	
	/**
	 * Gets the device type.
	 *
	 * @return the device type
	 */
	@Transient
	@XmlElement
	public String getDeviceType() {
		if (this.deviceClass == null) {
			return "";
		}
		try {
	    return (String) this.deviceClass.getMethod("getDeviceType").invoke(null);
    }
    catch (Exception e) {
    }
		return "";
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
		if (!deviceClass.isInstance(device)) {
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
		device.setSoftwareLevel(this.level);
	}

	@XmlElement
	public boolean isFamilyRegExp() {
		return familyRegExp;
	}

	public void setFamilyRegExp(boolean familyRegExp) {
		this.familyRegExp = familyRegExp;
	}

	@XmlElement
	public boolean isVersionRegExp() {
		return versionRegExp;
	}

	public void setVersionRegExp(boolean versionRegExp) {
		this.versionRegExp = versionRegExp;
	}
	
}
