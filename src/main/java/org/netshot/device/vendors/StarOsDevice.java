package org.netshot.device.vendors;

import java.io.IOException;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.MatchResult;
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
 * A StarOS device.
 */
@Entity
@XmlRootElement()
public class StarOsDevice extends Device implements
    AutoSnmpDiscoverableDevice {

	/**
	 * A StarOS configuration.
	 */
	@Entity
	public static class StarOsConfig extends Config {

		/** The configuration file. */
		private LongTextConfiguration config = new LongTextConfiguration();
		
		/** The StarOS version. */
		private String starOsVersion = "";
		
		/** License information */
		private LongTextConfiguration licenseInformation = new LongTextConfiguration();
		
		/**
		 * For Hibernate.
		 */
		protected StarOsConfig() {
			super();
		}

		/**
		 * Instantiates a new StarOsConfig config.
		 * 
		 * @param device
		 *          the device which owns the configuration
		 */
		public StarOsConfig(Device device) {
			super(device);
		}

		/**
		 * Gets the StarOS version.
		 * 
		 * @return the StarOS version
		 */
		@XmlElement
		@ConfigItem(name = "StarOS version", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getStarOsVersion() {
			return starOsVersion;
		}

		/**
		 * Gets the config file
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

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getConfig() {
			return config;
		}

		protected void setConfig(LongTextConfiguration config) {
			this.config = config;
		}

		protected void setLicenseInformation(LongTextConfiguration licenseInformation) {
			this.licenseInformation = licenseInformation;
		}

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getLicenseInformation() {
			return licenseInformation;
		}

		@Override
		public int hashCode() {
			final int prime = 31;
			int result = 1;
			result = prime * result + ((config == null) ? 0 : config.hashCode());
			result = prime * result
					+ ((licenseInformation == null) ? 0 : licenseInformation.hashCode());
			result = prime * result
					+ ((starOsVersion == null) ? 0 : starOsVersion.hashCode());
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
			StarOsConfig other = (StarOsConfig) obj;
			if (config == null) {
				if (other.config != null)
					return false;
			}
			else if (!config.equals(other.config))
				return false;
			if (licenseInformation == null) {
				if (other.licenseInformation != null)
					return false;
			}
			else if (!licenseInformation.equals(other.licenseInformation))
				return false;
			if (starOsVersion == null) {
				if (other.starOsVersion != null)
					return false;
			}
			else if (!starOsVersion.equals(other.starOsVersion))
				return false;
			return true;
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

		@Override
		public void writeToFile() throws IOException {
			StringBuffer conf = new StringBuffer();
			conf.append("# Netshot - StarOS configuration file\r\n");
			conf.append("# Device ");
			conf.append(this.device.getName());
			conf.append("\r\n");
			conf.append("# Date/time ");
			conf.append(this.changeDate);
			conf.append("\r\n");
			conf.append("# StarOS version ");
			conf.append(this.starOsVersion);
			conf.append("\r\n");
			conf.append(this.config);
			writeToFile(conf.toString());
		}

		@Transient
		@ConfigItem(name = "License Information", type = {
		    ConfigItem.Type.RETRIEVABLE, ConfigItem.Type.DIFFABLE,
		    ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getLicenseInformationAsText() {
			return licenseInformation.getText();
		}

		public void setLicenseInformation(String licenseInformation) {
			this.licenseInformation.setText(licenseInformation);
		}

		public void setStarOsVersion(String starOsVersion) {
			this.starOsVersion = starOsVersion;
		}

		private static class ConfigBlock {
			private MatchResult result;
			private String config;
		}
		
		private static List<ConfigBlock> findBlocks(String pattern, String config) {
			List<ConfigBlock> blocks = new ArrayList<ConfigBlock>();
			try {
  			Pattern p = Pattern.compile(pattern);
  			Matcher m = p.matcher("");
  			Pattern indentPattern = Pattern.compile("^ *");
  			String[] lines = config.split("(\\r)?\\n");
  			StringBuffer subConfig = new StringBuffer();;
  			int indent = -1;
  			for (String line : lines) {
  				Matcher indentMatcher = indentPattern.matcher(line);
  				indentMatcher.find();
  				if (indent >= 0 && indentMatcher.group().length() > indent) {
  					subConfig.append("\n" + line.substring(indent));
  				}
  				else if (indent >= 0) {
  					ConfigBlock block = new ConfigBlock();
  					block.config = subConfig.toString();
  					block.result = m.toMatchResult();
  					blocks.add(block);
  					indent = -1;
  				}
  				else {
  					m = p.matcher(line);
  					if (m.find()) {
  						indent = indentMatcher.group().length();
  						subConfig = new StringBuffer();
  					}
  				}
  			}
			}
			catch (Exception e) {
			}
			return blocks;
		}


	}

	/** The Constant CLI_CR. */
	private static final String CLI_CR = "\r";

	/** The Constant CLI_PROMPT. */
	private static final String CLI_PROMPT = "^\\[[a-zA-Z0-9]+\\][A-Za-z0-9_\\-]+(#|>) $";
	

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.netshot.device.AutoSnmpDiscoverableDevice#snmpAutoDiscover(java.lang
	 * .String, java.lang.String, org.netshot.device.access.Snmp)
	 */
	public boolean snmpAutoDiscover(String sysObjectId, String sysDesc,
	    Snmp poller) {
		return sysObjectId.matches("^1\\.3\\.6\\.1\\.4\\.1\\.8164")
		    && sysDesc.matches("(?s).*-staros-.*");
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
		return false;
	}

	/** The trap OID. */
	private static OID TRAP_OID = new OID("1.3.6.1.6.3.1.1.4.1.0");

	/** Starent trap, the configuration has changed. */
	private static final String TRAP_STARCONFIGURATIONUPDATE = "1.3.6.1.4.1.8164.2.1100";

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
		if (trapValues.get(0).getVariable().toString().equals(TRAP_STARCONFIGURATIONUPDATE)) {
			return TakeSnapshotTask.takeSnapshotIfNeeded(StarOsDevice.class,
			    ipAddress);
		}
		return false;
	}

	/** The CLI session (SSH or Telnet). */
	private transient Cli cli;

	/** The CLI account in user. */
	private transient DeviceCliAccount cliInUseAccount = null;

	/**
	 * Instantiates a new StarOS device.
	 * 
	 * @param address
	 *          the address
	 * @param domain
	 *          the domain
	 */
	public StarOsDevice(Network4Address address, Domain domain) {
		super(address, domain);
	}

	/**
	 * Instantiates a new StarOS device.
	 */
	public StarOsDevice() {
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
		return output;
	}

	/**
	 * Cli enable mode.
	 * 
	 * @throws IOException
	 *           Signals that an I/O exception has occurred.
	 */
	private void cliEnableMode() throws IOException {
		String[] expects = new String[] { CLI_PROMPT, "login: ", "password: " };

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
		return "Cisco StarOS device";
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
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Cannot use CLI. " + e.getMessage());
		}

		StarOsConfig config = new StarOsConfig(this);

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

			this.networkClass = NetworkClass.ROUTER;
			this.family = "Unknown Starent device";
			if (showVersion.contains("asr5000.bin")) {
				this.family = "Cisco ASR5000";
			}
			else if (showVersion.contains("asr5500.bin")) {
				this.family = "Cisco ASR5500";
			}
			pattern = Pattern.compile("Image Version: +(?<version>.*?) *$", Pattern.MULTILINE);
			matcher = pattern.matcher(showVersion);
			if (matcher.find()) {
				config.setStarOsVersion(matcher.group("version"));
				this.setSoftwareVersion(config.getStarOsVersion());
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get show version: " + e.getMessage(), 3);
		}

		try {
			String showConfig = null;
			if (showConfig == null) {
				showConfig = this.cliExecCommand("show configuration");
			}
			Pattern pattern;
			Matcher matcher;
			

			pattern = Pattern.compile("^ *system hostname (?<name>.*)$", Pattern.MULTILINE);
			matcher = pattern.matcher(showConfig);
			if (matcher.find()) {
				this.name = matcher.group("name");
			}
			
			// Remove the keys, they change each time the configuration is generated
			showConfig = showConfig.replaceAll("(encrypted [a-z\\-]+|ssh key|encrypted-url) +(\")?\\+[A-Za-z0-9]+(\")?", "$1 *****");
			config.setConfigAsText(showConfig);
			
			String showPortInfo = this.cliExecCommand("show port info");

			pattern = Pattern.compile("^ *system location (?<location>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showConfig);
			if (matcher.find()) {
				this.location = matcher.group("location");
			}
			pattern = Pattern.compile("^ *system contact (?<contact>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showConfig);
			if (matcher.find()) {
				this.contact = matcher.group("contact");
			}
			
			Map<String, String> macAddresses = new HashMap<String, String>();
			pattern = Pattern.compile(
					"^Port: (?<port>.*)[\\r\\n]+((  .*[\\r\\n]+)*?)  MAC Address *: (?<mac>[0-9A-F\\-]+)", Pattern.MULTILINE);
			matcher = pattern.matcher(showPortInfo);
			while (matcher.find()) {
				macAddresses.put(matcher.group("port"), matcher.group("mac"));
			}
			
			
			Pattern bindPattern = Pattern.compile("^  bind interface (?<name>.+) (?<context>.+)$", Pattern.MULTILINE);
			Pattern noShutPattern = Pattern.compile("^  no shutdown$", Pattern.MULTILINE);
			List<StarOsConfig.ConfigBlock> portBlocks = StarOsConfig.findBlocks("^  port ethernet (.+)", showConfig);
			for (StarOsConfig.ConfigBlock portBlock : portBlocks) {
				String portName = portBlock.result.group(1);
				String portConfig = portBlock.config;
				{
  				String interfaceName = "";
  				String context = "";
  				boolean level3 = false;
  				boolean enabled = false;
  				Matcher bindMatcher = bindPattern.matcher(portConfig);
  				if (bindMatcher.find()) {
  					interfaceName = bindMatcher.group("name");
  					context = bindMatcher.group("context");
  					level3 = true;
  				}
  				Matcher noShutMatcher = noShutPattern.matcher(portConfig);
  				if (noShutMatcher.find()) {
  					enabled = true;
  				}
  				NetworkInterface networkInterface = new NetworkInterface(this, portName, context, "", enabled, level3, interfaceName);
  				try {
  					networkInterface.setPhysicalAddress(new PhysicalAddress(macAddresses.get(portName)));
  				}
  				catch (Exception e) {
  				}
  				networkInterfaces.add(networkInterface);
				}
				
				List<StarOsConfig.ConfigBlock> vlanBlocks = StarOsConfig.findBlocks("^  vlan ([0-9]+)", portConfig);
				for (StarOsConfig.ConfigBlock vlanBlock : vlanBlocks) {
					String vlan = vlanBlock.result.group(1);
					String vlanConfig = vlanBlock.config;
					{
	  				String interfaceName = "";
	  				String context = "";
	  				boolean level3 = false;
	  				boolean enabled = false;
	  				Matcher bindMatcher = bindPattern.matcher(vlanConfig);
	  				if (bindMatcher.find()) {
	  					interfaceName = bindMatcher.group("name");
	  					context = bindMatcher.group("context");
	  					level3 = true;
	  				}
	  				Matcher noShutMatcher = noShutPattern.matcher(vlanConfig);
	  				if (noShutMatcher.find()) {
	  					enabled = true;
	  				}
	  				NetworkInterface networkInterface = new NetworkInterface(this, portName + "." + vlan, context, "", enabled, level3, interfaceName);
	  				try {
	  					networkInterface.setPhysicalAddress(new PhysicalAddress(macAddresses.get(portName)));
	  				}
	  				catch (Exception e) {
	  					this.logIt("Unable to find or parse MAC address. " + e.getMessage(), 4);
	  				}
	  				networkInterfaces.add(networkInterface);
					}
				}
			}
			
			
			Pattern ipv4Pattern = Pattern.compile(
					"^(?<indent>  )ip address (?<addr>\\d+\\.\\d+\\.\\d+\\.\\d+) (?<mask>\\d+\\.\\d+\\.\\d+\\.\\d+)",
					Pattern.MULTILINE);
			List<StarOsConfig.ConfigBlock> contextBlocks = StarOsConfig.findBlocks("^ context (.*)", showConfig);
			for (StarOsConfig.ConfigBlock contextBlock : contextBlocks) {
				String context = contextBlock.result.group(1);
				String contextConfig = contextBlock.config;
				List<StarOsConfig.ConfigBlock> interfaceBlocks = StarOsConfig.findBlocks("^  interface(.+?)( loopback)?", contextConfig);
				for (StarOsConfig.ConfigBlock interfaceBlock : interfaceBlocks) {
					String interfaceName = interfaceBlock.result.group(1);
					String interfaceConfig = interfaceBlock.config;
					for (NetworkInterface networkInterface : networkInterfaces) {
						if (context.equals(networkInterface.getVirtualDevice()) && interfaceName.equals(networkInterface.getDescription())) {
							Matcher ipv4Matcher = ipv4Pattern.matcher(interfaceConfig);
							while (ipv4Matcher.find()) {
								try {
									networkInterface.addIpAddress(new Network4Address(ipv4Matcher
											.group("addr"), ipv4Matcher.group("mask")));
								}
								catch (UnknownHostException e) {
									this.logIt("Unable to parse IP address. " + e.getMessage(), 3);
								}
							}
							break;
						}
					}
				}
			}
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Couldn't get the configuration: "
			    + e.getMessage());
		}

		try {
			String licenseInfo = this.cliExecCommand("show license information");
			config.setLicenseInformation(licenseInfo);

		}
		catch (IOException e) {
			this.logIt("Couldn't get the license information", 2);
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
