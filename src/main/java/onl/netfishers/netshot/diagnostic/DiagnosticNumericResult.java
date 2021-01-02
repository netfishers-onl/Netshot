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
package onl.netfishers.netshot.diagnostic;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

@Entity @DiscriminatorValue("N")
public class DiagnosticNumericResult extends DiagnosticResult {

	private Double number;

	protected DiagnosticNumericResult() {
	}
	
	public DiagnosticNumericResult(Device device, Diagnostic diagnostic, double value) {
		super(device, diagnostic);
		this.number = value;
	}
	
	public DiagnosticNumericResult(Device device, Diagnostic diagnostic, String value) {
		super(device, diagnostic);
		this.number = Double.parseDouble(value);
	}
	
	@XmlElement
	@JsonView(DefaultView.class)
	public Double getNumber() {
		return number;
	}

	public void setNumber(Double value) {
		this.number = value;
	}

	@Override
	@Transient
	public String getAsText() {
		if (number == null) {
			return "";
		}
		return number.toString();
	}
	
	@Override
	@Transient
	public Object getData() {
		return getNumber();
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + ((number == null) ? 0 : number.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (!(obj instanceof DiagnosticNumericResult))
			return false;
		DiagnosticNumericResult other = (DiagnosticNumericResult) obj;
		if (number == null) {
			if (other.number != null)
				return false;
		}
		else if (!number.equals(other.number))
			return false;
		return true;
	}
	
}
