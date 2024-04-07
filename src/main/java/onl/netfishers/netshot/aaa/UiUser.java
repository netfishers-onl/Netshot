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

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

import org.hibernate.annotations.NaturalId;
import org.jasypt.util.password.BasicPasswordEncryptor;

/**
 * The User class represents a Netshot user.
 */
@Entity(name = "\"user\"")
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@Table(indexes = {
		@Index(name = "usernameIndex", columnList = "username") 
})
public class UiUser implements User {

	/** The max idle time. */
	public static int MAX_IDLE_TIME;

	/** The password encryptor. */
	private static BasicPasswordEncryptor passwordEncryptor = new BasicPasswordEncryptor();

	static {
		UiUser.MAX_IDLE_TIME = Netshot.getConfig("netshot.aaa.maxidletime", 1800, 30, Integer.MAX_VALUE);
	}


	/** The id. */
	@Getter(onMethod=@__({
		@Id,
		@GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private long id;

	/** The local. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private boolean local;

	/** The hashed password. */
	@Getter
	@Setter
	private String hashedPassword;

	/** The username. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@NaturalId(mutable = true)
	}))
	@Setter
	private String username;

	/** The level. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
	}))
	@Setter
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

	/* (non-Javadoc)
	 * @see java.security.Principal#getName()
	 */
	@Override
	@Transient
	public String getName() {
		return username;
	}

	@Override
	public String toString() {
		return "User " + id + " (username '" + username + "', level " + level + (local ? "" : ", remote user") + ")";
	}

}
