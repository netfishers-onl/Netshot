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

import java.util.Map;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Transient;
import jakarta.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.database.Database;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.DeviceDriver;
import net.netshot.netshot.device.script.JsCliScript;
import net.netshot.netshot.rest.RestViews.DefaultView;
import net.netshot.netshot.work.Task;

import org.hibernate.Session;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;
import org.quartz.JobKey;

/**
 * This task runs a JS script on a device.
 */
@Entity
@OnDelete(action = OnDeleteAction.CASCADE)
@Slf4j
public class RunDeviceScriptTask extends Task implements DeviceBasedTask {

	/** The device. */
	@Getter(onMethod=@__({
		@ManyToOne(fetch = FetchType.LAZY),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	private Device device;
	
	/** The JS script to execute */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String script;
	
	/** Compatible device driver */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String deviceDriver;

	/** Variable values for the script */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@JdbcTypeCode(SqlTypes.JSON)
	}))
	@Setter
	private Map<String, String> userInputValues = null;

	/**
	 * Instantiates a new RunDeviceScriptTask task.
	 */
	protected RunDeviceScriptTask() {
	}

	/**
	 * Instantiates a new RunDeviceScriptTask task.
	 *
	 * @param device the device
	 * @param comments the comments
	 */
	public RunDeviceScriptTask(Device device, String script, DeviceDriver driver, String comments, String author) {
		super(comments, (device.getLastConfig() == null ? device.getMgmtAddress().getIp() : device.getName()),
				author);
		this.device = device;
		this.script = script;
		this.deviceDriver = driver.getName();
	}

	@Override
	public void run() {
		log.debug("Task {}. Starting script task for device {}.", this.getId(),
				device == null ? "null" : device.getId());
		if (device == null) {
			this.info("The device doesn't exist, the task will be cancelled.");
			this.status = Status.CANCELLED;
			return;
		}

		JsCliScript cliScript = null;
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			// Start over from a fresh device from DB
			device = session.get(Device.class, device.getId());
			this.info(String.format("Run script task for device %s (%s).",
					device.getName(), device.getMgmtAddress().getIp()));
			if (deviceDriver == null || !deviceDriver.equals(device.getDriver())) {
				log.trace("Task {}. The script doesn't apply to the driver of the device.", this.getId());
				this.error("The script doesn't apply to the driver of the device.");
				this.status = Status.CANCELLED;
				return;
			}
			if (device.getStatus() != Device.Status.INPRODUCTION) {
				log.trace("Task {}. Device not INPRODUCTION, stopping the run script task.", this.getId());
				this.warn("The device is not enabled (not in production).");
				this.status = Status.FAILURE;
				return;
			}
			
			cliScript = new JsCliScript(this.deviceDriver, this.script, false);
			cliScript.setUserInputValues(this.userInputValues);
			cliScript.connectRun(session, device);
			
			this.info(String.format("Device logs (%d next lines):", cliScript.getJsLog().size()));
			this.logs.append(cliScript.getPlainJsLog());
			session.merge(device);
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
			log.error("Task {}. Error while running the script.", this.getId(), e);
			this.error("Error while running the script: " + e.getMessage());
			if (cliScript != null) {
				this.info(String.format("Device logs (%d next lines):", cliScript.getJsLog().size()));
				this.logs.append(cliScript.getPlainJsLog());
			}
			
			this.status = Status.FAILURE;
			return;
		}
		finally {
			session.close();
		}
	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Device script execution";
	}

	/**
	 * Get the ID of the device
	 * 
	 * @return the ID of the device
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public long getDeviceId() {
		if (this.device == null) {
			return 0;
		}
		return this.device.getId();
	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		RunDeviceScriptTask task = (RunDeviceScriptTask) super.clone();
		task.setDevice(this.device);
		task.setDeviceDriver(this.deviceDriver);
		return task;
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
}
