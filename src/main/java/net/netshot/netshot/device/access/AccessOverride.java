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
package net.netshot.netshot.device.access;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.fasterxml.jackson.annotation.JsonView;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.Getter;
import lombok.Setter;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.rest.RestViews.DefaultView;

/**
 * A per-access connection override for a device: an optional address and/or
 * TCP port for one of the driver's declared accesses (e.g. "ssh", "telnet",
 * "https", "alternateSsh"), keyed by access name.
 * <p>
 * This generalizes what used to be the device-wide {@code sshPort}/
 * {@code telnetPort}/{@code connectAddress} fields - those are now computed
 * accessors on {@link Device}, backed by the "ssh"/"telnet" rows of this
 * table, so the REST API and existing frontend keep working unchanged. Any
 * other access (not yet configurable from the UI - that's a later phase)
 * can already have its own override row.
 */
@Entity
@Table(name = "device_access_override")
@XmlRootElement
@XmlAccessorType(XmlAccessType.NONE)
public final class AccessOverride {

	/** The id. */
	@Getter(onMethod = @__({
		@Id, @GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlAttribute, @JsonView(DefaultView.class)
	}))
	@Setter
	private long id;

	/** The device this override belongs to. */
	@Getter(onMethod = @__({
		@ManyToOne,
		@OnDelete(action = OnDeleteAction.CASCADE)
	}))
	@Setter
	private Device device;

	/** The access name (matches the driver's declared access, e.g. "ssh", "telnet", "https"). */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String accessName;

	/** Optional connection address override (IPv4/IPv6 literal or FQDN). Null = use the device's management address. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String address;

	/** Optional TCP port override. Null = use the driver's/protocol's default port for this access. */
	@Getter(onMethod = @__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Integer port;

	/**
	 * Instantiates a new access override.
	 */
	protected AccessOverride() {
		// Reserved for Hibernate
	}

	/**
	 * Instantiates a new access override.
	 * @param device the device
	 * @param accessName the access name
	 */
	public AccessOverride(Device device, String accessName) {
		this.device = device;
		this.accessName = accessName;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (!(obj instanceof AccessOverride)) {
			return false;
		}
		AccessOverride other = (AccessOverride) obj;
		return this.id != 0 && this.id == other.id;
	}

	@Override
	public int hashCode() {
		return Long.hashCode(this.id);
	}

}
