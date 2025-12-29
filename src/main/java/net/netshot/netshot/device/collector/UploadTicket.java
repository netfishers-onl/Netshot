package net.netshot.netshot.device.collector;

import java.nio.file.Path;
import java.util.Set;

import net.netshot.netshot.device.NetworkAddress;

/**
 * This class represents a "ticket" or permission to upload data
 * to the embedded server.
 */
public interface UploadTicket {

	/** Interface to mark possible ticket owners */
	public static interface Owner {
		// Empty
	}

	/** Owner of the ticket. */
	public Owner getOwner();

	/** Allowed protocols (SFTP, SCP). */
	public Set<TransferProtocol> getAllowedProtocols();

	/** Unique username for this ticket. */
	public String getUsername();

	/** Check the password. */
	public boolean checkPassword(NetworkAddress source, String password);

	/** File path where to write the file. */
	public Path getRootPath();

	/** Whether the ticket is still valid. */
	public boolean isValid();

	/** Called when the SSH session is authenticated and started. */
	public void onSessionStarted();

	/** Called when the SSH session is closed. */
	public void onSessionStopped();

	/**
	 * Called when a file has been written via SFTP or SCP.
	 * @param filePath the relative path from the root path
	 * @return true if the file was consumed, false to remove it
	 */
	public boolean onFileWritten(Path filePath);
}