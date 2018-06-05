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
package onl.netfishers.netshot;

import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Enumeration;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import onl.netfishers.netshot.collector.SnmpTrapReceiver;
import onl.netfishers.netshot.collector.SyslogServer;
import onl.netfishers.netshot.device.DeviceDriver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;
import org.slf4j.bridge.SLF4JBridgeHandler;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.ConsoleAppender;
import ch.qos.logback.core.OutputStreamAppender;
import ch.qos.logback.core.rolling.FixedWindowRollingPolicy;
import ch.qos.logback.core.rolling.RollingFileAppender;
import ch.qos.logback.core.rolling.SizeBasedTriggeringPolicy;

/**
 * The Class Netshot. Starting point of Netshot
 */
public class Netshot extends Thread {

	/** Netshot version. */
	public static final String VERSION = "0.8.1";

	/** The list of configuration files to look at, in sequence. */
	private static final String[] CONFIG_FILENAMES = new String[] {
		"netshot.conf", "/etc/netshot.conf" };

	/** The application configuration as retrieved from the configuration file. */
	private static Properties config;

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(Netshot.class);

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
		return config.getProperty(key, defaultValue);
	}

	/**
	 * Gets the config.
	 *
	 * @param key the key
	 * @return the config
	 */
	public static String getConfig(String key) {
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
				break;
			}
			catch (Exception e) {
				logger.error("Unable to read the configuration file {}.", fileName);
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
	protected static boolean initLogging() {
		// Redirect JUL to SLF4J
		SLF4JBridgeHandler.removeHandlersForRootLogger();
		SLF4JBridgeHandler.install();
		
		ch.qos.logback.classic.Logger rootLogger = (ch.qos.logback.classic.Logger)
				LoggerFactory.getLogger(ch.qos.logback.classic.Logger.ROOT_LOGGER_NAME);
		LoggerContext loggerContext = rootLogger.getLoggerContext();
		
		System.setProperty("org.jboss.logging.provider", "slf4j");
		

		String logFile = Netshot.getConfig("netshot.log.file", "netshot.log");
		String aaaLogFile = Netshot.getConfig("netshot.log.auditfile");
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
			logger.error("Invalid log level '{}'. Using {}.", logLevelCfg, logLevel);
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
				triggeringPolicy.setMaxFileSize(String.format("%dMB", logMaxSize));
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
		


		if (aaaLogFile != null) {
			try {
				ch.qos.logback.classic.Logger aaaLogger = (ch.qos.logback.classic.Logger)
						LoggerFactory.getLogger("AAA");
				LoggerContext aaaLoggerContext = aaaLogger.getLoggerContext();
				aaaLogger.setLevel(Level.ALL);
				RollingFileAppender<ILoggingEvent> aaaRfAppender = new RollingFileAppender<ILoggingEvent>();
				aaaRfAppender.setContext(aaaLoggerContext);
				aaaRfAppender.setFile(aaaLogFile);

				FixedWindowRollingPolicy fwRollingPolicy = new FixedWindowRollingPolicy();
				fwRollingPolicy.setContext(aaaLoggerContext);
				fwRollingPolicy.setFileNamePattern(aaaLogFile + ".%i.gz");
				fwRollingPolicy.setMinIndex(1);
				fwRollingPolicy.setMaxIndex(logCount);
				fwRollingPolicy.setParent(aaaRfAppender);
				fwRollingPolicy.start();

				SizeBasedTriggeringPolicy<ILoggingEvent> triggeringPolicy = new 
						SizeBasedTriggeringPolicy<ILoggingEvent>();
				triggeringPolicy.setMaxFileSize(String.format("%dMB", logMaxSize));
				triggeringPolicy.start();

				aaaRfAppender.setRollingPolicy(fwRollingPolicy);
				aaaRfAppender.setTriggeringPolicy(triggeringPolicy);

				PatternLayoutEncoder aaaEncoder = new PatternLayoutEncoder();
				aaaEncoder.setContext(loggerContext);
				aaaEncoder.setPattern("%d %-5level [%thread] %logger{0}: %msg%n");
				aaaEncoder.start();
				aaaRfAppender.setEncoder(aaaEncoder);
				aaaRfAppender.start();
				aaaLogger.addAppender(aaaRfAppender);
			}
			catch (Exception e) {
				logger.error("Unable to log AAA data into file {}. Exiting.", aaaLogFile, e);
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
		if (!Netshot.initLogging()) {
			System.exit(1);
		}

		try {
			logger.info("Initializing the task manager.");
			TaskManager.init();
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

		}
		catch (Exception e) {
			System.err.println("NETSHOT FATAL ERROR: " + e.getMessage());
			System.exit(1);
		}

	}

}
