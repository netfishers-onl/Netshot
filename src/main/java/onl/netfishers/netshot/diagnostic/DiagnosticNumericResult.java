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
package onl.netfishers.netshot.diagnostic;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Transient;
import jakarta.xml.bind.annotation.XmlElement;

import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

@Entity @DiscriminatorValue("N")
public class DiagnosticNumericResult extends DiagnosticResult {

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
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
	public boolean valueEquals(DiagnosticResult obj) {
		if (this == obj)
			return true;
		if (!(obj instanceof DiagnosticNumericResult))
			return false;
		DiagnosticNumericResult other = (DiagnosticNumericResult) obj;
		return Objects.equals(this.number, other.number);
	}
	
}
