/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device;

import java.util.List;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.Session;
import org.netshot.NetshotDatabase;
import org.netshot.device.Finder.Expression.FinderParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A dynamic group of devices is defined by search criteria.
 */
@Entity
public class DynamicDeviceGroup extends DeviceGroup {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(DeviceGroup.class);
	
	/** The device class. */
	private Class<? extends Device> deviceClass = Device.class;
	
	/** The query. */
	private String query = "[Name] IS \"Example\"";

	/**
	 * Instantiates a new dynamic device group.
	 */
	protected DynamicDeviceGroup() {
	}

	/**
	 * Instantiates a new dynamic device group.
	 *
	 * @param name the name
	 * @param deviceClass the device class
	 * @param query the query
	 */
	public DynamicDeviceGroup(String name, Class<? extends Device> deviceClass,
	    String query) {
		super(name);
		this.deviceClass = deviceClass;
		this.query = query;
	}

	/**
	 * Gets the device class.
	 *
	 * @return the device class
	 */
	@XmlElement
	public Class<? extends Device> getDeviceClass() {
		return deviceClass;
	}

	/**
	 * Gets the query.
	 *
	 * @return the query
	 */
	@Column(length = 1000)
	@XmlElement
	public String getQuery() {
		return query;
	}

	/**
	 * Sets the device class.
	 *
	 * @param deviceClass the new device class
	 */
	public void setDeviceClass(Class<? extends Device> deviceClass) {
		this.deviceClass = deviceClass;
	}

	/**
	 * Sets the query.
	 *
	 * @param query the new query
	 */
	public void setQuery(String query) {
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
			Finder finder = new Finder(this.query, this.deviceClass);
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
	public Finder getFinder() throws FinderParseException {
		return new Finder(this.query, this.deviceClass);
	}

	/* (non-Javadoc)
	 * @see org.netshot.device.DeviceGroup#refreshCache(org.hibernate.Session)
	 */
	@SuppressWarnings("unchecked")
  @Override
  public void refreshCache(Session session) throws FinderParseException, HibernateException {
		Finder finder = new Finder(this.query, this.deviceClass);
		Query query = session.createQuery("select d" + finder.getHql());
		finder.setVariables(query);
		List<Device> devices = query.list();
		this.updateCachedDevices(devices);
		this.query = finder.getFormattedQuery();
  }
	
	/**
	 * Refresh cache.
	 *
	 * @param session the session
	 * @param device the device
	 * @throws FinderParseException the finder parse exception
	 * @throws HibernateException the hibernate exception
	 */
	public void refreshCache(Session session, Device device) throws FinderParseException, HibernateException {
		logger.debug("Refreshing cache of group {} for device {}.", this.getId(), device.getId());
		long id = device.getId();
		if (this.query.isEmpty()) {
			this.cachedDevices.add(device);
		}
		else {
			String deviceQuery = String.format("[DEVICE] IS %d AND (%s)", id, this.query);
			logger.trace("Finder query: '{}'.", deviceQuery);
			Finder finder = new Finder(deviceQuery, this.deviceClass);
			Query query = session.createQuery("select d.id" + finder.getHql());
			finder.setVariables(query);
			if (query.uniqueResult() == null) {
				this.cachedDevices.remove(device);
			}
			else {
				this.cachedDevices.add(device);
			}
		}
	}

	/**
	 * Refresh all groups.
	 *
	 * @param device the device
	 */
	static synchronized public void refreshAllGroups(Device device) {
		logger.debug("Refreshing all groups for device {}.", device.getId());
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
      @SuppressWarnings("unchecked")
      List<DynamicDeviceGroup> groups = session.createCriteria(DynamicDeviceGroup.class).list();
			for (DynamicDeviceGroup group : groups) {
				try {
	        group.refreshCache(session, device);
	        session.update(group);
        }
        catch (FinderParseException e) {
        	logger.error("Parse error while updating the group {}.", group.getId(), e);
        }
			}
			session.getTransaction().commit();
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while updating the groups.", e);
		}
		finally {
			session.close();
		}
	}
	
}
