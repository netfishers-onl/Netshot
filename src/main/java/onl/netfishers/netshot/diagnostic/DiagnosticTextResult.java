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

import javax.persistence.Column;
import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

@Entity @DiscriminatorValue("S")
public class DiagnosticTextResult extends DiagnosticResult {

	private String text;
	
	protected DiagnosticTextResult() {
	}
	
	public DiagnosticTextResult(Device device, Diagnostic diagnostic, String value) {
		super(device, diagnostic);
		this.text = value;
	}

	@XmlElement @JsonView(DefaultView.class)
	@Column(length = 16384)
	public String getText() {
		return text;
	}

	public void setText(String value) {
		this.text = value;
	}

	@Override
	@Transient
	public String getAsText() {
		if (text == null) {
			return "";
		}
		return text;
	}
	
	@Override
	@Transient
	public Object getData() {
		return getText();
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + ((text == null) ? 0 : text.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (!(obj instanceof DiagnosticTextResult))
			return false;
		DiagnosticTextResult other = (DiagnosticTextResult) obj;
		if (text == null) {
			if (other.text != null)
				return false;
		}
		else if (!text.equals(other.text))
			return false;
		return true;
	}

}
