package onl.netfishers.netshot;

import java.net.UnknownHostException;
import java.util.HashSet;
import java.util.Set;

import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.device.Domain;
import onl.netfishers.netshot.device.DynamicDeviceGroup;
import onl.netfishers.netshot.device.Module;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.device.Network6Address;
import onl.netfishers.netshot.device.NetworkInterface;
import onl.netfishers.netshot.device.Device.NetworkClass;
import onl.netfishers.netshot.device.attribute.ConfigAttribute;
import onl.netfishers.netshot.device.attribute.ConfigLongTextAttribute;
import onl.netfishers.netshot.device.attribute.ConfigTextAttribute;
import onl.netfishers.netshot.device.attribute.DeviceAttribute;
import onl.netfishers.netshot.device.attribute.DeviceBinaryAttribute;
import onl.netfishers.netshot.device.attribute.DeviceNumericAttribute;
import onl.netfishers.netshot.device.attribute.DeviceTextAttribute;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeType;
import onl.netfishers.netshot.diagnostic.Diagnostic;
import onl.netfishers.netshot.diagnostic.DiagnosticResult;
import onl.netfishers.netshot.diagnostic.DiagnosticTextResult;
import onl.netfishers.netshot.diagnostic.SimpleDiagnostic;

public class FakeDeviceFactory {

	static Device getFakeCiscoIosDevice() {
		Domain domain = new Domain("Test domain", "Fake domain for tests", null, null);
		Network4Address mgmtIp = null;
		try {
			mgmtIp = new Network4Address("172.16.1.16");
		}
		catch (UnknownHostException e) {
		}
		Device device = new Device("CiscoIOS12", mgmtIp, domain, "test");
		device.setName("router1");
		device.setFamily("Unknown IOS device");
		device.setNetworkClass(NetworkClass.ROUTER);
		device.setLocation("Test Location");
		device.setContact("Test Contact");
		device.setSoftwareVersion("16.1.6");
		device.setCreator("tester");
		device.setSerialNumber("16161616TEST16");
		device.setComments("Comments for testing");
		device.setVrfInstances(new HashSet<String>(Set.of("VRF1", "VRF2")));
		device.getModules().add(new Module("chassis", "TESTCHASSIS", "16161616TEST16", device));
		device.getModules().add(new Module("slot", "TESTSLOT", "29038POSD203", device));
		{
			NetworkInterface ni = new NetworkInterface(device, "GigabitEthernet0/0", "", "VRF1", true, true, "Desc for interface 0/0");
			try {
				ni.addIpAddress(new Network4Address("10.0.0.1", 24));
				ni.addIpAddress(new Network6Address("2016:1:2:0::1", 64));
			}
			catch (UnknownHostException e) {
			}
			device.getNetworkInterfaces().add(ni);
		}
		{
			NetworkInterface ni = new NetworkInterface(device, "GigabitEthernet0/1", "", "VRF2", false, true, "Desc for interface 0/1");
			try {
				ni.addIpAddress(new Network4Address("10.0.1.1", 24));
				ni.addIpAddress(new Network6Address("2016:1:2:1::1", 64));
			}
			catch (UnknownHostException e) {
			}
			device.getNetworkInterfaces().add(ni);
		}
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
		ConfigAttribute iosVersion = new ConfigTextAttribute(config, "iosVersion", "16.1.6");
		config.addAttribute(iosVersion);
		device.getConfigs().add(config);
		device.setLastConfig(config);
		
		DeviceAttribute mainMemorySize = new DeviceNumericAttribute(device, "mainMemorySize", 2048);
		device.addAttribute(mainMemorySize);
		DeviceAttribute configRegister = new DeviceTextAttribute(device, "configRegister", "0x1202");
		device.addAttribute(configRegister);
		DeviceAttribute configurationSaved = new DeviceBinaryAttribute(device, "configurationSaved", false);
		device.addAttribute(configurationSaved);

		DiagnosticResult reloadReasonDiagResult = new DiagnosticTextResult(device, getReloadReasonIosSimpleDiagnostic(), "Reload Command");
		device.addDiagnosticResult(reloadReasonDiagResult);

		return device;
	}

	static DeviceGroup getAllDevicesGroup() {
		DeviceGroup group = new DynamicDeviceGroup("All", null, "");
		return group;
	}

	static Diagnostic getReloadReasonIosSimpleDiagnostic() {
		Diagnostic diagnostic = new SimpleDiagnostic("Reload reason", true,
			getAllDevicesGroup(), AttributeType.TEXT, "CiscoIOS12",
			"enable",
			"show version | include reason",
			"(?s).*Last reload reason: (.+?)[\r\n]+",
			"$1");
		return diagnostic;
	}
}
