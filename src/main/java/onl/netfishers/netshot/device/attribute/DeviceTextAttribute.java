/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.device.attribute;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.device.Device;

@Entity @DiscriminatorValue("S")
public class DeviceTextAttribute extends DeviceAttribute {

	private String text;

	protected DeviceTextAttribute() {
	}

	public DeviceTextAttribute(Device device, String name, String value) {
		super(device, name);
		this.text = value;
	}

	@XmlElement
	public String getText() {
		return text;
	}

	public void setText(String value) {
		this.text = value;
	}

	@Override
	@Transient
	public Object getData() {
		return getText();
	}

}
