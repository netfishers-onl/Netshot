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
package onl.netfishers.netshot.work.tasks;

import java.util.Calendar;
import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.work.Task;

import org.hibernate.CacheMode;
import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task makes some clean up on the database.
 */
@Entity
public class PurgeDatabaseTask extends Task {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(PurgeDatabaseTask.class);
	
	private int days;
	
	private int configDays = -1;
	private int configSize = 0;
	private int configKeepDays = 0;


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
			int configSize, int configKeepDays) {
		super(comments, "Global", author);
		this.days = days;
		this.configDays = configDays;
		this.configSize = configSize;
		this.configKeepDays = configKeepDays;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@Transient
	public String getTaskDescription() {
		return "Database purge";
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		logger.debug("Starting cleanup process.");

		{
			Session session = Database.getSession();
			try {
				session.beginTransaction();
				logger.trace("Cleaning up tasks finished more than {} days ago...", days);
				this.info(String.format("Cleaning up tasks more than %d days ago...", days));
				Calendar when = Calendar.getInstance();
				when.add(Calendar.DATE, -1 * days);
				ScrollableResults tasks = session.createQuery(
						"from Task t where (t.status = :cancelled or t.status = :failure "
								+ "or t.status = :success) and (t.executionDate < :when)")
					.setParameter("cancelled", Task.Status.CANCELLED)
					.setParameter("failure", Task.Status.FAILURE)
					.setParameter("success", Task.Status.SUCCESS)
					.setDate("when", when.getTime())
					.setCacheMode(CacheMode.IGNORE)
					.scroll(ScrollMode.FORWARD_ONLY);
				int count = 0;
				while (tasks.next()) {
					Task task = (Task) tasks.get(0);
					session.delete(task);
					if (++count % 50 == 0) {
						session.flush();
						session.clear();
					}
				}
				session.getTransaction().commit();
				logger.trace("Cleaning up done on tasks, {} entries affected.", count);
				this.info(String.format("Cleaning up done on tasks, %d entries affected.", count));
			}
			catch (HibernateException e) {
				try {
					session.getTransaction().rollback();
				}
				catch (Exception e1) {
	
				}
				logger.error("Database error while purging the old tasks from the database.", e);
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
				logger.error("Error while purging the old tasks from the database.", e);
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
				logger.trace("Cleaning up configurations taken more than {} days ago...", configDays);
				this.info(String.format("Cleaning up configurations older than %d days...", configDays));
				Calendar when = Calendar.getInstance();
				when.add(Calendar.DATE, -1 * configDays);
				Query query;
				if (configSize > 0) {
					query = session
						.createQuery("select c from Config c join c.attributes a where (a.class = ConfigLongTextAttribute) group by c.id having (max(length(a.longText.text)) > :size) and (c.changeDate < :when) order by c.device asc, c.changeDate desc")
						.setInteger("size", configSize * 1024);
				}
				else {
					query = session
						.createQuery("from Config c where (c.changeDate < :when) order by c.device asc, c.changeDate desc");
				}
				ScrollableResults configs = query
					.setCalendar("when", when)
					.setCacheMode(CacheMode.IGNORE)
					.scroll(ScrollMode.FORWARD_ONLY);
				long dontDeleteDevice = -1;
				Date dontDeleteBefore = null;
				int count = 0;
				while (configs.next()) {
					try {
						Config config = (Config) configs.get(0);
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
							session.delete(config);
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
				logger.trace("Cleaning up done on configurations, {} entries affected.", count);
				this.info(String.format("Cleaning up done on configurations, %d entries affected.", count));
			}
			catch (HibernateException e) {
				try {
					session.getTransaction().rollback();
				}
				catch (Exception e1) {
	
				}
				logger.error("Database error while purging the old configurations from the database.", e);
				this.error("Database error during the configuration purge.");
				this.status = Status.FAILURE;
				return;
			}
			catch (Exception e) {
				try {
					session.getTransaction().rollback();
				}
				catch (Exception e1) {
					
				}
				logger.error("Error while purging the old configurations from the database.", e);
				this.error("Error during the configuration purge.");
				this.status = Status.FAILURE;
				return;
			}
			finally {
				session.close();
			}
		}

		this.status = Status.SUCCESS;
		logger.trace("Cleaning up process finished.");
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		PurgeDatabaseTask task = (PurgeDatabaseTask) super.clone();
		return task;
	}

	@XmlElement
	public int getDays() {
		return days;
	}

	public void setDays(int days) {
		this.days = days;
	}

	@XmlElement
	public int getConfigDays() {
		return configDays;
	}

	public void setConfigDays(int configDays) {
		this.configDays = configDays;
	}

	@XmlElement
	public int getConfigSize() {
		return configSize;
	}

	public void setConfigSize(int configSize) {
		this.configSize = configSize;
	}

	@XmlElement
	public int getConfigKeepDays() {
		return configKeepDays;
	}

	public void setConfigKeepDays(int configKeepDays) {
		this.configKeepDays = configKeepDays;
	}

}
