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
package onl.netfishers.netshot.work.tasks;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

import org.hibernate.annotations.NaturalId;

@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class DeviceJsScript {

	private long id;
	
	private String name;

	private String script;

	private String deviceDriver;

	private String author;

	protected DeviceJsScript() {

	}

	public DeviceJsScript(String name, String deviceDriver, String script, String author) {
		this.name = name;
		this.script = script;
		this.deviceDriver = deviceDriver;
		this.author = author;
	}



	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@XmlElement
	@JsonView(DefaultView.class)
	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	@Column(length = 10000000)
	public String getScript() {
		return script;
	}

	public void setScript(String script) {
		this.script = script;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getDeviceDriver() {
		return deviceDriver;
	}
	
	@Transient
	@XmlElement
	@JsonView(DefaultView.class)
	public String getRealDeviceType() {
		DeviceDriver driver = DeviceDriver.getDriverByName(deviceDriver);
		if (driver == null) {
			return "Unknwon driver";
		}
		return driver.getDescription();
	}

	public void setDeviceDriver(String deviceDriver) {
		this.deviceDriver = deviceDriver;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getAuthor() {
		return author;
	}

	public void setAuthor(String author) {
		this.author = author;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	@NaturalId
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	@Override
	public String toString() {
		return "Device JavaScript script " + id + " (name '" + name + "', author '" + author + "')";
	}
}
