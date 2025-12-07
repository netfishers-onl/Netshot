package net.netshot.netshot.device.collector;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.nio.channels.Channel;
import java.nio.channels.FileLock;
import java.nio.channels.SeekableByteChannel;
import java.nio.file.CopyOption;
import java.nio.file.DirectoryStream;
import java.nio.file.FileSystem;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.LinkOption;
import java.nio.file.OpenOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.AclEntry;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.FileAttribute;
import java.nio.file.attribute.GroupPrincipal;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.UserPrincipal;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.Principal;
import java.security.PublicKey;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.Set;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.sshd.common.AttributeRepository.AttributeKey;
import org.apache.sshd.common.NamedFactory;
import org.apache.sshd.common.cipher.BuiltinCiphers;
import org.apache.sshd.common.cipher.ECCurves;
import org.apache.sshd.common.compression.BuiltinCompressions;
import org.apache.sshd.common.config.keys.BuiltinIdentities;
import org.apache.sshd.common.config.keys.KeyUtils;
import org.apache.sshd.common.file.FileSystemFactory;
import org.apache.sshd.common.file.root.RootedFileSystemProvider;
import org.apache.sshd.common.kex.BuiltinDHFactories;
import org.apache.sshd.common.keyprovider.KeyPairProvider;
import org.apache.sshd.common.mac.BuiltinMacs;
import org.apache.sshd.common.session.Session;
import org.apache.sshd.common.session.SessionContext;
import org.apache.sshd.common.session.SessionListener;
import org.apache.sshd.common.util.buffer.Buffer;
import org.apache.sshd.core.CoreModuleProperties;
import org.apache.sshd.scp.common.ScpFileOpener;
import org.apache.sshd.scp.common.ScpSourceStreamResolver;
import org.apache.sshd.scp.common.ScpTargetStreamResolver;
import org.apache.sshd.scp.common.helpers.LocalFileScpTargetStreamResolver;
import org.apache.sshd.scp.common.helpers.ScpTimestampCommandDetails;
import org.apache.sshd.scp.server.ScpCommandFactory;
import org.apache.sshd.server.ServerBuilder;
import org.apache.sshd.server.auth.AsyncAuthException;
import org.apache.sshd.server.auth.keyboard.InteractiveChallenge;
import org.apache.sshd.server.auth.keyboard.KeyboardInteractiveAuthenticator;
import org.apache.sshd.server.auth.password.PasswordAuthenticator;
import org.apache.sshd.server.auth.password.PasswordChangeRequiredException;
import org.apache.sshd.server.forward.RejectAllForwardingFilter;
import org.apache.sshd.server.keyprovider.SimpleGeneratorHostKeyProvider;
import org.apache.sshd.server.session.ServerSession;
import org.apache.sshd.sftp.server.DirectoryHandle;
import org.apache.sshd.sftp.server.FileHandle;
import org.apache.sshd.sftp.server.SftpFileSystemAccessor;
import org.apache.sshd.sftp.server.SftpSubsystemFactory;
import org.apache.sshd.sftp.server.SftpSubsystemProxy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.Netshot;
import net.netshot.netshot.device.NetworkAddress;
import net.netshot.netshot.device.collector.UploadTicket.Owner;

/**
 * SSH server to receive files via SFTP/SCP.
 */
@Slf4j
public final class SshServer {

	/** The AAA logger. */
	private static final Logger AAA_LOG = LoggerFactory.getLogger("AAA");

	/**
	 * Settings/config for the current class.
	 */
	public static final class Settings {

		private static final int DEFAULT_SSH_SERVER_PORT = 2022;

		private static final String[] DEFAULT_SSH_KEX_ALGORITHMS = {
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP18_SHA512,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP16_SHA512,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP14_SHA256,
			BuiltinDHFactories.Constants.DIFFIE_HELLMAN_GROUP_EXCHANGE_SHA256,
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
			BuiltinCiphers.Constants.CC20P1305_OPENSSH,
			BuiltinCiphers.Constants.AES256_GCM,
			BuiltinCiphers.Constants.AES128_GCM,
			BuiltinCiphers.Constants.AES256_CTR,
			BuiltinCiphers.Constants.AES256_CBC,
			BuiltinCiphers.Constants.AES192_CTR,
			BuiltinCiphers.Constants.AES192_CBC,
			BuiltinCiphers.Constants.AES128_CTR,
			BuiltinCiphers.Constants.AES128_CBC,
		};

		private static final String[] DEFAULT_SSH_MACS = {
			BuiltinMacs.Constants.ETM_HMAC_SHA2_512,
			BuiltinMacs.Constants.ETM_HMAC_SHA2_256,
			BuiltinMacs.Constants.HMAC_SHA2_256,
			BuiltinMacs.Constants.HMAC_SHA2_512,
		};

		private static final String[] DEFAULT_SSH_COMPRESSION_ALGORITHMS = {
			BuiltinCompressions.Constants.NONE,
			BuiltinCompressions.Constants.ZLIB,
		};

		/** Whether the SSH (SFTP/SCP) server is enabled. */
		@Getter
		private boolean enabled;

		/** Enabled transfer protocols. */
		@Getter
		private List<TransferProtocol> enabledProtocols;

		/** Listening TCP port. */
		@Getter
		private int tcpPort;

		/** The listen address (e.g. 0.0.0.0 or 127.0.0.1) */
		@Getter
		private InetAddress listenHost;
	
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

		/** Path to store host keys. */
		@Getter
		private Path hostKeyPath;

		/** Max concurrent SSH sessions. */
		@Getter
		private int maxConcurrentSessions;

		private String[] readAlgorithms(String configKey, String[] defaultValue) {
			String value = Netshot.getConfig("netshot.sshserver.%s".formatted(configKey));
			if (value == null) {
				return defaultValue;
			}
			return value.split(", *");
		}

		/**
		 * Load settings from config.
		 */
		private void load() {
			this.enabled = Netshot.getConfig("netshot.sshserver.enabled", true);

			this.enabledProtocols = new ArrayList<>();
			if (Netshot.getConfig("netshot.sshserver.sftp.enabled", true)) {
				this.enabledProtocols.add(TransferProtocol.SFTP);
			}
			if (Netshot.getConfig("netshot.sshserver.scp.enabled", true)) {
				this.enabledProtocols.add(TransferProtocol.SCP);
			}

			this.tcpPort = Netshot.getConfig("netshot.sshserver.port", DEFAULT_SSH_SERVER_PORT, 1, 65535);
			String listenAddress = Netshot.getConfig("netshot.sshserver.listenaddress", "0.0.0.0");
			try {
				this.listenHost = InetAddress.getByName(listenAddress);
			}
			catch (UnknownHostException e) {
				log.warn("Unable to parse IP address '{}' for SSH server listen address, using loopback instead",
					listenAddress, e);
				this.listenHost = InetAddress.getLoopbackAddress();
			}

			// Load host key path configuration
			String hostKeyPathString = Netshot.getConfig("netshot.sshserver.hostkeypath");
			if (hostKeyPathString == null) {
				// No configuration set, use system temp directory and warn
				hostKeyPathString = System.getProperty("java.io.tmpdir");
				this.hostKeyPath = Paths.get(hostKeyPathString);
				if (this.enabled) {
					log.warn("Embedded SSH server host keys will be stored in system temp directory: {}. " +
						"Set netshot.sshserver.hostkeypath configuration to a persistent location to avoid " +
						"host key regeneration.", this.hostKeyPath);
				}
			}
			else {
				this.hostKeyPath = Paths.get(hostKeyPathString);
				log.info("SSH server host keys will be stored in: {}", this.hostKeyPath);
			}

			this.kexAlgorithms = this.readAlgorithms("kexalgorithms", DEFAULT_SSH_KEX_ALGORITHMS);
			this.hostKeyAlgorithms = this.readAlgorithms("hostkeyalgorithms", DEFAULT_SSH_HOST_KEY_ALGORITHMS);
			this.ciphers = this.readAlgorithms("ciphers", DEFAULT_SSH_CIPHERS);
			this.macs = this.readAlgorithms("macs", DEFAULT_SSH_MACS);
			this.compressionAlgorithms = this.readAlgorithms("compressionalgorithms", DEFAULT_SSH_COMPRESSION_ALGORITHMS);

			this.maxConcurrentSessions = Netshot.getConfig("netshot.sshserver.maxconcurrentsessions", 10, 1, 1000);
		}

		public boolean isProtocolEnabled(TransferProtocol protocol) {
			return this.enabledProtocols.contains(protocol);
		}
	}

	/** Upload Ticket attribute to be attached to SSH sessions. */
	public static final AttributeKey<UploadTicket> UPLOAD_TICKET = new AttributeKey<>();

	/** Settings for this class. */
	public static final Settings SETTINGS = new Settings();

	public static void init() {
		SshServer.SETTINGS.load();
		if (!SshServer.SETTINGS.enabled) {
			log.warn("The SSH server is disabled by configuration.");
			return;
		}
		nsSshServer = new SshServer();
		nsSshServer.start();
	}

	/** The static SNMP trap receiver instance. */
	private static SshServer nsSshServer;

	public static boolean isRunning() {
		return nsSshServer != null;
	}

	public static boolean isRunning(TransferProtocol protocol) {
		return nsSshServer != null && SETTINGS.isProtocolEnabled(protocol);
	}

	public static SshServer getServer() {
		return nsSshServer;
	}

	/**
	 * Session listener to track session lifecycle and trigger ticket callbacks.
	 */
	private class DeviceSessionListener implements SessionListener {
		@Override
		public void sessionClosed(Session session) {
			UploadTicket ticket = session.getAttribute(UPLOAD_TICKET);
			if (ticket != null) {
				log.debug("Session closed for ticket {}", ticket.getUsername());
				ticket.onSessionStopped();
			}
		}
	}

	/**
	 * Authenticator to be called when a device tries to authenticate in keyboard interactive mode.
	 */
	private class DeviceKeyboardInteractiveAuthenticator implements KeyboardInteractiveAuthenticator {

		@Override
		public InteractiveChallenge generateChallenge(ServerSession session, String username, String lang,
				String subMethods) throws Exception {
			InteractiveChallenge challenge = new InteractiveChallenge();
			challenge.addPrompt("Password: ", false);
			return challenge;
		}

		@Override
		public boolean authenticate(ServerSession session, String username, List<String> responses) throws Exception {
			if (responses.size() != 1) {
				log.warn("Error in embedded SSH server while authenticating incoming request: response size is not 1");
				return false;
			}
			final String password = responses.get(0);
			return SshServer.this.authenticate(session, username, password);
		}

	}

	/**
	 * Authenticator to be called when a device tries to authenticate with a password.
	 */
	private class DevicePasswordAuthenticator implements PasswordAuthenticator {

		@Override
		public boolean authenticate(String username, String password, ServerSession session)
				throws PasswordChangeRequiredException, AsyncAuthException {
			return SshServer.this.authenticate(session, username, password);
		}
		
	}

	/**
	 * File opener to be called when a device tries to send or receive a file via SCP.
	 */
	private class DeviceScpFileOpener implements ScpFileOpener {

		/** Common error message for all download attempts. */
		private static final String FORBIDDEN_MESSAGE =
			"Forbidden. This server only accepts simple incoming configuration files.";

		/**
		 * Log a forbidden access attempt and throw an IOException.
		 * @param session the SSH session
		 * @param operation the operation that was attempted
		 * @throws IOException always thrown with FORBIDDEN_MESSAGE
		 */
		private void throwForbiddenException(Session session, String operation) throws IOException {
			log.warn("Forbidden SCP operation '{}' attempted in session {}", operation, session);
			throw new IOException(DeviceScpFileOpener.FORBIDDEN_MESSAGE);
		}

		@Override
		public Path resolveIncomingFilePath(Session session, Path localPath, String name, boolean preserve,
				Set<PosixFilePermission> permissions, ScpTimestampCommandDetails time) throws IOException {
			throwForbiddenException(session, "resolveIncomingFilePath");
			return null; // Unreachable
		}

		@Override
		public Iterable<Path> getMatchingFilesToSend(Session session, Path basedir, String pattern) throws IOException {
			throwForbiddenException(session, "getMatchingFilesToSend");
			return null; // Unreachable
		}

		@Override
		public boolean sendAsRegularFile(Session session, Path path, LinkOption... options) throws IOException {
			throwForbiddenException(session, "sendAsRegularFile");
			return false; // Unreachable
		}

		@Override
		public boolean sendAsDirectory(Session session, Path path, LinkOption... options) throws IOException {
			throwForbiddenException(session, "sendAsDirectory");
			return false; // Unreachable
		}

		@Override
		public DirectoryStream<Path> getLocalFolderChildren(Session session, Path path) throws IOException {
			throwForbiddenException(session, "getLocalFolderChildren");
			return null; // Unreachable
		}

		@Override
		public BasicFileAttributes getLocalBasicFileAttributes(Session session, Path path, LinkOption... options)
				throws IOException {
			throwForbiddenException(session, "getLocalBasicFileAttributes");
			return null; // Unreachable
		}

		@Override
		public Set<PosixFilePermission> getLocalFilePermissions(Session session, Path path, LinkOption... options)
				throws IOException {
			throwForbiddenException(session, "getLocalFilePermissions");
			return null; // Unreachable
		}

		// @Override
		// public Path resolveLocalPath(Session session, FileSystem fileSystem, String commandPath)
		// 		throws IOException, InvalidPathException {
		// 	UploadTicket ticket = session.getAttribute(UPLOAD_TICKET);
		// 	return ticket.getTargetFilePath();
		// }

		@Override
		public Path resolveIncomingReceiveLocation(Session session, Path path, boolean recursive, boolean shouldBeDir,
				boolean preserve) throws IOException {
			throwForbiddenException(session, "resolveIncomingReceiveLocation");
			return null; // Unreachable
		}

		@Override
		public Path resolveOutgoingFilePath(Session session, Path localPath, LinkOption... options) throws IOException {
			throwForbiddenException(session, "resolveOutgoingFilePath");
			return null; // Unreachable
		}

		@Override
		public InputStream openRead(Session session, Path file, long size, Set<PosixFilePermission> permissions,
				OpenOption... options) throws IOException {
			throwForbiddenException(session, "openRead");
			return null; // Unreachable
		}

		@Override
		public void closeRead(Session session, Path file, long size, Set<PosixFilePermission> permissions,
				InputStream stream) throws IOException {
			throwForbiddenException(session, "closeRead");
		}

		@Override
		public ScpSourceStreamResolver createScpSourceStreamResolver(Session session, Path path) throws IOException {
			throwForbiddenException(session, "createScpSourceStreamResolver");
			return null; // Unreachable
		}

		@Override
		public OutputStream openWrite(Session session, Path file, long size, Set<PosixFilePermission> permissions,
				OpenOption... options) throws IOException {
			throw new IOException("This method should not be called.");
		}

		@Override
		public void closeWrite(Session session, Path file, long size, Set<PosixFilePermission> permissions, OutputStream os)
				throws IOException {
			log.debug("SCP closeWrite: file {}, size {}", file, size);

			// Close the output stream first
			if (os != null) {
				try {
					os.close();
				}
				catch (IOException e) {
					log.warn("Error closing SCP output stream for file {}", file, e);
					throw e;
				}
			}

			// Trigger onFileWritten callback
			UploadTicket ticket = session.getAttribute(UPLOAD_TICKET);
			if (ticket != null) {
				// Get the relative path from the root
				Path rootPath = ticket.getRootPath();
				Path relativePath = file;
				if (file.isAbsolute()) {
					try {
						relativePath = rootPath.relativize(file);
					}
					catch (IllegalArgumentException e) {
						// If we can't relativize, use the file as is
						log.warn("Cannot relativize path {} against root {}", file, rootPath, e);
					}
				}
				log.info("File written via SCP in session {}: {}", session, relativePath);
				ticket.onFileWritten(relativePath);
			}
		}

		@Override
		public ScpTargetStreamResolver createScpTargetStreamResolver(Session session, Path path) throws IOException {
			log.debug("Create SCP target stream resolver for session {}, path {}", session, path);
			return new LocalFileScpTargetStreamResolver(path, this);
		}
	}

	/**
	 * File system accessor to be called when a device tries to interact with files via SFTP.
	 */
	private class DeviceSftpFileSystemAccessor implements SftpFileSystemAccessor {

		/** Common error message for all download attempts. */
		private static final String FORBIDDEN_MESSAGE =
			"Forbidden. This server only accepts incoming simple configuration files.";

		/**
		 * Log a forbidden access attempt and throw an IOException.
		 * @param subsystem the SFTP subsystem
		 * @param operation the operation that was attempted
		 * @throws IOException always thrown with FORBIDDEN_MESSAGE
		 */
		private void throwForbiddenException(SftpSubsystemProxy subsystem, String operation) throws IOException {
			log.warn("Forbidden SFTP operation '{}' attempted in session {}", operation, subsystem.getSession());
			throw new IOException(FORBIDDEN_MESSAGE);
		}

		@Override
		public void applyExtensionFileAttributes(SftpSubsystemProxy subsystem, Path file, Map<String, byte[]> extensions,
				LinkOption... options) throws IOException {
			throwForbiddenException(subsystem, "applyExtensionFileAttributes");
		}

		@Override
		public void closeDirectory(SftpSubsystemProxy subsystem, DirectoryHandle dirHandle, Path dir, String handle,
				DirectoryStream<Path> ds) throws IOException {
			throwForbiddenException(subsystem, "closeDirectory");
		}

		@Override
		public void closeFile(SftpSubsystemProxy subsystem, FileHandle fileHandle, Path file, String handle,
				Channel channel, Set<? extends OpenOption> options) throws IOException {
			log.debug("SFTP closeFile: file {}, handle {}, options {}", file, handle, options);

			// Trigger onFileWritten callback if this was a write operation
			if (options.contains(java.nio.file.StandardOpenOption.WRITE) ||
			    options.contains(java.nio.file.StandardOpenOption.CREATE)) {
				UploadTicket ticket = subsystem.getSession().getAttribute(UPLOAD_TICKET);
				if (ticket != null) {
					// Get the relative path from the root
					Path rootPath = ticket.getRootPath();
					Path relativePath = file;
					if (file.isAbsolute()) {
						try {
							relativePath = rootPath.relativize(file);
						}
						catch (IllegalArgumentException e) {
							// If we can't relativize, use the file as is
							log.warn("Cannot relativize path {} against root {}", file, rootPath, e);
						}
					}
					log.info("File written via SFTP in session {}: {}", subsystem.getSession(), relativePath);
					ticket.onFileWritten(relativePath);
				}
			}
		}

		@Override
		public void copyFile(SftpSubsystemProxy subsystem, Path src, Path dst, Collection<CopyOption> opts)
				throws IOException {
			throwForbiddenException(subsystem, "copyFile");
		}

		@Override
		public void createDirectory(SftpSubsystemProxy subsystem, Path path) throws IOException {
			throwForbiddenException(subsystem, "createDirectory");
		}

		@Override
		public void createLink(SftpSubsystemProxy subsystem, Path link, Path existing, boolean symLink) throws IOException {
			throwForbiddenException(subsystem, "createLink");
		}

		@Override
		public DirectoryStream<Path> openDirectory(SftpSubsystemProxy subsystem, DirectoryHandle dirHandle, Path dir,
				String handle, LinkOption... linkOptions) throws IOException {
			log.warn("openDirectory dirHandle {}, dir {}, handle {}, linkOptions {}", dirHandle, dir, handle, linkOptions);
			throwForbiddenException(subsystem, "openDirectory");
			return null; // Unreachable
		}

		@Override
		public SeekableByteChannel openFile(SftpSubsystemProxy subsystem, FileHandle fileHandle, Path file, String handle,
				Set<? extends OpenOption> options, FileAttribute<?>... attrs) throws IOException {
			log.warn("openFile fileHandle {}, file {}, handle {}, options {}, attrs {}", fileHandle, file, handle, options, attrs);
			return SftpFileSystemAccessor.super.openFile(subsystem, fileHandle, file, handle, options, attrs);
			//throwForbiddenException(subsystem, "openFile");
			//return null; // Unreachable
		}

		@Override
		public void putRemoteFileName(SftpSubsystemProxy subsystem, Path path, Buffer buf, String name, boolean shortName)
				throws IOException {
			SftpFileSystemAccessor.super.putRemoteFileName(subsystem, path, buf, name, shortName);
		}

		@Override
		public Map<String, ?> readFileAttributes(SftpSubsystemProxy subsystem, Path file, String view,
				LinkOption... options) throws IOException {
				
			var a = Files.readAttributes(file, view, options);
			log.warn("readFileAttributes: {}", a);
			return a;
		}

		@Override
		public void removeFile(SftpSubsystemProxy subsystem, Path path, boolean isDirectory) throws IOException {
			throwForbiddenException(subsystem, "removeFile");
		}

		@Override
		public void renameFile(SftpSubsystemProxy subsystem, Path oldPath, Path newPath, Collection<CopyOption> opts)
				throws IOException {
			throwForbiddenException(subsystem, "renameFile");
		}

		@Override
		public LinkOption[] resolveFileAccessLinkOptions(SftpSubsystemProxy subsystem, Path file, int cmd, String extension,
				boolean followLinks) throws IOException {
			return new LinkOption[] {};
		}

		@Override
		public UserPrincipal resolveFileOwner(SftpSubsystemProxy subsystem, Path file, UserPrincipal name)
				throws IOException {
			throwForbiddenException(subsystem, "resolveFileOwner");
			return null; // Unreachable
		}

		@Override
		public GroupPrincipal resolveGroupOwner(SftpSubsystemProxy subsystem, Path file, GroupPrincipal name)
				throws IOException {
			throwForbiddenException(subsystem, "resolveGroupOwner");
			return null; // Unreachable
		}

		@Override
		public String resolveLinkTarget(SftpSubsystemProxy subsystem, Path link) throws IOException {
			throwForbiddenException(subsystem, "resolveLinkTarget");
			return null; // Unreachable
		}

		// @Override
		// public Path resolveLocalFilePath(SftpSubsystemProxy subsystem, Path rootDir, String remotePath)
		// 		throws IOException, InvalidPathException {
		// 	log.warn("resolveLocalFilePath rootDir {}, remotePath {}", rootDir, remotePath);
		// 	UploadTicket ticket = subsystem.getSession().getAttribute(UPLOAD_TICKET);
		// 	if (ticket == null) {
		// 		log.warn("Invalid upload ticket in SFTP session {}", subsystem.getSession());
		// 	}
		// 	if (".".equals(remotePath)) {
		// 		return Path.of("/", ticket.getUsername());
		// 	}
		// 	return ticket.getTargetFilePath();
		// }

		@Override
		public NavigableMap<String, Object> resolveReportedFileAttributes(SftpSubsystemProxy subsystem, Path file,
				int flags, NavigableMap<String, Object> attrs, LinkOption... options) throws IOException {
			throwForbiddenException(subsystem, "resolveReportedFileAttributes");
			return null; // Unreachable
		}

		@Override
		public void setFileAccessControl(SftpSubsystemProxy subsystem, Path file, List<AclEntry> acl, LinkOption... options)
				throws IOException {
			throwForbiddenException(subsystem, "setFileAccessControl");
		}

		@Override
		public void setFileAttribute(SftpSubsystemProxy subsystem, Path file, String view, String attribute, Object value,
				LinkOption... options) throws IOException {
			throwForbiddenException(subsystem, "setFileAttribute");
		}

		@Override
		public void setFileOwner(SftpSubsystemProxy subsystem, Path file, Principal value, LinkOption... options)
				throws IOException {
			throwForbiddenException(subsystem, "setFileOwner");
		}

		// @Override
		// public void setFilePermissions(SftpSubsystemProxy subsystem, Path file, Set<PosixFilePermission> perms,
		// 		LinkOption... options) throws IOException {
		// 	//throwForbiddenException(subsystem, "setFilePermissions");
		// }

		@Override
		public void setGroupOwner(SftpSubsystemProxy subsystem, Path file, Principal value, LinkOption... options)
				throws IOException {
			throwForbiddenException(subsystem, "setGroupOwner");
		}

		@Override
		public void syncFileData(SftpSubsystemProxy subsystem, FileHandle fileHandle, Path file, String handle,
				Channel channel) throws IOException {
			throwForbiddenException(subsystem, "syncFileData");
		}

		@Override
		public FileLock tryLock(SftpSubsystemProxy subsystem, FileHandle fileHandle, Path file, String handle,
				Channel channel, long position, long size, boolean shared) throws IOException {
			throwForbiddenException(subsystem, "tryLock");
			return null; // Unreachable
		}

	}

	/**
	 * File system factory to be used when a device wants to upload data via SCP/SFTP.
	 */
	private class DeviceVirtualFileSystemFactory implements FileSystemFactory {
		@Override
		public Path getUserHomeDir(SessionContext session) throws IOException {
			UploadTicket ticket = session.getAttribute(UPLOAD_TICKET);
			return ticket.getRootPath();
		}

		@Override
		public FileSystem createFileSystem(SessionContext session) throws IOException {
			Path dir = getUserHomeDir(session);
			if (dir == null) {
				throw new InvalidPathException(session.getUsername(), "Cannot resolve home directory");
			}
			return new RootedFileSystemProvider().newFileSystem(dir, Collections.emptyMap());
		}
	}

	/** The internal SSHd server. */
	private org.apache.sshd.server.SshServer sshd = null;

	/** The upload tickets, to accept incoming upload requests. */
	private Map<String, UploadTicket> tickets = new ConcurrentHashMap<>();

	/**
	 * Get a path for storing a specific key algorithm.
	 * @param algorithm The key algorithm
	 * @param keySize The key size (0 = default)
	 * @return The path to use
	 */
	private Path getHostKeyPath(String algorithm, int keySize) {
		Path keyBasePath = SshServer.SETTINGS.hostKeyPath;
		String central = algorithm.toLowerCase();
		if (keySize != 0) {
			central += Integer.toString(keySize);
		}
		String fileName = "netshot_ssh_host_%s.key".formatted(central);
		return keyBasePath.resolve(fileName);
	}

	/**
	 * Start the embedded SSH server.
	 */
	private void start() {
		this.sshd = org.apache.sshd.server.SshServer.setUpDefaultServer();
		this.sshd.setPort(SshServer.SETTINGS.tcpPort);
		this.sshd.setHost(SshServer.SETTINGS.listenHost.getHostAddress());

		CoreModuleProperties.MAX_CONCURRENT_SESSIONS.set(this.sshd, SshServer.SETTINGS.maxConcurrentSessions);

		this.sshd.setKeyExchangeFactories(
			NamedFactory.setUpTransformedFactories(true,
				BuiltinDHFactories.parseDHFactoriesList(SshServer.SETTINGS.kexAlgorithms).getParsedFactories(),
				ServerBuilder.DH2KEX));
		this.sshd.setSignatureFactoriesNames(SshServer.SETTINGS.hostKeyAlgorithms);
		this.sshd.setCipherFactoriesNames(SshServer.SETTINGS.ciphers);
		this.sshd.setMacFactoriesNames(SshServer.SETTINGS.macs);
		this.sshd.setCompressionFactoriesNames(SshServer.SETTINGS.compressionAlgorithms);
		this.sshd.setForwardingFilter(RejectAllForwardingFilter.INSTANCE);

		// Configure host key provider to generate keys for all supported algorithms
		// Each key type will be generated and stored in a separate file
		// Only generate keys that are configured in hostKeyAlgorithms
		// Map of SSH key type -> key provider for direct lookup during negotiation
		final Map<String, SimpleGeneratorHostKeyProvider> hostKeyProvidersByType = new HashMap<>();
		// Track which algorithms we've created providers for to avoid duplicate providers
		final Map<String, SimpleGeneratorHostKeyProvider> providersByAlgorithm = new HashMap<>();

		for (String hostKeyAlgorithm : SshServer.SETTINGS.hostKeyAlgorithms) {
			String algorithm = null;
			int keySize = 0;

			String canonicalType = KeyUtils.getCanonicalKeyType(hostKeyAlgorithm);
			ECCurves ecCurves = ECCurves.fromKeyType(hostKeyAlgorithm);
			if (ecCurves != null) {
				algorithm = BuiltinIdentities.ECDSA.getAlgorithm();
				keySize = ecCurves.getKeySize();
			}
			else if (KeyPairProvider.SSH_RSA.equals(canonicalType)) {
				algorithm = BuiltinIdentities.RSA.getAlgorithm();
			}
			else if (KeyPairProvider.SSH_ED25519.equals(canonicalType)) {
				algorithm = BuiltinIdentities.ED25119.getAlgorithm();
				keySize = 255; // Ed25519 requires keysize of 255
			}
			else if (KeyPairProvider.SSH_DSS.equals(canonicalType)) {
				algorithm = BuiltinIdentities.DSA.getAlgorithm();
			}
			else {
				log.warn("Unknown SSH host key algorithm '{}', ignoring", hostKeyAlgorithm);
				continue;
			}

			// Get or create provider for this algorithm
			String algoSize = "%s_%d".formatted(algorithm, keySize);
			SimpleGeneratorHostKeyProvider provider = providersByAlgorithm.get(algoSize);
			if (provider == null) {
				Path keyPath = this.getHostKeyPath(algorithm, keySize);
				provider = new SimpleGeneratorHostKeyProvider(keyPath);
				provider.setAlgorithm(algorithm);
				provider.setKeySize(keySize);
				providersByAlgorithm.put(algoSize, provider);
				log.debug("SSH server will use {} host key (stored in: {})", algorithm, keyPath);
			}
			// Map this key type to the provider
			hostKeyProvidersByType.put(hostKeyAlgorithm, provider);
		}

		// Combine all key providers into a single provider
		this.sshd.setKeyPairProvider(new KeyPairProvider() {
			@Override
			public Iterable<KeyPair> loadKeys(SessionContext session) {
				List<KeyPair> allKeys = new ArrayList<>();
				// Iterate over unique providers only
				for (SimpleGeneratorHostKeyProvider provider : providersByAlgorithm.values()) {
					Iterable<KeyPair> keys = provider.loadKeys(session);
					for (KeyPair key : keys) {
						allKeys.add(key);
					}
				}
				return allKeys;
			}
		});
		
		this.sshd.addSessionListener(new DeviceSessionListener());

		this.sshd.setPasswordAuthenticator(new DevicePasswordAuthenticator());
		this.sshd.setKeyboardInteractiveAuthenticator(new DeviceKeyboardInteractiveAuthenticator());
		this.sshd.setPublickeyAuthenticator(null);
		this.sshd.setHostBasedAuthenticator(null);
		this.sshd.setGSSAuthenticator(null);

		this.sshd.setShellFactory(null);
		if (SshServer.SETTINGS.isProtocolEnabled(TransferProtocol.SCP)) {
			ScpCommandFactory scpCommandFactory = new ScpCommandFactory();
			scpCommandFactory.setScpFileOpener(new DeviceScpFileOpener());
			this.sshd.setCommandFactory(scpCommandFactory);
		}
		else {
			log.info("SCP is disabled by configuration.");
		}

		if (SshServer.SETTINGS.isProtocolEnabled(TransferProtocol.SFTP)) {
			SftpSubsystemFactory sftpFactory = new SftpSubsystemFactory.Builder()
				.withFileSystemAccessor(new DeviceSftpFileSystemAccessor())
				.build();
			this.sshd.setSubsystemFactories(Collections.singletonList(sftpFactory));
		}
		else {
			log.info("SFTP is disabled by configuration");
		}
		this.sshd.setFileSystemFactory(new DeviceVirtualFileSystemFactory());

		try {
			this.sshd.start();
		}
		catch (IOException e) {
			log.error("Cannot start the embedded SSH server", e);
			this.stop();
		}

		try {
			Owner testOwner = new Owner() {};
			UploadTicket sampleTicket = new UploadTicket() {
				@Override
				public Owner getOwner() {
					return testOwner;
				}

				@Override
				public Set<TransferProtocol> getAllowedProtocols() {
					return new HashSet<>(Arrays.asList(TransferProtocol.SCP, TransferProtocol.SFTP));
				}

				@Override
				public String getUsername() {
					return "test";
				}

				@Override
				public boolean checkPassword(NetworkAddress source, String password) {
					return "test".equals(password);
				}

				@Override
				public Path getRootPath() {
					return Paths.get("/tmp", "testdir");
				}

				@Override
				public boolean isValid() {
					return true;
				}

				@Override
				public void onSessionStarted() {
				}

				@Override
				public void onSessionStopped() {
				}

				@Override
				public void onFileWritten(Path filePath) {
				}
				
			};
			this.registerUploadTicket(sampleTicket);
		}
		catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	/**
	 * Stop the server.
	 */
	private void stop() {
		if (this.sshd == null) {
			return;
		}
		try {
			this.sshd.close();
			this.sshd = null;
		}
		catch (IOException e) {
			log.warn("Cannot close embedded SSH server", e);
		}
	}

	/**
	 * Common authentication callback for SFTP and SCP requests.
	 * @param session the server session
	 * @param username the passed username
	 * @param password the passed password
	 * @return true for successful authentication
	 */
	private boolean authenticate(ServerSession session, String username, String password) {
		UploadTicket ticket = SshServer.this.tickets.get(username);
		if (ticket == null) {
			log.warn("Authentication failed for incoming request on embedded SSH server from {}: unknown ticket {}",
				session.getRemoteAddress(), username);
			AAA_LOG.warn("Authentication failed for incoming request on embedded SSH server from {}: unknown ticket {}",
				session.getRemoteAddress(), username);
			return false;
		}
		synchronized (ticket) {
			if (!ticket.isValid()) {
				log.warn("Authentication failed for incoming request on embedded SSH server from {}: invalid ticket {}",
					session.getRemoteAddress(), username);
				return false;
			}
			NetworkAddress source = null;
			try {
				if (session.getRemoteAddress() instanceof InetSocketAddress iAddress) {
					source = NetworkAddress.getNetworkAddress(iAddress.getAddress());
				}
			}
			catch (UnknownHostException e) {
				// Ignore
			}
			if (!ticket.checkPassword(source, password)) {
				return false;
			}
		}
		log.info("Authentication succeeded for incoming request on embedded SSH server from {}, for ticket {}",
			session.getRemoteAddress(), username);
		session.setAttribute(UPLOAD_TICKET, ticket);
		ticket.onSessionStarted();
		return true;
	}

	/**
	 * Register a new upload ticket.
	 * @param ticket the ticket to register
	 * @throws IOException
	 */
	public void registerUploadTicket(UploadTicket ticket) throws IOException {
		synchronized (ticket) {
			UploadTicket existing = this.tickets.putIfAbsent(ticket.getUsername(), ticket);
			if (existing != null) {
				throw new IOException(
					"Upload ticket '%s' already exists".formatted(ticket.getUsername()));
			}
		}
	}

	/**
	 * Clear upload ticket(s) of given owner.
	 * @param owner the owner
	 */
	public void clearUploadTickets(UploadTicket.Owner owner) {
		Iterator<Entry<String, UploadTicket>> ticketIt = this.tickets.entrySet().iterator();
		while (ticketIt.hasNext()) {
			UploadTicket ticket = ticketIt.next().getValue();
			synchronized (ticket) {
				if (Objects.equals(owner, ticket.getOwner())) {
					ticketIt.remove();
				}
			}
		}
	}

	/**
	 * Retrive the public host keys of the embedded SSH server.
	 * @return the public host keys
	 * @throws IOException
	 * @throws GeneralSecurityException
	 */
	public Set<PublicKey> getPublicHostKeys() throws IOException, GeneralSecurityException {
		Set<PublicKey> keys = new HashSet<>();
		for (KeyPair kp : this.sshd.getKeyPairProvider().loadKeys(null)) {
			keys.add(kp.getPublic());
		}
		return keys;
	}
}
