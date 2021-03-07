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
package onl.netfishers.netshot.device.access;

import java.io.IOException;
import java.io.PrintStream;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.device.NetworkAddress;
import onl.netfishers.netshot.work.TaskLogger;

import org.apache.commons.net.telnet.TelnetClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A Telnet CLI access.
 */
public class Telnet extends Cli {
	
	final private static Logger logger = LoggerFactory.getLogger(Ssh.class);

	/** Default value for the SSH connection timeout */
	static private int DEFAULT_CONNECTION_TIMEOUT = 5000;

	static {
		int configuredConnectionTimeout = Netshot.getConfig("netshot.cli.telnet.connectiontimeout", DEFAULT_CONNECTION_TIMEOUT);
		if (configuredConnectionTimeout < 1) {
			logger.error("Invalid value {} for {}", configuredConnectionTimeout, "netshot.cli.telnet.connectiontimeout");			
		}
		else {
			DEFAULT_CONNECTION_TIMEOUT = configuredConnectionTimeout;
		}
		logger.info("The default connection timeout value for Telnet sessions is {}s", DEFAULT_CONNECTION_TIMEOUT);
	}

	/** The port. */
	private int port = 23;
	
	/** The telnet. */
	private TelnetClient telnet = null;
	
	/**
	 * Instantiates a new telnet.
	 *
	 * @param host the host
	 * @param taskLogger the current task logger
	 */
	public Telnet(NetworkAddress host, TaskLogger taskLogger) {
		super(host, taskLogger);
	}
	
	/**
	 * Instantiates a new telnet.
	 *
	 * @param host the host
	 * @param port the port
	 * @param taskLogger the current task logger
	 */
	public Telnet(NetworkAddress host, int port, TaskLogger taskLogger) {
		this(host, taskLogger);
		if (port != 0) this.port = port;
		this.connectionTimeout = DEFAULT_CONNECTION_TIMEOUT;
	}
	
	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.access.Cli#connect()
	 */
	@Override
	public void connect() throws IOException {
		this.telnet = new TelnetClient("VT100");
		telnet.setConnectTimeout(this.connectionTimeout);
		telnet.connect(this.host.getInetAddress(), this.port);
		telnet.setSoTimeout(this.receiveTimeout);
		this.inStream = telnet.getInputStream();
		this.outStream = new PrintStream(telnet.getOutputStream());
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.access.Cli#disconnect()
	 */
	@Override
	public void disconnect() {
		try {
			this.telnet.disconnect();
		} catch (Exception e) {
		}
	}
	
	
}
