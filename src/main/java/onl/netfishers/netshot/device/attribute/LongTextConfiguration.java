/**
 * Copyright 2013-2016 Sylvain Cadilhac (NetFishers)
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

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

@Entity
public class LongTextConfiguration {
	
	private long id;
	private String text = "";
	
	protected LongTextConfiguration() {
	}
	
	public LongTextConfiguration(String text) {
		this.text = text;
	}
	
	@Id
	@GeneratedValue
	public long getId() {
		return id;
	}

	@Column(length = 10000000)
	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
	}

	public void setId(long id) {
		this.id = id;
	}
	
	public String toString() {
		return getText();
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((text == null) ? 0 : text.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (!(obj instanceof LongTextConfiguration))
			return false;
		LongTextConfiguration other = (LongTextConfiguration) obj;
		if (getText() == null) {
			if (other.getText() != null)
				return false;
		}
		else if (!getText().equals(other.getText()))
			return false;
		return true;
	}
	
}
