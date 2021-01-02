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
package onl.netfishers.netshot.device;

import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.persistence.Version;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import org.hibernate.annotations.Filter;

import onl.netfishers.netshot.device.attribute.ConfigAttribute;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * A device configuration.
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@Table(indexes = {
		@Index(name = "changeDateIndex", columnList = "changeDate")
})
public class Config {

	/** The attributes. */
	private Set<ConfigAttribute> attributes = new HashSet<ConfigAttribute>();

	/** The author. */
	private String author = "";

	/** The change date. */
	protected Date changeDate;
	
	private int version;

	/** The device. */
	protected Device device;

	/** The id. */
	protected long id;

	/**
	 * Instantiates a new config.
	 */
	public Config() {
	}

	/**
	 * Instantiates a new config.
	 *
	 * @param device the device
	 */
	public Config(Device device) {
		this.device = device;
	}

	public void addAttribute(ConfigAttribute attribute) {
		this.attributes.add(attribute);
	}
	
	public void clearAttributes() {
		attributes.clear();
	}
	
	@XmlElement
	@JsonView(DefaultView.class)
	@OneToMany(cascade = CascadeType.ALL, mappedBy = "config", orphanRemoval = true)
	@Filter(name = "lightAttributesOnly")
	public Set<ConfigAttribute> getAttributes() {
		return attributes;
	}
	
	@Transient
	public Map<String, ConfigAttribute> getAttributeMap() {
		Map<String, ConfigAttribute> map = new HashMap<String, ConfigAttribute>();
		for (ConfigAttribute a : this.attributes) {
			map.put(a.getName(), a);
		}
		return map;
	}

	/**
	 * Gets the author.
	 *
	 * @return the author
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public String getAuthor() {
		return author;
	}

	/**
	 * Gets the change date.
	 *
	 * @return the change date
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public Date getChangeDate() {
		return changeDate;
	}
	
	@Version
	public int getVersion() {
		return version;
	}
	
	public void setVersion(int version) {
		this.version = version;
	}

	/**
	 * Gets the device.
	 *
	 * @return the device
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	public Device getDevice() {
		return device;
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public long getId() {
		return id;
	}

	public void setAttributes(Set<ConfigAttribute> attributes) {
		this.attributes = attributes;
	}

	/**
	 * Sets the author.
	 *
	 * @param author the new author
	 */
	public void setAuthor(String author) {
		this.author = author;
	}

	/**
	 * Sets the change date.
	 *
	 * @param changeDate the new change date
	 */
	public void setChangeDate(Date changeDate) {
		this.changeDate = changeDate;
	}

	/**
	 * Sets the device.
	 *
	 * @param device the new device
	 */
	public void setDevice(Device device) {
		this.device = device;
	}

	/**
	 * Sets the id.
	 *
	 * @param id the new id
	 */
	public void setId(long id) {
		this.id = id;
	}

}
