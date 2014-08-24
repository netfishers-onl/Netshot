/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device;

import javax.persistence.Entity;
import org.hibernate.Session;

/**
 * A static group of devices.
 * The devices are manually listed.
 */
@Entity
public class StaticDeviceGroup extends DeviceGroup {

	/**
	 * Instantiates a new static device group.
	 */
	protected StaticDeviceGroup() {

	}

	/**
	 * Instantiates a new static device group.
	 *
	 * @param name the name
	 */
	public StaticDeviceGroup(String name) {
		super(name);
	}

	/**
	 * Adds the device.
	 *
	 * @param device the device
	 */
	public void addDevice(Device device) {
		this.cachedDevices.add(device);
	}

	/**
	 * Removes the device.
	 *
	 * @param device the device
	 */
	public void removeDevice(Device device) {
		this.cachedDevices.remove(device);
	}
	
	/**
	 * Clear devices.
	 */
	public void clearDevices() {
		this.cachedDevices.clear();
	}
	
	/* (non-Javadoc)
	 * @see org.netshot.device.DeviceGroup#refreshCache(org.hibernate.Session)
	 */
	@Override
  public void refreshCache(Session session) throws Exception {
  }

}
