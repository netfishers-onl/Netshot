/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
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
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.device.NetworkAddress.AddressUsage;

import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

/**
 * A network interface is attached to a device, has a physical
 * address, and one or several IP addresses.
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class NetworkInterface {
	
	/** The id. */
	@Id @GeneratedValue
	private long id;
	
	/** The device. */
	@ManyToOne
	protected Device device;
	
	/** The interface name. */
	protected String interfaceName;
	
	/** The ip4 addresses. */
	@ElementCollection(fetch = FetchType.EAGER) @Fetch(FetchMode.SELECT)
	protected Set<Network4Address> ip4Addresses = new HashSet<Network4Address>();
	
	/** The ip6 addresses. */
	@ElementCollection(fetch = FetchType.EAGER) @Fetch(FetchMode.SELECT)
	protected Set<Network6Address> ip6Addresses = new HashSet<Network6Address>();
	
	/** The physical address. */
	@Embedded
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
	@XmlElement
	public long getId() {
		return id;
	}

	/**
	 * Gets the interface name.
	 *
	 * @return the interface name
	 */
	@XmlElement
	public String getInterfaceName() {
		return interfaceName;
	}

	/**
	 * Gets the ip4 addresses.
	 *
	 * @return the ip4 addresses
	 */
	@XmlElement
	public Set<Network4Address> getIp4Addresses() {
		return ip4Addresses;
	}
	
	/**
	 * Gets the ip6 addresses.
	 *
	 * @return the ip6 addresses
	 */
	@XmlElement
	public Set<Network6Address> getIp6Addresses() {
		return ip6Addresses;
	}
	
	/**
	 * Gets the ip addresses.
	 *
	 * @return the ip addresses
	 */
	public List<NetworkAddress> getIpAddresses() {
		List<NetworkAddress> ipAddresses = new ArrayList<NetworkAddress>();
		ipAddresses.addAll(ip4Addresses);
		ipAddresses.addAll(ip6Addresses);
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
	@XmlElement
	public String getVrfInstance() {
		return vrfInstance;
	}

	/**
	 * Checks if is enabled.
	 *
	 * @return true, if is enabled
	 */
	@XmlElement
	public boolean isEnabled() {
		return enabled;
	}

	/**
	 * Checks if is level3.
	 *
	 * @return true, if is level3
	 */
	@XmlElement
	public boolean isLevel3() {
		return level3;
	}

	/**
	 * Gets the mac address.
	 *
	 * @return the mac address
	 */
	@XmlElement
	public String getMacAddress() {
		return physicalAddress.toString();
	}
	
	/**
	 * Gets the physical address.
	 *
	 * @return the physical address
	 */
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
	@XmlElement
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
	@XmlElement
	public String getDescription() {
		return description;
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
		if (id != other.id)
			return false;
		return true;
	}
	
}
