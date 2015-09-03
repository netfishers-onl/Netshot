/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.device.access;

import java.io.IOException;
import java.io.InputStream;
import java.io.PrintStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import onl.netfishers.netshot.device.NetworkAddress;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A CLI object to access a device through command line.
 * Abstract - real implementations are Telnet, SSH.
 */
public abstract class Cli {
	
	private static Logger logger = LoggerFactory.getLogger(Cli.class);

	/** The connection timeout. */
	protected int connectionTimeout = 5000;
	
	/**
	 * Gets the connection timeout.
	 *
	 * @return the connection timeout
	 */
	public int getConnectionTimeout() {
		return connectionTimeout;
	}

	/**
	 * Sets the connection timeout.
	 *
	 * @param connectionTimeout the new connection timeout
	 */
	public void setConnectionTimeout(int connectionTimeout) {
		this.connectionTimeout = connectionTimeout;
	}
	
	/** The receive timeout. */
	protected int receiveTimeout = 60000;

	/**
	 * Gets the receive timeout.
	 *
	 * @return the receive timeout
	 */
	public int getReceiveTimeout() {
		return receiveTimeout;
	}

	/**
	 * Sets the receive timeout.
	 *
	 * @param receiveTimeout the new receive timeout
	 */
	public void setReceiveTimeout(int receiveTimeout) {
		this.receiveTimeout = receiveTimeout;
	}

	/** The command timeout. */
	protected int commandTimeout = 120000;
	
	/**
	 * Gets the command timeout.
	 *
	 * @return the command timeout
	 */
	public int getCommandTimeout() {
		return commandTimeout;
	}

	/**
	 * Sets the command timeout.
	 *
	 * @param commandTimeout the new command timeout
	 */
	public void setCommandTimeout(int commandTimeout) {
		this.commandTimeout = commandTimeout;
	}

	
	/** The prompt. */
	protected String prompt;
	
	/** The host. */
	protected NetworkAddress host;
	
	/**
	 * Instantiates a new cli.
	 *
	 * @param host the host
	 */
	public Cli(NetworkAddress host) {
		this.host = host;
	}
	
	/** The last command. */
	protected String lastCommand;
	
	/** The last expect match. */
	protected Matcher lastExpectMatch;
	
	/** The last expect match pattern. */
	protected String lastExpectMatchPattern;
	
	/** The last expect match index. */
	protected int lastExpectMatchIndex = -1;
	
	/** The last full output. */
	protected String lastFullOutput;
	
	/** The in stream. */
	protected InputStream inStream;
	
	/** The out stream. */
	protected PrintStream outStream;
	
	/**
	 * Gets the last command.
	 *
	 * @return the last command
	 */
	public String getLastCommand() {
		return lastCommand;
	}

	/**
	 * Gets the last expect match.
	 *
	 * @return the last expect match
	 */
	public Matcher getLastExpectMatch() {
		return lastExpectMatch;
	}
	
	/**
	 * Gets the last expect match pattern.
	 *
	 * @return the last expect match pattern
	 */
	public String getLastExpectMatchPattern() {
		return lastExpectMatchPattern;
	}
	
	/**
	 * Gets the last expect match index.
	 *
	 * @return the last expect match index
	 */
	public int getLastExpectMatchIndex() {
		return lastExpectMatchIndex;
	}
	
	/**
	 * Gets the last full output.
	 *
	 * @return the last full output
	 */
	public String getLastFullOutput() {
		return lastFullOutput;
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
	 * Read until.
	 *
	 * @param expects the expects
	 * @return the string
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	protected String readUntil(String[] expects) throws IOException {
		StringBuffer buffer = new StringBuffer();
		byte[] miniBuffer = new byte[4096];
		Pattern[] patterns = new Pattern[expects.length];
		for (int i = 0; i < expects.length; i++) {
			patterns[i] = Pattern.compile(expects[i], Pattern.MULTILINE);
		}
	
		long maxTime = System.currentTimeMillis() + this.commandTimeout;
		
		while (true) {			
			while (this.inStream != null && this.inStream.available() > 0) {
				int length = this.inStream.read(miniBuffer);
				String s = new String(miniBuffer, 0, length);
				logger.debug("Received data '{}'.", s);
				buffer.append(s);
			}
			for (int i = 0; i < patterns.length; i++) {
				Matcher matcher = patterns[i].matcher(buffer);
				if (matcher.find()) {
					this.lastExpectMatch = matcher;
					this.lastExpectMatchIndex = i;
					this.lastFullOutput = buffer.toString();
					this.lastExpectMatchPattern = expects[i];
					return matcher.replaceFirst("");
				}
			}
			if (System.currentTimeMillis() > maxTime) {
				throw new IOException("Timeout waiting for the command output.");
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
		logger.debug("Command to send: '{}'.", command);
		this.write(command);
		this.lastCommand = command;
		return this.readUntil(expects);
	}
	

}
