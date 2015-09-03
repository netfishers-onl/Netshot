/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.compliance;

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

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.device.Module;

/**
 * The Class HardwareRule.
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class HardwareRule {

	/** The id. */
	private long id;

	/** The device class. */
	private String driver = null;

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
	 * Gets the device driver.
	 *
	 * @return the device driver
	 */
	@XmlElement
	public String getDriver() {
		return driver;
	}

	/**
	 * Gets the device type.
	 *
	 * @return the device type
	 */
	@Transient
	@XmlElement
	public String getDeviceType() {
		DeviceDriver deviceDriver = DeviceDriver.getDriverByName(driver);
		if (deviceDriver == null) {
			return "";
		}
		return deviceDriver.getDescription();
	}


	public void setDriver(String driver) {
		this.driver = driver;
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
