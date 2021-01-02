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

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

import org.hibernate.annotations.NaturalId;
import org.jasypt.util.password.BasicPasswordEncryptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The User class represents a Netshot user.
 */
@Entity(name = "\"user\"")
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class UiUser implements User {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(UiUser.class);

	/** The max idle time. */
	public static int MAX_IDLE_TIME;

	/** Netshot Server Version *. */
	private String serverVersion = Netshot.VERSION;

	/** The password encryptor. */
	private static BasicPasswordEncryptor passwordEncryptor = new BasicPasswordEncryptor();

	static {
		try {
			MAX_IDLE_TIME = Integer.parseInt(Netshot.getConfig("netshot.aaa.maxidletime", "1800"));
			if (MAX_IDLE_TIME < 30) {
				throw new IllegalArgumentException();
			}
		}
		catch (Exception e) {
			MAX_IDLE_TIME = 1800;
			logger.error("Invalid value for AAA max idle timeout (netshot.aaa.maxidletime), using {}s.", MAX_IDLE_TIME);
		}
	}


	/** The id. */
	private long id;

	/** The local. */
	private boolean local;

	/** The hashed password. */
	private String hashedPassword;

	/** The username. */
	private String username;

	/** The level. */
	private int level = User.LEVEL_ADMIN;

	/**
	 * Instantiates a new user.
	 */
	protected UiUser() {

	}

	/**
	 * Instantiates a new user.
	 *
	 * @param username the username
	 * @param local the local
	 * @param password the password
	 */
	public UiUser(String username, boolean local, String password) {
		this.username = username;
		this.local = local;
		this.setPassword(password);
	}

	public UiUser(String name, int level) {
		this.username = name;
		this.level = level;
		this.local = false;
	}

	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@XmlElement
	@JsonView(DefaultView.class)
	public long getId() {
		return id;
	}

	/**
	 * Sets the id.
	 *
	 * @param id the new id
	 */
	public void setId(long id) {
		this.id = id;
	}

	/**
	 * Checks if is local.
	 *
	 * @return true, if is local
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public boolean isLocal() {
		return local;
	}

	/**
	 * Sets the local.
	 *
	 * @param local the new local
	 */
	public void setLocal(boolean local) {
		this.local = local;
	}

	/**
	 * Gets the hashed password.
	 *
	 * @return the hashed password
	 */
	public String getHashedPassword() {
		return hashedPassword;
	}

	/**
	 * Sets the hashed password.
	 *
	 * @param hashedPassword the new hashed password
	 */
	public void setHashedPassword(String hashedPassword) {
		this.hashedPassword = hashedPassword;
	}

	/**
	 * Sets the password.
	 *
	 * @param password the new password
	 */
	public void setPassword(String password) {
		this.setHashedPassword(this.hash(password));
	}

	/**
	 * Check password.
	 *
	 * @param password the password
	 * @return true, if successful
	 */
	public boolean checkPassword(String password) {
		return passwordEncryptor.checkPassword(password, hashedPassword);
	}

	/**
	 * Hash.
	 *
	 * @param password the password
	 * @return the string
	 */
	private String hash(String password) {
		return passwordEncryptor.encryptPassword(password);
	}

	/**
	 * Gets the username.
	 *
	 * @return the username
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@NaturalId(mutable = true)
	public String getUsername() {
		return username;
	}

	/**
	 * Sets the username.
	 *
	 * @param username the new username
	 */
	public void setUsername(String username) {
		this.username = username;
	}

	/* (non-Javadoc)
	 * @see java.security.Principal#getName()
	 */
	@Override
	@Transient
	public String getName() {
		return username;
	}

	/**
	 * Gets the level.
	 *
	 * @return the level
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public int getLevel() {
		return level;
	}

	/**
	 * Sets the level.
	 *
	 * @param level the new level
	 */
	public void setLevel(int level) {
		this.level = level;
	}

	/**
	 * Gets the server version
	 * Placed here to send the version to the client along with the user details
	 *
	 * @return the server version
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Transient
	public String getServerVersion() {
		return serverVersion;
	}

	/**
	 * Sets the server version.
	 *
	 * @param serverVersion the new server version
	 */
	public void setServerVersion(String serverVersion) {
		this.serverVersion = serverVersion;
	}

	@Transient
	@XmlElement
	@JsonView(DefaultView.class)
	public int getMaxIdleTimout() {
		return UiUser.MAX_IDLE_TIME;
	}

	@Override
	public String toString() {
		return "User " + id + " (username '" + username + "', level " + level + (local ? "" : ", remote user") + ")";
	}

}
