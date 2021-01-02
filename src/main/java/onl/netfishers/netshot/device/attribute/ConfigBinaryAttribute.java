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

import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

@Entity @DiscriminatorValue("B")
public class ConfigBinaryAttribute extends ConfigAttribute {

	private Boolean assumption;

	protected ConfigBinaryAttribute() {
	}
	
	public ConfigBinaryAttribute(Config config, String name, boolean value) {
		super(config, name);
		this.assumption = value;
	}
	
	@XmlElement
	@JsonView(DefaultView.class)
	public Boolean getAssumption() {
		return assumption;
	}

	public void setAssumption(Boolean assumption) {
		this.assumption = assumption;
	}

	@Override
	@Transient
	public String getAsText() {
		if (Boolean.TRUE == assumption) {
			return "true";
		}
		else {
			return "false";
		}
	}
	
	@Override
	@Transient
	public Object getData() {
		return getAssumption();
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + ((assumption == null) ? 0 : assumption.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (!super.equals(obj))
			return false;
		if (!(obj instanceof ConfigBinaryAttribute))
			return false;
		ConfigBinaryAttribute other = (ConfigBinaryAttribute) obj;
		if (assumption == null) {
			if (other.assumption != null)
				return false;
		}
		else if (!assumption.equals(other.assumption))
			return false;
		return true;
	}

}
