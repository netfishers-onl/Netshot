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
package net.netshot.netshot;

import net.netshot.netshot.work.TaskLogger;

public class FakeTaskLogger implements TaskLogger {
	private final StringBuffer buffer = new StringBuffer();

	public void trace(String message) {
		buffer.append("TRACE - ");
		buffer.append(message);
		buffer.append("\n");
	}

	public void debug(String message) {
		buffer.append("DEBUG - ");
		buffer.append(message);
		buffer.append("\n");
	}

	public void info(String message) {
		buffer.append("INFO - ");
		buffer.append(message);
		buffer.append("\n");
	}

	public void warn(String message) {
		buffer.append("WARN - ");
		buffer.append(message);
		buffer.append("\n");
	}

	public void error(String message) {
		buffer.append("ERROR - ");
		buffer.append(message);
		buffer.append("\n");
	}

	public String getLog() {
		return buffer.toString();
	}
}
