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

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.time.Duration;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

import org.apache.sshd.client.ClientBuilder;
import org.apache.sshd.client.SshClient;
import org.apache.sshd.client.channel.ChannelShell;
import org.apache.sshd.client.channel.ClientChannelEvent;
import org.apache.sshd.client.config.hosts.HostConfigEntryResolver;
import org.apache.sshd.client.config.keys.ClientIdentityLoader;
import org.apache.sshd.client.keyverifier.AcceptAllServerKeyVerifier;
import org.apache.sshd.client.session.ClientSession;
import org.apache.sshd.common.NamedFactory;
import org.apache.sshd.common.NamedResource;
import org.apache.sshd.common.channel.PtyChannelConfigurationHolder;
import org.apache.sshd.common.channel.PtyMode;
import org.apache.sshd.common.cipher.BuiltinCiphers;
import org.apache.sshd.common.compression.BuiltinCompressions;
import org.apache.sshd.common.config.keys.FilePasswordProvider;
import org.apache.sshd.common.config.keys.KeyUtils;
import org.apache.sshd.common.config.keys.loader.KeyPairResourceLoader;
import org.apache.sshd.common.kex.BuiltinDHFactories;
import org.apache.sshd.common.keyprovider.KeyIdentityProvider;
import org.apache.sshd.common.keyprovider.KeyPairProvider;
import org.apache.sshd.common.mac.BuiltinMacs;
import org.apache.sshd.common.util.io.IoUtils;
import org.apache.sshd.common.util.security.SecurityUtils;
import org.apache.sshd.core.CoreModuleProperties;
import org.apache.sshd.scp.client.ScpClient;
import org.apache.sshd.scp.client.ScpClientCreator;
import org.apache.sshd.sftp.client.SftpClient;
import org.apache.sshd.sftp.client.SftpClientFactory;

import net.netshot.netshot.Netshot;
import net.netshot.netshot.device.NetworkAddress;
import net.netshot.netshot.work.TaskLogger;

import lombok.extern.slf4j.Slf4j;

/**
 * An SSH CLI access.
 */
@Slf4j
public class Ssh extends Cli {

	/** Default SSH TCP port */
	static final public int DEFAULT_PORT = 22;

	static private SshClient client = null;

	/**
	 * Embedded class to represent SSH-specific configuration.
	 */
	public static class SshConfig {

		static private String[] DEFAULT_SSH_KEX_ALGORITHMS = {
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP18_SHA512,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP16_SHA512,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP14_SHA256,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP14_SHA1,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP_EXCHANGE_SHA256,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP_EXCHANGE_SHA1,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP1_SHA1,
		};
	
		static private String[] DEFAULT_SSH_HOST_KEY_ALGORITHMS = {
			KeyPairProvider.SSH_ED25519,
			KeyUtils.RSA_SHA256_KEY_TYPE_ALIAS,
			KeyUtils.RSA_SHA512_KEY_TYPE_ALIAS,
			KeyPairProvider.SSH_RSA,
			KeyPairProvider.ECDSA_SHA2_NISTP521,
			KeyPairProvider.ECDSA_SHA2_NISTP256,
			KeyPairProvider.SSH_DSS,
		};
	
		static private String[] DEFAULT_SSH_CIPHERS = {
			BuiltinCiphers.Constants.AES256_GCM,
			BuiltinCiphers.Constants.AES128_GCM,
			BuiltinCiphers.Constants.AES256_CTR,
			BuiltinCiphers.Constants.AES256_CBC,
			BuiltinCiphers.Constants.AES192_CTR,
			BuiltinCiphers.Constants.AES192_CBC,
			BuiltinCiphers.Constants.AES128_CTR,
			BuiltinCiphers.Constants.AES128_CBC,
			BuiltinCiphers.Constants.TRIPLE_DES_CBC,
			BuiltinCiphers.Constants.BLOWFISH_CBC,
		};
	
		static private String[] DEFAULT_SSH_MACS = {
			BuiltinMacs.Constants.HMAC_SHA2_256,
			BuiltinMacs.Constants.HMAC_SHA2_512,
			BuiltinMacs.Constants.HMAC_SHA1,
			BuiltinMacs.Constants.HMAC_SHA1_96,
			BuiltinMacs.Constants.HMAC_MD5,
			BuiltinMacs.Constants.HMAC_MD5_96,
			BuiltinMacs.Constants.ETM_HMAC_SHA2_512,
			BuiltinMacs.Constants.ETM_HMAC_SHA2_256,
			BuiltinMacs.Constants.ETM_HMAC_SHA1,
		};
	
		static private String[] DEFAULT_SSH_COMPRESSION_ALGORITHMS = {
			BuiltinCompressions.Constants.NONE,
			BuiltinCompressions.Constants.ZLIB,
		};

		public static void loadConfig() {
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
			sshSetting = Netshot.getConfig("netshot.cli.ssh.compressionalgorithms");
			if (sshSetting != null) {
				DEFAULT_SSH_COMPRESSION_ALGORITHMS = sshSetting.split(", *");
			}
		}

		/** Key exchange algorithms allowed for the session */
		private List<String> kexAlgorithms = Arrays.asList(DEFAULT_SSH_KEX_ALGORITHMS);

		/** Host key algorithms allowed for the session */
		private List<String> hostKeyAlgorithms = Arrays.asList(DEFAULT_SSH_HOST_KEY_ALGORITHMS);

		/** Ciphers allowed for the session */
		private List<String> ciphers = Arrays.asList(DEFAULT_SSH_CIPHERS);

		/** MACs allowed for the session */
		private List<String> macs = Arrays.asList(DEFAULT_SSH_MACS);

		/** Compression algorithms allowed for the session */
		private List<String> compressionAlgorithms = Arrays.asList(DEFAULT_SSH_COMPRESSION_ALGORITHMS);

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
	
		public void setKexAlgorithms(String[] kexAlgorithms) {
			this.kexAlgorithms = Arrays.asList(kexAlgorithms);
		}
	
		public void setHostKeyAlgorithms(String[] hostKeyAlgorithms) {
			this.hostKeyAlgorithms = Arrays.asList(hostKeyAlgorithms);
		}
	
		public void setCiphers(String[] ciphers) {
			this.ciphers = Arrays.asList(ciphers);
		}
	
		public void setMacs(String[] macs) {
			this.macs = Arrays.asList(macs);
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

	/**
	 * Initialize some additional static variables from global configuration.
	 */
	public static void loadConfig() {
		DEFAULT_CONNECTION_TIMEOUT = Netshot.getConfig("netshot.cli.ssh.connectiontimeout", DEFAULT_CONNECTION_TIMEOUT, 1, Integer.MAX_VALUE);
		log.debug("The default connection timeout value for SSH sessions is {}s", DEFAULT_CONNECTION_TIMEOUT);

    DEFAULT_RECEIVE_TIMEOUT = Netshot.getConfig("netshot.cli.ssh.receivetimeout", DEFAULT_RECEIVE_TIMEOUT, 1, Integer.MAX_VALUE);
		log.debug("The default receive timeout value for SSH sessions is {}s", DEFAULT_RECEIVE_TIMEOUT);
		CoreModuleProperties.NIO2_READ_TIMEOUT.set(Ssh.client, Duration.ofMillis(DEFAULT_RECEIVE_TIMEOUT));

		DEFAULT_COMMAND_TIMEOUT = Netshot.getConfig("netshot.cli.ssh.commandtimeout", DEFAULT_COMMAND_TIMEOUT, 1, Integer.MAX_VALUE);
		log.debug("The default command timeout value for SSH sessions is {}s", DEFAULT_COMMAND_TIMEOUT);

		SshConfig.loadConfig();
	}

	static {
		// Build global SSH client
		Ssh.client = SshClient.setUpDefaultClient();
		Ssh.client.setHostConfigEntryResolver(HostConfigEntryResolver.EMPTY);
		Ssh.client.setFilePasswordProvider(FilePasswordProvider.EMPTY);
		Ssh.client.setClientIdentityLoader(ClientIdentityLoader.DEFAULT);
		Ssh.client.setKeyIdentityProvider(KeyIdentityProvider.EMPTY_KEYS_PROVIDER);

		CoreModuleProperties.CLIENT_IDENTIFICATION.set(Ssh.client, "NETSHOT-%s".formatted(Netshot.VERSION));
		// Cisco IOS at least doesn't like receiving the identification message from client before sending its own
		CoreModuleProperties.SEND_IMMEDIATE_IDENTIFICATION.set(Ssh.client, false);
		CoreModuleProperties.SEND_IMMEDIATE_KEXINIT.set(Ssh.client, false);
		// Accept all server keys
		// TODO: implement server key verification and storage per device
		Ssh.client.setServerKeyVerifier(AcceptAllServerKeyVerifier.INSTANCE);
		Ssh.client.start();
	}

	/** The port. */
	private int port = DEFAULT_PORT;

	/** The SSH client session */
	private ClientSession session;

	/** The SSH channel */
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
		this.port = port;
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
		this.port = port;
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
	 * @see net.netshot.netshot.device.access.Cli#connect()
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
		try {
			this.session = Ssh.client
				.connect(this.username, this.host.getIp(), this.port)
				.verify(this.connectionTimeout)
				.getSession();
			this.session.setKeyExchangeFactories(
				NamedFactory.setUpTransformedFactories(true,
					BuiltinDHFactories.parseDHFactoriesList(this.sshConfig.kexAlgorithms).getParsedFactories(),
					ClientBuilder.DH2KEX));
			this.session.setSignatureFactoriesNames(this.sshConfig.hostKeyAlgorithms);
			this.session.setCipherFactoriesNames(this.sshConfig.ciphers);
			this.session.setMacFactoriesNames(this.sshConfig.macs);
			this.session.setCompressionFactoriesNames(this.sshConfig.compressionAlgorithms);
			if (privateKey == null || publicKey == null) {
				this.session.addPasswordIdentity(this.password);
			}
			else {
				KeyPairResourceLoader loader = SecurityUtils.getKeyPairResourceParser();
				FilePasswordProvider passwordProvider = (this.password == null) ? null : FilePasswordProvider.of(password);
				Collection<KeyPair> keys = loader.loadKeyPairs(this.session, NamedResource.ofName("Specific"), passwordProvider, this.privateKey);
				for (KeyPair key : keys) {
					this.session.addPublicKeyIdentity(key);
				}
			}
			this.session.auth().verify(Duration.ofMillis(this.connectionTimeout));
			if (openChannel) {
				PtyChannelConfigurationHolder ptyConfig = null;
				if (this.sshConfig.usePty) {
					ptyConfig = new PtyChannelConfigurationHolder() {
						@Override
						public String getPtyType() {
							return Ssh.this.sshConfig.terminalType;
						}

						@Override
						public int getPtyColumns() {
							return Ssh.this.sshConfig.terminalCols;
						}

						@Override
						public int getPtyLines() {
							return Ssh.this.sshConfig.terminalRows;
						}

						@Override
						public int getPtyWidth() {
							return Ssh.this.sshConfig.terminalWidth;
						}

						@Override
						public int getPtyHeight() {
							return Ssh.this.sshConfig.terminalHeight;
						}

						@Override
						public Map<PtyMode, Integer> getPtyModes() {
							return DEFAULT_PTY_MODES;
						}
					};
				}
				this.channel = this.session.createShellChannel(ptyConfig, Collections.emptyMap());
				this.channel.setRedirectErrorStream(true);
				this.channel.open().verify(Duration.ofMillis(this.connectionTimeout));
				this.inStream = this.channel.getInvertedOut();
				this.outStream = new PrintStream(this.channel.getInvertedIn());
			}
		}
		catch (GeneralSecurityException e) {
			throw new IOException(e);
		}

	}

	/* (non-Javadoc)
	 * @see net.netshot.netshot.device.access.Cli#disconnect()
	 */
	@Override
	public void disconnect() {
		try {
			if (this.channel != null) {
				channel.waitFor(EnumSet.of(ClientChannelEvent.CLOSED), Duration.ofSeconds(3));
				this.channel.close();
				this.channel = null;
			}
			if (this.session != null) {
				this.session.close();
				this.session = null;
			}
		}
		catch (Exception e) {
			log.warn("Error on SSH disconnect.", e);
		}
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
		try (OutputStream localStream = Files.newOutputStream(Paths.get(localFileName))) {
			this.scpDownload(remoteFileName, localStream, newSession);
		}
	}

	/**
	 * Download a file using SCP.
	 * @param remoteFileName The file to download (name with full path) from the device
	 * @param targetStream  Output stream
	 * @param newSession True to download through a new SSH session
	 */
	public void scpDownload(String remoteFileName, OutputStream localStream, boolean newSession) throws IOException {
		if (newSession) {
			Ssh newSsh = new Ssh(this);
			try {
				newSsh.connect(false);
				newSsh.scpDownload(remoteFileName, localStream, false);
			}
			finally {
				newSsh.disconnect();
			}
			return;
		}
		if (remoteFileName == null) {
			throw new FileNotFoundException("Invalid source file name for SCP copy operation");
		}
		if (!session.isOpen()) {
			throw new IOException("The SSH session is not connected, can't start the SCP transfer");
		}
		this.taskLogger.info(String.format("Downloading '%s' using SCP.", remoteFileName));

		ScpClient scpClient = ScpClientCreator.instance().createScpClient(session);
		scpClient.download(remoteFileName, localStream);
	}

	/**
	 * Download a file using SFTP.
	 * @param remoteFileName The file to download (name with full path) from the device
	 * @param localFileName  The local file name (name with full path) where to write
	 * @param newSession True to download through a new SSH session
	 */
	public void sftpDownload(String remoteFileName, String localFileName, boolean newSession) throws IOException {
		if (localFileName == null) {
			throw new FileNotFoundException("Invalid destination file name for SFTP copy operation. "
				+ "Have you defined 'netshot.snapshots.binary.path'?");
		}
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
		if (remoteFileName == null) {
			throw new FileNotFoundException("Invalid source file name for SFTP copy operation");
		}
		if (!session.isOpen()) {
			throw new IOException("The SSH session is not connected, can't start the SFTP transfer");
		}
		this.taskLogger.info(String.format("Downloading '%s' to '%s' using SFTP.",
				remoteFileName, localFileName.toString()));


		try (SftpClient sftpClient = SftpClientFactory.instance().createSftpClient(session)) {
			try (
				InputStream remoteStream = sftpClient.read(remoteFileName);
				OutputStream localStream = Files.newOutputStream(Paths.get(localFileName));
			) {
				IoUtils.copy(remoteStream, localStream);
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
