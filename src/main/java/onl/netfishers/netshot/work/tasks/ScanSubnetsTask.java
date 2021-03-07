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
package onl.netfishers.netshot.work.tasks;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.AttributeOverride;
import javax.persistence.AttributeOverrides;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.device.Domain;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.Task;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task scans a subnet to discover devices.
 */
@Entity
public class ScanSubnetsTask extends Task {
	
	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(ScanSubnetsTask.class);
	
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
	public ScanSubnetsTask(Set<Network4Address> subnets, Domain domain, String comments,
			String target, String author) {
		super(comments, target, author);
		this.domain = domain;
		this.subnets = subnets;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Subnet scan";
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#run()
	 */
	@SuppressWarnings("unchecked")
  @Override
	public void run() {
		logger.debug("Task {}. Starting scan subnet process.", this.getId());
		
		Session session = Database.getSession();
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
					logger.trace("Task {}. Will scan from {} to {}.", this.getId(), min, max);
					this.info(String.format("Will scan %s (from %d to %d)", subnet.getPrefix(),
							min, max));
					List<Integer> existing = session
							.createQuery("select d.mgmtAddress.address from Device d where d.mgmtAddress.address >= :min and d.mgmtAddress.address <= :max")
							.setParameter("min", min)
							.setParameter("max", max)
							.list();
					for (int a = min; a <= max; a++) {
						if (!existing.contains(a)) {
							toScan.add(a);
						}
					}
				}
			}
			catch (HibernateException e) {
				logger.error("Task {}. Error while retrieving the existing devices in the scope.",
						this.getId(), e);
				this.error("Error while checking the existing devices.");
				this.status = Status.FAILURE;
				return;
			}
			
			try {
				knownCommunities = session
						.createQuery("from DeviceSnmpCommunity c where c.mgmtDomain is null or c.mgmtDomain = :domain")
						.setParameter("domain", domain)
						.list();
			}
			catch (Exception e) {
				logger.error("Task {}. Error while retrieving the communities.", this.getId(), e);
				this.error("Error while getting the communities.");
				this.status = Status.FAILURE;
				return;
			}
		}
		finally {
			session.close();
		}
		if (knownCommunities.size() == 0) {
			logger.error("Task {}. No available SNMP community to scan devices.", this.getId());
			this.error("No available SNMP community to scan devices.");
			this.status = Status.FAILURE;
			return;
		}
		logger.trace("Task {}. Will try {} SNMP communities.", this.getId(), knownCommunities.size());
		

		for (int a : toScan) {
			try {
				Network4Address address = new Network4Address(a, 32);
				if (!address.isNormalUnicast()) {
					logger.trace("Task {}. Bad address {} skipped.", this.getId(), a);
					this.info(String.format("Skipping %s.", address.getIp()));
					continue;
				}
				this.info("Adding a task to scan " + address.getIp());
				logger.trace("Task {}. Will add a discovery task for device with IP {} ({}).",
						this.getId(), a, address.getIp());
				DiscoverDeviceTypeTask discoverTask = new DiscoverDeviceTypeTask(address, this.getDomain(), comments, author);
				for (DeviceCredentialSet credentialSet : knownCommunities) {
					discoverTask.addCredentialSet(credentialSet);
				}
				TaskManager.addTask(discoverTask);
			}
			catch (Exception e) {
				logger.error("Task {}. Error while adding discovery task.", this.getId(), e);
				this.error("Error while adding discover device type: " + e.getMessage());
			}
		}
		
		this.status = Status.SUCCESS;
	}
	
	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#clone()
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
	@AttributeOverrides({
    @AttributeOverride(name = "address", column = @Column(name = "ipv4address")),
    @AttributeOverride(name = "addressUsage", column = @Column(name = "ipv4usage")),
    @AttributeOverride(name = "prefixLength", column = @Column(name = "ipv4mask")),
  })
	public Set<Network4Address> getSubnets() {
		return subnets;
	}

	public void setSubnets(Set<Network4Address> subnets) {
		this.subnets = subnets;
	}

	/*
	 * (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getIdentity()
	 */
	@Override
	@Transient
	public JobKey getIdentity() {
		return new JobKey(String.format("Task_%d", this.getId()), "ScanSubnets");
	}
}
