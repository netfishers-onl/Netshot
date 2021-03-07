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

import java.util.List;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.compliance.HardwareRule;
import onl.netfishers.netshot.compliance.SoftwareRule;
import onl.netfishers.netshot.compliance.SoftwareRule.ConformanceLevel;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.Task;

import org.hibernate.CacheMode;
import org.hibernate.Hibernate;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.Session;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task checks the compliance of the software version of a given group
 * of devices.
 */
@Entity
public class CheckGroupSoftwareTask extends Task {

	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(CheckGroupSoftwareTask.class);

	/** The device group. */
	private DeviceGroup deviceGroup;

	/**
	 * Instantiates a new check group software task.
	 */
	public CheckGroupSoftwareTask() {

	}

	/**
	 * Instantiates a new check group software task.
	 *
	 * @param group the group
	 * @param comments the comments
	 */
	public CheckGroupSoftwareTask(DeviceGroup group, String comments, String author) {
		super(comments, group.getName(), author);
		this.deviceGroup = group;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Group software compliance and hardware support check";
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#prepare()
	 */
	@Override
	public void prepare() {
		Hibernate.initialize(this.getDeviceGroup());
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
		CheckGroupSoftwareTask task = (CheckGroupSoftwareTask) super.clone();
		task.setDeviceGroup(this.deviceGroup);
		return task;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		logger.debug("Task {}. Starting check software compliance and hardware support status task for group {}.",
				this.getId(), deviceGroup.getId());
		this.trace(String.format("Check software compliance task for group %s.",
				deviceGroup.getName()));

		Session session = Database.getSession();
		try {
			logger.debug("Task {}. Retrieving the software rules", this.getId());
			List<SoftwareRule> softwareRules = session
					.createQuery("select sr from SoftwareRule sr order by sr.priority asc", SoftwareRule.class)
					.list();
			logger.debug("Task {}. Retrieving the hardware rules", this.getId());
			List<HardwareRule> hardwareRules = session
					.createQuery("select hr from HardwareRule hr", HardwareRule.class)
					.list();

			session.beginTransaction();
			ScrollableResults devices = session
					.createQuery("select d from DeviceGroup g join g.cachedDevices d where g.id = :id")
					.setParameter("id", deviceGroup.getId())
					.setCacheMode(CacheMode.IGNORE)
					.scroll(ScrollMode.FORWARD_ONLY);
			while (devices.next()) {
				Device device = (Device) devices.get(0);
				device.setSoftwareLevel(ConformanceLevel.UNKNOWN);
				for (SoftwareRule rule : softwareRules) {
					rule.check(device);
					if (device.getSoftwareLevel() != ConformanceLevel.UNKNOWN) {
						break;
					}
				}
				device.resetEoX();
				for (HardwareRule rule : hardwareRules) {
					rule.check(device);
				}
				session.save(device);
				session.flush();
				session.evict(device);
			}
			session.getTransaction().commit();
			this.status = Status.SUCCESS;
		}
		catch (Exception e) {
			try {
				session.getTransaction().rollback();
			}
			catch (Exception e1) {
				logger.error("Task {}. Error during transaction rollback.", this.getId(), e1);
			}
			logger.error("Task {}. Error while checking compliance.", this.getId(), e);
			this.error("Error while checking compliance: " + e.getMessage());
			this.status = Status.FAILURE;
			return;
		}
		finally {
			session.close();
		}
	}

	/*
	 * (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getIdentity()
	 */
	@Override
	@Transient
	public JobKey getIdentity() {
		return new JobKey(String.format("Task_%d", this.getId()),
				String.format("CheckGroupSoftware_%d", this.getDeviceGroup().getId()));
	}

}
