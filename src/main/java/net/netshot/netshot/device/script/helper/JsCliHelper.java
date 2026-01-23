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
import java.util.EnumSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.graalvm.polyglot.HostAccess.Export;

import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.device.DeviceDriver;
import net.netshot.netshot.device.access.Cli;
import net.netshot.netshot.device.access.Cli.WithBufferIOException;
import net.netshot.netshot.device.credentials.DeviceCliAccount;
import net.netshot.netshot.work.TaskContext;

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
	/** The task context. */
	private TaskContext taskContext;
	/** An error was raised. */
	private boolean errored;
	/** The last output from a send command. */
	private Cli.CommandOutput lastOutput;

	/**
	 * Instantiate a new JsCliHelper object.
	 * @param cli The device CLI
	 * @param account The account to connect to the device
	 * @param taskContext The task context
	 */
	public JsCliHelper(Cli cli, DeviceCliAccount account, TaskContext taskContext) {
		this.cli = cli;
		this.account = account;
		this.taskContext = taskContext;
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
	 * @param cleanUpActions The cleanup actions to apply (array of CleanUpAction names, null for default)
	 * @param discoverWaitTime Minimum time to wait after match to discover additional output (0 for no wait)
	 * @return the output from the device, result of the passed command
	 */
	@Export
	public String send(String command, String[] expects, int timeout, String[] cleanUpActions, int discoverWaitTime) {
		this.errored = false;
		if (command == null) {
			command = "";
		}
		command = command.replaceAll(Pattern.quote(DeviceDriver.PLACEHOLDER_USERNAME),
			Matcher.quoteReplacement(account.getUsername()));
		if (this.taskContext.isTracing()) {
			// Log before injecting secrets
			this.taskContext.trace(Instant.now() + " About to send the following (secrets not inserted):");
			this.taskContext.trace(command);
			this.taskContext.hexTrace(command);
		}
		log.debug("Command to be sent (secrets not inserted): '{}'.", command);
		command = command.replaceAll(Pattern.quote(DeviceDriver.PLACEHOLDER_PASSWORD),
			Matcher.quoteReplacement(account.getPassword()));
		command = command.replaceAll(Pattern.quote(DeviceDriver.PLACEHOLDER_SUPERPASSWORD),
			Matcher.quoteReplacement(account.getSuperPassword()));

		// Prepare CommandInput
		Cli.CommandInput input = new Cli.CommandInput(command, expects);

		if (timeout > 0) {
			input.setCommandTimeout(timeout);
		}

		if (cleanUpActions != null) {
			EnumSet<Cli.CleanUpAction> actions = EnumSet.noneOf(Cli.CleanUpAction.class);
			for (String action : cleanUpActions) {
				try {
					actions.add(Cli.CleanUpAction.valueOf(action));
				}
				catch (IllegalArgumentException e) {
					log.warn("Invalid cleanup action '{}', ignoring.", action);
				}
			}
			input.setCleanUpActions(actions);
		}

		if (discoverWaitTime > 0) {
			input.setDiscoverWaitTime(discoverWaitTime);
		}

		try {
			if (this.taskContext.isTracing()) {
				this.taskContext.trace("Expecting one of the following {} pattern(s) within {}ms:",
					expects.length, input.getCommandTimeout() == null ? cli.getCommandTimeout() : input.getCommandTimeout());
				for (String expect : expects) {
					this.taskContext.trace(expect);
				}
			}
			this.lastOutput = cli.send(input);
			if (this.taskContext.isTracing()) {
				this.taskContext.trace("Received the following output:");
				this.taskContext.trace(this.lastOutput.getFullOutput());
				this.taskContext.hexTrace(this.lastOutput.getFullOutput());
				this.taskContext.trace("The following pattern matched:");
				this.taskContext.trace(this.getLastExpectMatchPattern());
			}
			return this.lastOutput.getOutput();
		}
		catch (IOException e) {
			log.error("CLI I/O error.", e);
			this.taskContext.error("I/O error: " + e.getMessage());
			if (this.taskContext.isTracing()) {
				this.taskContext.trace(Instant.now() + " I/O exception: {}", e.getMessage());
			}
			if (e instanceof WithBufferIOException wioException) {
				String buffer = wioException.getReceivedBuffer().toString();
				if (this.taskContext.isTracing()) {
					this.taskContext.trace(Instant.now() + " The receive buffer is:");
					this.taskContext.trace(buffer);
					this.taskContext.hexTrace(buffer);
				}
			}
			this.errored = true;
		}
		return null;
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
		return send(command, expects, timeout, null, 0);
	}

	/**
	 * Add a trace message to the debug log.
	 * @param message The message to add
	 */
	@Export
	public void trace(String message) {
		this.taskContext.trace(Instant.now() + " " + message);
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
		if (this.lastOutput == null) {
			return null;
		}
		return this.lastOutput.getCommand();
	}

	/**
	 * Get the last expect match.
	 * @return the last matched expect
	 */
	@Export
	public String getLastExpectMatch() {
		if (this.lastOutput == null || this.lastOutput.getExpectMatch() == null) {
			return null;
		}
		return this.lastOutput.getExpectMatch().group();
	}

	/**
	 * Get the last expect specific match.
	 * @param group The specific match to tget
	 * @return the matched group
	 */
	@Export
	public String getLastExpectMatchGroup(int group) {
		try {
			return this.lastOutput.getExpectMatch().group(group);
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
		if (this.lastOutput == null) {
			return null;
		}
		return this.lastOutput.getExpectMatchPattern();
	}

	/**
	 * Get the last match index.
	 * @return the last matched index
	 */
	@Export
	public int getLastExpectMatchIndex() {
		if (this.lastOutput == null) {
			return -1;
		}
		return this.lastOutput.getExpectMatchIndex();
	}

	/**
	 * Get the last full output of the device (after a command was sent).
	 * @return the last full output
	 */
	@Export
	public String getLastFullOutput() {
		if (this.lastOutput == null) {
			return null;
		}
		return this.lastOutput.getFullOutput();
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
