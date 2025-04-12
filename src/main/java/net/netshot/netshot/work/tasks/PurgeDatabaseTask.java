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
package net.netshot.netshot.work.tasks;

import java.io.File;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Transient;
import jakarta.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.database.Database;
import net.netshot.netshot.device.Config;
import net.netshot.netshot.device.DeviceGroup;
import net.netshot.netshot.device.attribute.ConfigAttribute;
import net.netshot.netshot.device.attribute.ConfigBinaryFileAttribute;
import net.netshot.netshot.rest.RestViews.DefaultView;
import net.netshot.netshot.work.Task;

import org.hibernate.CacheMode;
import org.hibernate.HibernateException;
import org.hibernate.query.MutationQuery;
import org.hibernate.query.Query;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.Session;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.quartz.JobKey;

/**
 * This task makes some clean up on the database.
 */
@Entity
@OnDelete(action = OnDeleteAction.CASCADE)
@Slf4j
public class PurgeDatabaseTask extends Task implements GroupBasedTask {

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private int days;

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private int configDays = -1;

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private int configSize = 0;

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private int configKeepDays = 0;

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private int moduleDays = -1;

	/** The device group. */
	@Getter(onMethod=@__({
		@ManyToOne(fetch = FetchType.LAZY),
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	private DeviceGroup deviceGroup;


	/**
	 * Instantiates a new task.
	 */
	protected PurgeDatabaseTask() {
	}

	/**
	 * Instantiates a new scan subnets task.
	 *
	 * @param comments the comments
	 */
	public PurgeDatabaseTask(String comments, String author, int days, int configDays,
			int configSize, int configKeepDays, int moduleDays, DeviceGroup group) {
		super(comments, "Global", author);
		this.days = days;
		this.configDays = configDays;
		this.configSize = configSize;
		this.configKeepDays = configKeepDays;
		this.moduleDays = moduleDays;
		this.deviceGroup = group;
	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getTaskDescription() {
		return "Database purge";
	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		log.debug("Task {}. Starting cleanup process (group {}).", this.getId(),
			this.deviceGroup == null ? "all" : this.deviceGroup.getId());

		if (days > 0) {
			Session session = Database.getSession();
			try {
				session.beginTransaction();
				log.trace("Task {}. Cleaning up tasks finished more than {} days ago...", this.getId(), days);
				this.info(String.format("Cleaning up tasks more than %d days ago...", days));
				Calendar when = Calendar.getInstance();
				when.add(Calendar.DATE, -1 * days);

				int count = 0;
				if (this.deviceGroup == null) {
					count += session.createMutationQuery(
						"delete Task t where (t.status = :cancelled or t.status = :failure "
								+ "or t.status = :success) and (t.executionDate < :when)")
						.setParameter("cancelled", Task.Status.CANCELLED)
						.setParameter("failure", Task.Status.FAILURE)
						.setParameter("success", Task.Status.SUCCESS)
						.setParameter("when", when.getTime())
						.executeUpdate();
				}
				else {
					for (Class<? extends Task> taskClass : Task.getTaskClasses()) {
						if (DeviceBasedTask.class.isAssignableFrom(taskClass)) {
							count += session.createMutationQuery(
								String.format(
									"delete %1$s t where t in " +
									"(select t from %1$s join t.device d join d.ownerGroups g " +
									"where g = :group and (t.status = :cancelled or t.status = :failure or t.status = :success) " +
									"and (t.executionDate < :when))", taskClass.getSimpleName()))
								.setParameter("group", this.deviceGroup)
								.setParameter("cancelled", Task.Status.CANCELLED)
								.setParameter("failure", Task.Status.FAILURE)
								.setParameter("success", Task.Status.SUCCESS)
								.setParameter("when", when.getTime())
								.executeUpdate();
						}
					}
				}
				session.getTransaction().commit();
				log.trace("Task {}. Cleaning up done on tasks, {} entries affected.", this.getId(), count);
				this.info(String.format("Cleaning up done on tasks, %d entries affected.", count));
			}
			catch (HibernateException e) {
				try {
					session.getTransaction().rollback();
				}
				catch (Exception e1) {

				}
				log.error("Task {}. Database error while purging the old tasks from the database.", this.getId(), e);
				this.error("Database error during the task purge.");
				this.status = Status.FAILURE;
				return;
			}
			catch (Exception e) {
				try {
					session.getTransaction().rollback();
				}
				catch (Exception e1) {

				}
				log.error("Task {}. Error while purging the old tasks from the database.", this.getId(), e);
				this.error("Error during the task purge.");
				this.status = Status.FAILURE;
				return;
			}
			finally {
				session.close();
			}
		}

		if (configDays > 0) {
			Session session = Database.getSession();
			try {
				session.beginTransaction();
				log.trace("Task {}. Cleaning up configurations taken more than {} days ago...", this.getId(), configDays);
				this.info(String.format("Cleaning up configurations older than %d days...", configDays));
				Calendar when = Calendar.getInstance();
				when.add(Calendar.DATE, -1 * configDays);
				Query<Config> query;
				if (configSize > 0) {
					if (deviceGroup == null) {
						query = session
							.createQuery(
								"select c from Config c join c.attributes a where (a.class = ConfigLongTextAttribute or a.class = ConfigBinaryFileAttribute) " +
								"group by c.id having ((max(length(a.longText.text)) > :size) or (max(a.fileSize) > :size)) and (c.changeDate < :when) " +
								"order by c.device asc, c.changeDate desc", Config.class)
							.setParameter("size", configSize * 1024);
					}
					else {
						query = session
							.createQuery(
								"select c from Config c join c.device d join d.ownerGroups g join c.attributes a " +
								"where g = :group and (a.class = ConfigLongTextAttribute or a.class = ConfigBinaryFileAttribute) " +
								"group by c.id having ((max(length(a.longText.text)) > :size) or (max(a.fileSize) > :size)) and (c.changeDate < :when) " +
								"order by c.device asc, c.changeDate desc", Config.class)
							.setParameter("group", this.deviceGroup)
							.setParameter("size", configSize * 1024);
					}
				}
				else if (deviceGroup == null) {
					query = session.createQuery(
						"select c from Config c where (c.changeDate < :when) order by c.device asc, c.changeDate desc", Config.class);
				}
				else {
					query = session.createQuery(
							"select c from Config c join c.device d join d.ownerGroups g " +
							"where g = :group and (c.changeDate < :when) " +
							"order by c.device asc, c.changeDate desc", Config.class)
						.setParameter("group", this.deviceGroup);
				}
				ScrollableResults<Config> configs = query
					.setParameter("when", when.getTime())
					.setCacheMode(CacheMode.IGNORE)
					.scroll(ScrollMode.FORWARD_ONLY);
				long dontDeleteDevice = -1;
				Date dontDeleteBefore = null;
				int count = 0;
				List<File> toDeleteFiles = new ArrayList<File>();
				while (configs.next()) {
					try {
						Config config = configs.get();
						if ((config.getDevice().getLastConfig() != null && config.getDevice().getLastConfig().getId() == config.getId()) ||
								(dontDeleteBefore != null && config.getChangeDate().before(dontDeleteBefore)) ||
								(configKeepDays > 0 && dontDeleteDevice != config.getDevice().getId())) {
							if (configKeepDays > 0) {
								Calendar limitCalendar = Calendar.getInstance();
								limitCalendar.setTime(config.getChangeDate());
								limitCalendar.add(Calendar.DATE, -1 * configKeepDays);
								dontDeleteBefore = limitCalendar.getTime();
							}
						}
						else {
							for (ConfigAttribute attribute : config.getAttributes()) {
								if (attribute instanceof ConfigBinaryFileAttribute) {
									toDeleteFiles.add(((ConfigBinaryFileAttribute) attribute).getFileName());
								}
							}
							session.remove(config);
							if (++count % 30 == 0) {
								session.flush();
								session.clear();
							}
						}
						dontDeleteDevice = config.getDevice().getId();
					}
					catch (NullPointerException e1) {
					}
				}
				session.getTransaction().commit();
				log.trace("Task {}. Cleaning up done on configurations, {} entries affected.", this.getId(), count);
				this.info(String.format("Cleaning up done on configurations, %d entries affected.", count));
				for (File toDeleteFile : toDeleteFiles) {
					try {
						toDeleteFile.delete();
					}
					catch (Exception e) {
						log.error("Error while removing binary file {}", toDeleteFile, e);
					}
				}
			}
			catch (HibernateException e) {
				try {
					session.getTransaction().rollback();
				}
				catch (Exception e1) {
					log.error("Task {}. Error during transaction rollback.", this.getId(), e1);
				}
				log.error("Task {}. Database error while purging the old configurations from the database.",
						this.getId(), e);
				this.error("Database error during the configuration purge.");
				this.status = Status.FAILURE;
				return;
			}
			catch (Exception e) {
				try {
					session.getTransaction().rollback();
				}
				catch (Exception e1) {
					log.error("Task {}. Error during transaction rollback.", this.getId(), e1);
				}
				log.error("Task {}. Error while purging the old configurations from the database.",
						this.getId(), e);
				this.error("Error during the configuration purge.");
				this.status = Status.FAILURE;
				return;
			}
			finally {
				session.close();
			}
		}


		if (moduleDays > 0) {
			Session session = Database.getSession();
			try {
				session.beginTransaction();
				log.trace("Task {}. Cleaning up hardware modules removed more than {} days ago...", this.getId(), moduleDays);
				this.info(String.format("Cleaning up hardware modules removed more than %d days...", moduleDays));
				Calendar when = Calendar.getInstance();
				when.add(Calendar.DATE, -1 * moduleDays);

				final MutationQuery query;

				if (this.deviceGroup == null) {
					query = session
						.createMutationQuery("delete from Module m where m.removed and m.lastSeenDate <= :when")
						.setParameter("when", when.getTime());
				}
				else {
					query = session
						.createMutationQuery("delete from Module m where m in " +
							"(select m from Module m join m.device d join d.ownerGroups g " +
							"where g = :group and m.removed and m.lastSeenDate <= :when)")
						.setParameter("group", this.deviceGroup)
						.setParameter("when", when.getTime());
				}

				int count = query.executeUpdate();
				session.getTransaction().commit();
				log.trace("Task {}. Cleaning up done on modules, {} entries affected.", this.getId(), count);
				this.info(String.format("Cleaning up done on modules, %d entries affected.", count));
				
			}
			catch (Exception e) {
				try {
					session.getTransaction().rollback();
				}
				catch (Exception e1) {
					log.error("Task {}. Error during transaction rollback.", this.getId(), e1);
				}
				log.error("Task {}. Error while purging the old modules from the database.",
						this.getId(), e);
				this.error("Error during the module purge.");
				this.status = Status.FAILURE;
				return;
			}
			finally {
				session.close();
			}
		}

		this.status = Status.SUCCESS;
		log.trace("Task {}. Cleaning up process finished.", this.getId());
	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		PurgeDatabaseTask task = (PurgeDatabaseTask) super.clone();
		return task;
	}

	/*
	 * (non-Javadoc)
	 * @see net.netshot.netshot.work.Task#getIdentity()
	 */
	@Override
	@Transient
	public JobKey getIdentity() {
		return new JobKey(String.format("Task_%d", this.getId()), "PurgeDatabase");
	}

}
