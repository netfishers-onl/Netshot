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
package onl.netfishers.netshot.device;

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
	 * @see onl.netfishers.netshot.device.DeviceGroup#refreshCache(org.hibernate.Session)
	 */
	@Override
	public void refreshCache(Session session) throws Exception {
	}

}
