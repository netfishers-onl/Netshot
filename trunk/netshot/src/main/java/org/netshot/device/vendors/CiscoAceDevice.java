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

/**
 * A Cisco ACE device.
 */
@Entity
@XmlRootElement()
public class CiscoAceDevice extends Device implements
    AutoSnmpDiscoverableDevice {

	/**
	 * The Class CiscoAceConfig.
	 */
	@Entity
	public static class CiscoAceConfig extends Config {

		/** The ACE version. */
		private String aceVersion = "";

		/** The ACE image. */
		private String systemImage = "";

		/** The running config. */
		private LongTextConfiguration runningConfig = new LongTextConfiguration();

		/**
		 * Instantiates a new ACE config.
		 */
		protected CiscoAceConfig() {
			super();
		}

		/**
		 * Instantiates a new Cisco ACE config.
		 * 
		 * @param device
		 *          the device
		 */
		public CiscoAceConfig(Device device) {
			super(device);
		}

		/**
		 * Gets the ACE version.
		 * 
		 * @return the NX-OS version
		 */
		@XmlElement
		@ConfigItem(name = "ACE version", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getAceVersion() {
			return aceVersion;
		}

		/**
		 * Gets the running config.
		 * 
		 * @return the running config
		 */
		@Transient
		@ConfigItem(name = "Running-Config", alias = "Config", type = {
		    ConfigItem.Type.RETRIEVABLE, ConfigItem.Type.DIFFABLE,
		    ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getRunningConfigAsText() {
			return runningConfig.getText();
		}

		/**
		 * Sets the ACE version.
		 * 
		 * @param aceVersion
		 *          the new ACE version
		 */
		public void setAceVersion(String aceVersion) {
			this.aceVersion = aceVersion;
		}

		/**
		 * Sets the running config.
		 * 
		 * @param runningConfig
		 *          the new running config
		 */
		public void setRunningConfigAsText(String runningConfig) {
			this.runningConfig.setText(runningConfig);
		}

		@Override
		public void writeToFile() throws IOException {
			StringBuffer conf = new StringBuffer();
			conf.append("! Netshot - Cisco ACE configuration file\r\n");
			conf.append("! Device ");
			conf.append(this.device.getName());
			conf.append("\r\n");
			conf.append("! Date/time ");
			conf.append(this.changeDate);
			conf.append("\r\n");
			conf.append("! ACE system image ");
			conf.append(this.systemImage);
			conf.append("\r\n");
			conf.append(this.runningConfig);
			writeToFile(conf.toString());
		}

		@XmlElement
		@ConfigItem(name = "ACE image file", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getSystemImage() {
			return systemImage;
		}

		public void setSystemImage(String aceSystemImage) {
			this.systemImage = aceSystemImage;
		}

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getRunningConfig() {
			return runningConfig;
		}

		protected void setRunningConfig(LongTextConfiguration runningConfig) {
			this.runningConfig = runningConfig;
		}

		@Override
		public int hashCode() {
			final int prime = 31;
			int result = 1;
			result = prime * result
			    + ((aceVersion == null) ? 0 : aceVersion.hashCode());
			result = prime * result
			    + ((runningConfig == null) ? 0 : runningConfig.hashCode());
			result = prime * result
			    + ((systemImage == null) ? 0 : systemImage.hashCode());
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
			CiscoAceConfig other = (CiscoAceConfig) obj;
			if (aceVersion == null) {
				if (other.aceVersion != null)
					return false;
			}
			else if (!aceVersion.equals(other.aceVersion))
				return false;
			if (runningConfig == null) {
				if (other.runningConfig != null)
					return false;
			}
			else if (!runningConfig.equals(other.runningConfig))
				return false;
			if (systemImage == null) {
				if (other.systemImage != null)
					return false;
			}
			else if (!systemImage.equals(other.systemImage))
				return false;
			return true;
		}

	}

	/** The Constant CLI_CR. */
	private static final String CLI_CR = "\r";

	/** The Constant CLI_PROMPT. */
	private static final String CLI_PROMPT = "^[A-Za-z0-9_\\-\\.]+/[A-Za-z0-9_\\-\\.]+# $";

	/** The Constant CONFIGUREDBY. */
	private static final Pattern CONFIGUREDBY = Pattern
	    .compile("%ACE-5-111008: User '(?<user>.*)' executed the .*");

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.netshot.device.AutoSnmpDiscoverableDevice#snmpAutoDiscover(java.lang
	 * .String, java.lang.String, org.netshot.device.access.Snmp)
	 */
	public boolean snmpAutoDiscover(String sysObjectId, String sysDesc,
	    Snmp poller) {
		return sysObjectId
		    .matches("^1\\.3\\.6\\.1\\.4\\.1\\.9\\.1\\.(1291|729|730|824|1231)")
		    && sysDesc.matches("Application Control Engine Service Module");
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
		Matcher configuredBy = CONFIGUREDBY.matcher(message);
		if (configuredBy.find()) {
			return TakeSnapshotTask.takeSnapshotIfNeeded(CiscoAceDevice.class,
			    ipAddress);
		}
		return false;
	}

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
		// The Cisco ACE doesn't seem to send any trap upon configuration
		// change.
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
		return "Cisco ACE Device";
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
	 * Instantiates a new Cisco ACE device.
	 */
	public CiscoAceDevice() {
		// Blank constructor necessary for the auto discovery process
		super(null, null);
	}

	/**
	 * Instantiates a new Cisco ACE device.
	 * 
	 * @param address
	 *          the address
	 * @param domain
	 *          the domain
	 */
	public CiscoAceDevice(Network4Address address, Domain domain) {
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
		String[] expects = new String[] { CLI_PROMPT, "login: ", "^Password: " };

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
		String[] expects = new String[] { CLI_PROMPT };
		this.logIt("Executing command " + command, 7);
		String output = cli.send(command + CLI_CR, expects);
		if (cli.getLastExpectMatchIndex() == 3) {
			throw new IOException("Authorization failure while executing the command");
		}
		if (cli.getLastExpectMatchIndex() != 0) {
			throw new IOException("Invalid command");
		}
		return output;
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
			this.cliExecCommand("terminal length 0");
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Cannot use CLI. " + e.getMessage());
		}

		CiscoAceConfig config = new CiscoAceConfig(this);

		networkInterfaces.clear();
		vrfInstances.clear();
		virtualDevices.clear();
		eolModule = null;
		eosModule = null;
		modules.clear();
		location = "";
		contact = "";

		try {
			this.logIt("Executing show version", 7);
			String showVersion = this.cliExecCommand("show version");

			Pattern pattern;
			Matcher matcher;

			pattern = Pattern
			    .compile("^(?<name>.*) kernel uptime", Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				this.name = matcher.group("name");
			}
			pattern = Pattern.compile(
			    "system image file: *(\\[LCP\\] )?(?<image>.*)", Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				config.setSystemImage(matcher.group("image"));
			}

			this.networkClass = NetworkClass.LOADBALANCER;
			this.family = "Unknown Cisco ACE device";
			pattern = Pattern.compile(
			    "^ *system: *Version (?<version>[A-Z0-9\\(\\)\\.]+)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				config.setAceVersion(matcher.group("version"));
				this.setSoftwareVersion(config.getAceVersion());
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get show version: " + e.getMessage(), 3);
		}

		try {
			String showInventory = this.cliExecCommand("show inventory");
			Pattern pattern = Pattern
			    .compile("NAME: \"(?<name>.*)\", +DESCR: \"(?<descr>.*)\" *[\r\n ]+PID: (?<pid>.*), +VID: (?<vid>.*), +SN: (?<sn>.*)");
			Matcher matcher = pattern.matcher(showInventory);
			while (matcher.find()) {
				Module module = new Module();
				module.setDevice(this);
				module.setSlot(matcher.group("name").trim());
				module.setPartNumber(matcher.group("pid").trim());
				module.setSerialNumber(matcher.group("sn").trim());
				this.modules.add(module);
				String description = matcher.group("descr");
				if (description.matches(".*Application Control Engine.*")) {
					this.setFamily(description.replaceAll("Application Control Engine",
					    "ACE"));
				}
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get the inventory. " + e.getMessage(), 2);
		}

		try {
			String showContext = this.cliExecCommand("show context | i Name");

			Pattern pattern;
			Matcher matcher;

			Pattern contextPattern = Pattern.compile("^Name: (?<context>.*) , Id",
			    Pattern.MULTILINE);
			Matcher contextMatcher = contextPattern.matcher(showContext);

			StringBuffer runningConfig = new StringBuffer();

			while (contextMatcher.find()) {
				String context = contextMatcher.group("context");
				String contextConfig = this.cliExecCommand(String.format(
				    "invoke context %s show running-config", context));
				if (context.equals("Admin")) {

					pattern = Pattern.compile(
					    "^snmp-server location \"(?<location>.*)\"", Pattern.MULTILINE);
					matcher = pattern.matcher(contextConfig);
					if (matcher.find()) {
						this.location = matcher.group("location");
					}
					pattern = Pattern.compile("^snmp-server contact \"(?<contact>.*)\"$",
					    Pattern.MULTILINE);
					matcher = pattern.matcher(contextConfig);
					if (matcher.find()) {
						this.contact = matcher.group("contact");
					}
				}
				else {
					runningConfig.append(String.format("\r\nchangeto %s\r\n", context));
				}
				contextConfig = this.cleanUpConfig(contextConfig);
				runningConfig.append(contextConfig);

				pattern = Pattern
				    .compile(
				        "^interface (?<name>.*)[\\r\\n]+(?<params>( .*[\\r\\n]+)*?)(?=\\S)",
				        Pattern.MULTILINE);
				matcher = pattern.matcher(contextConfig);
				while (matcher.find()) {
					String interfaceName = matcher.group("name");
					String interfaceConfig = matcher.group("params");
					Pattern subPattern;
					Matcher subMatcher;
					String description = "";
					subPattern = Pattern.compile("^ *description (?<desc>.+)$",
					    Pattern.MULTILINE);
					subMatcher = subPattern.matcher(interfaceConfig);
					if (subMatcher.find()) {
						description = subMatcher.group("desc");
					}

					NetworkInterface networkInterface = new NetworkInterface(this,
					    interfaceName, context, "", true, true, description);

					subPattern = Pattern
					    .compile(
					        "^ *ip address (?<addr>\\d+\\.\\d+\\.\\d+\\.\\d+) (?<mask>\\d+\\.\\d+\\.\\d+\\.\\d+)",
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
					subPattern = Pattern.compile(
					    "^ *ipv6 address (?<addr>[0-9A-Fa-f:]+)/(?<len>\\d+)$",
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
						this.cliExecCommand(String.format("changeto %s", context));
						String showInterface = this.cliExecCommand(String.format(
						    "show interface %s | inc is", interfaceName));
						this.cliExecCommand("changeto Admin");
						subPattern = Pattern
						    .compile(
						        "^ *MAC address is (?<mac>[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2})",
						        Pattern.MULTILINE);
						subMatcher = subPattern.matcher(showInterface);
						if (subMatcher.find()) {
							PhysicalAddress macAddress = new PhysicalAddress(
							    subMatcher.group("mac"));
							networkInterface.setPhysicalAddress(macAddress);
						}
						subPattern = Pattern.compile("administratively up");
						subMatcher = subPattern.matcher(showInterface);
						if (!subMatcher.find()) {
							networkInterface.setEnabled(false);
						}
					}
					catch (IOException e) {
						this.logIt("Couldn't run show interface. " + e.getMessage(), 3);
					}

					networkInterfaces.add(networkInterface);
				}
			}
			config.setRunningConfigAsText(runningConfig.toString());
		}
		catch (Exception e) {
			cli.disconnect();
			throw new IOException("Couldn't get the running config: "
			    + e.getMessage());
		}

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

	private String cleanUpConfig(String config) {
		return config.replaceAll("(?m)^Generating configuration\\.\\.\\.\\.$", "")
		    .replaceAll("^[\\n\\r]+", "");
	}

}
