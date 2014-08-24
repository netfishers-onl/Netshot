package org.netshot.test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import org.hibernate.Session;
import org.netshot.NetshotDatabase;
import org.netshot.device.Config;
import org.netshot.device.Domain;
import org.netshot.device.Module;
import org.netshot.device.Network4Address;
import org.netshot.device.NetworkInterface;
import org.netshot.device.PhysicalAddress;
import org.netshot.device.Device.NetworkClass;
import org.netshot.device.Device.Status;
import org.netshot.device.credentials.DeviceCredentialSet;
import org.netshot.device.credentials.DeviceSnmpv2cCommunity;
import org.netshot.device.credentials.DeviceTelnetAccount;
import org.netshot.device.vendors.CiscoIosDevice;
import org.netshot.device.vendors.CiscoIosDevice.CiscoIosConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Tester {
	
	private static Logger logger = LoggerFactory.getLogger(Tester.class);

	public static void createDevices() {

		List<NetworkClass> networkClasses = Arrays.asList(NetworkClass.values());
		Session session = NetshotDatabase.getSession();
		session.beginTransaction();
		try {
			Domain domain = new Domain("Default", "Default Domain",
			    new Network4Address("10.0.16.1"), null);
			session.save(domain);
			DeviceCredentialSet snmp = new DeviceSnmpv2cCommunity("public",
			    "Default SNMP");
			DeviceCredentialSet telnet = new DeviceTelnetAccount("cisco", "cisco",
			    "cisco", "Default Telnet");
			session.save(snmp);
			session.save(telnet);

			for (int i = 2000; i < 8000; i++) {
				Network4Address deviceAddress = new Network4Address(
				    Network4Address.intToIP((10 << 24) + (16 << 16) + i), 32);
				CiscoIosDevice device = new CiscoIosDevice(deviceAddress, domain);
				device.setName(String.format("ZR%05d", i));
				device.setLocation("Fake location");
				device.setContact("Fake contact");
				device.setFamily("Fake Cisco IOS");
				device.setNetworkClass(networkClasses.get(new Random()
				    .nextInt(networkClasses.size())));
				device.setStatus(Status.INPRODUCTION);
				device.setMainFlashSize(16);
				device.setMainMemorySize(16);
				device.setComments(String.format("Fake device %d ", i));
				List<Config> configs = new ArrayList<Config>();
				for (int j = 0; j < 100; j++) {
					CiscoIosConfig config = new CiscoIosConfig(device);
					config.setAuthor("Fake");
					config.setIosImageFile("fake.bin");
					config.setIosVersion("16.1T");
					String runningConfig = "!This is a fake IOS configuration\r\n" + 
							"interface Loopback0\r\n" +
							" ip address 1.1.1.1 255.255.255.255\r\n" +
							"!\r\n" +
							String.format("snmp-server contact CONF %05d\r\n", j) +
							"!";
					config.setRunningConfigAsText(runningConfig);
					config.setStartupMatchesRunning(true);
					configs.add(config);
					device.setLastConfig(config);
				}
				device.setConfigs(configs);

				List<NetworkInterface> netInterfaces = new ArrayList<NetworkInterface>();
				NetworkInterface managementInterface = new NetworkInterface(device,
				    "Loopback0", "", "", true, true, "Management interface");
				managementInterface.addIpAddress(deviceAddress);
				managementInterface
				    .setPhysicalAddress(new PhysicalAddress(16 << 32 + i));
				netInterfaces.add(managementInterface);
				device.setNetworkInterfaces(netInterfaces);

				List<Module> modules = new ArrayList<Module>();
				Module module = new Module();
				module.setDevice(device);
				module.setPartNumber("FAKE");
				module.setSlot("Fake Slot 0");
				module.setSerialNumber(String.format("ABCDXYZ%03X", i));
				modules.add(module);

				device.setModules(modules);
				session.save(device);
				if (i % 10 == 9) {
					logger.warn(String.format("Device %05d", i));
				}
			}

			session.getTransaction().commit();
		}
		catch (Exception e) {
			e.printStackTrace();
		}
		logger.warn("Done");

	}

}
