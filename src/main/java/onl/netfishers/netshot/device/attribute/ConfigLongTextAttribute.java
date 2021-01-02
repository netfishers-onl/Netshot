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

import javax.persistence.CascadeType;
import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToOne;
import javax.persistence.Transient;

import onl.netfishers.netshot.device.Config;

@Entity @DiscriminatorValue("T")
public class ConfigLongTextAttribute extends ConfigAttribute {

	private LongTextConfiguration longText;
	
	protected ConfigLongTextAttribute() {
	}
	
	public ConfigLongTextAttribute(Config config, String name, String value) {
		super(config, name);
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
	public String getAsText() {
		if (longText == null || longText.getText() == null) {
			return "";
		}
		return longText.getText();
	}
	
	@Override
	@Transient
	public Object getData() {
		if (getLongText() == null) {
			return null;
		}
		return getLongText().getText();
 	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + ((longText == null) ? 0 : longText.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (!super.equals(obj))
			return false;
		if (!(obj instanceof ConfigLongTextAttribute))
			return false;
		ConfigLongTextAttribute other = (ConfigLongTextAttribute) obj;
		if (longText == null) {
			if (other.longText != null)
				return false;
		}
		else if (!longText.equals(other.longText))
			return false;
		return true;
	}

}
