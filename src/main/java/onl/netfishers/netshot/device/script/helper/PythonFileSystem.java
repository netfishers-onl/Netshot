package onl.netfishers.netshot.device.script.helper;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.nio.channels.SeekableByteChannel;
import java.nio.file.AccessMode;
import java.nio.file.DirectoryStream;
import java.nio.file.DirectoryStream.Filter;
import java.nio.file.LinkOption;
import java.nio.file.OpenOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.FileAttribute;
import java.util.Map;
import java.util.Set;

import org.graalvm.polyglot.io.FileSystem;

import lombok.extern.slf4j.Slf4j;
import onl.netfishers.netshot.Netshot;

/**
 * Implementation of the FileSystem GraalVM interface to restrict
 * Python code I/O access to the shipping GraalPython libraries,
 * in read-only mode.
 */
@Slf4j
public class PythonFileSystem implements FileSystem {
	
	/** Python VirtualEnv folder (if any) */
	public static String VENV_FOLDER = null;
	
	static {
		String venv = Netshot.getConfig("netshot.python.virtualenv");
		if (venv != null) {
			File venvFile = new File(venv);
			if (venvFile.exists() && venvFile.isDirectory()) {
				VENV_FOLDER = venvFile.getAbsolutePath();
			}
			else {
				log.warn("Python virtualenv folder {} doesn't exist or is not a directory", venv);
			}
		}
	}

	private final FileSystem delegate;
	private final Path libFolder;
	private final Path venvFolder;

	public PythonFileSystem() throws IOException {
		this.delegate = FileSystem.newDefaultFileSystem();
		this.libFolder = delegate.toRealPath(
			delegate.parsePath(System.getProperty("java.home") + "/languages"));
		if (VENV_FOLDER == null) {
			this.venvFolder = null;
		}
		else {
			this.venvFolder = delegate.toRealPath(delegate.parsePath(VENV_FOLDER));
		}
	}

	private void verifyAccess(Path path, String reason) {
		log.debug("Checking permission ({}) for path {}", reason, path);
		Path realPath = null;
		for (Path c = path; c != null; c = c.getParent()) {
			try {
				realPath = delegate.toRealPath(c);
				break;
			}
			catch (IOException ioe) {
			}
		}
		if (realPath == null || !(realPath.startsWith(libFolder) || (venvFolder != null && realPath.startsWith(venvFolder)) ||
				(realPath.startsWith("/proc/")))) {
			log.info("Access ({}) to {} [{}] is denied", reason, path, realPath);
			throw new SecurityException("Access to " + path + " is denied.");
		}
	}

	@Override
	public Path parsePath(String path) {
		return delegate.parsePath(path);
	}

	@Override
	public Path parsePath(URI uri) {
		return delegate.parsePath(uri);
	}

	@Override
	public SeekableByteChannel newByteChannel(Path path, Set<? extends OpenOption> options, FileAttribute<?>... attrs)
			throws IOException {
		for (OpenOption option : options) {
			if (!option.equals(StandardOpenOption.READ)) {
				log.warn("Denying new Byte channel for {} with option {}", path, option);
				throw new SecurityException("Opening " + path + " with option " + option + " is denied.");
			}
		}
		verifyAccess(path, "newByteChannel");
		return delegate.newByteChannel(path, options, attrs);
	}

	@Override
	public void checkAccess(Path path, Set<? extends AccessMode> modes, LinkOption... linkOptions) throws IOException {
		for (AccessMode mode : modes) {
			if (!mode.equals(AccessMode.READ)) {
				log.warn("Denying access to file {} in {} mode", path, mode);
				throw new SecurityException("Opening " + path + " in mode " + mode + " is denied.");
			}
		}
		verifyAccess(path, "checkAccess");
		delegate.checkAccess(path, modes, linkOptions);
	}

	@Override
	public void createDirectory(Path dir, FileAttribute<?>... attrs) throws IOException {
		log.warn("Denying creation of directory {}", dir);
		throw new SecurityException("Creation of directory " + dir + " is denied.");
	}

	@Override
	public void delete(Path path) throws IOException {
		log.warn("Denying deletion of {}", path);
		throw new SecurityException("Deletion of file " + path + " is denied.");
	}

	@Override
	public DirectoryStream<Path> newDirectoryStream(Path dir, Filter<? super Path> filter) throws IOException {
		verifyAccess(dir, "newDirectoryStream");
		return delegate.newDirectoryStream(dir, filter);
	}

	@Override
	public Path toAbsolutePath(Path path) {
		return delegate.toAbsolutePath(path);
	}

	@Override
	public Path toRealPath(Path path, LinkOption... linkOptions) throws IOException {
		return delegate.toRealPath(path, linkOptions);
	}

	@Override
	public Map<String, Object> readAttributes(Path path, String attributes, LinkOption... options) throws IOException {
		return delegate.readAttributes(path, attributes, options);
	}
}
