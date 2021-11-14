package onl.netfishers.netshot.database;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.boot.registry.internal.StandardServiceRegistryImpl;
import org.hibernate.c3p0.internal.C3P0ConnectionProvider;
import org.hibernate.engine.jdbc.connections.spi.AbstractMultiTenantConnectionProvider;
import org.hibernate.engine.jdbc.connections.spi.ConnectionProvider;

/**
 * Custom connection provider, to handle read-write and read-only connections to the database.
 */
public class CustomConnectionProvider extends AbstractMultiTenantConnectionProvider {

	/** Map of ConnectionProvider objects (read-only and read-write) */
	private Map<String, ConnectionProvider> providerMap = new HashMap<>();

	private ConnectionProvider defaultProvider;

	public void registerConnectionProvider(String name, Properties properties, boolean defaultProvider) {
		C3P0ConnectionProvider provider = new C3P0ConnectionProvider();
		provider.injectServices((StandardServiceRegistryImpl) new StandardServiceRegistryBuilder().build());
		Properties providerProperties = new Properties();
		providerProperties.putAll(properties);
		provider.configure(providerProperties);
		this.providerMap.put(name, provider);
		if (defaultProvider) {
			this.defaultProvider = provider;
		}
	}

	@Override
	protected ConnectionProvider getAnyConnectionProvider() {
		return this.defaultProvider;
	}

	@Override
	protected ConnectionProvider selectConnectionProvider(String tenantIdentifier) {
		ConnectionProvider cp = this.providerMap.get(tenantIdentifier);
		if (cp == null) {
			return this.defaultProvider;
		}
		return cp;
	}
	
}
