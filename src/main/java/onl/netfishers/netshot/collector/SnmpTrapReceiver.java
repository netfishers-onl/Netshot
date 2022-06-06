/**
 * Copyright 2013-2021 Sylvain Cadilhac (NetFishers)
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
package onl.netfishers.netshot.collector;

import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.work.tasks.TakeSnapshotTask;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.snmp4j.CommandResponder;
import org.snmp4j.CommandResponderEvent;
import org.snmp4j.MessageDispatcherImpl;
import org.snmp4j.Snmp;
import org.snmp4j.TransportMapping;
import org.snmp4j.mp.MPv1;
import org.snmp4j.mp.MPv2c;
import org.snmp4j.security.SecurityLevel;
import org.snmp4j.security.SecurityModel;
import org.snmp4j.smi.Address;
import org.snmp4j.smi.IpAddress;
import org.snmp4j.smi.UdpAddress;
import org.snmp4j.smi.VariableBinding;
import org.snmp4j.transport.DefaultUdpTransportMapping;
import org.snmp4j.util.MultiThreadedMessageDispatcher;
import org.snmp4j.util.ThreadPool;

/**
 * A SNMP trap receiver listens for SNMP traps and triggers snapshots if needed.
 */
public class SnmpTrapReceiver implements CommandResponder {

	/** The logger. */
	final private static Logger logger = LoggerFactory
			.getLogger(SnmpTrapReceiver.class);

	/** The UDP port to listen for traps on. */
	private static int UDP_PORT = 162;

	/** The communities. */
	private static Set<String> communities = ConcurrentHashMap.newKeySet();

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
		String port = Netshot.getConfig("netshot.snmptrap.port");
		if (port != null) {
			UDP_PORT = Integer.parseInt(port);
		}
		SnmpTrapReceiver.loadConfig();
		nsSnmpTrapReceiver = new SnmpTrapReceiver();
		nsSnmpTrapReceiver.start();
	}

	/**
	 * (Re)load the trap receiver live configuration.
	 */
	public static void loadConfig() {
		communities.clear();
		try {
			for (String community : Netshot.getConfig("netshot.snmptrap.community", "NETSHOT").split(" +")) {
				communities.add(community);
			}
		}
		catch (Exception e) {
			logger.warn("Error while parsing SNMP trap community option", e);
		}

	}

	/** The dispatcher. */
	private MultiThreadedMessageDispatcher dispatcher;

	/** The SNMP object. */
	private Snmp snmp = null;

	/** The listen address. */
	private UdpAddress listenAddress;

	/** The thread pool. */
	private ThreadPool threadPool;

	/**
	 * Instantiates a new snmp trap receiver.
	 */
	public SnmpTrapReceiver() {
	}

	/**
	 * Start the trap receiver.
	 */
	public void start() {
		try {
			running = true;
			threadPool = ThreadPool.create("SNMP Receiver Pool", 2);
			dispatcher = new MultiThreadedMessageDispatcher(threadPool,
					new MessageDispatcherImpl());
			listenAddress = new UdpAddress(UDP_PORT);
			TransportMapping<UdpAddress> transport = new DefaultUdpTransportMapping(
					listenAddress);

			snmp = new Snmp(dispatcher, transport);
			snmp.getMessageDispatcher().addMessageProcessingModel(new MPv1());
			snmp.getMessageDispatcher().addMessageProcessingModel(new MPv2c());
			snmp.listen();
			snmp.addCommandResponder(this);
			logger.debug("Now listening for SNMP traps on UDP port {}.", UDP_PORT);
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

			String receivedCommunity = new String(event.getSecurityName());

			if (communities.contains(receivedCommunity)) {
				Address address = event.getPeerAddress();
				if (address instanceof IpAddress) {
					InetAddress inetAddress = ((IpAddress) address).getInetAddress();
					if (inetAddress instanceof Inet4Address) {
						try {
							Network4Address source = new Network4Address(
									(Inet4Address) inetAddress, 32);
							Map<String, Object> data = new HashMap<>();
							for (VariableBinding var : event.getPDU().getVariableBindings()) {
								data.put(var.getOid().toDottedString(), var.getVariable().toString());
							}
							switch (event.getSecurityModel()) {
							case SecurityModel.SECURITY_MODEL_SNMPv1:
								data.put("version", "1");
								break;
							case SecurityModel.SECURITY_MODEL_SNMPv2c:
								data.put("version", "2c");
								break;
							default:
								data.put("version", "Unknown");
							}
							logger.debug("SNMP trap content: " + data);
							List<String> matchingDrivers = new ArrayList<>();
							for (DeviceDriver driver : DeviceDriver.getAllDrivers()) {
								if (driver.analyzeTrap(data, source)) {
									matchingDrivers.add(driver.getName());
								}
							}
							if (matchingDrivers.size() > 0) {
								TakeSnapshotTask.scheduleSnapshotIfNeeded(matchingDrivers, source);
							}
						}
						catch (Exception e) {
							logger.warn("Error on trap received from {}.", address, e);
						}
					}
				}
			}
			else {
				logger.warn("Invalid community {} (vs {}) received from {}.", receivedCommunity,
						String.join(" ", communities), event.getPeerAddress());
			}
		}
	}

}
