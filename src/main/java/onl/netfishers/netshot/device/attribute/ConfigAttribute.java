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
package onl.netfishers.netshot.device.attribute;

import javax.persistence.DiscriminatorColumn;
import javax.persistence.DiscriminatorType;
import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
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

import org.hibernate.annotations.FilterDef;

import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;

import lombok.Getter;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;

@Entity @Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "type", discriminatorType = DiscriminatorType.CHAR)
@DiscriminatorValue("A")
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
		@Type(value = ConfigNumericAttribute.class, name = "NUMERIC"),
		@Type(value = ConfigTextAttribute.class, name = "TEXT"),
		@Type(value = ConfigLongTextAttribute.class, name = "LONGTEXT"),
		@Type(value = ConfigBinaryAttribute.class, name = "BINARY"),
		@Type(value = ConfigBinaryFileAttribute.class, name = "BINARYFILE")
})
@FilterDef(name = "lightAttributesOnly", defaultCondition = "type <> 'T'")
public abstract class ConfigAttribute {

	@Getter(onMethod=@__({
		@Id, @GeneratedValue(strategy = GenerationType.IDENTITY)
	}))
	@Setter
	protected long id;

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String name;

	@Getter(onMethod=@__({
		@ManyToOne
	}))
	@Setter
	protected Config config;
	
	protected ConfigAttribute() {
		
	}
	
	public ConfigAttribute(Config config, String name) {
		this.config = config;
		this.name = name;
	}

	
	@Transient
	public abstract String getAsText();
	

	@Transient
	public abstract Object getData();

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((name == null) ? 0 : name.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (!(obj instanceof ConfigAttribute))
			return false;
		ConfigAttribute other = (ConfigAttribute) obj;
		if (name == null) {
			if (other.name != null)
				return false;
		}
		else if (!name.equals(other.name))
			return false;
		return true;
	}
	
	
}
