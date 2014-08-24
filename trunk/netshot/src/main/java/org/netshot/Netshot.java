/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot;

import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Enumeration;
import java.util.Properties;
import java.util.logging.FileHandler;
import java.util.logging.Level;
import java.util.logging.SimpleFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.netshot.collector.SnmpTrapReceiver;
import org.netshot.collector.SyslogServer;
import org.netshot.collector.TftpServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

/**
 * The Class Netshot. Start point of theFolders of groups of devices application.
 */
public class Netshot extends Thread {

	/** Netshot version. */
	public static final String VERSION = "0.2.8";
	
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
	private static boolean initConfig() {
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
	private static boolean initLogging() {
		
		java.util.logging.Logger rootLogger = java.util.logging.Logger.getLogger("");
		String logFile = Netshot.getConfig("netshot.log.file", "/var/log/netshot/netshot.log");
		String logLevelCfg = Netshot.getConfig("netshot.log.level", "INFO");
		String logCountCfg = Netshot.getConfig("netshot.log.count", "5");
		
		int logCount = 5;
    try {
	    logCount = Integer.parseInt(logCountCfg);
    }
    catch (NumberFormatException e1) {
	    logger.error("Invalid number of log files (netshot.log.count config line). Using {}.", logCount);
    }
    

		Level logLevel = Level.INFO;
		try {
			logLevel = Level.parse(logLevelCfg);
    }
    catch (Exception e) {
    	logger.error("Invalid log level. Using {}.", logLevel);
    }
		
		if (logFile.equals("CONSOLE")) {
			logger.info("Will go on logging to the console");
			for (java.util.logging.Handler handler : rootLogger.getHandlers()) {
				handler.setLevel(logLevel);
			}
		}
		else {
			logger.info("Switching to file logging, into {}, level {}, rotation using {} files.", logFile, logLevel, logCount);
			
			try {
		    java.util.logging.Handler fileHandler = new FileHandler(logFile, 0, logCount);

		    fileHandler.setLevel(logLevel);
		    
		    // Switching to file logging
				for (java.util.logging.Handler handler : rootLogger.getHandlers()) {
					rootLogger.removeHandler(handler);
				}
				fileHandler.setFormatter(new SimpleFormatter());
				rootLogger.addHandler(fileHandler);
	    }
	    catch (Exception e) {
				logger.error(MarkerFactory.getMarker("FATAL"), "Unable to log into file {}. Exiting.", logFile);
				return false;
	    }
		}
		
    rootLogger.setLevel(logLevel);
    Pattern logSetting = Pattern.compile("^netshot\\.log\\.class\\.(?<class>.*)"); 
    Enumeration<?> propertyNames = Netshot.config.propertyNames();
    while (propertyNames.hasMoreElements()) {
    	String propertyName = (String) propertyNames.nextElement();
    	Matcher matcher = logSetting.matcher(propertyName);
    	if (matcher.find()) {
      	String propertyValue = Netshot.getConfig(propertyName);
    		String className = "org.netshot." + matcher.group("class");
    		java.util.logging.Logger classLogger = java.util.logging.Logger.getLogger(className);
    		try {
    			Level classLevel = Level.parse(propertyValue);
    			classLogger.setLevel(classLevel);
    			logger.info("Assigning level {} to class {}.", classLevel, className);
        }
        catch (Exception e) {
        	logger.error("Invalid log level for class {}.", className);
        }
    	}
    }
		System.setProperty("com.mchange.v2.log.MLog", "com.mchange.v2.log.jdk14logging.Jdk14MLog");
    
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
		if (!Netshot.initLogging()) {
			System.exit(1);
		}
		
		try {
			logger.info("Initializing the task manager.");
			NetshotTaskManager.init();
			logger.info("Initializing access to the database.");
			NetshotDatabase.init();
			logger.info("Starting the TFTP server.");
			TftpServer.init();
			logger.info("Starting the Syslog server.");
			SyslogServer.init();
			logger.info("Starting the SNMP v1/v2c trap receiver");
			SnmpTrapReceiver.init();
			logger.info("Starting the REST service");
			NetshotRestService.init();
			logger.info("Scheduling the existing tasks.");
			NetshotTaskManager.rescheduleAll();
			
		}
		catch (Exception e) {
			System.err.println("NETSHOT FATAL ERROR: " + e.getMessage());
			System.exit(1);
		}

	}

}
