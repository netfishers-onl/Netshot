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
package net.netshot.netshot.work;

import java.time.Instant;
import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import org.hibernate.Session;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.quartz.JobKey;
import org.quartz.Trigger;
import org.slf4j.event.Level;
import org.slf4j.helpers.MessageFormatter;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.database.Database;
import net.netshot.netshot.rest.RestViews.DefaultView;
import net.netshot.netshot.work.tasks.CheckComplianceTask;
import net.netshot.netshot.work.tasks.CheckGroupComplianceTask;
import net.netshot.netshot.work.tasks.CheckGroupSoftwareTask;
import net.netshot.netshot.work.tasks.DiscoverDeviceTypeTask;
import net.netshot.netshot.work.tasks.PurgeDatabaseTask;
import net.netshot.netshot.work.tasks.RunDeviceGroupScriptTask;
import net.netshot.netshot.work.tasks.RunDeviceScriptTask;
import net.netshot.netshot.work.tasks.RunDiagnosticsTask;
import net.netshot.netshot.work.tasks.RunGroupDiagnosticsTask;
import net.netshot.netshot.work.tasks.ScanSubnetsTask;
import net.netshot.netshot.work.tasks.TakeGroupSnapshotTask;
import net.netshot.netshot.work.tasks.TakeSnapshotTask;


/**
 * A task.
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(indexes = {
	@Index(name = "changeDateIndex", columnList = "changeDate"),
	@Index(name = "creationDateIndex", columnList = "creationDate"),
	@Index(name = "statusIndex", columnList = "status"),
	@Index(name = "executionDateIndex", columnList = "executionDate")
})
@XmlRootElement
@XmlAccessorType(XmlAccessType.NONE)
@JsonTypeInfo(use = JsonTypeInfo.Id.SIMPLE_NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
	@Type(CheckComplianceTask.class),
	@Type(CheckGroupComplianceTask.class),
	@Type(CheckGroupSoftwareTask.class),
	@Type(DiscoverDeviceTypeTask.class),
	@Type(PurgeDatabaseTask.class),
	@Type(RunDeviceGroupScriptTask.class),
	@Type(RunDeviceScriptTask.class),
	@Type(RunDiagnosticsTask.class),
	@Type(RunGroupDiagnosticsTask.class),
	@Type(ScanSubnetsTask.class),
	@Type(TakeGroupSnapshotTask.class),
	@Type(TakeSnapshotTask.class),
})
@Slf4j
public abstract class Task implements Cloneable {

	/**
	 * The Enum ScheduleType.
	 */
	public enum ScheduleType {
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
	public enum Status {

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
			for (Class<?> clazz : Database.listClassesInPackage("net.netshot.netshot.work.tasks")) {
				if (Task.class.isAssignableFrom(clazz)) {
					@SuppressWarnings("unchecked") Class<? extends Task> taskClass = (Class<? extends Task>) clazz;
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
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String author = "";

	/** The change date. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date changeDate;

	/** The comments. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String comments = "";

	/** The creation date. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date creationDate = new Date();

	/** Debug enabled. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	protected boolean debugEnabled = false;

	/** The debug log. */
	@Getter(onMethod = @__({
		@OneToOne(orphanRemoval = true, fetch = FetchType.LAZY, cascade = CascadeType.ALL),
		@OnDelete(action = OnDeleteAction.SET_NULL)
	}))
	@Setter
	protected DebugLog debugLog;

	/** The execution date. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date executionDate;

	/** The id. */
	@Getter(onMethod = @__({
		@Id, @GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected long id;

	/** The log. */
	protected StringBuffer logs = new StringBuffer();

	/** Full debug logs */
	protected StringBuffer fullLogs = null;

	/** Task context. */
	protected TaskContext logger = new TaskContext() {
		@Override
		public void log(Level level, String message, Object... params) {
			if (fullLogs != null) {
				fullLogs
					.append(Instant.now())
					.append(" [").append(level).append("] ")
					.append(MessageFormatter.arrayFormat(message, params).getMessage())
					.append("\n");
			}
			if (level.toInt() <= Level.TRACE.toInt()) {
				// Don't log traces to base logs
				return;
			}
			logs
				.append(Instant.now())
				.append(" [").append(level).append("] ")
				.append(MessageFormatter.arrayFormat(message, params).getMessage())
				.append("\n");
		}

		@Override
		public boolean isTracing() {
			return debugEnabled;
		}

		@Override
		public String getIdentifier() {
			return "%s_%d".formatted(Task.this.getClass().getSimpleName(), Task.this.getId());
		}
	};

	/** The schedule reference. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Date scheduleReference = new Date();

	/** The schedule type. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected ScheduleType scheduleType = ScheduleType.ASAP;

	/** The factor (to multiply type). */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected int scheduleFactor = 1;

	/** The status. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected Status status = Status.NEW;

	/** The target. */
	@Getter(onMethod = @__({
		@Column(length = 10000),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	protected String target = "None";

	/** DB version field. */
	@Getter(onMethod = @__({
		@Version
	}))
	@Setter
	private int version;

	/** Runner ID (clustering mode). */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String runnerId;

	/** Task priority. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private int priority = Trigger.DEFAULT_PRIORITY;

	/**
	 * Instantiates a new task.
	 */
	protected Task() {
	}

	/**
	 * Instantiates a new task.
	 *
	 * @param comments = the comments
	 * @param target = the target
	 * @param author = the author
	 * @param debugEnabled = whether to enable debugging
	 */
	public Task(String comments, String target, String author, boolean debugEnabled) {
		this.comments = comments;
		this.target = target;
		this.author = author;
		this.debugEnabled = debugEnabled;
		if (this.debugEnabled) {
			this.fullLogs = new StringBuffer();
		}
	}

	/**
	 * Instantiates a new task.
	 *
	 * @param comments = the comments
	 * @param target = the target
	 * @param author = the author
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
	public abstract JobKey getIdentity();


	/*(non-Javadoc)
	 * @see java.lang.Object#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		Task task = (Task) super.clone();
		task.setScheduleReference(this.scheduleReference);
		task.setScheduleType(this.scheduleType);
		task.setScheduleFactor(this.scheduleFactor);
		task.setPriority(this.priority);
		task.setId(0);
		return task;
	}

	/*(non-Javadoc)
	 * @see java.lang.Object#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (obj == null) {
			return false;
		}
		if (!(obj instanceof Task)) {
			return false;
		}
		Task other = (Task) obj;
		if (id != other.id) {
			return false;
		}
		return true;
	}

	/**
	 * Gets the next execution date.
	 *
	 * @return the next execution date
	 */
	@Transient
	@XmlElement
	@JsonView(DefaultView.class)
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
			Calendar targetCalendar = Calendar.getInstance();
			targetCalendar.setTime(this.scheduleReference);
			if (targetCalendar.get(Calendar.YEAR) < inOneMinute.get(Calendar.YEAR)) {
				targetCalendar.set(Calendar.YEAR, inOneMinute.get(Calendar.YEAR) - 1);
			}
			for (int i = 0; i < 100000; i++) {
				if (targetCalendar.after(inOneMinute)) {
					return targetCalendar.getTime();
				}
				targetCalendar.add(unit, factor);
			}
			return targetCalendar.getTime();
		}

		return null;
	}

	/**
	 * Gets the task description.
	 *
	 * @return the task description
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Transient
	public abstract String getTaskDescription();

	/*(non-Javadoc)
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
	@XmlElement
	@JsonView(DefaultView.class)
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
	 * @param session = the session
	 */
	public void prepare(Session session) {
		// Override to actually do something
	}

	/**
	 * Enable or disable full debugging on this task
	 * @param debugEnabled true to enable full debugging
	 */
	public void setDebugEnabled(boolean debugEnabled) {
		this.debugEnabled = debugEnabled;
		if (debugEnabled && this.fullLogs == null) {
			this.fullLogs = new StringBuffer();
		}
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
	 * @param factor the scheduling factor
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
	public void setCancelled(String reason) {
		this.status = Status.CANCELLED;
		this.logger.warn(reason);
	}

	/**
	 * Sets the task as failed.
	 */
	public void setFailed() {
		this.status = Status.FAILURE;
	}

	/**
	 * Sets the logs.
	 *
	 * @param logs the new logs
	 */
	public void setLogs(String logs) {
		this.logs = new StringBuffer(logs);
	}

	/**
	 * Sets the logs.
	 *
	 * @param logs the new logs
	 */
	public void setLogs(StringBuffer logs) {
		this.logs = logs;
	}

	/**
	 * Gets the logs as text.
	 *
	 * @return the logs
	 */
	@XmlElement
	@JsonView(DefaultView.class)
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
			+ "', schedule type " + scheduleType + "', schedule factor " + scheduleFactor
			+ ", priority " + priority
			+ ")";
	}

}
