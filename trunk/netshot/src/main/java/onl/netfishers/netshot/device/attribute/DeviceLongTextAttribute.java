/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.device.attribute;

import javax.persistence.CascadeType;
import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToOne;
import javax.persistence.Transient;

import onl.netfishers.netshot.device.Device;

@Entity @DiscriminatorValue("T")
public class DeviceLongTextAttribute extends DeviceAttribute {

	private LongTextConfiguration longText;
	
	protected DeviceLongTextAttribute() {
	}
	
	public DeviceLongTextAttribute(Device device, String name, String value) {
		super(device, name);
		this.longText = new LongTextConfiguration(value);
	}

	@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	public LongTextConfiguration getLongText() {
		return longText;
	}

	public void setLongText(LongTextConfiguration value) {
		this.longText = value;
	}

	@Override
	@Transient
	public Object getData() {
		if (getLongText() == null) {
			return null;
		}
		return getLongText().getText();
 	}
	
}
