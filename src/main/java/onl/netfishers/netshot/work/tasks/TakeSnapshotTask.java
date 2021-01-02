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
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DynamicDeviceGroup;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.device.script.CliScript;
import onl.netfishers.netshot.device.script.SnapshotCliScript;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.DebugLog;
import onl.netfishers.netshot.work.Task;

import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task takes a snapshot of a device.
 */
@Entity
public class TakeSnapshotTask extends Task {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(TakeSnapshotTask.class);

	/** Allow trap from any IP of a device to trigger a automatic snapshot. */ 
	private static boolean AUTOSNAPSHOT_ANYIP = false;

	/** Minutes to wait before starting an automatic snapshot. */
	public static int AUTOSNAPSHOT_INTERVAL = 10;
	
	/** The scheduled automatic snapshots. */
	private static Set<Long> scheduledAutoSnapshots = ConcurrentHashMap.newKeySet();

	/** Device IDs on which a snapshot is currently running. */
	private static Set<Long> runningSnapshots = ConcurrentHashMap.newKeySet();
	
	/**
	 * Clear scheduled auto snapshot.
	 *
	 * @param deviceId the device
	 */
	public static void clearScheduledAutoSnapshot(Long deviceId) {
		scheduledAutoSnapshots.remove(deviceId);
	}

	/**
	 * Clear running snapshot status.
	 *
	 * @param deviceId the device
	 */
	public static void clearRunningSnapshot(Long deviceId) {
		runningSnapshots.remove(deviceId);
	}
	
	/**
	 * Check whether an automatic snapshot is queued for the given device.
	 *
	 * @param deviceId the device
	 * @return true, if successful
	 */
	public static boolean checkAutoSnasphot(Long deviceId) {
		return scheduledAutoSnapshots.add(deviceId);
	}

	/**
	 * Check whether a snapshot is currently running for the given device.
	 *
	 * @param deviceId the device
	 * @return true, if successful
	 */
	public static boolean checkRunningSnapshot(Long deviceId) {
		return runningSnapshots.add(deviceId);
	}

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

	/** The device. */
	private Device device;

	/** Automatic snapshot. */
	private boolean automatic = false;

	/** Do not automatically start a run diagnostics task */
	private boolean dontRunDiagnostics = false;

	/** Do not automatically start a check compliance task */
	private boolean dontCheckCompliance = false;

	/**
	 * Instantiates a new take snapshot task.
	 */
	protected TakeSnapshotTask() {
	}
	

	/**
	 * Instantiates a new take snapshot task.
	 * @param device The device to run the snapshot on
	 * @param comments Any comment about the task
	 * @param author The author of the task
	 * @param automatic Is it an automatic snapshot?
	 * @param dontRunDiagnostics Set to the true to disable running diagnostics
	 * @param dontCheckCompliance Set to true to disable compliance checking
	 */
	public TakeSnapshotTask(Device device, String comments, String author, boolean automatic,
			boolean dontRunDiagnostics, boolean dontCheckCompliance) {
		super(comments, (device.getLastConfig() == null ? device.getMgmtAddress().getIp() : device.getName()),
				author);
		this.device = device;
		this.automatic = automatic;
		this.dontRunDiagnostics = dontRunDiagnostics;
		this.dontCheckCompliance = dontCheckCompliance;
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
		logger.debug("Task {}. Starting snapshot task for device {}.", this.getId(), device.getId());
		this.info(String.format("Snapshot task for device %s (%s).",
				device.getName(), device.getMgmtAddress().getIp()));
		boolean locked = false;

		Session session = Database.getSession();
		CliScript cliScript = new SnapshotCliScript(this.debugEnabled);
		try {
			session.beginTransaction();
			session.refresh(device);
			if (device.getStatus() != Device.Status.INPRODUCTION) {
				logger.trace("Task {}. Device not INPRODUCTION, stopping the snapshot task.", this.getId());
				this.warn("The device is not enabled (not in production).");
				this.status = Status.FAILURE;
				return;
			}
			locked = checkRunningSnapshot(device.getId());
			if (!locked) {
				logger.trace("Task {}. Snapshot task already ongoing for this device, cancelling.", this.getId());
				this.warn("A snapshot task is already running for this device, cancelling this task.");
				this.status = Status.CANCELLED;
				return;
			}
			
			cliScript.connectRun(session, device);
			this.log.append(cliScript.getPlainJsLog());
			session.update(device);
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
			logger.error("Task {}. Error while taking the snapshot.", this.getId(), e);
			this.error("Error while taking the snapshot: " + e.getMessage());
			this.log.append(cliScript.getPlainJsLog());
			this.status = Status.FAILURE;
			return;
		}
		finally {
			try {
				if (this.debugEnabled) {
					this.debugLog = new DebugLog(cliScript.getPlainCliLog());
				}
			}
			catch (Exception e1) {
				logger.error("Task {}. Error while saving the debug logs.", this.getId(), e1);
			}
			session.close();
			if (locked) {
				clearRunningSnapshot(device.getId());
			}
			if (automatic) {
				clearScheduledAutoSnapshot(this.device.getId());
			}
		}

		logger.debug("Task {}. Request to refresh all the groups for the device after the snapshot.", this.getId());
		DynamicDeviceGroup.refreshAllGroups(device);

		if (!this.dontRunDiagnostics) {
			try {
				Task diagTask = new RunDiagnosticsTask(device, "Run diagnostics after device snapshot", "Auto", this.dontCheckCompliance);
				TaskManager.addTask(diagTask);
			}
			catch (Exception e) {
				logger.error("Task {}. Error while registering the diagnostic task.", this.getId(), e);
			}

		}
		else if (!this.dontCheckCompliance) {
			try {
				Task checkTask = new CheckComplianceTask(device, "Check compliance after device snapshot.", "Auto");
				TaskManager.addTask(checkTask);
			}
			catch (Exception e) {
				logger.error("Task {}. Error while registering the check compliance task.", this.getId(), e);
			}
		}
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@JsonView(DefaultView.class)
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
	 * Do wee need to bypass the diagnostics execution?
	 * @return true not to schedule the automatic diagnostics
	 */
	public boolean isDontRunDiagnostics() {
		return dontRunDiagnostics;
	}

	/**
	 * Enables or disables the automatic diagnostics after the snapshot.
	 * @param dontRunDiagnostics true to bypass the diagnostics
	 */
	public void setDontRunDiagnostics(boolean dontRunDiagnostics) {
		this.dontRunDiagnostics = dontRunDiagnostics;
	}

	/**
	 * Do we need to bypass the compliance check?
	 * 
	 * @return true not to schedule the automatic compliance check
	 */
	public boolean isDontCheckCompliance() {
		return dontCheckCompliance;
	}

	/**
	 * Enables or disables the automatic compliance check.
	 * @param dontCheckCompliance true to bypass the compliance check
	 */
	public void setDontCheckCompliance(boolean dontCheckCompliance) {
		this.dontCheckCompliance = dontCheckCompliance;
	}

	/**
	 * Get the ID of the device
	 * 
	 * @return the ID of the device
	 */
	@XmlElement
	@JsonView(DefaultView.class)
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
					.setParameter("ip", address.getAddress())
					.uniqueResult();
			if (device == null && AUTOSNAPSHOT_ANYIP) {
				logger.warn("No device with such management IP {} in the database. Looking for this address in the interface table.",
						address.getIp());
				device = (Device) session
						.createQuery("select d from Device d join d.networkInterfaces ni join ni.ip4Addresses a where d.status = :inprod and a.address = :ip")
						.setParameter("inprod", Device.Status.INPRODUCTION)
						.setParameter("ip", address.getAddress())
						.uniqueResult();
			}
			if (device == null) {
				logger.warn("No device with such IP address {} in the database.", address.getIp());
				return false;
			}
			if (!drivers.contains(device.getDriver())) {
				logger.warn("The driver {} of the device {} in database isn't in the list of drivers requesting a snapshot (address {}).",
						device.getDriver(), device.getId(), device.getMgmtAddress());
				return false;
			}
			if (!checkAutoSnasphot(device.getId())) {
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
			Task snapshot = new TakeSnapshotTask(device, "Automatic snapshot after config change", "Auto", true, false, false);
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
			checkAutoSnasphot(device.getId());
		}
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#onCancel()
	 */
	@Override
	public void onCancel() {
		clearScheduledAutoSnapshot(this.device.getId());
	}

	/*
	 * (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getIdentity()
	 */
	@Override
	@Transient
	public JobKey getIdentity() {
		return new JobKey(String.format("Task_%d", this.getId()), 
				String.format("RunDevice_%d", this.getDevice().getId()));
	}

}
