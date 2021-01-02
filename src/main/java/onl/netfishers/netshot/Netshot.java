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
package onl.netfishers.netshot;

import java.io.FileInputStream;
import java.io.InputStream;
import java.security.Security;
import java.util.Enumeration;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;
import org.slf4j.bridge.SLF4JBridgeHandler;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.net.SyslogAppender;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.ConsoleAppender;
import ch.qos.logback.core.OutputStreamAppender;
import ch.qos.logback.core.rolling.FixedWindowRollingPolicy;
import ch.qos.logback.core.rolling.RollingFileAppender;
import ch.qos.logback.core.rolling.SizeBasedTriggeringPolicy;
import ch.qos.logback.core.util.FileSize;
import onl.netfishers.netshot.collector.SnmpTrapReceiver;
import onl.netfishers.netshot.collector.SyslogServer;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.rest.RestService;

/**
 * The Class Netshot. Starting point of Netshot
 */
public class Netshot extends Thread {

	/** Netshot version. */
	public static final String VERSION = "0.15.2";

	/** The list of configuration files to look at, in sequence. */
	private static final String[] CONFIG_FILENAMES = new String[] {
		"netshot.conf", "/etc/netshot.conf" };

	/** The application configuration as retrieved from the configuration file. */
	private static Properties config;

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(Netshot.class);
	final static public Logger aaaLogger = LoggerFactory.getLogger("AAA");

	/**
	 * Gets the config.
	 *
	 * @return the config
	 */
	public static Properties getConfig() {
		return config;
	}

	/**
	 * Gets the config.
	 *
	 * @param key the key
	 * @param defaultValue the default value
	 * @return the config
	 */
	public static String getConfig(String key, String defaultValue) {
		String value = getConfig(key);
		return value == null ? defaultValue : value;
	}

	/**
	 * Gets a config item as an Integer
	 * @param key the config key
	 * @param defaultValue the default value
	 * @return the config
	 */
	public static int getConfig(String key, int defaultValue) {
		String textValue = getConfig(key);
		if (textValue != null) {
			try {
				return Integer.parseInt(textValue);
			}
			catch (Exception e) {
				logger.error("Unable to parse the integer value of configuration item '{}'.", key);
			}
		}
		return defaultValue;
	}

	/**
	 * Gets the config.
	 *
	 * @param key the key
	 * @return the config
	 */
	public static String getConfig(String key) {
		String envKey = key.replace(".", "_").toUpperCase();
		try {
			String value = System.getenv(envKey);
			if (value != null) {
				return value;
			}
		}
		catch (SecurityException e) {
			logger.warn("Security exception raised while getting environment variable {}", envKey, e);
		}
		return config.getProperty(key);
	}

	/**
	 * Read the application configuration from the files.
	 *
	 * @return true, if successful
	 */
	protected static boolean initConfig() {
		config = new Properties();
		for (String fileName : CONFIG_FILENAMES) {
			try {
				logger.trace("Trying to load the configuration file {}.", fileName);
				InputStream fileStream = new FileInputStream(fileName);
				config.load(fileStream);
				fileStream.close();
				logger.warn("Configuration file {} successfully read.", fileName);
				break;
			}
			catch (Exception e) {
				logger.warn("Unable to read the configuration file {}.", fileName);
			}
		}
		if (config.isEmpty()) {
			logger.error(MarkerFactory.getMarker("FATAL"), "No configuration file was found. Exiting.");
			return false;
		}
		return true;
	}
	
	/**
	 * Initializes the logging.
	 *
	 * @return true, if successful
	 */
	protected static boolean initMainLogging() {
		// Redirect JUL to SLF4J
		SLF4JBridgeHandler.removeHandlersForRootLogger();
		SLF4JBridgeHandler.install();
		
		ch.qos.logback.classic.Logger rootLogger = (ch.qos.logback.classic.Logger)
				LoggerFactory.getLogger(ch.qos.logback.classic.Logger.ROOT_LOGGER_NAME);
		LoggerContext loggerContext = rootLogger.getLoggerContext();
		
		System.setProperty("org.jboss.logging.provider", "slf4j");

		String logFile = Netshot.getConfig("netshot.log.file", "netshot.log");
		String logLevelCfg = Netshot.getConfig("netshot.log.level");
		String logCountCfg = Netshot.getConfig("netshot.log.count", "5");
		String logMaxSizeCfg = Netshot.getConfig("netshot.log.maxsize", "2");

		int logCount = 5;
		try {
			logCount = Integer.parseInt(logCountCfg);
		}
		catch (NumberFormatException e) {
			logger.error("Invalid number of log files (netshot.log.count config line). Using {}.", logCount);
		}
		
		int logMaxSize = 5;
		try {
			logMaxSize = Integer.parseInt(logMaxSizeCfg);
			if (logMaxSize < 1) {
				throw new NumberFormatException();
			}
		}
		catch (NumberFormatException e1) {
			logger.error("Invalid max size of log files (netshot.log.maxsize config line). Using {}.", logMaxSize);
		}

		Level logLevel = Level.toLevel(logLevelCfg, Level.WARN);
		if (logLevelCfg != null && !logLevel.toString().equals(logLevelCfg)) {
			logger.error("Invalid log level (netshot.log.level) '{}'. Using {}.", logLevelCfg, logLevel);
		}
		
		OutputStreamAppender<ILoggingEvent> appender;

		if (logFile.equals("CONSOLE")) {
			ConsoleAppender<ILoggingEvent> cAppender = new ConsoleAppender<ILoggingEvent>();
			logger.info("Will go on logging to the console.");
			appender = cAppender;
		}
		else {
			logger.info("Switching to file logging, into {}, level {}, rotation using {} files of max {}MB.",
					logFile, logLevel, logCount, logMaxSize);

			loggerContext.reset();
			try {
				RollingFileAppender<ILoggingEvent> rfAppender = new RollingFileAppender<ILoggingEvent>();
				rfAppender.setContext(loggerContext);
				rfAppender.setFile(logFile);

				FixedWindowRollingPolicy fwRollingPolicy = new FixedWindowRollingPolicy();
				fwRollingPolicy.setContext(loggerContext);
				fwRollingPolicy.setFileNamePattern(logFile + ".%i.gz");
				fwRollingPolicy.setMinIndex(1);
				fwRollingPolicy.setMaxIndex(logCount);
				fwRollingPolicy.setParent(rfAppender);
				fwRollingPolicy.start();

				SizeBasedTriggeringPolicy<ILoggingEvent> triggeringPolicy = new 
						SizeBasedTriggeringPolicy<ILoggingEvent>();
				triggeringPolicy.setMaxFileSize(new FileSize(logMaxSize * FileSize.MB_COEFFICIENT));
				triggeringPolicy.start();

				rfAppender.setRollingPolicy(fwRollingPolicy);
				rfAppender.setTriggeringPolicy(triggeringPolicy);
				appender = rfAppender;
				
			}
			catch (Exception e) {
				logger.error(MarkerFactory.getMarker("FATAL"), "Unable to log into file {}. Exiting.", logFile, e);
				return false;
			}
		}

		rootLogger.setLevel(logLevel);
		PatternLayoutEncoder encoder = new PatternLayoutEncoder();
		encoder.setContext(loggerContext);
		encoder.setPattern("%d %-5level [%thread] %logger{0}: %msg%n");
		encoder.start();
		appender.setEncoder(encoder);
		appender.setContext(loggerContext);
		appender.start();
		rootLogger.addAppender(appender);
		
		Pattern logSetting = Pattern.compile("^netshot\\.log\\.class\\.(?<class>.*)"); 
		Enumeration<?> propertyNames = Netshot.config.propertyNames();
		while (propertyNames.hasMoreElements()) {
			String propertyName = (String) propertyNames.nextElement();
			Matcher matcher = logSetting.matcher(propertyName);
			if (matcher.find()) {
				String propertyValue = Netshot.getConfig(propertyName);
				String className = matcher.group("class").trim();
				ch.qos.logback.classic.Logger classLogger = (ch.qos.logback.classic.Logger)
						LoggerFactory.getLogger(className);
				try {
					Level classLevel = Level.valueOf(propertyValue);
					classLogger.setLevel(classLevel);
					logger.info("Assigning level {} to class {}.", classLevel, className);
				}
				catch (Exception e) {
					logger.error("Invalid log level for class {}.", className);
				}
			}
		}
		
		return true;
	}

	/**
	 * Initialize the audit logging.
	 * @return true if everything went well
	 */
	protected static boolean initAuditLogging() {
		String auditFile = Netshot.getConfig("netshot.log.audit.file");
		String auditLevelCfg = Netshot.getConfig("netshot.log.audit.level");
		String auditCountCfg = Netshot.getConfig("netshot.log.audit.count", "5");
		String auditMaxSizeCfg = Netshot.getConfig("netshot.log.audit.maxsize", "2");
		int auditCount = 5;
		try {
			auditCount = Integer.parseInt(auditCountCfg);
		}
		catch (NumberFormatException e) {
			logger.error("Invalid number of log files (netshot.log.audit.count config line). Using {}.", auditCount);
		}
		
		int auditMaxSize = 5;
		try {
			auditMaxSize = Integer.parseInt(auditMaxSizeCfg);
			if (auditMaxSize < 1) {
				throw new NumberFormatException();
			}
		}
		catch (NumberFormatException e1) {
			logger.error("Invalid max size of log files (netshot.log.audit.maxsize config line). Using {}.", auditMaxSize);
		}
		((ch.qos.logback.classic.Logger) aaaLogger).setAdditive(false);
		Level logLevel = Level.toLevel(auditLevelCfg, Level.OFF);
		if (auditLevelCfg != null && !logLevel.toString().equals(auditLevelCfg)) {
			logger.error("Invalid log level (netshot.log.audit.level) '{}'. Using {}.", auditLevelCfg, logLevel);
		}
		((ch.qos.logback.classic.Logger) aaaLogger).setLevel(logLevel);
		
		if (auditFile != null) {
			try {
				LoggerContext loggerContext = ((ch.qos.logback.classic.Logger) aaaLogger).getLoggerContext();
				RollingFileAppender<ILoggingEvent> appender = new RollingFileAppender<ILoggingEvent>();
				appender.setContext(loggerContext);
				appender.setFile(auditFile);

				FixedWindowRollingPolicy fwRollingPolicy = new FixedWindowRollingPolicy();
				fwRollingPolicy.setContext(loggerContext);
				fwRollingPolicy.setFileNamePattern(auditFile + ".%i.gz");
				fwRollingPolicy.setMinIndex(1);
				fwRollingPolicy.setMaxIndex(auditCount);
				fwRollingPolicy.setParent(appender);
				fwRollingPolicy.start();

				SizeBasedTriggeringPolicy<ILoggingEvent> triggeringPolicy = new 
						SizeBasedTriggeringPolicy<ILoggingEvent>();
				triggeringPolicy.setMaxFileSize(new FileSize(auditMaxSize * FileSize.MB_COEFFICIENT));
				triggeringPolicy.start();

				appender.setRollingPolicy(fwRollingPolicy);
				appender.setTriggeringPolicy(triggeringPolicy);
				PatternLayoutEncoder encoder = new PatternLayoutEncoder();
				encoder.setContext(loggerContext);
				encoder.setPattern("%d %logger{0}: %msg%n");
				encoder.start();
				appender.setEncoder(encoder);
				appender.setContext(loggerContext);
				
				appender.start();
				((ch.qos.logback.classic.Logger) aaaLogger).addAppender(appender);
				logger.warn("Audit information will be logged to {}.", auditFile);
				aaaLogger.error("Audit starting.");
			}
			catch (Exception e) {
				logger.error("Unable to log AAA data into file {}. Exiting.", auditFile, e);
			}
		}
		return true;
	}
	
	/** The exception handler. To be used by other threads. */
	public static Thread.UncaughtExceptionHandler exceptionHandler = new Thread.UncaughtExceptionHandler() {
		public void uncaughtException(Thread th, Throwable ex) {
			System.err.println("NETSHOT FATAL ERROR");
			ex.printStackTrace();
			System.exit(1);
		}
	};
	
	/**
	 * Initialize remote Syslog logging.
	 * @return true if everything went fine.
	 */
	protected static boolean initSyslogLogging() {

		ch.qos.logback.classic.Logger rootLogger = (ch.qos.logback.classic.Logger)
				LoggerFactory.getLogger(ch.qos.logback.classic.Logger.ROOT_LOGGER_NAME);
		LoggerContext loggerContext = rootLogger.getLoggerContext();
		
		int syslogIndex = 1;
		while (true) {
			String host = Netshot.getConfig(String.format("netshot.log.syslog%d.host", syslogIndex));
			if (host == null) {
				break;
			}
			host = host.trim();
			if (host.equals("")) {
				break;
			}
			SyslogAppender appender = new SyslogAppender();
			appender.setSyslogHost(host);
			appender.setContext(loggerContext);
			appender.setSuffixPattern("[Netshot] %logger{0}: %msg");
			String port = Netshot.getConfig(String.format("netshot.log.syslog%d.port", syslogIndex));
			if (port != null) {
				try {
					appender.setPort(Integer.parseInt(port));
				}
				catch (NumberFormatException e) {
					logger.error("Invalid syslog port number ({}).", String.format("netshot.log.syslog%d.port", syslogIndex));
				}
			}
			String facility = Netshot.getConfig(String.format("netshot.log.syslog%d.facility", syslogIndex));
			appender.setFacility(facility == null ? "LOCAL7" : facility);
			rootLogger.addAppender(appender);
			((ch.qos.logback.classic.Logger) aaaLogger).addAppender(appender);
			try {
				appender.start();
			}
			catch (Exception e) {
				logger.error("Unable to start syslog instance {}: {}.", syslogIndex, e.getMessage());
			}
			logger.warn("Logging to syslog {}:{} has started", appender.getSyslogHost(), appender.getPort());
			syslogIndex++;
		}
		
		return true;
	}

	/**
	 * The main method.
	 *
	 * @param args the arguments
	 */
	public static void main(String[] args) {
		System.out.println(String.format("Starting Netshot version %s.",
				Netshot.VERSION));
		logger.info("Starting Netshot");

		if (!Netshot.initConfig()) {
			System.exit(1);
		}
		if (!Netshot.initMainLogging() || !Netshot.initAuditLogging() || !Netshot.initSyslogLogging()) {
			System.exit(1);
		}

		try {
			logger.info("Enabling BouncyCastle security.");
			Security.insertProviderAt(new BouncyCastleProvider(), 1);
			logger.info("Initializing the task manager.");
			TaskManager.init();
			logger.info("Updating the database schema, if necessary.");
			Database.update();
			logger.info("Initializing access to the database.");
			Database.init();
			logger.info("Loading the device drivers");
			DeviceDriver.refreshDrivers();
			//Tester.createDevices();
			//logger.info("Starting the TFTP server.");
			//TftpServer.init();
			logger.info("Starting the Syslog server.");
			SyslogServer.init();
			logger.info("Starting the SNMP v1/v2c trap receiver");
			SnmpTrapReceiver.init();
			logger.info("Starting the REST service");
			RestService.init();
			logger.info("Scheduling the existing tasks.");
			TaskManager.rescheduleAll();
			logger.warn("Netshot is started");

		}
		catch (Exception e) {
			System.err.println("NETSHOT FATAL ERROR: " + e.getMessage());
			e.printStackTrace();
			System.exit(1);
		}

	}

}
