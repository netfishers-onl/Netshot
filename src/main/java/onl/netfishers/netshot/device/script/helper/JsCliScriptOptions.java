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

import lombok.Getter;
import lombok.Setter;

/**
 * The options object to pass data to JavaScript entry function in a generic way.
 * @author sylvain.cadilhac
 *
 */
public class JsCliScriptOptions {
	@Getter(onMethod=@__({
		@Export
	}))
	@Setter
	private JsCliHelper cliHelper;

	@Getter(onMethod=@__({
		@Export
	}))
	@Setter
	private JsSnmpHelper snmpHelper;

	@Getter(onMethod=@__({
		@Export
	}))
	@Setter
	private JsConfigHelper configHelper;

	@Getter(onMethod=@__({
		@Export
	}))
	@Setter
	private JsDeviceHelper deviceHelper;

	@Getter(onMethod=@__({
		@Export
	}))
	@Setter
	private JsDiagnosticHelper diagnosticHelper;

	public JsCliScriptOptions(JsCliHelper cliHelper, JsSnmpHelper snmpHelper) {
		this.cliHelper = cliHelper;
		this.snmpHelper = snmpHelper;
	}

}
