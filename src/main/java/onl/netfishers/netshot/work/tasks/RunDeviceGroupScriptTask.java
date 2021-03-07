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

import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.Task;

import org.hibernate.Hibernate;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task schedules new tasks to take a new snapshot of each device of the
 * given group.
 */
@Entity
public class RunDeviceGroupScriptTask extends Task {

	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(RunDeviceGroupScriptTask.class);

	/** The device group. */
	private DeviceGroup deviceGroup;

	private String script;

	private String deviceDriver;



	public RunDeviceGroupScriptTask() {

	}

	public RunDeviceGroupScriptTask(DeviceGroup group, String script, DeviceDriver driver,
			String comments, String author) {
		super(comments, group.getName(), author);
		this.deviceGroup = group;
		this.script = script;
		this.deviceDriver = driver.getName();
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Group script execution";
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#prepare()
	 */
	@Override
	public void prepare() {
		Hibernate.initialize(this.getDeviceGroup());
		Hibernate.initialize(this.getDeviceGroup().getCachedDevices());
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		logger.debug("Task {}. Starting run script task for group {}.",
				this.getId(), this.getDeviceGroup().getId());
		Set<Device> devices = this.getDeviceGroup().getCachedDevices();
		logger.debug("Task {}. {} devices in the group.", this.getId(), devices.size());
		String comment = String.format("Started due to group %s script task", this.getDeviceGroup().getName());

		DeviceDriver driver = DeviceDriver.getDriverByName(this.deviceDriver);
		if (driver == null) {
			logger.error("Task {}. No such device driver {}.", this.getId(), deviceDriver);
			this.error("Unknown device driver.");
			this.status = Status.FAILURE;
			return;
		}

		for (Device device : devices) {
			this.info(String.format("Starting run script task for device %s.", device.getName()));
			RunDeviceScriptTask task = new RunDeviceScriptTask(device, script, driver, comment, author);
			try {
				TaskManager.addTask(task);
			}
			catch (Exception e) {
				logger.error("Task {}. Error while scheduling the individual snapshot task.", this.getId(), e);
				this.error("Error while scheduling the task.");
			}
		}
		logger.debug("Task {}. Everything went fine.", this.getId());
		this.status = Status.SUCCESS;
	}

	/**
	 * Gets the device group.
	 *
	 * @return the device group
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	public DeviceGroup getDeviceGroup() {
		return deviceGroup;
	}

	/**
	 * Sets the device group.
	 *
	 * @param deviceGroup the new device group
	 */
	public void setDeviceGroup(DeviceGroup deviceGroup) {
		this.deviceGroup = deviceGroup;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		RunDeviceGroupScriptTask task = (RunDeviceGroupScriptTask) super.clone();
		task.setDeviceGroup(this.deviceGroup);
		return task;
	}

	@Column(length = 10000000)
	public String getScript() {
		return script;
	}

	public void setScript(String script) {
		this.script = script;
	}

	public String getDeviceDriver() {
		return deviceDriver;
	}

	public void setDeviceDriver(String deviceDriver) {
		this.deviceDriver = deviceDriver;
	}

	/*
	 * (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getIdentity()
	 */
	@Override
	@Transient
	public JobKey getIdentity() {
		return new JobKey(String.format("Task_%d", this.getId()), 
				String.format("RunDeviceGroupScript_%d", this.getDeviceGroup().getId()));
	}
}
