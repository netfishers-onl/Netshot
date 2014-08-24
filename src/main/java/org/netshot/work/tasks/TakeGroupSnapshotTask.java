/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.work.tasks;

import java.util.Calendar;
import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import org.hibernate.Hibernate;
import org.netshot.NetshotTaskManager;
import org.netshot.device.Device;
import org.netshot.device.DeviceGroup;
import org.netshot.work.Task;
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
	public TakeGroupSnapshotTask(DeviceGroup group, String comments, int limitToOutofdateDeviceHours) {
		super(comments, group.getName());
		this.deviceGroup = group;
		this.limitToOutofdateDeviceHours = limitToOutofdateDeviceHours;
	}
	
	/* (non-Javadoc)
	 * @see org.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@Transient
	public String getTaskDescription() {
		return "Group snapshot";
	}

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#prepare()
	 */
	@Override
	public void prepare() {
		Hibernate.initialize(this.getDeviceGroup());
		Hibernate.initialize(this.getDeviceGroup().getCachedDevices());
	}
	
	/* (non-Javadoc)
	 * @see org.netshot.work.Task#run()
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
				this.logIt(String.format("Ignoring device %s because it changed less than %d hours ago",
						device.getName(), this.getLimitToOutofdateDeviceHours()), 5);
				continue;
			}
			this.logIt("Starting snapshot task for device " + device.getName(), 5);
			TakeSnapshotTask task = new TakeSnapshotTask(device, comment);
			try {
	      NetshotTaskManager.addTask(task);
      }
      catch (Exception e) {
      	logger.error("Error while scheduling the individual snapshot task.", e);
	      this.logIt("Error while scheduling the task.", 1);
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
	 * @see org.netshot.work.Task#clone()
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
