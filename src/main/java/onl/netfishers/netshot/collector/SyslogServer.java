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
package onl.netfishers.netshot.collector;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.SocketException;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.Network4Address;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A Syslog server receives the syslog messages from devices and triggers
 * snapshots if needed.
 */
public class SyslogServer extends Collector {

	/** The socket. */
	private DatagramSocket socket;

	/** The UDP port to listen Syslog messages on. */
	private int udpPort = 514;

	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(SyslogServer.class);

	/** The static Syslog server. */
	private static SyslogServer nsSyslogServer;

	private static boolean running = false;

	public static boolean isRunning() {
		return running;
	}

	/**
	 * Initializes the Syslog server.
	 */
	public static void init() {
		if (Netshot.getConfig("netshot.syslog.disabled", "false")
				.equals("true")) {
			logger.warn("The Syslog server is disabled by configuration.");
			return;
		}
		nsSyslogServer = new SyslogServer();
		nsSyslogServer.start();
	}

	/**
	 * Instantiates a new syslog server.
	 */
	public SyslogServer() {
		this.setName("Syslog Receiver");
		this.setDaemon(true);
		String port = Netshot.getConfig("netshot.syslog.port");
		if (port != null) {
			udpPort = Integer.parseInt(port);
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Thread#run()
	 */
	@Override
	public void run() {

		try {
			socket = new DatagramSocket(udpPort);
			logger.debug("Now listening for Syslog messages on UDP port {}.",
					udpPort);
			running = true;
			while (true) {
				DatagramPacket dato = new DatagramPacket(new byte[4096], 4096);
				socket.receive(dato);
				InetAddress address = dato.getAddress();
				if (address instanceof Inet4Address) {
					Network4Address source = new Network4Address(
							(Inet4Address) address, 32);
					String message = new String(dato.getData(), 0,
							dato.getLength());
					logger.trace("Received Syslog message: '{}'.", message);
					
					for (DeviceDriver driver : DeviceDriver.getAllDrivers()) {
						if (driver.analyzeSyslog(message, source)) {
							break;
						}
					}
				}

			}
		}
		catch (SocketException e) {
			logger.error("Error while starting the Syslog server.", e);
		}
		catch (IOException e) {
			logger.error("Error while receivng Syslog server datagram.", e);
		}
		catch (Exception e) {
			logger.error("Error with the Syslog server", e);
		}
		finally {
			running = false;
			socket.close();
		}
		logger.error("The Syslog server is stopping due to an error.");
	}

}
