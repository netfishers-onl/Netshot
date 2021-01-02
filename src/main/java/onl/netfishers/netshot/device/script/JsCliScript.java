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
package onl.netfishers.netshot.device.script;

import java.io.IOException;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.PolyglotException;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.Device.InvalidCredentialsException;
import onl.netfishers.netshot.device.Device.MissingDeviceDriverException;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.DeviceDriver.DriverProtocol;
import onl.netfishers.netshot.device.access.Cli;
import onl.netfishers.netshot.device.access.Snmp;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
import onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity;
import onl.netfishers.netshot.device.script.helper.JsCliHelper;
import onl.netfishers.netshot.device.script.helper.JsCliScriptOptions;
import onl.netfishers.netshot.device.script.helper.JsDeviceHelper;
import onl.netfishers.netshot.device.script.helper.JsSnmpHelper;
import onl.netfishers.netshot.work.TaskLogger;

/**
 * A JavaScript-based script to execute on a device.
 * @author sylvain.cadilhac
 *
 */
public class JsCliScript extends CliScript {
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(JsCliScript.class);

	// The JavaScript code to execute
	private String code;
	
	/**
	 * Instantiates a JS-based script.
	 * @param code The JS code
	 */
	public JsCliScript(String code, boolean cliLogging) {
		super(cliLogging);
		this.code = code;
	}
	
	/**
	 * Gets the JS code.
	 * @return the JS code
	 */
	public String getCode() {
		return code;
	}

	@Override
	protected void run(Session session, Device device, Cli cli, Snmp snmp, DriverProtocol protocol, DeviceCredentialSet account)
			throws InvalidCredentialsException, IOException, UnsupportedOperationException, MissingDeviceDriverException {
		JsCliHelper jsCliHelper = null;
		JsSnmpHelper jsSnmpHelper = null;
		switch (protocol) {
		case SNMP:
			jsSnmpHelper = new JsSnmpHelper(snmp, (DeviceSnmpCommunity)account, this.getJsLogger());
			break;
		case TELNET:
		case SSH:
			jsCliHelper = new JsCliHelper(cli, (DeviceCliAccount)account, this.getJsLogger(), this.getCliLogger());
			break;
		}
		TaskLogger taskLogger = this.getJsLogger();
		DeviceDriver driver = device.getDeviceDriver();
		try {
			Context context = driver.getContext();
			context.eval("js", code);
			JsCliScriptOptions options = new JsCliScriptOptions(jsCliHelper, jsSnmpHelper);
			options.setDevice(new JsDeviceHelper(device, null, taskLogger, false));
			context.getBindings("js").getMember("_connect").execute("run", protocol.value(), options, taskLogger);
		}
		catch (PolyglotException e) {
			logger.error("Error while running script using driver {}.", driver.getName(), e);
			taskLogger.error(String.format("Error while running script  using driver %s: '%s'.",
					driver.getName(), e.getMessage()));
			if (e.getMessage().contains("Authentication failed")) {
				throw new InvalidCredentialsException("Authentication failed");
			}
			else {
				throw e;
			}
		}
		catch (UnsupportedOperationException e) {
			logger.error("No such method while using driver {}.", driver.getName(), e);
			taskLogger.error(String.format("No such method while using driver %s to execute script: '%s'.",
					driver.getName(), e.getMessage()));
			throw new UnsupportedOperationException(e);
		}
	}
}
