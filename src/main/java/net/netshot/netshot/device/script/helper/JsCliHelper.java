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
package net.netshot.netshot.device.script.helper;

import java.io.IOException;
import java.time.Instant;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.graalvm.polyglot.HostAccess.Export;

import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.device.DeviceDriver;
import net.netshot.netshot.device.access.Cli;
import net.netshot.netshot.device.access.Cli.WithBufferIOException;
import net.netshot.netshot.device.credentials.DeviceCliAccount;
import net.netshot.netshot.work.TaskLogger;

/**
 * This class is used to pass CLI control to JavaScript.
 * @author sylvain.cadilhac
 *
 */
@Slf4j
public class JsCliHelper {

	/** The CLI object to interact with the device via command line. */
	private Cli cli;
	/** The CLI account (SSH/Telnet). */
	private DeviceCliAccount account;
	/** The task logger. */
	private TaskLogger taskLogger;
	/** An error was raised. */
	private boolean errored;

	/**
	 * Instantiate a new JsCliHelper object.
	 * @param cli The device CLI
	 * @param account The account to connect to the device
	 * @param taskLogger The task logger
	 */
	public JsCliHelper(Cli cli, DeviceCliAccount account, TaskLogger taskLogger) {
		this.cli = cli;
		this.account = account;
		this.taskLogger = taskLogger;
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
		if (this.taskLogger.isTracing()) {
			// Log before injecting secrets
			this.taskLogger.trace(Instant.now() + " About to send the following command:");
			this.taskLogger.trace(command);
			this.taskLogger.trace("Hexadecimal:");
			this.taskLogger.hexTrace(command);
		}
		log.debug("Command to be sent (secrets not replaced): '{}'.", command);
		command = command.replaceAll(Pattern.quote(DeviceDriver.PLACEHOLDER_USERNAME),
			Matcher.quoteReplacement(account.getUsername()));
		command = command.replaceAll(Pattern.quote(DeviceDriver.PLACEHOLDER_PASSWORD),
			Matcher.quoteReplacement(account.getPassword()));
		command = command.replaceAll(Pattern.quote(DeviceDriver.PLACEHOLDER_SUPERPASSWORD),
			Matcher.quoteReplacement(account.getSuperPassword()));
		int oldTimeout = cli.getCommandTimeout();
		if (timeout > 0) {
			cli.setCommandTimeout(timeout);
		}
		try {
			if (this.taskLogger.isTracing()) {
				this.taskLogger.trace("Expecting one of the following {} pattern(s) within {}ms:",
					expects.length, timeout > 0 ? timeout : oldTimeout);
				for (String expect : expects) {
					this.taskLogger.trace(expect);
				}
			}
			String result = cli.send(command, expects);
			if (this.taskLogger.isTracing()) {
				this.taskLogger.trace(Instant.now() + " Received the following output:");
				this.taskLogger.trace(cli.getLastFullOutput());
				this.taskLogger.trace("Hexadecimal:");
				this.taskLogger.hexTrace(cli.getLastFullOutput());
				this.taskLogger.trace("The following pattern matched:");
				this.taskLogger.trace(this.getLastExpectMatchPattern());
			}
			return result;
		}
		catch (IOException e) {
			log.error("CLI I/O error.", e);
			this.taskLogger.error("I/O error: " + e.getMessage());
			if (this.taskLogger.isTracing()) {
				this.taskLogger.trace(Instant.now() + " I/O exception: {}", e.getMessage());
			}
			if (e instanceof WithBufferIOException wioException) {
				String buffer = wioException.getReceivedBuffer().toString();
				if (this.taskLogger.isTracing()) {
					this.taskLogger.trace(Instant.now() + " The receive buffer is:");
					this.taskLogger.trace(buffer);
					this.taskLogger.trace("Hexadecimal:");
					this.taskLogger.hexTrace(buffer);
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
		this.taskLogger.trace(Instant.now() + " " + message);
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
	 * @param expects = The patterns to wait for
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
