/**
 * Copyright 2013-2016 Sylvain Cadilhac (NetFishers)
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

import java.util.Calendar;
import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.work.Task;

import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task schedules new tasks to take a new snapshot of each device of the
 * given group.
 */
@Entity
public class TakeGroupSnapshotTask extends Task {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(TakeGroupSnapshotTask.class);

	/** The device group. */
	private DeviceGroup deviceGroup;

	/** Only capture devices updated more than X hours ago **/
	private int limitToOutofdateDeviceHours = -1;



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
	 */
	public TakeGroupSnapshotTask(DeviceGroup group, String comments, String author,
			int limitToOutofdateDeviceHours) {
		super(comments, group.getName(), author);
		this.deviceGroup = group;
		this.limitToOutofdateDeviceHours = limitToOutofdateDeviceHours;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@Transient
	public String getTaskDescription() {
		return "Group snapshot";
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
		logger.debug("Starting snapshot task for group {}.", this.getDeviceGroup().getId());
		Set<Device> devices = this.getDeviceGroup().getCachedDevices();
		logger.debug("{} devices in the group.", devices.size());
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
			TakeSnapshotTask task = new TakeSnapshotTask(device, comment, author);
			try {
				TaskManager.addTask(task);
			}
			catch (Exception e) {
				logger.error("Error while scheduling the individual snapshot task.", e);
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

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		TakeGroupSnapshotTask task = (TakeGroupSnapshotTask) super.clone();
		task.setDeviceGroup(this.deviceGroup);
		return task;
	}

	public int getLimitToOutofdateDeviceHours() {
		return limitToOutofdateDeviceHours;
	}

	public void setLimitToOutofdateDeviceHours(int limitToOutofdateDeviceHours) {
		this.limitToOutofdateDeviceHours = limitToOutofdateDeviceHours;
	}

}
