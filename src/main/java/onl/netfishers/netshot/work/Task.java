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

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;


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
@JsonTypeInfo(use = JsonTypeInfo.Id.MINIMAL_CLASS, include = JsonTypeInfo.As.PROPERTY, property = "type")
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
		WAITING
	}

	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(Task.class);

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
			logger.error("Error while scanning the task classes.", e);
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

	protected String author = "";
	
	/** The change date. */
	protected Date changeDate;

	/** The comments. */
	protected String comments = "";

	/** The creation date. */
	protected Date creationDate = new Date();

	/** Debug enabled. */
	protected boolean debugEnabled = false;

	/** The debug log. */
	protected DebugLog debugLog;
	
	/** The execution date. */
	protected Date executionDate;

	/** The id. */
	protected long id;

	/** The log. */
	protected StringBuffer log = new StringBuffer();

	/** The schedule reference. */
	protected Date scheduleReference = new Date();

	/** The schedule type. */
	protected ScheduleType scheduleType = ScheduleType.ASAP;

	/** The factor (to multiply type) */
	protected int scheduleFactor = 1;
	
	/** The status. */
	protected Status status = Status.NEW;

	/** The target. */
	protected String target = "None";

	/** DB version field. */
	private int version;

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
	
	@XmlElement @JsonView(DefaultView.class)
	public String getAuthor() {
		return author;
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

	/**
	 * Gets the comments.
	 *
	 * @return the comments
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getComments() {
		return comments;
	}

	/**
	 * Gets the creation date.
	 *
	 * @return the creation date
	 */
	@XmlElement @JsonView(DefaultView.class)
	public Date getCreationDate() {
		return creationDate;
	}

	/**
	 * Gets the debug log.
	 * @return the debug log
	 */
	@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	public DebugLog getDebugLog() {
		return debugLog;
	}

	/**
	 * Gets the execution date.
	 *
	 * @return the execution date
	 */
	@XmlElement @JsonView(DefaultView.class)
	public Date getExecutionDate() {
		return executionDate;
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public long getId() {
		return id;
	}

	/**
	 * Gets the log.
	 *
	 * @return the log
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Column(name = "log", length = 10000000)
	public String getLog() {
		return log.toString();
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
	 * Gets the schedule reference.
	 *
	 * @return the schedule reference
	 */
	@XmlElement @JsonView(DefaultView.class)
	public Date getScheduleReference() {
		return scheduleReference;
	}

	/**
	 * Gets the schedule type.
	 *
	 * @return the schedule type
	 */
	@XmlElement @JsonView(DefaultView.class)
	public ScheduleType getScheduleType() {
		return scheduleType;
	}

	/**
	 * Gets the schedule factor.
	 * 
	 * @return the schedule factor
	 */
	@XmlElement @JsonView(DefaultView.class)
	public int getScheduleFactor() {
		return scheduleFactor;
	}

	/**
	 * Gets the status.
	 *
	 * @return the status
	 */
	@XmlElement @JsonView(DefaultView.class)
	public Status getStatus() {
		return status;
	}

	/**
	 * Gets the target.
	 *
	 * @return the target
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Column(length = 10000)
	public String getTarget() {
		return target;
	}

	/**
	 * Gets the task description.
	 *
	 * @return the task description
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	abstract public String getTaskDescription();

	@Version
	public int getVersion() {
		return version;
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
	 * Is debug enabled on this task?
	 * @return true if debug is enabled
	 */
	@XmlElement @JsonView(DefaultView.class)
	public boolean isDebugEnabled() {
		return debugEnabled;
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
		this.log.append(String.format("[DEBUG] %s\n", message));
	}
	
	public void trace(String message) {
		this.log.append(String.format("[TRACE] %s\n", message));
	}
	
	public void info(String message) {
		this.log.append(String.format("[INFO] %s\n", message));
	}
	
	public void warn(String message) {
		this.log.append(String.format("[WARN] %s\n", message));
	}
	
	public void error(String message) {
		this.log.append(String.format("[ERROR] %s\n", message));
	}
	

	/**
	 * Get the JS logger
	 * @return the JS logger
	 */
	@Transient
	protected TaskLogger getJsLogger() {
		Task task = this;
		return new TaskLogger() {
			
			@Override
			public void warn(String message) {
				task.warn(message);
			}
			
			@Override
			public void trace(String message) {
				task.trace(message);
			}
			
			@Override
			public void info(String message) {
				task.info(message);
			}
			
			@Override
			public void error(String message) {
				task.error(message);
			}
			
			@Override
			public void debug(String message) {
				task.debug(message);
			}
		};
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
	 * Sets the author.
	 * 
	 * @param author Who requested the task
	 */
	public void setAuthor(String author) {
		this.author = author;
	}

	/**
	 * Sets the cancelled.
	 */
	public void setCancelled() {
		this.status = Status.CANCELLED;
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
	 * Sets the comments.
	 *
	 * @param comments the new comments
	 */
	public void setComments(String comments) {
		this.comments = comments;
	}

	/**
	 * Sets the creation date.
	 *
	 * @param creationDate the new creation date
	 */
	public void setCreationDate(Date creationDate) {
		this.creationDate = creationDate;
	}

	/**
	 * Enable debugging on this task.
	 * @param debugEnabled true to enable debugging
	 */
	public void setDebugEnabled(boolean debugEnabled) {
		this.debugEnabled = debugEnabled;
	}

	/**
	 * Sets the execution date.
	 *
	 * @param executionDate the new execution date
	 */
	public void setExecutionDate(Date executionDate) {
		this.executionDate = executionDate;
	}

	/**
	 * Sets the task as failed.
	 */
	public void setFailed() {
		this.status = Status.FAILURE;
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
	 * Sets the log.
	 *
	 * @param log the new log
	 */
	public void setLog(String log) {
		this.log = new StringBuffer(log);
	}

	/**
	 * Sets the log.
	 *
	 * @param log the new log
	 */
	public void setLog(StringBuffer log) {
		this.log = log;
	}

	/**
	 * Sets the debug log.
	 * @param debugLog the new debug log
	 */
	public void setDebugLog(DebugLog debugLog) {
		this.debugLog = debugLog;
	}

	/**
	 * Sets the running.
	 */
	public void setRunning() {
		this.log = new StringBuffer();
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
	 * Sets the schedule reference.
	 *
	 * @param scheduleReference the new schedule reference
	 */
	public void setScheduleReference(Date scheduleReference) {
		this.scheduleReference = scheduleReference;
	}
	
	/**
	 * Sets the schedule type.
	 *
	 * @param scheduleType the new schedule type
	 */
	public void setScheduleType(ScheduleType scheduleType) {
		this.scheduleType = scheduleType;
	}

	/**
	 * Sets the schedule factor.
	 * 
	 * @param scheduleFactor the new schedule factor
	 */
	public void setScheduleFactor(int scheduleFactor) {
		this.scheduleFactor = scheduleFactor;
	}

	/**
	 * Sets the status.
	 *
	 * @param status the new status
	 */
	public void setStatus(Status status) {
		this.status = status;
	}

	/**
	 * Sets the target.
	 *
	 * @param target the new target
	 */
	public void setTarget(String target) {
		this.target = target;
	}

	/**
	 * Sets the version
	 * @param version the new version
	 */
	public void setVersion(int version) {
		this.version = version;
	}

	@Override
	public String toString() {
		return "Task " + id + " (type " + this.getClass().getSimpleName() + ", target '" + target
				+ "', author '" + author + "', created on " + creationDate
				+ ", executed on " + executionDate + ", description '" + getTaskDescription()
				+ "', schedule type " + scheduleType + "', schedule factor " + scheduleFactor + ")";
	}

}
