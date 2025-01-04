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

import net.netshot.netshot.database.Database;
import net.netshot.netshot.TaskManager;
import net.netshot.netshot.hooks.Hook;
import net.netshot.netshot.hooks.HookTrigger;
import net.netshot.netshot.work.Task.Status;

import java.util.List;

import org.hibernate.Session;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

import lombok.extern.slf4j.Slf4j;

/**
 * A Quartz job which runs a Netshot task.
 */
@DisallowConcurrentExecution
@Slf4j
public class TaskJob implements Job {

	/** The Constant NETSHOT_TASK. */
	public static final String NETSHOT_TASK = "Netshot Task";

	/**
	 * Instantiates a new task job.
	 */
	public TaskJob() {
	}

	/* (non-Javadoc)
	 * @see org.quartz.Job#execute(org.quartz.JobExecutionContext)
	 */
	public void execute(JobExecutionContext context) throws JobExecutionException {
		log.debug("Starting job.");
		Long id = (Long) context.getJobDetail().getJobDataMap()
				.get(NETSHOT_TASK);
		if (id == 0) {
			log.error("Invalid task, id is 0");
			return;
		}
		log.trace("The task id is {}.", id);
		Task task = null;
		Session session = Database.getSession();
		try {
			Thread.sleep(1000);
			session.beginTransaction();
			task = session.get(Task.class, id);
			if (task == null) {
				log.error("The retrieved task {} is null.", id);
			}
			task.setRunning();
			log.trace("The task runner ID for {} is {}", task.getId(), task.getRunnerId());
			session.merge(task);
			log.trace("Got the task.");
			task.prepare(session);
			log.trace("The task has prepared its fields.");
			session.getTransaction().commit();
		}
		catch (Exception e) {
			log.error("Error while retrieving, updating or preparing the task.", e);
			try {
				session.getTransaction().rollback();
				session.beginTransaction();
				Task eTask = (Task) session.get(Task.class, id);
				eTask.setRunning();
				eTask.setFailed();
				eTask.setLog(e.getMessage());
				session.merge(eTask);
				session.getTransaction().commit();
			}
			catch (Exception e1) {

			}
			throw new JobExecutionException("Unable to access or prepare the task.");
		}
		finally {
			session.close();
		}

		log.warn("Running the task {} of type {}", id, task.getClass().getSimpleName());
		try {
			task.run();
		}
		catch (Error e) {
			log.error("Error while running the task {}.", id, e);
		}

		if (task.getStatus() == Status.RUNNING) {
			log.error("The task {} exited with a status of RUNNING.", id);
			task.setFailed();
		}

		log.trace("Updating the task with the result.");
		session = Database.getSession();
		try {
			session.beginTransaction();
			session.merge(task);
			session.getTransaction().commit();
		}
		catch (Exception e) {
			log.error("Error while updating the task {} after execution.", id, e);
			try {
				session.getTransaction().rollback();
			}
			catch (Exception e1) {
				log.error("Error during the rollback.", e1);
			}
			try {
				session.clear();
				session.beginTransaction();
				Task eTask = (Task) session.get(Task.class, id);
				eTask.setFailed();
				session.merge(eTask);
				session.getTransaction().commit();
			}
			catch (Exception e1) {
				log.error("Error while setting the task {} to FAILED.", id, e1);
			}
			throw new JobExecutionException("Unable to save the task.");
		}
		finally  {
			session.close();
		}


		log.trace("Looking for post-task hooks.");
		session = Database.getSession();
		try {
			task = (Task) session.get(Task.class, id);
			List<Hook> hooks = session
				.createQuery("select h from Hook h join h.triggers t where t.type = :postTask and t.item = :taskName and h.enabled", Hook.class)
				.setParameter("postTask", HookTrigger.TriggerType.POST_TASK)
				.setParameter("taskName", task.getClass().getSimpleName())
				.list();

			for (Hook hook : hooks) {
				log.trace("Executing post-task hook {}", hook.getName());
				try {
					String result = hook.execute(task);
					log.info("Result of post-task hook '{}' after task {} is: {}", hook.getName(), task.getId(), result);
				}
				catch (Exception e) {
					log.warn("Error while executing hook {} after task {}", hook.getName(), task.getId(), e);
				}
			}
		}
		catch (Exception e) {
			log.error("Error while processing hooks after task {}.", id, e);
			try {
				session.getTransaction().rollback();
			}
			catch (Exception e1) {
				log.error("Error during the rollback.", e1);
			}
		}
		finally  {
			session.close();
		}

		try {
			TaskManager.repeatTask(task);
		}
		catch (Exception e) {
			log.error("Unable to repeat the task {} again.", id);
		}

		log.warn("End of task {}.", id);

	}

}