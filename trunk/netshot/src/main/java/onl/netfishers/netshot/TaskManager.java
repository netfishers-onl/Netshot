/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */

package onl.netfishers.netshot;

import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Properties;

import onl.netfishers.netshot.work.Task;
import onl.netfishers.netshot.work.TaskJob;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SchedulerFactory;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

/**
 * The TaskManager schedules and runs the tasks.
 */
public class TaskManager {

	/** The factory. */
	private static SchedulerFactory factory;

	/** The scheduler. */
	private static Scheduler scheduler;

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(TaskManager.class);

	/**
	 * Initializes the task manager.
	 */
	public static void init() {
		Properties params = new Properties();
		params.put(StdSchedulerFactory.PROP_THREAD_POOL_CLASS,
				"org.quartz.simpl.SimpleThreadPool");
		params.put("org.quartz.threadPool.threadCount", Netshot.getConfig("netshot.tasks.threadcount", "10"));
		try {
			factory = new StdSchedulerFactory(params);
			scheduler = factory.getScheduler();
			scheduler.start();
		}
		catch (Exception e) {
			logger.error(MarkerFactory.getMarker("FATAL"), "Unable to instantiate the Task Manager", e);
			throw new RuntimeException("Unable to instantiate the Task Manager.", e);
		}
	}

	/**
	 * Cancels a task.
	 *
	 * @param task the task
	 * @param reason the reason
	 * @throws SchedulerException the scheduler exception
	 * @throws HibernateException the hibernate exception
	 */
	static public void cancelTask(Task task, String reason) throws SchedulerException,
	HibernateException {
		logger.debug("Cancelling task.");
		JobKey job = JobKey.jobKey(TaskManager.getTaskIdentity(task));
		scheduler.deleteJob(job);
		logger.trace("The task has been deleted from the scheduler.");
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			task.onCancel();
			task.setCancelled();
			task.logIt(reason, 2);
			session.saveOrUpdate(task);
			session.getTransaction().commit();
			logger.trace("Task successfully cancelled.");
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while updating the cancelled task.", e);
			throw e;
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the task identity.
	 *
	 * @param task the task
	 * @return the task identity
	 */
	static public String getTaskIdentity(Task task) {
		return String.format("task_%d", task.getId());
	}

	/**
	 * Adds a task to the scheduler.
	 *
	 * @param task the task
	 * @throws SchedulerException the scheduler exception
	 * @throws HibernateException the hibernate exception
	 */
	static public void addTask(Task task)
			throws SchedulerException, HibernateException {
		logger.debug("Adding task.");
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			task.onSchedule();
			task.setScheduled();
			session.saveOrUpdate(task);
			session.getTransaction().commit();
			session.evict(task);
			logger.trace("Task successfully added to the database.");
		}
		catch (Exception e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new task.", e);
			throw e;
		}
		finally {
			session.close();
		}


		JobDetail job = JobBuilder.newJob(TaskJob.class)
				.withIdentity(TaskManager.getTaskIdentity(task)).build();
		job.getJobDataMap().put(TaskJob.NETSHOT_TASK, new Long(task.getId()));
		Date when = task.getNextExecutionDate();
		Trigger trigger;
		if (when == null) {
			trigger = TriggerBuilder.newTrigger().startNow().build();
		}
		else {
			trigger = TriggerBuilder.newTrigger().startAt(when).build();
		}
		scheduler.scheduleJob(job, trigger);
		logger.trace("Task successfully added to the scheduler.");
	}

	/**
	 * Repeat task.
	 *
	 * @param task the task
	 * @throws SchedulerException the scheduler exception
	 * @throws HibernateException the hibernate exception
	 */
	static public void repeatTask(Task task) throws SchedulerException,
	HibernateException {
		logger.debug("Repeating task {} if necessary.", task.getId());
		if (!task.isRepeating()) {
			logger.trace("Not necessary.");
			return;
		}
		Task newTask;
		try {
			newTask = (Task) task.clone();
			logger.trace("Got a clone, will schedule it.");
			TaskManager.addTask(newTask);
		}
		catch (CloneNotSupportedException e) {
			logger.error("Unable to clone the task {}.", task.getId(), e);
		}
	}

	/**
	 * Reschedule all.
	 */
	@SuppressWarnings("unchecked")
	static public void rescheduleAll() {
		logger.debug("Will schedule the tasks that can be found in the database.");

		Session session = Database.getSession();
		List<Task> tasks;
		try {
			tasks = session
					.createQuery(
							"select t from Task t where t.status = :status1 or t.status = :status2")
							.setParameter("status1", Task.Status.SCHEDULED)
							.setParameter("status2", Task.Status.RUNNING).list();
		}
		catch (HibernateException e) {
			logger.error("Unable to retrieve the tasks from the database.", e);
			throw e;
		}
		finally {
			session.close();
		}

		logger.trace("Found {} task(s) to reschedule.", tasks.size());
		Calendar inOneMinute = Calendar.getInstance();
		inOneMinute.add(Calendar.MINUTE, 1);
		for (Task task : tasks) {
			try {
				Date when = task.getNextExecutionDate();
				if (when != null && when.after(inOneMinute.getTime())) {
					TaskManager.addTask(task);
				}
				else {
					TaskManager.cancelTask(task, "Task skipped, too late to run at server startup.");
				}
			}
			catch (SchedulerException e) {
				logger.error("Unable to schedule the task {}.", task.getId(), e);
			}
		}
	}

}
