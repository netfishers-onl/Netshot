/**
 * Copyright 2013-2024 Netshot
 * 
 * This file is part of Netshot.
 * 
 * Netshot is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Netshot is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Netshot.  If not, see <http://www.gnu.org/licenses/>.
 */
package onl.netfishers.netshot.device;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.URI;
import java.net.URL;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import org.apache.commons.codec.binary.Hex;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Engine;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.proxy.ProxyObject;
import org.slf4j.MarkerFactory;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.collector.SnmpTrapReceiver;
import onl.netfishers.netshot.collector.SyslogServer;
import onl.netfishers.netshot.device.access.Ssh.SshConfig;
import onl.netfishers.netshot.device.access.Telnet.TelnetConfig;
import onl.netfishers.netshot.device.attribute.AttributeDefinition;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeLevel;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.TaskLogger;
import onl.netfishers.netshot.work.logger.LoggerTaskLogger;
import onl.netfishers.netshot.work.Task;

/**
 * This is a device driver.
 */
@XmlRootElement()
@XmlAccessorType(XmlAccessType.NONE)
@Slf4j
public class DeviceDriver implements Comparable<DeviceDriver> {

	/**
	 * Possible protocols for a device driver.
	 */
	public static enum DriverProtocol {
		TELNET("telnet"), SSH("ssh"), SNMP("snmp");

		final private String protocol;

		DriverProtocol(String protocol) {
			this.protocol = protocol;
		}

		public String value() {
			return protocol;
		}
	}

	/**
	 * Possible location types for driver files.
	 */
	public static enum LocationType {
		EMBEDDED,
		FILE,
	}

	/**
	 * Driver location
	 */
	@XmlRootElement
	@XmlAccessorType(value = XmlAccessType.NONE)
	public static class Location {
		/** Location type */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private LocationType type;

		/** File name */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String fileName;

		public Location(LocationType type, String fileName) {
			this.type = type;
			this.fileName = fileName;
		}
	}

	/** JS logger for SNMP-related messages */
	private static TaskLogger JS_SNMP_LOGGER = new LoggerTaskLogger(SnmpTrapReceiver.class);

	/** JS logger for Syslog-related messages */
	private static TaskLogger JS_SYSLOG_LOGGER = new LoggerTaskLogger(SyslogServer.class);

	/** The Javascript loader code. */
	private static Source JSLOADER_SOURCE;

	static {
		try {
			log.info("Reading the JavaScript driver loader code from the resource JS file.");
			// Read the JavaScript loader code from the resource file.
			String path = "interfaces/driver-loader.js";
			InputStream in = DeviceDriver.class.getResourceAsStream("/" + path);
			BufferedReader reader = new BufferedReader(new InputStreamReader(in));
			StringBuilder buffer = new StringBuilder();
			String line;
			while ((line = reader.readLine()) != null) {
				buffer.append(line);
				buffer.append("\n");
			}
			reader.close();
			in.close();
			JSLOADER_SOURCE = Source.create("js", buffer.toString());
			log.debug("The JavaScript driver loader code has been read from the resource JS file.");
		}
		catch (Exception e) {
			log.error(MarkerFactory.getMarker("FATAL"), "Unable to read the Javascript driver loader.", e);
			System.err.println("NETSHOT FATAL ERROR");
			e.printStackTrace();
			System.exit(1);
		}
	}

	/**
	 * The list of loaded newDrivers.
	 */
	private static Map<String, DeviceDriver> drivers = new HashMap<String, DeviceDriver>();

	/**
	 * Hash for all drivers.
	 */
	private static String allDriverHash = "";

	/**
	 * Gets all loaded newDrivers.
	 * 
	 * @return the loaded newDrivers
	 */
	public static List<DeviceDriver> getAllDrivers() {
		List<DeviceDriver> allDrivers = new ArrayList<>(drivers.values());
		Collections.sort(allDrivers);
		return allDrivers;
	}

	/**
	 * Gets a driver from its name.
	 * 
	 * @param name
	 *                 the name of the device driver
	 * @return the device driver from that name, or null if not found
	 */
	public static DeviceDriver getDriverByName(String name) {
		if (name == null) {
			return null;
		}
		return drivers.get(name);
	}

	/**
	 * Gets all loaded newDrivers as a hash.
	 * 
	 * @return the hash of loaded newDrivers
	 */
	public static Map<String, DeviceDriver> getDrivers() {
		return drivers;
	}

	/**
	 * Get a global hash for all drivers combined.
	 * @return the hash (hex-encoded string)
	 */
	public static String getAllDriverHash() {
		return allDriverHash;
	}

	/**
	 * Reloads all the newDrivers from disk.
	 * 
	 * @throws Exception
	 *                       something bad
	 */
	public static void refreshDrivers() throws Exception {
		Map<String, DeviceDriver> newDrivers = new HashMap<>();

		final String addPath = Netshot.getConfig("netshot.drivers.path");
		if (addPath != null) {
			final File folder = new File(addPath);
			if (folder.isDirectory()) {
				File[] files = folder.listFiles(new FileFilter() {
					@Override
					public boolean accept(File pathname) {
						return pathname.isFile() && pathname.getName().endsWith(".js");
					}
				});
				for (File file : files) {
					log.info("Found user device driver file {}.", file);
					Reader reader = null;
					try {
						InputStream stream = new FileInputStream(file);
						reader = new InputStreamReader(stream);
						DeviceDriver driver = new DeviceDriver(reader, file.getName(),
							new Location(LocationType.FILE, file.getAbsolutePath()));
						if (newDrivers.containsKey(driver.getName())) {
							log.warn(
									"Skipping user device driver file {}, because a similar driver is already loaded.",
									file);
						}
						else {
							newDrivers.put(driver.getName(), driver);
						}
					}
					catch (Exception e) {
						log.error("Error while loading user device driver {}.", file, e);
					}
					finally {
						if (reader != null) {
							reader.close();
						}
					}
				}
			}
			else {
				log.error("Unable to open {} to find device drivers.", addPath);
			}
		}

		String driverPathName = "drivers/";
		final URL driverUrl = DeviceDriver.class.getResource("/" + driverPathName);
		if (driverUrl != null && "file".equals(driverUrl.getProtocol())) {
			log.debug("Scanning folder {} for device drivers (.js).", driverUrl);
			final File folder = new File(driverUrl.toURI());
			if (folder.isDirectory()) {
				File[] files = folder.listFiles(new FileFilter() {
					@Override
					public boolean accept(File pathname) {
						return pathname.isFile() && pathname.getName().endsWith(".js");
					}
				});
				for (File file : files) {
					log.info("Found Netshot device driver file {}.", file);
					Reader reader = null;
					try {
						InputStream stream = DeviceDriver.class
								.getResourceAsStream("/" + driverPathName + file.getName());
						reader = new InputStreamReader(stream);
						DeviceDriver driver = new DeviceDriver(reader, file.getName(),
							new Location(LocationType.EMBEDDED, file.getAbsolutePath()));
						if (newDrivers.containsKey(driver.getName())) {
							log.warn(
									"Skipping Netshot device driver file {}, because a similar driver is already loaded.",
									file);
						}
						else {
							newDrivers.put(driver.getName(), driver);
						}
					}
					catch (Exception e1) {
						log.error("Error while loading the device driver {}.", file, e1);
					}
					finally {
						if (reader != null) {
							reader.close();
						}
					}
				}
			}
		}
		if (driverUrl != null && "jar".equals(driverUrl.getProtocol())) {
			String path = driverUrl.getFile();
			path = path.substring(0, path.lastIndexOf('!'));
			File file = new File(new URI(path));
			try {
				JarFile jar = new JarFile(file);
				final Enumeration<JarEntry> e = jar.entries();
				while (e.hasMoreElements()) {
					final JarEntry je = e.nextElement();
					if (!je.isDirectory() && je.getName().startsWith(driverPathName)) {
						log.info("Found Netshot device driver file {} (in jar).", file);
						Reader reader = null;
						try {
							InputStream stream = jar.getInputStream(je);
							reader = new InputStreamReader(stream);
							DeviceDriver driver = new DeviceDriver(reader,
									je.getName().replace(driverPathName, ""),
									new Location(LocationType.EMBEDDED, jar.getName()));
							if (newDrivers.containsKey(driver.getName())) {
								log.warn(
										"Skipping Netshot device driver file {}, because a similar driver is already loaded.",
										file);
							}
							else {
								newDrivers.put(driver.getName(), driver);
							}
						}
						catch (Exception e1) {
							log.error("Error while loading the device driver {} from jar file.", file, e1);
						}
						finally {
							if (reader != null) {
								reader.close();
							}
						}
					}
				}
				jar.close();
			}
			catch (Exception e) {
				log.error("While looking for device drivers in {}.", path, e);
			}
		}

		StringBuffer hashBuffer = new StringBuffer();
		for (DeviceDriver driver : newDrivers.values()) {
			hashBuffer.append(driver.getSourceHash());
		}
		MessageDigest digest = MessageDigest.getInstance("SHA-256");
		byte[] hash = digest.digest(hashBuffer.toString().getBytes());
		DeviceDriver.allDriverHash = Hex.encodeHexString(hash);
		DeviceDriver.drivers = newDrivers;
	}

	/** The name of the driver */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	private String name;

	/** The author of the driver */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	private String author;

	/** The description of the driver */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	private String description;

	/** The version of the driver */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	private String version;

	/**
	 * The priority of the driver for autodiscovery (65536 by default, larger number
	 * gives higher priority)
	 */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	private int priority;

	/** The device attributed provided by this driver */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	private Set<AttributeDefinition> attributes = new HashSet<>();

	/** The device attributes as map for faster lookup */
	private Map<AttributeDefinition.AttributeLevel, Map<String, AttributeDefinition>> attributesByName;

	/** The protocols provided by this driver */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Set<DriverProtocol> protocols = new HashSet<>();

	/**
	 * The main CLI modes supported by this driver (e.g. 'enable', 'configure',
	 * etc.)
	 */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	private Set<String> cliMainModes = new HashSet<>();

	/** Set to true if the driver can analyze SNMP traps */
	private boolean canAnalyzeTraps = true;

	/** Set to true if the driver can analyze syslog messages */
	private boolean canAnalyzeSyslog = true;

	/**
	 * Set to true if the driver can identify a relevant device based on SNMP
	 * sysObjectId and name
	 */
	private boolean canSnmpAutodiscover = true;

	/** The source code */
	private Source source;

	/** Source hash */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	private String sourceHash;

	/** Driver file location */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	private Location location;

	/** The execution engine (for eval caching) */
	private Engine engine;

	/** Driver-specific SSH config */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private SshConfig sshConfig;

	/** Driver-specific Telnet config */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private TelnetConfig telnetConfig;

	/** Instantiates a new device driver (empty constructor) */
	protected DeviceDriver() {
	}

	/**
	 * Instantiates a new device driver.
	 * 
	 * @param reader
	 *                       The reader to access the JavaScript driver code
	 * @param sourceName
	 *                       The name of the driver source
	 * @throws Exception
	 *                       something went wrong
	 */
	protected DeviceDriver(Reader reader, String sourceName, Location location) throws Exception {
		this.attributesByName = new HashMap<>();
		for (AttributeDefinition.AttributeLevel level : AttributeDefinition.AttributeLevel.values()) {
			this.attributesByName.put(level, new HashMap<>());
		}
		this.location = location;
		this.source = Source.newBuilder("js", reader, sourceName).buildLiteral();
		{
			// Compute source code hash
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(this.source.getCharacters().toString().getBytes());
			this.sourceHash = Hex.encodeHexString(hash, true);
		}
		this.engine = Engine.create();

		this.sshConfig = new SshConfig();
		this.telnetConfig = new TelnetConfig();

		try (Context context = this.getContext()) {
			this.loadCode(context);
			try {
				Value info = context.getBindings("js").getMember("Info");
				this.name = info.getMember("name").asString();
				this.author = info.getMember("author").asString();
				this.description = info.getMember("description").asString();
				this.version = info.getMember("version").asString();
				try {
					this.priority = info.getMember("priority").asInt();
				}
				catch (Exception e) {
					this.priority = 65536;
				}
			}
			catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Invalid Info object.", e);
			}

			try {
				Value config = context.getBindings("js").getMember("Config");
				for (String key : config.getMemberKeys()) {
					if (key == null || !key.matches("^[a-z][a-zA-Z0-9]+$")) {
						throw new IllegalArgumentException(String.format("Invalid config item %s.", key));
					}
					try {
						Value data = config.getMember(key);
						AttributeDefinition item = new AttributeDefinition(AttributeLevel.CONFIG, key, data);
						this.attributes.add(item);
						this.attributesByName.get(AttributeLevel.CONFIG).put(item.getName(), item);
					}
					catch (IllegalArgumentException e) {
						throw new IllegalArgumentException(String.format("Invalid item %s in Config.", key), e);
					}
				}
			}
			catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Invalid Config object.", e);
			}
			try {
				Value device = context.getBindings("js").getMember("Device");
				for (String key : device.getMemberKeys()) {
					if (key == null || !key.matches("^[a-z][a-zA-Z0-9]+$")) {
						throw new IllegalArgumentException(String.format("Invalid device item %s.", key));
					}
					try {
						Value data = device.getMember(key);
						AttributeDefinition item = new AttributeDefinition(AttributeLevel.DEVICE, key, data);
						this.attributes.add(item);
						this.attributesByName.get(AttributeLevel.DEVICE).put(item.getName(), item);
					}
					catch (IllegalArgumentException e) {
						throw new IllegalArgumentException(String.format("Invalid item %s in Device.", key), e);
					}
				}
			}
			catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Invalid Device object.", e);
			}

			try {
				Value cli = context.getBindings("js").getMember("CLI");
				if (cli.hasMembers()) {
					Value ssh = cli.getMember("ssh");
					if (ssh != null && ssh.hasMembers()) {
						this.protocols.add(DriverProtocol.SSH);
						Value sshConfig = ssh.getMember("config");
						if (sshConfig != null && sshConfig.hasMembers()) {
							Value terminal = sshConfig.getMember("terminal");
							if (terminal != null && terminal.hasMembers()) {
								Value usePty = terminal.getMember("pty");
								if (usePty != null) {
									this.sshConfig.setUsePty(usePty.asBoolean());
								}
								Value vtType = terminal.getMember("type");
								if (vtType != null) {
									this.sshConfig.setTerminalType(vtType.asString());
								}
								Value vtHeight = terminal.getMember("height");
								if (vtHeight != null) {
									this.sshConfig.setTerminalHeight(vtHeight.asInt());
								}
								Value vtWidth = terminal.getMember("width");
								if (vtWidth != null) {
									this.sshConfig.setTerminalWidth(vtWidth.asInt());
								}
								Value vtRows = terminal.getMember("rows");
								if (vtRows != null) {
									this.sshConfig.setTerminalRows(vtRows.asInt());
									if (vtHeight == null) {
										this.sshConfig.setTerminalHeight(vtRows.asInt() * 8);
									}
								}
								Value vtCols = terminal.getMember("cols");
								if (vtCols != null) {
									this.sshConfig.setTerminalCols(vtCols.asInt());
									if (vtWidth == null) {
										this.sshConfig.setTerminalWidth(vtCols.asInt() * 20);
									}
								}
							}
							{
								Value kexAlgorithms = sshConfig.getMember("kexAlgorithms");
								if (kexAlgorithms != null && kexAlgorithms.hasArrayElements()) {
									Set<String> algos = new HashSet<>();
									for (long i = 0; i < kexAlgorithms.getArraySize(); i++) {
										Value algo = kexAlgorithms.getArrayElement(i);
										algos.add(algo.asString());
									}
									this.sshConfig.setKexAlgorithms(algos.toArray(new String[0]));
								}
							}
							{
								Value hostKeyAlgorithms = sshConfig.getMember("hostKeyAlgorithms");
								if (hostKeyAlgorithms != null && hostKeyAlgorithms.hasArrayElements()) {
									Set<String> algos = new HashSet<>();
									for (long i = 0; i < hostKeyAlgorithms.getArraySize(); i++) {
										Value algo = hostKeyAlgorithms.getArrayElement(i);
										algos.add(algo.asString());
									}
									this.sshConfig.setHostKeyAlgorithms(algos.toArray(new String[0]));
								}
							}
							{
								Value ciphers = sshConfig.getMember("ciphers");
								if (ciphers != null && ciphers.hasArrayElements()) {
									Set<String> algos = new HashSet<>();
									for (long i = 0; i < ciphers.getArraySize(); i++) {
										Value algo = ciphers.getArrayElement(i);
										algos.add(algo.asString());
									}
									this.sshConfig.setCiphers(algos.toArray(new String[0]));
								}
							}
							{
								Value macs = sshConfig.getMember("macs");
								if (macs != null && macs.hasArrayElements()) {
									Set<String> algos = new HashSet<>();
									for (long i = 0; i < macs.getArraySize(); i++) {
										Value algo = macs.getArrayElement(i);
										algos.add(algo.asString());
									}
									this.sshConfig.setMacs(algos.toArray(new String[0]));
								}
							}
						}
						Value macros = ssh.getMember("macros");
						if (macros != null && macros.hasMembers()) {
							this.cliMainModes.addAll(macros.getMemberKeys());
						}
					}
					Value telnet = cli.getMember("telnet");
					if (telnet != null && telnet.hasMembers()) {
						this.protocols.add(DriverProtocol.TELNET);
						Value telnetConfig = telnet.getMember("config");
						if (telnetConfig != null && telnetConfig.hasMembers()) {
							Value terminal = telnetConfig.getMember("terminal");
							if (terminal != null && terminal.hasMembers()) {
								Value vtType = terminal.getMember("type");
								if (vtType != null) {
									this.telnetConfig.setTerminalType(vtType.asString());
								}
							}
						}
						Value macros = telnet.getMember("macros");
						if (macros != null && macros.hasMembers()) {
							this.cliMainModes.addAll(macros.getMemberKeys());
						}


					}
				}
			}
			catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Invalid CLI object.", e);
			}

			try {
				if (context.getBindings("js").hasMember("SNMP")) {
					this.protocols.add(DriverProtocol.SNMP);
				}
			}
			catch (IllegalArgumentException e) {
			}

			if (this.protocols.isEmpty()) {
				throw new IllegalArgumentException("Invalid driver, it supports neither Telnet nor SSH.");
			}

			try {
				if (!context.getBindings("js").getMember("snapshot").canExecute()) {
					throw new Exception();
				}
			}
			catch (Exception e) {
				throw new IllegalArgumentException("Invalid driver, the 'snapshot' function cannot be found.");
			}

			log.info("Loaded driver {} version {}.", this.name, this.version);
		}
	}

	/**
	 * Asks the driver to analyze a syslog message.
	 * 
	 * @param message
	 *                    The syslog message
	 * @param ip
	 *                    The IP address the message is coming from
	 * @return true to trigger a snapshot of the device
	 */
	public boolean analyzeSyslog(String message, Network4Address ip) {
		if (!canAnalyzeSyslog) {
			return false;
		}
		try (Context context = this.getContext()) {
			this.loadCode(context);
			Value result = context.getBindings("js")
				.getMember("_analyzeSyslog")
				.execute(message, JS_SYSLOG_LOGGER);
			if (result != null && result.isBoolean()) {
				return result.asBoolean();
			}
		}
		catch (Exception e) {
			if (e instanceof PolyglotException && e.getMessage() != null
					&& e.getMessage().contains("No analyzeSyslog function.")) {
				log.info("The driver {} has no analyzeSyslog function. Won't be called again.", name);
				this.canAnalyzeSyslog = false;
			}
			else {
				log.error("Error while running _analyzeSyslog function on driver {}.", name, e);
			}
		}
		return false;
	}

	public boolean analyzeTrap(Map<String, Object> data, Network4Address ip) {
		if (!canAnalyzeTraps) {
			return false;
		}
		try (Context context = this.getContext()) {
			this.loadCode(context);
			Value result = context.getBindings("js")
				.getMember("_analyzeTrap")
				.execute(ProxyObject.fromMap(data), JS_SNMP_LOGGER);
			if (result != null && result.isBoolean()) {
				return result.asBoolean();
			}
		}
		catch (Exception e) {
			if (e instanceof PolyglotException && e.getMessage() != null
					&& e.getMessage().contains("No analyzeTrap function.")) {
				log.info("The driver {} has no analyzeTrap function. Won't be called again.", name);
				this.canAnalyzeTraps = false;
			}
			else {
				log.error("Error while running _analyzeTrap function on driver {}.", name, e);
			}
		}
		return false;
	}

	@Transient
	public final Context getContext() throws IOException {
		log.debug("Getting context");
		HostAccess hostAccess = HostAccess
			.newBuilder()
			.allowAccessAnnotatedBy(HostAccess.Export.class)
			.allowImplementationsAnnotatedBy(HostAccess.Implementable.class)
			.allowImplementationsAnnotatedBy(FunctionalInterface.class)
			.allowAccessInheritance(true)
			.build();
		Context.Builder builder = Context
			.newBuilder("js", "python")
			.allowHostAccess(hostAccess);
		Context context;
		synchronized (engine) {
			context = builder.engine(engine).build();
		}
		log.debug("Context is ready");
		return context;
	}

	/**
	 * Load driver JS code.
	 * @param context the context to load code into
	 */
	public final void loadCode(Context context) {
		context.eval(this.source);
		context.eval(JSLOADER_SOURCE);
	}
	
	/**
	 * Asks the driver to analyze SNMP information.
	 * @param task The auto discovery task
	 * @param sysObjectId The received sysObjectId
	 * @param sysDesc The received sysDesc
	 * @param taskLogger The logger from the task
	 * @return true if the passed SNMP information matches a device of this driver
	 */
	public boolean snmpAutoDiscover(Task task, String sysObjectId, String sysDesc, TaskLogger taskLogger) {
		if (!canSnmpAutodiscover) {
			return false;
		}
		try (Context context = this.getContext()) {
			this.loadCode(context);
			Value result = context
				.getBindings("js")
				.getMember("_snmpAutoDiscover")
				.execute(sysObjectId, sysDesc, taskLogger);
			if (result != null && result.isBoolean()) {
				return result.asBoolean();
			}
		}
		catch (Exception e) {
			if (e instanceof PolyglotException && e.getMessage() != null &&
					e.getMessage().contains("No snmpAutoDiscover function.")) {
				log.info("The driver {} has no snmpAutoDiscover function.", name);
				this.canSnmpAutodiscover = false;
			}
			else {
				log.error("Error while running _snmpAutoDiscover function on driver {}.", name, e);
			}
		}
		return false;
	}

	@Transient
	public AttributeDefinition getAttributeDefinition(AttributeDefinition.AttributeLevel level, String name) {
		return this.attributesByName.get(level).get(name);
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("DeviceDriver [");
		if (name != null) {
			builder.append("name=");
			builder.append(name);
			builder.append(", ");
		}
		if (author != null) {
			builder.append("author=");
			builder.append(author);
			builder.append(", ");
		}
		if (description != null) {
			builder.append("description=");
			builder.append(description);
			builder.append(", ");
		}
		builder.append("version=");
		builder.append(version);
		builder.append(", ");
		builder.append("priority=");
		builder.append(Integer.toString(priority));
		builder.append("]");
		return builder.toString();
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (!(obj instanceof DeviceDriver))
			return false;
		DeviceDriver other = (DeviceDriver) obj;
		if (name == null) {
			if (other.name != null)
				return false;
		}
		else if (!name.equals(other.name))
			return false;
		return true;
	}
	
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((name == null) ? 0 : name.hashCode());
		return result;
	}

	@Override
	public int compareTo(DeviceDriver o) {
		if (o == this) {
			return 0;
		}
		if (o == null) {
			return -1;
		}
		int r = Integer.compare(this.priority, o.priority);
		if (r != 0) {
			return -r;
		}
		return this.name.compareTo(o.name);
	}

}
