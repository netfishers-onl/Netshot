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

import java.io.File;
import java.io.IOException;
import java.io.Serializable;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLDecoder;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.Enumeration;
import java.util.List;
import java.util.TreeSet;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.persistence.Entity;

import onl.netfishers.netshot.aaa.User;
import onl.netfishers.netshot.compliance.CheckResult;
import onl.netfishers.netshot.compliance.Exemption;
import onl.netfishers.netshot.compliance.HardwareRule;
import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.Rule;
import onl.netfishers.netshot.compliance.SoftwareRule;
import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.device.Domain;
import onl.netfishers.netshot.device.DynamicDeviceGroup;
import onl.netfishers.netshot.device.Module;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.device.Network6Address;
import onl.netfishers.netshot.device.NetworkAddress;
import onl.netfishers.netshot.device.NetworkInterface;
import onl.netfishers.netshot.device.PhysicalAddress;
import onl.netfishers.netshot.device.StaticDeviceGroup;
import onl.netfishers.netshot.device.attribute.ConfigAttribute;
import onl.netfishers.netshot.device.attribute.ConfigBinaryAttribute;
import onl.netfishers.netshot.device.attribute.ConfigLongTextAttribute;
import onl.netfishers.netshot.device.attribute.ConfigNumericAttribute;
import onl.netfishers.netshot.device.attribute.ConfigTextAttribute;
import onl.netfishers.netshot.device.attribute.DeviceAttribute;
import onl.netfishers.netshot.device.attribute.DeviceBinaryAttribute;
import onl.netfishers.netshot.device.attribute.DeviceLongTextAttribute;
import onl.netfishers.netshot.device.attribute.DeviceNumericAttribute;
import onl.netfishers.netshot.device.attribute.DeviceTextAttribute;
import onl.netfishers.netshot.device.attribute.LongTextConfiguration;
import onl.netfishers.netshot.device.credentials.DeviceSnmpv1Community;
import onl.netfishers.netshot.device.credentials.DeviceSnmpv2cCommunity;
import onl.netfishers.netshot.device.credentials.DeviceSnmpv3Community;
import onl.netfishers.netshot.device.credentials.DeviceSshAccount;
import onl.netfishers.netshot.device.credentials.DeviceSshKeyAccount;
import onl.netfishers.netshot.device.credentials.DeviceTelnetAccount;
import onl.netfishers.netshot.diagnostic.Diagnostic;
import onl.netfishers.netshot.diagnostic.DiagnosticBinaryResult;
import onl.netfishers.netshot.diagnostic.DiagnosticLongTextResult;
import onl.netfishers.netshot.diagnostic.DiagnosticNumericResult;
import onl.netfishers.netshot.diagnostic.DiagnosticResult;
import onl.netfishers.netshot.diagnostic.DiagnosticTextResult;
import onl.netfishers.netshot.diagnostic.SimpleDiagnostic;
import onl.netfishers.netshot.work.DebugLog;
import onl.netfishers.netshot.work.Task;
import onl.netfishers.netshot.work.tasks.DeviceJsScript;

import org.apache.commons.lang3.ArrayUtils;
import org.hibernate.EmptyInterceptor;
import org.hibernate.Hibernate;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.cfg.Configuration;
import org.hibernate.cfg.ImprovedNamingStrategy;
import org.hibernate.proxy.HibernateProxy;
import org.hibernate.service.ServiceRegistry;
import org.hibernate.type.Type;
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.hibernate4.encryptor.HibernatePBEEncryptorRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.exception.LiquibaseException;
import liquibase.resource.ClassLoaderResourceAccessor;

/**
 * The Database class, utilities to access the database.
 */
public class Database {

	/** The session factory. */
	private static SessionFactory sessionFactory;

	/** The service registry. */
	private static ServiceRegistry serviceRegistry;

	/** The configuration. */
	private static Configuration configuration;

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(Database.class);
	
	
	private static class DatabaseInterceptor extends EmptyInterceptor {

		public boolean onFlushDirty(Object entity, Serializable id, Object[] currentState, 
				Object[] previousState, String[] propertyNames, Type[] types) {
			int indexOf = ArrayUtils.indexOf(propertyNames, "changeDate");
			if (indexOf != ArrayUtils.INDEX_NOT_FOUND) {
				currentState[indexOf] = new Date(1000 * (System.currentTimeMillis() / 1000));
				return true;
			}
			return false;
		}

		public boolean onSave(Object entity, Serializable id, Object[] state, 
				String[] propertyNames, Type[] types) {
			int indexOf = ArrayUtils.indexOf(propertyNames, "changeDate");
			if (indexOf != ArrayUtils.INDEX_NOT_FOUND) {
				if (state[indexOf] == null) 
				state[indexOf] = new Date(1000 * (System.currentTimeMillis() / 1000));
				return true;
			}
			return false;
		}

		private static final long serialVersionUID = 5897665908529047371L;
		
	}

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
	 * Retrieve the configured driver class.
	 * @return the configured driver class
	 */
	private static String getDriverClass() {
		return Netshot.getConfig("netshot.db.driver_class", "com.mysql.jdbc.Driver");
	}
	
	/**
	 * Retrieve the DB URL.
	 * @return the configured DB URL.
	 */
	private static String getUrl() {
		return Netshot.getConfig("netshot.db.url", "jdbc:mysql://localhost/netshot01");
	}
	
	/**
	 * Retrieve the DB username.
	 * @return the configured DB username
	 */
	private static String getUsername() {
		return Netshot.getConfig("netshot.db.username", "netshot");
	}
	
	/**
	 * Retrieve the DB password.
	 * @return the configured DB password
	 */
	private static String getPassword() {
		return Netshot.getConfig("netshot.db.password", "netshot");
	}

	/**
	 * Update the database schema (to be run at startup).
	 */
	public static void update() {
		try {
			Connection connection = DriverManager.getConnection(getUrl(), getUsername(), getPassword());
			liquibase.database.Database database = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(connection));
			Liquibase liquibase = new Liquibase("migration/netshot0.xml", new ClassLoaderResourceAccessor(), database);
			liquibase.update(new Contexts(), new LabelExpression());
		}
		catch (SQLException | LiquibaseException e) {
			logger.error(MarkerFactory.getMarker("FATAL"), "Unable to connect to the database (for the initial schema update)", e);
			throw new RuntimeException("Unable to connect to the database, see logs for more details");
		}
	}
	
	/**
	 * Initializes the database access, with Hibernate.
	 */
	public static void init() {
		try {

			configuration = new Configuration();

			configuration
				.setProperty("hibernate.connection.driver_class", getDriverClass())
				.setProperty("hibernate.connection.url", getUrl())
				.setProperty("hibernate.connection.username", getUsername())
				.setProperty("hibernate.connection.password", getPassword())
				.setProperty("hibernate.c3p0.min_size", "5")
				.setProperty("hibernate.c3p0.max_size", "30")
				.setProperty("hibernate.c3p0.timeout", "1800")
				.setProperty("hibernate.c3p0.max_statements", "50")
				.setProperty("hibernate.c3p0.unreturnedConnectionTimeout", "1800")
				.setProperty("hibernate.c3p0.debugUnreturnedConnectionStackTraces", "true");

			
			StandardPBEStringEncryptor credentialEncryptor = new StandardPBEStringEncryptor();
			String cryptPassword = Netshot.getConfig("netshot.db.encryptionpassword", null);
			if (cryptPassword == null) {
				cryptPassword = Netshot.getConfig("netshot.db.encryptionPassword", "NETSHOT"); // Historical reasons
			}
			credentialEncryptor.setPassword(cryptPassword);
			HibernatePBEEncryptorRegistry encryptorRegistry = HibernatePBEEncryptorRegistry.getInstance();
			encryptorRegistry.registerPBEStringEncryptor("credentialEncryptor", credentialEncryptor);

			configuration
				.setProperty("factory_class", "org.hibernate.transaction.JDBCTransactionFactory")
				.setProperty("current_session_context_class", "thread")
				.setProperty("hibernate.hbm2ddl.auto", "update") // "update" or ""
				//.setProperty("hibernate.show_sql", "true")
				.addAnnotatedClass(Device.class).addAnnotatedClass(DeviceGroup.class)
				.addAnnotatedClass(Config.class)
				.addAnnotatedClass(DeviceAttribute.class)
				.addAnnotatedClass(DeviceNumericAttribute.class)
				.addAnnotatedClass(DeviceTextAttribute.class)
				.addAnnotatedClass(DeviceLongTextAttribute.class)
				.addAnnotatedClass(DeviceBinaryAttribute.class)
				.addAnnotatedClass(ConfigAttribute.class)
				.addAnnotatedClass(ConfigNumericAttribute.class)
				.addAnnotatedClass(ConfigTextAttribute.class)
				.addAnnotatedClass(ConfigLongTextAttribute.class)
				.addAnnotatedClass(ConfigBinaryAttribute.class)
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
				.addAnnotatedClass(DeviceSnmpv3Community.class)
				.addAnnotatedClass(DeviceSshAccount.class)
				.addAnnotatedClass(DeviceSshKeyAccount.class)
				.addAnnotatedClass(DeviceTelnetAccount.class)
				.addAnnotatedClass(Policy.class).addAnnotatedClass(Rule.class)
				.addAnnotatedClass(Task.class).addAnnotatedClass(DebugLog.class)
				.addAnnotatedClass(Exemption.class)
				.addAnnotatedClass(Exemption.Key.class)
				.addAnnotatedClass(CheckResult.class)
				.addAnnotatedClass(CheckResult.Key.class)
				.addAnnotatedClass(SoftwareRule.class)
				.addAnnotatedClass(HardwareRule.class)
				.addAnnotatedClass(DeviceJsScript.class)
				.addAnnotatedClass(Diagnostic.class)
				.addAnnotatedClass(SimpleDiagnostic.class)
				.addAnnotatedClass(DiagnosticResult.class)
				.addAnnotatedClass(DiagnosticBinaryResult.class)
				.addAnnotatedClass(DiagnosticNumericResult.class)
				.addAnnotatedClass(DiagnosticLongTextResult.class)
				.addAnnotatedClass(DiagnosticTextResult.class)
				.addAnnotatedClass(User.class);

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
			
			configuration.setInterceptor(new DatabaseInterceptor());

			serviceRegistry = new StandardServiceRegistryBuilder().applySettings(
					configuration.getProperties()).build();
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
