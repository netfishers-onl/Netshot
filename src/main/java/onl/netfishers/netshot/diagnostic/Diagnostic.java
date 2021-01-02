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

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Transient;
import javax.script.ScriptException;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;
import org.hibernate.annotations.NaturalId;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeType;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * A diagnostic describes how to get some data from a group of devices, and to store
 * an history of this data.
 * @author sylvain.cadilhac
 *
 */
@Entity @Inheritance(strategy = InheritanceType.JOINED)
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@JsonTypeInfo(use = JsonTypeInfo.Id.MINIMAL_CLASS, include = JsonTypeInfo.As.PROPERTY, property = "type")
public abstract class Diagnostic {
	
	/** The set of real rule types. */
	private static final Set<Class<? extends Diagnostic>> DIAGNOSTIC_CLASSES;

	static {
		DIAGNOSTIC_CLASSES = new HashSet<Class<? extends Diagnostic>>();
		DIAGNOSTIC_CLASSES.add(SimpleDiagnostic.class);
		DIAGNOSTIC_CLASSES.add(JavaScriptDiagnostic.class);
	}

	/**
	 * Gets the concrete implementations of Diagnostic.
	 *
	 * @return the Diagnostic classes
	 */
	public static final Set<Class<? extends Diagnostic>> getDiagnosticClasses() {
		return DIAGNOSTIC_CLASSES;
	}

	/** The id. */
	private long id;

	/** The name of the diagnostic. */
	private String name;

	/** The target group. */
	private DeviceGroup targetGroup;
	
	/** Is the diagnostic enabled? */
	protected boolean enabled = false;
	
	/** The type of data returned by the diagnostic */
	protected AttributeType resultType;

	/** The associated results */
	List<DiagnosticResult> results = new ArrayList<DiagnosticResult>();
	
	/**
	 * Instantiate a new diagnostic.
	 */
	protected Diagnostic() {	
	}

	/**
	 * Instantiates a new diagnostic.
	 * @param name The name
	 * @param enabled True to enable the diagnostic
	 * @param targetGroup The group of devices the diagnostic applies to
	 * @param resultType The type of result expected by this diagnostic
	 */
	public Diagnostic(String name, boolean enabled, DeviceGroup targetGroup, AttributeType resultType) {
		this.name = name;
		this.enabled = enabled;
		this.targetGroup = targetGroup;
		this.resultType = resultType;
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@XmlElement
	@JsonView(DefaultView.class)
	public long getId() {
		return id;
	}

	/**
	 * Gets the name.
	 *
	 * @return the name
	 */
	@NaturalId(mutable = true)
	@XmlElement
	@JsonView(DefaultView.class)
	public String getName() {
		return name;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public AttributeType getResultType() {
		return resultType;
	}

	/**
	 * Gets the target group.
	 *
	 * @return the target group
	 */
	@ManyToOne
	@XmlElement
	@JsonView(DefaultView.class)
	public DeviceGroup getTargetGroup() {
		return targetGroup;
	}

	/**
	 * Is the diagnostic enabled?
	 * @return true if it's enabled
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public boolean isEnabled() {
		return enabled;
	}

	/**
	 * Sets the diagnostic as enabled or disabled.
	 * @param enabled true if the diagnostic is enabled
	 */
	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	/**
	 * Sets the id.
	 *
	 * @param id the new id
	 */
	public void setId(long id) {
		this.id = id;
	}

	/**
	 * Sets the name.
	 *
	 * @param name the new name
	 */
	public void setName(String name) {
		this.name = name;
	}

	public void setResultType(AttributeType resultType) {
		this.resultType = resultType;
	}

	/**
	 * Sets the target group.
	 *
	 * @param targetGroup the new target group
	 */
	public void setTargetGroup(DeviceGroup targetGroup) {
		this.targetGroup = targetGroup;
	}

	/**
	 * Gets the results.
	 * @return the results
	 */
	@OneToMany(fetch = FetchType.LAZY, mappedBy = "diagnostic", cascade = CascadeType.REMOVE, orphanRemoval = true)
	public List<DiagnosticResult> getResults() {
		return results;
	}

	/**
	 * Sets the diagnostic results.
	 * @param results the results to set
	 */
	public void setResults(List<DiagnosticResult> results) {
		this.results = results;
	}

	/**
	 * Process and add a result to a device.
	 * @param device the device
	 * @param value the diagnostic result
	 */
	@Transient
	public void addResultToDevice(Device device, String value) {
		switch (this.resultType) {
		case LONGTEXT:
			device.addDiagnosticResult(new DiagnosticLongTextResult(device, this, value));
			break;
		case TEXT:
			device.addDiagnosticResult(new DiagnosticTextResult(device, this, value));
			break;
		case NUMERIC:
			device.addDiagnosticResult(new DiagnosticNumericResult(device, this, value));
			break;
		case BINARY:
			device.addDiagnosticResult(new DiagnosticBinaryResult(device, this, value));
			break;
		default:
		}
	}

	@Transient
	abstract public Value getJsObject(Device device, Context context) throws ScriptException;

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + (int) (id ^ (id >>> 32));
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj) return true;
		if (obj == null) return false;
		if (!(obj instanceof Diagnostic)) return false;
		Diagnostic other = (Diagnostic) obj;
		if (id != other.id) return false;
		return true;
	}

	@Override
	public String toString() {
		return "Diagnostic " + id + " (name '" + name + "', type " + this.getClass().getSimpleName() + ")";
	}
	
}
