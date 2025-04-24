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

import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Transient;
import jakarta.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.database.Database;
import net.netshot.netshot.compliance.Policy;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.DeviceGroup;
import net.netshot.netshot.rest.RestViews.DefaultView;
import net.netshot.netshot.work.Task;
import net.netshot.netshot.work.TaskLogger;

import org.hibernate.CacheMode;
import org.hibernate.Hibernate;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.Session;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.quartz.JobKey;

/**
 * This task checks the configuration compliance status of a group of devices.
 */
@Entity
@OnDelete(action = OnDeleteAction.CASCADE)
@Slf4j
public class CheckGroupComplianceTask extends Task implements GroupBasedTask {

	/** The device group. */
	@Getter(onMethod=@__({
		@ManyToOne(fetch = FetchType.LAZY),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
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
	 * @see net.netshot.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Group compliance check";
	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#prepare()
	 */
	@Override
	public void prepare(Session session) {
		Hibernate.initialize(this.getDeviceGroup());
	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		CheckGroupComplianceTask task = (CheckGroupComplianceTask) super.clone();
		task.setDeviceGroup(this.deviceGroup);
		return task;
	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		log.debug("Task {}. Starting check compliance task for group {}.",
				this.getId(), deviceGroup == null ? "null" : deviceGroup.getId());
		if (deviceGroup == null) {
			this.info("The device group doesn't exist, the task will be cancelled.");
			this.status = Status.CANCELLED;
			return;
		}
		this.trace(String.format("Check compliance task for group %s.",
				deviceGroup.getName()));

		Session session = Database.getSession();
		try {
			List<Policy> policies =
				session.createQuery("select p from Policy p", Policy.class).list();

			TaskLogger taskLogger = this.getJsLogger();

			session.beginTransaction();
			session
				.createMutationQuery(
					"delete from CheckResult c where c.key.device.id in (select dm1.key.device.id as id from DeviceGroup g1 join g1.cachedMemberships dm1 where dm1.key.group.id = :id)")
				.setParameter("id", deviceGroup.getId())
				.executeUpdate();
			for (Policy policy : policies) {
				// Get devices which are part of the target group and which are in a group which the policy is applied to
				ScrollableResults<Device> devices = session
						.createQuery(
							"select d from Device d join d.groupMemberships gm where gm.key.group.id = :groupId and d in (select dm1.key.device from Policy p join p.targetGroups g1 join g1.cachedMemberships dm1 where p.id = :policyId)",
							Device.class)
						.setParameter("groupId", deviceGroup.getId())
						.setParameter("policyId", policy.getId())
						.setCacheMode(CacheMode.IGNORE)
						.scroll(ScrollMode.FORWARD_ONLY);
				while (devices.next()) {
					Device device = devices.get();
					taskLogger.info(String.format("Checking configuration compliance of device %s (%d)", device.getName(), device.getId()));
					policy.check(device, session, taskLogger);
					session.persist(device);
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
				log.error("Task {}. Error during transaction rollback.", this.getId(), e1);
			}
			log.error("Task {}. Error while checking compliance.", this.getId(), e);
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
	 * @see net.netshot.netshot.work.Task#getIdentity()
	 */
	@Override
	@Transient
	public JobKey getIdentity() {
		return new JobKey(String.format("Task_%d", this.getId()),
				String.format("CheckGroupCompliance_%d", this.getDeviceGroup().getId()));
	}

}
