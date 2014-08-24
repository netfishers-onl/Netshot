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
import org.netshot.collector.TftpServer;
import org.netshot.collector.TftpServer.TftpTransfer;
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
 * A Brocade FastIron device.
 */
@Entity
@XmlRootElement()
public class BrocadeFastIronDevice extends Device implements
    AutoSnmpDiscoverableDevice {

	/**
	 * The Class FoundryFastIronConfig.
	 */
	@Entity
	public static class BrocadeFastIronConfig extends Config {

		/** The software version. */
		private String osVersion = "";

		/** The running config. */
		private LongTextConfiguration runningConfig = new LongTextConfiguration();

		/** The startup config. */
		private LongTextConfiguration lightStartupConfig = new LongTextConfiguration();

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getRunningConfig() {
			return runningConfig;
		}

		protected void setRunningConfig(LongTextConfiguration textRunningConfig) {
			this.runningConfig = textRunningConfig;
		}

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getLightStartupConfig() {
			return lightStartupConfig;
		}

		protected void setLightStartupConfig(
				LongTextConfiguration textLightStartupConfig) {
			this.lightStartupConfig = textLightStartupConfig;
		}

		/** The startup matches running. */
		private boolean startupMatchesRunning = true;

		/**
		 * Instantiates a new Brocade FastIron config.
		 */
		protected BrocadeFastIronConfig() {
			super();
		}

		/**
		 * Instantiates a new Brocade FastIron config.
		 * 
		 * @param device
		 *          the device
		 */
		public BrocadeFastIronConfig(Device device) {
			super(device);
		}

		/**
		 * Gets the OS version.
		 * 
		 * @return the OS version
		 */
		@XmlElement
		@ConfigItem(name = "OS version", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getOsVersion() {
			return osVersion;
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
		 * Gets the startup config.
		 * 
		 * @return the startup config
		 */
		@ConfigItem(name = "Startup-Config", type = { ConfigItem.Type.RETRIEVABLE,
		    ConfigItem.Type.CHECKABLE })
		@Transient
		public String getStartupConfig() {
			if (startupMatchesRunning)
				return runningConfig.getText();
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
		public boolean isStartupMatchesRunning() {
			return startupMatchesRunning;
		}

		/**
		 * Sets the OS version.
		 * 
		 * @param osVersion
		 *          the new OS version
		 */
		public void setOsVersion(String iosVersion) {
			this.osVersion = iosVersion;
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
		 * @param startupMatchesRunning
		 *          the new startup matches running
		 */
		public void setStartupMatchesRunning(boolean startupMatchesRunning) {
			this.startupMatchesRunning = startupMatchesRunning;
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
			result = prime * result
			    + ((osVersion == null) ? 0 : osVersion.hashCode());
			result = prime * result
			    + ((runningConfig == null) ? 0 : runningConfig.hashCode());
			result = prime * result
			    + ((lightStartupConfig == null) ? 0 : lightStartupConfig.hashCode());
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
			BrocadeFastIronConfig other = (BrocadeFastIronConfig) obj;
			if (osVersion == null) {
				if (other.osVersion != null)
					return false;
			}
			else if (!osVersion.equals(other.osVersion))
				return false;
			if (runningConfig == null) {
				if (other.runningConfig != null)
					return false;
			}
			else if (!runningConfig.equals(other.runningConfig))
				return false;
			if (lightStartupConfig == null) {
				if (other.lightStartupConfig != null)
					return false;
			}
			else if (!lightStartupConfig.equals(other.lightStartupConfig))
				return false;
			return true;
		}

		@Override
		public void writeToFile() throws IOException {
			StringBuffer conf = new StringBuffer();
			conf.append("! Netshot - Brocade FastIron configuration file\r\n");
			conf.append("! Device ");
			conf.append(this.device.getName());
			conf.append("\r\n");
			conf.append("! Date/time ");
			conf.append(this.changeDate);
			conf.append("\r\n");
			conf.append("! OS version ");
			conf.append(this.osVersion);
			conf.append("\r\n");
			conf.append(this.runningConfig);
			writeToFile(conf.toString());
		}

	}

	/** The Constant CLI_CR. */
	private static final String CLI_CR = "\r";

	/** The Constant CLI_DIS_PROMPT. */
	private static final String CLI_DIS_PROMPT = "^[A-Za-z0-9_\\-\\.@]+>$";

	/** The Constant CLI_ENA_PROMPT. */
	private static final String CLI_ENA_PROMPT = "^[A-Za-z0-9_\\-\\.@]+#$";

	/** The Constant CONFIGUREDBY. */
	private static final Pattern CONFIGUREDBY = Pattern
	    .compile("running-config was changed by (?<user>.*) from .*");

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.netshot.device.AutoSnmpDiscoverableDevice#snmpAutoDiscover(java.lang
	 * .String, java.lang.String, org.netshot.device.access.Snmp)
	 */
	public boolean snmpAutoDiscover(String sysObjectId, String sysDesc,
	    Snmp poller) {
		return sysObjectId.matches("^1\\.3\\.6\\.1\\.4\\.1\\.1991\\.1\\.3\\..*")
		    && sysDesc.matches("(?s).*IronWare Version.*");
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
			return TakeSnapshotTask.takeSnapshotIfNeeded(BrocadeFastIronDevice.class,
			    ipAddress);
		}
		return false;
	}

	/** The trap oid. */
	private static OID TRAP_OID = new OID("1.3.6.1.6.3.1.1.4.1.0");

	/** The Constant TRAP_SNTRAPRUNNINGCONFIGCHANGED */
	private static final String TRAP_SNTRAPRUNNINGCONFIGCHANGED = "1.3.6.1.4.1.1991.0.73";

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
		    .equals(TRAP_SNTRAPRUNNINGCONFIGCHANGED)) {
			return false;
		}
		return TakeSnapshotTask.takeSnapshotIfNeeded(BrocadeFastIronDevice.class,
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
		return "Brocade FastIron switch";
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

	/** The config register. */
	private String configRegister = "";

	/** The main flash size. */
	private int mainFlashSize = -1;

	/** The main memory size. */
	private int mainMemorySize = -1;

	/**
	 * Instantiates a new cisco ios device.
	 */
	public BrocadeFastIronDevice() {
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
	public BrocadeFastIronDevice(Network4Address address, Domain domain) {
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
		String[] expects = new String[] { CLI_ENA_PROMPT, CLI_DIS_PROMPT,
		    "Username: ", "Password: ", "% Unknow command", "% Invalid input",
		    "command authorization failed", "% Bad secrets" };

		cli.send("", expects);
		if (cli.getLastExpectMatchIndex() == 2) { // Username
			this.logIt("Sending username", 7);
			cli.send(cliInUseAccount.getUsername() + CLI_CR, expects);
		}
		if (cli.getLastExpectMatchIndex() == 3) { // Password
			this.logIt("Sending password", 7);
			cli.send(cliInUseAccount.getPassword() + CLI_CR, expects);
		}
		if (cli.getLastExpectMatchIndex() == 1) { // Disabled mode
			this.logIt("Switching to enabled mode", 7);
			cli.send("enable" + CLI_CR, expects);
			if (cli.getLastExpectMatchIndex() == 3) {
				cli.send(cliInUseAccount.getSuperPassword() + CLI_CR, expects);
			}
			if (cli.getLastExpectMatchIndex() != 0) {
				throw new IOException("Couldn't get to enabled mode.");
			}
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
		String[] expects = new String[] { CLI_ENA_PROMPT, "Invalid input",
		    "command authorization failed" };
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

	private boolean cliTftpStart(String command) throws IOException {
		String[] expects = new String[] { "Upload .*-config to TFTP server done.",
		    "Error - can't upload .*-config to TFTP server." };
		cli.send(command + CLI_CR, expects);
		if (cli.getLastExpectMatchIndex() == 0) {
			return true;
		}
		return false;
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

	/**
	 * Gets the config register.
	 * 
	 * @return the config register
	 */
	@XmlElement
	public String getConfigRegister() {
		return configRegister;
	}

	/**
	 * Gets the main flash size.
	 * 
	 * @return the main flash size
	 */
	@XmlElement
	@ConfigItem(name = "Flash size (MB)", type = ConfigItem.Type.SEARCHABLE, comparator = ConfigItem.Comparator.NUMERIC)
	public int getMainFlashSize() {
		return mainFlashSize;
	}

	/**
	 * Gets the main memory size.
	 * 
	 * @return the main memory size
	 */
	@XmlElement
	@ConfigItem(name = "Memory size (MB)", type = ConfigItem.Type.SEARCHABLE, comparator = ConfigItem.Comparator.NUMERIC)
	public int getMainMemorySize() {
		return mainMemorySize;
	}

	/**
	 * Sets the config register.
	 * 
	 * @param configRegister
	 *          the new config register
	 */
	public void setConfigRegister(String configRegister) {
		this.configRegister = configRegister;
	}

	/**
	 * Sets the main flash size.
	 * 
	 * @param mainFlashSize
	 *          the new main flash size
	 */
	public void setMainFlashSize(int mainFlashSize) {
		this.mainFlashSize = mainFlashSize;
	}

	/**
	 * Sets the main memory size.
	 * 
	 * @param mainMemorySize
	 *          the new main memory size
	 */
	public void setMainMemorySize(int mainMemorySize) {
		this.mainMemorySize = mainMemorySize;
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
			this.cliExecCommand("skip-page-display");
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Cannot use CLI. " + e.getMessage());
		}

		BrocadeFastIronConfig config = new BrocadeFastIronConfig(this);

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
			String showChassis = this.cliExecCommand("show chassis");

			Pattern pattern;
			Matcher matcher;

			pattern = Pattern.compile("(?<memory>\\d+) KB code flash memory",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				// Round by 4MB
				this.mainFlashSize = Math.round(Integer.parseInt(matcher
				    .group("memory")) / 1024 / 4) * 4;
			}
			this.networkClass = NetworkClass.SWITCH;
			this.family = "Unknown Brocade FastIron switch";
			pattern = Pattern.compile("(?<memory>\\d+) MB DRAM", Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				this.mainMemorySize = Integer.parseInt(matcher.group("memory"));
				this.mainMemorySize = 4 * Math.round(this.mainMemorySize / 1024 / 4);
			}
			pattern = Pattern.compile("SW: Version (?<version>[0-9\\.A-Za-z]+)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				config.setOsVersion(matcher.group("version"));
				this.setSoftwareVersion(config.getOsVersion());
			}
			pattern = Pattern.compile("Chassis Type: (?<chassis>.*)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showChassis);
			if (matcher.find()) {
				this.setFamily(matcher.group("chassis"));
				Pattern subPattern = Pattern.compile("Serial  #: (?<serial>.*)",
				    Pattern.MULTILINE);
				Matcher subMatcher = subPattern.matcher(showVersion);
				if (subMatcher.find()) {
					Module module = new Module();
					module.setDevice(this);
					module.setSlot("Chassis");
					module.setPartNumber(matcher.group("chassis"));
					module.setSerialNumber(subMatcher.group("serial"));
					this.modules.add(module);
				}
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't general information: " + e.getMessage(), 3);
		}

		try {
			String runningConfig = null;
			if (TftpServer.isRunning()) {
				try {
					final String fileName = "running.conf";
					TftpTransfer tftpTransfer = TftpServer.getServer().prepareTransfer(
					    mgmtAddress, fileName, 90);
					if (this.cliTftpStart(String.format("copy running-config tftp %s %s",
					    this.getMgmtDomain().getServer4Address().getIP(), fileName))) {
						runningConfig = TftpServer.getServer().getResult(tftpTransfer);
					}
				}
				catch (Exception e) {
					this.logIt(
					    "Couldn't copy the running configuration via TFTP, using the 'show' command.",
					    3);
				}
			}
			if (runningConfig == null) {
				runningConfig = this.cliExecCommand("show running-config");
			}
			Pattern pattern;
			Matcher matcher;

			runningConfig = runningConfig
			    .substring(runningConfig.indexOf("\nver ") + 1);
			runningConfig = runningConfig.substring(0,
			    runningConfig.indexOf("\nend") + 4);
			config.setRunningConfigAsText(runningConfig);

			pattern = Pattern
			    .compile("^hostname (?<hostname>.*)$", Pattern.MULTILINE);
			matcher = pattern.matcher(runningConfig);
			if (matcher.find()) {
				this.name = matcher.group("hostname");
			}
			pattern = Pattern.compile("^snmp-server location (?<location>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(runningConfig);
			if (matcher.find()) {
				this.location = matcher.group("location");
			}
			pattern = Pattern.compile("^snmp-server contact (?<contact>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(runningConfig);
			if (matcher.find()) {
				this.contact = matcher.group("contact");
			}

			pattern = Pattern.compile(
			    "^interface (?<name>.*)[\\r\\n]+(?<params>( .*[\\r\\n]+)*?)(?=\\S)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(runningConfig);
			while (matcher.find()) {
				String interfaceName = matcher.group("name");
				String interfaceConfig = matcher.group("params");
				String vrfInstance = "";
				Pattern subPattern;
				Matcher subMatcher;
				subPattern = Pattern.compile("^ (ip )?vrf forwarding (?<vrf>.*)$",
				    Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				if (subMatcher.find()) {
					vrfInstance = subMatcher.group("vrf");
				}
				boolean level3 = false;
				subPattern = Pattern.compile("^ disable$", Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				boolean enabled = !subMatcher.find();
				String description = "";
				subPattern = Pattern.compile("^ port-name (?<desc>.+)$",
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
						networkInterface.setLevel3(true);
						networkInterface.addIpAddress(new Network4Address(subMatcher
						    .group("addr"), subMatcher.group("mask")));
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
						networkInterface.setLevel3(true);
						networkInterface.addIpAddress(new Network6Address(subMatcher
						    .group("addr"), subMatcher.group("len")));
					}
					catch (UnknownHostException e) {
						this.logIt("Unable to parse IP address. " + e.getMessage(), 3);
					}
				}
				try {
					String showInterface = this.cliExecCommand(String.format(
					    "show interface %s | inc address", interfaceName));
					subPattern = Pattern
					    .compile("address is (?<mac>[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4})");
					subMatcher = subPattern.matcher(showInterface);
					if (subMatcher.find()) {
						PhysicalAddress macAddress = new PhysicalAddress(
						    subMatcher.group("mac"));
						networkInterface.setPhysicalAddress(macAddress);
					}
				}
				catch (IOException e) {
					this.logIt("Couldn't run show interface. " + e.getMessage(), 3);
				}

				networkInterfaces.add(networkInterface);
			}
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Couldn't get the running config: "
			    + e.getMessage());
		}

		try {
			String startupConfig = null;
			if (TftpServer.isRunning()) {
				try {
					final String fileName = "startup.conf";
					TftpTransfer tftpTransfer = TftpServer.getServer().prepareTransfer(
					    mgmtAddress, fileName, 90);
					if (this.cliTftpStart(String.format("copy startup-config tftp %s %s",
					    this.getMgmtDomain().getServer4Address().getIP(), fileName))) {
						startupConfig = TftpServer.getServer().getResult(tftpTransfer);
					}
				}
				catch (Exception e) {
					this.logIt(
					    "Couldn't copy the startup configuration via TFTP, using the 'show' command.",
					    3);
				}
			}
			if (startupConfig == null) {
				startupConfig = this.cliExecCommand("show configuration");
			}
			startupConfig = startupConfig
			    .substring(startupConfig.indexOf("\nver ") + 1);
			startupConfig = startupConfig.substring(0,
			    startupConfig.indexOf("\nend") + 4);
			config.setLightStartupConfigAsText(startupConfig);
			if (startupConfig.compareTo(config.getRunningConfigAsText()) == 0) {
				config.setStartupMatchesRunning(true);
			}
			else {
				config.setStartupMatchesRunning(false);
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get the startup config. " + e.getMessage(), 2);
		}

		cli.disconnect();

		Config lastConfig = NetshotDatabase.unproxy(this.lastConfig);
		if (config.equals(lastConfig)) {
			this.logIt("The configuration hasn't changed. Not storing a new entry.",
			    3);
		}
		else {
			if (config.startupMatchesRunning) {
				config.setLightStartupConfigAsText("");
			}
			this.lastConfig = config;
			this.configs.add(config);
		}
		return false;
	}

}
