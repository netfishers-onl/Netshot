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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.sshd.client.ClientBuilder;
import org.apache.sshd.client.SshClient;
import org.apache.sshd.client.auth.keyboard.UserInteraction;
import org.apache.sshd.client.auth.password.PasswordAuthenticationReporter;
import org.apache.sshd.client.channel.ChannelShell;
import org.apache.sshd.client.channel.ClientChannelEvent;
import org.apache.sshd.client.config.hosts.HostConfigEntryResolver;
import org.apache.sshd.client.config.keys.ClientIdentityLoader;
import org.apache.sshd.client.keyverifier.AcceptAllServerKeyVerifier;
import org.apache.sshd.client.session.ClientSession;
import org.apache.sshd.common.NamedFactory;
import org.apache.sshd.common.NamedResource;
import org.apache.sshd.common.PropertyResolver;
import org.apache.sshd.common.PropertyResolverUtils;
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

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.Netshot;
import net.netshot.netshot.device.DeviceDriver;
import net.netshot.netshot.device.NetworkAddress;
import net.netshot.netshot.work.TaskLogger;

/**
 * An SSH CLI access.
 */
@Slf4j
public class Ssh extends Cli {

	/** Default SSH TCP port. */
	public static final int DEFAULT_PORT = 22;

	/**
	 * Settings/config for the current class.
	 */
	public static final class Settings {

		private static final String[] DEFAULT_SSH_KEX_ALGORITHMS = {
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP18_SHA512,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP16_SHA512,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP14_SHA256,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP14_SHA1,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP_EXCHANGE_SHA256,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP_EXCHANGE_SHA1,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP1_SHA1,
		};

		private static final String[] DEFAULT_SSH_HOST_KEY_ALGORITHMS = {
			KeyPairProvider.SSH_ED25519,
			KeyPairProvider.ECDSA_SHA2_NISTP521,
			KeyPairProvider.ECDSA_SHA2_NISTP256,
			KeyUtils.RSA_SHA256_KEY_TYPE_ALIAS,
			KeyUtils.RSA_SHA512_KEY_TYPE_ALIAS,
			KeyPairProvider.SSH_RSA,
			KeyPairProvider.SSH_DSS,
		};

		private static final String[] DEFAULT_SSH_CIPHERS = {
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

		private static final String[] DEFAULT_SSH_MACS = {
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

		private static final String[] DEFAULT_SSH_COMPRESSION_ALGORITHMS = {
			BuiltinCompressions.Constants.NONE,
			BuiltinCompressions.Constants.ZLIB,
		};

		/** SSH connection timeout. */
		@Getter
		private int connectionTimeout;

		/** SSH receive timeout. */
		@Getter
		private int receiveTimeout;

		/** SSH command timeout. */
		@Getter
		private int commandTimeout;

		/** Key exchange algorithms. */
		@Getter
		private String[] kexAlgorithms;

		/** Host key algorithms. */
		@Getter
		private String[] hostKeyAlgorithms;

		/** Ciphers. */
		@Getter
		private String[] ciphers;

		/** MACs. */
		@Getter
		private String[] macs;

		/** Compression algorithms. */
		@Getter
		private String[] compressionAlgorithms;

		/**
		 * Load settings from config.
		 */
		private void load() {
			this.connectionTimeout = Netshot.getConfig("netshot.cli.ssh.connectiontimeout", 5000, 1, Integer.MAX_VALUE);
			log.debug("The default connection timeout value for SSH sessions is {}s", this.connectionTimeout);

			this.receiveTimeout = Netshot.getConfig("netshot.cli.ssh.receivetimeout", 60000, 1, Integer.MAX_VALUE);
			log.debug("The default receive timeout value for SSH sessions is {}s", this.receiveTimeout);

			this.commandTimeout = Netshot.getConfig("netshot.cli.ssh.commandtimeout", 120000, 1, Integer.MAX_VALUE);
			log.debug("The default command timeout value for SSH sessions is {}s", this.commandTimeout);

			String sshSetting;
			sshSetting = Netshot.getConfig("netshot.cli.ssh.kexalgorithms");
			this.kexAlgorithms = (sshSetting == null) ? DEFAULT_SSH_KEX_ALGORITHMS : sshSetting.split(", *");
			sshSetting = Netshot.getConfig("netshot.cli.ssh.hostkeyalgorithms");
			this.hostKeyAlgorithms = (sshSetting == null) ? DEFAULT_SSH_HOST_KEY_ALGORITHMS : sshSetting.split(", *");
			sshSetting = Netshot.getConfig("netshot.cli.ssh.ciphers");
			this.ciphers = (sshSetting == null) ? DEFAULT_SSH_CIPHERS : sshSetting.split(", *");
			sshSetting = Netshot.getConfig("netshot.cli.ssh.macs");
			this.macs = (sshSetting == null) ? DEFAULT_SSH_MACS : sshSetting.split(", *");
			sshSetting = Netshot.getConfig("netshot.cli.ssh.compressionalgorithms");
			this.compressionAlgorithms = (sshSetting == null) ? DEFAULT_SSH_COMPRESSION_ALGORITHMS : sshSetting.split(", *");
		}
	}

	private static SshClient client;


	/**
	 * Instruction for SSH user interactive authentication mode.
	 */
	@XmlRootElement()
	@XmlAccessorType(XmlAccessType.NONE)
	public static final class SshInteractionInstruction {
		@Getter
		private Pattern promptPattern;

		@Getter
		private Boolean echo;

		@Getter
		private String response;

		public SshInteractionInstruction(Pattern promptPattern, Boolean echo, String result) {
			this.promptPattern = promptPattern;
			this.echo = echo;
			this.response = result;
		}
	}

	/**
	 * Embedded class to represent SSH-specific configuration.
	 */
	@XmlRootElement()
	@XmlAccessorType(XmlAccessType.NONE)
	public static final class SshConfig {

		/** Key exchange algorithms allowed for the session. */
		private List<String> kexAlgorithms = null;

		/** Host key algorithms allowed for the session. */
		private List<String> hostKeyAlgorithms = null;

		/** Ciphers allowed for the session. */
		private List<String> ciphers = null;

		/** MACs allowed for the session. */
		private List<String> macs = null;

		/** Compression algorithms allowed for the session. */
		private List<String> compressionAlgorithms = null;

		/** User interaction instructions. */
		@Setter
		@Getter
		private List<SshInteractionInstruction> interactionInstructions = null;

		/** Whether to allocate a PTY or not. */
		@Setter
		private Boolean usePty = null;

		/** Type of terminal. */
		@Setter
		private String terminalType = null;

		/** Number of columns in the terminal. */
		@Setter
		private Integer terminalCols = null;

		/** Number of rows in the terminal. */
		@Setter
		private Integer terminalRows = null;

		/** Height of the terminal. */
		@Setter
		private Integer terminalHeight = null;

		/** Width of the terminal. */
		@Setter
		private Integer terminalWidth = null;

		/*
		 * Default constructor.
		 */
		public SshConfig(boolean withDefaults) {
			if (withDefaults) {
				this.kexAlgorithms = Arrays.asList(Ssh.SETTINGS.getKexAlgorithms());
				this.hostKeyAlgorithms = Arrays.asList(Ssh.SETTINGS.getHostKeyAlgorithms());
				this.ciphers = Arrays.asList(Ssh.SETTINGS.getCiphers());
				this.macs = Arrays.asList(Ssh.SETTINGS.getMacs());
				this.compressionAlgorithms = Arrays.asList(Ssh.SETTINGS.getCompressionAlgorithms());
				this.usePty = true;
				this.terminalType = "vt100";
				this.terminalCols = 80;
				this.terminalRows = 24;
				this.terminalHeight = 480;
				this.terminalWidth = 640;
			}
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
	}

	/** Settings for this class. */
	public static final Settings SETTINGS = new Settings();

	/**
	 * Initialize some additional static variables from global configuration.
	 */
	public static void loadConfig() {
		Ssh.SETTINGS.load();
		CoreModuleProperties.NIO2_READ_TIMEOUT.set(Ssh.client, Duration.ofMillis(Ssh.SETTINGS.receiveTimeout));
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

	/** The SSH client session. */
	private ClientSession session;

	/** The SSH channel. */
	private ChannelShell channel;

	/** The username. */
	private String username;

	/** The password or passphrase. */
	private String password;

	/** The public key. */
	private String publicKey;

	/** The private key. */
	private String privateKey;

	/** The SSH connection config. */
	private SshConfig sshConfig = new SshConfig(true);

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
		this.connectionTimeout = Ssh.SETTINGS.getConnectionTimeout();
		this.commandTimeout = Ssh.SETTINGS.getCommandTimeout();
		this.receiveTimeout = Ssh.SETTINGS.getReceiveTimeout();
	}

	/**
	 * Instantiates a new SSH connection (private key authentication).
	 *
	 * @param host the host
	 * @param port the port
	 * @param username the SSH username
	 * @param publicKey The public key
	 * @param privateKey the RSA/DSA/... private key
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
		this.connectionTimeout = Ssh.SETTINGS.getConnectionTimeout();
		this.commandTimeout = Ssh.SETTINGS.getCommandTimeout();
		this.receiveTimeout = Ssh.SETTINGS.getReceiveTimeout();
	}

	/**
	 * Instantiates a new SSH connection (private key authentication).
	 *
	 * @param host the host
	 * @param username the SSH username
	 * @param publicKey the public key
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
		this.connectionTimeout = Ssh.SETTINGS.getConnectionTimeout();
		this.commandTimeout = Ssh.SETTINGS.getCommandTimeout();
		this.receiveTimeout = Ssh.SETTINGS.getReceiveTimeout();
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
		this.connectionTimeout = Ssh.SETTINGS.getConnectionTimeout();
		this.commandTimeout = Ssh.SETTINGS.getCommandTimeout();
		this.receiveTimeout = Ssh.SETTINGS.getReceiveTimeout();
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

	/*(non-Javadoc)
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
				if (Ssh.this.sshConfig.interactionInstructions != null) {
					PropertyResolverUtils.updateProperty(
						this.session, UserInteraction.AUTO_DETECT_PASSWORD_PROMPT, false);
				}
				this.session.setUserInteraction(new UserInteraction() {
					@Override
					public String[] interactive(ClientSession session, String name, String instruction, String lang,
							String[] prompts, boolean[] echos) {
						if (Ssh.this.taskLogger.isTracing()) {
							List<String> promptEchoes = new ArrayList<>();
							for (int p = 0; p < Math.min(prompts.length, echos.length); p++) {
								promptEchoes.add("%s (%s)".formatted(prompts[p], echos[p] ? "echo" : "no echo"));
							}
							Ssh.this.taskLogger.trace(
								"SSH user interactive authentication, name '{}', instruction '{}', lang '{}', prompts {}",
								name, instruction, lang, String.join(", ", promptEchoes));
						}
						if (Ssh.this.sshConfig.interactionInstructions == null) {
							if (prompts.length == 1 && echos.length == 1 && !echos[0]) {
								Ssh.this.taskLogger.debug("Password requested in user interactive mode (prompt '{}')",
									prompts[0]);
								return new String[] { Ssh.this.password };
							}
							Ssh.this.taskLogger.error("Multiple prompts returned by device in SSH user interactive " +
								"mode while the driver doesn't provide user interaction instructions.");
							throw new RuntimeException("Cannot reply to multiple SSH user interaction prompts");
						}
						List<String> responses = new ArrayList<>();
						for (int p = 0; p < Math.min(prompts.length, echos.length); p++) {
							for (SshInteractionInstruction configInstruction : Ssh.this.sshConfig.interactionInstructions) {
								if (configInstruction.promptPattern != null) {
									Matcher matcher = configInstruction.promptPattern.matcher(prompts[p]);
									if (!matcher.matches()) {
										continue;
									}
								}
								if (configInstruction.echo != null && !configInstruction.echo.equals(echos[p])) {
									continue;
								}
								Ssh.this.taskLogger.trace(
									"Found matching instruction for SSH user interaction, prompt '{}'", prompts[p]);
								if (configInstruction.response == null) {
									Ssh.this.taskLogger.trace("Will send device password");
									responses.add(Ssh.this.password);
								}
								else {
									String response = configInstruction.response;
									Ssh.this.taskLogger.trace("Will send planned response '{}'", response);
									response = response.replaceAll(Pattern.quote(DeviceDriver.PLACEHOLDER_USERNAME),
										Matcher.quoteReplacement(Ssh.this.username));
									response = response.replaceAll(Pattern.quote(DeviceDriver.PLACEHOLDER_PASSWORD),
										Matcher.quoteReplacement(Ssh.this.password));
									responses.add(response);
								}
								break;
							}
							if (responses.size() < p + 1) {
								Ssh.this.taskLogger.warn(
									"No driver instruction for SSH user interaction prompt '{}'", prompts[p]);
								responses.add("");
							}
						}
						return responses.toArray(new String[0]);
					}
					@Override
					public String getUpdatedPassword(ClientSession session, String prompt, String lang) {
						Ssh.this.taskLogger.warn("SSH password update requested by the device: '{}'", prompt);
						return null;
					}
				});
			}
			else {
				KeyPairResourceLoader loader = SecurityUtils.getKeyPairResourceParser();
				FilePasswordProvider passwordProvider = this.password == null ? null : FilePasswordProvider.of(password);
				Collection<KeyPair> keys = loader.loadKeyPairs(this.session, NamedResource.ofName("Specific"), passwordProvider, this.privateKey);
				for (KeyPair key : keys) {
					this.session.addPublicKeyIdentity(key);
				}
			}
			this.session.setPasswordAuthenticationReporter(new PasswordAuthenticationReporter() {
				@Override
				public void signalAuthenticationSuccess(ClientSession session, String service, String password) throws Exception {
					Ssh.this.taskLogger.debug("SSH authentication succeeded (service {})", service);
				}
				@Override
				public void signalAuthenticationFailure(ClientSession session, String service, String password,
					boolean partial, List<String> serverMethods) throws Exception {
					Ssh.this.taskLogger.warn("SSH authentication failed (service {})", service);
				}
			});
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
				this.channel.setUsePty(this.sshConfig.usePty);
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

	/*(non-Javadoc)
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
	 * @param localStream  Output stream
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
		this.taskLogger.info("Downloading '{}' using SCP.", remoteFileName);

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
		this.taskLogger.info("Downloading '{}' to '{}' using SFTP.",
			remoteFileName, localFileName.toString());


		try (SftpClient sftpClient = SftpClientFactory.instance().createSftpClient(session)) {
			try (
				InputStream remoteStream = sftpClient.read(remoteFileName);
				OutputStream localStream = Files.newOutputStream(Paths.get(localFileName));
			) {
				IoUtils.copy(remoteStream, localStream);
			}
		}
	}

	public void applySshConfig(SshConfig other) {
		if (other.kexAlgorithms != null) {
			this.sshConfig.kexAlgorithms = other.kexAlgorithms;
		}
		if (other.hostKeyAlgorithms != null) {
			this.sshConfig.hostKeyAlgorithms = other.hostKeyAlgorithms;
		}
		if (other.ciphers != null) {
			this.sshConfig.ciphers = other.ciphers;
		}
		if (other.macs != null) {
			this.sshConfig.macs = other.macs;
		}
		if (other.compressionAlgorithms != null) {
			this.sshConfig.compressionAlgorithms = other.compressionAlgorithms;
		}
		if (other.usePty != null) {
			this.sshConfig.usePty = other.usePty;
		}
		if (other.terminalType != null) {
			this.sshConfig.terminalType = other.terminalType;
		}
		if (other.terminalCols != null) {
			this.sshConfig.terminalCols = other.terminalCols;
		}
		if (other.terminalRows != null) {
			this.sshConfig.terminalRows = other.terminalRows;
		}
		if (other.terminalHeight != null) {
			this.sshConfig.terminalHeight = other.terminalHeight;
		}
		if (other.terminalWidth != null) {
			this.sshConfig.terminalWidth = other.terminalWidth;
		}
		if (other.interactionInstructions != null) {
			this.sshConfig.interactionInstructions = other.interactionInstructions;
		}
	}

}
