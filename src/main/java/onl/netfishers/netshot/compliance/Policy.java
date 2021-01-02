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
package onl.netfishers.netshot.compliance;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.TaskLogger;

import org.hibernate.Session;
import org.hibernate.annotations.NaturalId;

/**
 * A policy is a set of rules, applied to a group of devices.
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class Policy {

	/** The id. */
	private long id;

	/** The name. */
	private String name;

	/** The rules. */
	private Set<Rule> rules = new HashSet<Rule>();

	/** The target group. */
	private DeviceGroup targetGroup;

	/**
	 * Instantiates a new policy.
	 */
	protected Policy() {
	}

	/**
	 * Instantiates a new policy.
	 *
	 * @param name the name
	 * @param deviceGroup the device group
	 */
	public Policy(String name, DeviceGroup deviceGroup) {
		this.name = name;
		this.targetGroup = deviceGroup;
	}

	/**
	 * Adds the rule.
	 *
	 * @param rule the rule
	 */
	public void addRule(Rule rule) {
		rules.add(rule);
		rule.setPolicy(this);
	}

	/**
	 * Check.
	 *
	 * @param session the session
	 */
	public void check(Session session, TaskLogger taskLogger) {
		if (targetGroup == null) {
			return;
		}
		for (Device device : targetGroup.getCachedDevices()) {
			this.check(device, session, taskLogger);
		}
	}

	/**
	 * Check.
	 *
	 * @param device the device
	 * @param session the session
	 */
	public void check(Device device, Session session, TaskLogger taskLogger) {
		for (Rule rule : rules) {
			rule.check(device, session, taskLogger);
		}
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@XmlElement
	@JsonView(DefaultView.class)
	public long getId() {
		return id;
	}

	/**
	 * Gets the name.
	 *
	 * @return the name
	 */
	@NaturalId(mutable = true)
	@XmlElement
	@JsonView(DefaultView.class)
	public String getName() {
		return name;
	}

	/**
	 * Gets the rules.
	 *
	 * @return the rules
	 */
	@OneToMany(cascade = CascadeType.ALL, mappedBy = "policy")
	public Set<Rule> getRules() {
		return rules;
	}

	/**
	 * Gets the target group.
	 *
	 * @return the target group
	 */
	@ManyToOne
	@XmlElement
	@JsonView(DefaultView.class)
	public DeviceGroup getTargetGroup() {
		return targetGroup;
	}

	/**
	 * Sets the id.
	 *
	 * @param id the new id
	 */
	public void setId(long id) {
		this.id = id;
	}

	/**
	 * Sets the name.
	 *
	 * @param name the new name
	 */
	public void setName(String name) {
		this.name = name;
	}

	/**
	 * Sets the rules.
	 *
	 * @param rules the new rules
	 */
	public void setRules(Set<Rule> rules) {
		this.rules = rules;
	}

	/**
	 * Sets the target group.
	 *
	 * @param targetGroup the new target group
	 */
	public void setTargetGroup(DeviceGroup targetGroup) {
		this.targetGroup = targetGroup;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + (int) (id ^ (id >>> 32));
		return result;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Policy other = (Policy) obj;
		if (id != other.id)
			return false;
		return true;
	}

	@Override
	public String toString() {
		return "Compliance policy " + id + " (name '" + name + "')";
	}

}
