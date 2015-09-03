/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */

package onl.netfishers.netshot.aaa;

import java.io.IOException;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;

import onl.netfishers.netshot.Netshot;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

import net.jradius.client.RadiusClient;
import net.jradius.client.auth.MSCHAPv2Authenticator;
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
	private static Logger logger = LoggerFactory.getLogger(Radius.class);
	private static Logger aaaLogger = LoggerFactory.getLogger("AAA");

	/** The clients. */
	private static List<RadiusClient> clients = new ArrayList<RadiusClient>();

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
		catch (Exception e) {
			logger.error("Invalid IP address for RADIUS server {}. Will be ignored.", id);
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
			logger.error("Unable to create the RADIUS client for server {}", id, e);
			return;
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
	public static User authenticate(String username, String password) {
		if (!isAvailable()) {
			return null;
		}
		AttributeList attributeList = new AttributeList();
		attributeList.add(new Attr_UserName(username));
		attributeList.add(new Attr_NASPortType(Attr_NASPortType.Ethernet));
		attributeList.add(new Attr_NASPort(new Long(1)));

		for (RadiusClient radiusClient : clients) {
			AccessRequest request = new AccessRequest(radiusClient, attributeList);
			request.addAttribute(new Attr_UserPassword(password));
			RadiusResponse reply;
			try {
				reply = radiusClient.authenticate(request, new MSCHAPv2Authenticator(), 3);
				if (reply == null) {
					logger.error("Request to RADIUS server {} timed out.", radiusClient.getRemoteInetAddress().toString());
					aaaLogger.error(MarkerFactory.getMarker("AAA"), "Request to RADIUS server {} timed out.",
							radiusClient.getRemoteInetAddress().toString());
				}
				else if (reply instanceof AccessAccept) {
					int level = User.LEVEL_READONLY;
					try {
						Long serviceType = (Long) reply.getAttributeValue(Attr_ServiceType.TYPE);
						if (Attr_ServiceType.AdministrativeUser.equals(serviceType)) {
							level = User.LEVEL_ADMIN;
						}
						else if (Attr_ServiceType.NASPromptUser.equals(serviceType)) {
							level = User.LEVEL_READWRITE;
						}
					}
					catch (Exception e1) {
					}
					aaaLogger.info(MarkerFactory.getMarker("AAA"), "The user {} passed authentication on RADIUS server {} (with permission level {}).",
							username, radiusClient.getRemoteInetAddress().toString(), level);
					User user = new User(username, level);
					return user;
				}
				else {
					aaaLogger.info(MarkerFactory.getMarker("AAA"), "The user {} failed authentication on RADIUS server {}.",
							username, radiusClient.getRemoteInetAddress().toString());
					return null;
				}
			}
			catch (Exception e) {
				logger.error("Error while authenticating against RADIUS server {}.",
						radiusClient.getRemoteInetAddress().toString());
			}
		}
		return null;
	}

}
