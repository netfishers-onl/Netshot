package org.netshot.device.vendors;

import java.io.IOException;
import java.net.UnknownHostException;
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

@Entity
public class AlcatelLucentSrDevice extends Device implements
    AutoSnmpDiscoverableDevice {
	@Entity
	public static class AlcatelLucentSrConfig extends Config {

		private String timosVersion = "";
		private LongTextConfiguration configuration = new LongTextConfiguration();
		private LongTextConfiguration bof = new LongTextConfiguration();
		private boolean adminSaved = false;

		protected AlcatelLucentSrConfig() {
			super();
		}

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getConfiguration() {
			return configuration;
		}

		protected void setConfiguration(LongTextConfiguration textConfiguration) {
			this.configuration = textConfiguration;
		}

		@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
		protected LongTextConfiguration getBof() {
			return bof;
		}

		protected void setBof(LongTextConfiguration textBof) {
			this.bof = textBof;
		}

		public AlcatelLucentSrConfig(Device device) {
			super(device);
		}
		
		
		@XmlElement
		@ConfigItem(name = "TiMOS version", type = { ConfigItem.Type.SEARCHABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getTimosVersion() {
			return timosVersion;
		}

		@Transient
		@ConfigItem(name = "Configuration", alias = "Config", type = {
		    ConfigItem.Type.RETRIEVABLE, ConfigItem.Type.DIFFABLE,
		    ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getConfigurationAsText() {
			return configuration.getText();
		}

		public void setTimosVersion(String timosVersion) {
			this.timosVersion = timosVersion;
		}

		@Override
		public void writeToFile() throws IOException {
			StringBuffer conf = new StringBuffer();
			conf.append("# Netshot - Alcatel Lucent TiMOS configuration file\r\n");
			conf.append("# Device ");
			conf.append(this.device.getName());
			conf.append("\r\n");
			conf.append("# Date/time ");
			conf.append(this.changeDate);
			conf.append("\r\n");
			conf.append("# TiMOS version ");
			conf.append(this.timosVersion);
			conf.append("\r\n");
			conf.append(this.configuration);
			writeToFile(conf.toString());
		}

		public void setConfiguration(String configuration) {
			this.configuration.setText(configuration);
		}

		@Transient
		@ConfigItem(name = "BOF", type = { ConfigItem.Type.RETRIEVABLE, ConfigItem.Type.CHECKABLE,
		    ConfigItem.Type.DIFFABLE, ConfigItem.Type.SEARCHABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getBofAsText() {
			return bof.getText();
		}

		public void setBofAsText(String bof) {
			this.bof.setText(bof);
		}

		@XmlElement
		@ConfigItem(name = "Configuration saved", type = {
		    ConfigItem.Type.SEARCHABLE, ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.BOOLEAN)
		public boolean isAdminSaved() {
			return adminSaved;
		}

		public void setAdminSaved(boolean adminSaved) {
			this.adminSaved = adminSaved;
		}

		@Override
		public int hashCode() {
			final int prime = 31;
			int result = 1;
			result = prime * result + (adminSaved ? 1231 : 1237);
			result = prime * result + ((bof == null) ? 0 : bof.hashCode());
			result = prime * result
			    + ((configuration == null) ? 0 : configuration.hashCode());
			result = prime * result
			    + ((timosVersion == null) ? 0 : timosVersion.hashCode());
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
			AlcatelLucentSrConfig other = (AlcatelLucentSrConfig) obj;
			if (adminSaved != other.adminSaved)
				return false;
			if (bof == null) {
				if (other.bof != null)
					return false;
			}
			else if (!bof.equals(other.bof))
				return false;
			if (configuration == null) {
				if (other.configuration != null)
					return false;
			}
			else if (!configuration.equals(other.configuration))
				return false;
			if (timosVersion == null) {
				if (other.timosVersion != null)
					return false;
			}
			else if (!timosVersion.equals(other.timosVersion))
				return false;
			return true;
		}
	}

	public AlcatelLucentSrDevice(Network4Address address, Domain domain) {
		super(address, domain);
	}

	public AlcatelLucentSrDevice() {
		super(null, null);
	}

	@Transient
	@XmlElement
	@ConfigItem(name = "Type", type = ConfigItem.Type.CHECKABLE)
	public static String getDeviceType() {
		return "Alcatel Lucent TiMOS Router";
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

	/** The Constant CLI_CR. */
	private static final String CLI_CR = "\r";

	/** The Constant CLI_PROMPT. */
	private static final String CLI_PROMPT = "(^\\*)?[A-Z]:[A-Z0-9a-z_\\-]+# *$";

	/** The trap oid. */
	private static OID TRAP_OID = new OID("1.3.6.1.6.3.1.1.4.1.0");

	private static final String TRAP_TMNXCONFIGCREATE = "1.3.6.1.4.1.6527.3.1.3.1.0.9";
	//private static final String TRAP_TMNXCONFIGDELETE = "1.3.6.1.4.1.6527.3.1.3.1.0.10";
	private static final String TRAP_TMNXCONFIGMODIFY = "1.3.6.1.4.1.6527.3.1.3.1.0.8";

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
		if (trapValues.get(0).getVariable().toString()
		    .equals(TRAP_TMNXCONFIGCREATE)
		    || trapValues.get(0).getVariable().toString()
		        .equals(TRAP_TMNXCONFIGMODIFY)) {
			return TakeSnapshotTask.takeSnapshotIfNeeded(AlcatelLucentSrDevice.class,
			    ipAddress);
		}
		return false;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.netshot.device.AutoSnmpDiscoverableDevice#snmpAutoDiscover(java.lang
	 * .String, java.lang.String, org.netshot.device.access.Snmp)
	 */
	public boolean snmpAutoDiscover(String sysObjectId, String sysDesc,
	    Snmp poller) {
		return sysObjectId.matches("^1\\.3\\.6\\.1\\.4\\.1\\.6527\\..*")
		    && sysDesc.startsWith("TiMOS");
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
		String[] expects = new String[] { CLI_PROMPT, "Error: Bad command",
		    "Error: Ambiguous command" };
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
		cli.send(" ", expects);
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

	@Override
	public boolean takeSnapshot() throws Exception {
		if (!cliConnect()) {
			this.logIt("No CLI connection to the device could be opened.", 3);
			throw new IOException("Unable to open a CLI connection to the device.");
		}

		AlcatelLucentSrConfig config = new AlcatelLucentSrConfig(this);

		networkInterfaces.clear();
		vrfInstances.clear();
		virtualDevices.clear();
		eolModule = null;
		eosModule = null;
		modules.clear();
		location = "";
		contact = "";
		config.setAdminSaved(false);

		try {
			this.cliWait();
			this.cliExecCommand("environment no more");
			this.logIt("Executing show system information", 7);
			String showSystemInformation = this
			    .cliExecCommand("show system information");

			Pattern pattern;
			Matcher matcher;

			pattern = Pattern.compile("^System Name *: (?<name>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showSystemInformation);
			if (matcher.find()) {
				this.name = matcher.group("name");
			}
			pattern = Pattern.compile("^System Version *: (?<version>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showSystemInformation);
			if (matcher.find()) {
				config.setTimosVersion(matcher.group("version"));
				this.setSoftwareVersion(matcher.group("version"));
			}
			pattern = Pattern.compile("^Changes Since Last Save *: (?<state>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showSystemInformation);
			if (matcher.find()) {
				if (matcher.group("state").equalsIgnoreCase("No")) {
					config.setAdminSaved(true);
				}
			}
			this.networkClass = NetworkClass.ROUTER;
			this.family = "Unknown Alcatel-Lucent device";
			pattern = Pattern.compile("^System Type *: (?<family>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showSystemInformation);
			if (matcher.find()) {
				String model = matcher.group("family");
				this.family = "Alcatel-Lucent " + model;
			}
			pattern = Pattern.compile("^System Location *: (?<location>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showSystemInformation);
			if (matcher.find()) {
				location = matcher.group("location");
			}
			pattern = Pattern.compile("^System Contact *: (?<contact>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showSystemInformation);
			if (matcher.find()) {
				contact = matcher.group("contact");
			}
			pattern = Pattern.compile("^User Last Modified *: (?<author>.*)$",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(showSystemInformation);
			if (matcher.find()) {
				config.setAuthor(matcher.group("author"));
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get show version: " + e.getMessage(), 3);
		}

		try {
			String configuration = null;
			// No TFTP admin save for now because this marks the configuration as
			// saved
			// in show system info
			/*
			 * try { final String fileName = "backup.conf"; TftpTransfer tftpTransfer
			 * = TftpServer.getServer() .prepareTransfer(mgmtAddress, fileName, 90);
			 * String tftpResult = this.cliExecCommand(String.format(
			 * "admin save tftp://%s/%s" + CLI_CR, this
			 * .getMgmtDomain().getServer4Address().getIP(), fileName)); if
			 * (tftpResult.contains("Completed.")) { configuration =
			 * TftpServer.getServer().getResult( tftpTransfer); } } catch (Exception
			 * e) { this.logIt(
			 * "Couldn't copy the configuration via TFTP, using the 'admin display' command."
			 * , 3); }
			 */
			if (configuration == null) {
				configuration = this.cliExecCommand("admin display-config");
			}
			configuration = configuration.replaceAll("(?m)^# Generated .*$", "");
			configuration = configuration.replaceAll("(?m)^# Finished .*$", "");
			config.setConfiguration(configuration);
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Couldn't get the configuration: " + e.getMessage());
		}

		try {
			String bof = this.cliExecCommand("show bof");
			config.setBofAsText(bof);
		}
		catch (IOException e) {
			this.logIt("Couldn't get the BOF: " + e.getMessage(), 3);
		}

		try {
			this.logIt("Executing show card detail", 7);
			String showCard = this.cliExecCommand("show card detail");
			this.logIt("Executing show mda detail", 7);
			String showMda = this.cliExecCommand("show mda detail");
			Pattern pattern = Pattern
			    .compile(
			        "Card (?<card>[0-9A-Z]+)[\\r\\n]+=====+[\\r\\n]+.*?[\\r\\n]+\\-\\-\\-\\-\\-+[\\r\\n]+[A-Z0-9]+ +(?<type>[a-zA-Z0-9\\-]+).*?[\\r\\n]+Hardware Data[\\r\\n]+(?<details>.+?)[\r\n]+=====+",
			        Pattern.DOTALL);
			Matcher matcher = pattern.matcher(showCard);
			while (matcher.find()) {
				String card = matcher.group("card");
				String details = matcher.group("details");
				String partNumber = "";
				String serialNumber = "";
				Pattern subPattern = Pattern.compile("^ *Part number *: (?<part>.*)$",
				    Pattern.MULTILINE);
				Matcher subMatcher = subPattern.matcher(details);
				if (subMatcher.find()) {
					partNumber = subMatcher.group("part") + " ("
					    + matcher.group("type").toUpperCase() + ")";
				}
				subPattern = Pattern.compile("^ *Serial number *: (?<serial>.*)$",
				    Pattern.MULTILINE);
				subMatcher = subPattern.matcher(details);
				if (subMatcher.find()) {
					serialNumber = subMatcher.group("serial");
				}
				Module module = new Module();
				module.setSlot(card);
				module.setPartNumber(partNumber);
				module.setSerialNumber(serialNumber);
				module.setDevice(this);
				this.modules.add(module);
			}
			pattern = Pattern
			    .compile(
			        "MDA (?<mda>[0-9A-Z/]+) detail[\\r\\n]+=====+[\\r\\n]+.*?[\\r\\n]+\\-\\-\\-\\-\\-+[\\r\\n]+[A-Z0-9]+ +[0-9]+ +(?<type>[a-zA-Z0-9\\-]+).*?[\\r\\n]+Hardware Data[\\r\\n]+(?<details>.+?)[\r\n]+=====+",
			        Pattern.DOTALL);
			matcher = pattern.matcher(showMda);
			while (matcher.find()) {
				String card = matcher.group("mda");
				String details = matcher.group("details");
				String partNumber = "";
				String serialNumber = "";
				Pattern subPattern = Pattern.compile("^ *Part number *: (?<part>.*)$",
				    Pattern.MULTILINE);
				Matcher subMatcher = subPattern.matcher(details);
				if (subMatcher.find()) {
					partNumber = subMatcher.group("part") + " ("
					    + matcher.group("type").toUpperCase() + ")";
				}
				subPattern = Pattern.compile("^ *Serial number *: (?<serial>.*)$",
				    Pattern.MULTILINE);
				subMatcher = subPattern.matcher(details);
				if (subMatcher.find()) {
					serialNumber = subMatcher.group("serial");
				}
				Module module = new Module();
				module.setSlot(card);
				module.setPartNumber(partNumber);
				module.setSerialNumber(serialNumber);
				module.setDevice(this);
				this.modules.add(module);
			}

		}
		catch (IOException e) {
			this.logIt("Couldn't get the inventory: " + e.getMessage(), 3);
		}

		try {
			this.logIt("Executing show router interface", 7);
			String showRouterInterface = this
			    .cliExecCommand("show router interface detail");
			String showRouterVrrp = this.cliExecCommand("show router vrrp instance");
			parseInterfaceDetails("", showRouterInterface, showRouterVrrp);
			this.logIt("Executing show router management interface", 7);
			String showRouterManagementInterface = this.cliExecCommand("show router \"management\" interface detail");
			parseInterfaceDetails("management", showRouterManagementInterface, "");
			this.logIt("Executing show service service-using", 7);
			String showServiceServiceUsing = this
			    .cliExecCommand("show service service-using");
			Pattern servicePattern = Pattern.compile(
			    "^(?<id>[0-9]+) + (?<type>[A-Z]+) +Up + Up +", Pattern.MULTILINE);
			Matcher serviceMatcher = servicePattern.matcher(showServiceServiceUsing);

			while (serviceMatcher.find()) {
				String service = serviceMatcher.group("id");
				String serviceType = serviceMatcher.group("type");
				if (serviceType.equals("VPLS")) {
				}
				else if (serviceType.equals("VPRN")) {
					String serviceInterfaces = this.cliExecCommand(String.format(
					    "show service id %s interface detail", service));
					String serviceVrrp = this.cliExecCommand(String.format("show router %s vrrp instance", service));
					parseInterfaceDetails(service, serviceInterfaces, serviceVrrp);
				}
			}
		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Couldn't get the interfaces: " + e.getMessage());
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

	private final Pattern descriptionPattern = Pattern.compile(
	    "^Description *: (?<description>.*)$", Pattern.MULTILINE);
	private final Pattern ifNamePattern = Pattern.compile(
	    "^If Name *: (?<name>.*)$", Pattern.MULTILINE);
	private final Pattern adminStatePattern = Pattern
	    .compile("Admin State *: Up");
	private final Pattern ipv4AddrPattern = Pattern
	    .compile("IP Addr/mask *: (?<addr>[0-9\\.]+)/(?<len>\\d+)");
	private final Pattern ipv6AddrPattern = Pattern
	    .compile("IPv6 Addr *: (?<addr>[0-9A-F:]+)/(?<len>\\d+)");
	private final Pattern macAddrPattern = Pattern
	    .compile("MAC Address *: (?<addr>[0-9a-fA-F:]+)");
	private final Pattern portPattern = Pattern
	    .compile("(Port|SAP) Id *: (?<port>[a-zA-Z\\-/0-9:]+)");
	private final Pattern vrrpPattern = Pattern
			.compile("^(?<intf>.+?) +[0-9]+ .*[\r\n]+.*[\r\n]+  Backup Addr: (?<addr>[0-9\\.]+)", Pattern.MULTILINE);

	private void parseInterfaceDetails(String service, String showInterfaceDetail, String vrrpDetail) {
		
		Matcher vrrpMatcher = vrrpPattern.matcher(vrrpDetail);
		List<String[]> vrrpInterfaces = new ArrayList<String[]>();
		while (vrrpMatcher.find()) {
			vrrpInterfaces.add(new String[] { vrrpMatcher.group("intf"), vrrpMatcher.group("addr") });
		}
		
		String[] serviceInterfaceDetails = showInterfaceDetail
		    .split("\\-\\-\\-+[\r\n]+Interface[\r\n]+\\-\\-\\-+");
		for (String serviceInterfaceDetail : serviceInterfaceDetails) {
			String description = "";
			String name = "";
			String interfaceName = "";
			boolean enabled = false;
			Matcher subMatcher = descriptionPattern.matcher(serviceInterfaceDetail);
			if (subMatcher.find()) {
				description = subMatcher.group("description");
				if (description.equals("(Not Specified)")) {
					description = "";
				}
			}
			subMatcher = ifNamePattern.matcher(serviceInterfaceDetail);
			if (subMatcher.find()) {
				interfaceName = subMatcher.group("name");
				name = interfaceName;
			}
			subMatcher = portPattern.matcher(serviceInterfaceDetail);
			if (subMatcher.find()) {
				name += " [" + subMatcher.group("port") + "]";
			}
			if (name.equals("")) {
				continue;
			}
			subMatcher = adminStatePattern.matcher(serviceInterfaceDetail);
			if (subMatcher.find()) {
				enabled = true;
			}
			subMatcher = macAddrPattern.matcher(serviceInterfaceDetail);
			NetworkInterface networkInterface = new NetworkInterface(this, name, "",
			    service, enabled, true, description);
			if (subMatcher.find()) {
				try {
					PhysicalAddress macAddress = new PhysicalAddress(
					    subMatcher.group("addr"));
					networkInterface.setPhysicalAddress(macAddress);
				}
				catch (Exception e) {
					this.logIt("Unable to parse MAC address. " + e.getMessage(), 3);
				}
			}
			subMatcher = ipv4AddrPattern.matcher(serviceInterfaceDetail);
			while (subMatcher.find()) {
				try {
					Network4Address ipAddress = new Network4Address(
					    subMatcher.group("addr"), Integer.parseInt(subMatcher
					        .group("len")));
					if (networkInterface.getIp4Addresses().size() > 0) {
						ipAddress.setAddressUsage(AddressUsage.SECONDARY);
					}
					networkInterface.addIpAddress(ipAddress);
				}
				catch (Exception e) {
					this.logIt("Unable to parse IP address. " + e.getMessage(), 3);
				}
			}
			subMatcher = ipv6AddrPattern.matcher(serviceInterfaceDetail);
			while (subMatcher.find()) {
				try {
					networkInterface.addIpAddress(new Network6Address(subMatcher
					    .group("addr"), subMatcher.group("len")));
				}
				catch (UnknownHostException e) {
					this.logIt("Unable to parse IP address. " + e.getMessage(), 3);
				}
			}
			
			for (String[] vrrpInterface : vrrpInterfaces) {
				if (vrrpInterface[0].equals(interfaceName)) {
					Network4Address hsrpAddress;
					try {
						hsrpAddress = new Network4Address(vrrpInterface[1], 32);
						hsrpAddress.setAddressUsage(AddressUsage.VRRP);
						for (Network4Address address : networkInterface.getIp4Addresses()) {
							if (address.contains(hsrpAddress)) {
								hsrpAddress.setPrefixLength(address.getPrefixLength());
								if (address.getAddressUsage().equals(AddressUsage.SECONDARY)) {
									hsrpAddress.setAddressUsage(AddressUsage.SECONDARYVRRP);
								}
								networkInterface.addIpAddress(hsrpAddress);
								break;
							}
						}
					}
					catch (Exception e) {
					} 
				}
			}
			
			
			networkInterfaces.add(networkInterface);
		}
	}

}
