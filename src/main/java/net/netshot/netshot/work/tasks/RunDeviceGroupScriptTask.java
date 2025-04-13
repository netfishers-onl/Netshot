/**
 * Copyright 2013-2025 Netshot
 * 
 * This file is part of Netshot project.
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
package net.netshot.netshot.work.tasks;

import java.util.Map;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Transient;
import jakarta.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.TaskManager;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.DeviceDriver;
import net.netshot.netshot.device.DeviceGroup;
import net.netshot.netshot.rest.RestViews.DefaultView;
import net.netshot.netshot.work.Task;

import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;
import org.quartz.JobKey;

/**
 * This task schedules new tasks to take a new snapshot of each device of the
 * given group.
 */
@Entity
@OnDelete(action = OnDeleteAction.CASCADE)
@Slf4j
public class RunDeviceGroupScriptTask extends Task implements GroupBasedTask {

	/** The device group. */
	@Getter(onMethod=@__({
		@ManyToOne(fetch = FetchType.LAZY),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	private DeviceGroup deviceGroup;

	@Getter(onMethod=@__({
		@Column(length = 10000000)
	}))
	@Setter
	private String script;

	@Getter
	@Setter
	private String deviceDriver;

	/** Variable values for the script */
	@Getter(onMethod=@__({
		@JdbcTypeCode(SqlTypes.JSON)
	}))
	@Setter
	private Map<String, String> userInputValues = null;


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
	 * @see net.netshot.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Group script execution";
	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#prepare()
	 */
	@Override
	public void prepare(Session session) {
		Hibernate.initialize(this.getDeviceGroup());
		if (this.getDeviceGroup() != null) {
			Hibernate.initialize(this.getDeviceGroup().getCachedDevices());
		}
	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		log.debug("Task {}. Starting run script task for group {}.",
				this.getId(), deviceGroup == null ? "null" : deviceGroup.getId());
		if (deviceGroup == null) {
			this.info("The device group doesn't exist, the task will be cancelled.");
			this.status = Status.CANCELLED;
			return;
		}
		Set<Device> devices = this.getDeviceGroup().getCachedDevices();
		log.debug("Task {}. {} devices in the group.", this.getId(), devices.size());
		String comment = String.format("Started due to group %s script task", this.getDeviceGroup().getName());

		DeviceDriver driver = DeviceDriver.getDriverByName(this.deviceDriver);
		if (driver == null) {
			log.error("Task {}. No such device driver {}.", this.getId(), deviceDriver);
			this.error("Unknown device driver.");
			this.status = Status.FAILURE;
			return;
		}

		for (Device device : devices) {
			this.info(String.format("Starting run script task for device %s.", device.getName()));
			RunDeviceScriptTask task = new RunDeviceScriptTask(device, script, driver, comment, author);
			task.setPriority(this.getPriority());
			task.setUserInputValues(this.userInputValues);
			try {
				TaskManager.addTask(task);
			}
			catch (Exception e) {
				log.error("Task {}. Error while scheduling the individual snapshot task.", this.getId(), e);
				this.error("Error while scheduling the task.");
			}
		}
		log.debug("Task {}. Everything went fine.", this.getId());
		this.status = Status.SUCCESS;
	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		RunDeviceGroupScriptTask task = (RunDeviceGroupScriptTask) super.clone();
		task.setDeviceGroup(this.deviceGroup);
		return task;
	}

	/*
	 * (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#getIdentity()
	 */
	@Override
	@Transient
	public JobKey getIdentity() {
		return new JobKey(String.format("Task_%d", this.getId()), 
				String.format("RunDeviceGroupScript_%d", this.getDeviceGroup().getId()));
	}
}
