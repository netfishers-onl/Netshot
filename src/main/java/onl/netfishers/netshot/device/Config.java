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
import java.util.LinkedList;
import java.util.List;
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

import org.apache.commons.lang3.tuple.Pair;
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

	/**
	 * From a list of config lines, get an array of pointers to the parent line,
	 * based on indentation (either the direct parent line index, or -1 if no parent).
	 * @param lines the config lines
	 * @return an array, the indice of the direct parent line for each line of the passed list
	 */
	public static int[] getLineParents(List<String> lines) {
		List<Pair<Integer, Integer>> lastLevels = new LinkedList<>();
		int lineCount = lines.size();
		int[] lineParents = new int[lineCount];
		for (int lineIndex = 0; lineIndex < lineCount; lineIndex++) {
			String line = lines.get(lineIndex);
			int l = 0;
			while (l < line.length() && Character.isWhitespace(line.charAt(l))) {
				l += 1;
			}
			final int level = l < line.length() ? l : 0;
			lastLevels.removeIf(le -> le.getKey() >= level);
			lastLevels.add(Pair.of(level, lineIndex));
			lineParents[lineIndex] = (lastLevels.size() > 1) ? lastLevels.get(lastLevels.size() - 2).getValue() : -1;
		}
		return lineParents;
	}

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
	
	@XmlElement @JsonView(DefaultView.class)
	@OneToMany(mappedBy = "config", orphanRemoval = true,
			cascade = CascadeType.ALL)
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
	 * Return a config attribute based on name
	 * @param name = name of the attribute to find
	 * @return the found attribute or null if none
	 */
	@Transient
	public ConfigAttribute getAttribute(String name) {
		for (ConfigAttribute attribute : this.attributes) {
			if (attribute.getName().equals(name)) {
				return attribute;
			}
		}
		return null;
	}

	/**
	 * Gets the author.
	 *
	 * @return the author
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getAuthor() {
		return author;
	}

	/**
	 * Gets the change date.
	 *
	 * @return the change date
	 */
	@XmlElement @JsonView(DefaultView.class)
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
	@XmlElement @JsonView(DefaultView.class)
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
