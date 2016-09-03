/**
 * Copyright 2013-2016 Sylvain Cadilhac (NetFishers)
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

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.persistence.Version;
import javax.persistence.Index;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.Database;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonTypeInfo;


/**
 * A task.
 */
@Entity @Inheritance(strategy = InheritanceType.JOINED)
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@Table(indexes = {
		@Index(name = "changeDateIndex", columnList = "changeDate"),
		@Index(name = "creationDateIndex", columnList = "creationDate"),
		@Index(name = "statusIndex", columnList = "status"),
		@Index(name = "executionDateIndex", columnList = "executionDate")
})
@JsonTypeInfo(use = JsonTypeInfo.Id.MINIMAL_CLASS, include = JsonTypeInfo.As.PROPERTY, property = "type")
public abstract class Task implements Cloneable {

	/**
	 * The Enum ScheduleType.
	 */
	public static enum ScheduleType {

		/** The asap. */
		ASAP,

		/** The at. */
		AT,

		/** The daily. */
		DAILY,

		/** The monthly. */
		MONTHLY,

		/** The weekly. */
		WEEKLY
	}

	/**
	 * The Enum Status.
	 */
	public static enum Status {

		/** The failure. */
		FAILURE,

		/** The new. */
		NEW,

		/** The running. */
		RUNNING,

		/** The scheduled. */
		SCHEDULED,

		/** The success. */
		SUCCESS,

		/** The waiting. */
		WAITING,

		/** The cancelled. */
		CANCELLED
	}

	/** The Constant TASK_CLASSES. */
	private static final Set<Class<? extends Task>> TASK_CLASSES;

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(Task.class);

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

	/** The change date. */
	protected Date changeDate;
	
	private int version;

	/** The creation date. */
	protected Date creationDate = new Date();

	/** The execution date. */
	protected Date executionDate;

	/** The id. */
	protected long id;

	/** The log. */
	protected StringBuffer log = new StringBuffer();

	/** The comments. */
	protected String comments = "";

	/** The schedule reference. */
	protected Date scheduleReference = new Date();

	/** The schedule type. */
	protected ScheduleType scheduleType = ScheduleType.ASAP;

	/** The status. */
	protected Status status = Status.NEW;

	/** The target. */
	protected String target = "None";

	protected String author = "";

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
	public Task(String comments, String target, String author) {
		this.comments = comments;
		this.target = target;
		this.author = author;
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
	 * Gets the change date.
	 *
	 * @return the change date
	 */
	@XmlElement
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
	 * Gets the creation date.
	 *
	 * @return the creation date
	 */
	@XmlElement
	public Date getCreationDate() {
		return creationDate;
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@XmlElement
	@Id
	@GeneratedValue
	public long getId() {
		return id;
	}

	/**
	 * Gets the log.
	 *
	 * @return the log
	 */
	@XmlElement
	@Column(name = "log", length = 100000000)
	public String getLog() {
		return log.toString();
	}

	/**
	 * Gets the schedule reference.
	 *
	 * @return the schedule reference
	 */
	@XmlElement
	public Date getScheduleReference() {
		return scheduleReference;
	}

	/**
	 * Gets the schedule type.
	 *
	 * @return the schedule type
	 */
	@XmlElement
	public ScheduleType getScheduleType() {
		return scheduleType;
	}

	/**
	 * Gets the status.
	 *
	 * @return the status
	 */
	@XmlElement
	public Status getStatus() {
		return status;
	}

	/**
	 * Gets the task description.
	 *
	 * @return the task description
	 */
	@XmlElement
	@Transient
	abstract public String getTaskDescription();

	/**
	 * Gets the next execution date.
	 *
	 * @return the next execution date
	 */
	@Transient
	@XmlElement
	public Date getNextExecutionDate() {
		Calendar reference = Calendar.getInstance();
		reference.setTime(this.scheduleReference);
		Calendar target = Calendar.getInstance();
		Calendar inOneMinute = Calendar.getInstance();
		inOneMinute.add(Calendar.MINUTE, 1);

		switch (this.scheduleType) {
		case AT:
			return this.scheduleReference;
		case DAILY:
			target.set(Calendar.HOUR_OF_DAY, reference.get(Calendar.HOUR_OF_DAY));
			target.set(Calendar.MINUTE, reference.get(Calendar.MINUTE));
			target.set(Calendar.SECOND, reference.get(Calendar.SECOND));
			target.set(Calendar.MILLISECOND, 0);
			if (target.before(inOneMinute)) {
				target.add(Calendar.DAY_OF_MONTH, 1);
			}
			return target.getTime();
		case WEEKLY:
			target.set(Calendar.HOUR_OF_DAY, reference.get(Calendar.HOUR_OF_DAY));
			target.set(Calendar.MINUTE, reference.get(Calendar.MINUTE));
			target.set(Calendar.SECOND, reference.get(Calendar.SECOND));
			target.set(Calendar.MILLISECOND, 0);
			target.set(Calendar.DAY_OF_WEEK, reference.get(Calendar.DAY_OF_WEEK));
			if (target.before(inOneMinute)) {
				target.add(Calendar.WEEK_OF_YEAR, 1);
			}
			return target.getTime();
		case MONTHLY:
			target.set(Calendar.HOUR_OF_DAY, reference.get(Calendar.HOUR_OF_DAY));
			target.set(Calendar.MINUTE, reference.get(Calendar.MINUTE));
			target.set(Calendar.SECOND, reference.get(Calendar.SECOND));
			target.set(Calendar.MILLISECOND, 0);
			target.set(Calendar.DAY_OF_MONTH, reference.get(Calendar.DAY_OF_MONTH));
			if (target.before(inOneMinute)) {
				target.add(Calendar.MONTH, 1);
			}
			return target.getTime();
		case ASAP:
		default:
			return null;
		}
	}

	/**
	 * Checks if is repeating.
	 *
	 * @return true, if is repeating
	 */
	@Transient
	@XmlElement
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
	 * Log it.
	 *
	 * @param log the log
	 * @param level the level
	 */
	public void logIt(String log, int level) {
		this.log.append(String.format("[%02d] %s\n", level, log));
	}

	/**
	 * Run.
	 */
	public abstract void run();

	/**
	 * Prepare.
	 */
	public void prepare() {

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
	 * Sets the creation date.
	 *
	 * @param creationDate the new creation date
	 */
	public void setCreationDate(Date creationDate) {
		this.creationDate = creationDate;
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
	 * Sets the cancelled.
	 */
	public void setCancelled() {
		this.status = Status.CANCELLED;
	}

	/**
	 * Sets the failed.
	 */
	public void setFailed() {
		this.status = Status.FAILURE;
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
	 * Schedule.
	 *
	 * @param reference the reference
	 * @param type the type
	 */
	public void schedule(Date reference, ScheduleType type) {
		this.scheduleType = type;
		this.scheduleReference = reference;
	}

	/**
	 * Schedule.
	 *
	 * @param minutes the minutes
	 */
	public void schedule(int minutes) {
		this.scheduleType = ScheduleType.AT;
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.MINUTE, minutes);
		this.scheduleReference = calendar.getTime();
	}

	/**
	 * Sets the status.
	 *
	 * @param status the new status
	 */
	public void setStatus(Status status) {
		this.status = status;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		Task task = (Task) super.clone();
		task.setScheduleReference(this.scheduleReference);
		task.setScheduleType(this.scheduleType);
		task.setId(0);
		return task;
	}

	/**
	 * Gets the execution date.
	 *
	 * @return the execution date
	 */
	@XmlElement
	public Date getExecutionDate() {
		return executionDate;
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
	 * Gets the comments.
	 *
	 * @return the comments
	 */
	@XmlElement
	public String getComments() {
		return comments;
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
	 * Gets the target.
	 *
	 * @return the target
	 */
	@XmlElement
	@Column(length = 10000)
	public String getTarget() {
		return target;
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
	 * On schedule.
	 */
	public void onSchedule() {

	}

	/**
	 * On cancel.
	 */
	public void onCancel() {
	}

	@XmlElement
	public String getAuthor() {
		return author;
	}

	public void setAuthor(String author) {
		this.author = author;
	}

}
