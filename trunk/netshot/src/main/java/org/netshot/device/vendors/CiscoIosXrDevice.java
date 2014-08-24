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
 * A Cisco IOS-XR device.
 */
@Entity
@XmlRootElement()
public class CiscoIosXrDevice extends Device implements
    AutoSnmpDiscoverableDevice {

	/**
	 * A Cisco IOS-XR configuration.
	 */
	@Entity
	public static class CiscoIosXrConfig extends Config {

		/** The configuration file. */
		private LongTextConfiguration config = new LongTextConfiguration();

		/** Summary of IOS-XR installed packages. */
		private LongTextConfiguration installSummary = new LongTextConfiguration();
		
		/** Admin configuration file. */
		private LongTextConfiguration adminConfig = new LongTextConfiguration();
		
		/** The Cisco IOS-XR version. */
		private String iosXrVersion = "";

		/**
		 * For Hibernate.
		 */
		protected CiscoIosXrConfig() {
			super();
		}

		/**
		 * Instantiates a new Cisco IOS-XR config.
		 * 
		 * @param device
		 *          the device which owns the configuration
		 */
		public CiscoIosXrConfig(Device device) {
			super(device);
		}

		/**
		 * Gets the Cisco IOS-XR version.
		 * 
		 * @return the Cisco IOS-XR version
		 */
		@XmlElement
		@ConfigItem(name = "IOS-XR version", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getIosXrVersion() {
			return iosXrVersion;
		}

		/**
		 * Gets the Cisco IOS-XR config.
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

		/**
		 * Gets the Cisco Admin IOS-XR config.
		 * 
		 * @return the admin config
		 */
		@Transient
		@ConfigItem(name = "Admin Config", type = {
		    ConfigItem.Type.RETRIEVABLE, ConfigItem.Type.DIFFABLE,
		    ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getAdminConfigAsText() {
			return adminConfig.getText();
		}

		/**
		 * Sets the Cisco IOS-XR version.
		 * 
		 * @param Cisco
		 *          IOS-XRVersion the new Cisco IOS-XR version
		 */
		public void setIosXrVersion(String iosXrVersion) {
			this.iosXrVersion = iosXrVersion;
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

		/**
		 * Sets the admin config.
		 * 
		 * @param adminConfig
		 *          the new admin config
		 */
		public void setAdminConfigAsText(String adminConfig) {
			this.adminConfig.setText(adminConfig);
		}
		
		@Override
		public void writeToFile() throws IOException {
			StringBuffer conf = new StringBuffer();
			conf.append("! Netshot - Cisco IOS-XR configuration file\r\n");
			conf.append("! Device ");
			conf.append(this.device.getName());
			conf.append("\r\n");
			conf.append("! Date/time ");
			conf.append(this.changeDate);
			conf.append("\r\n");
			conf.append("! Cisco IOS-XR version ");
			conf.append(this.iosXrVersion);
			conf.append("\r\n");
			conf.append("! Admin config\r\n");
			conf.append(this.adminConfig);
			conf.append("! Configuration\r\n");
			conf.append(this.config);
			writeToFile(conf.toString());
		}

		@Override
    public int hashCode() {
	    final int prime = 31;
	    int result = 1;
	    result = prime * result
	        + ((adminConfig == null) ? 0 : adminConfig.hashCode());
	    result = prime * result + ((config == null) ? 0 : config.hashCode());
	    result = prime * result
	        + ((installSummary == null) ? 0 : installSummary.hashCode());
	    result = prime * result
	        + ((iosXrVersion == null) ? 0 : iosXrVersion.hashCode());
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
	    CiscoIosXrConfig other = (CiscoIosXrConfig) obj;
	    if (adminConfig == null) {
		    if (other.adminConfig != null)
			    return false;
	    }
	    else if (!adminConfig.equals(other.adminConfig))
		    return false;
	    if (config == null) {
		    if (other.config != null)
			    return false;
	    }
	    else if (!config.equals(other.config))
		    return false;
	    if (installSummary == null) {
		    if (other.installSummary != null)
			    return false;
	    }
	    else if (!installSummary.equals(other.installSummary))
		    return false;
	    if (iosXrVersion == null) {
		    if (other.iosXrVersion != null)
			    return false;
	    }
	    else if (!iosXrVersion.equals(other.iosXrVersion))
		    return false;
	    return true;
    }

		@Transient
		@ConfigItem(name = "IOS-XR install summary", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE, ConfigItem.Type.RETRIEVABLE, ConfigItem.Type.DIFFABLE },
		    comparator = ConfigItem.Comparator.TEXT)
		public String getInstallSummaryAsText() {
			return installSummary.getText();
		}

		public void setInstallSummaryAsText(String installSummary) {
			this.installSummary.setText(installSummary);
		}

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getConfig() {
			return config;
		}

		protected void setConfig(LongTextConfiguration config) {
			this.config = config;
		}

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getInstallSummary() {
			return installSummary;
		}

		protected void setInstallSummary(LongTextConfiguration installSummary) {
			this.installSummary = installSummary;
		}

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getAdminConfig() {
			return adminConfig;
		}

		protected void setAdminConfig(LongTextConfiguration adminConfig) {
			this.adminConfig = adminConfig;
		}
	}

	/** The Constant CLI_CR. */
	private static final String CLI_CR = "\r";

	/** The Constant CLI_PROMPT. */
	private static final String CLI_PROMPT = "^[A-Z0-9/]+:[A-Za-z0-9_\\-]+#$";

	/** The Constant COMMIT. */
	private static final Pattern COMMIT = Pattern
	    .compile("%MGBL-CONFIG-6-DB_COMMIT : Configuration committed by user '(?<user>.*)'");

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
		    && sysDesc.matches("(?s)^Cisco IOS XR Software.*");
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
			return TakeSnapshotTask.takeSnapshotIfNeeded(CiscoIosXrDevice.class,
			    ipAddress);
		}
		return false;
	}

	/** The trap OID. */
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

		return TakeSnapshotTask.takeSnapshotIfNeeded(CiscoIosXrDevice.class,
		    ipAddress);
	}

	/** The CLI session (SSH or Telnet). */
	private transient Cli cli;

	/** The CLI account in user. */
	private transient DeviceCliAccount cliInUseAccount = null;

	/**
	 * Instantiates a new Cisco IOS-XR device.
	 * 
	 * @param address
	 *          the address
	 * @param domain
	 *          the domain
	 */
	public CiscoIosXrDevice(Network4Address address, Domain domain) {
		super(address, domain);
	}

	/**
	 * Instantiates a new Cisco IOS-XR device.
	 */
	public CiscoIosXrDevice() {
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
		String[] expects = new String[] { CLI_PROMPT };
		this.logIt("Executing command " + command, 7);
		String output = cli.send(command + CLI_CR, expects);
		if (cli.getLastExpectMatchIndex() != 0) {
			throw new IOException("Invalid command");
		}
		output = output.replaceFirst(
		    "^[A-Z][a-z][a-z] [A-Z][a-z][a-z] [0-9]+ [0-9][0-9]:[0-9].*[\\r\\n]+",
		    "");
		return output;
	}

	/**
	 * Cli enable mode.
	 * 
	 * @throws IOException
	 *           Signals that an I/O exception has occurred.
	 */
	private void cliEnableMode() throws IOException {
		String[] expects = new String[] { CLI_PROMPT, "Username: ", "Password: ",
		    "% Login invalid", "% Unknow command", "% Invalid input",
		    "command authorization failed", "% Bad secrets" };

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

	/*
	 * private boolean cliTftpStart(String command) throws IOException { String[]
	 * expects = new String[] { CLI_PROMPT, "Host name or IP address",
	 * "Destination file name" }; String output = cli.send(command + CLI_CR,
	 * expects); if (cli.getLastExpectMatchIndex() == 1) { output =
	 * cli.send(CLI_CR, expects); } if (cli.getLastExpectMatchIndex() == 2) { int
	 * i = 0; while (i++ < 5) { try { output = cli.send(CLI_CR, expects); if
	 * (output.contains("[OK]")) { return true; } return false; } catch
	 * (IOException e) { } } cli.send(Character.toString((char) 3), expects); //
	 * CTRL+C } return false; }
	 */

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
		return "Cisco IOS-XR device";
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
		try {
			this.cliEnableMode();
			this.cliExecCommand("terminal length 0");
			this.cliExecCommand("terminal no-timestamp");
			this.cliExecCommand("terminal exec prompt no-timestamp");
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Cannot use CLI. " + e.getMessage());
		}

		CiscoIosXrConfig config = new CiscoIosXrConfig(this);

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
			this.networkClass = NetworkClass.ROUTER;
			this.family = "Unknown Cisco IOS-XR device";
			pattern = Pattern
			    .compile(
			        "^(?<system>.*) with (?<mem>\\d+)K(/(?<iomem>\\d+)K)? bytes of memory",
			        Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				String proc = matcher.group("system");
				if (proc.matches("cisco 12\\d\\d\\d.*")) {
					this.family = "Cisco 12000 Series";
				}
				else if (proc.matches("cisco CRS.*")) {
					this.family = "Cisco CRS";
				}
				else if (proc.matches("cisco ASR9.*")) {
					this.family = "Cisco ASR 9000";
				}
			}
			pattern = Pattern.compile(
			    "^(Cisco )?IOS XR Software.*Version (?<version>[0-9\\.A-Z\\(\\):]+)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				config.setIosXrVersion(matcher.group("version"));
				this.setSoftwareVersion(config.getIosXrVersion());
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get show version: " + e.getMessage(), 3);
		}

		try {
			String runningConfig = null;
			// if (TftpServer.isRunning()) {
			// try {
			// final String fileName = "running.conf";
			// TftpTransfer tftpTransfer = TftpServer.getServer()
			// .prepareTransfer(mgmtAddress, fileName, 90);
			// if (this.cliTftpStart(String.format(
			// "copy running-config tftp://%s/%s", this
			// .getMgmtDomain().getServer4Address()
			// .getIP(), fileName))) {
			// runningConfig = TftpServer.getServer().getResult(
			// tftpTransfer);
			// }
			// }
			// catch (Exception e) {
			// this.logIt(
			// "Couldn't copy the running configuration via TFTP, using the 'show' command.",
			// 3);
			// }
			// }
			if (runningConfig == null) {
				runningConfig = this.cliExecCommand("show running-config");
			}
			Pattern pattern;
			Matcher matcher;

			pattern = Pattern.compile(
			    "^\\!\\! Last configuration change .* by (?<name>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(runningConfig);
			if (matcher.find()) {
				config.setAuthor(matcher.group("name"));
			}
			// Remove the date/time at the beginning
			runningConfig = runningConfig.replaceFirst("^[A-Z][a-z][a-z] .*[\\r\\n]+", "");
			runningConfig = runningConfig.replaceFirst(
			    "Building configuration...[\\r\\n]+", "");
			config.setConfigAsText(runningConfig);

			pattern = Pattern.compile("^vrf (?<vrf>.*)$", Pattern.MULTILINE);
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
				subPattern = Pattern.compile("^ vrf (?<vrf>.*)$", Pattern.MULTILINE);
				subMatcher = subPattern.matcher(interfaceConfig);
				if (subMatcher.find()) {
					vrfInstance = subMatcher.group("vrf");
				}
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
				    interfaceName, "", vrfInstance, enabled, true, description);

				subPattern = Pattern
				    .compile(
				        "^ ipv4 address (?<addr>\\d+\\.\\d+\\.\\d+\\.\\d+) (?<mask>\\d+\\.\\d+\\.\\d+\\.\\d+)",
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
			String adminConfig = null;
			if (adminConfig == null) {
				adminConfig = this.cliExecCommand("admin show running");
			}
			// Remove the date/time at the beginning
			adminConfig = adminConfig.replaceFirst("^[A-Z][a-z][a-z] .*[\\r\\n]+", "");
			adminConfig = adminConfig.replaceFirst(
			    "Building configuration...[\\r\\n]+", "");
			config.setAdminConfigAsText(adminConfig);

		}
		catch (IOException e) {
			this.logIt("Couldn't get the admin config", 2);
		}

		try {
			String installSummary = this.cliExecCommand("admin show install summary");
			// Remove the date/time at the beginning, if necessary
			installSummary = installSummary.replaceFirst("^[A-Z][a-z][a-z] .*[\\r\\n]+", "");
			config.setInstallSummaryAsText(installSummary);

		}
		catch (IOException e) {
			this.logIt("Couldn't get the admin config", 2);
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
