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

import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;

import javax.persistence.Embeddable;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * An IP address - abstract, can be either IPv4 or IPv6.
 */
@Embeddable
@XmlRootElement
@XmlAccessorType(value = XmlAccessType.NONE)
public abstract class NetworkAddress {

	/**
	 * Gets the inet address.
	 *
	 * @return the inet address
	 */
	@Transient
	abstract public InetAddress getInetAddress();
	
	/**
	 * Gets the network address.
	 *
	 * @param inetAddress the inet address
	 * @param prefixLength the prefix length
	 * @return the network address
	 */
	public static NetworkAddress getNetworkAddress(InetAddress inetAddress, int prefixLength) throws UnknownHostException {
		if (inetAddress instanceof Inet4Address) {
			return new Network4Address((Inet4Address)inetAddress, prefixLength);
		}
		else {
			return new Network6Address((Inet6Address)inetAddress, prefixLength);
		}
	}
	
	/**
	 * Gets the network address.
	 *
	 * @param address the address
	 * @param prefixLength the prefix length
	 * @return the network address
	 * @throws UnknownHostException the unknown host exception
	 */
	public static NetworkAddress getNetworkAddress(String address, int prefixLength) throws UnknownHostException {
		InetAddress inetAddress = InetAddress.getByName(address);
		if (inetAddress instanceof Inet4Address) {
			return new Network4Address((Inet4Address)inetAddress, prefixLength);
		}
		else {
			return new Network6Address((Inet6Address)inetAddress, prefixLength);
		}
	}
	
	/**
	 * Gets the network address.
	 *
	 * @param address the address
	 * @return the network address
	 * @throws UnknownHostException the unknown host exception
	 */
	public static NetworkAddress getNetworkAddress(String address) throws UnknownHostException {
		return getNetworkAddress(address, 0);
	}
	
	/**
	 * Gets the ip.
	 *
	 * @return the ip
	 */
	@Transient
	@XmlElement @JsonView(DefaultView.class)
	public abstract String getIp();
	
	@Transient
	@XmlElement @JsonView(DefaultView.class)
	public abstract int getPrefixLength();
	
	@Transient
	public abstract String getPrefix();
	
	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Object#toString()
	 */
	@Override
	public String toString() {
		return getPrefix();
	}
	
	
	public static enum AddressUsage {
		PRIMARY,
		SECONDARY,
		VRRP,
		HSRP,
		SECONDARYVRRP,
		SECONDARYHSRP
	}
	
	public abstract AddressUsage getAddressUsage();
	
	public abstract void setAddressUsage(AddressUsage usage);
	
	
}
