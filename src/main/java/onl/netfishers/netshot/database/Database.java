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
package onl.netfishers.netshot.database;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLDecoder;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.TreeSet;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import jakarta.persistence.Entity;
import javax.sql.DataSource;

import com.mchange.v2.c3p0.C3P0Registry;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.aaa.ApiToken;
import onl.netfishers.netshot.aaa.UiUser;
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
import onl.netfishers.netshot.device.attribute.ConfigBinaryFileAttribute;
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
import onl.netfishers.netshot.hooks.Hook;
import onl.netfishers.netshot.hooks.HookTrigger;
import onl.netfishers.netshot.hooks.WebHook;
import onl.netfishers.netshot.work.DebugLog;
import onl.netfishers.netshot.work.Task;
import onl.netfishers.netshot.work.tasks.DeviceJsScript;

import org.hibernate.Hibernate;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.boot.Metadata;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.SessionFactoryBuilder;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.cfg.AvailableSettings;
import org.hibernate.proxy.HibernateProxy;
import org.hibernate.service.ServiceRegistry;
import org.slf4j.MarkerFactory;

import liquibase.UpdateSummaryOutputEnum;
import liquibase.command.CommandScope;
import liquibase.command.core.UpdateCommandStep;
import liquibase.command.core.helpers.DbUrlConnectionArgumentsCommandStep;
import liquibase.command.core.helpers.ShowSummaryArgument;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import lombok.extern.slf4j.Slf4j;

/**
 * The Database class, utilities to access the database.
 */
@Slf4j
public class Database {

	/** The session factory. */
	private static SessionFactory sessionFactory;

	/** The service registry. */
	private static ServiceRegistry serviceRegistry;

	/**
	 * List classes in a given package.
	 *
	 * @param packageName
	 *                      the package name
	 * @return the list
	 * @throws ClassNotFoundException
	 *                                  the class not found exception
	 * @throws IOException
	 *                                  Signals that an I/O exception has occurred.
	 */
	public static List<Class<?>> listClassesInPackage(String packageName) throws ClassNotFoundException, IOException {
		String path = packageName.replace('.', '/');
		Enumeration<URL> resources = ClassLoader.getSystemResources(path);
		List<String> dirs = new ArrayList<>();
		while (resources.hasMoreElements()) {
			URL resource = resources.nextElement();
			dirs.add(URLDecoder.decode(resource.getFile(), "UTF-8"));
		}
		TreeSet<String> classes = new TreeSet<>();
		for (String directory : dirs) {
			classes.addAll(findClasses(directory, packageName));
		}
		ArrayList<Class<?>> classList = new ArrayList<>();
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
	 */
	private static TreeSet<String> findClasses(String path, String packageName)
			throws IOException {
		TreeSet<String> classes = new TreeSet<>();
		if (path.startsWith("file:") && path.contains("!")) {
			String[] split = path.split("!");
			try {
				URL jar = new URI(split[0]).toURL();
				
				ZipInputStream zip = new ZipInputStream(jar.openStream());
				ZipEntry entry;
				while ((entry = zip.getNextEntry()) != null) {
					if (entry.getName().endsWith(".class")) {
						String className = entry.getName().replaceAll("[$].*", "").replaceAll("[.]class", "").replace('/', '.');
						if (className.startsWith(packageName)) {
							classes.add(className);
						}
					}
				}
			}
			catch (URISyntaxException e) {
				log.error("Unable to parse path as URI", e);
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
				classes.addAll(findClasses(file.getAbsolutePath(), packageName + "." + file.getName()));
			}
			else if (file.getName().endsWith(".class")) {
				String className = packageName + '.' + file.getName().substring(0, file.getName().length() - 6);
				classes.add(className);
			}
		}
		return classes;
	}

	/**
	 * Update the database schema (to be run at startup).
	 * @throws Exception 
	 */
	public static void update() throws Exception {
		try {
			Class.forName("org.postgresql.Driver");
			try (Connection connection = Database.getConnection(false)) {
				liquibase.database.Database database = DatabaseFactory.getInstance()
						.findCorrectDatabaseImplementation(new JdbcConnection(connection));
				new CommandScope(UpdateCommandStep.COMMAND_NAME)
						.addArgumentValue(DbUrlConnectionArgumentsCommandStep.DATABASE_ARG, database)
						.addArgumentValue(UpdateCommandStep.CHANGELOG_FILE_ARG, "migration/netshot0.xml")
						.addArgumentValue(ShowSummaryArgument.SHOW_SUMMARY_OUTPUT, UpdateSummaryOutputEnum.LOG)
						.execute();
			}
		}
		catch (Exception e) {
			log.error("Unable to perform initial schema update", e);
			throw e;
		}
	}

	/**
	 * Initializes the database access, with Hibernate.
	 */
	public static void init() {
		try {
			Properties serviceProperties = new Properties();
			serviceProperties.setProperty(AvailableSettings.TRANSACTION_COORDINATOR_STRATEGY, "jdbc");
			serviceProperties.setProperty(AvailableSettings.CURRENT_SESSION_CONTEXT_CLASS, "thread");
			// serviceProperties.setProperty(AvailableSettings.HBM2DDL_AUTO, "update"); // "update" or "validate" or ""
			// serviceProperties.setProperty(AvailableSettings.SHOW_SQL, "true");
			serviceProperties.setProperty(AvailableSettings.FORMAT_SQL, "true");
			// Dates/times stored in UTC in the DB, without timezone, up to Java to convert to server local time
			serviceProperties.setProperty("hibernate.jdbc.time_zone", "UTC");

			// Use the custom Multi Tenant connection provider (to handle read vs read-write connections)
			final CustomConnectionProvider connectionProvider = new CustomConnectionProvider();


			final Map<String, Object> connectionProviderProperties = new HashMap<>();
			connectionProviderProperties.put("hibernate.connection.driver_class", getDriverClass());
			connectionProviderProperties.put("hibernate.connection.username", getUsername());
			connectionProviderProperties.put("hibernate.connection.password", getPassword());

			connectionProviderProperties.put(AvailableSettings.JAKARTA_JDBC_URL, getUrl());
			connectionProvider.registerConnectionProvider(TenantIdentifier.READ_WRITE, connectionProviderProperties, true);

			String readDbUrl = getReadUrl();
			if (readDbUrl != null) {
				connectionProviderProperties.put(AvailableSettings.JAKARTA_JDBC_URL, readDbUrl);
				connectionProvider.registerConnectionProvider(TenantIdentifier.READ_ONLY, connectionProviderProperties, true);
			}

			serviceProperties.put(AvailableSettings.MULTI_TENANT_CONNECTION_PROVIDER, connectionProvider);
			if (getDriverClass().contains("postgresql")) {
				serviceProperties.setProperty(AvailableSettings.DIALECT, "onl.netfishers.netshot.database.CustomPostgreSQLDialect");
			}
			else if (getDriverClass().contains("mysql")) {
				serviceProperties.setProperty(AvailableSettings.DIALECT, "onl.netfishers.netshot.database.CustomMySQLDialect");
			}
			else if (getDriverClass().contains("h2")) {
				serviceProperties.setProperty(AvailableSettings.DIALECT, "onl.netfishers.netshot.database.CustomH2Dialect");
			}
			serviceRegistry = new StandardServiceRegistryBuilder().applySettings(serviceProperties).build();

			MetadataSources sources = new MetadataSources(serviceRegistry)
				.addAnnotatedClass(Device.class)
				.addAnnotatedClass(DeviceGroup.class)
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
				.addAnnotatedClass(ConfigBinaryFileAttribute.class)
				.addAnnotatedClass(LongTextConfiguration.class)
				.addAnnotatedClass(StaticDeviceGroup.class)
				.addAnnotatedClass(DynamicDeviceGroup.class)
				.addAnnotatedClass(Module.class)
				.addAnnotatedClass(Domain.class)
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
				.addAnnotatedClass(Policy.class)
				.addAnnotatedClass(Rule.class)
				.addAnnotatedClass(Task.class)
				.addAnnotatedClass(DebugLog.class)
				.addAnnotatedClass(Exemption.class)
				.addAnnotatedClass(Exemption.Key.class)
				.addAnnotatedClass(CheckResult.class)
				.addAnnotatedClass(CheckResult.Key.class)
				.addAnnotatedClass(SoftwareRule.class)
				.addAnnotatedClass(HardwareRule.class)
				.addAnnotatedClass(DeviceJsScript.class)
				.addAnnotatedClass(Diagnostic.class)
				.addAnnotatedClass(DiagnosticResult.class)
				.addAnnotatedClass(DiagnosticBinaryResult.class)
				.addAnnotatedClass(DiagnosticNumericResult.class)
				.addAnnotatedClass(DiagnosticLongTextResult.class)
				.addAnnotatedClass(DiagnosticTextResult.class)
				.addAnnotatedClass(UiUser.class)
				.addAnnotatedClass(ApiToken.class)
				.addAnnotatedClass(Hook.class)
				.addAnnotatedClass(WebHook.class)
				.addAnnotatedClass(HookTrigger.class);
			for (Class<?> clazz : Task.getTaskClasses()) {
				log.info("Registering task class " + clazz.getName());
				sources.addAnnotatedClass(clazz);
			}
			for (Class<?> clazz : Rule.getRuleClasses()) {
				sources.addAnnotatedClass(clazz);
				for (Class<?> subClass : clazz.getClasses()) {
					if (subClass.getAnnotation(Entity.class) != null) {
						sources.addAnnotatedClass(subClass);
					}
				}
			}
			for (Class<?> clazz : Diagnostic.getDiagnosticClasses()) {
				sources.addAnnotatedClass(clazz);
			}

			Metadata metadata = sources.getMetadataBuilder()
				.applyImplicitNamingStrategy(new ImprovedImplicitNamingStrategy())
				.applyPhysicalNamingStrategy(new ImprovedPhysicalNamingStrategy())
				.build();

			SessionFactoryBuilder sessionFactoryBuilder = metadata.getSessionFactoryBuilder();
			sessionFactoryBuilder.applyInterceptor(new DatabaseInterceptor());
			sessionFactory = sessionFactoryBuilder.build();

		}
		catch (HibernateException e) {
			log.error(MarkerFactory.getMarker("FATAL"), "Unable to instantiate Hibernate", e);
			throw new RuntimeException("Unable to instantiate Hibernate, see logs for more details");
		}
	}


	/**
	 * Retrieve the configured driver class.
	 * 
	 * @return the configured driver class
	 */
	private static String getDriverClass() {
		return Netshot.getConfig("netshot.db.driver_class", "org.postgresql.Driver");
	}

	/**
	 * Retrieve the DB URL.
	 * 
	 * @return the configured DB URL.
	 */
	private static String getUrl() {
		return Netshot.getConfig("netshot.db.url", "jdbc:postgresql://localhost:5432/netshot01?sslmode=disable");
	}

	/**
	 * Retrieve the read-only DB URL.
	 * 
	 * @return the configured DB URL.
	 */
	private static String getReadUrl() {
		return Netshot.getConfig("netshot.db.readurl");
	}

	/**
	 * Retrieve the DB username.
	 * 
	 * @return the configured DB username
	 */
	private static String getUsername() {
		return Netshot.getConfig("netshot.db.username", "netshot");
	}

	/**
	 * Retrieve the DB password.
	 * 
	 * @return the configured DB password
	 */
	private static String getPassword() {
		return Netshot.getConfig("netshot.db.password", "netshot");
	}

	/**
	 * Gets the session.
	 *
	 * @return the session
	 * @throws HibernateException the hibernate exception
	 */
	public static Session getSession() throws HibernateException {
		return getSession(false);
	}

	/**
	 * Gets the session.
	 *
	 * @return the session
	 * @throws HibernateException the hibernate exception
	 */
	public static Session getSession(boolean readOnly) throws HibernateException {
		return sessionFactory.withOptions().tenantIdentifier(
			readOnly ? TenantIdentifier.READ_ONLY : TenantIdentifier.READ_WRITE).openSession();
	}

	/**
	 * Retrieves a raw SQL connection.
	 * 
	 * @return the connection
	 * @throws SQLException
	 */
	public static Connection getConnection() throws SQLException {
		final DataSource dataSource = C3P0Registry.pooledDataSourceByName(TenantIdentifier.READ_WRITE.getSourceName());
		return dataSource.getConnection();
	}

	/**
	 * Retrieves a raw SQL connection.
	 * @param pooled = whether to take the connection from the (C3P0) pool or not
	 *                  (pooled connection expire with C3P0 timeout mechanisms).
	 * @return the connection
	 * @throws SQLException
	 */
	public static Connection getConnection(boolean pooled) throws SQLException {
		if (pooled) {
			return Database.getConnection();
		}
		return DriverManager.getConnection(getUrl(), getUsername(), getPassword());
	} 

	/**
	 * Gets the real object from the Hibernate proxy.
	 *
	 * @param <T>
	 *                 the generic type
	 * @param entity
	 *                 the entity
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
