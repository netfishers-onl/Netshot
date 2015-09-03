/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.device.attribute;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.device.Config;

@Entity @DiscriminatorValue("S")
public class ConfigTextAttribute extends ConfigAttribute {

	private String text;
	
	protected ConfigTextAttribute() {
	}
	
	public ConfigTextAttribute(Config config, String name, String value) {
		super(config, name);
		this.text = value;
	}

	@XmlElement
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
		if (!super.equals(obj))
			return false;
		if (!(obj instanceof ConfigTextAttribute))
			return false;
		ConfigTextAttribute other = (ConfigTextAttribute) obj;
		if (text == null) {
			if (other.text != null)
				return false;
		}
		else if (!text.equals(other.text))
			return false;
		return true;
	}

}
