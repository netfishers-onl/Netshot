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

package onl.netfishers.netshot;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.bridge.SLF4JBridgeHandler;

import ch.qos.logback.classic.Level;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
import onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity;
import onl.netfishers.netshot.device.credentials.DeviceSshAccount;
import onl.netfishers.netshot.device.credentials.DeviceTelnetAccount;


public class DeviceListExtractor extends Netshot {
	
	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(DeviceListExtractor.class);
	
	/**
	 * Initializes the logging.
	 *
	 * @return true, if successful
	 */
	protected static boolean initLogging() {
		// Redirect JUL to SLF4J
		SLF4JBridgeHandler.removeHandlersForRootLogger();
		SLF4JBridgeHandler.install();
		
		ch.qos.logback.classic.Logger rootLogger = (ch.qos.logback.classic.Logger)
				LoggerFactory.getLogger(ch.qos.logback.classic.Logger.ROOT_LOGGER_NAME);
		
		System.setProperty("org.jboss.logging.provider", "slf4j");
		rootLogger.setLevel(Level.WARN);

		return true;
	}
	
	/** Function entry point/ */
	public static void main(String[] args) {
		System.out.println("Netshot Device List Extractor -- extracts and formats device data.");
		System.out.println(String.format("Based on Netshot version %s.", Netshot.VERSION));
		logger.info("Starting now.");
		
		if (!Netshot.initConfig()) {
			System.exit(1);
		}
		if (!DeviceListExtractor.initLogging()) {
			System.exit(1);
		}
		
		StringBuffer output = new StringBuffer();

		try {
			logger.info("Initializing access to the database.");
			Database.init();
			
			logger.info("Requesting data from the DB...");
			Session session = Database.getSession();
			@SuppressWarnings("unchecked")
			List<Device> devices = session
				.createQuery("select d from Device d where d.status = :enabled")
				.setParameter("enabled", Device.Status.INPRODUCTION)
				.list();
			for (Device device : devices) {
				DeviceCliAccount cliAccount = null;
				DeviceSnmpCommunity community = null;
				
				for (DeviceCredentialSet credentialSet : device.getCredentialSets()) {
					if (credentialSet instanceof DeviceSshAccount) {
						cliAccount = (DeviceSshAccount) credentialSet;
					}
					else if (cliAccount == null && credentialSet instanceof DeviceTelnetAccount) {
						cliAccount = (DeviceTelnetAccount) credentialSet;
					}
					else if (credentialSet instanceof DeviceSnmpCommunity) {
						community = (DeviceSnmpCommunity) credentialSet;
					}
				}
				if (device.getSpecificCredentialSet() != null && device.getSpecificCredentialSet() instanceof DeviceCliAccount) {
					cliAccount = (DeviceCliAccount) device.getSpecificCredentialSet();
				}
				if (cliAccount == null) {
					logger.warn(String.format("No CLI account found for device %s.", device.getName()));
				}
				if (community == null) {
					logger.warn(String.format("No SNMP community found for device %s.", device.getName()));
				}
				List<String> fields = new ArrayList<>();
				fields.add(device.getMgmtAddress().getInetAddress().getHostAddress());		// Col. 1 = IP Address <<<
				fields.add(device.getName());			// Col. 2 = Host Name <<<
				fields.add("");							// Col. 3 = Domain Name
				fields.add("");							// Col. 4 = Device Identity
				fields.add("");							// Col. 5 = Display Name
				fields.add("");							// Col. 6 = SysObjectID
				fields.add("");							// Col. 7 = DCR Device Type
				fields.add("");							// Col. 8 = MDF Type
				fields.add(community == null ? "" : community.getCommunity());			// Col. 9 = SNMP RO <<<
				fields.add("");							// Col. 10 = SNMP RW
				fields.add("");							// Col. 11 = SNMPv3 User Name
				fields.add("");							// Col. 12 = SNMPv3 Auth Pass 
				fields.add("");							// Col. 13 = SNMPv3 Engine ID
				fields.add("");							// Col. 14 = SNMPv3 Auth Algorithm
				fields.add("");							// Col. 15 = RX Boot Mode User
				fields.add("");							// Col. 16 = RX Boot Mode Pass
				fields.add(cliAccount == null ? "" : cliAccount.getUsername());			// Col. 17 = Primary User <<<
				fields.add(cliAccount == null ? "" : cliAccount.getPassword());			// Col. 18 = Primary Pass <<<
				fields.add(cliAccount == null ? "" : cliAccount.getSuperPassword());	// Col. 19 = Primary Enable Pass <<<
				fields.add("");							// Col. 20 = HTTP User
				fields.add("");							// Col. 21 = HTTP Pass
				fields.add("");							// Col. 22 = HTTP Mode
				fields.add("");							// Col. 23 = HTTP Port
				fields.add("");							// Col. 24 = HTTPS Port
				fields.add("");							// Col. 25 = Cert Common Name
				fields.add("");							// Col. 26 = Secondary User
				fields.add("");							// Col. 27 = Secondary Pass
				fields.add("");							// Col. 28 = Secondary Enable Pass
				fields.add("");							// Col. 29 = Secondary HTTP User
				fields.add("");							// Col. 30 = Secondary HTTP Pass
				fields.add("");							// Col. 31 = SNMPv3 Priv Algo
				fields.add("");							// Col. 32 = SNMPv3 Priv Pass
				fields.add("");							// Col. 33 = User Field 1
				fields.add("");							// Col. 34 = User Field 2
				fields.add("");							// Col. 35 = User Field 3
				fields.add("");							// Col. 36 = User Field 4
				output.append(String.join(";", fields));
				output.append("\n");
			}
			System.out.println(output);
			
		}
		catch (Exception e) {
			System.err.println("NETSHOT FATAL ERROR: " + e.getMessage());
			System.exit(1);
		}
	}

}
