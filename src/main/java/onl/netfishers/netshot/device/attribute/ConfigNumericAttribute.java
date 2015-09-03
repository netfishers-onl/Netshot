/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.device.attribute;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.device.Config;

@Entity @DiscriminatorValue("N")
public class ConfigNumericAttribute extends ConfigAttribute {

	private Double number;

	protected ConfigNumericAttribute() {
	}
	
	public ConfigNumericAttribute(Config config, String name, double value) {
		super(config, name);
		this.number = value;
	}
	
	@XmlElement
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
		if (!super.equals(obj))
			return false;
		if (!(obj instanceof ConfigNumericAttribute))
			return false;
		ConfigNumericAttribute other = (ConfigNumericAttribute) obj;
		if (number == null) {
			if (other.number != null)
				return false;
		}
		else if (!number.equals(other.number))
			return false;
		return true;
	}
	
}
