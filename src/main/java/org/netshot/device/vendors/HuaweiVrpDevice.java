/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device.vendors;

import java.io.IOException;
import java.net.UnknownHostException;
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
import org.netshot.device.access.Telnet;
import org.netshot.device.credentials.DeviceCliAccount;
import org.netshot.device.credentials.DeviceCredentialSet;
import org.netshot.device.credentials.DeviceSshAccount;
import org.netshot.device.credentials.DeviceTelnetAccount;
import org.netshot.work.tasks.TakeSnapshotTask;
import org.snmp4j.PDU;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.VariableBinding;

/**
 * A Cisco IOS device.
 */
@Entity
@XmlRootElement()
public class HuaweiVrpDevice extends Device implements
    AutoSnmpDiscoverableDevice {

	/**
	 * The Class FoundryFastIronConfig.
	 */
	@Entity
	public static class HuaweiVrpConfig extends Config {

		/** The ios version. */
		private String vrpVersion = "";

		/** The running config. */
		private LongTextConfiguration currentConfig = new LongTextConfiguration();

		/** The startup config. */
		private LongTextConfiguration lightStartupConfig = new LongTextConfiguration();

		/** The startup matches running. */
		private boolean startupMatchesCurrent = true;

		/**
		 * Instantiates a new cisco ios config.
		 */
		protected HuaweiVrpConfig() {
			super();
		}

		/**
		 * Instantiates a new cisco ios config.
		 * 
		 * @param device
		 *          the device
		 */
		public HuaweiVrpConfig(Device device) {
			super(device);
		}

		/**
		 * Gets the VRP version.
		 * 
		 * @return the VRP version
		 */
		@XmlElement
		@ConfigItem(name = "VRP version", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getVrpVersion() {
			return vrpVersion;
		}

		/**
		 * Gets the running config.
		 * 
		 * @return the running config
		 */
		@Transient
		@ConfigItem(name = "Current-Config", alias = "Config", type = {
		    ConfigItem.Type.RETRIEVABLE, ConfigItem.Type.DIFFABLE,
		    ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getCurrentConfigAsText() {
			return currentConfig.getText();
		}

		/**
		 * Gets the startup config.
		 * 
		 * @return the startup config
		 */
		@ConfigItem(name = "Startup-Config", type = { ConfigItem.Type.RETRIEVABLE,
		    ConfigItem.Type.CHECKABLE })
		@Transient
		public String getStartupConfigAsText() {
			if (startupMatchesCurrent)
				return currentConfig.getText();
			return lightStartupConfig.getText();
		}
		
		
		@Transient
		public String getLightStartupConfigAsText() {
			return lightStartupConfig.getText();
		}

		/**
		 * Checks if is startup matches running.
		 * 
		 * @return true, if is startup matches running
		 */
		@XmlElement
		@ConfigItem(name = "Startup-Running sync", type = {
		    ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.BOOLEAN)
		public boolean isStartupMatchesCurrent() {
			return startupMatchesCurrent;
		}

		/**
		 * Sets the ios version.
		 * 
		 * @param vrpVersion
		 *          the new ios version
		 */
		public void setVrpVersion(String iosVersion) {
			this.vrpVersion = iosVersion;
		}

		/**
		 * Sets the running config.
		 * 
		 * @param currentConfig
		 *          the new running config
		 */
		public void setCurrentConfigAsText(String runningConfig) {
			this.currentConfig.setText(runningConfig);
		}

		/**
		 * Sets the startup config.
		 * 
		 * @param lightStartupConfig
		 *          the new startup config
		 */
		public void setLightStartupConfigAsText(String startupConfig) {
			this.lightStartupConfig.setText(startupConfig);
		}

		/**
		 * Sets the startup matches running.
		 * 
		 * @param startupMatchesCurrent
		 *          the new startup matches running
		 */
		public void setStartupMatchesCurrent(boolean startupMatchesRunning) {
			this.startupMatchesCurrent = startupMatchesRunning;
		}

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getCurrentConfig() {
			return currentConfig;
		}

		protected void setCurrentConfig(LongTextConfiguration currentConfig) {
			this.currentConfig = currentConfig;
		}

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getLightStartupConfig() {
			return lightStartupConfig;
		}

		protected void setLightStartupConfig(LongTextConfiguration lightStartupConfig) {
			this.lightStartupConfig = lightStartupConfig;
		}

		@Override
		public void writeToFile() throws IOException {
			StringBuffer conf = new StringBuffer();
			conf.append("# Netshot - Huawei NE configuration file\r\n");
			conf.append("# Device ");
			conf.append(this.device.getName());
			conf.append("\r\n");
			conf.append("# Date/time ");
			conf.append(this.changeDate);
			conf.append("\r\n");
			conf.append("# VRP version ");
			conf.append(this.vrpVersion);
			conf.append("\r\n");
			conf.append(this.currentConfig);
			writeToFile(conf.toString());
		}

		@Override
		public int hashCode() {
			final int prime = 31;
			int result = 1;
			result = prime * result
			    + ((currentConfig == null) ? 0 : currentConfig.hashCode());
			result = prime * result
			    + ((lightStartupConfig == null) ? 0 : lightStartupConfig.hashCode());
			result = prime * result
			    + ((vrpVersion == null) ? 0 : vrpVersion.hashCode());
			return result;
		}

		@Override
		public boolean equals(Object obj) {
			if (this == obj)
				return true;
			if (obj == null)
				return false;
			if (getClass() != obj.getClass())
				return false;
			HuaweiVrpConfig other = (HuaweiVrpConfig) obj;
			if (currentConfig == null) {
				if (other.currentConfig != null)
					return false;
			}
			else if (!currentConfig.equals(other.currentConfig))
				return false;
			if (lightStartupConfig == null) {
				if (other.lightStartupConfig != null)
					return false;
			}
			else if (!lightStartupConfig.equals(other.lightStartupConfig))
				return false;
			if (vrpVersion == null) {
				if (other.vrpVersion != null)
					return false;
			}
			else if (!vrpVersion.equals(other.vrpVersion))
				return false;
			return true;
		}

	}

	/** The Constant CLI_CR. */
	private static final String CLI_CR = "\r";

	/** The Constant CLI_DIS_PROMPT. */
	private static final String CLI_PROMPT = "^(<|\\[)[A-Za-z0-9_\\-\\.]+(>|\\])$";

	/** The Constant SAVED. */
	private static final Pattern SAVED = Pattern
	    .compile(".*The user chose Y when deciding whether to save the configuration to the device.");

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.netshot.device.AutoSnmpDiscoverableDevice#snmpAutoDiscover(java.lang
	 * .String, java.lang.String, org.netshot.device.access.Snmp)
	 */
	public boolean snmpAutoDiscover(String sysObjectId, String sysDesc,
	    Snmp poller) {
		return sysObjectId.matches("^1\\.3\\.6\\.1\\.4\\.1\\.2011\\.2\\.62\\..*")
		    && sysDesc.matches("(?s)Huawei Versatile Routing Platform Software.*");
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
		Matcher configuredBy = SAVED.matcher(message);
		if (configuredBy.find()) {
			return TakeSnapshotTask.takeSnapshotIfNeeded(HuaweiVrpDevice.class,
			    ipAddress);
		}
		return false;
	}

	/** The trap oid. */
	private static OID TRAP_OID = new OID("1.3.6.1.6.3.1.1.4.1.0");

	/** The Constant TRAP_HUAWEICONFIGCHANGED. */
	private static final String TRAP_HUAWEICONFIGCHANGED = "1.3.6.1.4.1.2011.5.25.191.3.1";

	/**
	 * Analyze trap.
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
		if (!trapValues.get(0).getVariable().toString()
		    .equals(TRAP_HUAWEICONFIGCHANGED)) {
			return false;
		}

		return TakeSnapshotTask.takeSnapshotIfNeeded(HuaweiVrpDevice.class,
		    ipAddress);
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
		return "Huawei NE40 Device";
	}
	
	@Transient
	@XmlElement
	public String getRealDeviceType() {
		return getDeviceType();
	}

	/** The cli. */
	private transient Cli cli;

	/** The cli in use account. */
	private transient DeviceCliAccount cliInUseAccount = null;

	/**
	 * Instantiates a new cisco ios device.
	 */
	public HuaweiVrpDevice() {
		// Blank constructor necessary for the auto discovery process
		super(null, null);
	}

	/**
	 * Instantiates a new cisco ios device.
	 * 
	 * @param address
	 *          the address
	 * @param domain
	 *          the domain
	 */
	public HuaweiVrpDevice(Network4Address address, Domain domain) {
		super(address, domain);
	}

	/**
	 * Cli connect.
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
	 * Cli enable mode.
	 * 
	 * @throws IOException
	 *           Signals that an I/O exception has occurred.
	 */
	private void cliEnableMode() throws IOException {
		String[] expects = new String[] { CLI_PROMPT, "Username:", "Password:" };

		cli.send("", expects);
		if (cli.getLastExpectMatchIndex() == 1) { // Username
			this.logIt("Sending username", 7);
			cli.send(cliInUseAccount.getUsername() + CLI_CR, expects);
		}
		if (cli.getLastExpectMatchIndex() == 2) { // Password
			this.logIt("Sending password", 7);
			cli.send(cliInUseAccount.getPassword() + CLI_CR, expects);
		}
		if (cli.getLastExpectMatchIndex() != 0) {
			throw new IOException("Invalid credentials.");
		}

	}

	/**
	 * Cli exec command.
	 * 
	 * @param command
	 *          the command
	 * @return the string
	 * @throws IOException
	 *           Signals that an I/O exception has occurred.
	 */
	private String cliExecCommand(String command) throws IOException {
		String[] expects = new String[] { CLI_PROMPT,
		    "Error: Unrecognized command", "Error:Incomplete command found",
		    "Error: Failed to pass the authorization.", "  ---- More ----" };
		this.logIt("Executing command " + command, 7);
		String output = cli.send(command + CLI_CR, expects);
		while (true) {
			if (cli.getLastExpectMatchIndex() == 3) {
				throw new IOException(
				    "Authorization failure while executing the command");
			}
			if (cli.getLastExpectMatchIndex() == 4) {
				output += cli.send(" ", expects);
				output = output.replaceAll("(?m)^.*\\033\\[42D", "");
				continue;
			}
			if (cli.getLastExpectMatchIndex() != 0) {
				throw new IOException("Invalid command");
			}
			return output;
		}
	}

	/**
	 * Cli try connect.
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
		else if (credentialSet instanceof DeviceTelnetAccount) {
			try {
				cliInUseAccount = (DeviceCliAccount) credentialSet;
				cli = new Telnet(mgmtAddress);
				cli.connect();
				return true;
			}
			catch (IOException e) {
				this.logIt("Error while connecting via Telnet: " + e.getMessage(), 3);
				cliInUseAccount = null;
			}
		}
		return false;
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

		try {
			this.cliEnableMode();
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Cannot use CLI. " + e.getMessage());
		}

		try {
			this.cliExecCommand("screen-length 0 temporary");
		}
		catch (IOException e) {
			this.logIt("Unable to set screen length to 0.", 3);
		}

		HuaweiVrpConfig config = new HuaweiVrpConfig(this);

		networkInterfaces.clear();
		vrfInstances.clear();
		virtualDevices.clear();
		eolModule = null;
		eosModule = null;
		modules.clear();
		location = "";
		contact = "";

		try {
			this.logIt("Executing display version", 7);
			String displayVersion = this.cliExecCommand("display version");

			Pattern pattern;
			Matcher matcher;

			this.networkClass = NetworkClass.SWITCHROUTER;
			this.family = "Unknown Huawei VRP device";

			pattern = Pattern.compile(
			    "^VRP \\(R\\) software, Version (?<version>.*)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(displayVersion);
			if (matcher.find()) {
				config.setVrpVersion(matcher.group("version"));
				this.setSoftwareVersion(config.getVrpVersion());
			}

			pattern = Pattern.compile("^(?<platform>.*) version information",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(displayVersion);
			if (matcher.find()) {
				this.setFamily(matcher.group("platform"));
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get display version: " + e.getMessage(), 3);
		}

		try {
			String currentConfig = this.cliExecCommand("display current-config");
			Pattern pattern;
			Matcher matcher;

			config.setCurrentConfigAsText(currentConfig);

			pattern = Pattern.compile("^ sysname (?<name>.*)", Pattern.MULTILINE);
			matcher = pattern.matcher(currentConfig);
			if (matcher.find()) {
				this.setName(matcher.group("name"));
			}

			pattern = Pattern.compile("^ ip vpn-instance (?<vrf>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(currentConfig);
			while (matcher.find()) {
				this.addVrfInstance(matcher.group("vrf"));
			}

			pattern = Pattern.compile(
			    "^ snmp-agent sys-info location (?<location>.*)$", Pattern.MULTILINE);
			matcher = pattern.matcher(currentConfig);
			if (matcher.find()) {
				this.location = matcher.group("location");
			}
			pattern = Pattern.compile(
			    "^ snmp-agent sys-info contact (?<contact>.*)$", Pattern.MULTILINE);
			matcher = pattern.matcher(currentConfig);
			if (matcher.find()) {
				this.contact = matcher.group("contact");
			}

			pattern = Pattern.compile(
			    "^interface (?<name>.*)[\\r\\n]+(?<params>( .*[\\r\\n]+)*?)(?=\\S)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(currentConfig);
			while (matcher.find()) {
				String interfaceName = matcher.group("name");
				String interfaceConfig = matcher.group("params");
				String vrfInstance = "";
				Pattern subPattern;
				Matcher subMatcher;
				subPattern = Pattern.compile("^ ip binding vpn-instance (?<vrf>.*)$",
				    Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				if (subMatcher.find()) {
					vrfInstance = subMatcher.group("vrf");
				}
				subPattern = Pattern.compile("^ portswitch", Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				boolean level3 = !subMatcher.find();
				subPattern = Pattern.compile("^ shutdown$", Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				boolean enabled = !subMatcher.find();
				String description = "";
				subPattern = Pattern.compile("^ description (?<desc>.+)$",
				    Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				if (subMatcher.find()) {
					description = subMatcher.group("desc");
				}

				NetworkInterface networkInterface = new NetworkInterface(this,
				    interfaceName, "", vrfInstance, enabled, level3, description);

				subPattern = Pattern
				    .compile(
				        "^ ip address (?<addr>\\d+\\.\\d+\\.\\d+\\.\\d+) (?<mask>\\d+\\.\\d+\\.\\d+\\.\\d+)",
				        Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				while (subMatcher.find()) {
					try {
						networkInterface.addIpAddress(new Network4Address(subMatcher
						    .group("addr"), subMatcher.group("mask")));
					}
					catch (UnknownHostException e) {
						this.logIt("Unable to parse IP address. " + e.getMessage(), 3);
					}
				}
				subPattern = Pattern
				    .compile(
				        "^ vrrp vrid (?<group>[0-9]+) virtual-ip (?<addr>\\d+\\.\\d+\\.\\d+\\.\\d+)",
				        Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				while (subMatcher.find()) {
					try {
						Network4Address hsrpAddress = new Network4Address(
						    subMatcher.group("addr"), 32);
						for (Network4Address address : networkInterface.getIp4Addresses()) {
							if (address.contains(hsrpAddress)) {
								hsrpAddress.setPrefixLength(address.getPrefixLength());
								networkInterface.addIpAddress(hsrpAddress);
								break;
							}
						}
					}
					catch (UnknownHostException e) {
						this.logIt("Unable to parse IP address. " + e.getMessage(), 3);
					}
				}
				subPattern = Pattern.compile(
				    "^ ipv6 address (?<addr>[0-9A-Fa-f:]+)/(?<len>\\d+)$",
				    Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				while (subMatcher.find()) {
					try {
						networkInterface.addIpAddress(new Network6Address(subMatcher
						    .group("addr"), subMatcher.group("len")));
					}
					catch (UnknownHostException e) {
						this.logIt("Unable to parse IP address. " + e.getMessage(), 3);
					}
				}
				try {
					String showInterface = this.cliExecCommand(String.format(
					    "display interface %s | inc address", interfaceName));
					subPattern = Pattern
					    .compile("address is (?<mac>[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4})");
					subMatcher = subPattern.matcher(showInterface);
					if (subMatcher.find()) {
						PhysicalAddress macAddress = new PhysicalAddress(
						    subMatcher.group("mac"));
						networkInterface.setPhysicalAddress(macAddress);
					}
				}
				catch (IOException e) {
					this.logIt("Couldn't run display interface. " + e.getMessage(), 3);
				}

				networkInterfaces.add(networkInterface);
			}
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Couldn't get the current config: "
			    + e.getMessage());
		}

		try {
			String startupConfig = this.cliExecCommand("display saved-config");
			config.setLightStartupConfigAsText(startupConfig);
			if (startupConfig.compareTo(config.getCurrentConfigAsText()) == 0) {
				config.setStartupMatchesCurrent(true);
			}
			else {
				config.setStartupMatchesCurrent(false);
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get the startup config. " + e.getMessage(), 2);
		}

		try {
			String displayDevice = this.cliExecCommand("display device pic-status");
			Pattern pattern = Pattern
			    .compile(
			        "^(?<slot>\\d+) *(?<pic>\\d+) * Registered (?<model>[A-Za-z0-9_]+) *(?<ports>\\d+)",
			        Pattern.MULTILINE);
			Matcher matcher = pattern.matcher(displayDevice);
			while (matcher.find()) {
				Module module = new Module();
				module.setDevice(this);
				module.setSlot(matcher.group("slot") + " " + matcher.group("pic"));
				module.setPartNumber(matcher.group("model"));
				module.setSerialNumber("");
				this.modules.add(module);
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get the inventory. " + e.getMessage(), 2);
		}

		cli.disconnect();

		if (config.startupMatchesCurrent) {
			config.setLightStartupConfigAsText("");
		}

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
