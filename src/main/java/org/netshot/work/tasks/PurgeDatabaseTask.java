/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.work.tasks;

import java.util.Calendar;

import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import org.hibernate.CacheMode;
import org.hibernate.HibernateException;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.Session;
import org.netshot.NetshotDatabase;
import org.netshot.work.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This task makes some clean up on the database.
 */
@Entity
public class PurgeDatabaseTask extends Task {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(PurgeDatabaseTask.class);


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
	public PurgeDatabaseTask(String comments) {
		super(comments, "Global");
	}

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@XmlElement
	@Transient
	public String getTaskDescription() {
		return "Purges the database";
	}

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		logger.debug("Starting cleanup process.");

		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			logger.trace("Cleaning up tasks finished for more than 3 months...");
			this.logIt("Cleaning up tasks more than 3 month old...", 5);
			Calendar when = Calendar.getInstance();
			when.add(Calendar.MONTH, -3);
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
			this.logIt(String.format("Cleaning up done on tasks, %d entries affected.", count), 5);
			this.status = Status.SUCCESS;
			logger.trace("Cleaning up process finished.");
		}
		catch (HibernateException e) {
			try {
				session.getTransaction().rollback();
			}
			catch (Exception e1) {

			}
			logger.error("Database error while purging the database.", e);
			this.logIt("Database error during the purge.", 1);
			this.status = Status.FAILURE;
		}
		catch (Exception e) {
			try {
				session.getTransaction().rollback();
			}
			catch (Exception e1) {
				
			}
			logger.error("Error while purging the database.", e);
			this.logIt("Error during the purge.", 1);
			this.status = Status.FAILURE;
		}
		finally {
			session.close();
		}


	}

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#clone()
	 */
	@Override
	public Object clone() throws CloneNotSupportedException {
		PurgeDatabaseTask task = (PurgeDatabaseTask) super.clone();
		return task;
	}

}
