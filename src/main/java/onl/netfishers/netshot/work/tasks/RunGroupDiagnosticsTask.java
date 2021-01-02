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

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.Task;

import org.hibernate.Hibernate;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task schedules new tasks to run diagnostics on each device of the
 * given group.
 */
@Entity
public class RunGroupDiagnosticsTask extends Task {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(RunGroupDiagnosticsTask.class);

	/** The device group. */
	private DeviceGroup deviceGroup;

	/** Do not automatically start a check compliance task */
	private boolean dontCheckCompliance = false;


	/**
	 * Instantiates a new run group diagnostic task.
	 */
	public RunGroupDiagnosticsTask() {

	}

	/**
	 * Instantiates a new run group diagnostic task.
	 *
	 * @param group the group
	 * @param comments the comments
	 */
	public RunGroupDiagnosticsTask(DeviceGroup group, String comments, String author, boolean dontCheckCompliance) {
		super(comments, group.getName(), author);
		this.deviceGroup = group;
		this.dontCheckCompliance = dontCheckCompliance;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Group diagnostics";
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
		logger.debug("Task {}. Starting diagnostics task for group {}.",
				this.getId(), this.getDeviceGroup().getId());
		Set<Device> devices = this.getDeviceGroup().getCachedDevices();
		logger.debug("Task {}. {} devices in the group.", this.getId(), devices.size());
		String comment = String.format("Started due to group %s diagnotics", this.getDeviceGroup().getName());
		for (Device device : devices) {
			this.info(String.format("Scheduling diagnostics task for device %s.", device.getName()));
			RunDiagnosticsTask task = new RunDiagnosticsTask(device, comment, author, this.dontCheckCompliance);
			try {
				TaskManager.addTask(task);
			}
			catch (Exception e) {
				logger.error("Task {}. Error while scheduling the individual diagnostics task.",
						this.getId(), e);
				this.error("Error while scheduling the task.");
			}
		}
		logger.debug("Everything went fine.");
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

	/**
	 * Do we need to bypass the compliance check?
	 * 
	 * @return true not to schedule the automatic compliance check
	 */
	public boolean isDontCheckCompliance() {
		return dontCheckCompliance;
	}

	/**
	 * Enables or disables the automatic compliance check.
	 * @param dontCheckCompliance true to bypass the compliance check
	 */
	public void setDontCheckCompliance(boolean dontCheckCompliance) {
		this.dontCheckCompliance = dontCheckCompliance;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		RunGroupDiagnosticsTask task = (RunGroupDiagnosticsTask) super.clone();
		task.setDeviceGroup(this.deviceGroup);
		return task;
	}

	/*
	 * (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getIdentity()
	 */
	@Override
	@Transient
	public JobKey getIdentity() {
		return new JobKey(String.format("Task_%d", this.getId()), 
				String.format("RunGroupDiagnosticsTask_%d", this.getDeviceGroup().getId()));
	}
}
