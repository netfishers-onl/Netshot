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

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

@Entity @DiscriminatorValue("B")
public class DeviceBinaryAttribute extends DeviceAttribute {

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Boolean assumption;

	protected DeviceBinaryAttribute() {
	}
	
	public DeviceBinaryAttribute(Device device, String name, boolean value) {
		super(device, name);
		this.assumption = value;
	}

	@Override
	@Transient
	public Object getData() {
		return getAssumption();
	}

}
