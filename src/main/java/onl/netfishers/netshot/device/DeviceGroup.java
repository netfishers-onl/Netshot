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

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToMany;
import javax.persistence.OneToMany;
import javax.persistence.Version;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.compliance.HardwareRule;
import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.SoftwareRule;
import onl.netfishers.netshot.diagnostic.Diagnostic;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.tasks.CheckGroupComplianceTask;
import onl.netfishers.netshot.work.tasks.CheckGroupSoftwareTask;
import onl.netfishers.netshot.work.tasks.RunDeviceGroupScriptTask;
import onl.netfishers.netshot.work.tasks.TakeGroupSnapshotTask;

import org.hibernate.Session;
import org.hibernate.annotations.NaturalId;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;

/**
 * A group of devices.
 */
@Entity @Inheritance(strategy = InheritanceType.JOINED)
@XmlAccessorType(value = XmlAccessType.NONE)
@XmlRootElement()
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
		@Type(value = DynamicDeviceGroup.class, name = "DynamicDeviceGroup"),
		@Type(value = StaticDeviceGroup.class, name = "StaticDeviceGroup"),
})
abstract public class DeviceGroup {
	
	/** The applied policies. */
	protected Set<Policy> appliedPolicies = new HashSet<>();
	
	/** The applied software rules. */
	protected Set<SoftwareRule> appliedSoftwareRules = new HashSet<>();
	
	/** The applied hardware rules. */
	protected Set<HardwareRule> appliedHardwareRules = new HashSet<>();
	
	/** The cached devices. */
	protected Set<Device> cachedDevices = new HashSet<>();
	
	/** The change date. */
	protected Date changeDate;
	
	private int version;
	
	/** The check compliance tasks. */
	protected List<CheckGroupComplianceTask> checkComplianceTasks = new ArrayList<>();
	
	/** The check software compliance tasks. */
	protected List<CheckGroupSoftwareTask> checkSoftwareComplianceTasks = new ArrayList<>();
	
	/** The script tasks. */
	protected List<RunDeviceGroupScriptTask> runDeviceGroupScriptTasks = new ArrayList<>();
	
	/** The diagnostics. */
	protected List<Diagnostic> diagnostics = new ArrayList<>();
	
	/** The id. */
	protected long id;
	
	/** The name. */
	protected String name;
	
	/** Folder containing the group. */
	protected String folder = "";
	
	/** Whether the group should be hidden in reports. */
	protected boolean hiddenFromReports = false;
	
	/** The snapshot tasks. */
	protected List<TakeGroupSnapshotTask> snapshotTasks = new ArrayList<>();
	
	/**
	 * Instantiates a new device group.
	 */
	protected DeviceGroup() {
		
	}
	
	/**
	 * Instantiates a new device group.
	 *
	 * @param name the name
	 */
	public DeviceGroup(String name) {
		this.name = name;
	}
	
	/**
	 * Delete cached device.
	 *
	 * @param device the device
	 */
	public void deleteCachedDevice(Device device) {
		this.cachedDevices.remove(device);
	}
	
	/**
	 * Gets the applied policies.
	 *
	 * @return the applied policies
	 */
	@OneToMany(mappedBy = "targetGroup")
	public Set<Policy> getAppliedPolicies() {
		return appliedPolicies;
	}
	
	/**
	 * Gets the applied software rules.
	 *
	 * @return the applied software rules
	 */
	@OneToMany(cascade = CascadeType.ALL, mappedBy = "targetGroup")
	public Set<SoftwareRule> getAppliedSoftwareRules() {
		return appliedSoftwareRules;
	}
	
	/**
	 * Gets the applied hardware rules.
	 *
	 * @return the applied hardware rules
	 */
	@OneToMany(cascade = CascadeType.ALL, mappedBy = "targetGroup")
	public Set<HardwareRule> getAppliedHardwareRules() {
		return appliedHardwareRules;
	}
	
	/**
	 * Gets the cached devices.
	 *
	 * @return the cached devices
	 */
	@ManyToMany(fetch = FetchType.LAZY)
	public Set<Device> getCachedDevices() {
		return cachedDevices;
	}

	/**
	 * Gets the change date.
	 *
	 * @return the change date
	 */
	@XmlElement @JsonView(DefaultView.class)
	public Date getChangeDate() {
		return changeDate;
	}
	
	@Version
	public int getVersion() {
		return version;
	}
	
	public void setVersion(int version) {
		this.version = version;
	}

	/**
	 * Gets the check compliance tasks.
	 *
	 * @return the check compliance tasks
	 */
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "deviceGroup")
	public List<CheckGroupComplianceTask> getCheckComplianceTasks() {
		return checkComplianceTasks;
	}
	
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "deviceGroup")
	public List<CheckGroupSoftwareTask> getCheckSoftwareComplianceTasks() {
		return checkSoftwareComplianceTasks;
	}

	public void setCheckSoftwareComplianceTasks(
			List<CheckGroupSoftwareTask> checkSoftwareComplianceTasks) {
		this.checkSoftwareComplianceTasks = checkSoftwareComplianceTasks;
	}
	
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "deviceGroup")
	public List<RunDeviceGroupScriptTask> getRunDeviceGroupScriptTasks() {
		return runDeviceGroupScriptTasks;
	}

	public void setRunDeviceGroupScriptTasks(
			List<RunDeviceGroupScriptTask> runDeviceGroupScriptTasks) {
		this.runDeviceGroupScriptTasks = runDeviceGroupScriptTasks;
	}
	
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "targetGroup")
	public List<Diagnostic> getDiagnostics() {
		return diagnostics;
	}
	
	public void setDiagnostics(List<Diagnostic> diagnostics) {
		this.diagnostics = diagnostics;
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@XmlAttribute
	public long getId() {
		return id;
	}
	
	/**
	 * Gets the name.
	 *
	 * @return the name
	 */
	@NaturalId(mutable = true)
	@XmlElement @JsonView(DefaultView.class)
	public String getName() {
		return name;
	}
	
	/**
	 * Gets the snapshot tasks.
	 *
	 * @return the snapshot tasks
	 */
	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "deviceGroup")
	public List<TakeGroupSnapshotTask> getSnapshotTasks() {
		return snapshotTasks;
	}
	
	/**
	 * Refresh cache.
	 *
	 * @param session the session
	 * @throws Exception the exception
	 */
	public abstract void refreshCache(Session session) throws Exception;
	
	/**
	 * Sets the applied policies.
	 *
	 * @param appliedPolicies the new applied policies
	 */
	public void setAppliedPolicies(Set<Policy> appliedPolicies) {
		this.appliedPolicies = appliedPolicies;
	}
	
	/**
	 * Sets the applied software rules.
	 *
	 * @param appliedSoftwareRules the new applied software rules
	 */
	public void setAppliedSoftwareRules(Set<SoftwareRule> appliedSoftwareRules) {
		this.appliedSoftwareRules = appliedSoftwareRules;
	}
	
	/**
	 * Sets the applied hardware rules.
	 *
	 * @param appliedHardwareRules the new applied hardware rules
	 */
	public void setAppliedHardwareRules(Set<HardwareRule> appliedHardwareRules) {
		this.appliedHardwareRules = appliedHardwareRules;
	}
	
	/**
	 * Sets the cached devices.
	 *
	 * @param cachedDevices the new cached devices
	 */
	public void setCachedDevices(Set<Device> cachedDevices) {
		this.cachedDevices = cachedDevices;
	}
	
	/**
	 * Sets the change date.
	 *
	 * @param changeDate the new change date
	 */
	public void setChangeDate(Date changeDate) {
		this.changeDate = changeDate;
	}
	
	/**
	 * Sets the check compliance tasks.
	 *
	 * @param checkComplianceTasks the new check compliance tasks
	 */
	public void setCheckComplianceTasks(
	    List<CheckGroupComplianceTask> checkComplianceTasks) {
		this.checkComplianceTasks = checkComplianceTasks;
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
	 * Sets the snapshot tasks.
	 *
	 * @param snapshotTasks the new snapshot tasks
	 */
	public void setSnapshotTasks(List<TakeGroupSnapshotTask> snapshotTasks) {
		this.snapshotTasks = snapshotTasks;
	}
	
	/**
	 * Update cached devices.
	 *
	 * @param devices the devices
	 */
	public void updateCachedDevices(Collection<Device> devices) {
		this.cachedDevices.addAll(devices);
		this.cachedDevices.retainAll(devices);
	}

	@XmlElement @JsonView(DefaultView.class)
	@Column(length = 1000)
	public String getFolder() {
		return folder;
	}

	public void setFolder(String folder) {
		this.folder = folder;
	}

	@XmlElement @JsonView(DefaultView.class)
	public boolean isHiddenFromReports() {
		return hiddenFromReports;
	}

	public void setHiddenFromReports(boolean hideInReports) {
		this.hiddenFromReports = hideInReports;
	}

	@Override
	public String toString() {
		return "Device Group " + id + " (name '" + name + "')";
	}
	
}
