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
package onl.netfishers.netshot.device;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * A network device line module.
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class Module {

	/** The id. */
	private long id;

	/** The slot. */
	protected String slot;

	/** The part number. */
	protected String partNumber;

	/** The serial number. */
	protected String serialNumber;

	/** The device. */
	protected Device device;


	public Module() {

	}

	public Module(String slot, String partNumber, String serialNumber, Device device) {
		this.slot = (slot == null ? "" : slot);
		this.partNumber = (partNumber == null ? "" : partNumber);
		this.serialNumber = (serialNumber == null ? "" : serialNumber);
		this.device = device;
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public long getId() {
		return id;
	}

	/**
	 * The ID.
	 *
	 * @param id the ID
	 */
	public void setId(long id) {
		this.id = id;
	}

	/**
	 * Gets the slot.
	 *
	 * @return the slot
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getSlot() {
		return slot;
	}

	/**
	 * Sets the slot.
	 *
	 * @param slot the new slot
	 */
	public void setSlot(String slot) {
		this.slot = slot;
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
	 * Gets the serial number.
	 *
	 * @return the serial number
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getSerialNumber() {
		return serialNumber;
	}

	/**
	 * Sets the serial number.
	 *
	 * @param serialNumber the new serial number
	 */
	public void setSerialNumber(String serialNumber) {
		this.serialNumber = serialNumber;
	}

	/**
	 * Gets the device.
	 *
	 * @return the device
	 */
	@ManyToOne
	public Device getDevice() {
		return device;
	}

	/**
	 * Sets the device.
	 *
	 * @param device the new device
	 */
	public void setDevice(Device device) {
		this.device = device;
	}

}
