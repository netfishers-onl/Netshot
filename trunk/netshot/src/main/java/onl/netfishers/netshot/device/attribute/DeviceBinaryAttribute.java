/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.device.attribute;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.device.Device;

@Entity @DiscriminatorValue("B")
public class DeviceBinaryAttribute extends DeviceAttribute {

	private Boolean assumption;

	protected DeviceBinaryAttribute() {
	}
	
	public DeviceBinaryAttribute(Device device, String name, boolean value) {
		super(device, name);
		this.assumption = value;
	}
	
	@XmlElement
	public Boolean getAssumption() {
		return assumption;
	}

	public void setAssumption(Boolean assumption) {
		this.assumption = assumption;
	}

	@Override
	@Transient
	public Object getData() {
		return getAssumption();
	}

}
