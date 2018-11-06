/**
 * Copyright 2013-2016 Sylvain Cadilhac (NetFishers)
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

import onl.netfishers.netshot.device.NetworkAddress;

import com.jcraft.jsch.Channel;
import com.jcraft.jsch.Identity;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.KeyPair;
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
	
	/** The password or passphrase. */
	private String password;
	
	/** The public key. */
	private String publicKey = null;
	
	/** The private key. */
	private String privateKey = null;
	
	/**
	 * Instantiates a new SSH connection (password authentication).
	 *
	 * @param host the host
	 * @param port the port
	 * @param username the username
	 * @param password the password
	 */
	public Ssh(NetworkAddress host, int port, String username, String password) {
		super(host);
		if (port != 0) this.port = port;
		this.username = username;
		this.password = password;
		this.privateKey = null;
	}
	
	/**
	 * Instantiates a new SSH connection (private key authentication).
	 * 
	 * @param host the host
	 * @param port the port
	 * @param username the SSH username
	 * @param privateKey the RSA/DSA private key
	 * @param passphrase the passphrase which protects the private key
	 */
	public Ssh(NetworkAddress host, int port, String username, String publicKey, String privateKey, String passphrase) {
		super(host);
		if (port != 0) this.port = port;
		this.username = username;
		this.publicKey = publicKey;
		this.privateKey = privateKey;
		this.password = passphrase;
	}
	
	/**
	 * Instantiates a new SSH connection (private key authentication).
	 * 
	 * @param host the host
	 * @param username the SSH username
	 * @param privateKey the RSA/DSA private key
	 * @param passphrase the passphrase which protects the private key
	 */
	public Ssh(NetworkAddress host, String username, String publicKey, String privateKey, String passphrase) {
		super(host);
		this.username = username;
		this.publicKey = publicKey;
		this.privateKey = privateKey;
		this.password = passphrase;
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
		this.privateKey = null;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.access.Cli#connect()
	 */
	@Override
	public void connect() throws IOException {
		jsch = new JSch();
		try {
			if (privateKey != null && publicKey != null) {
				KeyPair kpair = KeyPair.load(jsch, privateKey.getBytes(), publicKey.getBytes());
				jsch.addIdentity(new Identity() {
					@Override
					public boolean setPassphrase(byte[] passphrase) throws JSchException {
						return kpair.decrypt(passphrase);
					}
					@Override
					public boolean isEncrypted() {
						return kpair.isEncrypted();
					}
					@Override
					public byte[] getSignature(byte[] data) {
					    return kpair.getSignature(data);
					}
					@Override
					public byte[] getPublicKeyBlob() {
					    return kpair.getPublicKeyBlob();
					}
					@Override
					public String getName() {
						return "Key";
					}
					@Override
					public String getAlgName() {
						switch (kpair.getKeyType()) {
						case KeyPair.RSA:
							return "ssh-rsa";
						case KeyPair.DSA:
							return "ssh-dss";
						case KeyPair.ERROR:
							return "ERROR";
						default:
							return "UNKNOWN";
						}
					}
					@Override
					public boolean decrypt() {
						throw new RuntimeException("Not implemented");
					}
					@Override
					public void clear() {
						kpair.dispose();
					}
				}, password == null ? null : password.getBytes());
			}
			session = jsch.getSession(username, host.getIp(), port);
			if (privateKey == null || publicKey == null) {
				session.setPassword(password);
			}
			// Disable Strict Key checking
			session.setConfig("StrictHostKeyChecking", "no");
			session.setTimeout(this.receiveTimeout);
			session.connect(this.connectionTimeout);
			channel = session.openChannel("shell");
			this.inStream = channel.getInputStream();
			this.outStream = new PrintStream(channel.getOutputStream());
			channel.connect(this.connectionTimeout);
		}
		catch (JSchException e) {
			throw new IOException(e.getMessage(), e);
		}
		
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.access.Cli#disconnect()
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
