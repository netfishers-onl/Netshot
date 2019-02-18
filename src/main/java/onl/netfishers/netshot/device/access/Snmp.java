/**
 * Copyright 2013-2019 Sylvain Cadilhac (NetFishers)
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

import onl.netfishers.netshot.device.NetworkAddress;

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
	
	private static Logger logger = LoggerFactory.getLogger(Snmp.class);

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
	 * Instantiates a new SNMPv1/2 access.
	 *
	 * @param address the address
	 * @param community the community
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public Snmp(NetworkAddress address, String community) throws IOException {
		this(address, community, false);
	}


	/**
	 * Instantiates a new SNMPv3 access.
	 * @param address the IP address
	 * @param username the SNMP username
	 * @param authType the SNMP authType
	 * @param authKey the SNMP authKey
	 * @param privType the SNMP privType
	 * @param privKey The SNMP privKey
	 * @throws IOException if something went wrong
	 */
	public Snmp(NetworkAddress address, String username, String authType, String authKey, String privType, String privKey)
			throws IOException {
		// TODO
		// AuthSHA.ID AuthMD5.ID
		// AuthHMAC128SHA224.ID AuthHMAC192SHA256.ID AuthHMAC256SHA384.ID
		// AuthHMAC384SHA512.ID
		// Priv3DES.ID PrivAES128.ID PrivAES192.ID PrivAES256.ID
		// AUTH_NOPRIV AUTH_PRIV NOAUTH_NOPRIV

		// Prepare target
		logger.debug("Prepare SNMPv3 context");
		this.target = new UserTarget();
		this.target.setTimeout(5000);
		this.target.setVersion(SnmpConstants.version3);
		this.target.setAddress(new UdpAddress(address.getInetAddress(), PORT));
		if (authKey == null) {
			this.target.setSecurityLevel(SecurityLevel.NOAUTH_NOPRIV);
		}
		else if (privKey == null) {
			this.target.setSecurityLevel(SecurityLevel.AUTH_NOPRIV);
		}
		else {
			this.target.setSecurityLevel(SecurityLevel.AUTH_PRIV);
		}
		this.target.setSecurityName(new OctetString(username));

		// Prepare transport
		logger.debug("Auth Protocol called: {}", authType);
		if (authType.equals("SHA")) {
			this.authProtocol = AuthSHA.ID;
			logger.debug("Using SHA Auth");
		}
		else {
			this.authProtocol = AuthMD5.ID;
		}

		if (privType.equals("AES128")) {
			this.privProtocol = PrivAES128.ID;
		}
		else if (privType.equals("AES192")) {
			this.privProtocol = PrivAES192.ID;
		}
		else if (privType.equals("AES256")) {
			this.privProtocol = PrivAES256.ID;
		}
		else {
			this.privProtocol = Priv3DES.ID;
		}

		USM usm = new USM(SecurityProtocols.getInstance(), new OctetString(MPv3.createLocalEngineID()), 0);
		usm.addUser(new OctetString(username), new UsmUser(new OctetString(username), this.authProtocol,
				new OctetString(authKey), this.privProtocol, new OctetString(privKey)));
		SecurityModels.getInstance().addSecurityModel(usm);

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


}
