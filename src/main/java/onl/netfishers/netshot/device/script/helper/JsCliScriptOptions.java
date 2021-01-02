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
package onl.netfishers.netshot.device.script.helper;

import org.graalvm.polyglot.HostAccess.Export;

/**
 * The options object to pass data to JavaScript entry function in a generic way.
 * @author sylvain.cadilhac
 *
 */
public class JsCliScriptOptions {
	private JsCliHelper cliHelper;
	private JsSnmpHelper snmpHelper;
	private JsConfigHelper configHelper;
	private JsDeviceHelper deviceHelper;
	private JsDiagnosticHelper diagnosticHelper;

	public JsCliScriptOptions(JsCliHelper cliHelper, JsSnmpHelper snmpHelper) {
		this.cliHelper = cliHelper;
		this.snmpHelper = snmpHelper;
	}

	@Export
	public JsDiagnosticHelper getDiagnosticHelper() {
		return diagnosticHelper;
	}

	@Export
	public JsDeviceHelper getDeviceHelper() {
		return deviceHelper;
	}

	public void setDevice(JsDeviceHelper deviceHelper) {
		this.deviceHelper = deviceHelper;
	}

	public void setDiagnosticHelper(JsDiagnosticHelper diagnosticHelper) {
		this.diagnosticHelper = diagnosticHelper;
	}

	@Export
	public JsCliHelper getCliHelper() {
		return cliHelper;
	}

	public void setCliHelper(JsCliHelper cliHelper) {
		this.cliHelper = cliHelper;
	}

	@Export
	public JsSnmpHelper getSnmpHelper() {
		return snmpHelper;
	}

	public void setSnmpHelper(JsSnmpHelper snmpHelper) {
		this.snmpHelper = snmpHelper;
	}

	@Export
	public JsConfigHelper getConfigHelper() {
		return configHelper;
	}

	public void setConfigHelper(JsConfigHelper configHelper) {
		this.configHelper = configHelper;
	}

}
