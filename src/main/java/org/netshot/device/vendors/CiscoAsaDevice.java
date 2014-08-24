package org.netshot.device.vendors;

import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import org.netshot.device.ConfigItem;
import org.netshot.device.Device;
import org.netshot.device.Domain;
import org.netshot.device.Network4Address;

@Entity
public class CiscoAsaDevice extends Device {

	public CiscoAsaDevice(Network4Address address, Domain domain) {
		super(address, domain);
	}
	
	public CiscoAsaDevice() {
		super(null, null);
	}
	
	@XmlElement
	@Transient
	@ConfigItem(name = "Type", type = ConfigItem.Type.CHECKABLE)
	public static String getDeviceType() {
		return "Cisco ASA Firewall/VPN-T";
	}
	
	@Transient
	@XmlElement
	public String getRealDeviceType() {
		return getDeviceType();
	}

	@Override
	public boolean takeSnapshot() {
		// TODO Auto-generated method stub
		return false;
	}

}
