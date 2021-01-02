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
package onl.netfishers.netshot.device;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;

import javax.persistence.Embeddable;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * An IPv6 address.
 */
@Embeddable
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class Network6Address extends NetworkAddress {

	/**
	 * Int to ip.
	 *
	 * @param address1 the address1
	 * @param address2 the address2
	 * @return the string
	 */
	public static String intToIP(long address1, long address2) {
		InetAddress address = longToInetAddress(address1, address2);
		return address.getHostAddress();
	}

	/**
	 * Long to inet address.
	 *
	 * @param address1 the address1
	 * @param address2 the address2
	 * @return the inet address
	 */
	static public InetAddress longToInetAddress(long address1, long address2) {
		ByteBuffer buffer = ByteBuffer.allocate(16);
		buffer.putLong(address1);
		buffer.putLong(address2);
		try {
			return InetAddress.getByAddress(buffer.array());
		} catch (UnknownHostException e) {
			return null;
		}	
	}

	/** The address1. */
	private long address1;

	/** The address2. */
	private long address2;

	/** The prefix length. */
	private int prefixLength;

	/**
	 * Instantiates a new network6 address.
	 */
	protected Network6Address() {

	}

	/**
	 * Instantiates a new network6 address.
	 *
	 * @param address the address
	 * @param prefixLength the prefix length
	 */
	public Network6Address(Inet6Address address, int prefixLength) {
		byte[] buffer = address.getAddress();
		ByteBuffer bBuffer = ByteBuffer.wrap(buffer);
		this.address1 = bBuffer.getLong();
		this.address2 = bBuffer.getLong();
	}

	/**
	 * Instantiates a new network6 address.
	 *
	 * @param address the address
	 * @throws UnknownHostException the unknown host exception
	 */
	public Network6Address(String address) throws UnknownHostException {
		this(address, 0);
	}

	/**
	 * Instantiates a new network6 address.
	 *
	 * @param address the address
	 * @param prefixLength the prefix length
	 * @throws UnknownHostException the unknown host exception
	 */
	public Network6Address(String address, int prefixLength) throws UnknownHostException {
		this.prefixLength = prefixLength;
		try {
			InetAddress inetAddress = InetAddress.getByName(address);
			if (inetAddress instanceof Inet6Address) {
				byte[] buffer = inetAddress.getAddress();
				ByteBuffer bBuffer = ByteBuffer.wrap(buffer);
				this.address1 = bBuffer.getLong();
				this.address2 = bBuffer.getLong();
				return;
			}
		} catch (UnknownHostException e) {
		}
		throw new UnknownHostException("Unable to parse the IPv6 address.");
	}

	/**
	 * Instantiates a new network6 address.
	 *
	 * @param address the address
	 * @param length the length
	 * @throws UnknownHostException the unknown host exception
	 */
	public Network6Address(String address, String length) throws UnknownHostException {
		this(address, Integer.parseInt(length));
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (obj == null) {
			return false;
		}
		if (!(obj instanceof Network6Address)) {
			return false;
		}
		Network6Address other = (Network6Address) obj;
		if (address1 != other.address1 || address2 != other.address2 || prefixLength != other.prefixLength) {
			return false;
		}
		return true;
	}

	/**
	 * Gets the address1.
	 *
	 * @return the address1
	 */
	public long getAddress1() {
		return address1;
	}

	/**
	 * Gets the address2.
	 *
	 * @return the address2
	 */
	public long getAddress2() {
		return address2;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.NetworkAddress#getInetAddress()
	 */
	@Override
	@Transient
	public InetAddress getInetAddress() {
		return longToInetAddress(this.address1, this.address2);
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.NetworkAddress#getIP()
	 */
	@Transient
	@XmlAttribute
	public String getIp() {
		return Network6Address.intToIP(address1, address2);
	}

	/**
	 * Gets the prefix.
	 *
	 * @return the prefix
	 */
	@Transient
	public String getPrefix() {
		return getIp() + "/" + prefixLength;
	}

	/**
	 * Gets the prefix length.
	 *
	 * @return the prefix length
	 */
	@XmlAttribute
	public int getPrefixLength() {
		return prefixLength;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + (int) (address1 ^ (address1 >>> 32));
		result = prime * result + (int) (address2 ^ (address2 >>> 32));
		result = prime * result + prefixLength;
		return result;
	}

	/**
	 * Sets the address1.
	 *
	 * @param address1 the new address1
	 */
	protected void setAddress1(long address1) {
		this.address1 = address1;
	}

	/**
	 * Sets the address2.
	 *
	 * @param address2 the new address2
	 */
	protected void setAddress2(long address2) {
		this.address2 = address2;
	}

	/**
	 * Sets the prefix length.
	 *
	 * @param prefixLength the new prefix length
	 */
	protected void setPrefixLength(int prefixLength) {
		this.prefixLength = prefixLength;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#toString()
	 */
	public String toString() {
		return this.getPrefix();
	}

	private AddressUsage addressUsage = AddressUsage.PRIMARY;

	@XmlElement
	@JsonView(DefaultView.class)
	public AddressUsage getAddressUsage() {
		return addressUsage;
	}

	public void setAddressUsage(AddressUsage usage) {
		this.addressUsage = usage;
	}

	public boolean contains(Network6Address address) {
		if (prefixLength <= 64) {
			return (this.address1 >> (64 - this.prefixLength)) == (address
					.address1 >> (64 - this.prefixLength));
		}
		else {
			return (this.address1 == address.address1) && (this.address2 >> (64 - this.prefixLength))
					== (address.address2 >> (64 - this.prefixLength));
		}
	}

}
