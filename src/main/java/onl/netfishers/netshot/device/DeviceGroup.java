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

import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToMany;
import javax.persistence.Version;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.hibernate.Session;
import org.hibernate.annotations.NaturalId;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;

import lombok.Getter;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * A group of devices.
 */
@Entity @Inheritance(strategy = InheritanceType.JOINED)
@XmlAccessorType(value = XmlAccessType.NONE)
@XmlRootElement()
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
		@Type(value = DynamicDeviceGroup.class, name = "DynamicDeviceGroup"),
		@Type(value = StaticDeviceGroup.class, name = "StaticDeviceGroup"),
})
abstract public class DeviceGroup {
	
	/** The cached devices. */
	@Getter(onMethod=@__({
		@ManyToMany
	}))
	@Setter
	protected Set<Device> cachedDevices = new HashSet<>();
	
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	/** The change date. */
	protected Date changeDate;
	
	/** Version internal field */
	@Getter(onMethod=@__({
		@Version
	}))
	@Setter
	private int version;
	
	/** The id. */
	@Getter(onMethod=@__({
		@Id, @GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlAttribute, @JsonView(DefaultView.class)
	}))
	@Setter
	protected long id;
	
	/** The name. */
	@Getter(onMethod=@__({
		@NaturalId(mutable = true),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String name;
	
	/** Folder containing the group. */
	@Getter(onMethod=@__({
		@Column(length = 1000),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String folder = "";
	
	/** Whether the group should be hidden in reports. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected boolean hiddenFromReports = false;
	
	/**
	 * Instantiates a new device group.
	 */
	protected DeviceGroup() {
		
	}
	
	/**
	 * Instantiates a new device group.
	 *
	 * @param name the name
	 */
	public DeviceGroup(String name) {
		this.name = name;
	}
	
	/**
	 * Delete cached device.
	 *
	 * @param device the device
	 */
	public void deleteCachedDevice(Device device) {
		this.cachedDevices.remove(device);
	}
	
	/**
	 * Refresh cache.
	 *
	 * @param session the session
	 * @throws Exception the exception
	 */
	public abstract void refreshCache(Session session) throws Exception;
	
	/**
	 * Update cached devices.
	 *
	 * @param devices the devices
	 */
	public void updateCachedDevices(Collection<Device> devices) {
		this.cachedDevices.addAll(devices);
		this.cachedDevices.retainAll(devices);
	}

	@Override
	public String toString() {
		return "Device Group " + id + " (name '" + name + "')";
	}
	
}
