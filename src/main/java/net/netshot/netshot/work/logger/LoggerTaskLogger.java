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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import net.netshot.netshot.work.TaskLogger;

/**
 * Slf4j logger-based Task Logger
 */
public class LoggerTaskLogger implements TaskLogger {
	private Logger logger;

	public LoggerTaskLogger(Class<?> clazz) {
		this.logger = LoggerFactory.getLogger(clazz);
	}

	@Override
	public void warn(String message) {
		this.logger.warn("[WARN] {}", message);
	}

	@Override
	public void trace(String message) {
		this.logger.warn("[TRACE] {}", message);
	}

	@Override
	public void info(String message) {
		this.logger.warn("[INFO] {}", message);
	}

	@Override
	public void error(String message) {
		this.logger.warn("[ERROR] {}", message);
	}

	@Override
	public void debug(String message) {
		this.logger.warn("[DEBUG] {}", message);
	}
}
