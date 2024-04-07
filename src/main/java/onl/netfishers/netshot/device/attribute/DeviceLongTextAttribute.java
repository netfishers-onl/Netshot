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
package onl.netfishers.netshot.device.attribute;

import javax.persistence.CascadeType;
import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToOne;
import javax.persistence.Transient;

import lombok.Getter;
import lombok.Setter;
import onl.netfishers.netshot.device.Device;

@Entity @DiscriminatorValue("T")
public class DeviceLongTextAttribute extends DeviceAttribute {

	@Getter(onMethod=@__({
		@OneToOne(orphanRemoval = true, fetch = FetchType.LAZY, cascade = CascadeType.ALL)
	}))
	@Setter
	private LongTextConfiguration longText;
	
	protected DeviceLongTextAttribute() {
	}
	
	public DeviceLongTextAttribute(Device device, String name, String value) {
		super(device, name);
		this.longText = new LongTextConfiguration(value);
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
