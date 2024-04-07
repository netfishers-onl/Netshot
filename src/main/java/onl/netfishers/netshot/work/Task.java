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
package onl.netfishers.netshot.work;

import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
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
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.persistence.Version;
import javax.persistence.Index;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.database.Database;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.logger.TaskLogTaskLogger;
import onl.netfishers.netshot.work.tasks.CheckComplianceTask;
import onl.netfishers.netshot.work.tasks.CheckGroupComplianceTask;
import onl.netfishers.netshot.work.tasks.CheckGroupSoftwareTask;
import onl.netfishers.netshot.work.tasks.DiscoverDeviceTypeTask;
import onl.netfishers.netshot.work.tasks.PurgeDatabaseTask;
import onl.netfishers.netshot.work.tasks.RunDeviceGroupScriptTask;
import onl.netfishers.netshot.work.tasks.RunDeviceScriptTask;
import onl.netfishers.netshot.work.tasks.RunDiagnosticsTask;
import onl.netfishers.netshot.work.tasks.RunGroupDiagnosticsTask;
import onl.netfishers.netshot.work.tasks.ScanSubnetsTask;
import onl.netfishers.netshot.work.tasks.TakeGroupSnapshotTask;
import onl.netfishers.netshot.work.tasks.TakeSnapshotTask;

import org.quartz.JobKey;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;


/**
 * A task.
 */
@Entity @Inheritance(strategy = InheritanceType.JOINED)
@Table(indexes = {
		@Index(name = "changeDateIndex", columnList = "changeDate"),
		@Index(name = "creationDateIndex", columnList = "creationDate"),
		@Index(name = "statusIndex", columnList = "status"),
		@Index(name = "executionDateIndex", columnList = "executionDate")
})
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@JsonTypeInfo(use = JsonTypeInfo.Id.SIMPLE_NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
	@Type(value = CheckComplianceTask.class),
	@Type(value = CheckGroupComplianceTask.class),
	@Type(value = CheckGroupSoftwareTask.class),
	@Type(value = DiscoverDeviceTypeTask.class),
	@Type(value = PurgeDatabaseTask.class),
	@Type(value = RunDeviceGroupScriptTask.class),
	@Type(value = RunDeviceScriptTask.class),
	@Type(value = RunDiagnosticsTask.class),
	@Type(value = RunGroupDiagnosticsTask.class),
	@Type(value = ScanSubnetsTask.class),
	@Type(value = TakeGroupSnapshotTask.class),
	@Type(value = TakeSnapshotTask.class),
})
@Slf4j
public abstract class Task implements Cloneable {

	/**
	 * The Enum ScheduleType.
	 */
	public static enum ScheduleType {
		ASAP,
		AT,
		DAILY,
		MONTHLY,
		WEEKLY,
		HOURLY,
	}

	/**
	 * The Enum Status.
	 */
	public static enum Status {

		/** The task was cancelled. */
		CANCELLED,

		/** The task failed. */
		FAILURE,

		/** The task is new. */
		NEW,

		/** The task is running. */
		RUNNING,

		/** The task is scheduled. */
		SCHEDULED,

		/** The task is a success. */
		SUCCESS,

		/** The task is waiting. */
		WAITING,
	}

	/** The Constant TASK_CLASSES. */
	private static final Set<Class<? extends Task>> TASK_CLASSES;

	static {
		TASK_CLASSES = new HashSet<Class<? extends Task>>();
		try {
			for (Class<?> clazz : Database.listClassesInPackage("onl.netfishers.netshot.work.tasks")) {
				if (Task.class.isAssignableFrom(clazz)) {
					@SuppressWarnings("unchecked")
					Class<? extends Task> taskClass = (Class<? extends Task>) clazz;
					TASK_CLASSES.add(taskClass);
				}
			}
		}
		catch (Exception e) {
			log.error("Error while scanning the task classes.", e);
		}
	}

	/**
	 * Gets the task classes.
	 *
	 * @return the task classes
	 */
	public static final Set<Class<? extends Task>> getTaskClasses() {
		return TASK_CLASSES;
	}

	/** The author. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String author = "";
	
	/** The change date. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date changeDate;

	/** The comments. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String comments = "";

	/** The creation date. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date creationDate = new Date();

	/** Debug enabled. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected boolean debugEnabled = false;

	/** The debug log. */
	@Getter(onMethod=@__({
		@OneToOne(orphanRemoval = true, fetch = FetchType.LAZY, cascade = CascadeType.ALL)
	}))
	@Setter
	protected DebugLog debugLog;
	
	/** The execution date. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date executionDate;

	/** The id. */
	@Getter(onMethod=@__({
		@Id, @GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected long id;

	/** The log. */
	protected StringBuffer logs = new StringBuffer();

	/** The schedule reference. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date scheduleReference = new Date();

	/** The schedule type. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected ScheduleType scheduleType = ScheduleType.ASAP;

	/** The factor (to multiply type) */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected int scheduleFactor = 1;
	
	/** The status. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Status status = Status.NEW;

	/** The target. */
	@Getter(onMethod=@__({
		@Column(length = 10000),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String target = "None";

	/** DB version field. */
	@Getter(onMethod=@__({
		@Version
	}))
	@Setter
	private int version;

	/** Runner ID (clustering mode) */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String runnerId;

	/**
	 * Instantiates a new task.
	 */
	protected Task() {
	}

	/**
	 * Instantiates a new task.
	 *
	 * @param comments the comments
	 * @param target the target
	 */
	public Task(String comments, String target, String author, boolean debugEnabled) {
		this.comments = comments;
		this.target = target;
		this.author = author;
		this.debugEnabled = debugEnabled;
	}
	
	/**
	 * Instantiates a new task.
	 *
	 * @param comments the comments
	 * @param target the target
	 */
	public Task(String comments, String target, String author) {
		this.comments = comments;
		this.target = target;
		this.author = author;
	}
	
	/**
	 * Generate the identity of the task. Used by Quartz.
	 * Two tasks with the same identity won't be executed concurrently.
	 * @return the identity of the task.
	 */
	@Transient
	abstract public JobKey getIdentity();


	/* (non-Javadoc)
	 * @see java.lang.Object#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		Task task = (Task) super.clone();
		task.setScheduleReference(this.scheduleReference);
		task.setScheduleType(this.scheduleType);
		task.setScheduleFactor(this.scheduleFactor);
		task.setId(0);
		return task;
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
		if (!(obj instanceof Task))
			return false;
		Task other = (Task) obj;
		if (id != other.id)
			return false;
		return true;
	}

	/**
	 * Gets the next execution date.
	 *
	 * @return the next execution date
	 */
	@Transient
	@XmlElement @JsonView(DefaultView.class)
	public Date getNextExecutionDate() {
		Calendar reference = Calendar.getInstance();
		reference.setTime(this.scheduleReference);
		Calendar inOneMinute = Calendar.getInstance();
		inOneMinute.add(Calendar.MINUTE, 1);

		int factor = this.scheduleFactor;
		if (factor <= 0) {
			factor = 1;
		}
		int unit = 0;

		switch (this.scheduleType) {
		case AT:
			return this.scheduleReference;
		case HOURLY:
			unit = Calendar.HOUR;
			break;
		case DAILY:
			unit = Calendar.DAY_OF_MONTH;
			break;
		case WEEKLY:
			unit = Calendar.WEEK_OF_YEAR;
			break;
		case MONTHLY:
			unit = Calendar.MONTH;
			break;
		case ASAP:
		default:
			return null;
		}

		if (unit > 0) {
			Calendar target = Calendar.getInstance();
			target.setTime(this.scheduleReference);
			if (target.get(Calendar.YEAR) < inOneMinute.get(Calendar.YEAR)) {
				target.set(Calendar.YEAR, inOneMinute.get(Calendar.YEAR) - 1);
			}
			for (int i = 0; i < 100000; i++) {
				if (target.after(inOneMinute)) {
					return target.getTime();
				}
				target.add(unit, factor);
			}
			return target.getTime();
		}

		return null;
	}

	/**
	 * Gets the task description.
	 *
	 * @return the task description
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	abstract public String getTaskDescription();

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
	 * Checks if is repeating.
	 *
	 * @return true, if is repeating
	 */
	@Transient
	@XmlElement @JsonView(DefaultView.class)
	public boolean isRepeating() {
		switch (this.scheduleType) {
		case ASAP:
		case AT:
			return false;
		case DAILY:
		case MONTHLY:
		case WEEKLY:
		default:
			return true;
		}
	}
	
	public void debug(String message) {
		this.logs.append(String.format("[DEBUG] %s\n", message));
	}
	
	public void trace(String message) {
		this.logs.append(String.format("[TRACE] %s\n", message));
	}
	
	public void info(String message) {
		this.logs.append(String.format("[INFO] %s\n", message));
	}
	
	public void warn(String message) {
		this.logs.append(String.format("[WARN] %s\n", message));
	}
	
	public void error(String message) {
		this.logs.append(String.format("[ERROR] %s\n", message));
	}
	

	/**
	 * Get the JS logger
	 * @return the JS logger
	 */
	@Transient
	protected TaskLogger getJsLogger() {
		return new TaskLogTaskLogger(this);
	}

	/**
	 * On cancel.
	 */
	public void onCancel() {
	}

	/**
	 * On schedule.
	 */
	public void onSchedule() {

	}

	/**
	 * Prepare.
	 */
	public void prepare() {

	}

	/**
	 * Run.
	 */
	public abstract void run();

	/**
	 * This can return a hash for the task to select a stable runner.
	 * This is used to run all the tasks related to the same device
	 * on the same cluter runner.
	 * @return the hash or null
	 */
	@Transient
	public long getRunnerHash() {
		return 0;
	}

	/**
	 * Schedule the task.
	 *
	 * @param reference the date reference
	 * @param type the type of schedule
	 */
	public void schedule(Date reference, ScheduleType type, int factor) {
		this.scheduleType = type;
		this.scheduleFactor = factor;
		this.scheduleReference = reference;
	}

	/**
	 * Schedule the task.
	 *
	 * @param minutes Minutes to wait before starting the task
	 */
	public void schedule(int minutes) {
		this.scheduleType = ScheduleType.AT;
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.MINUTE, minutes);
		this.scheduleReference = calendar.getTime();
	}

	/**
	 * Sets the cancelled.
	 */
	public void setCancelled() {
		this.status = Status.CANCELLED;
	}

	/**
	 * Sets the task as failed.
	 */
	public void setFailed() {
		this.status = Status.FAILURE;
	}

	/**
	 * Sets the log.
	 *
	 * @param log the new log
	 */
	public void setLogs(String logs) {
		this.logs = new StringBuffer(logs);
	}

	/**
	 * Sets the log.
	 *
	 * @param log the new log
	 */
	public void setLogs(StringBuffer logs) {
		this.logs = logs;
	}

	/**
	 * Gets the log as text.
	 *
	 * @return the log
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Column(name = "log", length = 10000000)
	public String getLog() {
		return logs.toString();
	}

	/**
	 * Sets the log.
	 *
	 * @param log the new log
	 */
	public void setLog(String log) {
		this.logs = new StringBuffer(log);
	}

	/**
	 * Sets the running.
	 */
	public void setRunning() {
		this.logs = new StringBuffer();
		this.status = Status.RUNNING;
		this.executionDate = new Date();
	}

	/**
	 * Sets the scheduled.
	 */
	public void setScheduled() {
		this.status = Status.SCHEDULED;
	}

	/**
	 * Sets the task as waiting.
	 */
	public void setWaiting() {
		this.status = Status.WAITING;
	}

	@Override
	public String toString() {
		return "Task " + id + " (type " + this.getClass().getSimpleName() + ", target '" + target
				+ "', author '" + author + "', created on " + creationDate
				+ ", executed on " + executionDate + ", description '" + getTaskDescription()
				+ "', schedule type " + scheduleType + "', schedule factor " + scheduleFactor + ")";
	}

}
