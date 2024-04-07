/**
 * Copyright 2013-2024 Netshot
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

import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.HostAccess.Export;
import org.graalvm.polyglot.proxy.ProxyObject;

import lombok.extern.slf4j.Slf4j;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.diagnostic.Diagnostic;
import onl.netfishers.netshot.diagnostic.DiagnosticResult;
import onl.netfishers.netshot.work.TaskLogger;

/**
 * This class is used to control the diagnostic results from JavaScript.
 * @author sylvain.cadilhac
 *
 */
@Slf4j
public class JsDiagnosticHelper {
	
	/** The device the diagnostic is running on. */
	public final Device device;
	/** The list of diagnostics. */
	public List<Diagnostic> diagnostics;
	/** The list of JS diagnostics. */
	public Map<String, Object> jsDiagnostics;
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
	@Export
	public void set(String key, Value value) {
		if (value == null) {
			taskLogger.warn(String.format("Value for diagnostic key '%s' is null", key));
			return;
		}
		try {
			for (Diagnostic diagnostic : diagnostics) {
				if (diagnostic.getName().equals(key)) {
					taskLogger.warn(String.format("Setting value for diagnostic key '%s'", key));
					DiagnosticResult result = diagnostic.makeResult(device, value);
					if (result != null) {
						device.addDiagnosticResult(result);
					}
				}
			}
		}
		catch (Exception e) {
			log.warn("Error while setting the diagnostic result '{}'.", key, e);
			taskLogger.error(String.format("Can't set diagnostic result %s: %s", key,  e.toString()));
		}
	}
	
	/**
	 * Get the diagnostics.
	 * @return the diagnostics
	 */
	@Export
	public ProxyObject getDiagnostics() {
		return ProxyObject.fromMap(jsDiagnostics);
	}

}
