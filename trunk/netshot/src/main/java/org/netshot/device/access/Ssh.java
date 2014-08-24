/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device.access;

import java.io.IOException;
import java.io.PrintStream;
import org.netshot.device.NetworkAddress;

import com.jcraft.jsch.Channel;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;

/**
 * An SSH CLI access.
 */
public class Ssh extends Cli {
	
	/** The port. */
	private int port = 22;
	
	/** The jsch. */
	private JSch jsch;
	
	/** The session. */
	private Session session;
	
	/** The channel. */
	private Channel channel;
	
	/** The username. */
	private String username;
	
	/** The password. */
	private String password;
	
	/**
	 * Instantiates a new ssh.
	 *
	 * @param host the host
	 * @param port the port
	 * @param username the username
	 * @param password the password
	 */
	public Ssh(NetworkAddress host, int port, String username, String password) {
		super(host);
		this.port = port;
		this.username = username;
		this.password = password;
	}
	
	/**
	 * Instantiates a new ssh.
	 *
	 * @param host the host
	 * @param username the username
	 * @param password the password
	 */
	public Ssh(NetworkAddress host, String username, String password) {
		super(host);
		this.username = username;
		this.password = password;
	}

	/* (non-Javadoc)
	 * @see org.netshot.device.access.Cli#connect()
	 */
	@Override
	public void connect() throws IOException {
		jsch = new JSch();
		try {
			session = jsch.getSession(username, host.getIP(), port);
			session.setPassword(password);
			// Disable Strict Key checking
			session.setConfig("StrictHostKeyChecking", "no");
			session.setTimeout(this.receiveTimeout);
			session.connect(this.connectionTimeout);
			channel = session.openChannel("shell");
			this.inStream = channel.getInputStream();
			this.outStream = new PrintStream(channel.getOutputStream());
			channel.connect(this.connectionTimeout);
		} catch (JSchException e) {
			throw new IOException(e.getMessage());
		}
		
	}

	/* (non-Javadoc)
	 * @see org.netshot.device.access.Cli#disconnect()
	 */
	@Override
	public void disconnect() {
		try {
			channel.disconnect();
			session.disconnect();
		} catch (Exception e) {
			
		}
		
	}

}
