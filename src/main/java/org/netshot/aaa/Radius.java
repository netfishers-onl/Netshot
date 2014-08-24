/*
 * Copyright Sylvain Cadilhac 2013
 */

package org.netshot.aaa;

import java.io.IOException;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;

import org.netshot.Netshot;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import net.jradius.client.RadiusClient;
import net.jradius.client.auth.MSCHAPv2Authenticator;
import net.jradius.dictionary.Attr_NASPort;
import net.jradius.dictionary.Attr_NASPortType;
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
	
	/** The clients. */
	private static List<RadiusClient> clients = new ArrayList<RadiusClient>();
	
	/**
	 * Load server config.
	 *
	 * @param id the id
	 */
	private static void loadServerConfig(int id) {
		String path = String.format("netshot.auth.radiusserver%d", id);
		String ip = Netshot.getConfig(path + ".ip", ".");
		InetAddress address;
		try {
	    address = InetAddress.getByName(ip);
    }
    catch (Exception e) {
	    logger.error("Invalid IP address for RADIUS server {}. Will be ignored.", id);
	    return;
    }
		int port = 1812;
		try {
	    port = Integer.parseInt(Netshot.getConfig(path + ".port", "1812"));
    }
    catch (NumberFormatException e) {
    	logger.error("Invalid port number for RADIUS server {}. Will be ignored.", id);
	    return;
    }
		String key = Netshot.getConfig(path + ".key");
		if (key == null) {
			logger.error("No key configured for RADIUS server {}. Will be ignored.", id);
			return;
		}
		RadiusClient client;
    try {
	    client = new RadiusClient(address, key, port, 1813, 5);
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
	
	/**
	 * Authenticates a user.
	 *
	 * @param username the username
	 * @param password the password
	 * @return true, if successful
	 */
	public static boolean authenticate(String username, String password) {
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
	    	}
	    	else if (reply instanceof AccessAccept) {
	    		return true;
	    	}
	    	else {
	    		return false;
	    	}
      }
      catch (Exception e) {
	      logger.error("Error while authenticating against RADIUS server {}.",
	      		radiusClient.getRemoteInetAddress().toString());
      }
    }
    
    return false;
	}

}
