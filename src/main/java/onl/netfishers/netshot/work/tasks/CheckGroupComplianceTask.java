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
import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.Task;
import onl.netfishers.netshot.work.TaskLogger;

import org.hibernate.CacheMode;
import org.hibernate.Hibernate;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.Session;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task checks the configuration compliance status of a group of devices.
 */
@Entity
public class CheckGroupComplianceTask extends Task {

	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(CheckGroupComplianceTask.class);

	/** The device group. */
	private DeviceGroup deviceGroup;

	/**
	 * Instantiates a new check group compliance task.
	 */
	public CheckGroupComplianceTask() {

	}

	/**
	 * Instantiates a new check group compliance task.
	 *
	 * @param group the group
	 * @param comments the comments
	 */
	public CheckGroupComplianceTask(DeviceGroup group, String comments, String author) {
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
		return "Group compliance check";
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
		CheckGroupComplianceTask task = (CheckGroupComplianceTask) super.clone();
		task.setDeviceGroup(this.deviceGroup);
		return task;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		logger.debug("Task {}. Starting check compliance task for group {}.", this.getId(), deviceGroup.getId());
		this.trace(String.format("Check compliance task for group %s.",
				deviceGroup.getName()));

		Session session = Database.getSession();
		try {
			List<Policy> policies =
				session.createQuery("select p from Policy p", Policy.class).list();

			TaskLogger taskLogger = this.getJsLogger();

			session.beginTransaction();
			session
				.createQuery("delete from CheckResult c where c.key.device.id in (select d.id as id from DeviceGroup g1 join g1.cachedDevices d where g1.id = :id)")
				.setParameter("id", deviceGroup.getId())
				.executeUpdate();
			for (Policy policy : policies) {
				ScrollableResults devices = session
						.createQuery("from Device d join fetch d.lastConfig where d.id in (select d.id as id from DeviceGroup g1 join g1.cachedDevices d join d.ownerGroups g2 join g2.appliedPolicies p where g1.id = :id and p.id = :pid)")
						.setParameter("id", deviceGroup.getId())
						.setParameter("pid", policy.getId())
						.setCacheMode(CacheMode.IGNORE)
						.scroll(ScrollMode.FORWARD_ONLY);
				while (devices.next()) {
					Device device = (Device) devices.get(0);
					policy.check(device, session, taskLogger);
					session.flush();
					session.evict(device);
				}
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
				String.format("CheckGroupCompliance_%d", this.getDeviceGroup().getId()));
	}

}
