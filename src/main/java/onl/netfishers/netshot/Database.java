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

import java.io.File;
import java.io.IOException;
import java.io.Serializable;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLDecoder;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.ArrayList;
import java.util.Date;
import java.util.Enumeration;
import java.util.List;
import java.util.TreeSet;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.persistence.Entity;

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

import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.EmptyInterceptor;
import org.hibernate.Hibernate;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.boot.model.naming.EntityNaming;
import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.boot.model.naming.ImplicitAnyDiscriminatorColumnNameSource;
import org.hibernate.boot.model.naming.ImplicitAnyKeyColumnNameSource;
import org.hibernate.boot.model.naming.ImplicitBasicColumnNameSource;
import org.hibernate.boot.model.naming.ImplicitCollectionTableNameSource;
import org.hibernate.boot.model.naming.ImplicitDiscriminatorColumnNameSource;
import org.hibernate.boot.model.naming.ImplicitEntityNameSource;
import org.hibernate.boot.model.naming.ImplicitForeignKeyNameSource;
import org.hibernate.boot.model.naming.ImplicitIdentifierColumnNameSource;
import org.hibernate.boot.model.naming.ImplicitIndexColumnNameSource;
import org.hibernate.boot.model.naming.ImplicitIndexNameSource;
import org.hibernate.boot.model.naming.ImplicitJoinColumnNameSource;
import org.hibernate.boot.model.naming.ImplicitJoinTableNameSource;
import org.hibernate.boot.model.naming.ImplicitMapKeyColumnNameSource;
import org.hibernate.boot.model.naming.ImplicitNamingStrategy;
import org.hibernate.boot.model.naming.ImplicitPrimaryKeyJoinColumnNameSource;
import org.hibernate.boot.model.naming.ImplicitTenantIdColumnNameSource;
import org.hibernate.boot.model.naming.ImplicitUniqueKeyNameSource;
import org.hibernate.boot.model.naming.NamingHelper;
import org.hibernate.boot.model.naming.PhysicalNamingStrategy;
import org.hibernate.boot.model.source.spi.AttributePath;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.boot.spi.MetadataBuildingContext;
import org.hibernate.cfg.Configuration;
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment;
import org.hibernate.internal.util.StringHelper;
import org.hibernate.proxy.HibernateProxy;
import org.hibernate.service.ServiceRegistry;
import org.hibernate.type.Type;
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.hibernate5.encryptor.HibernatePBEEncryptorRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
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
	final private static Logger logger = LoggerFactory.getLogger(Database.class);

	private static class DatabaseInterceptor extends EmptyInterceptor {

		@Override
		public boolean onFlushDirty(Object entity, Serializable id, Object[] currentState, Object[] previousState,
				String[] propertyNames, Type[] types) {
			int indexOf = ArrayUtils.indexOf(propertyNames, "changeDate");
			if (indexOf != ArrayUtils.INDEX_NOT_FOUND) {
				currentState[indexOf] = new Date(1000 * (System.currentTimeMillis() / 1000));
				return true;
			}
			return false;
		}

		@Override
		public boolean onSave(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
			int indexOf = ArrayUtils.indexOf(propertyNames, "changeDate");
			if (indexOf != ArrayUtils.INDEX_NOT_FOUND) {
				if (state[indexOf] == null) state[indexOf] = new Date(1000 * (System.currentTimeMillis() / 1000));
				return true;
			}
			return false;
		}

		private static final long serialVersionUID = 5897665908529047371L;

	}

	static public class ImprovedPhysicalNamingStrategy implements PhysicalNamingStrategy {

		@Override
		public Identifier toPhysicalCatalogName(Identifier identifier, JdbcEnvironment jdbcEnv) {
			return convert(identifier);
		}

		@Override
		public Identifier toPhysicalColumnName(Identifier identifier, JdbcEnvironment jdbcEnv) {
			return convert(identifier);
		}

		@Override
		public Identifier toPhysicalSchemaName(Identifier identifier, JdbcEnvironment jdbcEnv) {
			return convert(identifier);
		}

		@Override
		public Identifier toPhysicalSequenceName(Identifier identifier, JdbcEnvironment jdbcEnv) {
			return convert(identifier);
		}

		@Override
		public Identifier toPhysicalTableName(Identifier identifier, JdbcEnvironment jdbcEnv) {
			return convert(identifier);
		}

		private Identifier convert(Identifier identifier) {
			if (identifier == null || StringUtils.isBlank(identifier.getText())) {
				return identifier;
			}

			final StringBuilder buf = new StringBuilder(identifier.getText().replace('.', '_'));
			for (int i = 1; i < buf.length() - 1; i++) {
				if (Character.isLowerCase(buf.charAt(i - 1)) && Character.isUpperCase(buf.charAt(i))
						&& Character.isLowerCase(buf.charAt(i + 1))) {
					buf.insert(i++, '_');
				}
			}
			String newName = buf.toString().toLowerCase();
			Identifier newIdentifier = Identifier.toIdentifier(newName, true);
			return newIdentifier;
		}
	}

	static public class ImprovedImplicitNamingStrategy implements ImplicitNamingStrategy {
		/**
		 * The INSTANCE.
		 */
		public static final ImprovedImplicitNamingStrategy INSTANCE = new ImprovedImplicitNamingStrategy();

		/**
		 * Constructor.
		 */
		public ImprovedImplicitNamingStrategy() {
		}

		@Override
		public Identifier determinePrimaryTableName(ImplicitEntityNameSource source) {
			if (source == null) {
				// should never happen, but to be defensive...
				throw new HibernateException("Entity naming information was not provided.");
			}

			String tableName = transformEntityName(source.getEntityNaming());

			if (tableName == null) {
				// todo : add info to error message - but how to know what to write since we
				// failed to interpret the naming source
				throw new HibernateException("Could not determine primary table name for entity");
			}
			return toIdentifier(tableName, source.getBuildingContext());
		}

		protected String transformEntityName(EntityNaming entityNaming) {
			// prefer the JPA entity name, if specified...
			if (StringHelper.isNotEmpty(entityNaming.getJpaEntityName())) {
				return entityNaming.getJpaEntityName();
			}
			else {
				// otherwise, use the Hibernate entity name
				return StringHelper.unqualify(entityNaming.getEntityName());
			}
		}

		@Override
		public Identifier determineJoinTableName(ImplicitJoinTableNameSource source) {
			final String ownerPortion = source.getOwningPhysicalTableName();
			final String ownedPortion;
			if (source.getAssociationOwningAttributePath() != null) {
				ownedPortion = transformAttributePath(source.getAssociationOwningAttributePath());
			}
			else {
				ownedPortion = source.getNonOwningPhysicalTableName();
			}

			return toIdentifier(ownerPortion + "_" + ownedPortion, source.getBuildingContext());
		}

		@Override
		public Identifier determineCollectionTableName(ImplicitCollectionTableNameSource source) {
			final String owningEntity = transformEntityName(source.getOwningEntityNaming());
			final String name = transformAttributePath(source.getOwningAttributePath());
			final String entityName;
			if (owningEntity != null && !owningEntity.trim().equals("")) {
				entityName = owningEntity + "_" + name;
			}
			else {
				entityName = name;
			}
			return toIdentifier(entityName, source.getBuildingContext());
		}

		@Override
		public Identifier determineIdentifierColumnName(ImplicitIdentifierColumnNameSource source) {
			return toIdentifier(transformAttributePath(source.getIdentifierAttributePath()), source.getBuildingContext());
		}

		@Override
		public Identifier determineDiscriminatorColumnName(ImplicitDiscriminatorColumnNameSource source) {
			return toIdentifier(source.getBuildingContext().getMappingDefaults().getImplicitDiscriminatorColumnName(),
					source.getBuildingContext());
		}

		@Override
		public Identifier determineTenantIdColumnName(ImplicitTenantIdColumnNameSource source) {
			return toIdentifier(source.getBuildingContext().getMappingDefaults().getImplicitTenantIdColumnName(),
					source.getBuildingContext());
		}

		@Override
		public Identifier determineBasicColumnName(ImplicitBasicColumnNameSource source) {
			return toIdentifier(transformAttributePath(source.getAttributePath()), source.getBuildingContext());
		}

		@Override
		public Identifier determineJoinColumnName(ImplicitJoinColumnNameSource source) {
			final String name;

			if (source.getNature() == ImplicitJoinColumnNameSource.Nature.ELEMENT_COLLECTION) {
				name = transformEntityName(source.getEntityNaming()) + '_' + source.getReferencedColumnName().getText();
			}
			else {
				if (source.getAttributePath() == null) {
					name = source.getReferencedTableName().getText();
				}
				else {
					name = transformAttributePath(source.getAttributePath());
				}
			}
			return toIdentifier(name, source.getBuildingContext());
		}

		/**
		 * The determinePrimaryTableName.
		 *
		 * @param source
		 *                 the source.
		 * @return the identifier.
		 */
		@Override
		public Identifier determinePrimaryKeyJoinColumnName(ImplicitPrimaryKeyJoinColumnNameSource source) {
			return source.getReferencedPrimaryKeyColumnName();
		}

		/**
		 * The determinePrimaryTableName.
		 *
		 * @param source
		 *                 the source.
		 * @return the identifier.
		 */
		@Override
		public Identifier determineAnyDiscriminatorColumnName(ImplicitAnyDiscriminatorColumnNameSource source) {
			return toIdentifier(
					transformAttributePath(source.getAttributePath()) + "_"
							+ source.getBuildingContext().getMappingDefaults().getImplicitDiscriminatorColumnName(),
					source.getBuildingContext());
		}

		/**
		 * The determinePrimaryTableName.
		 *
		 * @param source
		 *                 the source.
		 * @return the identifier.
		 */
		@Override
		public Identifier determineAnyKeyColumnName(ImplicitAnyKeyColumnNameSource source) {
			return toIdentifier(
					transformAttributePath(source.getAttributePath()) + "_"
							+ source.getBuildingContext().getMappingDefaults().getImplicitIdColumnName(),
					source.getBuildingContext());
		}

		/**
		 * The determinePrimaryTableName.
		 *
		 * @param source
		 *                 the source.
		 * @return the identifier.
		 */
		@Override
		public Identifier determineMapKeyColumnName(ImplicitMapKeyColumnNameSource source) {
			return toIdentifier(transformAttributePath(source.getPluralAttributePath()) + "_KEY",
					source.getBuildingContext());
		}

		/**
		 * The determinePrimaryTableName.
		 *
		 * @param source
		 *                 the source.
		 * @return the identifier.
		 */
		@Override
		public Identifier determineListIndexColumnName(ImplicitIndexColumnNameSource source) {
			return toIdentifier(transformAttributePath(source.getPluralAttributePath()) + "_ORDER",
					source.getBuildingContext());
		}

		/**
		 * The determinePrimaryTableName.
		 *
		 * @param source
		 *                 the source.
		 * @return the identifier.
		 */
		@Override
		public Identifier determineForeignKeyName(ImplicitForeignKeyNameSource source) {
			return toIdentifier(NamingHelper.INSTANCE.generateHashedFkName("FK", source.getTableName(),
					source.getReferencedTableName(), source.getColumnNames()), source.getBuildingContext());
		}

		/**
		 * The determinePrimaryTableName.
		 *
		 * @param source
		 *                 the source.
		 * @return the identifier.
		 */
		@Override
		public Identifier determineUniqueKeyName(ImplicitUniqueKeyNameSource source) {
			return toIdentifier(
					NamingHelper.INSTANCE.generateHashedConstraintName("UK", source.getTableName(), source.getColumnNames()),
					source.getBuildingContext());
		}

		/**
		 * The determinePrimaryTableName.
		 *
		 * @param source
		 *                 the source.
		 * @return the identifier.
		 */
		@Override
		public Identifier determineIndexName(ImplicitIndexNameSource source) {
			return toIdentifier(
					NamingHelper.INSTANCE.generateHashedConstraintName("IDX", source.getTableName(), source.getColumnNames()),
					source.getBuildingContext());
		}

		/**
		 * For JPA standards we typically need the unqualified name. However, a more
		 * usable impl tends to use the whole path. This method provides an easy hook
		 * for subclasses to accomplish that
		 *
		 * @param attributePath
		 *                        The attribute path
		 * @return The extracted name
		 */
		protected String transformAttributePath(AttributePath attributePath) {
			return attributePath.getProperty();
		}

		/**
		 * Easy hook to build an Identifier using the keyword safe IdentifierHelper.
		 *
		 * @param stringForm
		 *                          The String form of the name
		 * @param buildingContext
		 *                          Access to the IdentifierHelper
		 * @return The identifier
		 */
		protected Identifier toIdentifier(String stringForm, MetadataBuildingContext buildingContext) {

			Identifier i = buildingContext.getMetadataCollector().getDatabase().getJdbcEnvironment().getIdentifierHelper()
					.toIdentifier(stringForm);
			return i;
		}
	}

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
	 * @param path
	 *                      the path
	 * @param packageName
	 *                      the package name
	 * @return the tree set
	 * @throws MalformedURLException
	 *                                 the malformed url exception
	 * @throws IOException
	 *                                 Signals that an I/O exception has occurred.
	 */
	private static TreeSet<String> findClasses(String path, String packageName)
			throws MalformedURLException, IOException {
		TreeSet<String> classes = new TreeSet<>();
		if (path.startsWith("file:") && path.contains("!")) {
			String[] split = path.split("!");
			URL jar = new URL(split[0]);
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
	 * Retrieve the configured driver class.
	 * 
	 * @return the configured driver class
	 */
	private static String getDriverClass() {
		return Netshot.getConfig("netshot.db.driver_class", "com.mysql.jdbc.Driver");
	}

	/**
	 * Retrieve the DB URL.
	 * 
	 * @return the configured DB URL.
	 */
	private static String getUrl() {
		return Netshot.getConfig("netshot.db.url", "jdbc:mysql://localhost/netshot01");
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
	 * Update the database schema (to be run at startup).
	 */
	public static void update() {
		try {
			Class.forName("org.postgresql.Driver");
			Connection connection = DriverManager.getConnection(getUrl(), getUsername(), getPassword());
			liquibase.database.Database database = DatabaseFactory.getInstance()
					.findCorrectDatabaseImplementation(new JdbcConnection(connection));
			Liquibase liquibase = new Liquibase("migration/netshot0.xml", new ClassLoaderResourceAccessor(), database);
			liquibase.update(new Contexts(), new LabelExpression());
			connection.close();
		}
		catch (Exception e) {
			logger.error(MarkerFactory.getMarker("FATAL"),
					"Unable to connect to the database (for the initial schema update)", e);
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
					.setProperty("hibernate.connection.url", getUrl()).setProperty("hibernate.connection.username", getUsername())
					.setProperty("hibernate.connection.password", getPassword()).setProperty("hibernate.c3p0.min_size", "5")
					// Dates/times stored in UTC in the DB, without timezone, up to Java to convert to server local time
					.setProperty("hibernate.jdbc.time_zone", "UTC")
					.setProperty("hibernate.c3p0.max_size", "30").setProperty("hibernate.c3p0.timeout", "1800")
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

			configuration.setProperty("factory_class", "org.hibernate.transaction.JDBCTransactionFactory")
					.setProperty("current_session_context_class", "thread")
					//.setProperty("hibernate.hbm2ddl.auto", "update") // "update" or "validate" or ""
					//.setProperty("hibernate.show_sql", "true")
					.addAnnotatedClass(Device.class)
					.addAnnotatedClass(DeviceGroup.class).addAnnotatedClass(Config.class).addAnnotatedClass(DeviceAttribute.class)
					.addAnnotatedClass(DeviceNumericAttribute.class).addAnnotatedClass(DeviceTextAttribute.class)
					.addAnnotatedClass(DeviceLongTextAttribute.class).addAnnotatedClass(DeviceBinaryAttribute.class)
					.addAnnotatedClass(ConfigAttribute.class).addAnnotatedClass(ConfigNumericAttribute.class)
					.addAnnotatedClass(ConfigTextAttribute.class).addAnnotatedClass(ConfigLongTextAttribute.class)
					.addAnnotatedClass(ConfigBinaryAttribute.class).addAnnotatedClass(ConfigBinaryFileAttribute.class)
					.addAnnotatedClass(LongTextConfiguration.class).addAnnotatedClass(StaticDeviceGroup.class)
					.addAnnotatedClass(DynamicDeviceGroup.class).addAnnotatedClass(Module.class).addAnnotatedClass(Domain.class)
					.addAnnotatedClass(PhysicalAddress.class).addAnnotatedClass(NetworkAddress.class)
					.addAnnotatedClass(Network4Address.class).addAnnotatedClass(Network6Address.class)
					.addAnnotatedClass(NetworkInterface.class).addAnnotatedClass(DeviceSnmpv1Community.class)
					.addAnnotatedClass(DeviceSnmpv2cCommunity.class).addAnnotatedClass(DeviceSnmpv3Community.class)
					.addAnnotatedClass(DeviceSshAccount.class).addAnnotatedClass(DeviceSshKeyAccount.class)
					.addAnnotatedClass(DeviceTelnetAccount.class).addAnnotatedClass(Policy.class).addAnnotatedClass(Rule.class)
					.addAnnotatedClass(Task.class).addAnnotatedClass(DebugLog.class).addAnnotatedClass(Exemption.class)
					.addAnnotatedClass(Exemption.Key.class).addAnnotatedClass(CheckResult.class)
					.addAnnotatedClass(CheckResult.Key.class).addAnnotatedClass(SoftwareRule.class)
					.addAnnotatedClass(HardwareRule.class).addAnnotatedClass(DeviceJsScript.class)
					.addAnnotatedClass(Diagnostic.class).addAnnotatedClass(DiagnosticResult.class)
					.addAnnotatedClass(DiagnosticBinaryResult.class).addAnnotatedClass(DiagnosticNumericResult.class)
					.addAnnotatedClass(DiagnosticLongTextResult.class).addAnnotatedClass(DiagnosticTextResult.class)
					.addAnnotatedClass(UiUser.class)
					.addAnnotatedClass(ApiToken.class)
					.addAnnotatedClass(Hook.class).addAnnotatedClass(WebHook.class).addAnnotatedClass(HookTrigger.class);

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
			for (Class<?> clazz : Diagnostic.getDiagnosticClasses()) {
				configuration.addAnnotatedClass(clazz);
			}

			configuration.setImplicitNamingStrategy(new ImprovedImplicitNamingStrategy());
			configuration.setPhysicalNamingStrategy(new ImprovedPhysicalNamingStrategy());
			configuration.setInterceptor(new DatabaseInterceptor());

			serviceRegistry = new StandardServiceRegistryBuilder().applySettings(configuration.getProperties()).build();
			sessionFactory = configuration.buildSessionFactory(serviceRegistry);

		}
		catch (HibernateException e) {
			logger.error(MarkerFactory.getMarker("FATAL"), "Unable to instantiate Hibernate", e);
			throw new RuntimeException("Unable to instantiate Hibernate, see logs for more details");
		}
	}

	/**
	 * Gets the session.
	 *
	 * @return the session
	 * @throws HibernateException
	 *                              the hibernate exception
	 */
	public static Session getSession() throws HibernateException {
		return sessionFactory.openSession();
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
