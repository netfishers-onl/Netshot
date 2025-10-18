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

import org.hibernate.CacheMode;
import org.hibernate.Hibernate;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
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
import net.netshot.netshot.compliance.HardwareRule;
import net.netshot.netshot.compliance.SoftwareRule;
import net.netshot.netshot.compliance.SoftwareRule.ConformanceLevel;
import net.netshot.netshot.database.Database;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.DeviceGroup;
import net.netshot.netshot.rest.RestViews.DefaultView;
import net.netshot.netshot.work.Task;

/**
 * This task checks the compliance of the software version of a given group
 * of devices.
 */
@Entity
@OnDelete(action = OnDeleteAction.CASCADE)
@Slf4j
public final class CheckGroupSoftwareTask extends Task implements GroupBasedTask {

	/** The device group. */
	@Getter(onMethod = @__({
		@ManyToOne(fetch = FetchType.LAZY),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
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
	 * @param author the author
	 */
	public CheckGroupSoftwareTask(DeviceGroup group, String comments, String author) {
		super(comments, group.getName(), author);
		this.deviceGroup = group;
	}

	/*(non-Javadoc)
	 * @see net.netshot.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Group software compliance and hardware support check";
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
	}

	/*(non-Javadoc)
	 * @see net.netshot.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		CheckGroupSoftwareTask task = (CheckGroupSoftwareTask) super.clone();
		task.setDeviceGroup(this.deviceGroup);
		return task;
	}

	/*(non-Javadoc)
	 * @see net.netshot.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		log.debug("Task {}. Starting check software compliance and hardware support status task for group {}.",
			this.getId(), this.deviceGroup == null ? "null" : this.deviceGroup.getId());
		if (this.deviceGroup == null) {
			this.logger.info("The device group doesn't exist, the task will be cancelled.");
			this.status = Status.CANCELLED;
			return;
		}
		this.logger.trace("Check software compliance task for group {}.",
			this.deviceGroup.getName());

		Session session = Database.getSession();
		try {
			log.debug("Task {}. Retrieving the software rules", this.getId());
			List<SoftwareRule> softwareRules = session
				.createQuery("select sr from SoftwareRule sr order by sr.priority asc", SoftwareRule.class)
				.list();
			log.debug("Task {}. Retrieving the hardware rules", this.getId());
			List<HardwareRule> hardwareRules = session
				.createQuery("select hr from HardwareRule hr", HardwareRule.class)
				.list();

			session.beginTransaction();
			ScrollableResults<Device> devices = session
				.createQuery("select d from Device d join d.groupMemberships gm where gm.key.group.id = :id", Device.class)
				.setParameter("id", deviceGroup.getId())
				.setCacheMode(CacheMode.IGNORE)
				.scroll(ScrollMode.FORWARD_ONLY);
			while (devices.next()) {
				Device device = devices.get();
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
				session.persist(device);
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
				log.error("Task {}. Error during transaction rollback.", this.getId(), e1);
			}
			log.error("Task {}. Error while checking compliance.", this.getId(), e);
			this.logger.error("Error while checking compliance: {}", e.getMessage());
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
			String.format("CheckGroupSoftware_%d", this.getDeviceGroupId()));
	}

}
