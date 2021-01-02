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
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.compliance.CheckResult.ResultOption;
import onl.netfishers.netshot.compliance.rules.JavaScriptRule;
import onl.netfishers.netshot.compliance.rules.TextRule;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.TaskLogger;


/**
 * A rule defines a number of constraints that a device should comply with.
 * A concrete implementation is the Javascript-based script rule.
 */
@Entity @Inheritance(strategy = InheritanceType.JOINED)
@Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"policy", "name"})})
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@JsonTypeInfo(use = JsonTypeInfo.Id.MINIMAL_CLASS, include = JsonTypeInfo.As.PROPERTY, property = "type")
public abstract class Rule {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(Rule.class);

	/** The set of real rule types. */
	private static final Set<Class<? extends Rule>> RULE_CLASSES;

	static {
		RULE_CLASSES = new HashSet<Class<? extends Rule>>();
		RULE_CLASSES.add(JavaScriptRule.class);
		RULE_CLASSES.add(TextRule.class);
	}

	/**
	 * Gets the rule classes.
	 *
	 * @return the rule classes
	 */
	public static final Set<Class<? extends Rule>> getRuleClasses() {
		return RULE_CLASSES;
	}


	/** The enabled. */
	protected boolean enabled = false;

	/** The id. */
	protected long id;

	/** The policy. */
	protected Policy policy = null;

	/** The name. */
	protected String name = "";

	/** The exemptions. */
	private Set<Exemption> exemptions = new HashSet<Exemption>();

	/** The check results. */
	private Set<CheckResult> checkResults = new HashSet<CheckResult>();

	/**
	 * Instantiates a new rule.
	 */
	protected Rule() {

	}

	/**
	 * Instantiates a new rule.
	 *
	 * @param name the name
	 * @param policy the policy
	 */
	public Rule(String name, Policy policy) {
		this.name = name;
		this.policy = policy;
	}

	/**
	 * Sets the check result.
	 *
	 * @param device the device
	 * @param result the result
	 * @param comment the comment
	 * @param session the session
	 */
	protected void setCheckResult(Device device, CheckResult.ResultOption result, String comment, Session session) {
		CheckResult checkResult = new CheckResult(this, device, result);
		checkResult.setComment(comment);
		if (session.contains(this)) {
			session.saveOrUpdate(checkResult);
		}
		else {
			this.checkResults.add(checkResult);
		}
	}

	/**
	 * Check.
	 *
	 * @param device the device
	 * @param session the session
	 * @param taskLogger the task logger
	 */
	public void check(Device device, Session session, TaskLogger taskLogger) {
		logger.warn("Called generic rule check.");
		if (!this.isEnabled()) {
			this.setCheckResult(device, ResultOption.DISABLED, "", session);
		}
		else if (device.isExempted(this)) {
			this.setCheckResult(device, ResultOption.EXEMPTED, "", session);
		}
		else {
			this.setCheckResult(device, ResultOption.NOTAPPLICABLE, "", session);
		}
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
		Rule other = (Rule) obj;
		if (id != other.id)
			return false;
		return true;
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
	 * Gets the policy.
	 *
	 * @return the policy
	 */
	@ManyToOne
	public Policy getPolicy() {
		return policy;
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

	/**
	 * Checks if is enabled.
	 *
	 * @return true, if is enabled
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public boolean isEnabled() {
		return enabled;
	}

	/**
	 * Sets the enabled.
	 *
	 * @param enabled the new enabled
	 */
	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
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
	 * Sets the policy.
	 *
	 * @param policy the new policy
	 */
	public void setPolicy(Policy policy) {
		this.policy = policy;
	}

	/**
	 * Gets the name.
	 *
	 * @return the name
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public String getName() {
		return name;
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
	 * Gets the exemptions.
	 *
	 * @return the exemptions
	 */
	@OneToMany(fetch = FetchType.LAZY, mappedBy = "key.rule", cascade = CascadeType.ALL, orphanRemoval = true)
	public Set<Exemption> getExemptions() {
		return exemptions;
	}

	/**
	 * Sets the exemptions.
	 *
	 * @param exemptions the new exemptions
	 */
	public void setExemptions(Set<Exemption> exemptions) {
		this.exemptions = exemptions;
	}

	/**
	 * Delete exemption.
	 *
	 * @param exemption the exemption
	 */
	public void deleteExemption(Exemption exemption) {
		this.exemptions.remove(exemption);
	}

	/**
	 * Adds the exemption.
	 *
	 * @param exemption the exemption
	 */
	public void addExemption(Exemption exemption) {
		this.exemptions.add(exemption);
	}

	/**
	 * Clear exemptions.
	 */
	public void clearExemptions() {
		this.exemptions.clear();
	}

	/**
	 * Gets the check results.
	 *
	 * @return the check results
	 */
	@OneToMany(fetch = FetchType.LAZY, mappedBy = "key.rule", cascade = CascadeType.ALL, orphanRemoval = true)
	public Set<CheckResult> getCheckResults() {
		return checkResults;
	}

	/**
	 * Sets the check results.
	 *
	 * @param checkResults the new check results
	 */
	public void setCheckResults(Set<CheckResult> checkResults) {
		this.checkResults = checkResults;
	}

	/**
	 * Delete check result.
	 *
	 * @param checkResult the check result
	 * @return true, if successful
	 */
	public boolean deleteCheckResult(CheckResult checkResult) {
		return this.checkResults.remove(checkResult);
	}

	/**
	 * Adds the check result.
	 *
	 * @param checkResult the check result
	 * @return true, if successful
	 */
	public boolean addCheckResult(CheckResult checkResult) {
		return this.checkResults.add(checkResult);
	}

	/**
	 * Clear check results.
	 */
	public void clearCheckResults() {
		this.checkResults.clear();
	}

	@Override
	public String toString() {
		return "Compliance rule " + id + " (name '" + name + "')";
	}

}
