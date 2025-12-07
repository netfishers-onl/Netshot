/**
 * Copyright 2013-2025 Netshot
 * 
 * This file is part of Netshot project.
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
package net.netshot.netshot.device.access;

import java.io.IOException;
import java.io.PrintStream;

import org.apache.commons.net.telnet.TelnetClient;

import com.fasterxml.jackson.annotation.JsonView;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.Netshot;
import net.netshot.netshot.device.NetworkAddress;
import net.netshot.netshot.rest.RestViews.DefaultView;
import net.netshot.netshot.work.TaskContext;

/**
 * A Telnet CLI access.
 */
@Slf4j
public class Telnet extends Cli {

	/** Default Telnet TCP port. */
	public static final int DEFAULT_PORT = 23;

	/**
	 * Settings/config for the current class.
	 */
	public static final class Settings {

		/** Telnet connection timeout. */
		@Getter
		private int connectionTimeout;

		/** Telnet receive timeout. */
		@Getter
		private int receiveTimeout;

		/** Telnet command timeout. */
		@Getter
		private int commandTimeout;

		/**
		 * Load settings from config.
		 */
		private void load() {
			this.connectionTimeout = Netshot.getConfig("netshot.cli.telnet.connectiontimeout", 5000, 1, Integer.MAX_VALUE);
			log.debug("The default connection timeout value for Telnet sessions is {}s", this.connectionTimeout);

			this.receiveTimeout = Netshot.getConfig("netshot.cli.telnet.receivetimeout", 60000, 1, Integer.MAX_VALUE);
			log.debug("The default receive timeout value for Telnet sessions is {}s", this.receiveTimeout);

			this.commandTimeout = Netshot.getConfig("netshot.cli.telnet.commandtimeout", 120000, 1, Integer.MAX_VALUE);
			log.debug("The default command timeout value for Telnet sessions is {}s", this.commandTimeout);
		}
	}

	/** Settings for this class. */
	public static final Settings SETTINGS = new Settings();

	/**
	 * Initialize some additional static variables from global configuration.
	 */
	public static void loadConfig() {
		Telnet.SETTINGS.load();
	}

	/**
	 * Embedded class to represent Telnet-specific configuration.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class TelnetConfig {

		/** Type of terminal. */
		@Getter(onMethod = @__({
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

	/** The port. */
	private int port = DEFAULT_PORT;

	/** The telnet. */
	private TelnetClient telnet;

	/** The Telnet connection config. */
	private TelnetConfig telnetConfig = new TelnetConfig();

	/**
	 * Instantiates a new telnet.
	 *
	 * @param host the host
	 * @param taskContext the current task context
	 */
	public Telnet(NetworkAddress host, TaskContext taskContext) {
		super(host, taskContext);
	}

	/**
	 * Instantiates a new telnet.
	 *
	 * @param host the host
	 * @param port the port
	 * @param taskContext the current task context
	 */
	public Telnet(NetworkAddress host, int port, TaskContext taskContext) {
		this(host, taskContext);
		this.port = port;
		this.connectionTimeout = Telnet.SETTINGS.getConnectionTimeout();
		this.commandTimeout = Telnet.SETTINGS.getCommandTimeout();
		this.receiveTimeout = Telnet.SETTINGS.getReceiveTimeout();
	}

	/*(non-Javadoc)
	 * @see net.netshot.netshot.device.access.Cli#connect()
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

	/*(non-Javadoc)
	 * @see net.netshot.netshot.device.access.Cli#disconnect()
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
