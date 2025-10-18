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
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

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
import net.netshot.netshot.TaskManager;
import net.netshot.netshot.database.Database;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.DynamicDeviceGroup;
import net.netshot.netshot.device.script.RunDiagnosticCliScript;
import net.netshot.netshot.diagnostic.Diagnostic;
import net.netshot.netshot.rest.RestViews.DefaultView;
import net.netshot.netshot.rest.RestViews.HookView;
import net.netshot.netshot.work.DebugLog;
import net.netshot.netshot.work.Task;

/**
 * This task runs the diagnostics (if any is defined) on the specified device.
 */
@Entity
@OnDelete(action = OnDeleteAction.CASCADE)
@Slf4j
public final class RunDiagnosticsTask extends Task implements DeviceBasedTask {

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
	@Getter(onMethod = @__({
		@ManyToOne(fetch = FetchType.LAZY),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	private Device device;

	/** Do not automatically start a check compliance task. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(HookView.class)
	}))
	@Setter
	private boolean dontCheckCompliance;

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
	 * @param dontCheckCompliance Do not check compliance after these diagnostics
	 */
	public RunDiagnosticsTask(Device device, String comments, String author, boolean dontCheckCompliance) {
		super(comments, device.getLastConfig() == null ? device.getMgmtAddress().getIp() : device.getName(),
			author);
		this.device = device;
		this.dontCheckCompliance = dontCheckCompliance;
	}

	@Override
	@XmlElement
	@JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Device diagnostics";
	}

	/**
	 * Get the ID of the device.
	 * 
	 * @return the ID of the device
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Transient
	public long getDeviceId() {
		if (this.device == null) {
			return 0;
		}
		return this.device.getId();
	}

	/*(non-Javadoc)
	 * @see net.netshot.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		RunDiagnosticsTask task = (RunDiagnosticsTask) super.clone();
		task.setDevice(this.device);
		return task;
	}

	@Override
	public void run() {
		log.debug("Task {}. Starting diagnostic task for device {}.", this.getId(),
			device == null ? "null" : device.getId());
		if (device == null) {
			this.logger.info("The device doesn't exist, the task will be cancelled.");
			this.status = Status.CANCELLED;
			return;
		}
		boolean locked = false;

		Session session = Database.getSession();
		RunDiagnosticCliScript cliScript = null;
		try {
			session.beginTransaction();
			// Start over from a fresh device from DB
			device = session.get(Device.class, device.getId());
			this.logger.trace("Run diagnostic task for device {} ({}).",
				device.getName(), device.getMgmtAddress().getIp());
			if (device.getStatus() != Device.Status.INPRODUCTION) {
				log.trace("Task {}. Device not INPRODUCTION, stopping the diagnostic task.", this.getId());
				this.logger.warn("The device is not enabled (not in production).");
				this.status = Status.CANCELLED;
				return;
			}
			locked = checkRunningDiagnostic(device.getId());
			if (!locked) {
				log.trace("Task {}. A Diagnostic task already ongoing for this device, cancelling.", this.getId());
				this.logger.warn("A diagnostic task is already running for this device, cancelling this task.");
				this.status = Status.CANCELLED;
				return;
			}

			List<Diagnostic> diagnostics = session.createQuery(
				"select dg from Diagnostic dg join fetch dg.targetGroup tg where dg.enabled = :enabled and "
					+ "tg in (select gm.key.group from DeviceGroupMembership gm where gm.key.device = :device)",
				Diagnostic.class)
				.setParameter("device", device)
				.setParameter("enabled", true)
				.list();
			if (diagnostics.size() > 0) {
				cliScript = new RunDiagnosticCliScript(diagnostics, this.logger);
				cliScript.connectRun(session, device);
				session.merge(device);
				session.getTransaction().commit();
			}
			else {
				this.logger.info("No diagnostic was found that apply to this device.");
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
			this.logger.error("Error while executing the diagnostics: {}", message);
			this.status = Status.FAILURE;
			return;
		}
		finally {
			try {
				if (this.fullLogs != null) {
					this.debugLog = new DebugLog(this.fullLogs.toString());
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
				checkTask.setPriority(this.getPriority());
				TaskManager.addTask(checkTask);
			}
			catch (Exception e) {
				log.error("Task {}. Error while registering the new task.", this.getId(), e);
			}
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
			String.format("RunDevice_%d", this.getDeviceId()));
	}

	/*
	 * (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#getRunnerHash()
	 */
	@Override
	@Transient
	public long getRunnerHash() {
		return this.getDeviceId();
	}
}
