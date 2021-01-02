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

import java.io.IOException;
import java.util.Map;

import org.graalvm.polyglot.HostAccess.Export;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.device.access.Snmp;
import onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity;
import onl.netfishers.netshot.work.TaskLogger;

/**
 * This class is used to pass SNMP control to JavaScript.
 * @author sylvain.cadilhac
 *
 */
public class JsSnmpHelper {
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(JsSnmpHelper.class);

	/** The poller */
	private Snmp poller;
	/** The community (SNMP credentials rather) */
	protected DeviceSnmpCommunity community;
	/** The JS logger */
	private TaskLogger taskLogger;

	/** An error was raised */
	private boolean errored = false;
	/**
	 * Instantiate a new JsCliHelper JsSnmpHelper.
	 * @param cli The device CLI
	 * @param account The account to connect to the device
	 * @param taskLogger The task logger
	 */
	public JsSnmpHelper(Snmp poller, DeviceSnmpCommunity community, TaskLogger taskLogger) {
		this.poller = poller;
		this.community = community;
		this.taskLogger = taskLogger;
	}

	/**
	 * Check whether there was an error after the last command.
	 * @return true if there was an error
	 */
	@Export
	public boolean isErrored() {
		return errored;
	}

	/**
	 * SNMP get.
	 * @param oid The OID to look for
	 * @return SNMP result
	 * @throws IOException It can happen
	 */
	@Export
	public String getAsString(String oid) throws IOException {
		try {
			return this.poller.getAsString(oid);
		}
		catch (IOException e) {
			logger.error("SNMP I/O error.", e);
			this.taskLogger.error("I/O error: " + e.getMessage());
			throw e;
		}
	}

	/**
	 * SNMP walk.
	 * @param oid The base OID to explore.
	 * @return a map (OID => value) of results
	 * @throws IOException It can happen
	 */
	@Export
	public Map<String, String> walkAsString(String oid) throws IOException {
		try {
			return this.poller.walkAsString(oid);
		}
		catch (IOException e) {
			logger.error("SNMP I/O error.", e);
			this.taskLogger.error("I/O error: " + e.getMessage());
			throw e;
		}
	}
	
	/**
	 * Pause the thread for the given number of milliseconds.
	 * @param millis The number of milliseconds to wait for
	 */
	@Export
	public void sleep(long millis) {
		try {
			Thread.sleep(millis);
		}
		catch (InterruptedException e) {
		}
	}

}