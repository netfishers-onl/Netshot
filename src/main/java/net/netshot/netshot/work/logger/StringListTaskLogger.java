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

import java.util.List;

import org.graalvm.polyglot.HostAccess.Export;

import net.netshot.netshot.work.TaskLogger;

/**
 * Simple List-based task logger implementation.
 */
public class StringListTaskLogger implements TaskLogger {

	private List<String> logs;

	public StringListTaskLogger(List<String> logs) {
		this.logs = logs;
	}

	@Export
	@Override
	public void warn(String message) {
		this.logs.add(String.format("[WARN] %s", message));
	}
	
	@Export
	@Override
	public void trace(String message) {
		this.logs.add(String.format("[TRACE] %s", message));
	}
	
	@Export
	@Override
	public void info(String message) {
		this.logs.add(String.format("[INFO] %s", message));
	}
	
	@Export
	@Override
	public void error(String message) {
		this.logs.add(String.format("[ERROR] %s", message));
	}
	
	@Export
	@Override
	public void debug(String message) {
		this.logs.add(String.format("[DEBUG] %s", message));
	}
	
}
