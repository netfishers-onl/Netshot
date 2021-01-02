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
package onl.netfishers.netshot.device.credentials;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import org.hibernate.annotations.Type;

import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * SSH credentials with a private key.
 * The inherited password is actually the passphrase for the key.
 * @author sylv
 *
 */
@Entity
@XmlRootElement()
public class DeviceSshKeyAccount extends DeviceSshAccount {
	
	private String publicKey;
	private String privateKey;
	
	protected DeviceSshKeyAccount() {
		
	}

	public DeviceSshKeyAccount(String username, String publicKey, String privateKey, String passphrase,
			String superPassword, String name) {
		super(username, passphrase, superPassword, name);
		this.publicKey = publicKey;
		this.privateKey = privateKey;
	}

	@Column(length = 5000)
	@XmlElement
	@JsonView(DefaultView.class)
	@Type(type = "credentialString")
	public String getPrivateKey() {
		return privateKey;
	}

	public void setPrivateKey(String privateKey) {
		this.privateKey = privateKey;
	}
	
	@Column(length = 5000)
	@XmlElement
	@JsonView(DefaultView.class)
	public String getPublicKey() {
		return publicKey;
	}

	public void setPublicKey(String publicKey) {
		this.publicKey = publicKey;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result
				+ ((privateKey == null) ? 0 : privateKey.hashCode());
		result = prime * result
				+ ((publicKey == null) ? 0 : publicKey.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (!super.equals(obj))
			return false;
		if (getClass() != obj.getClass())
			return false;
		DeviceSshKeyAccount other = (DeviceSshKeyAccount) obj;
		if (privateKey == null) {
			if (other.privateKey != null)
				return false;
		} else if (!privateKey.equals(other.privateKey))
			return false;
		if (publicKey == null) {
			if (other.publicKey != null)
				return false;
		} else if (!publicKey.equals(other.publicKey))
			return false;
		return true;
	}


}
