package onl.netfishers.netshot;

import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.attribute.ConfigAttribute;
import onl.netfishers.netshot.device.attribute.ConfigLongTextAttribute;
import onl.netfishers.netshot.device.attribute.ConfigTextAttribute;
import onl.netfishers.netshot.device.attribute.DeviceAttribute;
import onl.netfishers.netshot.device.attribute.DeviceBinaryAttribute;
import onl.netfishers.netshot.device.attribute.DeviceNumericAttribute;
import onl.netfishers.netshot.device.attribute.DeviceTextAttribute;

public class FakeDeviceFactory {

	static Device getFakeCiscoIosDevice() {
		Device device = new Device("CiscoIOS12", null, null, "test");
		device.setName("router1");
		Config config = new Config(device);
		ConfigAttribute runningConfig = new ConfigLongTextAttribute(config, "runningConfig", "" +
			"version 16.1\n" +
			"no service pad\n" +
			"service timestamps debug datetime msec\n" +
			"no service password-encryption\n" +
			"!\n" +
			"hostname router1\n" +
			"!\n"+
			"boot-start-marker\n" +
			"boot-end-marker\n" +
			"!\n" +
			"enable secret $6$aaa\n" +
			"!\n" +
			"ip cef\n" +
			"ipv6 unicast-routing\f\n" + // \f to test normalization
			"!\n" +
			"interface GigabitEthernet0/0\n" +
			" description Description of Gi0/0\n" +
			" ip address 10.0.0.1 255.255.255.0\n" +
			" no shutdown\n" +
			"!\n" +
			"interface GigabitEthernet0/1\n" +
			" description Description of Gi0/1\n" +
			" ip address 10.0.1.1 255.255.255.0\n" +
			" no shutdown\n" +
			"!\n" +
			"interface GigabitEthernet0/2\n" +
			" description Description of Gi0/2\n" +
			" ip address 10.0.2.1 255.255.255.0\n" +
			"!\n" +
			"line con 0\n" +
			" password something\n" +
			"line vty 0 4\n" +
			" password something\n" +
			" transport input all\n" +
			" transport output all\n" +
			"!\n");
		config.addAttribute(runningConfig);
		ConfigAttribute iosVersion = new ConfigTextAttribute(config, "iosVersion", "16.1");
		config.addAttribute(iosVersion);
		device.getConfigs().add(config);
		device.setLastConfig(config);
		
		DeviceAttribute mainMemorySize = new DeviceNumericAttribute(device, "mainMemorySize", 2048);
		device.addAttribute(mainMemorySize);
		DeviceAttribute configRegister = new DeviceTextAttribute(device, "configRegister", "0x1202");
		device.addAttribute(configRegister);
		DeviceAttribute configurationSaved = new DeviceBinaryAttribute(device, "configurationSaved", false);
		device.addAttribute(configurationSaved);

		return device;
	}
}
