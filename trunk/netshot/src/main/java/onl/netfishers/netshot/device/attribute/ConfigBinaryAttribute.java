/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.device.attribute;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.device.Config;

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
