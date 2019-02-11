package onl.netfishers.netshot.work.tasks;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DynamicDeviceGroup;
import onl.netfishers.netshot.device.script.RunDiagnosticCliScript;
import onl.netfishers.netshot.diagnostic.Diagnostic;
import onl.netfishers.netshot.work.DebugLog;
import onl.netfishers.netshot.work.Task;

/**
 * This task runs the diagnostics (if any is defined) on the specified device.
 */
@Entity
public class RunDiagnosticsTask extends Task {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(RunDiagnosticsTask.class);

	/** Device IDs on which diagnostics are currently being executed. */
	private static Set<Long> runningDiagnostics = ConcurrentHashMap.newKeySet();
	


	/**
	 * Check whether diagnostics are currently being executed on the the given device.
	 *
	 * @param deviceId the device
	 * @return true, if successful
	 */
	public static boolean checkRunningDiagnostic(Long deviceId) {
		return runningDiagnostics.add(deviceId);
	}

	/**
	 * Clear running diagnostic status.
	 *
	 * @param deviceId the device
	 */
	public static void clearRunningDiagnostic(Long deviceId) {
		runningDiagnostics.remove(deviceId);
	}

	/** The device. */
	private Device device;
	
	/**
	 * Instantiate a new RunDiagnosticTask (for Hibernate).
	 */
	protected RunDiagnosticsTask() {
	}
	
	/**
	 * Instantiate a new RunDiagnosticTask.
	 * @param device The device to run the task on
	 * @param comments Any commends about this task
	 * @param author Who requested that task
	 */
	public RunDiagnosticsTask(Device device, String comments, String author) {
		super(comments, (device.getLastConfig() == null ? device.getMgmtAddress().getIp() : device.getName()),
				author);
		this.device = device;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#prepare()
	 */
	@Override
	public void prepare() {
		Hibernate.initialize(device);
		Hibernate.initialize(device.getDiagnosticResults());
	}
	
	@Override
	@XmlElement
	@Transient
	public String getTaskDescription() {
		return "Diagnostics on a device";
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
		RunDiagnosticsTask task = (RunDiagnosticsTask) super.clone();
		task.setDevice(this.device);
		return task;
	}
	
	

	@Override
	public void run() {
		logger.debug("Starting diagnostic task for device {}.", device.getId());
		this.trace(String.format("Run diagnostic task for device %s (%s).",
				device.getName(), device.getMgmtAddress().getIp()));
		boolean locked = false;
		
		RunDiagnosticCliScript cliScript = null;

		Session session = Database.getSession();
		try {
			session.beginTransaction();
			session.refresh(device);
			if (device.getStatus() != Device.Status.INPRODUCTION) {
				logger.trace("Device not INPRODUCTION, stopping the diagnostic task.");
				this.warn("The device is not enabled (not in production).");
				this.status = Status.FAILURE;
				return;
			}
			locked = checkRunningDiagnostic(device.getId());
			if (!locked) {
				logger.trace("A Diagnostic task already ongoing for this device, cancelling.");
				this.warn("A diagnostic task is already running for this device, cancelling this task.");
				this.status = Status.CANCELLED;
				return;
			}
			

			@SuppressWarnings("unchecked")
			List<Diagnostic> diagnostics = session.createQuery(
					"select distinct dg from Device d left join d.ownerGroups g left join g.diagnostics dg where d = :device and dg.enabled = :enabled")
				.setEntity("device", device)
				.setBoolean("enabled", true)
				.list();
			if (diagnostics.size() > 0) {
				cliScript = new RunDiagnosticCliScript(diagnostics, this.debugEnabled);
				cliScript.connectRun(session, device);
				this.log.append(cliScript.getPlainJsLog());
				session.update(device);
				session.getTransaction().commit();
			}
			this.status = Status.SUCCESS;
			
		}
		catch (Exception e) {
			session.getTransaction().rollback();
			logger.error("Error while executing the diagnostics.", e);
			this.error("Error while executing the diagnostics: " + e.getMessage());
			if (cliScript != null) {
				this.log.append(cliScript.getPlainJsLog());
			}
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
				logger.error("Error while saving the debug logs.", e1);
			}
			session.close();
			if (locked) {
				clearRunningDiagnostic(device.getId());
			}
		}

		logger.debug("Request to refresh all the groups for the device after the diagnostics.");
		DynamicDeviceGroup.refreshAllGroups(device);

		try {
			Task checkTask = new CheckComplianceTask(device, "Check compliance after device diagnostics.", "Auto");
			TaskManager.addTask(checkTask);
		}
		catch (Exception e) {
			logger.error("Error while registering the new task.", e);
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
				String.format("RunDevice_%d", this.getDevice().getId()));
	}
}
