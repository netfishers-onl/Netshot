/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.TreeSet;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.persistence.Entity;

import org.hibernate.Hibernate;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.cfg.Configuration;
import org.hibernate.cfg.ImprovedNamingStrategy;
import org.hibernate.proxy.HibernateProxy;
import org.hibernate.service.ServiceRegistry;
import org.hibernate.service.ServiceRegistryBuilder;
import org.netshot.aaa.User;
import org.netshot.compliance.CheckResult;
import org.netshot.compliance.Exemption;
import org.netshot.compliance.HardwareRule;
import org.netshot.compliance.Policy;
import org.netshot.compliance.Rule;
import org.netshot.compliance.SoftwareRule;
import org.netshot.device.Config;
import org.netshot.device.Device;
import org.netshot.device.DeviceGroup;
import org.netshot.device.Domain;
import org.netshot.device.DynamicDeviceGroup;
import org.netshot.device.Module;
import org.netshot.device.Network4Address;
import org.netshot.device.Network6Address;
import org.netshot.device.NetworkAddress;
import org.netshot.device.NetworkInterface;
import org.netshot.device.PhysicalAddress;
import org.netshot.device.StaticDeviceGroup;
import org.netshot.device.Config.LongTextConfiguration;
import org.netshot.device.credentials.DeviceSnmpv1Community;
import org.netshot.device.credentials.DeviceSnmpv2cCommunity;
import org.netshot.device.credentials.DeviceSshAccount;
import org.netshot.device.credentials.DeviceTelnetAccount;
import org.netshot.work.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

/**
 * The NetshotDatabase class, utilities to access the database.
 */
public class NetshotDatabase {
	
	/** The session factory. */
	private static SessionFactory sessionFactory;
	
	/** The service registry. */
	private static ServiceRegistry serviceRegistry;
	
	/** The configuration. */
	private static Configuration configuration;

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(NetshotDatabase.class);
	
	/**
	 * List classes in a given package.
	 *
	 * @param packageName the package name
	 * @return the list
	 * @throws ClassNotFoundException the class not found exception
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public static List<Class<?>> listClassesInPackage(String packageName)
	    throws ClassNotFoundException, IOException {
		String path = packageName.replace('.', '/');
		Enumeration<URL> resources = ClassLoader.getSystemResources(path);
		List<String> dirs = new ArrayList<String>();
		while (resources.hasMoreElements()) {
			URL resource = resources.nextElement();
			dirs.add(URLDecoder.decode(resource.getFile(), "UTF-8"));
		}
		TreeSet<String> classes = new TreeSet<String>();
		for (String directory : dirs) {
			classes.addAll(findClasses(directory, packageName));
		}
		ArrayList<Class<?>> classList = new ArrayList<Class<?>>();
		for (String clazz : classes) {
			classList.add(Class.forName(clazz));
		}
		return classList;
	}

	/**
	 * Find classes with a path.
	 *
	 * @param path the path
	 * @param packageName the package name
	 * @return the tree set
	 * @throws MalformedURLException the malformed url exception
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	private static TreeSet<String> findClasses(String path, String packageName)
	    throws MalformedURLException, IOException {
		TreeSet<String> classes = new TreeSet<String>();
		if (path.startsWith("file:") && path.contains("!")) {
			String[] split = path.split("!");
			URL jar = new URL(split[0]);
			ZipInputStream zip = new ZipInputStream(jar.openStream());
			ZipEntry entry;
			while ((entry = zip.getNextEntry()) != null) {
				if (entry.getName().endsWith(".class")) {
					String className = entry.getName().replaceAll("[$].*", "")
					    .replaceAll("[.]class", "").replace('/', '.');
					if (className.startsWith(packageName)) {
						classes.add(className);
					}
				}
			}
		}
		File dir = new File(path);
		if (!dir.exists()) {
			return classes;
		}
		File[] files = dir.listFiles();
		for (File file : files) {
			if (file.isDirectory()) {
				assert !file.getName().contains(".");
				classes.addAll(findClasses(file.getAbsolutePath(), packageName + "."
				    + file.getName()));
			}
			else if (file.getName().endsWith(".class")) {
				String className = packageName + '.'
				    + file.getName().substring(0, file.getName().length() - 6);
				classes.add(className);
			}
		}
		return classes;
	}

	/**
	 * Initializes the database access, with Hibernate.
	 */
	public static void init() {
		try {

			configuration = new Configuration();

			configuration
			    .setProperty(
			        "hibernate.connection.driver_class",
			        Netshot.getConfig("netshot.db.driver_class",
			            "com.mysql.jdbc.Driver"))
			    .setProperty(
			        "hibernate.connection.url",
			        Netshot.getConfig("netshot.db.url",
			            "jdbc:mysql://localhost/netshot01"))
			    .setProperty("hibernate.connection.username",
			        Netshot.getConfig("netshot.db.username", "netshot"))
			    .setProperty("hibernate.connection.password",
			        Netshot.getConfig("netshot.db.password", "netshot"))
			    .setProperty("hibernate.c3p0.min_size", "5")
			    .setProperty("hibernate.c3p0.max_size", "30")
			    .setProperty("hibernate.c3p0.timeout", "1800")
			    .setProperty("hibernate.c3p0.max_statements", "50")
			    .setProperty("hibernate.c3p0.unreturnedConnectionTimeout", "1800")
			    .setProperty("hibernate.c3p0.debugUnreturnedConnectionStackTraces", "true");
			    

			configuration
			    .setProperty("factory_class",
			        "org.hibernate.transaction.JDBCTransactionFactory")
			    .setProperty("current_session_context_class", "thread")
			    .setProperty("hibernate.hbm2ddl.auto", "update")
			    //.setProperty("hibernate.show_sql", "true")
			    .addAnnotatedClass(Device.class).addAnnotatedClass(DeviceGroup.class)
			    .addAnnotatedClass(Config.class)
			    .addAnnotatedClass(LongTextConfiguration.class)
			    .addAnnotatedClass(StaticDeviceGroup.class)
			    .addAnnotatedClass(DynamicDeviceGroup.class)
			    .addAnnotatedClass(Module.class).addAnnotatedClass(Domain.class)
			    .addAnnotatedClass(PhysicalAddress.class)
			    .addAnnotatedClass(NetworkAddress.class)
			    .addAnnotatedClass(Network4Address.class)
			    .addAnnotatedClass(Network6Address.class)
			    .addAnnotatedClass(NetworkInterface.class)
			    .addAnnotatedClass(DeviceSnmpv1Community.class)
			    .addAnnotatedClass(DeviceSnmpv2cCommunity.class)
			    .addAnnotatedClass(DeviceSshAccount.class)
			    .addAnnotatedClass(DeviceTelnetAccount.class)
			    .addAnnotatedClass(Policy.class).addAnnotatedClass(Rule.class)
			    .addAnnotatedClass(Task.class)
			    .addAnnotatedClass(Exemption.class)
			    .addAnnotatedClass(Exemption.Key.class)
			    .addAnnotatedClass(CheckResult.class)
			    .addAnnotatedClass(CheckResult.Key.class)
			    .addAnnotatedClass(SoftwareRule.class)
			    .addAnnotatedClass(HardwareRule.class)
			    .addAnnotatedClass(User.class);

			for (Class<?> clazz : Device.getDeviceClasses()) {
				logger.info("Registering device class " + clazz.getName());
				configuration.addAnnotatedClass(clazz);
				for (Class<?> subClass : clazz.getClasses()) {
					if (Config.class.isAssignableFrom(subClass)) {
						configuration.addAnnotatedClass(subClass);
					}
				}
			}
			for (Class<?> clazz : Config.getConfigClasses()) {
				logger.info("Registering config class " + clazz.getName());
				configuration.addAnnotatedClass(clazz);
			}
			for (Class<?> clazz : Task.getTaskClasses()) {
				logger.info("Registering task class " + clazz.getName());
				configuration.addAnnotatedClass(clazz);
			}
			for (Class<?> clazz : Rule.getRuleClasses()) {
				configuration.addAnnotatedClass(clazz);
				for (Class<?> subClass : clazz.getClasses()) {
					if (subClass.getAnnotation(Entity.class) != null) {
						configuration.addAnnotatedClass(subClass);
					}
				}
			}

			configuration.setNamingStrategy(new ImprovedNamingStrategy());

			serviceRegistry = new ServiceRegistryBuilder().applySettings(
			    configuration.getProperties()).buildServiceRegistry();
			sessionFactory = configuration.buildSessionFactory(serviceRegistry);

		}
		catch (HibernateException e) {
			logger.error(MarkerFactory.getMarker("FATAL"),
			    "Unable to instantiate Hibernate", e);
			throw new RuntimeException(
			    "Unable to instantiate Hibernate, see logs for more details");
		}
	}

	/**
	 * Gets the session.
	 *
	 * @return the session
	 * @throws HibernateException the hibernate exception
	 */
	public static Session getSession() throws HibernateException {
		return sessionFactory.openSession();
	}
	
	/**
	 * Gets the real object from the Hibernate proxy.
	 *
	 * @param <T> the generic type
	 * @param entity the entity
	 * @return the t
	 */
	@SuppressWarnings("unchecked")
  public static <T> T unproxy(T entity) {
    if (entity == null) {
        return null;
    }
    if (entity instanceof HibernateProxy) {
        Hibernate.initialize(entity);
        entity = (T) ((HibernateProxy) entity).getHibernateLazyInitializer().getImplementation();
    }
    return entity;
	}

}
