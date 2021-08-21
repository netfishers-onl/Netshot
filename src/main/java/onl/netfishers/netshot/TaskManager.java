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
package onl.netfishers.netshot;

import java.util.Calendar;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.NavigableMap;
import java.util.Properties;
import java.util.Random;
import java.util.TreeMap;

import onl.netfishers.netshot.cluster.ClusterManager;
import onl.netfishers.netshot.cluster.ClusterMember;
import onl.netfishers.netshot.database.Database;
import onl.netfishers.netshot.work.Task;
import onl.netfishers.netshot.work.TaskJob;

import org.hibernate.Hibernate;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
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

	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(TaskManager.class);

	/** Possible modes for the task manager */
	public static enum Mode {
		SINGLE,
		CLUSTER_MASTER,
		CLUSTER_MEMBER,
	}

	/** Store the available runners with weighted-random selector */
	public static class RunnerSet {
		private final NavigableMap<Double, String> map = new TreeMap<Double, String>();
		private final Random random;
		private double total = 0;

		public RunnerSet() {
			this.random = new Random();
		}

		public void add(double weight, String runnerId) {
			if (weight > 0) {
				total += weight;
				map.put(total, runnerId);
			}
		}

		public String getNextRunnerId() {
			double value = random.nextDouble() * total;
			return map.higherEntry(value).getValue();
		}
	}

	/** The factory. */
	private static SchedulerFactory factory;

	/** The master scheduler (used in master mode to dispatch jobs). */
	private static Scheduler masterScheduler;

	/** The runner scheduler (used to run jobs). */
	private static Scheduler runnerScheduler;

	/** TaskManager mode */
	private static Mode mode = Mode.SINGLE;

	/** Available runners */
	private static RunnerSet runnerSet;

	/**
	 * Initializes the task manager.
	 */
	public static void init() {
		Properties params = new Properties();
		params.put(StdSchedulerFactory.PROP_THREAD_POOL_CLASS, "org.quartz.simpl.SimpleThreadPool");
		params.put("org.quartz.threadPool.threadCount", Netshot.getConfig("netshot.tasks.threadcount", "10"));
		try {
			factory = new StdSchedulerFactory(params);
			masterScheduler = factory.getScheduler("master");
			masterScheduler.start();
			runnerScheduler = factory.getScheduler("runner");
			runnerScheduler.start();
		}
		catch (Exception e) {
			logger.error(MarkerFactory.getMarker("FATAL"), "Unable to instantiate the Task Manager", e);
			throw new RuntimeException("Unable to instantiate the Task Manager.", e);
		}
	}

	/**
	 * Sets the current TaskManager mode.
	 * @param mode the new mode to set
	 */
	public static void setMode(Mode mode) {
		TaskManager.mode = mode;
	}

	/**
	 * Reassign tasks of failed runner.
	 * @param runnerId
	 */
	private static void reassignTasks() {
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			List<String> runnerIds = session.createQuery(
					"select distinct t.runnerId from Task t where t.status = :waiting or t.status = :running", String.class)
				.setParameter("waiting", Task.Status.WAITING)
				.setParameter("running", Task.Status.RUNNING)
				.list();
			Iterator<String> runnerIdIt = runnerIds.iterator();
			while (runnerIdIt.hasNext()) {
				String runnerId = runnerIdIt.next();
				if (TaskManager.runnerSet.map.values().contains(runnerId)) {
					runnerIdIt.remove();
				}
			}
			if (runnerIds.size() > 0) {
				List<Task> tasks = session.createQuery(
						"select t from Task t where (t.status = :waiting or t.status = :running) and (t.runnerId in :runnerIds)", Task.class)
					.setParameter("waiting", Task.Status.WAITING)
					.setParameter("running", Task.Status.RUNNING)
					.setParameterList("runnerIds", runnerIds)
					.list();
				for (Task task : tasks) {
					task.setRunnerId(TaskManager.runnerSet.getNextRunnerId());
					task.setWaiting();
					session.saveOrUpdate(task);
				}
				session.getTransaction().commit();
				ClusterManager.requestTasksLoad();
			}
		}
		catch (HibernateException e) {
			logger.error("Database error while re-assigning tasks", e);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Sets the possible task runners (to be called from ClusterManager).
	 * @param members the list of cluster members.
	 */
	public static void setRunners(List<ClusterMember> members) {
		Integer maxPriority = null;
		for (ClusterMember member : members) {
			if (maxPriority == null || member.getRunnerPriority() > maxPriority) {
				maxPriority = member.getRunnerPriority();
			}
		}
		RunnerSet runnerSet = new RunnerSet();
		for (ClusterMember member : members) {
			if (member.getRunnerPriority() == maxPriority) {
				runnerSet.add(member.getRunnerWeight(), member.getInstanceId());
			}
		}
		synchronized (TaskManager.runnerSet) {
			TaskManager.runnerSet = runnerSet;
			TaskManager.reassignTasks();
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
		logger.debug("Cancelling task {}.", task);
		runnerScheduler.deleteJob(task.getIdentity());
		logger.trace("The task has been deleted from the scheduler.");
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			task.onCancel();
			task.setCancelled();
			task.warn(reason);
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
	 * Add the given task to the given scheduler.
	 * @param scheduler the scheduler
	 * @param task the task to schedule
	 * @param checkExistence checks that the task is not already in the scheduler
	 * @param forceNow force immediate execution or use task's execution time
	 * @throws SchedulerException
	 */
	static private void addTaskToScheduler(Scheduler scheduler, Task task, boolean checkExistence, boolean forceNow) throws SchedulerException {
		if (checkExistence) {
			if (scheduler.checkExists(task.getIdentity())) {
				logger.debug("Task already in the scheduler");
				return;
			}
		}
		JobDetail job = JobBuilder
			.newJob(TaskJob.class)
			.withIdentity(task.getIdentity())
			.build();
		job.getJobDataMap().put(TaskJob.NETSHOT_TASK, task.getId());
		Trigger trigger;
		Date when = task.getNextExecutionDate();
		if (when == null || forceNow) {
			trigger = TriggerBuilder.newTrigger().startNow().build();
		}
		else {
			trigger = TriggerBuilder.newTrigger().startAt(when).build();
		}
		scheduler.scheduleJob(job, trigger);
		logger.trace("Task successfully added to the scheduler.");
	}

	/**
	 * Adds a task to the scheduler.
	 *
	 * @param task the task
	 * @throws SchedulerException the scheduler exception
	 * @throws HibernateException the Hibernate exception
	 */
	static public void addTask(Task task) throws SchedulerException, HibernateException {
		logger.debug("Adding a task to the scheduler.");

		switch (TaskManager.mode) {
			case SINGLE:
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
				addTaskToScheduler(runnerScheduler, task, false, false);
				break;
			case CLUSTER_MASTER:
				break;
			default:
		}
	}

	/**
	 * Repeat task.
	 *
	 * @param task the task
	 * @throws SchedulerException the scheduler exception
	 * @throws HibernateException the hibernate exception
	 */
	static public void repeatTask(Task task) throws SchedulerException, HibernateException {
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
	 * Retrieve the tasks assigned to the local instance and add them to the scheduler.
	 */
	static public void scheduleLocalTasks() {
		logger.debug("Will retrieve the waiting tasks assigned to the local cluster member.");
		Session session = Database.getSession();
		try {
			List<Task> tasks = session.createQuery(
				"select t from Task t where t.status = :waiting and t.runnerId = :runnerId", Task.class)
				.setParameter("waiting", Task.Status.WAITING)
				.setParameter("runnerId", ClusterManager.getLocalInstanceId())
				.list();
			for (Task task : tasks) {
				addTaskToScheduler(runnerScheduler, task, true, true);
			}
		}
		catch (HibernateException e) {
			logger.error("Unable to retrieve the waiting tasks from the database", e);
		}
		catch (SchedulerException e) {
			logger.error("Unable to schedule the task", e);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Reschedule all tasks.
	 */
	static public void rescheduleAll() {
		logger.debug("Will schedule the tasks that can be found in the database.");

		Session session = Database.getSession();
		List<Task> tasks;
		try {
			tasks = session.createQuery(
					"select t from Task t where t.status = :status1 or t.status = :status2", Task.class)
				.setParameter("status1", Task.Status.SCHEDULED)
				.setParameter("status2", Task.Status.RUNNING)
				.list();
		}
		catch (HibernateException e) {
			logger.error("Unable to retrieve the tasks from the database.", e);
			throw e;
		}
		finally {
			session.close();
		}

		logger.trace("Found {} task(s) to reschedule.", tasks.size());
		Calendar inThirtySeconds = Calendar.getInstance();
		inThirtySeconds.add(Calendar.SECOND, 30);
		for (Task task : tasks) {
			try {
				Date when = task.getNextExecutionDate();
				if (when != null && when.after(inThirtySeconds.getTime())) {
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
