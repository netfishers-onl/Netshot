/**
 * Copyright 2013-2019 Sylvain Cadilhac (NetFishers)
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
package onl.netfishers.netshot.device.script.helper;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.diagnostic.Diagnostic;
import onl.netfishers.netshot.diagnostic.DiagnosticBinaryResult;
import onl.netfishers.netshot.diagnostic.DiagnosticNumericResult;
import onl.netfishers.netshot.work.TaskLogger;

/**
 * This class is used to control the diagnostic results from JavaScript.
 * @author sylvain.cadilhac
 *
 */
public class JsDiagnosticHelper {
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(JsDiagnosticHelper.class);
	
	/** The device the diagnostic is running on. */
	private final Device device;
	/** The list of diagnostics. */
	private List<Diagnostic> diagnostics;
	/** The list of JS diagnostics. */
	private Map<String, Object> jsDiagnostics;
	/** The JS Logger. */
	private TaskLogger taskLogger;
	
	/**
	 * Instantiate a new JS diagnostic helper.
	 * @param device The device to run the diagnostics on
	 * @param diagnostics The list of diagnostics
	 * @param jsDiagnostics The set of JS diagnostics to run
	 * @param taskLogger the JS logger
	 */
	public JsDiagnosticHelper(Device device, List<Diagnostic> diagnostics, Map<String, Object> jsDiagnostics, TaskLogger taskLogger) {
		this.device = device;
		this.diagnostics = diagnostics;
		this.jsDiagnostics = jsDiagnostics;
		this.taskLogger = taskLogger;
	}
	
	/**
	 * Set a diagnostic result.
	 * @param key The key
	 * @param value The value
	 */
	public void set(String key, Double value) {
		if (value == null) {
			return;
		}
		try {
			for (Diagnostic diagnostic : diagnostics) {
				if (diagnostic.getName().equals(key)) {
					switch (diagnostic.getResultType()) {
					case NUMERIC:
						device.addDiagnosticResult(new DiagnosticNumericResult(device, diagnostic, value));
						break;
					default:
					}
					break;
				}
			}
		}
		catch (Exception e) {
			logger.warn("Error while setting the numeric diagnostic result '{}'.", key);
			taskLogger.error(String.format("Can't set numeric diagnostic result %s: %s", key,  e.getMessage()));
		}
	}

	/**
	 * Set a diagnostic result.
	 * @param key The key
	 * @param value The value
	 */
	public void set(String key, Boolean value) {
		if (value == null) {
			return;
		}
		try {
			for (Diagnostic diagnostic : diagnostics) {
				if (diagnostic.getName().equals(key)) {
					switch (diagnostic.getResultType()) {
					case BINARY:
						device.addDiagnosticResult(new DiagnosticBinaryResult(device, diagnostic, value));
						break;
					default:
					}
					break;
				}
			}
		}
		catch (Exception e) {
			logger.warn("Error while setting the boolean diagnostic result '{}'.", key);
			taskLogger.error(String.format("Can't set boolean diagnostic result %s: %s", key,  e.getMessage()));
		}
	}
	
	/**
	 * Set a diagnostic result.
	 * @param key The key
	 * @param value The value
	 */
	public void set(String key, Object value) {
		if (value == null) {
			return;
		}
		try {
			for (Diagnostic diagnostic : diagnostics) {
				if (diagnostic.getName().equals(key)) {
					diagnostic.addResultToDevice(device, (String)value);
					break;
				}
			}
		}
		catch (Exception e) {
			logger.warn("Error while setting the diagnostic result '{}'.", key);
			taskLogger.error(String.format("Can't set diagnostic result %s: %s", key,  e.toString()));
		}
	}
	
	/**
	 * Get the diagnostics.
	 * @return the diagnostics
	 */
	public Map<String, Object> getJsDiagnostics() {
		return jsDiagnostics;
	}

}
