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

import java.util.Collection;
import java.util.List;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.query.MutationQuery;
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
import net.netshot.netshot.device.Finder.FinderParseException;
import net.netshot.netshot.rest.RestViews.DefaultView;

/**
 * A dynamic group of devices is defined by search criteria.
 */
@Entity
@OnDelete(action = OnDeleteAction.CASCADE)
@Slf4j
public class DynamicDeviceGroup extends DeviceGroup {

	/** The query. */
	@Getter(onMethod = @__({
		@Column(length = 1000),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String query = "[Name] is \"example\"";

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
		this.query = query;
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
		return new Finder(this.query);
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
	 * Refresh all group membership for a given device, within a given session.
	 *
	 * @param session = the DB session
	 * @param deviceId = the ID of the device to target
	 */
	public static synchronized void refreshAllGroupsOfOneDevice(Session session, Long deviceId) {
		List<DynamicDeviceGroup> allGroups = session
			.createQuery("select ddg from DynamicDeviceGroup ddg", DynamicDeviceGroup.class)
			.list();
		for (DynamicDeviceGroup group : allGroups) {
			try {
				log.trace("Checking device {} vs group {}", deviceId, group.getId());
				String deviceQuery = "[Device] is %d".formatted(deviceId);
				if (!group.getQuery().isBlank()) {
					deviceQuery += " and (%s)".formatted(group.getQuery());
				}
				log.trace("Finder query for group: '{}'.", deviceQuery);
				Finder finder = new Finder(deviceQuery);
				MutationQuery deleteQuery = session.createMutationQuery(
					"delete from DeviceGroupMembership m where m.key.group = :group and "
					+ "m.key.device.id = :deviceId and "
					+ "m.key.device not in (select d " + finder.getHql() + ")");
				deleteQuery.setParameter("group", group);
				deleteQuery.setParameter("deviceId", deviceId);
				finder.setVariables(deleteQuery);
				deleteQuery.executeUpdate();
				MutationQuery insertQuery = session.createMutationQuery(
					"insert into DeviceGroupMembership(key.device, key.group) "
					+ "select d, :group " + finder.getHql() + " "
					+ "on conflict do nothing");
				insertQuery.setParameter("group", group);
				finder.setVariables(insertQuery);
				insertQuery.executeUpdate();
			}
			catch (FinderParseException e) {
				log.error("Parse error while updating the group {}.", group.getId(), e);
			}
		}
	}

	/**
	 * Refresh all group membership for a given device.
	 *
	 * @param deviceId = the ID of the device to target
	 */
	public static void refreshAllGroupsOfOneDevice(Long deviceId) {
		log.debug("Refreshing all groups for device {}.", deviceId);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			refreshAllGroupsOfOneDevice(session, deviceId);
			session.getTransaction().commit();
		}
		catch (Exception e) {
			Database.rollbackSilently(session);
			log.error("Error while refreshing the dynamic groups.", e);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Refresh all groups for specific device.
	 *
	 * @param device the device
	 */
	public static void refreshAllGroupsOfOneDevice(Device device) {
		refreshAllGroupsOfOneDevice(device.getId());
	}

	/**
	 * Refresh all dynamic groups of given devices.
	 * 
	 * @param deviceIds = the list of devices to process
	 */
	public static synchronized void refreshAllGroupsOfDevices(Collection<Long> deviceIds) {
		log.debug("Refreshing all groups of {} devices.", deviceIds.size());
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			for (Long deviceId : deviceIds) {
				refreshAllGroupsOfOneDevice(session, deviceId);
			}
			session.getTransaction().commit();
		}
		catch (Exception e) {
			Database.rollbackSilently(session);
			log.error("Error while refreshing the dynamic groups.", e);
		}
		finally {
			session.close();
		}
	}

}
