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
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

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
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@OneToMany(mappedBy = "config", orphanRemoval = true, cascade = CascadeType.ALL),
		@Filter(name = "lightAttributesOnly")
	}))
	@Setter
	private Set<ConfigAttribute> attributes = new HashSet<ConfigAttribute>();

	/** The author. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String author = "";

	/** The change date. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date changeDate;
	
	@Getter(onMethod=@__({
		@Version
	}))
	@Setter
	private int version;

	/** The device. */
	@Getter(onMethod=@__({
		@ManyToOne(fetch = FetchType.LAZY)
	}))
	@Setter
	protected Device device;

	/** The id. */
	@Getter(onMethod=@__({
		@Id, @GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlAttribute, @JsonView(DefaultView.class)
	}))
	@Setter
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

}
