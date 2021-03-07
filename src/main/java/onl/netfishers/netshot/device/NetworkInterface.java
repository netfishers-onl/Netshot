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

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.ElementCollection;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import onl.netfishers.netshot.device.NetworkAddress.AddressUsage;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * A network interface is attached to a device, has a physical
 * address, and one or several IP addresses.
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class NetworkInterface {
	
	/** The id. */
	private long id;
	
	/** The device. */
	protected Device device;
	
	/** The interface name. */
	protected String interfaceName;
	
	/** The ip4 addresses. */
	protected Set<Network4Address> ip4Addresses = new HashSet<>();
	
	/** The ip6 addresses. */
	protected Set<Network6Address> ip6Addresses = new HashSet<>();
	
	/** The physical address. */
	protected PhysicalAddress physicalAddress = new PhysicalAddress(0);
	
	/** The vrf instance. */
	protected String vrfInstance;
	
	/** The virtual device. */
	protected String virtualDevice;
	
	/** The description. */
	protected String description;
	
	/** The enabled. */
	protected boolean enabled;

	/** The level3. */
	protected boolean level3;
	
	/**
	 * Instantiates a new network interface.
	 */
	protected NetworkInterface() {
		
	}
	
	/**
	 * Instantiates a new network interface.
	 *
	 * @param device the device
	 * @param interfaceName the interface name
	 * @param virtualDevice the virtual device
	 * @param vrfInstance the vrf instance
	 * @param enabled the enabled
	 * @param level3 the level3
	 * @param description the description
	 */
	public NetworkInterface(Device device, String interfaceName, String virtualDevice,
			String vrfInstance, boolean enabled, boolean level3, String description) {
		super();
		this.device = device;
		this.interfaceName = (interfaceName == null ? "" : interfaceName);
		this.vrfInstance = (vrfInstance == null ? "" : vrfInstance);
		this.virtualDevice = (virtualDevice == null ? "" : virtualDevice);
		this.enabled = enabled;
		this.level3 = level3;
		this.description = description;
	}
	
	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public long getId() {
		return id;
	}

	/**
	 * The ID.
	 *
	 * @param id the ID
	 */
	public void setId(long id) {
		this.id = id;
	}

	/**
	 * Gets the interface name.
	 *
	 * @return the interface name
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getInterfaceName() {
		return interfaceName;
	}

	/**
	 * Gets the device.
	 *
	 * @return the device
	 */
	@ManyToOne
	public Device getDevice() {
		return device;
	}

	/**
	 * Gets the ip4 addresses.
	 *
	 * @return the ip4 addresses
	 */
	@XmlElement @JsonView(DefaultView.class)
	@ElementCollection(fetch = FetchType.EAGER) @Fetch(FetchMode.SELECT)
	public Set<Network4Address> getIp4Addresses() {
		return ip4Addresses;
	}
	
	/**
	 * Gets the ip6 addresses.
	 *
	 * @return the ip6 addresses
	 */
	@XmlElement @JsonView(DefaultView.class)
	@ElementCollection(fetch = FetchType.EAGER) @Fetch(FetchMode.SELECT)
	public Set<Network6Address> getIp6Addresses() {
		return ip6Addresses;
	}
	
	/**
	 * Gets the ip addresses.
	 *
	 * @return the ip addresses
	 */
	@Transient
	public List<NetworkAddress> getIpAddresses() {
		List<NetworkAddress> ipAddresses = new ArrayList<>();
		ipAddresses.addAll(this.getIp4Addresses());
		ipAddresses.addAll(this.getIp6Addresses());
		return ipAddresses;
	}
	
	/**
	 * Adds the ip address.
	 *
	 * @param address the address
	 */
	public void addIpAddress(NetworkAddress address) {
		if (address.getPrefixLength() == 32 && address instanceof Network4Address) {
			for (Network4Address ip : ip4Addresses) {
				if (ip.contains((Network4Address) address)) {
					((Network4Address) address).setPrefixLength(ip.getPrefixLength());
					if (ip.getAddressUsage() == AddressUsage.SECONDARY) {
						if (address.getAddressUsage() == AddressUsage.HSRP) {
							address.setAddressUsage(AddressUsage.SECONDARYHSRP);
						}
						else if (address.getAddressUsage() == AddressUsage.VRRP) {
							address.setAddressUsage(AddressUsage.SECONDARYVRRP);
						}
					}
					break;
				}
			}
		}
		else if (address.getPrefixLength() == 128 && address instanceof Network6Address) {
			for (Network6Address ip : ip6Addresses) {
				if (ip.contains((Network6Address) address)) {
					((Network6Address) address).setPrefixLength(ip.getPrefixLength());
					break;
				}
			}
		}
		if (address instanceof Network4Address) {
			ip4Addresses.add((Network4Address) address);
		}
		else {
			ip6Addresses.add((Network6Address) address);
		}
	}
	

	/**
	 * Gets the vrf instance.
	 *
	 * @return the vrf instance
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getVrfInstance() {
		return vrfInstance;
	}

	/**
	 * Checks if is enabled.
	 *
	 * @return true, if is enabled
	 */
	@XmlElement @JsonView(DefaultView.class)
	public boolean isEnabled() {
		return enabled;
	}

	/**
	 * Checks if is level3.
	 *
	 * @return true, if is level3
	 */
	@XmlElement @JsonView(DefaultView.class)
	public boolean isLevel3() {
		return level3;
	}

	/**
	 * Gets the mac address.
	 *
	 * @return the mac address
	 */
	@XmlElement @JsonView(DefaultView.class)
	@Transient
	public String getMacAddress() {
		return physicalAddress.toString();
	}
	
	/**
	 * Gets the physical address.
	 *
	 * @return the physical address
	 */
	@Embedded
	public PhysicalAddress getPhysicalAddress() {
		return physicalAddress;
	}

	/**
	 * Sets the physical address.
	 *
	 * @param physicalAddress the new physical address
	 */
	public void setPhysicalAddress(PhysicalAddress physicalAddress) {
		this.physicalAddress = physicalAddress;
	}

	/**
	 * Gets the virtual device.
	 *
	 * @return the virtual device
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getVirtualDevice() {
		return virtualDevice;
	}

	/**
	 * Sets the virtual device.
	 *
	 * @param virtualDevice the new virtual device
	 */
	public void setVirtualDevice(String virtualDevice) {
		this.virtualDevice = virtualDevice;
	}

	/**
	 * Gets the description.
	 *
	 * @return the description
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getDescription() {
		return description;
	}

	/**
	 * Sets the device.
	 *
	 * @param device the new device
	 */
	public void setDevice(Device device) {
		this.device = device;
	}

	/**
	 * Sets the description.
	 *
	 * @param description the new description
	 */
	public void setDescription(String description) {
		this.description = description;
	}

	/**
	 * Sets the interface name.
	 *
	 * @param interfaceName the new interface name
	 */
	public void setInterfaceName(String interfaceName) {
		this.interfaceName = interfaceName;
	}

	/**
	 * Sets the vrf instance.
	 *
	 * @param vrfInstance the new vrf instance
	 */
	public void setVrfInstance(String vrfInstance) {
		this.vrfInstance = vrfInstance;
	}

	/**
	 * Sets the enabled.
	 *
	 * @param enabled the new enabled
	 */
	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	/**
	 * Sets the level3.
	 *
	 * @param level3 the new level3
	 */
	public void setLevel3(boolean level3) {
		this.level3 = level3;
	}
	
	/**
	 * Sets the IPv4 addresses.
	 * @param ip4Addresses the IPv4 addresses
	 */
	public void setIp4Addresses(Set<Network4Address> ip4Addresses) {
		this.ip4Addresses = ip4Addresses;
	}

	/**
	 * Sets the IPv6 addresses.
	 * @param ip6Addresses the IPv6 addresses
	 */
	public void setIp6Addresses(Set<Network6Address> ip6Addresses) {
		this.ip6Addresses = ip6Addresses;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + (int) (id ^ (id >>> 32));
		return result;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (!(obj instanceof NetworkInterface))
			return false;
		NetworkInterface other = (NetworkInterface) obj;
		return id == other.id;
	}
	
}
