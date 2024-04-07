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

import java.util.Date;

import javax.persistence.DiscriminatorColumn;
import javax.persistence.DiscriminatorType;
import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;

import lombok.Getter;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;

import org.hibernate.annotations.FilterDef;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

@Entity @Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "type", discriminatorType = DiscriminatorType.CHAR)
@DiscriminatorValue("A")
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
		@Type(value = DiagnosticNumericResult.class, name = "NUMERIC"),
		@Type(value = DiagnosticTextResult.class, name = "TEXT"),
		@Type(value = DiagnosticLongTextResult.class, name = "LONGTEXT"),
		@Type(value = DiagnosticBinaryResult.class, name = "BINARY")
})
@FilterDef(name = "lightAttributesOnly", defaultCondition = "type <> 'T'")
public abstract class DiagnosticResult {

	/** Unique ID of the diagnostic result **/
	@Getter(onMethod=@__({
		@Id, @GeneratedValue(strategy = GenerationType.IDENTITY)
	}))
	@Setter
	protected long id;

	/** The date this result was created on **/
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Date creationDate = new Date();

	/** The last date this result was returned **/
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Date lastCheckDate = new Date();

	/** The diagnostic which created that result **/
	@Getter(onMethod=@__({
		@ManyToOne(fetch = FetchType.LAZY)
	}))
	@Setter
	private Diagnostic diagnostic;

	/** The device which created that result **/
	@Getter(onMethod=@__({
		@ManyToOne
	}))
	@Setter
	private Device device;
	
	/**
	 * Instantiates a new diagnostic result (for Hibernate)
	 */
	protected DiagnosticResult() {
	}
	
	/**
	 * Instantiates a new diagnostic result
	 * @param device The device
	 * @param diagnostic The diagnostic
	 */
	public DiagnosticResult(Device device, Diagnostic diagnostic) {
		this.device = device;
		this.diagnostic = diagnostic;
	}

	/**
	 * Gets the result value as text.
	 * @return the result value as text
	 */
	@Transient
	public abstract String getAsText();
	

	/**
	 * Gets the result value as an object.
	 * @return the result value as object
	 */
	@Transient
	public abstract Object getData();

	/**
	 * Gets the name of the associated diagnostic. To be sent along the result via REST.
	 * @return the name of the diagnostic.
	 */
	@Transient
	@XmlElement @JsonView(DefaultView.class)
	public String getDiagnosticName() {
		return this.getDiagnostic().getName();
	}
	
}
