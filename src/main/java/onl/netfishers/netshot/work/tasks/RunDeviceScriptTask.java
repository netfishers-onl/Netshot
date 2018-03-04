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

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.work.Task;

import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task takes a snapshot of a device.
 */
@Entity
public class RunDeviceScriptTask extends Task {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(RunDeviceScriptTask.class);

	/** The device. */
	private Device device;
	
	private String script;
	
	private String deviceDriver;

	/**
	 * Instantiates a new take snapshot task.
	 */
	protected RunDeviceScriptTask() {
	}

	/**
	 * Instantiates a new take snapshot task.
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
	public void prepare() {
		Hibernate.initialize(this.getDevice());
	}


	@Override
	public void run() {
		logger.debug("Starting script task for device {}.", device.getId());
		this.logIt(String.format("Run script task for device %s (%s).",
				device.getName(), device.getMgmtAddress().getIp()), 5);

		Session session = Database.getSession();
		try {
			session.beginTransaction();
			session.refresh(device);
			if (deviceDriver == null || !deviceDriver.equals(device.getDriver())) {
				logger.trace("The script doesn't apply to the driver of the device.");
				this.logIt("The script doesn't apply to the driver of the device.", 2);
				this.status = Status.CANCELLED;
				return;
			}
			if (device.getStatus() != Device.Status.INPRODUCTION) {
				logger.trace("Device not INPRODUCTION, stopping the run script task.");
				this.logIt("The device is not enabled (not in production).", 2);
				this.status = Status.FAILURE;
				return;
			}
			
			device.runScript(script, false);
			
			this.logIt(String.format("Device logs (%d next lines):", device.getLog().size()), 3);
			this.log.append(device.getPlainLog());
			session.update(device);
			session.getTransaction().commit();
			this.status = Status.SUCCESS;
		}
		catch (Exception e) {
			session.getTransaction().rollback();
			logger.error("Error while running the script.", e);
			this.logIt("Error while running the script: " + e.getMessage(), 3);
			this.logIt(
					String.format("Device logs (%d next lines):", device.getLog().size()),
					3);
			this.log.append(device.getPlainLog());
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
	@XmlElement
	@Transient
	public String getTaskDescription() {
		return "Device script execution";
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
		RunDeviceScriptTask task = (RunDeviceScriptTask) super.clone();
		task.setDevice(this.device);
		return task;
	}

	@Column(length = 100000000)
	public String getScript() {
		return script;
	}

	public void setScript(String script) {
		this.script = script;
	}

	public String getDeviceDriver() {
		return deviceDriver;
	}

	public void setDeviceDriver(String deviceDriver) {
		this.deviceDriver = deviceDriver;
	}

}
