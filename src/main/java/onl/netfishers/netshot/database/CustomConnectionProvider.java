package onl.netfishers.netshot.database;

import java.util.HashMap;
import java.util.Map;

import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.boot.registry.internal.StandardServiceRegistryImpl;
import org.hibernate.c3p0.internal.C3P0ConnectionProvider;
import org.hibernate.cfg.C3p0Settings;
import org.hibernate.engine.jdbc.connections.spi.AbstractMultiTenantConnectionProvider;
import org.hibernate.engine.jdbc.connections.spi.ConnectionProvider;

/**
 * Custom connection provider, to handle read-write and read-only connections to the database.
 */
public class CustomConnectionProvider extends AbstractMultiTenantConnectionProvider<TenantIdentifier> {

	/** Map of ConnectionProvider objects (read-only and read-write) */
	private Map<TenantIdentifier, ConnectionProvider> providerMap = new HashMap<>();

	private ConnectionProvider defaultProvider;

	public void registerConnectionProvider(TenantIdentifier identifier, Map<String, Object> props, boolean defaultProvider) {
		C3P0ConnectionProvider provider = new C3P0ConnectionProvider();
		provider.injectServices((StandardServiceRegistryImpl) new StandardServiceRegistryBuilder().build());
		Map<String, Object> configProps = new HashMap<>(props);
		configProps.put("hibernate.c3p0.dataSourceName", identifier.getSourceName());
		configProps.put(C3p0Settings.C3P0_MIN_SIZE, "5");
		configProps.put(C3p0Settings.C3P0_MAX_SIZE, "30");
		configProps.put(C3p0Settings.C3P0_TIMEOUT, "1800");
		configProps.put(C3p0Settings.C3P0_MAX_STATEMENTS, "50");
		configProps.put("hibernate.c3p0.unreturnedConnectionTimeout", "1800");
		configProps.put("hibernate.c3p0.debugUnreturnedConnectionStackTraces", "true");
		provider.configure(props);
		this.providerMap.put(identifier, provider);
		if (defaultProvider) {
			this.defaultProvider = provider;
		}
	}

	@Override
	protected ConnectionProvider getAnyConnectionProvider() {
		return this.defaultProvider;
	}

	@Override
	protected ConnectionProvider selectConnectionProvider(TenantIdentifier tenantIdentifier) {
		ConnectionProvider cp = this.providerMap.get(tenantIdentifier);
		if (cp == null) {
			return this.defaultProvider;
		}
		return cp;
	}
	
}
