/**
 * Copyright 2013-2016 Sylvain Cadilhac (NetFishers)
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
	 * Instantiates a new snmp.
	 *
	 * @param address the address
	 * @param community the community
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public Snmp(NetworkAddress address, String community) throws IOException {
		this(address, community, false);
	}

	/**
	 * Instantiates a new snmp.
	 *
	 * @param address the address
	 * @param username the username
	 * @param password the password
	 */
	public Snmp(NetworkAddress address, String username, String password) {
		//TODO
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
	 * Gets the.
	 *
	 * @param oids the oids
	 * @return the response event
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public ResponseEvent get(OID oids[]) throws IOException {
		ResponseEvent event = snmp.send(getPDU(oids), target, null);
		if (event != null) {
			return event;
		}
		throw new RuntimeException("SNMP Get timed out");	  
	}


}
