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
package onl.netfishers.netshot.aaa;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.device.NetworkAddress;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

import net.jradius.client.RadiusClient;
import net.jradius.client.auth.CHAPAuthenticator;
import net.jradius.client.auth.EAPMD5Authenticator;
import net.jradius.client.auth.EAPMSCHAPv2Authenticator;
import net.jradius.client.auth.MSCHAPv2Authenticator;
import net.jradius.client.auth.PAPAuthenticator;
import net.jradius.client.auth.RadiusAuthenticator;
import net.jradius.dictionary.Attr_CallingStationId;
import net.jradius.dictionary.Attr_NASPort;
import net.jradius.dictionary.Attr_NASPortType;
import net.jradius.dictionary.Attr_ServiceType;
import net.jradius.dictionary.Attr_UserName;
import net.jradius.dictionary.Attr_UserPassword;
import net.jradius.packet.AccessAccept;
import net.jradius.packet.AccessRequest;
import net.jradius.packet.RadiusResponse;
import net.jradius.packet.attribute.AttributeFactory;
import net.jradius.packet.attribute.AttributeList;

/**
 * The Radius class authenticates the users against a RADIUS server.
 */
public class Radius {

	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(Radius.class);
	final private static Logger aaaLogger = LoggerFactory.getLogger("AAA");

	/** The clients. */
	final private static List<RadiusClient> clients = new ArrayList<>();
	
	/** The authentication method. */
	private static Class<? extends RadiusAuthenticator> authMethod = MSCHAPv2Authenticator.class;

	/**
	 * Load server config.
	 *
	 * @param id the id
	 */
	private static void loadServerConfig(int id) {
		String path = String.format("netshot.aaa.radius%d", id);
		String ip = Netshot.getConfig(path + ".ip", ".");
		InetAddress address;
		try {
			address = InetAddress.getByName(ip);
		}
		catch (UnknownHostException e) {
			if (ip != null) {
				logger.error("Invalid IP address for RADIUS server {}. Will be ignored.", id);
			}
			return;
		}
		int authPort = 1812;
		try {
			authPort = Integer.parseInt(Netshot.getConfig(path + ".authport", "1812"));
		}
		catch (NumberFormatException e) {
			logger.error("Invalid authentication port number for RADIUS server {}. Will use {}.", id, authPort);
		}
		int acctPort = 1813;
		try {
			acctPort = Integer.parseInt(Netshot.getConfig(path + ".acctport", "1813"));
		}
		catch (NumberFormatException e) {
			logger.error("Invalid accounting port number for RADIUS server {}. Will use {}.", id, acctPort);
		}
		int timeout = 5;
		try {
			timeout = Integer.parseInt(Netshot.getConfig(path + ".timeout", "5"));
		}
		catch (NumberFormatException e) {
			logger.error("Invalid timeout value for RADIUS server {}. Will use {}.", id, timeout);
		}
		String key = Netshot.getConfig(path + ".secret");
		if (key == null) {
			logger.error("No key configured for RADIUS server {}. Will be ignored.", id);
			return;
		}
		RadiusClient client;
		try {
			client = new RadiusClient(address, key, authPort, acctPort, timeout);
		}
		catch (IOException e) {
			logger.error("Unable to create the RADIUS client for server {}.", id, e);
			return;
		}
		String method = Netshot.getConfig("netshot.aaa.radius.method", "mschapv2");
		switch (method) {
		case "pap":
			authMethod = PAPAuthenticator.class;
			break;
		case "chap":
			authMethod = CHAPAuthenticator.class;
			break;
		case "eap-md5":
			authMethod = EAPMD5Authenticator.class;
			break;
		case "eap-mschapv2":
			authMethod = EAPMSCHAPv2Authenticator.class;
			break;
		case "mschapv2":
			break;
		default:
			logger.error("Invalid configured RADIUS method '{}'. Defaulting to MSCHAPv2.", method);
		}
		clients.add(client);
	}

	static {
		AttributeFactory.loadAttributeDictionary("net.jradius.dictionary.AttributeDictionaryImpl");
		for (int i = 1; i < 4; i++) {
			loadServerConfig(i);
		}
	}
	
	public static boolean isAvailable() {
		return clients.size() > 0;
	}

	/**
	 * Authenticates a user.
	 *
	 * @param username the username
	 * @param password the password
	 * @return true, if successful
	 */
	public static UiUser authenticate(String username, String password, NetworkAddress remoteAddress) {
		if (!isAvailable()) {
			return null;
		}
		AttributeList attributeList = new AttributeList();
		attributeList.add(new Attr_UserName(username));
		attributeList.add(new Attr_NASPortType(Attr_NASPortType.Ethernet));
		attributeList.add(new Attr_NASPort(1));
		if (remoteAddress != null) {
			attributeList.add(new Attr_CallingStationId(remoteAddress.getIp()));
		}

		boolean first = true;
		for (RadiusClient radiusClient : clients) {
			AccessRequest request = new AccessRequest(radiusClient, attributeList);
			request.addAttribute(new Attr_UserPassword(password));
			RadiusResponse reply;
			try {
				reply = radiusClient.authenticate(request, authMethod.getDeclaredConstructor().newInstance(), 3);
				if (reply == null) {
					logger.error("Request to RADIUS server {} timed out.", radiusClient.getRemoteInetAddress().toString());
					aaaLogger.error(MarkerFactory.getMarker("AAA"), "Request to RADIUS server {} timed out.",
							radiusClient.getRemoteInetAddress().toString());
				}
				else {
					// We got a reply
					if (!first) {
						clients.remove(radiusClient);
						clients.add(0, radiusClient);
					}
					if (reply instanceof AccessAccept) {
						int level = UiUser.LEVEL_READONLY;
						try {
							Long serviceType = (Long) reply.getAttributeValue(Attr_ServiceType.TYPE);
							if (Attr_ServiceType.AdministrativeUser.equals(serviceType)) {
								level = UiUser.LEVEL_ADMIN;
							}
							else if (Attr_ServiceType.OutboundUser.equals(serviceType)) {
								level = UiUser.LEVEL_EXECUTEREADWRITE;
							}
							else if (Attr_ServiceType.NASPromptUser.equals(serviceType)) {
								level = UiUser.LEVEL_READWRITE;
							}
						}
						catch (Exception e1) {
						}
						aaaLogger.info(MarkerFactory.getMarker("AAA"), "The user {} passed authentication on RADIUS server {} (with permission level {}).",
								username, radiusClient.getRemoteInetAddress().toString(), level);
						UiUser user = new UiUser(username, level);
						return user;
					}
					else {
						aaaLogger.info(MarkerFactory.getMarker("AAA"), "The user {} failed authentication on RADIUS server {}.",
								username, radiusClient.getRemoteInetAddress().toString());
						return null;
					}
				}
			}
			catch (Exception e) {
				logger.error("Error while authenticating against RADIUS server {}.",
						radiusClient.getRemoteInetAddress().toString(), e);
			}
			first = false;
		}
		return null;
	}

}
