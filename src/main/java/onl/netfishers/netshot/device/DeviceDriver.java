/**
 * Copyright 2013-2021 Sylvain Cadilhac (NetFishers)
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
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.URI;
import java.net.URL;
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

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Engine;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.collector.SnmpTrapReceiver;
import onl.netfishers.netshot.collector.SyslogServer;
import onl.netfishers.netshot.device.attribute.AttributeDefinition;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeLevel;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.TaskLogger;
import onl.netfishers.netshot.work.Task;

/**
 * This is a device driver.
 */
@XmlRootElement()
@XmlAccessorType(XmlAccessType.NONE)
public class DeviceDriver implements Comparable<DeviceDriver> {

	/**
	 * Possible protocols for a device driver.
	 */
	public static enum DriverProtocol {
		TELNET("telnet"),
		SSH("ssh"),
		SNMP("snmp");

		private String protocol;

		DriverProtocol(String protocol) {
			this.protocol = protocol;
		}
		public String value() {
			return protocol;
		}
	}

	/** The logger. */
	static Logger logger = LoggerFactory.getLogger(DeviceDriver.class);
	
	/** JS logger for SNMP-related messages */
	private static TaskLogger JS_SNMP_LOGGER = new TaskLogger() {
		Logger snmpLogger = LoggerFactory.getLogger(SnmpTrapReceiver.class);
		@Override
		public void warn(String message) {
			snmpLogger.warn("[JSWARN] {}", message);
		}
		@Override
		public void trace(String message) {
			snmpLogger.warn("[JSTRACE] {}", message);
		}
		@Override
		public void info(String message) {
			snmpLogger.warn("[JSINFO] {}", message);
		}
		@Override
		public void error(String message) {
			snmpLogger.warn("[JSERROR] {}", message);
		}
		@Override
		public void debug(String message) {
			snmpLogger.warn("[JSDEBUG] {}", message);
		}
	};
	
	/** JS logger for Syslog-related messages */
	private static TaskLogger JS_SYSLOG_LOGGER = new TaskLogger() {
		Logger syslogServer = LoggerFactory.getLogger(SyslogServer.class);
		@Override
		public void warn(String message) {
			syslogServer.warn("[JSWARN] {}", message);
		}
		@Override
		public void trace(String message) {
			syslogServer.warn("[JSTRACE] {}", message);
		}
		@Override
		public void info(String message) {
			syslogServer.warn("[JSINFO] {}", message);
		}
		@Override
		public void error(String message) {
			syslogServer.warn("[JSERROR] {}", message);
		}
		@Override
		public void debug(String message) {
			syslogServer.warn("[JSDEBUG] {}", message);
		}
	};

	/** The Javascript loader code. */
	private static Source JSLOADER_SOURCE;

	static {
		try {
			logger.info("Reading the JavaScript driver loader code from the resource JS file.");
			// Read the JavaScript loader code from the resource file.
			String path = "interfaces/driver-loader.js";
			InputStream in = DeviceDriver.class.getResourceAsStream("/" + path);
			BufferedReader reader = new BufferedReader(new InputStreamReader(in));
			StringBuffer buffer = new StringBuffer();
			String line = null;
			while ((line = reader.readLine()) != null) {
				buffer.append(line + "\n");
			}
			reader.close();
			in.close();
			JSLOADER_SOURCE = Source.create("js", buffer.toString());
			logger.debug("The JavaScript driver loader code has been read from the resource JS file.");
		}
		catch (Exception e) {
			logger.error(MarkerFactory.getMarker("FATAL"),
					"Unable to read the Javascript driver loader.", e);
			System.err.println("NETSHOT FATAL ERROR");
			e.printStackTrace();
			System.exit(1);
		}
	}

	/**
	 * The list of loaded drivers.
	 */
	private static Map<String, DeviceDriver> drivers = new HashMap<String, DeviceDriver>();

	/**
	 * Gets all loaded drivers.
	 * @return the loaded drivers
	 */
	public static List<DeviceDriver> getAllDrivers() {
		List<DeviceDriver> allDrivers = new ArrayList<DeviceDriver>(drivers.values());
		Collections.sort(allDrivers);
		return allDrivers;
	}

	/**
	 * Gets a driver from its name.
	 * @param name the name of the device driver
	 * @return the device driver from that name, or null if not found
	 */
	public static DeviceDriver getDriverByName(String name) {
		if (name == null) {
			return null;
		}
		return drivers.get(name);
	}

	/**
	 * Gets all loaded drivers as a hash.
	 * @return the hash of loaded drivers
	 */
	public static Map<String, DeviceDriver> getDrivers() {
		return drivers;
	}

	/**
	 * Reloads all the drivers from disk.
	 * @throws Exception something bad
	 */
	public static void refreshDrivers() throws Exception {
		Map<String, DeviceDriver> drivers = new HashMap<String, DeviceDriver>();

		final String addPath = Netshot.getConfig("netshot.drivers.path");
		if (addPath != null) {
			final File folder = new File(addPath);
			if (folder != null && folder.isDirectory()) {
				File[] files = folder.listFiles(new FileFilter() {
					@Override
					public boolean accept(File pathname) {
						return pathname.isFile() && pathname.getName().endsWith(".js");
					}
				});
				for (File file : files) {
					logger.info("Found user device driver file {}.", file);
					Reader reader = null;
					try {
						InputStream stream = new FileInputStream(file);
						reader = new InputStreamReader(stream);
						DeviceDriver driver = new DeviceDriver(reader, file.getName());
						if (drivers.containsKey(driver.getName())) {
							logger.warn("Skipping user device driver file {}, because a similar driver is already loaded.",
									file);
						}
						else {
							drivers.put(driver.getName(), driver);
						}
					}
					catch (Exception e) {
						logger.error("Error while loading user device driver {}.", file, e);
					}
					finally {
						if (reader != null) {
							reader.close();
						}
					}
				}
			}
			else {
				logger.error("Unable to open {} to find device drivers.", addPath);
			}
		}

		String driverPathName = "drivers/";
		final URL driverUrl = DeviceDriver.class.getResource("/" + driverPathName);
		if (driverUrl != null && "file".equals(driverUrl.getProtocol())) {
			logger.debug("Scanning folder {} for device drivers (.js).", driverUrl);
			final File folder = new File(driverUrl.toURI());
			if (folder.isDirectory()) {
				File[] files = folder.listFiles(new FileFilter() {
					@Override
					public boolean accept(File pathname) {
						return pathname.isFile() && pathname.getName().endsWith(".js");
					}
				});
				for (File file : files) {
					logger.info("Found Netshot device driver file {}.", file);
					Reader reader = null;
					try {
						InputStream stream = DeviceDriver.class.getResourceAsStream("/" + driverPathName + file.getName());
						reader = new InputStreamReader(stream);
						DeviceDriver driver = new DeviceDriver(reader, file.getName());
						if (drivers.containsKey(driver.getName())) {
							logger.warn("Skipping Netshot device driver file {}, because a similar driver is already loaded.",
									file);
						}
						else {
							drivers.put(driver.getName(), driver);
						}
					}
					catch (Exception e1) {
						logger.error("Error while loading the device driver {}.", file, e1);
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
						logger.info("Found Netshot device driver file {} (in jar).", file);
						Reader reader = null;
						try {
							InputStream stream = jar.getInputStream(je);
							reader = new InputStreamReader(stream);
							DeviceDriver driver = new DeviceDriver(reader, je.getName().replace(driverPathName, ""));
							if (drivers.containsKey(driver.getName())) {
								logger.warn("Skipping Netshot device driver file {}, because a similar driver is already loaded.",
										file);
							}
							else {
								drivers.put(driver.getName(), driver);
							}
						}
						catch (Exception e1) {
							logger.error("Error while loading the device driver {} from jar file.", file, e1);
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
				logger.error("While looking for device drivers in {}.", path, e);
			}
		}
		DeviceDriver.drivers = drivers;
	}

	/** The name of the driver */
	private String name;

	/** The author of the driver */
	private String author;

	/** The description of the driver */
	private String description;

	/** The version of the driver */
	private String version;

	/** The priority of the driver for autodiscovery (65536 by default,
	 * larger number gives higher priority) */
	private int priority;
	
	/** The device attributed provided by this driver */
	Set<AttributeDefinition> attributes = new HashSet<AttributeDefinition>();

	/** The protocols provided by this driver */
	private Set<DriverProtocol> protocols = new HashSet<DriverProtocol>();

	/** The main CLI modes supported by this driver (e.g. 'enable', 'configure', etc.) */
	private Set<String> cliMainModes = new HashSet<String>();

	/** Set to true if the driver can analyze SNMP traps */
	private boolean canAnalyzeTraps = true;

	/** Set to true if the driver can analyze syslog messages */
	private boolean canAnalyzeSyslog = true;

	/** Set to true if the driver can identify a relevant device based on SNMP sysObjectId and name */
	private boolean canSnmpAutodiscover = true;
	
	/** The source code */
	private Source source;
	
	/** The execution engine (for eval caching) */
	private Engine engine;

	/** Instantiates a new device driver (empty constructor) */
	protected DeviceDriver() {
	}

	/**
	 * Instantiates a new device driver.
	 * @param reader The reader to access the JavaScript driver code
	 * @param sourceName The name of the driver source
	 * @throws Exception something went wrong
	 */
	protected DeviceDriver(Reader reader, String sourceName) throws Exception {
		source = Source.newBuilder("js", reader, sourceName).buildLiteral();
		this.engine = Engine.create();
		Context context = getContext();

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
			if (cli.hasMember("ssh")) {
				this.protocols.add(DriverProtocol.SSH);
				Value ssh = cli.getMember("ssh");
				if (ssh.hasMembers() && ssh.hasMember("macros")) {
					Value macros = ssh.getMember("macros");
					this.cliMainModes.addAll(macros.getMemberKeys());
				}
			}
			if (cli.hasMember("telnet")) {
				this.protocols.add(DriverProtocol.TELNET);
				Value telnet = cli.getMember("telnet");
				if (telnet.hasMembers() && telnet.hasMember("macros")) {
					Value macros = telnet.getMember("macros");
					this.cliMainModes.addAll(macros.getMemberKeys());
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

		if (this.protocols.size() == 0) {
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

		logger.info("Loaded driver {}.", this);
	}

	/**
	 * Asks the driver to analyze a syslog message.
	 * @param message The syslog message
	 * @param ip The IP address the message is coming from
	 * @return true to trigger a snapshot of the device
	 */
	public boolean analyzeSyslog(String message, Network4Address ip) {
		if (!canAnalyzeSyslog) {
			return false;
		}
		try {
			Context context = this.getContext();
			Value result = context.getBindings("js").getMember("_analyzeSyslog").execute(message, JS_SYSLOG_LOGGER);
			if (result != null && result.isBoolean()) {
				return result.asBoolean();
			}
		}
		catch (Exception e) {
			if (e instanceof UnsupportedOperationException && e.getMessage() != null &&
					e.getMessage().contains("No analyzeSyslog function.")) {
				logger.info("The driver {} has no analyzeSyslog function. Won't be called again.", name);
				this.canAnalyzeSyslog = false;
			}
			else {
				logger.error("Error while running _analyzeSyslog function on driver {}.", name, e);
			}
		}
		return false;
	}

	public boolean analyzeTrap(Map<String, String> data, Network4Address ip) {
		if (!canAnalyzeTraps) {
			return false;
		}
		try {
			Context context = this.getContext();
			Value result = context.getBindings("js").getMember("_analyzeTrap").execute(data, JS_SNMP_LOGGER);
			if (result != null && result.isBoolean()) {
				return result.asBoolean();
			}
		}
		catch (Exception e) {
			if (e instanceof UnsupportedOperationException && e.getMessage() != null &&
					e.getMessage().contains("No analyzeTrap function.")) {
				logger.info("The driver {} has no analyzeTrap function. Won't be called again.", name);
				this.canAnalyzeTraps = false;
			}
			else {
				logger.error("Error while running _analyzeTrap function on driver {}.", name, e);
			}
		}
		return false;
	}
	
	@XmlElement
	@JsonView(DefaultView.class)
	public Set<AttributeDefinition> getAttributes() {
		return attributes;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getAuthor() {
		return author;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getDescription() {
		return description;
	}
	
	@XmlElement
	@JsonView(DefaultView.class)
	public String getName() {
		return name;
	}
	
	@XmlElement
	@JsonView(DefaultView.class)
	public Set<DriverProtocol> getProtocols() {
		return protocols;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public Set<String> getCliMainModes() {
		return cliMainModes;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getVersion() {
		return version;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public int getPriority() {
		return priority;
	}
	
	@Transient
	public Context getContext() {
		Context context = Context.newBuilder().engine(this.engine).build();
		context.eval(this.source);
		context.eval(JSLOADER_SOURCE);
		return context;
	}
	
	protected void setProtocols(Set<DriverProtocol> protocols) {
		this.protocols = protocols;
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
		try {
			Context context = this.getContext();
			Value result = context.getBindings("js").getMember("_snmpAutoDiscover").execute(sysObjectId, sysDesc, taskLogger);
			if (result != null && result.isBoolean()) {
				return result.asBoolean();
			}
		}
		catch (Exception e) {
			if (e instanceof UnsupportedOperationException && e.getMessage() != null &&
					e.getMessage().contains("No snmpAutoDiscover function.")) {
				logger.info("The driver {} has no snmpAutoDiscover function.", name);
				this.canSnmpAutodiscover = false;
			}
			else {
				logger.error("Error while running _snmpAutoDiscover function on driver {}.", name, e);
			}
		}
		return false;
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
