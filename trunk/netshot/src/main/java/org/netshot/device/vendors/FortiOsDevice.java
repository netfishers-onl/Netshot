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
 * A FortiOS device.
 */
@Entity
@XmlRootElement()
public class FortiOsDevice extends Device implements AutoSnmpDiscoverableDevice {

	/**
	 * A FortiOS configuration.
	 */
	@Entity
	public static class FortiOsConfig extends Config {

		/** The configuration file. */
		private LongTextConfiguration config = new LongTextConfiguration();

		/** The FortiOS version. */
		private String fortiOsVersion = "";

		/**
		 * For Hibernate.
		 */
		protected FortiOsConfig() {
			super();
		}

		/**
		 * Instantiates a new FortiOS config.
		 * 
		 * @param device
		 *          the device which owns the configuration
		 */
		public FortiOsConfig(Device device) {
			super(device);
		}

		/**
		 * Gets the FortiOS version.
		 * 
		 * @return the FortiOS version
		 */
		@XmlElement
		@ConfigItem(name = "FortiOS version", type = { ConfigItem.Type.SEARCHABLE,
		    ConfigItem.Type.CHECKABLE }, comparator = ConfigItem.Comparator.TEXT)
		public String getFortiOsVersion() {
			return fortiOsVersion;
		}

		/**
		 * Gets the FortiOS config.
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
		 * Sets the FortiOS version.
		 * 
		 * @param fortiOSVersion
		 *          the new FortiOS version
		 */
		public void setFortiOsVersion(String fortiOsVersion) {
			this.fortiOsVersion = fortiOsVersion;
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
			conf.append("# Netshot - FortiOS configuration file\r\n");
			conf.append("# Device ");
			conf.append(this.device.getName());
			conf.append("\r\n");
			conf.append("# Date/time ");
			conf.append(this.changeDate);
			conf.append("\r\n");
			conf.append("# FortiOS version ");
			conf.append(this.fortiOsVersion);
			conf.append("\r\n");
			conf.append(this.config);
			writeToFile(conf.toString());
		}

		@Override
		public int hashCode() {
			final int prime = 31;
			int result = 1;
			result = prime * result + ((config == null) ? 0 : config.hashCode());
			result = prime * result
			    + ((fortiOsVersion == null) ? 0 : fortiOsVersion.hashCode());
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
			FortiOsConfig other = (FortiOsConfig) obj;
			if (config == null) {
				if (other.config != null)
					return false;
			}
			else if (!config.equals(other.config))
				return false;
			if (fortiOsVersion == null) {
				if (other.fortiOsVersion != null)
					return false;
			}
			else if (!fortiOsVersion.equals(other.fortiOsVersion))
				return false;
			return true;
		}
	}

	/** The Constant CLI_CR. */
	private static final String CLI_CR = "\r";

	/** The Constant CLI_PROMPT. */
	private static final String CLI_PROMPT = "^[A-Za-z0-9_\\-]+ (\\([A-Za-z0-9]\\) )?# $";

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.netshot.device.AutoSnmpDiscoverableDevice#snmpAutoDiscover(java.lang
	 * .String, java.lang.String, org.netshot.device.access.Snmp)
	 */
	public boolean snmpAutoDiscover(String sysObjectId, String sysDesc,
	    Snmp poller) {
		return sysObjectId.matches("^1\\.3\\.6\\.1\\.4\\.1\\.12356\\.101\\..*");
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

	/** The Constant TRAP_ENTCONFIGCHANGE. */
	private static final String TRAP_ENTCONFIGCHANGE = "1.3.6.1.4.1.12356.101.6.0.1003";

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
		    .equals(TRAP_ENTCONFIGCHANGE)) {
			return false;
		}

		return TakeSnapshotTask.takeSnapshotIfNeeded(FortiOsDevice.class,
		    ipAddress);
	}

	/** The CLI session (SSH or Telnet). */
	private transient Cli cli;

	/** The CLI account in user. */
	private transient DeviceCliAccount cliInUseAccount = null;

	/**
	 * Instantiates a new FortiOS device.
	 * 
	 * @param address
	 *          the address
	 * @param domain
	 *          the domain
	 */
	public FortiOsDevice(Network4Address address, Domain domain) {
		super(address, domain);
	}

	/**
	 * Instantiates a new FortiOS device.
	 */
	public FortiOsDevice() {
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
		String[] expects = new String[] { CLI_PROMPT, "--More-- " };
		this.logIt("Executing command " + command, 7);
		String output = cli.send(command + CLI_CR, expects);
		while (true) {
			if (cli.getLastExpectMatchIndex() == 4) {
				output += cli.send(" ", expects);
				output = output.replaceAll("(?m)^.*\\033\\[42D", "");
				continue;
			}
			if (output.startsWith("Unknown action")) {
				throw new IOException("Invalid command");
			}
			return output;
		}
	}

	private void cliGlobal() throws IOException {
		String[] expects = new String[] { CLI_PROMPT };
		this.logIt("Switching to global mode", 7);
		cli.send("config global" + CLI_CR, expects);
		if (!cli.getLastExpectMatch().endsWith("(global) # ")) {
			throw new IOException("Unable to enter global mode");
		}
	}

	private void cliVdom(String vdom) throws IOException {
		String[] expects = new String[] { CLI_PROMPT };
		this.logIt("Switching to VDOM " + vdom, 7);
		cli.send("config vdom" + CLI_CR, expects);
		if (!cli.getLastExpectMatch().endsWith("(vdom) # ")) {
			throw new IOException("Unable to enter VDOM mode");
		}
		cli.send(String.format("edit %s" + CLI_CR, vdom), expects);
		if (!cli.getLastExpectMatch().endsWith("(" + vdom + ") # ")) {
			throw new IOException("Unable to edit the VDOM");
		}
	}

	private void cliEnd() throws IOException {
		String[] expects = new String[] { CLI_PROMPT };
		this.logIt("Exiting to root mode", 7);
		cli.send("end" + CLI_CR, expects);
		if (cli.getLastExpectMatch().endsWith(") # ")) {
			throw new IOException("Unable to enter global mode");
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
				@SuppressWarnings("unchecked")
				List<DeviceCredentialSet> globalCredentialSets = session
				    .createCriteria(DeviceCredentialSet.class).list();
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
		return "FortiOS device";
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

		FortiOsConfig config = new FortiOsConfig(this);

		networkInterfaces.clear();
		vrfInstances.clear();
		virtualDevices.clear();
		eolModule = null;
		eosModule = null;
		modules.clear();
		location = "";
		contact = "";

		try {
			String getSystemStatus = this.cliExecCommand("get system status");

			Pattern pattern;
			Matcher matcher;

			pattern = Pattern.compile("^Hostname: (?<name>.*)", Pattern.MULTILINE);
			matcher = pattern.matcher(getSystemStatus);
			if (matcher.find()) {
				this.name = matcher.group("name");
			}
			this.networkClass = NetworkClass.FIREWALL;
			this.family = "Unknown FortiOS device";
			pattern = Pattern.compile(
			    "^Version: (?<system>.*) v(?<version>[0-9\\.,a-zA-Z]+)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(getSystemStatus);
			if (matcher.find()) {
				this.setSoftwareVersion(matcher.group("version"));
				config.setFortiOsVersion(matcher.group("version"));
				this.setFamily(matcher.group("system"));
			}
			pattern = Pattern.compile("^Serial-Number: (?<serial>.*)",
			    Pattern.MULTILINE);
			matcher = pattern.matcher(getSystemStatus);
			if (matcher.find()) {
				this.setSerialNumber(matcher.group("serial"));
				Module module = new Module();
				module.setDevice(this);
				module.setSlot("Chassis");
				module.setPartNumber(this.getFamily());
				module.setSerialNumber(matcher.group("serial"));
				this.modules.add(module);
			}
		}
		catch (IOException e) {
			this.logIt("Couldn't get system status: " + e.getMessage(), 3);
		}

		try {
			this.cliGlobal();
			String getSystemVdom = this.cliExecCommand("get system vdom-property");
			String show = this.cliExecCommand("show");
			this.cliEnd();

			StringBuffer configuration = new StringBuffer("");

			List<String> vdoms = new ArrayList<String>();
			Pattern pattern = Pattern.compile("== \\[ (?<vdom>.*) \\]");
			Matcher matcher = pattern.matcher(getSystemVdom);
			while (matcher.find()) {
				vdoms.add(matcher.group("vdom"));
			}

			for (String vdom : vdoms) {
				configuration.append("\n");
				configuration.append("config vdom\n");
				configuration.append("edit " + vdom + "\n");
				configuration.append("end\n\n");
			}

			configuration.append("config global\n");
			configuration.append(show);
			configuration.append("end\n");

			for (String vdom : vdoms) {
				this.cliVdom(vdom);
				String vdomShow = this.cliExecCommand("show");
				this.cliEnd();
				configuration.append("\n");
				configuration.append("config vdom\n");
				configuration.append("edit " + vdom + "\n");
				configuration.append(vdomShow);
				configuration.append("end\n\n");
			}

			configuration.append("config global\n");
			configuration.append(show);

		}
		catch (IOException e) {
			cli.disconnect();
			throw new IOException("Couldn't get the configuration: " + e.getMessage());
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
