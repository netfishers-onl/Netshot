/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.device;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

/**
 * An IPv4 address.
 */
@Embeddable
@XmlRootElement
@XmlAccessorType(value = XmlAccessType.NONE)
public class Network4Address extends NetworkAddress {

	/**
	 * Dotted mask to prefix length.
	 * 
	 * @param mask
	 *          the mask
	 * @return the int
	 * @throws UnknownHostException
	 *           the unknown host exception
	 */
	public static int dottedMaskToPrefixLength(String mask)
			throws UnknownHostException {
		int n = ipToInt(mask);
		n = ~n;
		return (int) Math.round(32 - (Math.log(n + 1) / Math.log(2)));
	}

	/**
	 * Inet address to int.
	 * 
	 * @param address
	 *          the address
	 * @return the int
	 */
	public static int inetAddressToInt(Inet4Address address) {
		byte[] buffer = address.getAddress();
		return ByteBuffer.wrap(buffer).getInt();
	}

	/**
	 * Int to inet address.
	 * 
	 * @param address
	 *          the address
	 * @return the inet address
	 * @throws UnknownHostException
	 *           the unknown host exception
	 */
	public static InetAddress intToInetAddress(int address)
			throws UnknownHostException {
		ByteBuffer buffer = ByteBuffer.allocate(4);
		buffer.putInt(address);
		return InetAddress.getByAddress(buffer.array());
	}

	/**
	 * Int to ip.
	 * 
	 * @param address
	 *          the address
	 * @return the string
	 */
	public static String intToIP(int address) {
		int b1 = address & 0xFF;
		int b2 = (address >> 8) & 0xFF;
		int b3 = (address >> 16) & 0xFF;
		int b4 = (address >> 24) & 0xFF;
		return String.format("%d.%d.%d.%d", b4, b3, b2, b1);
	}

	/**
	 * Ip to int.
	 * 
	 * @param address
	 *          the address
	 * @return the int
	 * @throws UnknownHostException
	 *           the unknown host exception
	 */
	public static int ipToInt(String address) throws UnknownHostException {
		try {
			InetAddress inetAddress = InetAddress.getByName(address);
			if (inetAddress instanceof Inet4Address) {
				return Network4Address.inetAddressToInt((Inet4Address) inetAddress);
			}
		}
		catch (Exception e) {
		}
		throw new UnknownHostException("Unable to parse the IPv4 address");
	}

	/**
	 * Prefix length to dotted mask.
	 * 
	 * @param length
	 *          the length
	 * @return the string
	 */
	public static String prefixLengthToDottedMask(int length) {
		return Network4Address.intToIP(Network4Address
				.prefixLengthToIntAddress(length));
	}

	/**
	 * Prefix length to int address.
	 * 
	 * @param length
	 *          the length
	 * @return the int
	 */
	public static int prefixLengthToIntAddress(int length) {
		return 0xFFFFFFFF << (32 - length);
	}


	/** The address. */
	private int address = 0;

	/** The prefix length. */
	private int prefixLength = 0;



	/**
	 * Instantiates a new network4 address.
	 */
	protected Network4Address() {
	}

	/**
	 * Instantiates a new network4 address.
	 * 
	 * @param address
	 *          the address
	 * @param prefixLength
	 *          the prefix length
	 * @throws UnknownHostException
	 *           the unknown host exception
	 */
	public Network4Address(Inet4Address address, int prefixLength)
			throws UnknownHostException {
		this.address = inetAddressToInt(address);
		if (prefixLength < 0 || prefixLength > 32) {
			throw new UnknownHostException("Invalid prefix length");
		}
		this.prefixLength = prefixLength;
	}

	/**
	 * Instantiates a new network4 address.
	 * 
	 * @param address
	 *          the address
	 * @throws UnknownHostException
	 *           the unknown host exception
	 */
	public Network4Address(String address) throws UnknownHostException {
		this(address, 0);
	}

	/**
	 * Instantiates a new network4 address.
	 * 
	 * @param address
	 *          the address
	 * @param prefixLength
	 *          the prefix length
	 * @throws UnknownHostException
	 *           the unknown host exception
	 */
	public Network4Address(int address, int prefixLength)
			throws UnknownHostException {
		this.address = address;
		if (prefixLength < 0 || prefixLength > 32) {
			throw new UnknownHostException("Invalid prefix length");
		}
		this.prefixLength = prefixLength;
	}

	/**
	 * Instantiates a new network4 address.
	 * 
	 * @param address
	 *          the address
	 * @param prefixLength
	 *          the prefix length
	 * @throws UnknownHostException
	 *           the unknown host exception
	 */
	public Network4Address(String address, int prefixLength)
			throws UnknownHostException {
		this.address = Network4Address.ipToInt(address);
		if (prefixLength < 0 || prefixLength > 32) {
			throw new UnknownHostException("Invalid prefix length");
		}
		this.prefixLength = prefixLength;
	}

	/**
	 * Instantiates a new network4 address.
	 * 
	 * @param address
	 *          the address
	 * @param mask
	 *          the mask
	 * @throws UnknownHostException
	 *           the unknown host exception
	 */
	public Network4Address(String address, String mask)
			throws UnknownHostException {
		this.address = Network4Address.ipToInt(address);
		this.prefixLength = Network4Address.dottedMaskToPrefixLength(mask);
	}

	/*
	 * (non-Javadoc)
	 * 
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
		if (!(obj instanceof Network4Address)) {
			return false;
		}
		Network4Address other = (Network4Address) obj;
		if (address != other.address || prefixLength != other.prefixLength) {
			return false;
		}
		return true;
	}

	/**
	 * Gets the address.
	 * 
	 * @return the address
	 */
	@Column(name = "ipv4address")
	public int getAddress() {
		return address;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see onl.netfishers.netshot.device.NetworkAddress#getInetAddress()
	 */
	@Transient
	public InetAddress getInetAddress() {
		try {
			return Network4Address.intToInetAddress(this.address);
		}
		catch (UnknownHostException e) {
		}
		return null;
	}

	/**
	 * Gets the int address.
	 * 
	 * @return the int address
	 */
	@Transient
	public int getIntAddress() {
		return address;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see onl.netfishers.netshot.device.NetworkAddress#getIP()
	 */
	@XmlAttribute
	@Transient
	public String getIp() {
		return intToIP(this.address);
	}

	/**
	 * Gets the prefix.
	 * 
	 * @return the prefix
	 */
	@Transient
	public String getPrefix() {
		return intToIP(this.address) + "/" + prefixLength;
	}

	/**
	 * Gets the prefix length.
	 * 
	 * @return the prefix length
	 */
	@Column(name = "ipv4mask")
	@XmlAttribute
	public int getPrefixLength() {
		return prefixLength;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + address;
		result = prime * result + prefixLength;
		return result;
	}

	/**
	 * Checks if is broadcast.
	 * 
	 * @return true, if is broadcast
	 */
	@Transient
	public boolean isBroadcast() {
		return this.address == 0xFFFFFFFF;
	}

	/**
	 * Checks if is loopback.
	 * 
	 * @return true, if is loopback
	 */
	@Transient
	public boolean isLoopback() {
		return ((this.address >> 24) & 255) == 127;
	}

	/**
	 * Checks if is multicast.
	 * 
	 * @return true, if is multicast
	 */
	@Transient
	public boolean isMulticast() {
		return ((this.address >> 28) & 31) == 31;
	}

	/**
	 * Checks if is normal unicast.
	 * 
	 * @return true, if is normal unicast
	 */
	@Transient
	public boolean isNormalUnicast() {
		return (!this.isBroadcast() && !this.isLoopback() && !this.isMulticast() && !this
				.isUndefined());
	}

	/**
	 * Checks if is undefined.
	 * 
	 * @return true, if is undefined
	 */
	@Transient
	public boolean isUndefined() {
		return (this.address == 0);
	}

	/**
	 * Sets the address.
	 * 
	 * @param address
	 *          the new address
	 */
	public void setAddress(int address) {
		this.address = address;
	}

	/**
	 * Sets the prefix length.
	 * 
	 * @param prefixLength
	 *          the new prefix length
	 */
	public void setPrefixLength(int prefixLength) {
		this.prefixLength = prefixLength;
	}

	/**
	 * Gets the subnet min.
	 * 
	 * @return the subnet min
	 */
	@Transient
	public int getSubnetMin() {
		return this.getIntAddress()
				& Network4Address.prefixLengthToIntAddress(this.getPrefixLength());
	}

	/**
	 * Gets the subnet max.
	 * 
	 * @return the subnet max
	 */
	@Transient
	public int getSubnetMax() {
		return this.getSubnetMin()
				| ~Network4Address.prefixLengthToIntAddress(this.getPrefixLength());
	}

	/**
	 * Determines whether a subnet contains another IP or not.
	 * 
	 * @param otherAddress
	 *          the IP to check
	 * @return true if the IP is contained within the current subnet
	 */
	public boolean contains(Network4Address otherAddress) {
		return (this.address >> (32 - this.prefixLength)) == (otherAddress
				.getIntAddress() >> (32 - this.prefixLength));
	}

	private AddressUsage addressUsage = AddressUsage.PRIMARY;

	@XmlElement
	@Column(name = "ipv4usage")
	public AddressUsage getAddressUsage() {
		return addressUsage;
	}

	public void setAddressUsage(AddressUsage usage) {
		this.addressUsage = usage;
	}

}
