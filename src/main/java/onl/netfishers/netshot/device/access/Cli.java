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
import java.io.InputStream;
import java.io.PrintStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import onl.netfishers.netshot.device.NetworkAddress;
import onl.netfishers.netshot.work.TaskLogger;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

/**
 * A CLI object to access a device through command line.
 * Abstract - real implementations are Telnet, SSH.
 */
@Slf4j
public abstract class Cli {

	private static Pattern ansiEscapePattern = Pattern.compile("\u001B\\[([;\\d]*m|[\u0030-\u003F]*[\u0020-\u002F]*[\u0040-\u007E])");

	/**
	 * An IOException, with an attached buffer.
	 * @author sylvain.cadilhac
	 *
	 */
	public class WithBufferIOException extends IOException {
		private static final long serialVersionUID = -1759143581862318498L;

		public WithBufferIOException(String message, StringBuffer receivedBuffer) {
			super(message);
			this.receivedBuffer = receivedBuffer;
		}

		private StringBuffer receivedBuffer;

		public StringBuffer getReceivedBuffer() {
			return receivedBuffer;
		}

	}

	/** The connection timeout. */
	@Getter
	@Setter
	protected int connectionTimeout = 5000;

	/** The receive timeout. */
	@Getter
	@Setter
	protected int receiveTimeout = 60000;

	/** The command timeout. */
	@Getter
	@Setter
	protected int commandTimeout = 120000;

	/** The current task logger */
	protected TaskLogger taskLogger;

	/** The last command. */
	@Getter
	protected String lastCommand;

	/** The last expect match. */
	@Getter
	protected Matcher lastExpectMatch;

	/** The last expect match pattern. */
	@Getter
	protected String lastExpectMatchPattern;

	/** The last expect match index. */
	@Getter
	protected int lastExpectMatchIndex = -1;

	/** The last full output. */
	@Getter
	protected String lastFullOutput;

	/** The in stream. */
	protected InputStream inStream;

	/** The out stream. */
	protected PrintStream outStream;

	/** The prompt. */
	protected String prompt;

	/** The host. */
	protected NetworkAddress host;

	/**
	 * Instantiates a new cli.
	 *
	 * @param host the host
	 * @param taskLogger the current task logger
	 */
	public Cli(NetworkAddress host, TaskLogger taskLogger) {
		this.host = host;
		this.taskLogger = taskLogger;
	}

	/**
	 * Connect.
	 *
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public abstract void connect() throws IOException;

	/**
	 * Send.
	 *
	 * @param command the command
	 * @param expect the expect
	 * @return the string
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public String send(String command, String expect) throws IOException {
		String[] expects = new String[1];
		expects[0] = expect;
		return send(command, expects);
	}

	/**
	 * Disconnect.
	 */
	public abstract void disconnect();

	/**
	 * Read until a string is matched
	 *
	 * @param expects the list of patterns to expect
	 * @return the collected output
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	protected String readUntil(String[] expects) throws IOException {
		StringBuffer buffer = new StringBuffer();
		byte[] miniBuffer = new byte[4096];
		Pattern[] patterns = new Pattern[expects.length];
		for (int i = 0; i < expects.length; i++) {
			patterns[i] = Pattern.compile(expects[i], Pattern.MULTILINE);
		}

		long lastActivityTime = System.currentTimeMillis();

		while (true) {
			while (this.inStream != null && this.inStream.available() > 0) {
				int length = this.inStream.read(miniBuffer);
				String s = new String(miniBuffer, 0, length);
				log.debug("Received data '{}'.", s);
				buffer.append(s);
				lastActivityTime = System.currentTimeMillis();
			}
			for (int i = 0; i < patterns.length; i++) {
				String received = buffer.toString();
				// Remove ANSI escape sequences
				received = Cli.ansiEscapePattern.matcher(received).replaceAll("");
				Matcher matcher = patterns[i].matcher(received);
				if (matcher.find()) {
					this.lastExpectMatch = matcher;
					this.lastExpectMatchIndex = i;
					this.lastFullOutput = received;
					this.lastExpectMatchPattern = expects[i];
					return matcher.replaceFirst("");
				}
			}
			if (System.currentTimeMillis() > lastActivityTime + this.commandTimeout) {
				throw new WithBufferIOException("Timeout waiting for the command output.", buffer);
			}
		}
	}

	/**
	 * Write.
	 *
	 * @param value the value
	 */
	protected void write(String value) {
		outStream.print(value);
		outStream.flush();
	}

	/**
	 * Send.
	 *
	 * @param command the command
	 * @param expects the expects
	 * @return the string
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public String send(String command, String[] expects) throws IOException {
		log.debug("Command to send: '{}'.", command);
		this.write(command);
		this.lastCommand = command;
		return this.readUntil(expects);
	}


}
