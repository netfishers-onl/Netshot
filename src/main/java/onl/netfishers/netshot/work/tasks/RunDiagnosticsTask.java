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

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.quartz.JobKey;

import onl.netfishers.netshot.database.Database;
import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DynamicDeviceGroup;
import onl.netfishers.netshot.device.script.RunDiagnosticCliScript;
import onl.netfishers.netshot.diagnostic.Diagnostic;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.rest.RestViews.HookView;
import onl.netfishers.netshot.work.DebugLog;
import onl.netfishers.netshot.work.Task;

/**
 * This task runs the diagnostics (if any is defined) on the specified device.
 */
@Entity
@Slf4j
public class RunDiagnosticsTask extends Task implements DeviceBasedTask {

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
	@Getter(onMethod=@__({
		@ManyToOne(fetch = FetchType.LAZY)
	}))
	@Setter
	private Device device;

	/** Do not automatically start a check compliance task */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(HookView.class)
	}))
	@Setter
	private boolean dontCheckCompliance = false;
	
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
	public RunDiagnosticsTask(Device device, String comments, String author, boolean dontCheckCompliance) {
		super(comments, (device.getLastConfig() == null ? device.getMgmtAddress().getIp() : device.getName()),
				author);
		this.device = device;
		this.dontCheckCompliance = dontCheckCompliance;
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
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Device diagnostics";
	}

	/**
	 * Get the ID of the device
	 * 
	 * @return the ID of the device
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public long getDeviceId() {
		return device.getId();
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
		log.debug("Task {}. Starting diagnostic task for device {}.",
				this.getId(), device.getId());
		this.trace(String.format("Run diagnostic task for device %s (%s).",
				device.getName(), device.getMgmtAddress().getIp()));
		boolean locked = false;
		
		RunDiagnosticCliScript cliScript = null;

		Session session = Database.getSession();
		try {
			session.beginTransaction();
			session.refresh(device);
			if (device.getStatus() != Device.Status.INPRODUCTION) {
				log.trace("Task {}. Device not INPRODUCTION, stopping the diagnostic task.", this.getId());
				this.warn("The device is not enabled (not in production).");
				this.status = Status.FAILURE;
				return;
			}
			locked = checkRunningDiagnostic(device.getId());
			if (!locked) {
				log.trace("Task {}. A Diagnostic task already ongoing for this device, cancelling.", this.getId());
				this.warn("A diagnostic task is already running for this device, cancelling this task.");
				this.status = Status.CANCELLED;
				return;
			}

			@SuppressWarnings("unchecked")
			List<Diagnostic> diagnostics = session.createQuery(
				"select distinct dg from Diagnostic dg where dg.enabled = :enabled and dg.targetGroup in (select g from Device d join d.ownerGroups g where d = :device)")
				.setParameter("device", device)
				.setParameter("enabled", true)
				.list();
			if (diagnostics.size() > 0) {
				cliScript = new RunDiagnosticCliScript(diagnostics, this.debugEnabled);
				cliScript.connectRun(session, device);
				this.logs.append(cliScript.getPlainJsLog());
				session.update(device);
				session.getTransaction().commit();
			}
			this.status = Status.SUCCESS;
			
		}
		catch (Exception e) {
			try {
				session.getTransaction().rollback();
			}
			catch (Exception e1) {
				log.error("Task {}. Error during transaction rollback.", this.getId(), e1);
			}
			log.error("Task {}. Error while executing the diagnostics.", this.getId(), e);
			String message = e.getMessage();
			if (e.getCause() != null && e.getCause().getCause() != null) {
				// Add SQL error if possible
				message += " / " + e.getCause().getCause().getMessage();
			}
			this.error("Error while executing the diagnostics: " + message);
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
				log.error("Task {}. Error while saving the debug logs.", this.getId(), e1);
			}
			session.close();
			if (locked) {
				clearRunningDiagnostic(device.getId());
			}
		}

		log.debug("Task {}. Request to refresh all the groups for the device after the diagnostics.", this.getId());
		DynamicDeviceGroup.refreshAllGroups(device);

		if (!this.dontCheckCompliance) {
			try {
				Task checkTask = new CheckComplianceTask(device, "Check compliance after device diagnostics", "Auto");
				TaskManager.addTask(checkTask);
			}
			catch (Exception e) {
				log.error("Task {}. Error while registering the new task.", this.getId(), e);
			}
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

	/*
	 * (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getRunnerHash()
	 */
	@Override
	@Transient
	public long getRunnerHash() {
		return this.getDeviceId();
	}
}
