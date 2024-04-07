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
package onl.netfishers.netshot.device.access;

import java.io.IOException;
import java.io.PrintStream;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.device.NetworkAddress;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.TaskLogger;

import org.apache.commons.net.telnet.TelnetClient;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

/**
 * A Telnet CLI access.
 */
@Slf4j
public class Telnet extends Cli {

	/** Default value for the Telnet connection timeout */
	static private int DEFAULT_CONNECTION_TIMEOUT = 5000;

	/** Default value for the Telnet receive timeout */
	static private int DEFAULT_RECEIVE_TIMEOUT = 60000;

	/** Default value for the Telnet command timeout */
	static private int DEFAULT_COMMAND_TIMEOUT = 120000;

	/**
	 * Embedded class to represent Telnet-specific configuration.
	 */
	@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
	public static class TelnetConfig {

		/** Type of terminal */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String terminalType = "vt100";

		/*
		 * Default constructor.
		 */
		public TelnetConfig() {
			
		}
	}

	static {
		int configuredConnectionTimeout = Netshot.getConfig("netshot.cli.telnet.connectiontimeout", DEFAULT_CONNECTION_TIMEOUT);
		if (configuredConnectionTimeout < 1) {
			log.error("Invalid value {} for {}", configuredConnectionTimeout, "netshot.cli.telnet.connectiontimeout");
		}
		else {
			DEFAULT_CONNECTION_TIMEOUT = configuredConnectionTimeout;
		}
		log.info("The default connection timeout value for Telnet sessions is {}s", DEFAULT_CONNECTION_TIMEOUT);

		int configuredReceiveTimeout = Netshot.getConfig("netshot.cli.telnet.receivetimeout", DEFAULT_RECEIVE_TIMEOUT);
		if (configuredReceiveTimeout < 1) {
			log.error("Invalid value {} for {}", configuredReceiveTimeout, "netshot.cli.telnet.receivetimeout");
		}
		else {
			DEFAULT_RECEIVE_TIMEOUT = configuredReceiveTimeout;
		}
		log.info("The default receive timeout value for Telnet sessions is {}s", DEFAULT_RECEIVE_TIMEOUT);

		int configuredCommandTimeout = Netshot.getConfig("netshot.cli.telnet.commandtimeout", DEFAULT_COMMAND_TIMEOUT);
		if (configuredCommandTimeout < 1) {
			log.error("Invalid value {} for {}", configuredCommandTimeout, "netshot.cli.telnet.commandtimeout");
		}
		else {
			DEFAULT_COMMAND_TIMEOUT = configuredCommandTimeout;
		}
		log.info("The default command timeout value for Telnet sessions is {}s", DEFAULT_COMMAND_TIMEOUT);
	}

	/** The port. */
	private int port = 23;

	/** The telnet. */
	private TelnetClient telnet = null;

	/** The Telnet connection config */
	private TelnetConfig telnetConfig = new TelnetConfig();

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
		this.commandTimeout = DEFAULT_COMMAND_TIMEOUT;
		this.receiveTimeout = DEFAULT_RECEIVE_TIMEOUT;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.access.Cli#connect()
	 */
	@Override
	public void connect() throws IOException {
		this.telnet = new TelnetClient(this.telnetConfig.terminalType.toUpperCase());
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
		}
		catch (Exception e) {
			//
		}
	}

	public TelnetConfig getTelnetConfig() {
		return telnetConfig;
	}

	public void setTelnetConfig(TelnetConfig telnetConfig) {
		this.telnetConfig = telnetConfig;
	}

}
