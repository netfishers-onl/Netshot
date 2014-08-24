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
 * A Cisco NX-OS device.
 */
@Entity
@XmlRootElement()
public class CiscoNxOsDevice extends Device implements
    AutoSnmpDiscoverableDevice {

	/**
	 * The Class CiscoNxOsConfig.
	 */
	@Entity
	public static class CiscoNxOsConfig extends Config {

		/** The NX-OS image file. */
		private String systemImage = "";

		private String kickstartImage = "";

		/** The NS-OX version. */
		private String nxosVersion = "";

		/** The running config. */
		private LongTextConfiguration runningConfig = new LongTextConfiguration();

		/** The startup config. */
		private LongTextConfiguration lightStartupConfig = new LongTextConfiguration();

		/** The startup matches running. */
		private boolean startupMatchesRunning = true;

		/**
		 * Instantiates a new NX-OS config.
		 */
		protected CiscoNxOsConfig() {
			super();
		}

		/**
		 * Instantiates a new cisco ios config.
		 * 
		 * @param device
		 *          the device
		 */
		public CiscoNxOsConfig(Device device) {
			super(device);
		}

		/**
		 * Gets the NX-OS image file.
		 * 
		 * @return the NX-OS image file
		 */
		@XmlElement
		@ConfigItem(name = "NX-OS system image", type = {
		    ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getSystemImage() {
			return systemImage;
		}

		/**
		 * Gets the NX-OS version.
		 * 
		 * @return the NX-OS version
		 */
		@XmlElement
		@ConfigItem(name = "NX-OS version", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getNxosVersion() {
			return nxosVersion;
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
		 * Sets the NX-OS image file.
		 * 
		 * @param systemImage
		 *          the new NX-OS image file
		 */
		public void setSystemImage(String nxosImageFile) {
			this.systemImage = nxosImageFile;
		}

		/**
		 * Sets the NX-OS version.
		 * 
		 * @param nxosVersion
		 *          the new NX-OS version
		 */
		public void setNxosVersion(String nxosVersion) {
			this.nxosVersion = nxosVersion;
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

		@Override
		public void writeToFile() throws IOException {
			StringBuffer conf = new StringBuffer();
			conf.append("! Netshot - Cisco NX-OS configuration file\r\n");
			conf.append("! Device ");
			conf.append(this.device.getName());
			conf.append("\r\n");
			conf.append("! Date/time ");
			conf.append(this.changeDate);
			conf.append("\r\n");
			conf.append("! NX-OS image ");
			conf.append(this.systemImage);
			conf.append("\r\n");
			conf.append(this.runningConfig);
			writeToFile(conf.toString());
		}

		@XmlElement
		@ConfigItem(name = "NX-OS kickstart image", type = {
		    ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getKickstartImage() {
			return kickstartImage;
		}

		public void setKickstartImage(String kickstartImage) {
			this.kickstartImage = kickstartImage;
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

		@Override
		public int hashCode() {
			final int prime = 31;
			int result = 1;
			result = prime * result
			    + ((kickstartImage == null) ? 0 : kickstartImage.hashCode());
			result = prime * result
			    + ((nxosVersion == null) ? 0 : nxosVersion.hashCode());
			result = prime * result
			    + ((runningConfig == null) ? 0 : runningConfig.hashCode());
			result = prime * result
			    + ((lightStartupConfig == null) ? 0 : lightStartupConfig.hashCode());
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
			if (!(obj instanceof CiscoNxOsConfig))
				return false;
			CiscoNxOsConfig other = (CiscoNxOsConfig) obj;
			if (kickstartImage == null) {
				if (other.kickstartImage != null)
					return false;
			}
			else if (!kickstartImage.equals(other.kickstartImage))
				return false;
			if (nxosVersion == null) {
				if (other.nxosVersion != null)
					return false;
			}
			else if (!nxosVersion.equals(other.nxosVersion))
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
	private static final String CLI_PROMPT = "^[A-Za-z0-9_\\-\\.]+# $";

	/** The Constant CONFIGUREDBY. */
	private static final Pattern CONFIGUREDBY = Pattern
	    .compile("%VSHD\\-5\\-VSHD_SYSLOG_CONFIG_I: Configured from (?<host>.*) by (?<user>.*) on .*");

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.netshot.device.AutoSnmpDiscoverableDevice#snmpAutoDiscover(java.lang
	 * .String, java.lang.String, org.netshot.device.access.Snmp)
	 */
	public boolean snmpAutoDiscover(String sysObjectId, String sysDesc,
	    Snmp poller) {
		return sysObjectId.matches("^1\\.3\\.6\\.1\\.4\\.1\\.9\\.12\\..*")
		    && sysDesc.matches("(?s)Cisco NX\\-OS.*");
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
			return TakeSnapshotTask.takeSnapshotIfNeeded(CiscoNxOsDevice.class,
			    ipAddress);
		}
		return false;
	}

	/** The trap oid. */
	private static OID TRAP_OID = new OID("1.3.6.1.6.3.1.1.4.1.0");

	/** The Constant TRAP_CCMCLIRUNNINGCONFIGCHANGED. */
	private static final String TRAP_CCMCLIRUNNINGCONFIGCHANGED = "1.3.6.1.4.1.9.9.43.2.0.2";

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
		    .equals(TRAP_CCMCLIRUNNINGCONFIGCHANGED)) {
			return false;
		}

		return TakeSnapshotTask.takeSnapshotIfNeeded(CiscoNxOsDevice.class,
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
		return "Cisco NX-OS 5.x/6.x Device";
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

	/** The main flash size. */
	private int mainFlashSize = -1;

	/** The main memory size. */
	private int mainMemorySize = -1;

	/**
	 * Instantiates a new Cisco NX-OS device.
	 */
	public CiscoNxOsDevice() {
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
	public CiscoNxOsDevice(Network4Address address, Domain domain) {
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
		String[] expects = new String[] { CLI_PROMPT, "^login: ", "^Password: ",
		    "% Invalid command", "% Ambiguous command",
		    "command authorization failed" };

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
		String[] expects = new String[] { CLI_PROMPT, "% Invalid command",
		    "% Ambiguous command", "command authorization failed" };
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
		String[] expects = new String[] { CLI_PROMPT, "^Enter vrf" };
		String output = cli.send(command + CLI_CR, expects);
		if (cli.getLastExpectMatchIndex() == 1) {
			output = cli.send("management" + CLI_CR, expects);
		}
		if (cli.getLastExpectMatchIndex() == 1) {
			// Nexus 5000's don't seem to accept it first time
			output = cli.send("management" + CLI_CR, expects);
		}
		if (cli.getLastExpectMatchIndex() == 1) {
			output = cli.send(Character.toString((char) 3), expects); // CTRL+C
		}
		if (output.contains("successful")) {
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
			this.cliExecCommand("terminal length 0");
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Cannot use CLI. " + e.getMessage());
		}

		CiscoNxOsConfig config = new CiscoNxOsConfig(this);

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

			pattern = Pattern.compile("Device name: (?<name>.*)", Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				this.name = matcher.group("name");
			}
			pattern = Pattern.compile("kickstart image file is: *(?<image>.*)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				config.setSystemImage(matcher.group("image"));
			}
			pattern = Pattern.compile("system image file is: *(?<image>.*)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				config.setKickstartImage(matcher.group("image"));
			}
			pattern = Pattern.compile("with (?<memory>\\d+) kB of memory",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				// Round by 4MB
				this.mainMemorySize = Math.round(Integer.parseInt(matcher
				    .group("memory")) / 1024 / 4) * 4;
			}
			pattern = Pattern.compile("bootflash: *(?<flash>\\d+) kB",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				// Round by 4MB
				this.mainFlashSize = Math
				    .round(Integer.parseInt(matcher.group("flash")) / 1024 / 4) * 4;
			}
			this.networkClass = NetworkClass.SWITCH;
			this.family = "Unknown Cisco NX-OS device";
			pattern = Pattern.compile("cisco (?<chassis>.*) Chassis",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				this.family = matcher.group("chassis");
			}
			pattern = Pattern.compile("system: *version (?<version>.*)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				config.setNxosVersion(matcher.group("version"));
				this.setSoftwareVersion(config.getNxosVersion());
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get show version: " + e.getMessage(), 3);
		}

		try {
			String showInventory = this.cliExecCommand("show inventory");
			Pattern pattern = Pattern
			    .compile("NAME: \"(?<name>.*)\", +DESCR: \"(?<descr>.*)\" *[\r\n]+PID: (?<pid>.*), +VID: (?<vid>.*), +SN: (?<sn>.*)");
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

		try {
			String runningConfig = null;
			if (TftpServer.isRunning()) {
				try {
					final String fileName = "running.conf";
					TftpTransfer tftpTransfer = TftpServer.getServer().prepareTransfer(
					    mgmtAddress, fileName, 90);
					if (this.cliTftpStart(String.format(
					    "show running-config vdc-all > tftp://%s/%s", this
					        .getMgmtDomain().getServer4Address().getIP(), fileName))) {
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
				runningConfig = this.cliExecCommand("show running-config vdc-all");
			}

			runningConfig = this.cleanUpConfig(runningConfig);
			config.setRunningConfigAsText(runningConfig);

			String[] vdcConfigs = runningConfig
			    .split("[\\r\\n]+\\!Running config for vdc: .*[\\r\\n]+");
			for (int i = 0; i < vdcConfigs.length; i++) {
				String vdcConfig = vdcConfigs[i];
				Pattern pattern;
				Matcher matcher;

				String vdcName = "";
				pattern = Pattern.compile("^switchto vdc (?<name>.*)$",
				    Pattern.MULTILINE);
				matcher = pattern.matcher(vdcConfig);
				if (matcher.find()) {
					vdcName = matcher.group("name");
				}

				if (!vdcName.equals("")) {
					this.cliExecCommand("switchto vdc " + vdcName);
				}

				pattern = Pattern
				    .compile("^vrf context (?<vrf>.*)$", Pattern.MULTILINE);
				matcher = pattern.matcher(vdcConfig);
				while (matcher.find()) {
					this.addVrfInstance(matcher.group("vrf"));
				}

				if (i == 0) {
					pattern = Pattern.compile("^snmp-server location (?<location>.*)$",
					    Pattern.MULTILINE);
					matcher = pattern.matcher(vdcConfig);
					if (matcher.find()) {
						this.location = matcher.group("location");
					}
					pattern = Pattern.compile("^snmp-server contact (?<contact>.*)$",
					    Pattern.MULTILINE);
					matcher = pattern.matcher(vdcConfig);
					if (matcher.find()) {
						this.contact = matcher.group("contact");
					}
				}

				pattern = Pattern
				    .compile(
				        "^interface (?<name>.*)[\\r\\n]+(?<params>( .*[\\r\\n]+)*?)(?=\\S)",
				        Pattern.MULTILINE);
				matcher = pattern.matcher(vdcConfig);
				while (matcher.find()) {
					String interfaceName = matcher.group("name");
					String interfaceConfig = matcher.group("params");
					String vrfInstance = "";
					Pattern subPattern;
					Matcher subMatcher;
					subPattern = Pattern.compile("^ *vrf member (?<vrf>.*)$",
					    Pattern.MULTILINE);
					subMatcher = subPattern.matcher(interfaceConfig);
					if (subMatcher.find()) {
						vrfInstance = subMatcher.group("vrf");
					}
					subPattern = Pattern.compile("^ *switchport", Pattern.MULTILINE);
					subMatcher = subPattern.matcher(interfaceConfig);
					boolean level3 = !subMatcher.find();
					String description = "";
					subPattern = Pattern.compile("^ *description (?<desc>.+)$",
					    Pattern.MULTILINE);
					subMatcher = subPattern.matcher(interfaceConfig);
					if (subMatcher.find()) {
						description = subMatcher.group("desc");
					}

					NetworkInterface networkInterface = new NetworkInterface(this,
					    interfaceName, vdcName, vrfInstance, true, level3, description);

					subPattern = Pattern.compile(
					    "^ *ip address (?<addr>\\d+\\.\\d+\\.\\d+\\.\\d+)/(?<len>\\d+)",
					    Pattern.MULTILINE);
					subMatcher = subPattern.matcher(interfaceConfig);
					while (subMatcher.find()) {
						try {
							networkInterface.addIpAddress(new Network4Address(subMatcher
							    .group("addr"), Integer.parseInt(subMatcher.group("len"))));
						}
						catch (Exception e) {
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
						String showInterface = this.cliExecCommand(String.format(
						    "show interface %s | inc \"(address| is )\"", interfaceName));
						subPattern = Pattern
						    .compile("address: (?<mac>[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4})");
						subMatcher = subPattern.matcher(showInterface);
						if (subMatcher.find()) {
							PhysicalAddress macAddress = new PhysicalAddress(
							    subMatcher.group("mac"));
							networkInterface.setPhysicalAddress(macAddress);
						}
						subPattern = Pattern
						    .compile("(Administratively down|SFP not inserted)");
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

				if (!vdcName.equals("")) {
					this.cliExecCommand("switchback");
				}

			}
		}
		catch (Exception e) {
			cli.disconnect();
			throw new IOException("Couldn't get the running config: "
			    + e.getMessage());
		}

		try {
			String startupConfig = null;
			try {
				final String fileName = "startup.conf";
				TftpTransfer tftpTransfer = TftpServer.getServer().prepareTransfer(
				    mgmtAddress, fileName, 90);
				if (this.cliTftpStart(String.format(
				    "show startup-config vdc-all > tftp://%s/%s", this.getMgmtDomain()
				        .getServer4Address().getIP(), fileName))) {
					startupConfig = TftpServer.getServer().getResult(tftpTransfer);
				}

			}
			catch (Exception e) {
				this.logIt(
				    "Couldn't copy the startup configuration via TFTP, using the 'show' command.",
				    3);
			}
			if (startupConfig == null) {
				startupConfig = this.cliExecCommand("show startup-config vdc-all");
			}
			startupConfig = cleanUpConfig(startupConfig);
			config.setLightStartupConfigAsText(startupConfig);
			config.setStartupMatchesRunning(startupConfig.compareTo(config
			    .getRunningConfigAsText()) == 0);
		}
		catch (Exception e) {
			cli.disconnect();
			throw new IOException("Couldn't get the startup config: "
			    + e.getMessage());
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
		return config.substring(config.indexOf("\nversion") + 1).replaceAll(
		    "(?m)^\\!Time: .*$", "");
	}

}
