/*
 * Copyright Sylvain Cadilhac 2013
 */

package org.netshot.collector;

import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Set;

import org.netshot.Netshot;
import org.netshot.device.Device;
import org.netshot.device.Network4Address;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.snmp4j.CommandResponder;
import org.snmp4j.CommandResponderEvent;
import org.snmp4j.MessageDispatcherImpl;
import org.snmp4j.PDU;
import org.snmp4j.Snmp;
import org.snmp4j.TransportMapping;
import org.snmp4j.mp.MPv1;
import org.snmp4j.mp.MPv2c;
import org.snmp4j.security.SecurityLevel;
import org.snmp4j.security.SecurityModel;
import org.snmp4j.smi.Address;
import org.snmp4j.smi.IpAddress;
import org.snmp4j.smi.UdpAddress;
import org.snmp4j.transport.DefaultUdpTransportMapping;
import org.snmp4j.util.MultiThreadedMessageDispatcher;
import org.snmp4j.util.ThreadPool;

/**
 * A SNMP trap receiver listens for SNMP traps and triggers snapshots if needed.
 */
public class SnmpTrapReceiver extends Collector implements CommandResponder {

	/** The logger. */
	private static Logger logger = LoggerFactory
			.getLogger(SnmpTrapReceiver.class);

	/** The dispatcher. */
	private MultiThreadedMessageDispatcher dispatcher;

	/** The SNMP object. */
	private Snmp snmp = null;

	/** The listen address. */
	private UdpAddress listenAddress;

	/** The thread pool. */
	private ThreadPool threadPool;

	/** The UDP port to listen for traps on. */
	private int udpPort = 162;

	/** The community. */
	private String community;

	/** The static SNMP trap receiver instance. */
	private static SnmpTrapReceiver nsSnmpTrapReceiver;

	private static boolean running = false;

	public static boolean isRunning() {
		return running;
	}

	/**
	 * Initializes the trap receiver.
	 */
	public static void init() {
		if (Netshot.getConfig("netshot.snmptrap.disabled", "false").equals("true")) {
			logger.warn("The SNMP trap receiver is disabled by configuration.");
			return;
		}
		nsSnmpTrapReceiver = new SnmpTrapReceiver();
		nsSnmpTrapReceiver.start();
	}

	/**
	 * Instantiates a new snmp trap receiver.
	 */
	public SnmpTrapReceiver() {
		this.setName("SNMP Receiver");
		this.setDaemon(true);
		String port = Netshot.getConfig("netshot.snmptrap.port");
		if (port != null) {
			this.udpPort = Integer.parseInt(port);
		}
		this.community = Netshot.getConfig("netshot.snmptrap.community", "NETSHOT");
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Thread#start()
	 */
	@Override
	public void start() {

		try {
			running = true;
			threadPool = ThreadPool.create("SNMP Receiver Pool", 2);
			dispatcher = new MultiThreadedMessageDispatcher(threadPool,
					new MessageDispatcherImpl());
			listenAddress = new UdpAddress(udpPort);
			TransportMapping<UdpAddress> transport = new DefaultUdpTransportMapping(
					listenAddress);

			snmp = new Snmp(dispatcher, transport);
			snmp.getMessageDispatcher().addMessageProcessingModel(new MPv1());
			snmp.getMessageDispatcher().addMessageProcessingModel(new MPv2c());
			snmp.listen();
			snmp.addCommandResponder(this);
			logger.debug("Now listening for SNMP traps on UDP port {}.", udpPort);
		}
		catch (IOException e) {
			logger.error("I/O error with the SNMP trap receiver.", e);
			running = false;
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.snmp4j.CommandResponder#processPdu(org.snmp4j.CommandResponderEvent)
	 */
	@Override
	public void processPdu(CommandResponderEvent event) {
		logger.trace("Incoming SNMP message from {}.", event.getPeerAddress());
		if (event.getSecurityLevel() == SecurityLevel.NOAUTH_NOPRIV
				&& (event.getSecurityModel() == SecurityModel.SECURITY_MODEL_SNMPv1 || event
						.getSecurityModel() == SecurityModel.SECURITY_MODEL_SNMPv2c)) {

			String community = new String(event.getSecurityName());

			if (this.community.equals(community)) {
				Address address = event.getPeerAddress();
				if (address instanceof IpAddress) {
					InetAddress inetAddress = ((IpAddress) address).getInetAddress();
					if (inetAddress instanceof Inet4Address) {
						try {
							Network4Address source = new Network4Address(
									(Inet4Address) inetAddress, 32);
							Set<Class<? extends Device>> deviceClasses = Device
									.getDeviceClasses();
							for (Class<? extends Device> deviceClass : deviceClasses) {
								try {
									Boolean found = (Boolean) deviceClass.getMethod(
											"analyzeTrap", PDU.class, Network4Address.class).invoke(
											null, event.getPDU(), source);
									if (found) {
										break;
									}
								}
								catch (Exception e) {
									logger.error(
											"Error while processing SNMP message with class '{}'.",
											deviceClass.getName(), e);
								}
							}
						}
						catch (UnknownHostException e) {
						}
					}
				}
			}
			else {
				logger.warn("Invalid community {}.", community);
			}

		}
	}

}
