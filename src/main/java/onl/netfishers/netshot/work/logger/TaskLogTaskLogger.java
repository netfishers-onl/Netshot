package onl.netfishers.netshot.work.logger;

import org.graalvm.polyglot.HostAccess.Export;

import onl.netfishers.netshot.work.Task;
import onl.netfishers.netshot.work.TaskLogger;

/**
 * Task Logger which sends logs... to the task logs.
 */
public class TaskLogTaskLogger implements TaskLogger {

	private Task task;

	public TaskLogTaskLogger(Task task) {
		this.task = task;
	}

	@Override
	@Export
	public void warn(String message) {
		this.task.warn(message);
	}
	
	@Override
	@Export
	public void trace(String message) {
		this.task.trace(message);
	}
	
	@Override
	@Export
	public void info(String message) {
		this.task.info(message);
	}
	
	@Override
	@Export
	public void error(String message) {
		this.task.error(message);
	}
	
	@Override
	@Export
	public void debug(String message) {
		this.task.debug(message);
	}
}
