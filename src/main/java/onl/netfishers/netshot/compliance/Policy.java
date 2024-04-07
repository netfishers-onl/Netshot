/**
 * Copyright 2013-2024 Netshot
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
import javax.persistence.ManyToMany;
import javax.persistence.OneToMany;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
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
	@Getter(onMethod=@__({
		@Id, @GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlAttribute, @JsonView(DefaultView.class)
	}))
	@Setter
	private long id;

	/** The name. */
	@Getter(onMethod=@__({
		@NaturalId(mutable = true),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String name;

	/** The rules. */
	@Getter(onMethod=@__({
		@OneToMany(mappedBy = "policy", cascade = CascadeType.ALL)
	}))
	@Setter
	private Set<Rule> rules = new HashSet<>();

	/** The target group. */
	@Getter(onMethod=@__({
		@ManyToMany(),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Set<DeviceGroup> targetGroups;

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
	public Policy(String name, Set<DeviceGroup> deviceGroups) {
		this.name = name;
		this.targetGroups = deviceGroups;
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

	@XmlElement
	@Transient
	public int getRuleCount() {
		return this.rules.size();
	}

	/**
	 * Check all devices of the target groups against the policy.
	 *
	 * @param session the session
	 */
	public void check(Session session, TaskLogger taskLogger) {
		if (targetGroups == null) {
			return;
		}
		Set<Device> devices = new HashSet<>();
		for (DeviceGroup group : this.targetGroups) {
			devices.addAll(group.getCachedDevices());
		}
		for (Device device : devices) {
			this.check(device, session, taskLogger);
		}
	}

	/**
	 * Check a given device against the policy.
	 *
	 * @param device the device
	 * @param session the session
	 */
	public void check(Device device, Session session, TaskLogger taskLogger) {
		for (Rule rule : rules) {
			taskLogger.info(String.format("Evaluating rule %s (policy %s)...", rule.getName(), this.getName()));
			device.getComplianceCheckResults().add(rule.check(device, session, taskLogger));
		}
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
		return id == other.id;
	}

	@Override
	public String toString() {
		return "Compliance policy " + id + " (name '" + name + "')";
	}

}
