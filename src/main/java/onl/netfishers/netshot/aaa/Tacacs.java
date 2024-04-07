/**
 * Copyright 2013-2024 Netshot
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
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeoutException;

import com.augur.tacacs.Argument;
import com.augur.tacacs.AuthenReply;
import com.augur.tacacs.AuthorReply;
import com.augur.tacacs.SessionClient;
import com.augur.tacacs.TAC_PLUS.AUTHEN.METH;
import com.augur.tacacs.TAC_PLUS.AUTHEN.SVC;
import com.augur.tacacs.TAC_PLUS.AUTHEN.TYPE;

import lombok.extern.slf4j.Slf4j;

import com.augur.tacacs.TAC_PLUS.ACCT;
import com.augur.tacacs.TAC_PLUS.PRIV_LVL;
import com.augur.tacacs.TacacsClient;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.device.NetworkAddress;

/**
 * The Tacacs class authenticates the users against a TACACS+ server.
 */
@Slf4j
public class Tacacs {

	/** The log. */
	final private static Logger aaaLogger = LoggerFactory.getLogger("AAA");

	/** The client. */
	private static TacacsClient client = null;

	/** Whether TACACS+ accounting is enabled */
	private static boolean enableAccounting = false;

	/**
	 * Load server config.
	 *
	 * @param id the id
	 */
	private static void loadServerConfig(int id, List<String> hosts, List<String> keys) {
		String path = String.format("netshot.aaa.tacacs%d", id);
		String ip = Netshot.getConfig(path + ".ip");
		if (ip == null) {
			return;
		}
		InetAddress address;
		try {
			address = InetAddress.getByName(ip);
		}
		catch (Exception e) {
			if (ip != null) {
				log.error("Invalid IP address for TACACS+ server {}. Will be ignored.", id);
			}
			return;
		}
		int port = Netshot.getConfig(path + ".port", 49, 1, 65535);
		String key = Netshot.getConfig(path + ".secret");
		if (key == null) {
			log.error("No key configured for TACACS+ server {}. Will be ignored.", id);
			return;
		}
		hosts.add(String.format("%s:%d", address.getHostAddress(), port));
		keys.add(key);
		log.info("Added TACACS+ server {}", address.getHostAddress());
	}

	/**
	 * Load the config of all servers (up to 4) from the config file.
	 */
	public static void loadAllServersConfig() {
		List<String> hosts = new ArrayList<>();
		List<String> keys = new ArrayList<>();
		for (int i = 1; i < 4; i++) {
			loadServerConfig(i, hosts, keys);
		}
		int timeout = Netshot.getConfig("netshot.aaa.tacacs.timeout", 5, 1, 300);
		if (hosts.size() > 0) {
			Tacacs.client = new TacacsClient(String.join(", ", hosts), String.join(", ", keys), timeout * 1000, false);
		}
		enableAccounting = Netshot.getConfig("netshot.aaa.tacacs.accounting", false);
		if (enableAccounting) {
			log.info("TACACS+ accounting is enabled");
		}
	}
	
	public static boolean isAvailable() {
		return Tacacs.client != null;
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

		try {
			SessionClient authenSession = client.newSession(SVC.LOGIN, "rest", remoteAddress == null ? "0.0.0.0" : remoteAddress.getIp(), PRIV_LVL.USER.code());
			AuthenReply authenReply = authenSession.authenticate_ASCII(username, password);

			String roleAttribute = Netshot.getConfig("netshot.aaa.tacacs.role.attributename", "role");
			String adminLevelRole = Netshot.getConfig("netshot.aaa.tacacs.role.adminlevelrole", "admin");
			String executeReadWriteLevelRole = Netshot.getConfig("netshot.aaa.tacacs.role.executereadwritelevelrole", "execute-read-write");
			String readWriteLevelRole = Netshot.getConfig("netshot.aaa.tacacs.role.readwritelevelrole", "read-write");
			String operatorLevelRole = Netshot.getConfig("netshot.aaa.tacacs.role.operatorrole", "operator");

			if (authenReply.isOK()) {
				SessionClient authoSession = client.newSession(SVC.LOGIN, "rest", remoteAddress == null ? "0.0.0.0" : remoteAddress.getIp(), PRIV_LVL.USER.code());
				AuthorReply authoReply = authoSession.authorize(
					username,
					METH.TACACSPLUS,
					TYPE.ASCII,
					SVC.LOGIN,
					new Argument[] { new Argument("service=netshot-rest") }
				);
				if (authoReply.isOK()) {
					int level = UiUser.LEVEL_READONLY;
					String role = authoReply.getValue(roleAttribute);
					aaaLogger.debug(MarkerFactory.getMarker("AAA"), "The TACACS+ server returned role: {}", role);

					if (role == null) {
						aaaLogger.warn("No role returned from the TACACS+ server for user {} using the {} attribute, user will be read only", username, roleAttribute);
					}
					else if(role.equals(adminLevelRole)) {
						level = UiUser.LEVEL_ADMIN;
					}
					else if (role.equals(executeReadWriteLevelRole)) {
						level = UiUser.LEVEL_EXECUTEREADWRITE;
					}
					else if (role.equals(readWriteLevelRole)) {
						level = UiUser.LEVEL_READWRITE;
					}
					else if (role.equals(operatorLevelRole)) {
						level = UiUser.LEVEL_OPERATOR;
					}

					aaaLogger.info(MarkerFactory.getMarker("AAA"), "The user {} passed TACACS+ authentication (with permission level {}).",
							username, level);
					UiUser user = new UiUser(username, level);
					return user;
				}
				else {
					// Authorization failed
					if (authoReply.getData() != null) {
						aaaLogger.info(MarkerFactory.getMarker("AAA"), "The user {} failed TACACS+ authorization. Server data: {}.",
								username, authoReply.getData());
					}
					else if (authoReply.getServerMsg() != null) {
						aaaLogger.info(MarkerFactory.getMarker("AAA"), "The user {} failed TACACS+ authorization. Server message: {}.",
								username, authoReply.getServerMsg());
					}
					else {
						aaaLogger.info(MarkerFactory.getMarker("AAA"), "The user {} failed TACACS+ authorization.", username);
					}
				}
			}
			else {
				// Authentication failed
				if (authenReply.getData() != null) {
					aaaLogger.info(MarkerFactory.getMarker("AAA"), "The user {} failed TACACS+ authentication. Server data: {}.",
							username, authenReply.getData());
				}
				else if (authenReply.getServerMsg() != null) {
					aaaLogger.info(MarkerFactory.getMarker("AAA"), "The user {} failed TACACS+ authentication. Server message: {}.",
							username, authenReply.getServerMsg());
				}
				else {
					aaaLogger.info(MarkerFactory.getMarker("AAA"), "The user {} failed TACACS+ authentication.", username);
				}
			}
		}
		catch (Exception e) {
			log.error("Error while authenticating against RADIUS server.", e);
		}
		finally {
			client.shutdown();
		}
		return null;
	}

	/**
	 * Log a message with TACACS+ accounting.
	 */
	public static void account(String method, String path, String username, String response, NetworkAddress remoteAddress) {
		if (!Tacacs.enableAccounting || !Tacacs.isAvailable()) {
			return;
		}
		SessionClient acctSession = client.newSession(SVC.LOGIN, "rest", remoteAddress == null ? "0.0.0.0" : remoteAddress.getIp(), PRIV_LVL.USER.code());
		try {
			acctSession.account(ACCT.FLAG.STOP.code(), username, METH.TACACSPLUS, TYPE.ASCII, SVC.LOGIN, new Argument[] {
				new Argument(String.format("%s %s => %s", method, path, response))
			});
		}
		catch (TimeoutException | IOException e) {
			log.warn("Error while sending TACACS+ accounting message", e);
		}
	}
}
