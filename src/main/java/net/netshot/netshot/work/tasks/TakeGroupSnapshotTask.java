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

import java.util.Calendar;
import java.util.Collection;

import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.quartz.JobKey;

import com.fasterxml.jackson.annotation.JsonView;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Transient;
import jakarta.xml.bind.annotation.XmlElement;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.TaskManager;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.DeviceGroup;
import net.netshot.netshot.rest.RestViews.DefaultView;
import net.netshot.netshot.rest.RestViews.HookView;
import net.netshot.netshot.work.Task;

/**
 * This task schedules new tasks to take a new snapshot of each device of the
 * given group.
 */
@Entity
@OnDelete(action = OnDeleteAction.CASCADE)
@Slf4j
public final class TakeGroupSnapshotTask extends Task implements GroupBasedTask {

	/** The device group. */
	@Getter(onMethod = @__({
		@ManyToOne(fetch = FetchType.LAZY),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	private DeviceGroup deviceGroup;

	/** Only capture devices updated more than X hours ago. **/
	@Getter
	@Setter
	private int limitToOutofdateDeviceHours = -1;

	/** Do not automatically start a run diagnostics task. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(HookView.class)
	}))
	@Setter
	private boolean dontRunDiagnostics;

	/** Do not automatically start a check compliance task. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(HookView.class)
	}))
	@Setter
	private boolean dontCheckCompliance;

	/**
	 * Instantiates a new take group snapshot task.
	 */
	public TakeGroupSnapshotTask() {

	}

	/**
	 * Instantiates a new take group snapshot task.
	 *
	 * @param group the group
	 * @param comments the comments
	 * @param author the author
	 * @param limitToOutofdateDeviceHours ignore devices that had a successful snapshot in the last given hours
	 * @param dontRunDiagnostics Set to the true to disable running diagnostics
	 * @param dontCheckCompliance Set to true to disable compliance checking
	 */
	public TakeGroupSnapshotTask(DeviceGroup group, String comments, String author,
		int limitToOutofdateDeviceHours, boolean dontRunDiagnostics, boolean dontCheckCompliance) {
		super(comments, group.getName(), author);
		this.deviceGroup = group;
		this.limitToOutofdateDeviceHours = limitToOutofdateDeviceHours;
		this.dontRunDiagnostics = dontRunDiagnostics;
		this.dontCheckCompliance = dontCheckCompliance;
	}

	/*(non-Javadoc)
	 * @see net.netshot.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Group snapshot";
	}

	/**
	 * Get the ID of the associate group.
	 * @return the ID of the group
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Transient
	public long getDeviceGroupId() {
		if (this.deviceGroup == null) {
			return 0;
		}
		return this.deviceGroup.getId();
	}

	/*(non-Javadoc)
	 * @see net.netshot.netshot.work.Task#prepare()
	 */
	@Override
	public void prepare(Session session) {
		Hibernate.initialize(this.getDeviceGroup());
		if (this.getDeviceGroup() != null) {
			Hibernate.initialize(this.getDeviceGroup().getCachedDevices());
		}
	}

	/*(non-Javadoc)
	 * @see net.netshot.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		log.debug("Task {}. Starting snapshot task for group {}.",
			this.getId(), this.deviceGroup == null ? "null" : this.deviceGroup.getId());
		if (this.deviceGroup == null) {
			this.info("The device group doesn't exist, the task will be cancelled.");
			this.status = Status.CANCELLED;
			return;
		}
		Collection<Device> devices = this.getDeviceGroup().getCachedDevices();
		log.debug("Task {}. {} devices in the group.", this.getId(), devices.size());
		String comment = String.format("Started due to group %s snapshot", this.getDeviceGroup().getName());
		Calendar referenceDate = Calendar.getInstance();
		referenceDate.add(Calendar.HOUR, -this.getLimitToOutofdateDeviceHours());
		for (Device device : devices) {
			if (referenceDate.getTime().before(device.getChangeDate())) {
				this.info(String.format("Ignoring device %s because it changed less than %d hours ago",
					device.getName(), this.getLimitToOutofdateDeviceHours()));
				continue;
			}
			this.info(String.format("Starting snapshot task for device %s.", device.getName()));
			TakeSnapshotTask task = new TakeSnapshotTask(device, comment, author, false,
				this.dontRunDiagnostics, this.dontCheckCompliance);
			task.setPriority(this.getPriority());
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

	/*(non-Javadoc)
	 * @see net.netshot.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		TakeGroupSnapshotTask task = (TakeGroupSnapshotTask) super.clone();
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
			String.format("TakeGroupSnapshot_%d", this.getDeviceGroupId()));
	}
}
