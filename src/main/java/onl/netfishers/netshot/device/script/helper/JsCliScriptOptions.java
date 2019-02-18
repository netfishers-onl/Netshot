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

/**
 * The options object to pass data to JavaScript entry function in a generic way.
 * @author sylvain.cadilhac
 *
 */
public class JsCliScriptOptions {
	private JsCliHelper cliHelper;
	private JsConfigHelper configHelper;
	private JsDeviceHelper deviceHelper;
	private JsDiagnosticHelper diagnosticHelper;

	public JsCliScriptOptions(JsCliHelper cliHelper) {
		this.cliHelper = cliHelper;
	}

	public JsDiagnosticHelper getDiagnosticHelper() {
		return diagnosticHelper;
	}

	public JsDeviceHelper getDeviceHelper() {
		return deviceHelper;
	}

	public void setDevice(JsDeviceHelper deviceHelper) {
		this.deviceHelper = deviceHelper;
	}

	public void setDiagnosticHelper(JsDiagnosticHelper diagnosticHelper) {
		this.diagnosticHelper = diagnosticHelper;
	}

	public JsCliHelper getCliHelper() {
		return cliHelper;
	}

	public void setCli(JsCliHelper cliHelper) {
		this.cliHelper = cliHelper;
	}

	public JsConfigHelper getConfigHelper() {
		return configHelper;
	}

	public void setConfigHelper(JsConfigHelper configHelper) {
		this.configHelper = configHelper;
	}

}
