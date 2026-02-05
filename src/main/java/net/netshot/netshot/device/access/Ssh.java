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
import java.nio.file.Path;
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
import org.apache.sshd.client.auth.pubkey.PublicKeyAuthenticationReporter;
import org.apache.sshd.client.channel.ChannelShell;
import org.apache.sshd.client.channel.ClientChannelEvent;
import org.apache.sshd.client.config.hosts.HostConfigEntryResolver;
import org.apache.sshd.client.config.keys.ClientIdentityLoader;
import org.apache.sshd.client.keyverifier.AcceptAllServerKeyVerifier;
import org.apache.sshd.client.session.ClientSession;
import org.apache.sshd.common.NamedFactory;
import org.apache.sshd.common.NamedResource;
import org.apache.sshd.common.PropertyResolverUtils;
import org.apache.sshd.common.channel.PtyChannelConfigurationHolder;
import org.apache.sshd.common.channel.PtyMode;
import org.apache.sshd.common.cipher.BuiltinCiphers;
import org.apache.sshd.common.compression.BuiltinCompressions;
import org.apache.sshd.common.config.keys.FilePasswordProvider;
import org.apache.sshd.common.config.keys.KeyUtils;
import org.apache.sshd.common.config.keys.loader.KeyPairResourceLoader;
import org.apache.sshd.common.kex.BuiltinDHFactories;
import org.apache.sshd.common.kex.KexProposalOption;
import org.apache.sshd.common.keyprovider.KeyIdentityProvider;
import org.apache.sshd.common.keyprovider.KeyPairProvider;
import org.apache.sshd.common.mac.BuiltinMacs;
import org.apache.sshd.common.session.SessionListener;
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
import net.netshot.netshot.work.TaskContext;

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
			BuiltinMacs.Constants.ETM_HMAC_SHA2_512,
			BuiltinMacs.Constants.ETM_HMAC_SHA2_256,
			BuiltinMacs.Constants.HMAC_SHA2_512,
			BuiltinMacs.Constants.HMAC_SHA2_256,
			BuiltinMacs.Constants.HMAC_SHA1,
			BuiltinMacs.Constants.HMAC_SHA1_96,
			BuiltinMacs.Constants.HMAC_MD5,
			BuiltinMacs.Constants.HMAC_MD5_96,
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

		private String[] readAlgorithms(String configKey, String[] defaultValue) {
			String value = Netshot.getConfig("netshot.cli.ssh.%s".formatted(configKey));
			if (value == null) {
				return defaultValue;
			}
			return value.split(", *");
		}

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

			this.kexAlgorithms = this.readAlgorithms("kexalgorithms", DEFAULT_SSH_KEX_ALGORITHMS);
			this.hostKeyAlgorithms = this.readAlgorithms("hostkeyalgorithms", DEFAULT_SSH_HOST_KEY_ALGORITHMS);
			this.ciphers = this.readAlgorithms("ciphers", DEFAULT_SSH_CIPHERS);
			this.macs = this.readAlgorithms("macs", DEFAULT_SSH_MACS);
			this.compressionAlgorithms = this.readAlgorithms("compressionalgorithms", DEFAULT_SSH_COMPRESSION_ALGORITHMS);
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

		public SshInteractionInstruction(Pattern promptPattern, Boolean echo, String response) {
			this.promptPattern = promptPattern;
			this.echo = echo;
			this.response = response;
		}
	}

	/**
	 * One user interaction in the keyboard-interactive authentication process.
	 */
	public static final class SshUserInteraction {
		/** Prompt to match (regular expression). null for any. */
		@Getter
		@Setter
		private String prompt;

		/** Match whether echo option is expected or not. null for any. */
		@Getter
		@Setter
		private Boolean echo;

		/** Response to send. Can be $$NetshotPassword$$. */
		@Getter
		@Setter
		private String response;
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

		/** User interactions. */
		@Getter
		@Setter
		private List<SshUserInteraction> userInteractions;

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

		public void setCompressionAlgorithms(String[] compressionAlgorithms) {
			this.compressionAlgorithms = Arrays.asList(compressionAlgorithms);
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
	 * @param taskContext the current task context
	 */
	public Ssh(NetworkAddress host, int port, String username, String password, TaskContext taskContext) {
		super(host, taskContext);
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
	 * @param privateKey the RSA/DSA/... private key
	 * @param passphrase the passphrase which protects the private key
	 * @param taskContext the current task context
	 */
	public Ssh(NetworkAddress host, int port, String username, String privateKey,
		String passphrase, TaskContext taskContext) {
		super(host, taskContext);
		this.port = port;
		this.username = username;
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
	 * @param privateKey the RSA/DSA private key
	 * @param passphrase the passphrase which protects the private key
	 * @param taskContext the current task context
	 */
	public Ssh(NetworkAddress host, String username, String privateKey,
		String passphrase, TaskContext taskContext) {
		super(host, taskContext);
		this.username = username;
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
	 * @param taskContext the current task context
	 */
	public Ssh(NetworkAddress host, String username, String password, TaskContext taskContext) {
		super(host, taskContext);
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
		super(other.host, other.taskContext);
		this.port = other.port;
		this.username = other.username;
		this.password = other.password;
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
	 *
	 * @param openChannel Whether to open the channel
	 * @throws IOException in case of I/O error
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
			if (privateKey == null) {
				this.session.addPasswordIdentity(this.password);
				if (Ssh.this.sshConfig.interactionInstructions != null) {
					PropertyResolverUtils.updateProperty(
						this.session, UserInteraction.AUTO_DETECT_PASSWORD_PROMPT, false);
				}
				this.session.setUserInteraction(new UserInteraction() {
					@Override
					public String[] interactive(ClientSession sshSession, String name, String instruction, String lang,
							String[] prompts, boolean[] echos) {
						if (Ssh.this.taskContext.isTracing()) {
							List<String> promptEchoes = new ArrayList<>();
							for (int p = 0; p < Math.min(prompts.length, echos.length); p++) {
								promptEchoes.add("%s (%s)".formatted(prompts[p], echos[p] ? "echo" : "no echo"));
							}
							Ssh.this.taskContext.trace(
								"SSH user interactive authentication, name '{}', instruction '{}', lang '{}', prompts {}",
								name, instruction, lang, String.join(", ", promptEchoes));
						}
						if (Ssh.this.sshConfig.interactionInstructions == null) {
							if (prompts.length == 1 && echos.length == 1 && !echos[0]) {
								Ssh.this.taskContext.debug("Password requested in user interactive mode (prompt '{}')",
									prompts[0]);
								return new String[] { Ssh.this.password };
							}
							Ssh.this.taskContext.error("Multiple prompts returned by device in SSH user interactive "
								+
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
								Ssh.this.taskContext.trace(
									"Found matching instruction for SSH user interaction, prompt '{}'", prompts[p]);
								if (configInstruction.response == null) {
									Ssh.this.taskContext.trace("Will send device password");
									responses.add(Ssh.this.password);
								}
								else {
									String response = configInstruction.response;
									Ssh.this.taskContext.trace("Will send planned response '{}'", response);
									response = response.replaceAll(Pattern.quote(DeviceDriver.PLACEHOLDER_USERNAME),
										Matcher.quoteReplacement(Ssh.this.username));
									response = response.replaceAll(Pattern.quote(DeviceDriver.PLACEHOLDER_PASSWORD),
										Matcher.quoteReplacement(Ssh.this.password));
									responses.add(response);
								}
								break;
							}
							if (responses.size() < p + 1) {
								Ssh.this.taskContext.warn(
									"No driver instruction for SSH user interaction prompt '{}'", prompts[p]);
								responses.add("");
							}
						}
						return responses.toArray(new String[0]);
					}
					@Override
					public String getUpdatedPassword(ClientSession sshSession, String prompt, String lang) {
						Ssh.this.taskContext.warn("SSH password update requested by the device: '{}'", prompt);
						return null;
					}
					@Override
					public void serverVersionInfo(ClientSession sshSession, List<String> lines) {
						Ssh.this.taskContext.debug("SSH version info: {}", String.join("\n", lines));
					}
					@Override
					public void welcome(ClientSession sshSession, String banner, String lang) {
						Ssh.this.taskContext.debug("Welcome banner: {}", banner);
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
				public void signalAuthenticationSuccess(ClientSession sshSession, String service, String givenPassword) throws Exception {
					Ssh.this.taskContext.debug("SSH password authentication succeeded (service {})", service);
				}
				@Override
				public void signalAuthenticationFailure(ClientSession sshSession, String service, String givenPassword,
					boolean partial, List<String> serverMethods) throws Exception {
					Ssh.this.taskContext.warn("SSH password authentication failed (service {})", service);
					throw new InvalidCredentialsException("Invalid SSH password");
				}
			});
			this.session.setPublicKeyAuthenticationReporter(new PublicKeyAuthenticationReporter() {
				public void signalAuthenticationSuccess(ClientSession sshSession, String service, KeyPair identity) throws Exception {
					Ssh.this.taskContext.debug("SSH public key authentication succeeded (service {})", service);
				}
				public void signalAuthenticationFailure(
								ClientSession sshSession, String service, KeyPair identity, boolean partial, List<String> serverMethods)
								throws Exception {
					Ssh.this.taskContext.warn("SSH public key authentication failed (service {})", service);
					throw new InvalidCredentialsException("Invalid SSH public key");
				}
			});

			// Add session listener to trace protocol negotiation details
			this.session.addSessionListener(new SessionListener() {
				@Override
				public void sessionNegotiationEnd(
						org.apache.sshd.common.session.Session sshSession,
						Map<KexProposalOption, String> clientProposal,
						Map<KexProposalOption, String> serverProposal,
						Map<KexProposalOption, String> negotiatedOptions,
						Throwable reason) {
					if (!Ssh.this.taskContext.isTracing()) {
						return;
					}
					if (reason != null) {
						Ssh.this.taskContext.trace("SSH Protocol Negotiation ended with error: {}", reason.getMessage());
					}

					Ssh.this.taskContext.trace("SSH Protocol Negotiation {}:",
						reason == null ? "Results" : "Proposals (Failed)");

					// Log KEX algorithms
					String kexClient = clientProposal.get(KexProposalOption.ALGORITHMS);
					String kexServer = serverProposal.get(KexProposalOption.ALGORITHMS);
					String kexNegotiated = negotiatedOptions.get(KexProposalOption.ALGORITHMS);
					Ssh.this.taskContext.trace("  Key Exchange:");
					Ssh.this.taskContext.trace("    Client proposed: {}", kexClient);
					Ssh.this.taskContext.trace("    Server proposed: {}", kexServer);
					if (kexNegotiated != null) {
						Ssh.this.taskContext.trace("    Negotiated: {}", kexNegotiated);
					}

					// Log Server Host Key algorithms
					String hostKeyClient = clientProposal.get(KexProposalOption.SERVERKEYS);
					String hostKeyServer = serverProposal.get(KexProposalOption.SERVERKEYS);
					String hostKeyNegotiated = negotiatedOptions.get(KexProposalOption.SERVERKEYS);
					Ssh.this.taskContext.trace("  Server Host Key:");
					Ssh.this.taskContext.trace("    Client proposed: {}", hostKeyClient);
					Ssh.this.taskContext.trace("    Server proposed: {}", hostKeyServer);
					if (hostKeyNegotiated != null) {
						Ssh.this.taskContext.trace("    Negotiated: {}", hostKeyNegotiated);
					}

					// Log Cipher algorithms (client-to-server)
					String cipherC2SClient = clientProposal.get(KexProposalOption.C2SENC);
					String cipherC2SServer = serverProposal.get(KexProposalOption.C2SENC);
					String cipherC2SNegotiated = negotiatedOptions.get(KexProposalOption.C2SENC);
					Ssh.this.taskContext.trace("  Cipher (Client-to-Server):");
					Ssh.this.taskContext.trace("    Client proposed: {}", cipherC2SClient);
					Ssh.this.taskContext.trace("    Server proposed: {}", cipherC2SServer);
					if (cipherC2SNegotiated != null) {
						Ssh.this.taskContext.trace("    Negotiated: {}", cipherC2SNegotiated);
					}

					// Log Cipher algorithms (server-to-client)
					String cipherS2CClient = clientProposal.get(KexProposalOption.S2CENC);
					String cipherS2CServer = serverProposal.get(KexProposalOption.S2CENC);
					String cipherS2CNegotiated = negotiatedOptions.get(KexProposalOption.S2CENC);
					Ssh.this.taskContext.trace("  Cipher (Server-to-Client):");
					Ssh.this.taskContext.trace("    Client proposed: {}", cipherS2CClient);
					Ssh.this.taskContext.trace("    Server proposed: {}", cipherS2CServer);
					if (cipherS2CNegotiated != null) {
						Ssh.this.taskContext.trace("    Negotiated: {}", cipherS2CNegotiated);
					}

					// Log MAC algorithms (client-to-server)
					String macC2SClient = clientProposal.get(KexProposalOption.C2SMAC);
					String macC2SServer = serverProposal.get(KexProposalOption.C2SMAC);
					String macC2SNegotiated = negotiatedOptions.get(KexProposalOption.C2SMAC);
					Ssh.this.taskContext.trace("  MAC (Client-to-Server):");
					Ssh.this.taskContext.trace("    Client proposed: {}", macC2SClient);
					Ssh.this.taskContext.trace("    Server proposed: {}", macC2SServer);
					if (macC2SNegotiated != null) {
						Ssh.this.taskContext.trace("    Negotiated: {}", macC2SNegotiated);
					}

					// Log MAC algorithms (server-to-client)
					String macS2CClient = clientProposal.get(KexProposalOption.S2CMAC);
					String macS2CServer = serverProposal.get(KexProposalOption.S2CMAC);
					String macS2CNegotiated = negotiatedOptions.get(KexProposalOption.S2CMAC);
					Ssh.this.taskContext.trace("  MAC (Server-to-Client):");
					Ssh.this.taskContext.trace("    Client proposed: {}", macS2CClient);
					Ssh.this.taskContext.trace("    Server proposed: {}", macS2CServer);
					if (macS2CNegotiated != null) {
						Ssh.this.taskContext.trace("    Negotiated: {}", macS2CNegotiated);
					}

					// Log Compression algorithms (client-to-server)
					String compC2SClient = clientProposal.get(KexProposalOption.C2SCOMP);
					String compC2SServer = serverProposal.get(KexProposalOption.C2SCOMP);
					String compC2SNegotiated = negotiatedOptions.get(KexProposalOption.C2SCOMP);
					Ssh.this.taskContext.trace("  Compression (Client-to-Server):");
					Ssh.this.taskContext.trace("    Client proposed: {}", compC2SClient);
					Ssh.this.taskContext.trace("    Server proposed: {}", compC2SServer);
					if (compC2SNegotiated != null) {
						Ssh.this.taskContext.trace("    Negotiated: {}", compC2SNegotiated);
					}

					// Log Compression algorithms (server-to-client)
					String compS2CClient = clientProposal.get(KexProposalOption.S2CCOMP);
					String compS2CServer = serverProposal.get(KexProposalOption.S2CCOMP);
					String compS2CNegotiated = negotiatedOptions.get(KexProposalOption.S2CCOMP);
					Ssh.this.taskContext.trace("  Compression (Server-to-Client):");
					Ssh.this.taskContext.trace("    Client proposed: {}", compS2CClient);
					Ssh.this.taskContext.trace("    Server proposed: {}", compS2CServer);
					if (compS2CNegotiated != null) {
						Ssh.this.taskContext.trace("    Negotiated: {}", compS2CNegotiated);
					}
				}
			});

			try {
				this.session.auth().verify(Duration.ofMillis(this.connectionTimeout));
			}
			catch (IOException e) {
				throw new InvalidCredentialsException("Authentication error: " + e.getMessage());
			}

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
	 *
	 * @param remoteFileName The file to download (name with full path) from the device
	 * @param localFilePath  The local file path (name with full path) where to write
	 * @param newSession True to download through a new SSH session
	 * @throws IOException in case of I/O error
	 */
	public void scpDownload(String remoteFileName, Path localFilePath, boolean newSession) throws IOException {
		if (localFilePath == null) {
			throw new FileNotFoundException("Invalid destination file name for SCP copy operation. "
				+ "Have you defined 'netshot.snapshots.binary.path'?");
		}
		try (OutputStream localStream = Files.newOutputStream(localFilePath)) {
			this.scpDownload(remoteFileName, localStream, newSession);
		}
	}

	/**
	 * Download a file using SCP.
	 *
	 * @param remoteFileName The file to download (name with full path) from the device
	 * @param localStream  Output stream
	 * @param newSession True to download through a new SSH session
	 * @throws IOException in case of I/O error
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
		this.taskContext.info("Downloading '{}' using SCP.", remoteFileName);

		ScpClient scpClient = ScpClientCreator.instance().createScpClient(session);
		scpClient.download(remoteFileName, localStream);
	}

	/**
	 * Download a file using SFTP.
	 *
	 * @param remoteFileName The file to download (name with full path) from the device
	 * @param localFilePath  The local file path (name with full path) where to write
	 * @param newSession True to download through a new SSH session
	 * @throws IOException in case of I/O error
	 */
	public void sftpDownload(String remoteFileName, Path localFilePath, boolean newSession) throws IOException {
		if (localFilePath == null) {
			throw new FileNotFoundException("Invalid destination file name for SFTP copy operation. "
				+ "Have you defined 'netshot.snapshots.binary.path'?");
		}

		try (OutputStream localStream = Files.newOutputStream(localFilePath)) {
			this.sftpDownload(remoteFileName, localStream, newSession);
		}
	}

	/**
	 * Download a file using SFTP.
	 *
	 * @param remoteFileName The file to download (name with full path) from the device
	 * @param localStream  Output stream
	 * @param newSession True to download through a new SSH session
	 * @throws IOException in case of I/O error
	 */
	public void sftpDownload(String remoteFileName, OutputStream localStream, boolean newSession) throws IOException {
		if (newSession) {
			Ssh newSsh = new Ssh(this);
			try {
				newSsh.connect(false);
				newSsh.sftpDownload(remoteFileName, localStream, false);
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
		this.taskContext.info("Downloading '{}' using SFTP.", remoteFileName);

		try (SftpClient sftpClient = SftpClientFactory.instance().createSftpClient(session)) {
			try (InputStream remoteStream = sftpClient.read(remoteFileName)) {
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
