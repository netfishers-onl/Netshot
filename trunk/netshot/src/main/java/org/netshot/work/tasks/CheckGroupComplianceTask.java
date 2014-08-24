/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.work.tasks;

import java.util.List;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import org.hibernate.CacheMode;
import org.hibernate.Hibernate;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.Session;
import org.netshot.NetshotDatabase;
import org.netshot.compliance.Policy;
import org.netshot.device.Device;
import org.netshot.device.DeviceGroup;
import org.netshot.work.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task checks the configuration compliance status of a group of devices.
 */
@Entity
public class CheckGroupComplianceTask extends Task {
	
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(CheckGroupComplianceTask.class);
	
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
	public CheckGroupComplianceTask(DeviceGroup group, String comments) {
		super(comments, group.getName());
		this.deviceGroup = group;
	}

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@Transient
	public String getTaskDescription() {
		return "Group compliance check";
	}
	
	/* (non-Javadoc)
	 * @see org.netshot.work.Task#prepare()
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
	 * @see org.netshot.work.Task#clone()
	 */
	@Override
  public Object clone() throws CloneNotSupportedException {
	  CheckGroupComplianceTask task = (CheckGroupComplianceTask) super.clone();
	  task.setDeviceGroup(this.deviceGroup);
	  return task;
  }

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		logger.debug("Starting check compliance task for group {}.", deviceGroup.getId());
		this.logIt(String.format("Check compliance task for group %s.",
		    deviceGroup.getName()), 5);
		
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
      List<Policy> policies = session.createCriteria(Policy.class).list();
			
			session.beginTransaction();
			session
				.createQuery("delete from CheckResult c where c.key.device.id in (select d.id as id from DeviceGroup g1 join g1.cachedDevices d where g1.id = :id)")
				.setLong("id", deviceGroup.getId())
				.executeUpdate();
			for (Policy policy : policies) {
	      ScrollableResults devices = session
						.createQuery("from Device d join fetch d.lastConfig where d.id in (select d.id as id from DeviceGroup g1 join g1.cachedDevices d join d.ownerGroups g2 join g2.appliedPolicies p where g1.id = :id and p.id = :pid)")
						.setLong("id", deviceGroup.getId())
						.setLong("pid", policy.getId())
						.setCacheMode(CacheMode.IGNORE)
						.scroll(ScrollMode.FORWARD_ONLY);
				while (devices.next()) {
					Device device = (Device) devices.get(0);
					policy.check(device, session);
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
				
			}
			logger.error("Error while checking compliance.", e);
			this.logIt("Error while checking compliance: " + e.getMessage(), 2);
			this.status = Status.FAILURE;
			return;
		}
		finally {
			session.close();
		}
	}

}
