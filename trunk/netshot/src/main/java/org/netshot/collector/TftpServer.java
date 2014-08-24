/*
 * Copyright Sylvain Cadilhac 2013
 */

package org.netshot.collector;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InterruptedIOException;
import java.io.OutputStream;
import java.net.SocketException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import org.apache.commons.net.tftp.TFTP;
import org.apache.commons.net.tftp.TFTPAckPacket;
import org.apache.commons.net.tftp.TFTPDataPacket;
import org.apache.commons.net.tftp.TFTPPacket;
import org.apache.commons.net.tftp.TFTPPacketException;
import org.apache.commons.net.tftp.TFTPWriteRequestPacket;
import org.netshot.Netshot;
import org.netshot.collector.TftpServer.TftpTransfer.Status;
import org.netshot.device.Network4Address;
import org.netshot.device.NetworkAddress;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// TODO: Auto-generated Javadoc
/**
 * A TFTP server waits for TFTP uploads from the devices. The TFTP transfer must
 * be prepared before it can be accepted by the server.
 */
public class TftpServer extends Collector {

    /** The UDP port to listen TFTP packets on. */
    private int udpPort = 69;

    /** The TFTP object. */
    private TFTP tftp;

    /** The transfers. */
    private Set<TftpTransfer> transfers = new HashSet<TftpTransfer>();

    /** The logger. */
    private static Logger logger = LoggerFactory.getLogger(TftpServer.class);

    /** The static TFTP server instance. */
    private static TftpServer nsTftpServer = null;

    
    private static boolean running = false;
    
    public static boolean isRunning() {
	return running;
    }
    
    /**
     * Initializes the TFTP server.
     */
    public static void init() {
	if (Netshot.getConfig("netshot.tftpserver.disabled", "false").equals(
		"true")) {
	    logger.warn("The TFTP server is disabled by configuration.");
	    return;
	}
	nsTftpServer = new TftpServer();
	nsTftpServer.start();
    }

    /**
     * Gets the server.
     * 
     * @return the server
     */
    public static TftpServer getServer() {
	return nsTftpServer;
    }

    /**
     * Instantiates a new TFTP server.
     */
    public TftpServer() {
	this.setName("TFTP Server");
	this.setDaemon(true);
	String port = Netshot.getConfig("netshot.tftpserver.port");
	if (port != null) {
	    udpPort = Integer.parseInt(port);
	}
	tftp = new TFTP();
    }

    /*
     * (non-Javadoc)
     * 
     * @see java.lang.Thread#run()
     */
    @Override
    public void run() {
	try {
	    tftp.setDefaultTimeout(0);
	    tftp.open(udpPort);
	    logger.debug("Now listening for TFTP packets on UDP port {}.",
		    udpPort);
	    running = true;
	    while (true) {
		try {
		    TFTPPacket packet = tftp.receive();
		    if (packet instanceof TFTPWriteRequestPacket) {
			TFTPWriteRequestPacket requestPacket = (TFTPWriteRequestPacket) packet;
			synchronized (transfers) {
			    Iterator<TftpTransfer> transferIterator = transfers
				    .iterator();
			    while (transferIterator.hasNext()) {
				TftpTransfer transfer = transferIterator.next();
				if (transfer.getStatus() != Status.PREPARED) {
				    transferIterator.remove();
				    continue;
				}
				if (transfer.match(requestPacket)) {
				    transfer.setRequestPacket(requestPacket);
				}
			    }
			}
		    }
		}
		catch (Exception e) {
		}
	    }
	}
	catch (SocketException e) {
	    logger.error("Couldn't start the TFTP server");
	}
	running = false;
    }

    /**
     * The Class TftpTransferException.
     */
    public static class TftpTransferException extends IOException {

	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = -3945635975316058776L;
    }

    /**
     * The Class TftpTransferTimeoutException.
     */
    public static class TftpTransferTimeoutException extends
	    TftpTransferException {

	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = 399042520858415551L;
    }

    /**
     * Gets the result.
     * 
     * @param transfer
     *            the transfer
     * @return the result
     * @throws TftpTransferException
     *             the tftp transfer exception
     */
    public String getResult(TftpTransfer transfer) throws TftpTransferException {
	try {
	    transfer.join();
	}
	catch (InterruptedException e) {
	}
	if (transfer.getStatus() == Status.TIMEDOUT) {
	    throw new TftpTransferTimeoutException();
	}
	synchronized (transfers) {
	    transfers.remove(transfer);
	}
	return transfer.getData();
    }

    /**
     * Prepare transfer.
     * 
     * @param source
     *            the source
     * @param fileName
     *            the file name
     * @param timeout
     *            the timeout
     * @return the tftp transfer
     */
    public TftpTransfer prepareTransfer(Network4Address source,
	    String fileName, int timeout) {
	TftpTransfer transfer = new TftpTransfer(source, fileName, timeout);
	synchronized (transfers) {
	    transfers.add(transfer);
	}
	transfer.start();
	return transfer;
    }

    /**
     * The Class TftpTransfer.
     */
    public static class TftpTransfer extends Thread {

	/** The source. */
	Network4Address source;

	/** The file name. */
	String fileName;

	/** The thread timeout. */
	int threadTimeout;

	/** The receive timeout. */
	int receiveTimeout;

	/** The start time. */
	long startTime = System.currentTimeMillis();

	/** The status. */
	private Status status = Status.PREPARED;

	/** The request packet. */
	private TFTPWriteRequestPacket requestPacket = null;

	/** The buffer. */
	OutputStream buffer = new ByteArrayOutputStream();

	/** The tftp. */
	TFTP tftp;

	/**
	 * The Enum Status.
	 */
	public enum Status {

	    /** The prepared. */
	    PREPARED,

	    /** The running. */
	    RUNNING,

	    /** The finished. */
	    FINISHED,

	    /** The timedout. */
	    TIMEDOUT,

	    /** The error. */
	    ERROR
	}

	/**
	 * Instantiates a new tftp transfer.
	 * 
	 * @param source
	 *            the source
	 * @param fileName
	 *            the file name
	 * @param timeout
	 *            the timeout
	 */
	public TftpTransfer(Network4Address source, String fileName, int timeout) {
	    this.source = source;
	    this.fileName = fileName;
	    this.threadTimeout = timeout;
	    this.receiveTimeout = timeout / 10;
	}

	/**
	 * Sets the request packet.
	 * 
	 * @param requestPacket
	 *            the new request packet
	 */
	public void setRequestPacket(TFTPWriteRequestPacket requestPacket) {
	    this.requestPacket = requestPacket;
	}

	/**
	 * Gets the packet.
	 * 
	 * @return the packet
	 * @throws InterruptedIOException
	 *             the interrupted io exception
	 * @throws SocketException
	 *             the socket exception
	 * @throws IOException
	 *             Signals that an I/O exception has occurred.
	 * @throws TFTPPacketException
	 *             the tFTP packet exception
	 */
	private TFTPPacket getPacket() throws InterruptedIOException,
		SocketException, IOException, TFTPPacketException {
	    long maxTime = System.currentTimeMillis() + receiveTimeout * 1000;
	    while (true) {
		TFTPPacket packet = tftp.bufferedReceive();
		if (packet.getAddress().equals(requestPacket.getAddress())
			&& packet.getPort() == requestPacket.getPort()) {
		    return packet;
		}
		if (System.currentTimeMillis() > maxTime) {
		    throw new SocketTimeoutException();
		}
	    }
	}

	/**
	 * Gets the data.
	 * 
	 * @return the data
	 */
	private String getData() {
	    return buffer.toString();
	}

	/**
	 * Check timeout.
	 * 
	 * @return true, if successful
	 */
	private boolean checkTimeout() {
	    if (System.currentTimeMillis() > startTime + threadTimeout * 1000) {
		status = Status.TIMEDOUT;
		return true;
	    }
	    return false;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Thread#run()
	 */
	@Override
	public void run() {
	    while (requestPacket == null) {
		try {
		    Thread.sleep(1000);
		}
		catch (InterruptedException e) {
		    status = Status.ERROR;
		    return;
		}
		if (checkTimeout()) {
		    return;
		}
	    }
	    status = Status.RUNNING;
	    tftp = new TFTP();
	    tftp.beginBufferedOps();
	    tftp.setDefaultTimeout(receiveTimeout * 1000);
	    try {
		tftp.open();
	    }
	    catch (SocketException e) {
		status = Status.ERROR;
		return;
	    }
	    TFTPPacket packet = requestPacket;
	    TFTPAckPacket ackPacket = new TFTPAckPacket(packet.getAddress(),
		    packet.getPort(), 0);
	    while (packet instanceof TFTPWriteRequestPacket) {
		try {
		    tftp.bufferedSend(ackPacket);
		    packet = this.getPacket();
		}
		catch (Exception e) {
		}
		if (checkTimeout()) {
		    return;
		}
	    }
	    int lastBlock = 0;
	    while (packet instanceof TFTPDataPacket) {
		TFTPDataPacket dataPacket = (TFTPDataPacket) packet;
		int block = dataPacket.getBlockNumber();
		if (block > lastBlock || (lastBlock == 65535 && block == 0)) {
		    try {
			buffer.write(dataPacket.getData(),
				dataPacket.getDataOffset(),
				dataPacket.getDataLength());
		    }
		    catch (IOException e) {
			status = Status.ERROR;
			return;
		    }
		}
		ackPacket = new TFTPAckPacket(requestPacket.getAddress(),
			requestPacket.getPort(), block);
		try {
		    tftp.bufferedSend(ackPacket);
		}
		catch (IOException e) {
		}
		if (dataPacket.getDataLength() < TFTPDataPacket.MAX_DATA_LENGTH) {
		    this.status = Status.FINISHED;
		    for (int i = 0; i < 3; i++) {
			try {
			    packet = this.getPacket();
			    tftp.bufferedSend(ackPacket);
			}
			catch (Exception e) {
			    return;
			}
		    }
		}
		try {
		    packet = this.getPacket();
		}
		catch (Exception e) {
		}
		if (checkTimeout()) {
		    return;
		}
	    }
	    status = Status.ERROR;
	    tftp.close();
	}

	/**
	 * Match.
	 * 
	 * @param packet
	 *            the packet
	 * @return true, if successful
	 */
	public boolean match(TFTPWriteRequestPacket packet) {
	    if (this.status != Status.PREPARED) {
		return false;
	    }
	    try {
		NetworkAddress address = NetworkAddress.getNetworkAddress(
			packet.getAddress(), 0);
		if (!address.equals(source)) {
		    return false;
		}
	    }
	    catch (UnknownHostException e) {
		return false;
	    }
	    if (packet.getFilename() == null) {
		return false;
	    }
	    String file1 = fileName.replaceFirst("^/", "");
	    String file2 = packet.getFilename().replaceFirst("^/", "");
	    if (!file1.equals(file2)) {
		return false;
	    }
	    return true;
	}

	/**
	 * Gets the status.
	 * 
	 * @return the status
	 */
	public Status getStatus() {
	    return status;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
	    final int prime = 31;
	    int result = 1;
	    result = prime * result
		    + ((fileName == null) ? 0 : fileName.hashCode());
	    result = prime * result
		    + ((source == null) ? 0 : source.hashCode());
	    result = prime * result + (int) (startTime ^ (startTime >>> 32));
	    return result;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Object#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
	    if (this == obj)
		return true;
	    if (obj == null)
		return false;
	    if (getClass() != obj.getClass())
		return false;
	    TftpTransfer other = (TftpTransfer) obj;
	    if (fileName == null) {
		if (other.fileName != null)
		    return false;
	    }
	    else if (!fileName.equals(other.fileName))
		return false;
	    if (source == null) {
		if (other.source != null)
		    return false;
	    }
	    else if (!source.equals(other.source))
		return false;
	    if (startTime != other.startTime)
		return false;
	    return true;
	}

    }

}
