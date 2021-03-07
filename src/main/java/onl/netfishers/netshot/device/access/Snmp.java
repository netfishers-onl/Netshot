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
package onl.netfishers.netshot.device.access;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import onl.netfishers.netshot.device.NetworkAddress;
import onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity;
import onl.netfishers.netshot.device.credentials.DeviceSnmpv1Community;
import onl.netfishers.netshot.device.credentials.DeviceSnmpv2cCommunity;
import onl.netfishers.netshot.device.credentials.DeviceSnmpv3Community;

import org.snmp4j.CommunityTarget;
import org.snmp4j.UserTarget;
import org.snmp4j.security.SecurityLevel;
import org.snmp4j.security.AuthMD5;
import org.snmp4j.security.AuthSHA;
import org.snmp4j.security.Priv3DES;
import org.snmp4j.security.PrivAES128;
import org.snmp4j.security.PrivAES192;
import org.snmp4j.security.PrivAES256;
import org.snmp4j.security.USM;
import org.snmp4j.ScopedPDU;
import org.snmp4j.mp.MPv3;
import org.snmp4j.security.UsmUser;
import org.snmp4j.security.SecurityProtocols;
import org.snmp4j.security.SecurityModels;
import org.snmp4j.PDU;
import org.snmp4j.Target;
import org.snmp4j.event.ResponseEvent;
import org.snmp4j.mp.SnmpConstants;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.OctetString;
import org.snmp4j.smi.UdpAddress;
import org.snmp4j.smi.VariableBinding;
import org.snmp4j.transport.DefaultUdpTransportMapping;
import org.snmp4j.util.DefaultPDUFactory;
import org.snmp4j.util.TreeEvent;
import org.snmp4j.util.TreeUtils;
import org.snmp4j.TransportMapping;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * A SNMP poller class, to poll data from a device via SNMP.
 */
public class Snmp extends Poller {

	/** The snmp. */
	private org.snmp4j.Snmp snmp;

	/** The target. */
	private Target target;

	/** The port. */
	private static int PORT = 161;

	/** SNMPv3 auth protocol */
	private OID authProtocol; 

	/** SNMPv3 priv protocol */
	private OID privProtocol; 	
	
	final private static Logger logger = LoggerFactory.getLogger(Snmp.class);

	/**
	 * Instantiates a new SNMP object based on a target address and a Netshot community.
	 * @param address The target
	 * @param community The SNMP credentials
	 * @throws IOException it can happen
	 */
	public Snmp(NetworkAddress address, DeviceSnmpCommunity community) throws IOException {
		if (community instanceof DeviceSnmpv1Community) {
			this.target = new CommunityTarget(new UdpAddress(address.getInetAddress(), PORT), new OctetString(community.getCommunity()));
			this.target.setVersion(SnmpConstants.version1);
			start();
		}
		else if (community instanceof DeviceSnmpv2cCommunity) {
			this.target = new CommunityTarget(new UdpAddress(address.getInetAddress(), PORT), new OctetString(community.getCommunity()));
			this.target.setVersion(SnmpConstants.version2c);
			start();
		}
		else if (community instanceof DeviceSnmpv3Community) {
			DeviceSnmpv3Community v3Credentials = (DeviceSnmpv3Community)community;
			// Prepare target
			logger.debug("Prepare SNMPv3 context");
			this.target = new UserTarget();
			this.target.setTimeout(5000);
			this.target.setVersion(SnmpConstants.version3);
			this.target.setAddress(new UdpAddress(address.getInetAddress(), PORT));
			if (v3Credentials.getAuthKey() == null) {
				this.target.setSecurityLevel(SecurityLevel.NOAUTH_NOPRIV);
			}
			else if (v3Credentials.getPrivKey() == null) {
				this.target.setSecurityLevel(SecurityLevel.AUTH_NOPRIV);
			}
			else {
				this.target.setSecurityLevel(SecurityLevel.AUTH_PRIV);
			}
			this.target.setSecurityName(new OctetString(v3Credentials.getUsername()));

			// Prepare transport
			logger.debug("Auth Protocol called: {}", v3Credentials.getAuthType());
			if (v3Credentials.getAuthType().equals("SHA")) {
				this.authProtocol = AuthSHA.ID;
				logger.debug("Using SHA Auth");
			}
			else {
				this.authProtocol = AuthMD5.ID;
			}

			if (v3Credentials.getPrivType().equals("AES128")) {
				this.privProtocol = PrivAES128.ID;
			}
			else if (v3Credentials.getPrivType().equals("AES192")) {
				this.privProtocol = PrivAES192.ID;
			}
			else if (v3Credentials.getPrivType().equals("AES256")) {
				this.privProtocol = PrivAES256.ID;
			}
			else {
				this.privProtocol = Priv3DES.ID;
			}

			USM usm = new USM(SecurityProtocols.getInstance(), new OctetString(MPv3.createLocalEngineID()), 0);
			usm.addUser(
				new OctetString(v3Credentials.getUsername()),
				new UsmUser(
					new OctetString(v3Credentials.getUsername()), this.authProtocol,
					new OctetString(v3Credentials.getAuthKey()), this.privProtocol,
					new OctetString(v3Credentials.getPrivKey())));
			SecurityModels.getInstance().addSecurityModel(usm);

			start();
		}
	}

	/**
	 * Instantiates a new snmp.
	 *
	 * @param address the address
	 * @param community the community
	 * @param v1 the v1
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public Snmp(NetworkAddress address, String community, boolean v1) throws IOException {
		this.target = new CommunityTarget(new UdpAddress(address.getInetAddress(), PORT), new OctetString(community));
		this.target.setVersion(v1 ? SnmpConstants.version1 : SnmpConstants.version2c);
		start();
	}

	/**
	 * Start.
	 *
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	private void start() throws IOException {
		TransportMapping<UdpAddress> transport = new DefaultUdpTransportMapping();
		this.snmp = new org.snmp4j.Snmp(transport);
		transport.listen();
	}

	/**
	 * Stop.
	 *
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public void stop() throws IOException {
		snmp.close();
	}

	/**
	 * Gets the as string.
	 *
	 * @param oid the oid
	 * @return the as string
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public String getAsString(OID oid) throws IOException {
		ResponseEvent event = get(new OID[]{oid});
		PDU response = event.getResponse();
		if (response == null || response.size() == 0) {
			throw new IOException("No SNMP response.");
		}
		if (response.size() < 1) {
			throw new IOException("Empty SNMP response");
		}
		if (response.get(0).isException()) {
			throw new IOException("SNMP error: " + response.get(0).toValueString());
		}
		return response.get(0).getVariable().toString();
	}

	/**
	 * Gets the as string.
	 *
	 * @param oid the oid
	 * @return the as string
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public String getAsString(String oid) throws IOException {
		return getAsString(new OID(oid));
	}


	/**
	 * Gets the pdu.
	 *
	 * @param oids the oids
	 * @return the pdu
	 */
	private PDU getPDU(OID oids[]) {
		PDU pdu = new PDU();
		for (OID oid : oids) {
			pdu.add(new VariableBinding(oid));
		}
		pdu.setType(PDU.GET);
		return pdu;
	}

	/**
	 * Gets the scoped pdu.
	 * 
	 * @param oids the oids
	 * @return the scoped pdu
	 */

	private ScopedPDU getScopedPDU(OID oids[]) {
		ScopedPDU scopedPdu = new ScopedPDU();
		for (OID oid : oids) {
			scopedPdu.add(new VariableBinding(oid));
		}
		scopedPdu.setType(PDU.GET);
		return scopedPdu;
	}

	/**
	 * Gets the a response.
	 *
	 * @param oids the oids
	 * @return the response event
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public ResponseEvent get(OID oids[]) throws IOException {
		ResponseEvent event;
		if (this.target.getVersion() == SnmpConstants.version3) {
			event = snmp.send(getScopedPDU(oids), target, null);
		}
		else {
			event = snmp.send(getPDU(oids), target, null);
		}
		if (event != null) {
			return event;
		}
		throw new RuntimeException("SNMP Get timed out");
	}


	/**
	 * Walk over a subtree
	 * @param oid The base OID
	 * @return a map of OIDs -> values
	 */
	public Map<String, String> walkAsString(String oid) throws IOException {
		Map<String, String> results = new TreeMap<String, String>();
		TreeUtils treeUtils = new TreeUtils(snmp, new DefaultPDUFactory());
		List<TreeEvent> events = treeUtils.getSubtree(target, new OID(oid));
		if (events != null) {
			for (TreeEvent event : events) {
				if (event == null || event.isError()) {
					continue;
				}
				VariableBinding[] varBindings = event.getVariableBindings();
				if (varBindings != null) {
					for (VariableBinding varBinding : varBindings) {
						if (varBinding != null) {
							results.put(varBinding.getOid().toString(), varBinding.getVariable().toString());
						}
					}
				}
			}
		}
		return results;
	}

}
