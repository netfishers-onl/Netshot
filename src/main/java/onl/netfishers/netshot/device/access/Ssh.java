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

import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.device.NetworkAddress;
import onl.netfishers.netshot.work.TaskLogger;

import com.jcraft.jsch.Channel;
import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.ChannelShell;
import com.jcraft.jsch.Identity;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.KeyPair;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;

import lombok.extern.slf4j.Slf4j;

/**
 * An SSH CLI access.
 */
@Slf4j
public class Ssh extends Cli {

	/**
	 * Logger bridge for Jsch to SLF4j
	 */
	@Slf4j
	public static class JschLogger implements com.jcraft.jsch.Logger {

		@Override
		public boolean isEnabled(int level) {
			return true;
		}

		@Override
		public void log(int level, String message) {
			switch (level) {
			case com.jcraft.jsch.Logger.DEBUG:
				log.debug(message);
				break;
			case com.jcraft.jsch.Logger.INFO:
				log.info(message);
				break;
			case com.jcraft.jsch.Logger.WARN:
				log.warn(message);
				break;
			case com.jcraft.jsch.Logger.ERROR:
				log.error(message);
				break;
			case com.jcraft.jsch.Logger.FATAL:
				log.error(message);
				break;
			}
		}

	}

	/**
	 * Embedded class to represent SSH-specific configuration.
	 */
	public static class SshConfig {

		static private String[] DEFAULT_SSH_KEX_ALGORITHMS = {
			"diffie-hellman-group18-sha512", "diffie-hellman-group16-sha512", "diffie-hellman-group14-sha256", "diffie-hellman-group14-sha1",
			"diffie-hellman-group-exchange-sha256", "diffie-hellman-group-exchange-sha1", "diffie-hellman-group1-sha1",
		};
	
		static private String[] DEFAULT_SSH_CIPHERS = {
			"aes128-gcm@openssh.com", "aes128-ctr", "aes128-cbc", "3des-ctr", "3des-cbc", "blowfish-cbc", "aes192-ctr",
			"aes192-cbc", "aes256-gcm@openssh.com", "aes256-ctr", "aes256-cbc",
		};
	
		static private String[] DEFAULT_SSH_MACS = {
			"hmac-md5-etm@openssh.com", "hmac-sha1-etm@openssh.com", "hmac-sha2-256-etm@openssh.com", "hmac-sha2-512-etm@openssh.com",
			"hmac-sha1-96-etm@openssh.com", "hmac-md5-96-etm@openssh.com", "hmac-md5", "hmac-sha1", "hmac-sha2-256", "hmac-sha2-512",
			"hmac-sha1-96", "hmac-md5-96",
		};
	
		static private String[] DEFAULT_SSH_HOST_KEY_ALGORITHMS = {
			"rsa-sha2-256", "rsa-sha2-512", "ssh-rsa", "ssh-dss", "ssh-ed25519",
		};

		static {
			String sshSetting;
	
			sshSetting = Netshot.getConfig("netshot.cli.ssh.kexalgorithms");
			if (sshSetting != null) {
				DEFAULT_SSH_KEX_ALGORITHMS = sshSetting.split(", *");
			}
			sshSetting = Netshot.getConfig("netshot.cli.ssh.hostkeyalgorithms");
			if (sshSetting != null) {
				DEFAULT_SSH_HOST_KEY_ALGORITHMS = sshSetting.split(", *");
			}
			sshSetting = Netshot.getConfig("netshot.cli.ssh.ciphers");
			if (sshSetting != null) {
				DEFAULT_SSH_CIPHERS = sshSetting.split(", *");
			}
			sshSetting = Netshot.getConfig("netshot.cli.ssh.macs");
			if (sshSetting != null) {
				DEFAULT_SSH_MACS = sshSetting.split(", *");
			}
	
			JSch.setLogger(new JschLogger());
	
			JSch.setConfig("CheckKexes", "diffie-hellman-group14-sha1,diffie-hellman-group14-sha256,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512,ecdh-sha2-nistp256,ecdh-sha2-nistp384,ecdh-sha2-nistp521");
			JSch.setConfig("CheckCiphers", "chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr,aes256-cbc,aes192-cbc,aes128-cbc,3des-ctr,arcfour,arcfour128,arcfour256");
			JSch.setConfig("CheckMacs", "hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512");
			JSch.setConfig("CheckSignatures", "rsa-sha2-256,rsa-sha2-512,ecdsa-sha2-nistp256,ecdsa-sha2-nistp384,ecdsa-sha2-nistp521,ssh-ed25519,ssh-ed448");
		}

		/** Key exchange algorithms allowed for the session */
		private String[] kexAlgorithms = DEFAULT_SSH_KEX_ALGORITHMS.clone();

		/** Host key algorithms allowed for the session */
		private String[] hostKeyAlgorithms = DEFAULT_SSH_HOST_KEY_ALGORITHMS.clone();

		/** Ciphers allowed for the session */
		private String[] ciphers = DEFAULT_SSH_CIPHERS.clone();

		/** MACs allowed for the session */
		private String[] macs = DEFAULT_SSH_MACS.clone();

		/** Whether to allocate a PTY or not */
		private boolean usePty = false;

		/** Type of terminal */
		private String terminalType = "vt100";

		/** Number of columns in the terminal */
		private int terminalCols = 80;

		/** Number of rows in the terminal */
		private int terminalRows = 24;

		/** Height of the terminal */
		private int terminalHeight = 640;

		/** Width of the terminal */
		private int terminalWidth = 480;

		/*
		 * Default constructor.
		 */
		public SshConfig() {
			
		}

		public String[] getKexAlgorithms() {
			return kexAlgorithms;
		}
	
		public void setKexAlgorithms(String[] kexAlgorithms) {
			this.kexAlgorithms = kexAlgorithms;
		}
	
		public String[] getHostKeyAlgorithms() {
			return hostKeyAlgorithms;
		}
	
		public void setHostKeyAlgorithms(String[] hostKeyAlgorithms) {
			this.hostKeyAlgorithms = hostKeyAlgorithms;
		}
	
		public String[] getCiphers() {
			return ciphers;
		}
	
		public void setCiphers(String[] ciphers) {
			this.ciphers = ciphers;
		}
	
		public String[] getMacs() {
			return macs;
		}
	
		public void setMacs(String[] macs) {
			this.macs = macs;
		}
	
		public boolean isUsePty() {
			return usePty;
		}
	
		public void setUsePty(boolean usePty) {
			this.usePty = usePty;
		}
	
		public String getTerminalType() {
			return terminalType;
		}
	
		public void setTerminalType(String terminalType) {
			this.terminalType = terminalType;
		}
	
		public int getTerminalCols() {
			return terminalCols;
		}
	
		public void setTerminalCols(int terminalCols) {
			this.terminalCols = terminalCols;
		}
	
		public int getTerminalRows() {
			return terminalRows;
		}
	
		public void setTerminalRows(int terminalRows) {
			this.terminalRows = terminalRows;
		}
	
		public int getTerminalHeight() {
			return terminalHeight;
		}
	
		public void setTerminalHeight(int terminalHeight) {
			this.terminalHeight = terminalHeight;
		}
	
		public int getTerminalWidth() {
			return terminalWidth;
		}
	
		public void setTerminalWidth(int terminalWidth) {
			this.terminalWidth = terminalWidth;
		}
	}

	/** Default value for the SSH connection timeout */
	static private int DEFAULT_CONNECTION_TIMEOUT = 5000;

	/** Default value for the SSH receive timeout */
	static private int DEFAULT_RECEIVE_TIMEOUT = 60000;

	/** Default value for the SSH command timeout */
	static private int DEFAULT_COMMAND_TIMEOUT = 120000;

	static {
		int configuredConnectionTimeout = Netshot.getConfig("netshot.cli.ssh.connectiontimeout", DEFAULT_CONNECTION_TIMEOUT);
		if (configuredConnectionTimeout < 1) {
			log.error("Invalid value {} for {}", configuredConnectionTimeout, "netshot.cli.ssh.connectiontimeout");
		}
		else {
			DEFAULT_CONNECTION_TIMEOUT = configuredConnectionTimeout;
		}
		log.info("The default connection timeout value for SSH sessions is {}s", DEFAULT_CONNECTION_TIMEOUT);

    int configuredReceiveTimeout = Netshot.getConfig("netshot.cli.ssh.receivetimeout", DEFAULT_RECEIVE_TIMEOUT);
		if (configuredReceiveTimeout < 1) {
			log.error("Invalid value {} for {}", configuredReceiveTimeout, "netshot.cli.ssh.receivetimeout");
		}
		else {
			DEFAULT_RECEIVE_TIMEOUT = configuredReceiveTimeout;
		}
		log.info("The default receive timeout value for SSH sessions is {}s", DEFAULT_RECEIVE_TIMEOUT);

		int configuredCommandTimeout = Netshot.getConfig("netshot.cli.ssh.commandtimeout", DEFAULT_COMMAND_TIMEOUT);
		if (configuredCommandTimeout < 1) {
			log.error("Invalid value {} for {}", configuredCommandTimeout, "netshot.cli.ssh.commandtimeout");
		}
		else {
			DEFAULT_COMMAND_TIMEOUT = configuredCommandTimeout;
		}
		log.info("The default command timeout value for SSH sessions is {}s", DEFAULT_COMMAND_TIMEOUT);
	}

	/** The port. */
	private int port = 22;

	/** The jsch. */
	private JSch jsch;

	/** The session. */
	private Session session;

	/** The channel. */
	private ChannelShell channel;

	/** The username. */
	private String username;

	/** The password or passphrase. */
	private String password;

	/** The public key. */
	private String publicKey = null;

	/** The private key. */
	private String privateKey = null;

	/** The SSH connection config */
	private SshConfig sshConfig = new SshConfig();

	/**
	 * Instantiates a new SSH connection (password authentication).
	 *
	 * @param host the host
	 * @param port the port
	 * @param username the username
	 * @param password the password
	 * @param taskLogger the current task logger
	 */
	public Ssh(NetworkAddress host, int port, String username, String password, TaskLogger taskLogger) {
		super(host, taskLogger);
		if (port != 0) this.port = port;
		this.username = username;
		this.password = password;
		this.privateKey = null;
		this.connectionTimeout = DEFAULT_CONNECTION_TIMEOUT;
		this.commandTimeout = DEFAULT_COMMAND_TIMEOUT;
		this.receiveTimeout = DEFAULT_RECEIVE_TIMEOUT;
	}

	/**
	 * Instantiates a new SSH connection (private key authentication).
	 *
	 * @param host the host
	 * @param port the port
	 * @param username the SSH username
	 * @param privateKey the RSA/DSA private key
	 * @param passphrase the passphrase which protects the private key
	 * @param taskLogger the current task logger
	 */
	public Ssh(NetworkAddress host, int port, String username, String publicKey, String privateKey,
			String passphrase, TaskLogger taskLogger) {
		super(host, taskLogger);
		if (port != 0) this.port = port;
		this.username = username;
		this.publicKey = publicKey;
		this.privateKey = privateKey;
		this.password = passphrase;
		this.connectionTimeout = DEFAULT_CONNECTION_TIMEOUT;
		this.commandTimeout = DEFAULT_COMMAND_TIMEOUT;
		this.receiveTimeout = DEFAULT_RECEIVE_TIMEOUT;
	}

	/**
	 * Instantiates a new SSH connection (private key authentication).
	 *
	 * @param host the host
	 * @param username the SSH username
	 * @param privateKey the RSA/DSA private key
	 * @param passphrase the passphrase which protects the private key
	 * @param taskLogger the current task logger
	 */
	public Ssh(NetworkAddress host, String username, String publicKey, String privateKey,
			String passphrase, TaskLogger taskLogger) {
		super(host, taskLogger);
		this.username = username;
		this.publicKey = publicKey;
		this.privateKey = privateKey;
		this.password = passphrase;
		this.connectionTimeout = DEFAULT_CONNECTION_TIMEOUT;
		this.commandTimeout = DEFAULT_COMMAND_TIMEOUT;
		this.receiveTimeout = DEFAULT_RECEIVE_TIMEOUT;
	}


	/**
	 * Instantiates a new ssh.
	 *
	 * @param host the host
	 * @param username the username
	 * @param password the password
	 * @param taskLogger the current task logger
	 */
	public Ssh(NetworkAddress host, String username, String password, TaskLogger taskLogger) {
		super(host, taskLogger);
		this.username = username;
		this.password = password;
		this.privateKey = null;
		this.connectionTimeout = DEFAULT_CONNECTION_TIMEOUT;
		this.commandTimeout = DEFAULT_COMMAND_TIMEOUT;
		this.receiveTimeout = DEFAULT_RECEIVE_TIMEOUT;
	}

	/**
	 * Create a SSH object by duplicating another one.
	 * 
	 * @param other the other SSH object
	 */
	public Ssh(Ssh other) {
		super(other.host, other.taskLogger);
		this.port = other.port;
		this.username = other.username;
		this.password = other.password;
		this.publicKey = other.publicKey;
		this.privateKey = other.privateKey;
		this.sshConfig = other.sshConfig;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.access.Cli#connect()
	 */
	@Override
	public void connect() throws IOException {
		this.connect(true);
	}

	/**
	 * Create the SSH session and open the channel (if openChannel is true).
	 * @param openChannel Whether to open the 
	 * @throws IOException
	 */
	public void connect(boolean openChannel) throws IOException {
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
					public byte[] getSignature(byte[] data, String alg) {
						return kpair.getSignature(data, alg);
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
			session.setConfig("kex", String.join(",", this.sshConfig.kexAlgorithms));
			session.setConfig("server_host_key", String.join(",", this.sshConfig.hostKeyAlgorithms));
			session.setConfig("cipher.c2s", String.join(",", this.sshConfig.ciphers));
			session.setConfig("cipher.s2c", String.join(",", this.sshConfig.ciphers));
			session.setConfig("mac.c2s", String.join(",", this.sshConfig.macs));
			session.setConfig("mac.s2c", String.join(",", this.sshConfig.macs));
			session.setTimeout(this.receiveTimeout);
			session.connect(this.connectionTimeout);
			if (openChannel) {
				channel = (ChannelShell)session.openChannel("shell");
				if (this.sshConfig.usePty) {
					channel.setPty(true);
					channel.setPtyType(this.sshConfig.terminalType,
							this.sshConfig.terminalCols, this.sshConfig.terminalRows,
							this.sshConfig.terminalWidth, this.sshConfig.terminalWidth);
				}
				this.inStream = channel.getInputStream();
				this.outStream = new PrintStream(channel.getOutputStream());
				channel.connect(this.connectionTimeout);
			}
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
			if (channel != null) {
				channel.disconnect();
			}
			if (session != null) {
				session.disconnect();
			}
		}
		catch (Exception e) {
			log.warn("Error on SSH disconnect.", e);
		}
	}

	private int scpCheckAck(InputStream in) throws IOException {
		int b = in.read();
		// 0 = success, 1 = error, 2 = fatal error, -1 = ...
		if (b == 1 || b == 2) {
			StringBuffer sb = new StringBuffer("SCP error: ");
			int c;
			do {
				c = in.read();
				sb.append((char) c);
			}
			while (c != '\n');
			throw new IOException(sb.toString());
		}
		return b;
	}

	/**
	 * Download a file using SCP.
	 * @param remoteFileName The file to download (name with full path) from the device
	 * @param localFileName  The local file name (name with full path) where to write
	 * @param newSession True to download through a new SSH session
	 */
	public void scpDownload(String remoteFileName, String localFileName, boolean newSession) throws IOException {
		if (localFileName == null) {
			throw new FileNotFoundException("Invalid destination file name for SCP copy operation. "
				+ "Have you defined 'netshot.snapshots.binary.path'?");
		}
		try (FileOutputStream fileStream = new FileOutputStream(localFileName)) {
			this.scpDownload(remoteFileName, fileStream, newSession);
		}
	}

	/**
	 * Download a file using SCP.
	 * @param remoteFileName The file to download (name with full path) from the device
	 * @param targetStream  Output stream
	 * @param newSession True to download through a new SSH session
	 */
	public void scpDownload(String remoteFileName, OutputStream targetStream, boolean newSession) throws IOException {
		if (newSession) {
			Ssh newSsh = new Ssh(this);
			try {
				newSsh.connect(false);
				newSsh.scpDownload(remoteFileName, targetStream, false);
			}
			finally {
				newSsh.disconnect();
			}
			return;
		}
		if (remoteFileName == null) {
			throw new FileNotFoundException("Invalid source file name for SCP copy operation");
		}
		if (!session.isConnected()) {
			throw new IOException("The SSH session is not connected, can't start the SCP transfer");
		}
		this.taskLogger.info(String.format("Downloading '%s' using SCP.", remoteFileName));

		Channel channel = null;
		try {
			String command = String.format("scp -f '%s'", remoteFileName.replace("'", "'\"'\"'"));
			channel = session.openChannel("exec");
			((ChannelExec) channel).setCommand(command);
			OutputStream out = channel.getOutputStream();
			InputStream in = channel.getInputStream();
			channel.connect(this.connectionTimeout);

			byte[] buf = new byte[4096];

			// Send null
			buf[0] = 0;
			out.write(buf, 0, 1);
			out.flush();

			if (this.scpCheckAck(in) != 'C') {
				throw new IOException("SCP error, no file to download");
			}

			// Read (and ignore) file permissions
			in.read(buf, 0, 5);

			long fileSize = 0L;
			while (true) {
				if (in.read(buf, 0, 1) < 0 || buf[0] == ' ') {
					break;
				}
				fileSize = fileSize * 10L + (long)(buf[0] - '0');
			}
			taskLogger.debug(String.format("File size: %d bytes", fileSize));

			String retFileName = null;
			int i = 0;
			while (true) {
				if (in.read(buf, i, 1) < 0) {
					throw new IOException("Can't receive the file name");
				}
				if (buf[i] == (byte)0x0a) {
					retFileName = new String(buf, 0, i);
					break;
				}
				i += 1;
			}

			taskLogger.debug(String.format("Name: '%s'", retFileName));

			// Send null
			buf[0] = 0;
			out.write(buf, 0, 1);
			out.flush();

			while (true) {
				int len = in.read(buf, 0, Math.min(buf.length, (int)fileSize));
				if (len < 0) {
					throw new IOException("SCP read error");
				}
				targetStream.write(buf, 0, len);
				fileSize -= len;
				if (fileSize == 0L) {
					break;
				}
			}
		}
		catch (JSchException error) {
			throw new IOException("SCP exception", error);
		}
		finally {
			try {
				channel.disconnect();
			}
			catch (Exception e1) {
				// Ignore
			}
		}
	}

	/**
	 * Download a file using SFTP.
	 * @param remoteFileName The file to download (name with full path) from the device
	 * @param localFileName  The local file name (name with full path) where to write
	 * @param newSession True to download through a new SSH session
	 */
	public void sftpDownload(String remoteFileName, String localFileName, boolean newSession) throws IOException {
		if (newSession) {
			Ssh newSsh = new Ssh(this);
			try {
				newSsh.connect(false);
				newSsh.sftpDownload(remoteFileName, localFileName, false);
			}
			finally {
				newSsh.disconnect();
			}
			return;
		}
		if (localFileName == null) {
			throw new FileNotFoundException("Invalid destination file name for SFTP copy operation. "
				+ "Have you defined 'netshot.snapshots.binary.path'?");
		}
		if (remoteFileName == null) {
			throw new FileNotFoundException("Invalid source file name for SFTP copy operation");
		}
		if (!session.isConnected()) {
			throw new IOException("The SSH session is not connected, can't start the SFTP transfer");
		}
		this.taskLogger.info(String.format("Downloading '%s' to '%s' using SFTP.",
				remoteFileName, localFileName.toString()));

		Channel channel = null;
		try {
			channel = session.openChannel("sftp");
			channel.connect(this.connectionTimeout);
			ChannelSftp sftpChannel = (ChannelSftp) channel;
			sftpChannel.get(remoteFileName, localFileName);
		}
		catch (JSchException error) {
			throw new IOException("SSH error: " + error.getMessage(), error);
		}
		catch (SftpException error) {
			throw new IOException("SFTP error: " + error.getCause().getMessage(), error);
		}
		finally {
			try {
				channel.disconnect();
			}
			catch (Exception e1) {
				// This is life
			}
		}
	}

	public SshConfig getSshConfig() {
		return sshConfig;
	}

	public void setSshConfig(SshConfig sshConfig) {
		this.sshConfig = sshConfig;
	}
	
}
