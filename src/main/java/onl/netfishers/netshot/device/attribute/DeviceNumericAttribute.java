/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.device.attribute;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.device.Device;

@Entity @DiscriminatorValue("N")
public class DeviceNumericAttribute extends DeviceAttribute {

	private Double number;

	protected DeviceNumericAttribute() {
	}
	
	public DeviceNumericAttribute(Device device, String name, double value) {
		super(device, name);
		this.number = value;
	}
	
	@XmlElement
	public Double getNumber() {
		return number;
	}

	public void setNumber(Double value) {
		this.number = value;
	}

	@Override
	@Transient
	public Object getData() {
		return getNumber();
	}

}
