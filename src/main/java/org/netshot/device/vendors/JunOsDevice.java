package org.netshot.device.vendors;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.netshot.NetshotDatabase;
import org.netshot.device.AutoSnmpDiscoverableDevice;
import org.netshot.device.Config;
import org.netshot.device.ConfigItem;
import org.netshot.device.Device;
import org.netshot.device.Domain;
import org.netshot.device.Module;
import org.netshot.device.Network4Address;
import org.netshot.device.Network6Address;
import org.netshot.device.NetworkInterface;
import org.netshot.device.PhysicalAddress;
import org.netshot.device.access.Cli;
import org.netshot.device.access.Snmp;
import org.netshot.device.access.Ssh;
import org.netshot.device.credentials.DeviceCliAccount;
import org.netshot.device.credentials.DeviceCredentialSet;
import org.netshot.device.credentials.DeviceSshAccount;
import org.netshot.work.tasks.TakeSnapshotTask;
import org.snmp4j.PDU;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.VariableBinding;

/**
 * A JUNOS device.
 */
@Entity
@XmlRootElement()
public class JunOsDevice extends Device implements AutoSnmpDiscoverableDevice {

	/**
	 * A JUNOS configuration.
	 */
	@Entity
	public static class JunOsConfig extends Config {

		/** The configuration file. */
		private LongTextConfiguration config = new LongTextConfiguration();

		/** The JUNOS version. */
		private String junOsVersion = "";

		/**
		 * For Hibernate.
		 */
		protected JunOsConfig() {
			super();
		}

		/**
		 * Instantiates a new JUNOS config.
		 * 
		 * @param device
		 *          the device which owns the configuration
		 */
		public JunOsConfig(Device device) {
			super(device);
		}

		/**
		 * Gets the JUNOS version.
		 * 
		 * @return the JUNOS version
		 */
		@XmlElement
		@ConfigItem(name = "JunOS version", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getJunOsVersion() {
			return junOsVersion;
		}

		/**
		 * Gets the JUNOS config.
		 * 
		 * @return the config
		 */
		@Transient
		@ConfigItem(name = "Config", alias = "Config", type = {
		    ConfigItem.Type.RETRIEVABLE, ConfigItem.Type.DIFFABLE,
		    ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getConfigAsText() {
			return config.getText();
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
			result = prime * result + ((config == null) ? 0 : config.hashCode());
			result = prime * result
			    + ((junOsVersion == null) ? 0 : junOsVersion.hashCode());
			return result;
		}

		/*
		 * (non-Javadoc)
		 * 
		 * @see java.lang.Object#equals(java.lang.Object)
		 */
		@Override
		public boolean equals(Object obj) {
			if (this == obj)
				return true;
			if (obj == null)
				return false;
			if (getClass() != obj.getClass())
				return false;
			JunOsConfig other = (JunOsConfig) obj;
			if (config == null) {
				if (other.config != null)
					return false;
			}
			else if (!config.equals(other.config))
				return false;
			if (junOsVersion == null) {
				if (other.junOsVersion != null)
					return false;
			}
			else if (!junOsVersion.equals(other.junOsVersion))
				return false;
			return true;
		}

		/**
		 * Sets the JUNOS version.
		 * 
		 * @param junOsVersion
		 *          the new JUNOS version
		 */
		public void setJunOsVersion(String junOsVersion) {
			this.junOsVersion = junOsVersion;
		}

		/**
		 * Sets the config.
		 * 
		 * @param config
		 *          the new config
		 */
		public void setConfigAsText(String config) {
			this.config.setText(config);
		}
		
		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getConfig() {
			return config;
		}

		protected void setConfig(LongTextConfiguration config) {
			this.config = config;
		}

		@Override
		public void writeToFile() throws IOException {
			StringBuffer conf = new StringBuffer();
			conf.append("## Netshot - JUNOS configuration file\r\n");
			conf.append("## Device ");
			conf.append(this.device.getName());
			conf.append("\r\n");
			conf.append("## Date/time ");
			conf.append(this.changeDate);
			conf.append("\r\n");
			conf.append("## JUNOS version ");
			conf.append(this.junOsVersion);
			conf.append("\r\n");
			conf.append(this.config);
			writeToFile(conf.toString());
		}

	}

	/** The Constant CLI_CR. */
	private static final String CLI_CR = "\r";

	/** The Constant CLI_PROMPT. */
	private static final String CLI_PROMPT = "^[A-Za-z0-9_\\-]+@[A-Za-z0-9_\\-]+> $";

	/** The Constant COMMIT. */
	private static final Pattern COMMIT = Pattern
	    .compile("UI_COMMIT: User '(?<user>.*)' requested 'commit' operation");

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.netshot.device.AutoSnmpDiscoverableDevice#snmpAutoDiscover(java.lang
	 * .String, java.lang.String, org.netshot.device.access.Snmp)
	 */
	public boolean snmpAutoDiscover(String sysObjectId, String sysDesc,
	    Snmp poller) {
		return sysObjectId.matches("^1\\.3\\.6\\.1\\.4\\.1\\.2636\\..*")
		    && sysDesc.matches(".* JUNOS .*");
	}

	/**
	 * Analyze Syslog message to schedule a snapshot if needed.
	 * 
	 * @param message
	 *          the message
	 * @param ipAddress
	 *          the IP address which sent the message
	 * @return true, if need to go on analyzing the message with other drivers
	 */
	public static boolean analyzeSyslog(String message, Network4Address ipAddress) {
		Matcher configuredBy = COMMIT.matcher(message);
		if (configuredBy.find()) {
			return TakeSnapshotTask
			    .takeSnapshotIfNeeded(JunOsDevice.class, ipAddress);
		}
		return false;
	}

	/** The trap OID. */
	private static OID TRAP_OID = new OID("1.3.6.1.6.3.1.1.4.1.0");

	/** The OID for a Juniper configuration change. */
	private static final String TRAP_JNXCMCFGCHANGE = "1.3.6.1.4.1.2636.4.5.0.1";

	/**
	 * Analyzes a trap to potentially start a snapshot task.
	 * 
	 * @param pdu
	 *          the PDU
	 * @param ipAddress
	 *          the IP address which sent the trap
	 * @return true, if need to go on analyzing the message with other drivers
	 */
	public static boolean analyzeTrap(PDU pdu, Network4Address ipAddress) {
		List<VariableBinding> trapValues = pdu.getBindingList(TRAP_OID);
		if (trapValues.size() == 0) {
			return false;
		}
		if (!trapValues.get(0).getVariable().toString().equals(TRAP_JNXCMCFGCHANGE)) {
			return false;
		}

		return TakeSnapshotTask.takeSnapshotIfNeeded(JunOsDevice.class, ipAddress);
	}

	/** The CLI session (SSH or Telnet). */
	private transient Cli cli;

	/** The CLI account in user. */
	private transient DeviceCliAccount cliInUseAccount = null;

	/**
	 * Instantiates a new JUNOS device.
	 * 
	 * @param address
	 *          the address
	 * @param domain
	 *          the domain
	 */
	public JunOsDevice(Network4Address address, Domain domain) {
		super(address, domain);
	}

	/**
	 * Instantiates a new JUNOS device.
	 */
	public JunOsDevice() {
		super(null, null);
	}

	/**
	 * Executes a command through CLI.
	 * 
	 * @param command
	 *          the command
	 * @return the string
	 * @throws IOException
	 *           Signals that an I/O exception has occurred.
	 */
	private String cliExecCommand(String command) throws IOException {
		String[] expects = new String[] { CLI_PROMPT, "unknown command." };
		this.logIt("Executing command " + command, 7);
		String output = cli.send(command + CLI_CR, expects);
		if (cli.getLastExpectMatchIndex() != 0) {
			throw new IOException("Invalid command");
		}
		return output;
	}

	/**
	 * Initially waits for CLI to be ready.
	 * 
	 * @throws IOException
	 *           Signals that an I/O exception has occurred.
	 */
	private void cliWait() throws IOException {
		String[] expects = new String[] { CLI_PROMPT };
		cli.send("", expects);
	}

	/**
	 * Tries a CLI connection.
	 * 
	 * @param credentialSet
	 *          the credential set
	 * @return true, if successful
	 */
	private boolean cliTryConnect(DeviceCredentialSet credentialSet) {
		if (credentialSet instanceof DeviceSshAccount) {
			try {
				cliInUseAccount = (DeviceCliAccount) credentialSet;
				cli = new Ssh(mgmtAddress, cliInUseAccount.getUsername(),
				    cliInUseAccount.getPassword());
				cli.connect();
				return true;
			}
			catch (IOException e) {
				this.logIt("Error while connecting via SSH: " + e.getMessage(), 3);
				cliInUseAccount = null;
			}
		}
		return false;
	}

	/**
	 * Connects to the CLI session.
	 * 
	 * @return true, if successful
	 */
	private boolean cliConnect() {
		for (DeviceCredentialSet credentialSet : credentialSets) {
			if (cliTryConnect(credentialSet)) {
				return true;
			}
		}
		if (this.autoTryCredentials) {
			Session session = NetshotDatabase.getSession();
			try {
				List<DeviceCredentialSet> globalCredentialSets = this
				    .getAutoCredentialSetList(session);
				for (DeviceCredentialSet credentialSet : globalCredentialSets) {
					if (cliTryConnect(credentialSet)) {
						credentialSets.clear();
						credentialSets.add(credentialSet);
						autoTryCredentials = false;
						return true;
					}
				}
			}
			catch (HibernateException e) {
				session.getTransaction().rollback();
				this.logIt("Error while retrieving the global credentials.", 2);
				return false;
			}
			finally {
				session.close();
			}
		}
		return false;
	}

	/**
	 * Gets the device type.
	 * 
	 * @return the device type
	 */
	@XmlElement
	@Transient
	@ConfigItem(name = "Type", type = ConfigItem.Type.CHECKABLE)
	public static String getDeviceType() {
		return "Juniper Junos device";
	}
	
	@Transient
	@XmlElement
	public String getRealDeviceType() {
		return getDeviceType();
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.netshot.device.Device#takeSnapshot()
	 */
	@Override
	public boolean takeSnapshot() throws Exception {
		if (!cliConnect()) {
			this.logIt("No CLI connection to the device could be opened.", 3);
			throw new IOException("Unable to open a CLI connection to the device.");
		}

		JunOsConfig config = new JunOsConfig(this);

		networkInterfaces.clear();
		vrfInstances.clear();
		virtualDevices.clear();
		eolModule = null;
		eosModule = null;
		modules.clear();
		location = "";
		contact = "";

		try {
			this.cliWait();
			this.logIt("Executing show version", 7);
			String showVersion = this.cliExecCommand("show version | no-more");

			Pattern pattern;
			Matcher matcher;

			pattern = Pattern.compile("^Hostname: (?<name>.*)$", Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				this.name = matcher.group("name");
			}
			pattern = Pattern.compile(
			    "^JUNOS Base OS Software Suite \\[(?<version>.*)\\]$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				config.setJunOsVersion(matcher.group("version"));
				this.setSoftwareVersion(matcher.group("version"));
			}
			this.networkClass = NetworkClass.ROUTER;
			this.family = "Unknown JunOS device";
			pattern = Pattern.compile("^Model: (?<model>.*)$", Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				String model = matcher.group("model");
				this.family = model + " JunOS device";
				if (model.matches("EX")) {
					this.networkClass = NetworkClass.SWITCH;
				}
				else if (model.matches("ISG")) {
					this.networkClass = NetworkClass.FIREWALL;
				}
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get show version: " + e.getMessage(), 3);
		}

		try {
			String showInterfaces = this.cliExecCommand("show interfaces | no-more");
			Pattern pattern = Pattern
			    .compile(
			        "^Physical interface: (?<name>.*), (?<status>Enabled|Administratively down),.*[\\r\\n]+(?<details>(  .*[\\r\\n]+)*?)(?=\\S|$)",
			        Pattern.MULTILINE);
			Matcher matcher = pattern.matcher(showInterfaces);
			while (matcher.find()) {
				String interfaceName = matcher.group("name");
				if (interfaceName.matches("^(vcp|bme|jsrv|pime|vme|lsi).*")) {
					continue;
				}
				boolean interfaceEnabled = matcher.group("status").equals("Enabled");
				String interfaceDetails = matcher.group("details");
				String interfaceDescription = "";
				PhysicalAddress macAddress = null;
				Pattern subPattern;
				Matcher subMatcher;

				subPattern = Pattern.compile("^  Description: (?<desc>.*)$",
				    Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceDetails);
				if (subMatcher.find()) {
					interfaceDescription = subMatcher.group("desc");
				}
				NetworkInterface networkInterface = new NetworkInterface(this,
				    interfaceName, "", "", interfaceEnabled, false,
				    interfaceDescription);

				subPattern = Pattern
				    .compile(
				        "Hardware address: (?<mac>[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})",
				        Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceDetails);
				if (subMatcher.find()) {
					macAddress = new PhysicalAddress(subMatcher.group("mac"));
				}
				if (macAddress != null) {
					networkInterface.setPhysicalAddress(macAddress);
				}
				networkInterfaces.add(networkInterface);

				subPattern = Pattern
				    .compile(
				        "^  Logical interface (?<name>.*) \\(Index.*[\\r\\n]+(?<details>(    .*[\\r\\n]+)*?)(?=  \\S|$)",
				        Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceDetails);
				while (subMatcher.find()) {
					String subInterfaceName = subMatcher.group("name");
					String subInterfaceDetails = subMatcher.group("details");
					Pattern subSubPattern;
					Matcher subSubMatcher;
					String subInterfaceDescription = "";
					subSubPattern = Pattern.compile("^    Description: (?<desc>.*)$",
					    Pattern.MULTILINE);
					subSubMatcher = subSubPattern.matcher(subInterfaceDetails);
					if (subSubMatcher.find()) {
						subInterfaceDescription = subSubMatcher.group("desc");
					}
					NetworkInterface subInterface = new NetworkInterface(this,
					    subInterfaceName, "", "", interfaceEnabled, false,
					    subInterfaceDescription);
					if (macAddress != null) {
						subInterface.setPhysicalAddress(macAddress);
					}
					subSubPattern = Pattern
					    .compile(
					        "^        (Destination: (?<net>[0-9\\.]+)/(?<mask>([0-9]|1[0-9]|2[0-9]|3[0-2])), )?Local: (?<ip>[0-9\\.]+)",
					        Pattern.MULTILINE);
					subSubMatcher = subSubPattern.matcher(subInterfaceDetails);
					while (subSubMatcher.find()) {
						try {
							String mask = subSubMatcher.group("mask");
							if (mask == null) {
								mask = "32";
							}
							Network4Address ipAddress = new Network4Address(
							    subSubMatcher.group("ip"), Integer.parseInt(mask));
							subInterface.setLevel3(true);
							subInterface.addIpAddress(ipAddress);
						}
						catch (Exception e) {
							this.logIt(
							    "Unable to parse IP address " + subSubMatcher.group("ip"), 4);
						}
					}
					subSubPattern = Pattern
					    .compile(
					        "^        (Destination: (?<net>[0-9a-f\\:]+)/(?<mask>[0-9]+), )?Local: (?<ip>[0-9a-f\\:]+)",
					        Pattern.MULTILINE);
					subSubMatcher = subSubPattern.matcher(subInterfaceDetails);
					while (subSubMatcher.find()) {
						try {
							String mask = subSubMatcher.group("mask");
							if (mask == null) {
								mask = "128";
							}
							Network6Address ipAddress = new Network6Address(
							    subSubMatcher.group("ip"), Integer.parseInt(mask));
							subInterface.setLevel3(true);
							subInterface.addIpAddress(ipAddress);
						}
						catch (Exception e) {
							this.logIt(
							    "Unable to parse IP address " + subSubMatcher.group("ip"), 4);
						}
					}
					networkInterfaces.add(subInterface);
				}
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get show interfaces: " + e.getMessage(), 3);
		}

		try {
			String currentConfig = this
			    .cliExecCommand("show configuration | no-more");
			config.setConfigAsText(currentConfig);
			Pattern pattern;
			Matcher matcher;

			pattern = Pattern.compile("^## Last commit: .* by (?<name>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(currentConfig);
			if (matcher.find()) {
				config.setAuthor(matcher.group("name"));
			}

			pattern = Pattern.compile(
			    "^snmp \\{[\\r\\n]+(?<details>(  .*[\\r\\n]+)*?)^\\}$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(currentConfig);
			if (matcher.find()) {
				String snmpConfig = matcher.group("details");
				Pattern subPattern = Pattern.compile(
				    "^ +location \"(?<location>.*)\"$", Pattern.MULTILINE);
				Matcher subMatcher = subPattern.matcher(snmpConfig);
				if (subMatcher.find()) {
					this.setLocation(subMatcher.group("location"));
				}
				snmpConfig = matcher.group("details");
				subPattern = Pattern.compile("^ +contact \"(?<contact>.*)\"$",
				    Pattern.MULTILINE);
				subMatcher = subPattern.matcher(snmpConfig);
				if (subMatcher.find()) {
					this.setContact(subMatcher.group("contact"));
				}
			}
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Couldn't get the configuration: " + e.getMessage());
		}

		try {
			String showChassisHardware = this
			    .cliExecCommand("show chassis hardware | no-more");
			Pattern pattern = Pattern
			    .compile(
			        "^Item             Version  Part number  Serial number     Description$",
			        Pattern.MULTILINE);
			Matcher matcher = pattern.matcher(showChassisHardware);
			if (matcher.find()) {
				Pattern subPattern = Pattern
				    .compile(
				        "^(?<indent> *)(?<item>.{15}) (?<version>.{8}) (?<part>.{12}) (?<serial>.{17}) (?<desc>.*)$",
				        Pattern.MULTILINE);
				Matcher subMatcher = subPattern.matcher(showChassisHardware);
				List<String> path = new ArrayList<String>();
				path.add("");
				while (subMatcher.find()) {
					if (subMatcher.start() <= matcher.start()) {
						continue;
					}
					String preSpaces = subMatcher.group("indent");
					String item = subMatcher.group("item").trim();
					String serial = subMatcher.group("serial").trim();
					String description = subMatcher.group("desc").trim();
					while (preSpaces.length() < path.size()) {
						path.remove(path.size() - 1);
					}
					while (preSpaces.length() > path.size()) {
						path.add("");
					}
					path.add(item);
					if (!description.equals("")) {
						String slot = "";
						for (int i = 0; i < path.size() - 1; i++) {
							slot += path.get(i) + " ";
						}
						slot += item;
						Module module = new Module();
						module.setDevice(this);
						module.setSlot(slot);
						module.setPartNumber(description);
						module.setSerialNumber(serial);
						this.modules.add(module);
					}
				}
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get the inventory. " + e.getMessage(), 2);
		}

		/*
		 * try { String showInventory = this.cliExecCommand("show inventory");
		 * Pattern pattern = Pattern.compile(
		 * "NAME: \"(?<name>.*)\", DESCR: \"(?<descr>.*)\"[\r\n]+PID: (?<pid>.*), VID: (?<vid>.*), SN: (?<sn>.*)"
		 * ); Matcher matcher = pattern.matcher(showInventory); while
		 * (matcher.find()) { Module module = new Module(); module.setDevice(this);
		 * module.setSlot(matcher.group("name"));
		 * module.setPartNumber(matcher.group("pid"));
		 * module.setSerialNumber(matcher.group("sn")); this.modules.add(module); }
		 * } catch (IOException e) { this.logIt("Couldn't get the inventory. " +
		 * e.getMessage(), 2); }
		 */

		cli.disconnect();

		Config lastConfig = NetshotDatabase.unproxy(this.lastConfig);
		if (config.equals(lastConfig)) {
			this.logIt("The configuration hasn't changed. Not storing a new entry.",
			    3);
		}
		else {
			this.lastConfig = config;
			this.configs.add(config);
		}
		return false;
	}

}
