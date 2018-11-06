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

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DynamicDeviceGroup;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.work.DebugLog;
import onl.netfishers.netshot.work.Task;

import org.hibernate.Hibernate;
import org.hibernate.Session;
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

	private static boolean AUTOSNAPSHOT_ANYIP = false;

	public static int AUTOSNAPSHOT_INTERVAL = 10;

	static {
		if (Netshot.getConfig("netshot.snapshots.auto.anyip", "false").equals("true")) {
			AUTOSNAPSHOT_ANYIP = true;
		}
		try {
			int interval = Integer.parseInt(Netshot.getConfig("netshot.snapshots.auto.interval", "10"));
			if (interval < 1) {
				throw new Exception();
			}
			AUTOSNAPSHOT_INTERVAL = interval;
		}
		catch (Exception e) {
			logger.error("Invalid value for netshot.snapshots.auto.interval in the configuration file. Using default of {} minutes.",
					AUTOSNAPSHOT_INTERVAL);
		}
	}

	/**
	 * Check auto snapshot.
	 *
	 * @param device the device
	 * @return true, if successful
	 */
	private static boolean checkAutoSnasphot(Long device) {
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
	public TakeSnapshotTask(Device device, String comments, String author) {
		super(comments, (device.getLastConfig() == null ? device.getMgmtAddress().getIp() : device.getName()),
				author);
		this.device = device;
	}

	public TakeSnapshotTask(Device device, String comments, String author, boolean automatic) {
		this(device, comments, author);
		this.automatic = automatic;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#prepare()
	 */
	@Override
	public void prepare() {
		Hibernate.initialize(this.getDevice());
		Hibernate.initialize(this.getDevice().getLastConfig());
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		logger.debug("Starting snapshot task for device {}.", device.getId());
		this.logIt(String.format("Snapshot task for device %s (%s).",
				device.getName(), device.getMgmtAddress().getIp()), 5);

		Session session = Database.getSession();
		try {
			session.beginTransaction();
			session.refresh(device);
			if (device.getStatus() != Device.Status.INPRODUCTION) {
				logger.trace("Device not INPRODUCTION, stopping the snapshot task.");
				this.logIt("The device is not enabled (not in production).", 2);
				this.status = Status.FAILURE;
				return;
			}
			if (!TakeSnapshotTask.checkRunningSnapshot(device.getId())) {
				logger.trace("Snapshot task already ongoing for this device, cancelling.");
				this.logIt("A snapshot task is already running for this device, cancelling this task.", 2);
				this.status = Status.CANCELLED;
				return;
			}

			device.takeSnapshot(this.debugEnabled);
			this.logIt(String.format("Device logs (%d next lines):", device.getLog().size()), 3);
			this.log.append(device.getPlainLog());
			session.update(device);
			session.getTransaction().commit();
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
			try {
				if (this.debugEnabled) {
					this.debugLog = new DebugLog(device.getPlainSessionDebugLog());
				}
			}
			catch (Exception e1) {
				logger.error("Error while saving the debug logs.", e1);
			}
			TakeSnapshotTask.clearRunningSnapshot(device.getId());
			if (automatic) {
				TakeSnapshotTask.clearScheduledAutoSnapshot(this.device.getId());
			}
			session.close();
		}

		logger.debug("Request to refresh all the groups for the device after the snapshot.");
		DynamicDeviceGroup.refreshAllGroups(device);

		try {
			Task checkTask = new CheckComplianceTask(device, "Check compliance after snapshot.", "Auto");
			TaskManager.addTask(checkTask);
		}
		catch (Exception e) {
			logger.error("Error while registering the new task.", e);
		}

	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@Transient
	public String getTaskDescription() {
		return "Device snapshot";
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

	/**
	 * Is this an automatic snapshot?
	 * 
	 * @return true if this is an automatic snapshot
	 */
	protected boolean isAutomatic() {
		return automatic;
	}

	/**
	 * Set the snapshot as automatic
	 * 
	 * @param automatic true if automatic
	 */
	protected void setAutomatic(boolean automatic) {
		this.automatic = automatic;
	}

	/**
	 * Get the ID of the device
	 * 
	 * @return the ID of the device
	 */
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
	 * @see onl.netfishers.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		TakeSnapshotTask task = (TakeSnapshotTask) super.clone();
		task.setDevice(this.device);
		return task;
	}

	public static boolean scheduleSnapshotIfNeeded(List<String> drivers, Network4Address address) {
		logger.debug("Request to take a snapshot of device with IP {}, if necessary.",
				address.getIp());
		Device device;
		Session session = Database.getSession();
		try {
			logger.trace("Retrieving the device.");
			device = (Device) session.createQuery("select d from Device d where d.status = :inprod and d.mgmtAddress.address = :ip")
					.setParameter("inprod", Device.Status.INPRODUCTION)
					.setInteger("ip", address.getAddress())
					.uniqueResult();
			if (device == null && AUTOSNAPSHOT_ANYIP) {
				logger.warn("No device with such management IP {} in the database. Looking for this address in the interface table.",
						address.getIp());
				device = (Device) session
						.createQuery("select d from Device d join d.networkInterfaces ni join ni.ip4Addresses a where d.status = :inprod and a.address = :ip")
						.setParameter("inprod", Device.Status.INPRODUCTION)
						.setInteger("ip", address.getAddress())
						.uniqueResult();
			}
			if (device == null) {
				logger.warn("No device with such IP address {} in the database.", address.getIp());
				return false;
			}
			if (!drivers.contains(device.getDriver())) {
				logger.warn("The driver {} of the device {} in database isn't in the list of drivers asking for a snapshot (address {}).",
						device.getDriver(), device.getId(), device.getMgmtAddress());
				return false;
			}
			if (!TakeSnapshotTask.checkAutoSnasphot(device.getId())) {
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
			Task snapshot = new TakeSnapshotTask(device, "Automatic snapshot after config change", "Auto", true);
			snapshot.schedule(TakeSnapshotTask.AUTOSNAPSHOT_INTERVAL);
			TaskManager.addTask(snapshot);
		}
		catch (Exception e) {
			logger.error("Error while scheduling the automatic snapshot.", e);
		}
		return true;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#onSchedule()
	 */
	@Override
	public void onSchedule() {
		if (automatic) {
			TakeSnapshotTask.checkAutoSnasphot(device.getId());
		}
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#onCancel()
	 */
	@Override
	public void onCancel() {
		TakeSnapshotTask.clearScheduledAutoSnapshot(this.device.getId());
	}

}
