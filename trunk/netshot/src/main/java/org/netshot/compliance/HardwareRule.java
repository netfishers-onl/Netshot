/*
 * Copyright Sylvain Cadilhac 2014
 */
package org.netshot.compliance;

import java.util.Date;
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
import org.netshot.device.Module;

/**
 * The Class HardwareRule.
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class HardwareRule {
	
	/** The id. */
	private long id;
	
	/** The device class. */
	private Class<? extends Device> deviceClass = Device.class;
	
	/** The target group. */
	private DeviceGroup targetGroup;
	
	/** The family. */
	private String family = "";
	
	/** The family reg exp. */
	private boolean familyRegExp = false;
	
	/** The part number. */
	private String partNumber;
	
	/** The part number reg exp. */
	private boolean partNumberRegExp = false;
	
	/** The end of sale. */
	private Date endOfSale;
	
	/** The end of life. */
	private Date endOfLife;
	
	/**
	 * Instantiates a new hardware rule.
	 */
	protected HardwareRule() {
		
	}
	
	/**
	 * Instantiates a new hardware rule.
	 *
	 * @param deviceClass the device class
	 * @param targetGroup the target group
	 * @param family the family
	 * @param familyRegExp the family reg exp
	 * @param partNumber the part number
	 * @param partNumberRegExp the part number reg exp
	 * @param endOfSale the end of sale
	 * @param endOfLife the end of life
	 */
	public HardwareRule(Class<? extends Device> deviceClass,
      DeviceGroup targetGroup, String family, boolean familyRegExp,
      String partNumber, boolean partNumberRegExp, Date endOfSale,
      Date endOfLife) {
	  this.deviceClass = deviceClass;
	  this.targetGroup = targetGroup;
	  this.family = family;
	  this.familyRegExp = familyRegExp;
	  this.partNumber = partNumber;
	  this.partNumberRegExp = partNumberRegExp;
	  this.endOfSale = endOfSale;
	  this.endOfLife = endOfLife;
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
	 * Sets the device class.
	 *
	 * @param deviceClass the new device class
	 */
	public void setDeviceClass(Class<? extends Device> deviceClass) {
		this.deviceClass = deviceClass;
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
	 * Gets the part number.
	 *
	 * @return the part number
	 */
	@XmlElement
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
	 * Gets the end of sale.
	 *
	 * @return the end of sale
	 */
	@XmlElement
	public Date getEndOfSale() {
		return endOfSale;
	}

	/**
	 * Sets the end of sale.
	 *
	 * @param endOfSale the new end of sale
	 */
	public void setEndOfSale(Date endOfSale) {
		this.endOfSale = endOfSale;
	}

	/**
	 * Gets the end of life.
	 *
	 * @return the end of life
	 */
	@XmlElement
	public Date getEndOfLife() {
		return endOfLife;
	}

	/**
	 * Sets the end of life.
	 *
	 * @param endOfLife the new end of life
	 */
	public void setEndOfLife(Date endOfLife) {
		this.endOfLife = endOfLife;
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
	 * Check.
	 *
	 * @param device the device
	 */
	public void check(Device device) {
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

	/**
	 * Checks if is family reg exp.
	 *
	 * @return true, if is family reg exp
	 */
	@XmlElement
	public boolean isFamilyRegExp() {
		return familyRegExp;
	}

	/**
	 * Sets the family reg exp.
	 *
	 * @param familyRegExp the new family reg exp
	 */
	public void setFamilyRegExp(boolean familyRegExp) {
		this.familyRegExp = familyRegExp;
	}

	/**
	 * Checks if is part number reg exp.
	 *
	 * @return true, if is part number reg exp
	 */
	@XmlElement
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
	

}
