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
import org.netshot.device.NetworkAddress.AddressUsage;
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
public class CiscoIosDevice extends Device implements
    AutoSnmpDiscoverableDevice {

	/**
	 * The Class FoundryFastIronConfig.
	 */
	@Entity
	public static class CiscoIosConfig extends Config {

		/** The ios image file. */
		private String iosImageFile = "";

		/** The ios version. */
		private String iosVersion = "";

		/** The running config. */
		private LongTextConfiguration runningConfig = new LongTextConfiguration();

		/** The startup config. */
		private LongTextConfiguration lightStartupConfig = new LongTextConfiguration();

		/** The startup matches running. */
		private boolean startupMatchesRunning = true;

		/**
		 * Instantiates a new cisco ios config.
		 */
		protected CiscoIosConfig() {
			super();
		}

		/**
		 * Instantiates a new cisco ios config.
		 * 
		 * @param device
		 *          the device
		 */
		public CiscoIosConfig(Device device) {
			super(device);
		}

		/**
		 * Gets the ios image file.
		 * 
		 * @return the ios image file
		 */
		@XmlElement
		@ConfigItem(name = "IOS image file", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getIosImageFile() {
			return iosImageFile;
		}

		/**
		 * Gets the ios version.
		 * 
		 * @return the ios version
		 */
		@XmlElement
		@ConfigItem(name = "IOS version", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getIosVersion() {
			return iosVersion;
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
		public String getStartupConfigAsText() {
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
		 * Sets the ios image file.
		 * 
		 * @param iosImageFile
		 *          the new ios image file
		 */
		public void setIosImageFile(String iosImageFile) {
			this.iosImageFile = iosImageFile;
		}

		/**
		 * Sets the ios version.
		 * 
		 * @param iosVersion
		 *          the new ios version
		 */
		public void setIosVersion(String iosVersion) {
			this.iosVersion = iosVersion;
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

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getRunningConfig() {
			return runningConfig;
		}

		protected void setRunningConfig(LongTextConfiguration runningConfig) {
			this.runningConfig = runningConfig;
		}

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getLightStartupConfig() {
			return lightStartupConfig;
		}

		protected void setLightStartupConfig(LongTextConfiguration lightStartupConfig) {
			this.lightStartupConfig = lightStartupConfig;
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
			    + ((iosImageFile == null) ? 0 : iosImageFile.hashCode());
			result = prime * result
			    + ((iosVersion == null) ? 0 : iosVersion.hashCode());
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
			CiscoIosConfig other = (CiscoIosConfig) obj;
			if (iosImageFile == null) {
				if (other.iosImageFile != null)
					return false;
			}
			else if (!iosImageFile.equals(other.iosImageFile))
				return false;
			if (iosVersion == null) {
				if (other.iosVersion != null)
					return false;
			}
			else if (!iosVersion.equals(other.iosVersion))
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
			conf.append("! Netshot - Cisco IOS configuration file\r\n");
			conf.append("! Device ");
			conf.append(this.device.getName());
			conf.append("\r\n");
			conf.append("! Date/time ");
			conf.append(this.changeDate);
			conf.append("\r\n");
			conf.append("! IOS image ");
			conf.append(this.iosImageFile);
			conf.append("\r\n");
			conf.append(this.runningConfig);
			writeToFile(conf.toString());
		}

	}

	/** The Constant CLI_CR. */
	private static final String CLI_CR = "\r";

	/** The Constant CLI_DIS_PROMPT. */
	private static final String CLI_DIS_PROMPT = "^[A-Za-z0-9_\\-\\.]+>$";

	/** The Constant CLI_ENA_PROMPT. */
	private static final String CLI_ENA_PROMPT = "^[A-Za-z0-9_\\-\\.]+#$";

	/** The Constant CONFIGUREDBY. */
	private static final Pattern CONFIGUREDBY = Pattern
	    .compile("%SYS\\-5\\-CONFIG_I: Configured from (?<host>.*) by (?<user>.*)");

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.netshot.device.AutoSnmpDiscoverableDevice#snmpAutoDiscover(java.lang
	 * .String, java.lang.String, org.netshot.device.access.Snmp)
	 */
	public boolean snmpAutoDiscover(String sysObjectId, String sysDesc,
	    Snmp poller) {
		return sysObjectId.matches("^1\\.3\\.6\\.1\\.4\\.1\\.9\\.1\\..*")
		    && sysDesc
		        .matches("(?s).*Cisco (IOS|Internetwork Operating System) Software.*");
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
			return TakeSnapshotTask.takeSnapshotIfNeeded(CiscoIosDevice.class,
			    ipAddress);
		}
		return false;
	}

	/** The trap oid. */
	private static OID TRAP_OID = new OID("1.3.6.1.6.3.1.1.4.1.0");

	/** The Constant TRAP_CISCOCONFIGMANEVENT. */
	private static final String TRAP_CISCOCONFIGMANEVENT = "1.3.6.1.4.1.9.9.43.2.0.1";

	/** The Constant TRAP_CISCOCONFIGDEST. */
	private static final OID TRAP_CISCOCONFIGDEST = new OID(
	    "1.3.6.1.4.1.9.9.43.1.1.6.1.5");

	/** The Constant TRAP_RUNNINGDEST. */
	private static final int TRAP_RUNNINGDEST = 3;

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
		    .equals(TRAP_CISCOCONFIGMANEVENT)) {
			return false;
		}
		List<VariableBinding> destValues = pdu.getBindingList(TRAP_CISCOCONFIGDEST);
		if (destValues.size() == 0) {
			return false;
		}
		if (destValues.get(0).getVariable().toInt() != TRAP_RUNNINGDEST) {
			return false;
		}

		return TakeSnapshotTask.takeSnapshotIfNeeded(CiscoIosDevice.class,
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
		return "Cisco IOS 12.x/15.x Device";
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
	public CiscoIosDevice() {
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
	public CiscoIosDevice(Network4Address address, Domain domain) {
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
		    "Username: ", "Password: ", "% Login invalid", "% Unknow command",
		    "% Invalid input", "command authorization failed", "% Bad secrets" };

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
		String[] expects = new String[] { CLI_ENA_PROMPT };
		this.logIt("Executing command " + command, 7);
		String output = cli.send(command + CLI_CR, expects);
		if (output.contains("% Unknown command") || output.contains("% Invalid input") || output.contains("% Incomplete command")) {
			throw new IOException("Invalid command");
		}
		if (output.contains("command authorization failed")) {
			throw new IOException("Authorization failure while executing the command");
		}
		return output;
	}

	private boolean cliTftpStart(String command) throws IOException {
		String[] expects = new String[] { CLI_ENA_PROMPT, "^Address or name",
		    "Destination filename" };
		String output = cli.send(command + CLI_CR, expects);
		if (cli.getLastExpectMatchIndex() == 1) {
			output = cli.send(CLI_CR, expects);
		}
		if (cli.getLastExpectMatchIndex() == 2) {
			output = cli.send(CLI_CR, expects);
		}
		if (!output.matches("(?ms)^%.*")) {
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
		boolean connected = false;
		if (credentialSet instanceof DeviceSshAccount) {
			try {
				cliInUseAccount = (DeviceCliAccount) credentialSet;
				cli = new Ssh(mgmtAddress, cliInUseAccount.getUsername(),
				    cliInUseAccount.getPassword());
				cli.connect();
				connected = true;
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
				connected = true;
			}
			catch (IOException e) {
				this.logIt("Error while connecting via Telnet: " + e.getMessage(), 3);
				cliInUseAccount = null;
			}
		}
		if (connected) {
			try {
				this.cliEnableMode();
			}
			catch (IOException e) {
				cli.disconnect();
				connected = false;
			}
		}
		return connected;
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
			this.cliExecCommand("terminal length 0");
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Cannot use CLI. " + e.getMessage());
		}

		CiscoIosConfig config = new CiscoIosConfig(this);

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

			pattern = Pattern.compile("^ *(?<name>.*) uptime is", Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				this.name = matcher.group("name");
			}
			pattern = Pattern.compile("^System image file is \"(?<image>.*)\"",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				config.setIosImageFile(matcher.group("image"));
			}
			pattern = Pattern
			    .compile(
			        "^(?<memory>\\d+)[kK] bytes of (flash memory|processor board System flash|ATA CompactFlash|Flash internal)",
			        Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				// Round by 4MB
				this.mainFlashSize = Math.round(Integer.parseInt(matcher
				    .group("memory")) / 1024 / 4) * 4;
			}
			this.networkClass = NetworkClass.ROUTER;
			this.family = "Unknown Cisco IOS device";
			pattern = Pattern
			    .compile(
			        "^(?<system>.*) with (?<mem>\\d+)K(/(?<iomem>\\d+)K)? bytes of memory",
			        Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				this.mainMemorySize = Integer.parseInt(matcher.group("mem"));
				if (matcher.group("iomem") != null) {
					this.mainMemorySize += Integer.parseInt(matcher.group("iomem"));
				}
				this.mainMemorySize = 4 * Math.round(this.mainMemorySize / 1024 / 4);
				String proc = matcher.group("system");
				if (proc.matches(".*CSC4.*")) {
					this.family = "Cisco AGS+";
				}
				else if (proc.matches(".*CSC4.*")) {
					this.family = "Cisco AGS";
				}
				else if (proc.matches(".*1900.*")) {
					this.family = "Cisco Catalyst 1900";
					this.networkClass = NetworkClass.SWITCH;
				}
				else if (proc.matches("^(AS)?25[12][12].*")) {
					this.family = "Cisco 2500";
				}
				else if (proc.matches(".*26[12][01].*")) {
					this.family = "Cisco 2600";
				}
				else if (proc.matches(".*Cisco 28\\d\\d .*")) {
					this.family = "Cisco ISR 2800";
				}
				else if (proc.matches(".*WS-C29.*")) {
					this.family = "Cisco Catalyst 2900";
					this.networkClass = NetworkClass.SWITCH;
				}
				else if (proc.matches(".*CISCO29\\d\\d.*")) {
					this.family = "Cisco ISR-G2 2900";
				}
				else if (proc.matches(".*WS-C355.*")) {
					this.family = "Cisco Catalyst 3550";
					this.networkClass = NetworkClass.SWITCH;
				}
				else if (proc.matches(".*WS-C35.*")) {
					this.family = "Cisco Catalyst 3500XL";
					this.networkClass = NetworkClass.SWITCH;
				}
				else if (proc.matches("^36[0246][0-9].*")) {
					this.family = "Cisco 3600";
				}
				else if (proc.matches("^([Cc]isco )?37.*")) {
					this.family = "Cisco 3700";
				}
				else if (proc.matches(".*WS-C3750.*")) {
					this.family = "Cisco Catalyst 3750";
					this.networkClass = NetworkClass.SWITCH;
				}
				else if (proc.matches("^(Cisco )?38\\d\\d.*")) {
					this.family = "Cisco ISR 3800";
				}
				else if (proc.matches(".*CISCO39\\d\\d.*")) {
					this.family = "Cisco ISR-G2 3900";
				}
				else if (proc.matches(".*WS-C45.*")) {
					this.family = "Cisco Catalyst 4500";
					this.networkClass = NetworkClass.SWITCH;
				}
				else if (proc.matches(".*6000.*")) {
					this.family = "Cisco Catalyst 6000";
					this.networkClass = NetworkClass.SWITCH;
				}
				else if (proc.matches(".*WS-C65.*")) {
					this.family = "Cisco Catalyst 6500";
					this.networkClass = NetworkClass.SWITCHROUTER;
				}
				else if (proc.matches(".*720[246].*")) {
					this.family = "Cisco 7200";
				}
				else if (proc.matches(".*OSR-76.*") || proc.matches(".*CISCO76.*")) {
					this.family = "Cisco 7600";
				}
				else if (proc.matches(".* ASR100[0-9].*")) {
					this.family = "Cisco ASR 1000";
				}
				else if (proc.matches("cisco OS-CIGESM.*")) {
					this.family = "Cisco CIGESM Blade";
				}
			}
			pattern = Pattern
			    .compile(
			        "^(Cisco )?IOS.*Software.*Version (?<version>[0-9\\.A-Za-z\\(\\):]+)",
			        Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				config.setIosVersion(matcher.group("version"));
				this.setSoftwareVersion(config.getIosVersion());
			}
			pattern = Pattern
			    .compile("Configuration register is (?<confreg>Ox[0-9A-F]+)");
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				configRegister = matcher.group("confreg");
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get show version: " + e.getMessage(), 3);
		}

		try {
			String runningConfig = null;
			if (TftpServer.isRunning()) {
				try {
					final String fileName = "running.conf";
					TftpTransfer tftpTransfer = TftpServer.getServer().prepareTransfer(
					    mgmtAddress, fileName, 90);
					if (this.cliTftpStart(String.format(
					    "copy running-config tftp://%s/%s", this.getMgmtDomain()
					        .getServer4Address().getIP(), fileName))) {
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

			pattern = Pattern.compile(
			    "^\\! Last configuration change .* by (?<name>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(runningConfig);
			if (matcher.find()) {
				config.setAuthor(matcher.group("name"));
			}
			runningConfig = cleanUpConfig(runningConfig);
			config.setRunningConfigAsText(runningConfig);

			pattern = Pattern.compile("^(ip vrf|vrf definition) (?<vrf>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(runningConfig);
			while (matcher.find()) {
				this.addVrfInstance(matcher.group("vrf"));
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
				subPattern = Pattern.compile("^ switchport", Pattern.MULTILINE);
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
				        "^ ip address (?<addr>\\d+\\.\\d+\\.\\d+\\.\\d+) (?<mask>\\d+\\.\\d+\\.\\d+\\.\\d+)(?<sec> secondary)?",
				        Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				while (subMatcher.find()) {
					try {
						Network4Address ipAddress = new Network4Address(subMatcher
						    .group("addr"), subMatcher.group("mask"));
						if (subMatcher.group("sec") != null) {
							ipAddress.setAddressUsage(AddressUsage.SECONDARY);
						}
						networkInterface.addIpAddress(ipAddress);
					}
					catch (UnknownHostException e) {
						this.logIt("Unable to parse IP address. " + e.getMessage(), 3);
					}
				}
				subPattern = Pattern
				    .compile(
				        "^ (?<fhrp>standby|vrrp) (?<group>[0-9]+)? ip (?<addr>\\d+\\.\\d+\\.\\d+\\.\\d+)(?<sec> secondary)?",
				        Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				while (subMatcher.find()) {
					try {
						Network4Address hsrpAddress = new Network4Address(
						    subMatcher.group("addr"), 32);
						if (subMatcher.group("fhrp").equals("standby")) {
							if (subMatcher.group("sec") == null) {
								hsrpAddress.setAddressUsage(AddressUsage.HSRP);
							}
							else {
								hsrpAddress.setAddressUsage(AddressUsage.SECONDARYHSRP);
							}
						}
						else if (subMatcher.group("fhrp").equals("vrrp")) {
							if (subMatcher.group("sec") == null) {
								hsrpAddress.setAddressUsage(AddressUsage.VRRP);
							}
							else {
								hsrpAddress.setAddressUsage(AddressUsage.SECONDARYVRRP);
							}
						}
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
					    "show interface %s | inc address|line protocol", interfaceName));
					subPattern = Pattern
					    .compile("address is (?<mac>[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4})");
					subMatcher = subPattern.matcher(showInterface);
					if (subMatcher.find()) {
						PhysicalAddress macAddress = new PhysicalAddress(
						    subMatcher.group("mac"));
						networkInterface.setPhysicalAddress(macAddress);
					}
					subPattern = Pattern.compile(" is administratively down");
					subMatcher = subPattern.matcher(showInterface);
					if (subMatcher.find()) {
						networkInterface.setEnabled(false);
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
					if (this.cliTftpStart(String.format(
					    "copy startup-config tftp://%s/%s", this.getMgmtDomain()
					        .getServer4Address().getIP(), fileName))) {
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
				startupConfig = this.cliExecCommand("show startup-config");
			}
			startupConfig = cleanUpConfig(startupConfig);
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

		try {
			String showInventory = this.cliExecCommand("show inventory");
			Pattern pattern = Pattern
			    .compile("NAME: \"(?<name>.*)\", +DESCR: \"(?<descr>.*)\"[\r\n]+PID: (?<pid>.*), +VID: (?<vid>.*), +SN: (?<sn>.*)");
			Matcher matcher = pattern.matcher(showInventory);
			while (matcher.find()) {
				Module module = new Module();
				module.setDevice(this);
				module.setSlot(matcher.group("name").trim());
				module.setPartNumber(matcher.group("pid").trim());
				module.setSerialNumber(matcher.group("sn").trim());
				this.modules.add(module);
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get the inventory. " + e.getMessage(), 2);
		}

		cli.disconnect();

		if (config.startupMatchesRunning) {
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

	private String cleanUpConfig(String config) {
		String cleanConfig = config.substring(config.indexOf("\nversion") + 1);
		cleanConfig = cleanConfig.replaceFirst("(?m)^ntp clock-period [0-9]+$", "");
		return cleanConfig;
	}

}
