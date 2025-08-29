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
package net.netshot.netshot.work.logger;

import org.graalvm.polyglot.HostAccess.Export;

import net.netshot.netshot.work.Task;
import net.netshot.netshot.work.TaskLogger;

/**
 * Task Logger which sends logs... to the task logs.
 */
public class TaskLogTaskLogger implements TaskLogger {

	private final Task task;

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
