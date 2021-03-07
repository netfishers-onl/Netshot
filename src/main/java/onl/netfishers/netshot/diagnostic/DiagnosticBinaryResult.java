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

@Entity @DiscriminatorValue("B")
public class DiagnosticBinaryResult extends DiagnosticResult {

	private Boolean assumption;

	protected DiagnosticBinaryResult() {
	}
	
	public DiagnosticBinaryResult(Device device, Diagnostic diagnostic, boolean value) {
		super(device, diagnostic);
		this.assumption = value;
	}
	
	public DiagnosticBinaryResult(Device device, Diagnostic diagnostic, String value) {
		super(device, diagnostic);
		this.assumption = true;
		if (value == null || "false".equals(value) || "FALSE".equals(value) || "False".equals(value) || "0".equals(value)) {
			this.assumption = false;
		}
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
	public String getAsText() {
		if (Boolean.TRUE.equals(assumption)) {
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
		if (!(obj instanceof DiagnosticBinaryResult))
			return false;
		DiagnosticBinaryResult other = (DiagnosticBinaryResult) obj;
		if (assumption == null) {
			if (other.assumption != null)
				return false;
		}
		else if (!assumption.equals(other.assumption))
			return false;
		return true;
	}

}
