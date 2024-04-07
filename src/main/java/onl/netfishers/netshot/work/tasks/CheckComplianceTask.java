/**
 * Copyright 2013-2024 Netshot
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

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import onl.netfishers.netshot.database.Database;
import onl.netfishers.netshot.compliance.HardwareRule;
import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.SoftwareRule;
import onl.netfishers.netshot.compliance.SoftwareRule.ConformanceLevel;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.Task;
import onl.netfishers.netshot.work.TaskLogger;

import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.quartz.JobKey;

/**
 * This task checks the configuration compliance of a device.
 */
@Entity
@Slf4j
public class CheckComplianceTask extends Task implements DeviceBasedTask {

	/** The device. */
	@Getter(onMethod=@__({
		@ManyToOne(fetch = FetchType.LAZY)
	}))
	@Setter
	private Device device;

	/**
	 * Instantiates a new check compliance task.
	 */
	protected CheckComplianceTask() {
	}

	/**
	 * Instantiates a new check compliance task.
	 *
	 * @param device the device
	 * @param comments the comments
	 */
	public CheckComplianceTask(Device device, String comments, String author) {
		super(comments, (device.getLastConfig() == null ? device.getMgmtAddress().getIp() : device.getName()), author);
		this.device = device;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#prepare()
	 */
	@Override
	public void prepare() {
		Hibernate.initialize(device);
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		log.debug("Task {}. Starting check compliance task for device {}.", this.getId(), device.getId());
		this.trace(String.format("Check compliance task for device %s (%s).",
				device.getName(), device.getMgmtAddress().getIp()));

		Session session = Database.getSession();
		try {
			session.beginTransaction();
			session
				.createQuery("delete from CheckResult c where c.key.device.id = :id")
				.setParameter("id", this.device.getId())
				.executeUpdate();
			session.refresh(this.device);
			if (this.device.getLastConfig() == null) {
				log.info("Task {}. Unable to fetch the device with its last config... has it been captured at least once?",
						this.getId());
				throw new Exception("No last config for this device. Has it been captured at least once?");
			}
			List<Policy> policies = session
				.createQuery("select distinct p from Policy p join p.targetGroups g join g.cachedDevices d with d.id = :id", Policy.class)
				.setParameter("id", this.device.getId())
				.list();

			TaskLogger taskLogger = this.getJsLogger();
			taskLogger.info(String.format("Checking configuration compliance of device %s (%d)...",
				this.device.getName(), this.device.getId()));
			for (Policy policy : policies) {
				policy.check(device, session, taskLogger);
			}
			session.save(this.device);
			session.flush();
			List<SoftwareRule> softwareRules = session
				.createQuery("select sr from SoftwareRule sr where (sr.targetGroup is null) or sr.targetGroup in (select g from DeviceGroup g join g.cachedDevices d with d.id = :id) order by sr.priority asc", SoftwareRule.class)
				.setParameter("id", this.device.getId())
				.list();
			device.setSoftwareLevel(ConformanceLevel.UNKNOWN);
			for (SoftwareRule rule : softwareRules) {
				rule.check(device);
				if (device.getSoftwareLevel() != ConformanceLevel.UNKNOWN) {
					break;
				}
			}
			session.save(this.device);
			List<HardwareRule> hardwareRules = session
				.createQuery("select hr from HardwareRule hr", HardwareRule.class)
				.list();
			device.resetEoX();
			for (HardwareRule rule : hardwareRules) {
				rule.check(device);
			}
			session.save(device);
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

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Device compliance check";
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		CheckComplianceTask task = (CheckComplianceTask) super.clone();
		task.setDevice(this.device);
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
				String.format("CheckCompliance_%d", this.getDevice().getId()));
	}

	/*
	 * (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getRunnerHash()
	 */
	@Override
	@Transient
	public long getRunnerHash() {
		Device device = this.getDevice();
		if (device == null) {
			return 0;
		}
		return device.getId();
	}

}
