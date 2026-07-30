/**
 * Copyright 2013-2025 Netshot
 *
 * This file is part of Netshot project.
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
package net.netshot.netshot.device.credentials;

import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.Getter;
import lombok.Setter;
import net.netshot.netshot.database.StringEncryptorConverter;
import net.netshot.netshot.rest.RestViews.RestApiView;

/**
 * HTTP credentials: a username (used for Basic auth) and a password, which
 * doubles as the Bearer token or apiKey value when the access's declared
 * authentication scheme (see {@code Http.AuthScheme}) isn't Basic - a single
 * credential set only ever serves one scheme (whichever the access
 * declares), so there is no need for a separate token field/column. The
 * driver never sees these values directly.
 */
@Entity
@XmlRootElement
public class DeviceHttpAccount extends DeviceCredentialSet {

	/** The username (used for Basic auth only). */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(RestApiView.class)
	}))
	@Setter
	private String username;

	/** The password - or, when the scheme is Bearer/apiKey, the token/key value. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(RestApiView.class),
		@JsonSerialize(using = HideSecretSerializer.class),
		@JsonDeserialize(using = HideSecretDeserializer.class),
		@Convert(converter = StringEncryptorConverter.class)
	}))
	@Setter
	private String password;

	/**
	 * Instantiates a new device HTTP account.
	 */
	protected DeviceHttpAccount() {
		// Reserved for Hibernate
	}

	/**
	 * Instantiates a new device HTTP account.
	 *
	 * @param username the username (Basic auth only)
	 * @param password the password, or the Bearer/apiKey token value
	 * @param name the name
	 */
	public DeviceHttpAccount(String username, String password, String name) {
		super(name);
		this.username = username;
		this.password = password;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + (name == null ? 0 : name.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (!super.equals(obj)) {
			return false;
		}
		if (!(obj instanceof DeviceHttpAccount)) {
			return false;
		}
		DeviceHttpAccount other = (DeviceHttpAccount) obj;
		if (name == null) {
			if (other.name != null) {
				return false;
			}
		}
		else if (!name.equals(other.name)) {
			return false;
		}
		return true;
	}

}
