/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.work;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.work.Task.Status;

import org.hibernate.Session;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A Quartz job which runs a Netshot task.
 */
public class TaskJob implements Job {

	/** The Constant NETSHOT_TASK. */
	public static final String NETSHOT_TASK = "Netshot Task";

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(TaskJob.class);

	/**
	 * Instantiates a new task job.
	 */
	public TaskJob() {
	}

	/* (non-Javadoc)
	 * @see org.quartz.Job#execute(org.quartz.JobExecutionContext)
	 */
	public void execute(JobExecutionContext context) throws JobExecutionException {
		logger.debug("Starting job.");
		Long id = (Long) context.getJobDetail().getJobDataMap()
				.get(NETSHOT_TASK);
		logger.trace("The task id is {}.", id);
		Task task = null;
		Session session = Database.getSession();
		try {
			Thread.sleep(1000);
			session.beginTransaction();
			task = (Task) session.get(Task.class, id);
			if (task == null) {
				logger.error("The retrieved task {} is null.", id);
			}
			task.setRunning();
			session.update(task);
			session.getTransaction().commit();
			logger.trace("Got the task.");
			task.prepare();
			logger.trace("The task has prepared its fields.");
		}
		catch (Exception e) {
			logger.error("Error while retrieving and updating the task.", e);
			try {
				session.getTransaction().rollback();
			}
			catch (Exception e1) {

			}
			throw new JobExecutionException("Unable to access the task.");
		}
		finally {
			session.close();
		}

		logger.trace("Running the task {} of type {}", id, task.getClass().getName());
		task.run();

		if (task.getStatus() == Status.RUNNING) {
			logger.error("The task {} exited with a status of RUNNING.", id);
			task.setStatus(Status.FAILURE);
		}

		logger.trace("Updating the task with the result.");
		session = Database.getSession();
		try {
			session.beginTransaction();
			session.update(task);
			session.getTransaction().commit();
		}
		catch (Exception e) {
			logger.error("Error while updating the task {} after execution.", id, e);
			try {
				session.getTransaction().rollback();
			}
			catch (Exception e1) {
				logger.error("Error during the rollback.", e1);
			}
			try {
				session.clear();
				session.beginTransaction();
				Task eTask = (Task) session.get(Task.class, id);
				eTask.setFailed();
				session.update(eTask);
				session.getTransaction().commit();
			}
			catch (Exception e1) {
				logger.error("Error while setting the task {} to FAILED.", id, e1);
			}
			throw new JobExecutionException("Unable to save the task.");
		}
		finally  {
			session.close();
		}



		try {
			TaskManager.repeatTask(task);
		}
		catch (Exception e) {
			logger.error("Unable to repeat the task {} again.", id);
		}

		logger.trace("End of task {}.", id);

	}

}