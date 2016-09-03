/**
 * Copyright 2013-2016 Sylvain Cadilhac (NetFishers)
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

import onl.netfishers.netshot.device.NetworkAddress;

import org.apache.commons.net.telnet.TelnetClient;

/**
 * A Telnet CLI access.
 */
public class Telnet extends Cli {

	/** The port. */
	private int port = 23;
	
	/** The telnet. */
	private TelnetClient telnet = null;
	
	/**
	 * Instantiates a new telnet.
	 *
	 * @param host the host
	 */
	public Telnet(NetworkAddress host) {
		super(host);
	}
	
	/**
	 * Instantiates a new telnet.
	 *
	 * @param host the host
	 * @param port the port
	 */
	public Telnet(NetworkAddress host, int port) {
		this(host);
		this.port = port;
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
