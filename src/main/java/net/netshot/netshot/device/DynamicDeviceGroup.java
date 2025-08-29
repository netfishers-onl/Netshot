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
package net.netshot.netshot.device;

import java.util.List;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.query.Query;

import com.fasterxml.jackson.annotation.JsonView;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Transient;
import jakarta.xml.bind.annotation.XmlElement;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.database.Database;
import net.netshot.netshot.device.Finder.Expression.FinderParseException;
import net.netshot.netshot.rest.RestViews.DefaultView;

/**
 * A dynamic group of devices is defined by search criteria.
 */
@Entity
@OnDelete(action = OnDeleteAction.CASCADE)
@Slf4j
public class DynamicDeviceGroup extends DeviceGroup {

	/** The device class. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String driver;

	/** The query. */
	@Getter(onMethod = @__({
		@Column(length = 1000),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String query = "[Name] IS \"example\"";

	/**
	 * Instantiates a new dynamic device group.
	 */
	protected DynamicDeviceGroup() {
	}

	public DynamicDeviceGroup(String name) {
		super(name);
	}

	public DynamicDeviceGroup(String name, String driver, String query) {
		super(name);
		this.driver = driver;
		this.query = query;
	}

	@Transient
	public DeviceDriver getDeviceDriver() {
		return DeviceDriver.getDriverByName(driver);
	}

	/**
	 * Validate query.
	 *
	 * @return true, if successful
	 */
	@Transient
	public boolean validateQuery() {
		try {
			Finder finder = this.getFinder();
			this.query = finder.getFormattedQuery();
		}
		catch (FinderParseException e) {
			return false;
		}
		return true;
	}

	/**
	 * Gets the finder.
	 *
	 * @return the finder
	 * @throws FinderParseException the finder parse exception
	 */
	@Transient
	private Finder getFinder() throws FinderParseException {
		return new Finder(this.query, this.getDeviceDriver());
	}

	/*(non-Javadoc)
	 * @see net.netshot.netshot.device.DeviceGroup#refreshCache(org.hibernate.Session)
	 */
	@Override
	public void refreshCache(Session session) throws FinderParseException, HibernateException {
		Finder finder = this.getFinder();
		Query<Device> cacheQuery = session.createQuery("select d" + finder.getHql(), Device.class);
		finder.setVariables(cacheQuery);
		List<Device> devices = cacheQuery.list();
		this.updateCachedDevices(devices);
		this.query = finder.getFormattedQuery();
	}

	/**
	 * Check whether a device is member of this dynamic group.
	 * @param session the ORM session
	 * @param device the device to check
	 * @return true if the device should be part of the current group
	 * @throws FinderParseException
	 * @throws HibernateException
	 */
	private boolean checkDeviceMembership(Session session, Device device) throws FinderParseException, HibernateException {
		log.debug("Checking membership of device {} in group {}.", device.getId(), this.getId());
		long deviceId = device.getId();
		if (this.query.isEmpty()) {
			return this.getDeviceDriver() == null || this.getDeviceDriver().getName().equals(device.getDriver());
		}
		String deviceQuery = String.format("[DEVICE] IS %d AND (%s)", deviceId, this.query);
		log.trace("Finder query: '{}'.", deviceQuery);
		Finder finder = new Finder(deviceQuery, this.getDeviceDriver());
		Query<Long> cacheQuery = session.createQuery("select d.id" + finder.getHql(), Long.class);
		finder.setVariables(cacheQuery);
		return cacheQuery.uniqueResult() != null;
	}


	/**
	 * Refresh all groups for specific device.
	 *
	 * @param device the device
	 */
	public static void refreshAllGroups(Device device) {
		refreshAllGroups(device.getId());
	}

	/**
	 * Refresh all groups.
	 *
	 * @param deviceId = the ID of the device to target
	 */
	public static synchronized void refreshAllGroups(Long deviceId) {
		log.debug("Refreshing all groups for device {}.", deviceId);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Device device = session.getReference(Device.class, deviceId);
			List<DeviceGroupMembership> memberships = session
				.createQuery("select m from DeviceGroupMembership m join fetch m.key.group where m.key.device.id = :deviceId", DeviceGroupMembership.class)
				.setParameter("deviceId", deviceId)
				.list();
			List<DynamicDeviceGroup> allGroups = session
				.createQuery("select ddg from DynamicDeviceGroup ddg", DynamicDeviceGroup.class)
				.list();
			for (DynamicDeviceGroup group : allGroups) {
				try {
					log.trace("Checking device {} vs group {}", device.getId(), group.getId());
					DeviceGroupMembership membership = null;
					for (DeviceGroupMembership m : memberships) {
						if (m.getGroup().getId() == group.getId()) {
							membership = m;
							break;
						}
					}
					boolean isMember = group.checkDeviceMembership(session, device);
					if (membership != null && !isMember) {
						log.debug("Removing device {} from group {} cached list", device.getId(), group.getId());
						session.remove(membership);
					}
					else if (membership == null && isMember) {
						log.debug("Adding device {} to group {} cached list", device.getId(), group.getId());
						membership = new DeviceGroupMembership(device, group);
						session.persist(membership);
					}
				}
				catch (FinderParseException e) {
					log.error("Parse error while updating the group {}.", group.getId(), e);
				}
			}
			session.getTransaction().commit();
		}
		catch (Exception e) {
			session.getTransaction().rollback();
			log.error("Error while refreshing the dynamic groups.", e);
		}
		finally {
			session.close();
		}
	}

}
