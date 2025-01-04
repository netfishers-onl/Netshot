/**
 * Copyright 2013-2025 Netshot
 * 
 * This file is part of Netshot project.
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
package net.netshot.netshot.database;

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
