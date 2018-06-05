/**
 * Copyright 2013-2016 Sylvain Cadilhac (NetFishers)
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
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URL;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.regex.Matcher;

import javax.script.Bindings;
import javax.script.Invocable;
import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import javax.script.SimpleScriptContext;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.collector.SnmpTrapReceiver;
import onl.netfishers.netshot.collector.SyslogServer;
import onl.netfishers.netshot.device.Device.InvalidCredentialsException;
import onl.netfishers.netshot.device.Device.NetworkClass;
import onl.netfishers.netshot.device.NetworkAddress.AddressUsage;
import onl.netfishers.netshot.device.access.Cli;
import onl.netfishers.netshot.device.access.Cli.WithBufferIOException;
import onl.netfishers.netshot.device.attribute.ConfigAttribute;
import onl.netfishers.netshot.device.attribute.ConfigBinaryAttribute;
import onl.netfishers.netshot.device.attribute.ConfigLongTextAttribute;
import onl.netfishers.netshot.device.attribute.ConfigNumericAttribute;
import onl.netfishers.netshot.device.attribute.ConfigTextAttribute;
import onl.netfishers.netshot.device.attribute.DeviceBinaryAttribute;
import onl.netfishers.netshot.device.attribute.DeviceLongTextAttribute;
import onl.netfishers.netshot.device.attribute.DeviceNumericAttribute;
import onl.netfishers.netshot.device.attribute.DeviceTextAttribute;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.work.Task;

import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

@XmlRootElement()
@XmlAccessorType(XmlAccessType.NONE)
public class DeviceDriver {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(DeviceDriver.class);

	private static String JSLOADER;
	
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
			JSLOADER = buffer.toString();
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

	private static Map<String, DeviceDriver> drivers = new HashMap<String, DeviceDriver>();

	public static Map<String, DeviceDriver> getDrivers() {
		return drivers;
	}

	public static Collection<DeviceDriver> getAllDrivers() {
		return drivers.values();
	}

	public static DeviceDriver getDriverByName(String name) {
		if (name == null) {
			return null;
		}
		return drivers.get(name);
	}

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
					try {
						InputStream stream = new FileInputStream(file);
						DeviceDriver driver = new DeviceDriver(stream);
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
					try {
						InputStream stream = DeviceDriver.class.getResourceAsStream("/" + driverPathName + file.getName());
						DeviceDriver driver = new DeviceDriver(stream);
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
						try {
							InputStream stream = jar.getInputStream(je);
							DeviceDriver driver = new DeviceDriver(stream);
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

	public static enum DriverProtocol {
		TELNET("telnet"),
		SSH("ssh");

		private String protocol;

		DriverProtocol(String protocol) {
			this.protocol = protocol;
		}
		public String value() {
			return protocol;
		}

	}

	public static enum AttributeType {
		NUMERIC,
		TEXT,
		LONGTEXT,
		DATE,
		BINARY
	}

	public static enum AttributeLevel {
		DEVICE,
		CONFIG
	}

	public static class AttributeDefinition {
		private AttributeType type;
		private AttributeLevel level;
		private String name;
		private String title;
		private boolean comparable = false;
		private boolean searchable = false;
		private boolean checkable = false;
		private boolean dump = false;
		private String preDump = null;
		private String postDump = null;
		private String preLineDump = null;
		private String postLineDump = null;
		
		protected AttributeDefinition() {
			
		}

		public AttributeDefinition(AttributeType type, AttributeLevel level, String name,
				String title, boolean comparable, boolean searchable, boolean checkable) {
			super();
			this.type = type;
			this.level = level;
			this.name = name;
			this.title = title;
			this.comparable = comparable;
			this.searchable = searchable;
			this.checkable = checkable;
		}
		
		public AttributeDefinition(AttributeLevel level, String name, Object data) throws Exception {
			this.level = level;
			this.name = name;
			this.title = DeviceDriver.toString(data, "title");
			if (!this.title.matches("^[0-9A-Za-z\\-_\\(\\)][0-9A-Za-z \\-_\\(\\)]+$")) {
				throw new IllegalArgumentException("Invalid title for item %s.");
			}
			String type = DeviceDriver.toString(data, "type");
			if (type.equals("Text")) {
				this.type = AttributeType.TEXT;
			}
			else if (type.equals("LongText")) {
				this.type = AttributeType.LONGTEXT;
			}
			else if (type.equals("Numeric")) {
				this.type = AttributeType.NUMERIC;
			}
			else if (type.equals("Binary")) {
				this.type = AttributeType.BINARY;
			}
			else {
				throw new IllegalArgumentException("Invalid type for item %s.");
			}
			this.searchable = DeviceDriver.toBoolean(data, "searchable", false);
			this.comparable = DeviceDriver.toBoolean(data, "comparable", false);
			this.checkable = DeviceDriver.toBoolean(data, "checkable", false);
			Object dump = DeviceDriver.toObject(data, "dump", Boolean.FALSE);
			if (dump != null) {
				if (dump instanceof Boolean) {
					this.dump = (Boolean) dump;
				}
				else if (dump instanceof Bindings) {
					this.dump = true;
					try {
						this.preDump = DeviceDriver.toString(dump, "pre");
					}
					catch (Exception e) {
					}
					try {
						this.preLineDump = DeviceDriver.toString(dump, "preLine");
					}
					catch (Exception e) {
					}
					try {
						this.postDump = DeviceDriver.toString(dump, "post");
					}
					catch (Exception e) {
					}
					try {
						this.postLineDump = DeviceDriver.toString(dump, "postLine");
					}
					catch (Exception e) {
					}
				}
				else {
					throw new IllegalArgumentException("Invalid 'dump' object in Config.");
				}
			}
			
		}

		@XmlElement
		public AttributeType getType() {
			return type;
		}
		public void setType(AttributeType type) {
			this.type = type;
		}
		@XmlElement
		public AttributeLevel getLevel() {
			return level;
		}
		public void setLevel(AttributeLevel level) {
			this.level = level;
		}
		@XmlElement
		public String getName() {
			return name;
		}
		public void setName(String name) {
			this.name = name;
		}
		@XmlElement
		public String getTitle() {
			return title;
		}
		public void setTitle(String title) {
			this.title = title;
		}
		@XmlElement
		public boolean isComparable() {
			return comparable;
		}
		public void setComparable(boolean comparable) {
			this.comparable = comparable;
		}
		@XmlElement
		public boolean isCheckable() {
			return checkable;
		}
		public void setCheckable(boolean checkable) {
			this.checkable = checkable;
		}
		@XmlElement
		public boolean isSearchable() {
			return searchable;
		}
		public void setSearchable(boolean searchable) {
			this.searchable = searchable;
		}
		public boolean isDump() {
			return dump;
		}
		public void setDump(boolean dump) {
			this.dump = dump;
		}
		public String getPreDump() {
			return preDump;
		}
		public void setPreDump(String preDump) {
			this.preDump = preDump;
		}
		public String getPostDump() {
			return postDump;
		}
		public void setPostDump(String postDump) {
			this.postDump = postDump;
		}
		public String getPreLineDump() {
			return preLineDump;
		}
		public void setPreLineDump(String preLineDump) {
			this.preLineDump = preLineDump;
		}
		public String getPostLineDump() {
			return postLineDump;
		}
		public void setPostLineDump(String postLineDump) {
			this.postLineDump = postLineDump;
		}
		@Override
		public String toString() {
			StringBuilder builder = new StringBuilder();
			builder.append("AttributeDefinition [");
			if (type != null) {
				builder.append("type=");
				builder.append(type);
				builder.append(", ");
			}
			if (level != null) {
				builder.append("level=");
				builder.append(level);
				builder.append(", ");
			}
			if (name != null) {
				builder.append("name=");
				builder.append(name);
				builder.append(", ");
			}
			if (title != null) {
				builder.append("title=");
				builder.append(title);
				builder.append(", ");
			}
			builder.append("comparable=");
			builder.append(comparable);
			builder.append(", searchable=");
			builder.append(searchable);
			builder.append("]");
			return builder.toString();
		}
	}

	protected static Object toObject(Object o, String key, Object defaultValue) throws IllegalArgumentException {
		if (o == null || !(o instanceof Bindings || o instanceof ScriptEngine)) {
			throw new IllegalArgumentException("Invalid object.");
		}
		Object v = null;
		if (o instanceof Bindings) {
			v = ((Bindings) o).get(key);
		}
		if (o instanceof ScriptEngine) {
			v = ((ScriptEngine) o).get(key);
		}
		if (v == null) {
			if (defaultValue == null) {
				throw new IllegalArgumentException(String.format("The key '%s' doesn't exist.", key));
			}
			else {
				return defaultValue;
			}
		}
		return v;
	}

	protected static Object toObject(Object o, String key) throws IllegalArgumentException {
		return toObject(o, key, null);
	}

	protected static Bindings toBindings(Object o, String key) throws IllegalArgumentException {
		Object v = toObject(o, key);
		if (!(v instanceof Bindings)) {
			throw new IllegalArgumentException(String.format("The value of %s is not a Javascript object.", key));
		}
		return (Bindings) v;
	}

	protected static String toString(Object o, String key, String defaultValue) throws IllegalArgumentException {
		Object v = toObject(o, key, defaultValue);
		if (!(v instanceof String)) {
			throw new IllegalArgumentException(String.format("The value of %s is not a string.", key));
		}
		String s = (String) v;
		if (s.trim().equals("")) {
			throw new IllegalArgumentException(String.format("The value of %s cannot be empty.", key));
		}
		return s;
	}

	protected static String toString(Object o, String key) throws IllegalArgumentException {
		return toString(o, key, null);
	}

	protected static Integer toInteger(Object o, String key, Integer defaultValue) throws IllegalArgumentException {
		Object v = toObject(o, key, defaultValue);
		if (!(v instanceof Integer)) {
			throw new IllegalArgumentException(String.format("The value of %s is not an integer.", key));
		}
		return (Integer) v;
	}

	protected static Integer toInteger(Object o, String key) throws IllegalArgumentException {
		return toInteger(o, key, null);
	}

	protected static Boolean toBoolean(Object o, String key, Boolean defaultValue) throws IllegalArgumentException {
		Object v = toObject(o, key, defaultValue);
		if (!(v instanceof Boolean)) {
			throw new IllegalArgumentException(String.format("The value of %s is not a boolean.", key));
		}
		return (Boolean) v;
	}

	protected static Boolean toBoolean(Object o, String key) throws IllegalArgumentException {
		return toBoolean(o, key, null);
	}

	protected void testFunction(String function) throws IllegalArgumentException {
		try {
			((Invocable) engine).invokeFunction(function);
		}
		catch (NoSuchMethodException e) {
			throw new IllegalArgumentException(String.format("The function %s doesn't exist.", function));
		}
		catch (Exception e) {

		}
	}


	private String name;
	private String author;
	private String description;
	private String version;
	private Set<AttributeDefinition> attributes = new HashSet<AttributeDefinition>();
	private Set<DriverProtocol> protocols = new HashSet<DriverProtocol>();
	
	private boolean canAnalyzeTraps = true;
	private boolean canAnalyzeSyslog = true;
	private boolean canSnmpAutodiscover = true;

	private ScriptEngine engine;

	protected DeviceDriver() {

	}

	protected DeviceDriver(InputStream in) throws Exception {
		engine = new ScriptEngineManager().getEngineByName("nashorn");

		engine.eval("delete load, com, edu, java, javafx, javax, org, JavaImporter, Java, loadWithNewGlobal;");
		engine.eval(new InputStreamReader(in));
		engine.eval(DeviceDriver.JSLOADER);


		try {
			Object info = toBindings(engine, "Info");
			this.name = toString(info, "name");
			this.author = toString(info, "author");
			this.description = toString(info, "description");
			this.version = toString(info, "version");
		}
		catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("Invalid Info object.", e);
		}

		try {
			Bindings config = toBindings(engine, "Config");
			for (String key : config.keySet()) {
				if (key == null || !key.matches("^[a-z][a-zA-Z0-9]+$")) {
					throw new IllegalArgumentException(String.format("Invalid config item %s.", key));
				}
				try {
					Object data = toBindings(config, key);
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
			Bindings device = toBindings(engine, "Device");
			for (String key : device.keySet()) {
				if (key == null || !key.matches("^[a-z][a-zA-Z0-9]+$")) {
					throw new IllegalArgumentException(String.format("Invalid device item %s.", key));
				}
				try {
					Object data = toBindings(device, key);
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
			Bindings cli = toBindings(engine, "CLI");
			if (cli.containsKey("ssh") && cli.get("ssh") instanceof Bindings) {
				this.protocols.add(DriverProtocol.SSH);
			}
			if (cli.containsKey("telnet") && cli.get("telnet") instanceof Bindings) {
				this.protocols.add(DriverProtocol.TELNET);
			}

		}
		catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("Invalid CLI object.", e);
		}

		if (this.protocols.size() == 0) {
			throw new IllegalArgumentException("Invalid driver, it supports neither Telnet nor SSH.");
		}

		this.testFunction("snapshot");

		logger.info("Loaded driver {}.", this);
	}

	@XmlElement
	public String getName() {
		return name;
	}

	@XmlElement
	public String getAuthor() {
		return author;
	}

	@XmlElement
	public String getDescription() {
		return description;
	}

	@XmlElement
	public String getVersion() {
		return version;
	}

	@XmlElement
	public Set<DriverProtocol> getProtocols() {
		return protocols;
	}

	protected void setProtocols(Set<DriverProtocol> protocols) {
		this.protocols = protocols;
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
		builder.append("]");
		return builder.toString();
	}

	public static class JsCli {
		private Cli cli;
		private DeviceCliAccount account;
		private boolean errored = false;
		private boolean debugSession = false;
		
		private static String toHexAscii(String text) {
			StringBuffer hex = new StringBuffer();
			for (int i = 0; i < text.length(); i++) {
				if (i % 16 == 0 && i > 0) {
					hex.append("\n");
				}
				hex.append(" ").append(String.format("%02x", (int) text.charAt(i)));
			}
			return hex.toString();
		}
		
		/** The log. */
		protected transient List<String> log  = new ArrayList<String>();
		
		private JsCli(Cli cli, DeviceCliAccount account) {
			this.cli = cli;
			this.account = account;
		}

		private JsCli(Cli cli, DeviceCliAccount account, boolean debugSession) {
			this(cli, account);
			this.debugSession = debugSession;
		}
		
		public String removeEcho(String text, String command) {
			String output = text;
			// Remove the echo of the command
			String headCommand = command;
			headCommand = headCommand.replaceFirst("[\\r\\n]+$", "");
			if (output.startsWith(headCommand)) {
				output = output.substring(headCommand.length());
				output = output.replaceFirst("^ *[\\r\\n]+", "");
				return output;
			}
			return output;
		}

		public String send(String command, String[] expects, int timeout) {
			this.errored = false;
			if (command == null) {
				command = "";
			}
			if (this.debugSession) {
				this.logIt("About to send the following command: '" + command + "'");
				this.logIt("In hex: " + toHexAscii(command));
			}
			command = command.replaceAll("\\$\\$NetshotUsername\\$\\$",
					Matcher.quoteReplacement(account.getUsername()));
			command = command.replaceAll("\\$\\$NetshotPassword\\$\\$",
					Matcher.quoteReplacement(account.getPassword()));
			command = command.replaceAll("\\$\\$NetshotSuperPassword\\$\\$",
					Matcher.quoteReplacement(account.getSuperPassword()));
			int oldTimeout = cli.getCommandTimeout();
			if (timeout > 0) {
				cli.setCommandTimeout(timeout);
			}
			try {
				logger.debug("Command to be sent: '{}'.", command);
				String result = cli.send(command, expects);
				if (this.debugSession) {
					this.logIt("Received the following output: '" + result + "'");
					this.logIt("In hex: " + toHexAscii(result));
				}
				return result;
			}
			catch (IOException e) {
				logger.error("CLI I/O error.", e);
				this.logIt("I/O error: " + e.getMessage());
				if (this.debugSession && e instanceof WithBufferIOException) {
					String buffer = ((WithBufferIOException) e).getReceivedBuffer().toString();
					this.logIt("Received buffer: '" + buffer + "'");
					this.logIt("In hex: " + toHexAscii(buffer));
				}
				this.errored = true;
			}
			finally {
				cli.setCommandTimeout(oldTimeout);
			}
			return null;
		}

		public String send(String command, String[] expects) throws IOException {
			return send(command, expects, -1);
		}

		public String send(String[] expects) throws IOException {
			return send(null, expects, -1);
		}

		public String getLastCommand() {
			return cli.getLastCommand();
		}
		public String getLastExpectMatch() {
			return cli.getLastExpectMatch().group();
		}
		public String getLastExpectMatchGroup(int group) {
			try {
				return cli.getLastExpectMatch().group(group);
			}
			catch (Exception e) {
				return null;
			}
		}
		public String getLastExpectMatchPattern() {
			return cli.getLastExpectMatchPattern();
		}
		public int getLastExpectMatchIndex() {
			return cli.getLastExpectMatchIndex();
		}
		public String getLastFullOutput() {
			return cli.getLastFullOutput();
		}
		public boolean isErrored() {
			return errored;
		}
		
		public void sleep(long millis) {
			try {
				Thread.sleep(millis);
			} catch (InterruptedException e) {
			}
		}
		
		public void log() {
			
		}
		
		protected void logIt(String log) {
			this.log.add(Instant.now() + " [CLI] " + log);
		}
		
		public List<String> getLog() {
			return log;
		}

	}
	
	public class JsConfig {
		private Config config;
		
		public JsConfig(Config config) {
			this.config = config;
		}
		
		public void set(String key, Double value) {
			if (value == null) {
				return;
			}
			try {
				for (AttributeDefinition attribute : DeviceDriver.this.attributes) {
					if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
						switch (attribute.getType()) {
						case NUMERIC:
							config.addAttribute(new ConfigNumericAttribute(config, key, value));
							break;
						default:
						}
						break;
					}
				}
			}
			catch (Exception e) {
				logger.warn("Error during snapshot while setting config attribute key '{}'.",
						key);
			}
		}
		
		public void set(String key, Boolean value) {
			if (value == null) {
				return;
			}
			try {
				for (AttributeDefinition attribute : DeviceDriver.this.attributes) {
					if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
						switch (attribute.getType()) {
						case BINARY:
							config.addAttribute(new ConfigBinaryAttribute(config, key, value));
							break;
						default:
						}
						break;
					}
				}
			}
			catch (Exception e) {
				logger.warn("Error during snapshot while setting config attribute key '{}'.",
						key);
			}
		}
		
		public void set(String key, Object value) {
			if (value == null) {
				return;
			}
			try {
				if ("author".equals(key)) {
					config.setAuthor((String) value);
				}
				else {
					for (AttributeDefinition attribute : DeviceDriver.this.attributes) {
						if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
							switch (attribute.getType()) {
							case LONGTEXT:
								config.addAttribute(new ConfigLongTextAttribute(config, key, (String) value));
								break;
							case TEXT:
								config.addAttribute(new ConfigTextAttribute(config, key, (String) value));
								break;
							default:
								break;
							}
							break;
						}
					}
				}
			}
			catch (Exception e) {
				logger.warn("Error during snapshot while setting config attribute key '{}'.",
						key);
			}
		}
		
	}
	
	public class JsDevice {
		
		private Device device;
		
		public JsDevice(Device device) {
			this.device = device;
		}
		
		public void reset() {
			device.setFamily("");
			device.setLocation("");
			device.setContact("");
			device.setSoftwareVersion("");
			device.setNetworkClass(NetworkClass.UNKNOWN);
			device.clearAttributes();
			device.clearVrfInstance();
			device.clearVirtualDevices();
			device.getNetworkInterfaces().clear();
			device.getModules().clear();
			device.setEolModule(null);
			device.setEosModule(null);
			device.setEolDate(null);
			device.setEosDate(null);
		}
		
		public void set(String key, String value) {
			if (value == null) {
				return;
			}
			try {
				if ("name".equals(key)) {
					device.setName(value);
				}
				else if ("family".equals(key)) {
					device.setFamily(value);
				}
				else if ("location".equals(key)) {
					device.setLocation(value);
				}
				else if ("contact".equals(key)) {
					device.setContact(value);
				}
				else if ("softwareVersion".equals(key)) {
					device.setSoftwareVersion(value);
				}
				else if ("serialNumber".equals(key)) {
					device.setSerialNumber(value);
				}
				else if ("comments".equals(key)) {
					device.setComments(value);
				}
				else if ("networkClass".equals(key)) {
					NetworkClass nc = NetworkClass.valueOf(value);
					if (nc != null) {
						device.setNetworkClass(nc);
					}
				}
				else {
					for (AttributeDefinition attribute : DeviceDriver.this.attributes) {
						if (attribute.getLevel().equals(AttributeLevel.DEVICE) && attribute.getName().equals(key)) {
							switch (attribute.getType()) {
							case LONGTEXT:
								device.addAttribute(new DeviceLongTextAttribute(device, key, value));
								break;
							case TEXT:
								device.addAttribute(new DeviceTextAttribute(device, key, value));
								break;
							default:
							}
							break;
						}
					}
				}
			}
			catch (Exception e) {
				logger.warn("Error during snapshot while setting device attribute key '{}'.",
						key);
			}
		}
		
		public void set(String key, Double value) {
			if (value == null) {
				return;
			}
			try {
				for (AttributeDefinition attribute : DeviceDriver.this.attributes) {
					if (attribute.getLevel().equals(AttributeLevel.DEVICE) && attribute.getName().equals(key)) {
						switch (attribute.getType()) {
						case NUMERIC:
							device.addAttribute(new DeviceNumericAttribute(device, key, value));
							break;
						default:
						}
						break;
					}
				}
			}
			catch (Exception e) {
				logger.warn("Error during snapshot while setting device attribute key '{}'.",
						key);
			}
		}
		
		public void set(String key, Boolean value) {
			if (value == null) {
				return;
			}
			try {
				for (AttributeDefinition attribute : DeviceDriver.this.attributes) {
					if (attribute.getLevel().equals(AttributeLevel.DEVICE) && attribute.getName().equals(key)) {
						switch (attribute.getType()) {
						case BINARY:
							device.addAttribute(new DeviceBinaryAttribute(device, key, value));
							break;
						default:
						}
						break;
					}
				}
			}
			catch (Exception e) {
				logger.warn("Error during snapshot while setting device attribute key '{}'.",
						key);
			}
		}

		public void add(String key, String value) {
			if (value == null) {
				return;
			}
			try {
				if ("vrf".equals(key)) {
					device.addVrfInstance(value);
				}
				else if ("virtualDevice".equals(key)) {
					device.addVirtualDevice(value);
				}
			}
			catch (Exception e) {
				logger.warn("Error during snapshot while adding device attribute key '{}'.",
						key, e);
			}
		}
		
		
		public void add(String key, Bindings data) {
			if (data == null) {
				return;
			}
			try {
				if ("module".equals(key)) {
					Module module = new Module(
							(String) data.getOrDefault("slot", ""),
							(String) data.getOrDefault("partNumber", ""),
							(String) data.getOrDefault("serialNumber", ""),
							device
					);
					device.getModules().add(module);
				}
				else if ("networkInterface".equals(key)) {
					Object enabled = data.getOrDefault("enabled", true);
					enabled = (enabled == null ? false : enabled);
					Object level3 = data.getOrDefault("level3", true);
					level3 = (level3 == null ? false : level3);
					NetworkInterface networkInterface = new NetworkInterface(
							device,
							(String) data.get("name"),
							(String) data.getOrDefault("virtualDevice", ""),
							(String) data.getOrDefault("vrf", ""),
							(Boolean) enabled,
							(Boolean) level3,
							(String) data.getOrDefault("description", "")
					);
					networkInterface.setPhysicalAddress(new PhysicalAddress((String) data.getOrDefault("mac", "0000.0000.0000")));
					Bindings ipAddresses = (Bindings) (data.get("ip"));
					if (ipAddresses != null) {
						for (Object ipAddress : ipAddresses.values()) {
							Bindings ip = (Bindings) ipAddress;
							NetworkAddress address = null;
							if (ip.get("ipv6") != null) {
								address = new Network6Address((String) ip.get("ipv6"), ((Number) ip.get("mask")).intValue());
							}
							else if (ip.get("mask") instanceof Number) {
								address = new Network4Address((String) ip.get("ip"), ((Number) ip.get("mask")).intValue());
							}
							else {
								address = new Network4Address((String) ip.get("ip"), (String) ip.get("mask"));
							}
							Object usage = ip.get("usage");
							if (usage != null) {
								address.setAddressUsage(AddressUsage.valueOf((String) usage));
							}
							networkInterface.addIpAddress(address);
						}
					}
					
					device.getNetworkInterfaces().add(networkInterface);
				}
			}
			catch (Exception e) {
				logger.warn("Error during snapshot while adding device attribute key '{}'.",
						key, e);
				device.logIt(String.format("Can't add device attribute %s: %s", key, e.getMessage()), 1);
			}
		}
		
		public void debug(String message) {
			device.logIt("JS debug - " + message, 5);
		}
		
	}

	private void cliRunFunction(Device device, Config config, Cli cli, DriverProtocol protocol,
			String function, DeviceCliAccount account, boolean debugSession)
					throws InvalidCredentialsException, IOException, ScriptException {
		Session session = Database.getSession();
		DeviceDataProvider dataProvider = new DeviceDataProvider(session, device);
		JsCli jsCli = new JsCli(cli, account, debugSession);
		try {
			((Invocable) engine).invokeFunction("_connect", jsCli, protocol.value(), function,
					new JsDevice(device), new JsConfig(config), dataProvider);
		}
		catch (ScriptException e) {
			logger.error("Error while running function {} using driver {}.", function, name, e);
			device.logIt(String.format("Error while running function %s  using driver %s: '%s'.",
					function, name, e.getMessage()), 1);
			if (e.getMessage().contains("Authentication failed")) {
				throw new InvalidCredentialsException("Authentication failed");
			}
			else {
				throw e;
			}
		}
		catch (NoSuchMethodException e) {
			logger.error("No such method {} while using driver {}.", function, name, e);
			device.logIt(String.format("No such method %s while using driver %s to take snapshot: '%s'.",
					function, name, e.getMessage()), 1);
			throw new ScriptException(e);
		}
		finally {
			device.sessionDebugLog = jsCli.log;
			session.close();
		}
	}

	@XmlElement
	public Set<AttributeDefinition> getAttributes() {
		return attributes;
	}
	
	public void runScript(Device device, Cli cli, DriverProtocol protocol,
			DeviceCliAccount account, String script, boolean debugSession) throws InvalidCredentialsException, IOException, ScriptException {
		if (script == null) {
			this.takeSnapshot(device, cli, protocol, account, debugSession);
		}
		else {
			JsCli jsCli = new JsCli(cli, account, debugSession);
			try {
				ScriptContext scriptContext = new SimpleScriptContext();
				scriptContext.setBindings(engine.getContext().getBindings(ScriptContext.ENGINE_SCOPE),
						ScriptContext.ENGINE_SCOPE);
				engine.eval(script, scriptContext);
				((Invocable) engine).invokeFunction("_connect", jsCli, protocol.value(), "run",
						new JsDevice(device));
			}
			catch (ScriptException e) {
				logger.error("Error while running script using driver {}.", name, e);
				device.logIt(String.format("Error while running script  using driver %s: '%s'.",
						name, e.getMessage()), 1);
				if (e.getMessage().contains("Authentication failed")) {
					throw new InvalidCredentialsException("Authentication failed");
				}
				else {
					throw e;
				}
			}
			catch (NoSuchMethodException e) {
				logger.error("No such method while using driver {}.", name, e);
				device.logIt(String.format("No such method while using driver %s to take snapshot: '%s'.",
						name, e.getMessage()), 1);
				throw new ScriptException(e);
			}
			finally {
				device.sessionDebugLog = jsCli.log;
			}
		}
	}

	public void takeSnapshot(Device device, Cli cli, DriverProtocol protocol,
			DeviceCliAccount account, boolean debugSession) throws InvalidCredentialsException, IOException, ScriptException {
		Config config = new Config(device);
		this.cliRunFunction(device, config, cli, protocol, "snapshot", account, debugSession);
		
		boolean different = false;
		try {
			Config lastConfig = Database.unproxy(device.getLastConfig());
			if (lastConfig == null) {
				different = true;
			}
			else {
				Map<String, ConfigAttribute> oldAttributes = lastConfig.getAttributeMap();
				Map<String, ConfigAttribute> newAttributes = config.getAttributeMap();
				for (AttributeDefinition definition : this.attributes) {
					if (definition.getLevel() != AttributeLevel.CONFIG) {
						continue;
					}
					ConfigAttribute oldAttribute = oldAttributes.get(definition.getName());
					ConfigAttribute newAttribute = newAttributes.get(definition.getName());
					if (oldAttribute != null) {
						if (!oldAttribute.equals(newAttribute)) {
							different = true;
							break;
						}
					}
					else if (newAttribute != null) {
						different = true;
						break;
					}
				}
			}
		}
		catch (Exception e) {
			logger.error("Error while comparing old and new configuration. Will save the new configuration.", e);
		}
		if (different) {
			device.setLastConfig(config);
			device.getConfigs().add(config);
		}
		else {
			device.logIt("The configuration hasn't changed. Not storing a new one in the DB.", 1);
		}
		

		String path = Netshot.getConfig("netshot.snapshots.dump");
		if (path != null) {
			try {
				BufferedWriter output = new BufferedWriter(
						new FileWriter(Paths.get(path, device.getName()).normalize().toFile()));
				Map<String, ConfigAttribute> newAttributes = config.getAttributeMap();
				for (AttributeDefinition definition : this.attributes) {
					if (!definition.isDump()) {
						continue;
					}
					String preText = definition.getPreDump();
					if (preText != null) {
						preText = preText.replaceAll("%when%",
								Matcher.quoteReplacement(new Date().toString()));
						output.write(preText);
						output.write("\r\n");
					}
					ConfigAttribute newAttribute = newAttributes.get(definition.getName());
					if (newAttribute != null) {
						String text = newAttribute.getAsText();
						if (text != null) {
							if (definition.getPreLineDump() != null || definition.getPostLineDump() != null) {
								String[] lines = text.split("\\r?\\n");
								for (String line : lines) {
									if (definition.getPreLineDump() != null) {
										output.write(definition.getPreLineDump());
									}
									output.write(line);
									if (definition.getPostLineDump() != null) {
										output.write(definition.getPostLineDump());
									}
									output.write("\r\n");
								}
							}
							else {
								output.write(text);
							}
						}
					}
					String postText = definition.getPostDump();
					if (postText != null) {
						postText = postText.replaceAll("%when%",
								Matcher.quoteReplacement(new Date().toString()));
						output.write(postText);
						output.write("\r\n");
					}
				}
				output.close();
				device.logIt("The configuration has been saved as a file in the dump folder.", 5);
			}
			catch (IOException e) {
				logger.warn("Couldn't write the configuration into file.", e);
				device.logIt("Unable to write the configuration as a file.", 2);
			}
		}
		
	}
	
	public class JsTaskLogger {
		
		Task task;
		
		public JsTaskLogger(Task task) {
			this.task = task;
		}
		
		public void debug(String message) {
			task.logIt("JS debug - " + message, 5);
		}
		
	}

	public boolean snmpAutoDiscover(Task task, String sysObjectId, String sysDesc) {
		if (!canSnmpAutodiscover) {
			return false;
		}
		try {
			Object result = ((Invocable) engine).invokeFunction("_snmpAutoDiscover", sysObjectId, sysDesc, this.new JsTaskLogger(task));
			if (result != null && result instanceof Boolean) {
				return (Boolean) result;
			}
		}
		catch (Exception e) {
			if (e instanceof ScriptException && e.getMessage() != null &&
					e.getMessage().contains("No snmpAutoDiscover function.")) {
				logger.info("The driver {} has no snmpAutoDiscover function.", name);
				this.canSnmpAutodiscover = false;
			}
			else {
				logger.error("Error while running _identify function on driver {}.", name, e);
			}
		}
		return false;
	}
	
	public class JsSnmpLogger {
		
		public JsSnmpLogger() {
		}
		
		public void debug(String message) {
			Logger logger = LoggerFactory.getLogger(SnmpTrapReceiver.class);
			logger.debug("JS debug - " + message);
		}
	}
	
	public boolean analyzeTrap(Map<String, String> data, Network4Address ip) {
		if (!canAnalyzeTraps) {
			return false;
		}
		try {
			Object result = ((Invocable) engine).invokeFunction("_analyzeTrap", data, this.new JsSnmpLogger());
			if (result != null && result instanceof Boolean && (Boolean) result) {
				return true;
			}
		}
		catch (Exception e) {
			if (e instanceof ScriptException && e.getMessage() != null &&
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
	
	public class JsSyslogLogger {
		
		public JsSyslogLogger() {
		}
		
		public void debug(String message) {
			Logger logger = LoggerFactory.getLogger(SyslogServer.class);
			logger.debug("JS debug - " + message);
		}
	}
	
	public boolean analyzeSyslog(String message, Network4Address ip) {
		if (!canAnalyzeSyslog) {
			return false;
		}
		try {
			Object result = ((Invocable) engine).invokeFunction("_analyzeSyslog", message, this.new JsSyslogLogger());
			if (result != null && result instanceof Boolean && (Boolean) result) {
				return true;
			}
		}
		catch (Exception e) {
			if (e instanceof ScriptException && e.getMessage() != null &&
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

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((name == null) ? 0 : name.hashCode());
		return result;
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



}
