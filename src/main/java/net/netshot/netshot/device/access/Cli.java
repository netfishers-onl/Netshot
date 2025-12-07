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
import java.io.InputStream;
import java.io.PrintStream;
import java.util.EnumSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.device.NetworkAddress;
import net.netshot.netshot.work.TaskContext;

/**
 * A CLI object to access a device through command line.
 * Abstract - real implementations are Telnet, SSH.
 */
@Slf4j
public abstract class Cli {

	/** Possible clean up actions to enable on the Cli instance. */
	public static enum CleanUpAction {
		/** Remove ANSI codes like colors/ */
		STRIP_ANSI_CODES,
		/** Replace \r\n with \n. */
		NORMALIZE_LINE_ENDINGS,
		/** \r followed by characters rewrites the line. */
		PROCESS_CARRIAGE_RETUNS,
		/** Backspace \b erases previous character. */
		PROCESS_BACKSPACES,
		/** Remove the found prompt from the output. */
		STRIP_PROMPT,
	}

	/**
	 * An IOException, with an attached buffer.
	 *
	 */
	public class WithBufferIOException extends IOException {
		private static final long serialVersionUID = -1759143581862318498L;

		public WithBufferIOException(String message, CharSequence receivedBuffer) {
			super(message);
			this.receivedBuffer = receivedBuffer.toString();
		}

		private String receivedBuffer;

		public String getReceivedBuffer() {
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

	/** Clean up actions on CLI output. */
	@Getter
	@Setter
	protected EnumSet<CleanUpAction> outputCleanUpActions = EnumSet.of(
		CleanUpAction.STRIP_ANSI_CODES,
		CleanUpAction.STRIP_PROMPT,
		CleanUpAction.PROCESS_BACKSPACES,
		CleanUpAction.PROCESS_CARRIAGE_RETUNS
	);

	/** The current task context. */
	protected TaskContext taskContext;

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
	 * @param taskContext the current task context
	 */
	public Cli(NetworkAddress host, TaskContext taskContext) {
		this.host = host;
		this.taskContext = taskContext;
	}

	/**
	 * Connect.
	 *
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public abstract void connect() throws IOException;


	/**
	 * Enable or disable the given clean up action.
	 * @param action = the action
	 * @param enable = true to enable, false to disable
	 */
	public void setOuputCleanUpAction(CleanUpAction action, boolean enable) {
		if (enable) {
			this.outputCleanUpActions.add(action);
		}
		else {
			this.outputCleanUpActions.remove(action);
		}
	}

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
	 * Read until a string is matched.
	 *
	 * @param expects the list of patterns to expect
	 * @return the collected output
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	protected String readUntil(String[] expects) throws IOException {
		Pattern[] patterns = new Pattern[expects.length];
		for (int i = 0; i < expects.length; i++) {
			patterns[i] = Pattern.compile(expects[i], Pattern.MULTILINE);
		}

		long lastActivityTime = System.currentTimeMillis();

		StringBuilder buffer = new StringBuilder();
		byte[] miniBuffer = new byte[4096];
		boolean bufferChanged = true;

		while (true) {
			while (this.inStream != null && this.inStream.available() > 0) {
				int length = this.inStream.read(miniBuffer);
				if (length > 0) {
					String s = new String(miniBuffer, 0, length);
					log.trace("Received data '{}'.", s);
					buffer.append(s);
					lastActivityTime = System.currentTimeMillis();
					bufferChanged = true;
				}
			}

			// Only process patterns if new data was received or this is the first iteration
			if (bufferChanged) {
				// Clean up output (remove ANSI codes, normalize line endings, etc.)
				// Create a copy of the buffer for cleanup (don't modify the original buffer)
				StringBuilder cleanBuffer = new StringBuilder(buffer);
				this.cleanUpTerminalOutput(cleanBuffer);

				for (int i = 0; i < patterns.length; i++) {
					Matcher matcher = patterns[i].matcher(cleanBuffer);
					if (matcher.find()) {
						String cleanOutput = cleanBuffer.toString();
						this.lastExpectMatch = matcher;
						this.lastExpectMatchIndex = i;
						this.lastFullOutput = cleanOutput;
						this.lastExpectMatchPattern = expects[i];
						// Return output with or without the matched prompt based on stripPrompt setting
						if (this.outputCleanUpActions.contains(CleanUpAction.STRIP_PROMPT)) {
							return matcher.replaceFirst("");
						}
						return cleanOutput;
					}
				}
			}

			if (System.currentTimeMillis() > lastActivityTime + this.commandTimeout) {
				throw new WithBufferIOException("Timeout waiting for the command output.", buffer);
			}

			try {
				Thread.sleep(10);
			}
			catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				throw new IOException("Thread interrupted while waiting for data", e);
			}

			bufferChanged = false;
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


	/**
	 * Cleans up CLI output.
	 *
	 * @param buffer the input buffer coming from device's terminal
	 * @return the cleaned string
	 */
	protected void cleanUpTerminalOutput(StringBuilder buffer) {

		// Apply cleanup steps in order, modifying buffer in-place
		this.removeAnsiCodes(buffer);
		this.processBackspaces(buffer);
		this.processCarriageReturns(buffer);
		this.normalizeLineEndings(buffer);
	}

	/**
	 * Removes ANSI escape codes and control characters from the buffer.
	 *
	 * @param buffer the string buffer (modified in-place)
	 */
	private void removeAnsiCodes(StringBuilder buffer) {
		if (!this.outputCleanUpActions.contains(CleanUpAction.STRIP_ANSI_CODES)) {
			return;
		}

		// Process buffer by directly deleting unwanted characters
		int i = 0;
		while (i < buffer.length()) {
			char ch = buffer.charAt(i);

			// Handle ESC sequences
			if (ch == '\u001B') {
				// ESC at end of string - delete it
				if (i + 1 >= buffer.length()) {
					buffer.deleteCharAt(i);
					continue;
				}

				char next = buffer.charAt(i + 1);
				int deleteStart = i;
				int deleteEnd = i + 1; // exclusive

				// CSI sequences: ESC [ ... letter
				if (next == '[') {
					deleteEnd = i + 2;
					while (deleteEnd < buffer.length()) {
						char c = buffer.charAt(deleteEnd);
						// CSI sequences end with a letter (@-Z or a-z per ECMA-48)
						if ((c >= '@' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
							deleteEnd++;
							break;
						}
						deleteEnd++;
					}
					buffer.delete(deleteStart, deleteEnd);
					continue;
				}
				// OSC sequences: ESC ] ... BEL or ESC ] ... ESC \
				else if (next == ']') {
					deleteEnd = i + 2;
					while (deleteEnd < buffer.length()) {
						char c = buffer.charAt(deleteEnd);
						if (c == '\u0007') { // BEL
							deleteEnd++;
							break;
						}
						if (c == '\u001B' && deleteEnd + 1 < buffer.length() && buffer.charAt(deleteEnd + 1) == '\\') {
							deleteEnd += 2;
							break;
						}
						deleteEnd++;
					}
					buffer.delete(deleteStart, deleteEnd);
					continue;
				}
				// Character set selection: ESC ( or ESC )
				else if ((next == '(' || next == ')') && i + 2 < buffer.length()) {
					buffer.delete(i, i + 3);
					continue;
				}
				// Keypad modes: ESC = or ESC >
				else if (next == '=' || next == '>') {
					buffer.delete(i, i + 2);
					continue;
				}
				// Other single-character ESC sequences (ESC followed by any char)
				else {
					buffer.delete(i, i + 2);
					continue;
				}
			}
			// Filter out control characters (except newline, tab, carriage return, backspace)
			else if ((ch >= '\u0000' && ch <= '\u0007') ||  // \b is \u0008, keep it for later processing
			         (ch >= '\u000B' && ch <= '\u000C') ||
			         (ch >= '\u000E' && ch <= '\u001F') ||
			         ch == '\u007F') {
				buffer.deleteCharAt(i);
				continue;
			}

			// Regular character - keep it, move to next
			i++;
		}
	}

	/**
	 * Processes backspace character sequences
	 * (removes the backspace along with previous char).
	 *
	 * @param buffer the string buffer (modified in-place)
	 */
	private void processBackspaces(StringBuilder buffer) {
		if (!this.outputCleanUpActions.contains(CleanUpAction.PROCESS_BACKSPACES)) {
			return;
		}

		int i = 0;
		while (i < buffer.length()) {
			// Check for pattern: non-backspace char followed by backspace
			if (i + 1 < buffer.length() &&
			    buffer.charAt(i) != '\b' &&
			    buffer.charAt(i + 1) == '\b') {
				// Delete both characters (simulates backspace deleting previous char)
				buffer.delete(i, i + 2);
				// Step back to check for cascading backspaces, but don't go below 0
				if (i > 0) {
					i--;
				}
			}
			else {
				i++;
			}
		}
	}

	/**
	 * Processes carriage returns to simulate terminal line overwrite behavior.
	 * When a \r is encountered, the cursor moves to the beginning of the current line,
	 * and subsequent characters overwrite existing characters position by position.
	 *
	 * @param buffer the string buffer (modified in-place)
	 */
	private void processCarriageReturns(StringBuilder buffer) {
		if (!this.outputCleanUpActions.contains(CleanUpAction.PROCESS_CARRIAGE_RETUNS)) {
			return;
		}

		int i = 0;
		int lineStart = 0; // Track start of current line

		while (i < buffer.length()) {
			char ch = buffer.charAt(i);

			if (ch == '\n') {
				// Move to next line
				lineStart = i + 1;
				i++;
			}
			else if (ch == '\r') {
				// Found a \r - extract content after it until next \r or \n
				int contentStart = i + 1;
				int contentEnd = contentStart;

				// Find the end of content (next \r or \n or end of buffer)
				while (contentEnd < buffer.length() &&
				       buffer.charAt(contentEnd) != '\r' &&
				       buffer.charAt(contentEnd) != '\n') {
					contentEnd++;
				}

				int contentLength = contentEnd - contentStart;

				if (contentLength > 0) {
					// Extract the content that will overwrite
					String content = buffer.substring(contentStart, contentEnd);
					int lineLength = i - lineStart;

					// Save the tail if the line is longer than the new content
					String tail = "";
					if (lineLength > contentLength) {
						tail = buffer.substring(lineStart + contentLength, i);
					}

					// Delete from lineStart to contentEnd (old line + \r + new content)
					buffer.delete(lineStart, contentEnd);

					// Insert new content + tail at lineStart
					buffer.insert(lineStart, content + tail);

					// Continue from after the inserted content + tail
					i = lineStart + content.length() + tail.length();
				}
				else {
					// No content after \r, just move forward
					i++;
				}
			}
			else {
				i++;
			}
		}
	}

	/**
	 * Normalizes line endings by converting CRLF to LF and removing standalone \r.
	 * Only active when normalizeCarriageReturns is enabled.
	 *
	 * @param buffer the string buffer (modified in-place)
	 */
	private void normalizeLineEndings(StringBuilder buffer) {
		if (!this.outputCleanUpActions.contains(CleanUpAction.NORMALIZE_LINE_ENDINGS)) {
			return;
		}

		int i = 0;

		while (i < buffer.length()) {
			char ch = buffer.charAt(i);

			if (ch == '\r') {
				if (i + 1 < buffer.length() && buffer.charAt(i + 1) == '\n') {
					// CRLF -> LF: delete the \r, keep the \n
					buffer.deleteCharAt(i);
					continue;
				}
			}
			i++;
		}
	}

}
