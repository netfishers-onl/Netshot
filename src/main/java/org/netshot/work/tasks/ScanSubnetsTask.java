/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.work.tasks;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.netshot.NetshotDatabase;
import org.netshot.NetshotTaskManager;
import org.netshot.device.Domain;
import org.netshot.device.Network4Address;
import org.netshot.device.credentials.DeviceCredentialSet;
import org.netshot.device.credentials.DeviceSnmpCommunity;
import org.netshot.work.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task scans a subnet to discover devices.
 */
@Entity
public class ScanSubnetsTask extends Task {
	
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(ScanSubnetsTask.class);
	
	/** The subnets. */
	private Set<Network4Address> subnets;
	
	/** The domain. */
	private Domain domain;
	
	/**
	 * Instantiates a new scan subnet task.
	 */
	protected ScanSubnetsTask() {
	}
	
	/**
	 * Instantiates a new scan subnets task.
	 *
	 * @param subnets the subnets
	 * @param domain the domain
	 * @param comments the comments
	 */
	public ScanSubnetsTask(Set<Network4Address> subnets, Domain domain, String comments, String target) {
		super(comments, target);
		this.domain = domain;
		this.subnets = subnets;
	}

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@Transient
	public String getTaskDescription() {
		return "Scan a subnet";
	}

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#run()
	 */
	@SuppressWarnings("unchecked")
  @Override
	public void run() {
		logger.debug("Starting scan subnet process.");
		
		Session session = NetshotDatabase.getSession();
		Set<Integer> toScan = new HashSet<Integer>();
		List<DeviceCredentialSet> knownCommunities;
		try {
			try {
				for (Network4Address subnet : subnets) {
					int address1 = subnet.getSubnetMin();
					int address2 = subnet.getSubnetMax();
					int min = (address1 > address2 ? address2 : address1);
					int max = (address1 > address2 ? address1 : address2);
					if (min < max - 1) {
						min++; // Avoid subnet network address
						max--;
					}
					logger.trace("Will scan from {} to {}.", min, max);
					this.logIt(String.format("Will scan %s (from %d to %d)", subnet.getPrefix(),
							min, max), 5);
					List<Integer> existing = session
							.createQuery("select d.mgmtAddress.address from Device d where d.mgmtAddress.address >= :min and d.mgmtAddress.address <= :max")
							.setInteger("min", min)
							.setInteger("max", max)
							.list();
					for (int a = min; a <= max; a++) {
						if (!existing.contains(a)) {
							toScan.add(a);
						}
					}
				}
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the existing devices in the scope.", e);
				this.logIt("Error while checking the existing devices.", 1);
				this.status = Status.FAILURE;
				return;
			}
			
			try {
				knownCommunities = session.createCriteria(DeviceSnmpCommunity.class)
				    .list();
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the communities.", e);
				this.logIt("Error while getting the communities.", 1);
				this.status = Status.FAILURE;
				return;
			}
		}
		finally {
			session.close();
		}
		logger.trace("Will try {} SNMP communities.", knownCommunities.size());
		

		for (int a : toScan) {
			try {
				Network4Address address = new Network4Address(a, 32);
				if (!address.isNormalUnicast()) {
					logger.trace("Bad address {} skipped.", a);
					this.logIt(String.format("Skipping %s.", address.getIP()), 4);
					continue;
				}
				this.logIt("Adding a task to scan " + address.getIP(), 5);
				logger.trace("Will add a discovery task for device with IP {} ({}).", a, address.getIP());
				DiscoverDeviceTypeTask discoverTask = new DiscoverDeviceTypeTask(address, this.getDomain(), comments);
				for (DeviceCredentialSet credentialSet : knownCommunities) {
					discoverTask.addCredentialSet(credentialSet);
				}
				NetshotTaskManager.addTask(discoverTask);
			}
			catch (Exception e) {
				logger.error("Error while adding discovery task.", e);
				this.logIt("Error while adding discover device type: " + e.getMessage(), 2);
			}
		}
		
		this.status = Status.SUCCESS;
	}
	
	/* (non-Javadoc)
	 * @see org.netshot.work.Task#clone()
	 */
	@Override
  public Object clone() throws CloneNotSupportedException {
	  ScanSubnetsTask task = (ScanSubnetsTask) super.clone();
	  task.setSubnets(this.subnets);
	  return task;
  }

	/**
	 * Gets the domain.
	 *
	 * @return the domain
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	public Domain getDomain() {
		return domain;
	}

	/**
	 * Sets the domain.
	 *
	 * @param domain the new domain
	 */
	public void setDomain(Domain domain) {
		this.domain = domain;
	}

	@ElementCollection(fetch = FetchType.EAGER) @Fetch(FetchMode.SELECT)
	public Set<Network4Address> getSubnets() {
		return subnets;
	}

	public void setSubnets(Set<Network4Address> subnets) {
		this.subnets = subnets;
	}

}
