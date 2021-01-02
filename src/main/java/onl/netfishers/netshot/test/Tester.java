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
package onl.netfishers.netshot.test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Random;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.Device.NetworkClass;
import onl.netfishers.netshot.device.Device.Status;
import onl.netfishers.netshot.device.Domain;
import onl.netfishers.netshot.device.Module;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.device.NetworkInterface;
import onl.netfishers.netshot.device.PhysicalAddress;
import onl.netfishers.netshot.device.attribute.ConfigLongTextAttribute;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Tester {

	private static Logger logger = LoggerFactory.getLogger(Tester.class);

	public static void createDevices() {

/*		Session session = Database.getSession();
		session.beginTransaction();
		try {
			Domain domain = new Domain("Fake", "Fake domain", new Network4Address("10.0.16.1"), null);
			session.save(domain);
			DeviceCredentialSet snmp = new DeviceSnmpv2cCommunity("test", "Fake SNMP");
			DeviceCredentialSet snmp = new DeviceSnmpv3Community("test", "Fake SNMP", "fakeuser", "MD5", "authkey-test", "DES", "privkey-test");
			DeviceCredentialSet ssh = new DeviceSshAccount("test", "test", "test", "Fake SSH");
			session.save(snmp);
			session.save(ssh);

			for (int d = 1; d < 100; d++) {
				Network4Address deviceAddress = new Network4Address(
						Network4Address.intToIP((10 << 24) + (16 << 16) + d), 32);
				Device device = new Device("CiscoIOSXR", deviceAddress, domain, "netshot");
				device.setName(String.format("CORE%03d", d));
				device.setFamily("Cisco ASR9000 Series");
				device.setLocation(String.format("Location %03d", d % 20));
				device.setContact("Fake contact");
				device.setNetworkClass(NetworkClass.ROUTER);
				device.setSerialNumber(String.format("FAKE%06d", d));
				for (int m = 0; m < 10; m++) {
					Module module = new Module(String.format("%d/0", m),
							String.format("FK-X%04d", (d * 12 + m) % 13),
							String.format("FAKE%06d", d * 10000 + m), device);
					device.getModules().add(module);
				}
				for (int a = 0; a < 30; a++) {
					NetworkInterface networkInterface = new NetworkInterface(
							device, String.format("GigabitEthernet%d/%d", a / 10, a % 10),
							"", "", true, true, "Fake interface");
					networkInterface.addIpAddress(
							new Network4Address(Network4Address.intToIP((10 << 24) + (200 << 16) + d * 100 + d), 24));
					device.getNetworkInterfaces().add(networkInterface);
				}
				NetworkInterface loopback = new NetworkInterface(device, String.format("Loopback0"), "", "", true, true, "Management");
				loopback.addIpAddress(deviceAddress);
				device.getNetworkInterfaces().add(loopback);
				session.save(device);
			}
			session.getTransaction().commit();
		}
		catch (Exception e) {
			e.printStackTrace();
		}*/

		/*
		List<NetworkClass> networkClasses = Arrays.asList(NetworkClass.values());
		Session session = Database.getSession();
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
		}*/
		
		
		List<NetworkClass> networkClasses = Arrays.asList(NetworkClass.values());
		try {

			for (int i = 1000; i < 1050; i++) {
				Session session = Database.getSession();
				session.beginTransaction();
				Domain domain = (Domain) session.load(Domain.class, 1L);
				Network4Address deviceAddress = new Network4Address(
				    Network4Address.intToIP((10 << 24) + (16 << 16) + i), 32);
				Device device = new Device("CiscoIOS12", deviceAddress, domain, "Tester");
				device.setName(String.format("TEST%05d", i));
				device.setLocation("Fake location");
				device.setContact("Fake contact");
				device.setFamily("Fake Cisco IOS");
				device.setNetworkClass(networkClasses.get(new Random()
				    .nextInt(networkClasses.size())));
				device.setStatus(Status.INPRODUCTION);
				device.setComments(String.format("Fake device %d ", i));
				List<Config> configs = new ArrayList<Config>();
				int configNumber = 100 + new Random().nextInt(300);
				int configLength = 100000 + new Random().nextInt(1200000);
				StringBuilder runningConfig = new StringBuilder();
				
				long baseDate = new Date().getTime();
				long[] configDates = new Random().longs(configNumber, baseDate - 1000L * 3600 * 24 * 365 * 3, baseDate).sorted().toArray();
				
				
				for (int j = 0; j < configNumber; j++) {
					Config config = new Config(device);
					config.setAuthor("Fake");
					String configPiece = "!This is a fake IOS configuration\r\n" + 
							"interface Loopback0\r\n" +
							" ip address 1.1.1.1 255.255.255.255\r\n" +
							"!\r\n" +
							String.format("snmp-server contact CONF %05d\r\n", j) +
							"!";
					while (runningConfig.length() < configLength) {
						runningConfig.append(configPiece);
					}
					configLength += new Random().nextInt(1000);
					config.setChangeDate(new Date(1000 * (configDates[j] / 1000)));
					
					config.addAttribute(new ConfigLongTextAttribute(config, "runningConfig", runningConfig.toString()));
					configs.add(config);
					device.setLastConfig(config);
					if (j % 10 == 0) {
						logger.warn(String.format("Device %05d, config %05d", i, j));
					}
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
				session.getTransaction().commit();
			}
		}
		catch (Exception e) {
			e.printStackTrace();
		}
		
		logger.warn("Done");

	}

}
