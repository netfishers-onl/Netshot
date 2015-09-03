/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.compliance;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceGroup;

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
	public void check(Session session) {
		for (Device device : targetGroup.getCachedDevices()) {
			this.check(device, session);
		}
	}

	/**
	 * Check.
	 *
	 * @param device the device
	 * @param session the session
	 */
	public void check(Device device, Session session) {
		for (Rule rule : rules) {
			rule.check(device, session);
		}
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@Id
	@GeneratedValue
	@XmlElement
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

}
