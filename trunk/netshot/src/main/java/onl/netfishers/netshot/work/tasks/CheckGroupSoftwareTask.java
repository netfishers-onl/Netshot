/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.work.tasks;

import java.util.List;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.compliance.HardwareRule;
import onl.netfishers.netshot.compliance.SoftwareRule;
import onl.netfishers.netshot.compliance.SoftwareRule.ConformanceLevel;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.work.Task;

import org.hibernate.CacheMode;
import org.hibernate.Hibernate;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.Session;
import org.hibernate.criterion.Property;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task checks the compliance of the software version of a given group
 * of devices.
 */
@Entity
public class CheckGroupSoftwareTask extends Task {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(CheckGroupSoftwareTask.class);

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
	@XmlElement
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
		logger.debug("Starting check software compliance and hardware support status task for group {}.", deviceGroup.getId());
		this.logIt(String.format("Check software compliance task for group %s.",
				deviceGroup.getName()), 5);

		Session session = Database.getSession();
		try {
			logger.debug("Retrieving the software rules");
			@SuppressWarnings("unchecked")
			List<SoftwareRule> softwareRules = session.createCriteria(SoftwareRule.class)
			.addOrder(Property.forName("priority").asc()).list();
			logger.debug("Retrieving the hardware rules");
			@SuppressWarnings("unchecked")
			List<HardwareRule> hardwareRules = session.createCriteria(HardwareRule.class).list();

			session.beginTransaction();
			ScrollableResults devices = session
					.createQuery("select d from DeviceGroup g join g.cachedDevices d where g.id = :id")
					.setLong("id", deviceGroup.getId())
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
