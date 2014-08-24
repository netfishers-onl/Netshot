/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.work.tasks;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.hibernate.criterion.Property;
import org.netshot.Netshot;
import org.netshot.NetshotDatabase;
import org.netshot.NetshotTaskManager;
import org.netshot.device.Device;
import org.netshot.device.DynamicDeviceGroup;
import org.netshot.device.Network4Address;
import org.netshot.work.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task takes a snapshot of a device.
 */
@Entity
public class TakeSnapshotTask extends Task {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(TakeSnapshotTask.class);
	
	/** The scheduled auto snapshots. */
	private static Set<Long> scheduledAutoSnapshots = new HashSet<Long>();
	
	/** The running snapshots. */
	private static Set<Long> runningSnapshots = new HashSet<Long>();
	
	private static boolean anyipAutoSnapshot = false;
	
	static {
		if (Netshot.getConfig("netshot.snmptrap.anyip", "false").equals("true")) {
			anyipAutoSnapshot = true;
		}
	}
	
	/**
	 * Check auto snaphot.
	 *
	 * @param device the device
	 * @return true, if successful
	 */
	private static boolean checkAutoSnaphot(Long device) {
		synchronized (TakeSnapshotTask.scheduledAutoSnapshots) {
			return TakeSnapshotTask.scheduledAutoSnapshots.add(device);
		}
	}
	
	/**
	 * Check running snapshot.
	 *
	 * @param device the device
	 * @return true, if successful
	 */
	private static boolean checkRunningSnapshot(Long device) {
		synchronized (TakeSnapshotTask.runningSnapshots) {
	    return TakeSnapshotTask.runningSnapshots.add(device);
    }
	}
	
	/**
	 * Clear scheduled auto snapshot.
	 *
	 * @param device the device
	 */
	private static void clearScheduledAutoSnapshot(Long device) {
		synchronized (TakeSnapshotTask.scheduledAutoSnapshots) {
			TakeSnapshotTask.scheduledAutoSnapshots.remove(device);
		}
	}
	
	/**
	 * Clear running snapshot.
	 *
	 * @param device the device
	 */
	private static void clearRunningSnapshot(Long device) {
		synchronized (TakeSnapshotTask.runningSnapshots) {
	    TakeSnapshotTask.runningSnapshots.remove(device);
    }
	}
	
	/** The Constant AUTOSNAPSHOT_INTERVAL. */
	public static final int AUTOSNAPSHOT_INTERVAL = 10;
	
	/** The device. */
	private Device device;
	
	/** Automatic snapshot. */
	private boolean automatic = false;

	/**
	 * Instantiates a new take snapshot task.
	 */
	protected TakeSnapshotTask() {
	}

	/**
	 * Instantiates a new take snapshot task.
	 *
	 * @param device the device
	 * @param comments the comments
	 */
	public TakeSnapshotTask(Device device, String comments) {
		super(comments, (device.getLastConfig() == null ? device.getMgmtAddress().getIP() : device.getName()));
		this.device = device;
	}
	
	public TakeSnapshotTask(Device device, String comments, boolean automatic) {
		this(device, comments);
		this.automatic = automatic;
	}

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#prepare()
	 */
	@Override
	public void prepare() {
		Hibernate.initialize(this.getDevice());
		Hibernate.initialize(this.getDevice().getLastConfig());
	}
	
	/* (non-Javadoc)
	 * @see org.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		logger.debug("Starting snapshot task for device {}.", device.getId());
		this.logIt(String.format("Snapshot task for device %s (%s).",
		    device.getName(), device.getMgmtAddress().getIP()), 5);

		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			session.refresh(device);
			if (device.getStatus() != Device.Status.INPRODUCTION) {
				logger.trace("Device not INPRODUCTION, stopping the snapshot task.");
				this.logIt("The device is not enabled (in production).", 2);
				this.status = Status.FAILURE;
				return;
			}
			if (!TakeSnapshotTask.checkRunningSnapshot(device.getId())) {
				logger.trace("Snapshot task already ongoing for this device, cancelling.");
				this.logIt("A snapshot task is already running for this device, cancelling this task.", 2);
				this.status = Status.CANCELLED;
				return;
			}
			
			device.takeSnapshot();
			this.logIt(
			    String.format("Device logs (%d next lines):", device.getLog().size()),
			    3);
			this.log.append(device.getPlainLog());
			session.update(device);
			session.getTransaction().commit();
			
			if (Netshot.getConfig("netshot.snapshots.dump") != null) {
				try {
					device.getLastConfig().writeToFile();
					this.logIt("Configuration saved to file", 3);
				}
				catch (Exception e) {
					this.logIt("Can't save the configuration to a file. " + e.getMessage(), 2);
				}
			}
			this.status = Status.SUCCESS;
		}
		catch (Exception e) {
			session.getTransaction().rollback();
			logger.error("Error while taking the snapshot.", e);
			this.logIt("Error while taking the snapshot: " + e.getMessage(), 3);
			this.logIt(
			    String.format("Device logs (%d next lines):", device.getLog().size()),
			    3);
			this.log.append(device.getPlainLog());
			this.status = Status.FAILURE;
			return;
		}
		finally {
			TakeSnapshotTask.clearRunningSnapshot(device.getId());
			if (automatic) {
				TakeSnapshotTask.clearScheduledAutoSnapshot(this.device.getId());
			}
			session.close();
		}
		
		logger.debug("Request to refresh all the groups for the device after the snapshot.");
		DynamicDeviceGroup.refreshAllGroups(device);
		
		try {
			Task checkTask = new CheckComplianceTask(device, "Check compliance after snapshot.");
      NetshotTaskManager.addTask(checkTask);
    }
    catch (Exception e) {
    	logger.error("Error while registering the new task.", e);
    }
		
	}

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@Transient
	public String getTaskDescription() {
		return "Take Snapshot";
	}

	/**
	 * Gets the device.
	 *
	 * @return the device
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	protected Device getDevice() {
		return device;
	}
	
	protected boolean isAutomatic() {
		return automatic;
	}

	protected void setAutomatic(boolean automatic) {
		this.automatic = automatic;
	}

	@XmlElement
	@Transient
	protected long getDeviceId() {
		return device.getId();
	}

	/**
	 * Sets the device.
	 *
	 * @param device the new device
	 */
	protected void setDevice(Device device) {
		this.device = device;
	}
	
	/* (non-Javadoc)
	 * @see org.netshot.work.Task#clone()
	 */
	@Override
  public Object clone() throws CloneNotSupportedException {
	  TakeSnapshotTask task = (TakeSnapshotTask) super.clone();
	  task.setDevice(this.device);
	  return task;
  }
	
	/**
	 * Take snapshot if needed.
	 *
	 * @param deviceClass the device class
	 * @param address the address
	 * @return true, if successful
	 */
	public static boolean takeSnapshotIfNeeded(Class<? extends Device> deviceClass,
			Network4Address address) {
		logger.debug("Request to take a snapshot of device with IP {}, class {}, if necessary.",
				address.getIP(), deviceClass.getName());
		Device device;
		Session session = NetshotDatabase.getSession();
		try {
			logger.trace("Retrieving the device.");
			device = (Device) session.createCriteria(deviceClass, "d")
				.add(Property.forName("d.mgmtAddress.address").eq(address.getAddress()))
				.add(Property.forName("d.status").eq(Device.Status.INPRODUCTION))
				.uniqueResult();
			if (device == null && anyipAutoSnapshot) {
				logger.warn("No device with such management IP {} in the database (class {}). Looking for this address in the interface table.",
						address.getIP(), deviceClass.getName());
				device = (Device) session
						.createQuery(
								String.format("select d from %s d join d.networkInterfaces ni join ni.ip4Addresses a where d.status = :inprod and a.address = :ip",
								deviceClass.getName()))
						.setParameter("inprod", Device.Status.INPRODUCTION)
						.setInteger("ip", address.getAddress())
						.uniqueResult();
			}
			if (device == null) {
				logger.warn("No device with such IP address {} in the database.", address.getIP());
				return false;
			}
			if (!TakeSnapshotTask.checkAutoSnaphot(device.getId())) {
				logger.debug("A snapshot task is already scheduled.");
				return true;
			}
		}
		catch (Exception e) {
			logger.error("Error while checking whether the snapshot is needed or not.", e);
			return true;
		}
		finally {
			session.close();
		}
		try {
			Task snapshot = new TakeSnapshotTask(device, "Automatic snapshot after config change", true);
			snapshot.schedule(TakeSnapshotTask.AUTOSNAPSHOT_INTERVAL);
			NetshotTaskManager.addTask(snapshot);
		}
		catch (Exception e) {
			logger.error("Error while scheduling the automatic snapshot.", e);
		}
		return true;
	}
	
	/* (non-Javadoc)
	 * @see org.netshot.work.Task#onSchedule()
	 */
	@Override
	public void onSchedule() {
		if (automatic) {
			TakeSnapshotTask.checkAutoSnaphot(device.getId());
		}
	}
	
	/* (non-Javadoc)
	 * @see org.netshot.work.Task#onCancel()
	 */
	@Override
	public void onCancel() {
		TakeSnapshotTask.clearScheduledAutoSnapshot(this.device.getId());
	}

}
