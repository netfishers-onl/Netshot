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
import java.time.Instant;
import java.util.regex.Matcher;

import org.graalvm.polyglot.HostAccess.Export;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.device.access.Cli;
import onl.netfishers.netshot.device.access.Cli.WithBufferIOException;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.work.TaskLogger;

/**
 * This class is used to pass CLI control to JavaScript.
 * @author sylvain.cadilhac
 *
 */
public class JsCliHelper {
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(JsCliHelper.class);
	
	/** The CLI object to interact with the device via command line */
	private Cli cli;
	/** The CLI account (SSH/Telnet) */
	private DeviceCliAccount account;
	/** The JS logger */
	private TaskLogger taskLogger;
	/** The session logger */
	private TaskLogger cliLogger;
	/** An error was raised */
	private boolean errored = false;
	
	/**
	 * Convert a string to an hexadecimal representation.
	 * @param text The original text
	 * @return the hexadecimal representation of the text
	 */
	private static String toHexAscii(String text) {
		StringBuffer hex = new StringBuffer();
		for (int i = 0; i < text.length(); i++) {
			if (i % 32 == 0 && i > 0) {
				hex.append("\n");
			}
			hex.append(" ").append(String.format("%02x", (int) text.charAt(i)));
		}
		return hex.toString();
	}
	
	/**
	 * Instantiate a new JsCliHelper object.
	 * @param cli The device CLI
	 * @param account The account to connect to the device
	 * @param taskLogger The task logger
	 * @param cliLogger The CLI logger (may be null; to log all exchanges)
	 */
	public JsCliHelper(Cli cli, DeviceCliAccount account, TaskLogger taskLogger, TaskLogger cliLogger) {
		this.cli = cli;
		this.account = account;
		this.taskLogger = taskLogger;
		this.cliLogger = cliLogger;
	}
	
	/**
	 * Remove the echoed command from a CLI output.
	 * @param text The output
	 * @param command The original command
	 * @return the text without echoed command
	 */
	@Export
	public String removeEcho(String text, String command) {
		String output = text;
		// Remove the echo of the command
		String headCommand = command;
		headCommand = headCommand.replaceFirst("[\\r\\n]+$", "");
		if (output.startsWith(headCommand)) {
			output = output.substring(headCommand.length());
			output = output.replaceFirst("^ *[\\r\\n]+", "");
			return output;
		}
		return output;
	}

	/**
	 * Send a command to the device and wait for a result.
	 * @param command The command to send
	 * @param expects The list of possible outputs to match
	 * @param timeout The maximum time to wait for the reply
	 * @return the output from the device, result of the passed command
	 */
	@Export
	public String send(String command, String[] expects, int timeout) {
		this.errored = false;
		if (command == null) {
			command = "";
		}
		if (this.cliLogger != null) {
			this.cliLogger.trace(Instant.now() + " About to send the following command:");
			this.cliLogger.trace(command);
			this.cliLogger.trace("Hexadecimal:");
			this.cliLogger.trace(toHexAscii(command));
		}
		command = command.replaceAll("\\$\\$NetshotUsername\\$\\$",
				Matcher.quoteReplacement(account.getUsername()));
		command = command.replaceAll("\\$\\$NetshotPassword\\$\\$",
				Matcher.quoteReplacement(account.getPassword()));
		command = command.replaceAll("\\$\\$NetshotSuperPassword\\$\\$",
				Matcher.quoteReplacement(account.getSuperPassword()));
		int oldTimeout = cli.getCommandTimeout();
		if (timeout > 0) {
			cli.setCommandTimeout(timeout);
		}
		try {
			logger.debug("Command to be sent: '{}'.", command);
			if (this.cliLogger != null) {
				this.cliLogger.trace("Expecting one of the following " + expects.length +
						" pattern(s) within " + (timeout > 0 ? timeout : oldTimeout) + "ms:");
				for (String expect : expects) {
					this.cliLogger.trace(expect);
				}
			}
			String result = cli.send(command, expects);
			if (this.cliLogger != null) {
				this.cliLogger.trace(Instant.now() + " Received the following output:");
				this.cliLogger.trace(cli.getLastFullOutput());
				this.cliLogger.trace("Hexadecimal:");
				this.cliLogger.trace(toHexAscii(cli.getLastFullOutput()));
				this.cliLogger.trace("The following pattern matched:");
				this.cliLogger.trace(this.getLastExpectMatchPattern());
			}
			return result;
		}
		catch (IOException e) {
			logger.error("CLI I/O error.", e);
			this.taskLogger.error("I/O error: " + e.getMessage());
			if (this.cliLogger != null) {
				this.cliLogger.trace(Instant.now() + " I/O exception: " + e.getMessage());
			}
			if (e instanceof WithBufferIOException) {
				String buffer = ((WithBufferIOException) e).getReceivedBuffer().toString();
				if (this.cliLogger != null) {
					this.cliLogger.trace(Instant.now() + " The receive buffer is:");
					this.cliLogger.trace(buffer);
					this.cliLogger.trace("Hexadecimal:");
					this.cliLogger.trace(toHexAscii(buffer));
				}
			}
			this.errored = true;
		}
		finally {
			cli.setCommandTimeout(oldTimeout);
		}
		return null;
	}
	
	/**
	 * Add a trace message to the debug log.
	 * @param message The message to add
	 */
	@Export
	public void trace(String message) {
		if (this.cliLogger != null) {
			this.cliLogger.trace(Instant.now() + " " + message);
		}
	}

	/**
	 * Send a command to the device and wait for a result, with default timeout value.
	 * @param command The command to send
	 * @param expects The list of possible outputs to match
	 * @return the output from the device, result of the passed command
	 */
	@Export
	public String send(String command, String[] expects) throws IOException {
		return send(command, expects, -1);
	}

	/**
	 * Wait for a reply from the device CLI without sending anything.
	 * @param command The command to send
	 * @return the output from the device, result of the passed command
	 */
	@Export
	public String send(String[] expects) throws IOException {
		return send(null, expects, -1);
	}

	/**
	 * Get the last sent command.
	 * @return the last sent command
	 */
	@Export
	public String getLastCommand() {
		return cli.getLastCommand();
	}
	
	/**
	 * Get the last expect match.
	 * @return the last matched expect
	 */
	@Export
	public String getLastExpectMatch() {
		return cli.getLastExpectMatch().group();
	}
	
	/**
	 * Get the last expect specific match.
	 * @param group The specific match to tget
	 * @return the matched group
	 */
	@Export
	public String getLastExpectMatchGroup(int group) {
		try {
			return cli.getLastExpectMatch().group(group);
		}
		catch (Exception e) {
			return null;
		}
	}
	
	/**
	 * Get the last matched pattern.
	 * @return the last matched pattern
	 */
	@Export
	public String getLastExpectMatchPattern() {
		return cli.getLastExpectMatchPattern();
	}
	
	/**
	 * Get the last match index.
	 * @return the last matched index
	 */
	@Export
	public int getLastExpectMatchIndex() {
		return cli.getLastExpectMatchIndex();
	}
	
	/**
	 * Get the last full output of the device (after a command was sent).
	 * @return the last full output
	 */
	@Export
	public String getLastFullOutput() {
		return cli.getLastFullOutput();
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