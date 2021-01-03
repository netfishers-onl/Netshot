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
package onl.netfishers.netshot.device.attribute;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

@Entity @DiscriminatorValue("B")
public class DeviceBinaryAttribute extends DeviceAttribute {

	private Boolean assumption;

	protected DeviceBinaryAttribute() {
	}
	
	public DeviceBinaryAttribute(Device device, String name, boolean value) {
		super(device, name);
		this.assumption = value;
	}
	
	@XmlElement @JsonView(DefaultView.class)
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
