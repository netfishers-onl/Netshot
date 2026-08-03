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
package net.netshot.netshot.device.access;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;

import org.glassfish.jersey.client.ClientConfig;

import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.client.Invocation;
import jakarta.ws.rs.client.WebTarget;
import jakarta.ws.rs.core.Response;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.device.NetworkAddress;
import net.netshot.netshot.device.credentials.DeviceHttpAccount;
import net.netshot.netshot.utils.InsecureHostnameVerifier;
import net.netshot.netshot.utils.InsecureTrustManager;
import net.netshot.netshot.work.TaskContext;

/**
 * An HTTP(S) client to access a device REST/HTTP API.
 * <p>
 * Phase 1 note: TLS trust is always accept-all (mirroring today's SSH
 * behavior, {@code AcceptAllServerKeyVerifier}), via {@link InsecureTrustManager}/
 * {@link InsecureHostnameVerifier} - same approach already used for outbound
 * webhooks. This is the deliberate extension point for the later "full trust
 * model" phase (TOFU pinning, CA trust, system truststore, etc).
 */
@Slf4j
public class Http implements Client {

	public static final int DEFAULT_PORT = 443;

	/**
	 * Declarative HTTP authentication scheme for an access, inspired by
	 * OpenAPI's {@code securitySchemes} object.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static final class AuthScheme {
		/** "http", "apiKey", "oauth2" or "openIdConnect". */
		@Getter(onMethod = @__({ @XmlElement }))
		@Setter
		private String type;

		/** For type "http": "basic" or "bearer". */
		@Getter(onMethod = @__({ @XmlElement }))
		@Setter
		private String scheme;

		/** For type "apiKey": "header", "query" or "cookie". */
		@Getter(onMethod = @__({ @XmlElement }))
		@Setter
		private String in;

		/** For type "apiKey": the header/query/cookie name. */
		@Getter(onMethod = @__({ @XmlElement }))
		@Setter
		private String name;

		public AuthScheme() {
		}
	}

	/**
	 * Embedded class to represent HTTP-specific access configuration.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static final class HttpConfig {
		/** Default TCP port for this access, when not overridden on the device. */
		@Getter(onMethod = @__({ @XmlElement }))
		@Setter
		private int defaultPort = DEFAULT_PORT;

		/** Whether this access uses TLS ("https") or plain HTTP. */
		@Getter(onMethod = @__({ @XmlElement }))
		@Setter
		private boolean tls = true;

		/** Optional base path prepended to every request path. */
		@Getter(onMethod = @__({ @XmlElement }))
		@Setter
		private String basePath;

		/** Declared authentication scheme for this access (may be null = no auth). */
		@Getter(onMethod = @__({ @XmlElement }))
		@Setter
		private AuthScheme auth;

		public HttpConfig() {
		}
	}

	/**
	 * The result of an HTTP request, handed back to JS.
	 */
	public static final class HttpResult {
		@Getter
		private final int status;
		@Getter
		private final Map<String, String> headers;
		@Getter
		private final String body;

		public HttpResult(int status, Map<String, String> headers, String body) {
			this.status = status;
			this.headers = headers;
			this.body = body;
		}
	}

	private final NetworkAddress host;
	private final int port;
	private final boolean tls;
	@SuppressWarnings("unused")
	private final TaskContext taskContext;

	/** The underlying JAX-RS (Jersey) client - built lazily on first connect(). */
	private jakarta.ws.rs.client.Client jerseyClient;

	/**
	 * Instantiates a new HTTP access.
	 * @param host the target host
	 * @param port the target TCP port
	 * @param tls whether to use TLS (https) or not
	 * @param taskContext the current task context
	 */
	public Http(NetworkAddress host, int port, boolean tls, TaskContext taskContext) {
		this.host = host;
		this.port = port;
		this.tls = tls;
		this.taskContext = taskContext;
	}

	@Override
	public void connect() throws IOException {
		if (this.jerseyClient != null) {
			return;
		}
		try {
			ClientConfig config = new ClientConfig();
			ClientBuilder builder = ClientBuilder.newBuilder().withConfig(config);
			if (this.tls) {
				// Phase 1: accept-all trust, mirroring today's SSH host key behavior.
				// Phase 4 extension point: swap for a pinning/CA-aware trust manager
				// driven by a per-access security configuration.
				SSLContext sslContext = SSLContext.getInstance("TLS");
				sslContext.init(null, new TrustManager[] { new InsecureTrustManager() }, new SecureRandom());
				builder.sslContext(sslContext).hostnameVerifier(new InsecureHostnameVerifier());
			}
			this.jerseyClient = builder.build();
		}
		catch (Exception e) {
			throw new IOException("Unable to initialize the HTTP client.", e);
		}
	}

	@Override
	public void disconnect() {
		if (this.jerseyClient != null) {
			this.jerseyClient.close();
			this.jerseyClient = null;
		}
	}

	/**
	 * Injects the authentication data (per the access's declared auth scheme)
	 * into the effective headers/query/cookies of the outgoing request.
	 * The credential itself never leaves this method.
	 * @param auth the auth scheme to apply
	 * @param account the credential set to authenticate with
	 * @param headers the effective request headers, updated in place
	 * @param query the effective request query parameters, updated in place
	 * @param cookies the effective request cookies, updated in place
	 */
	private void applyAuth(AuthScheme auth, DeviceHttpAccount account,
			Map<String, String> headers, Map<String, String> query, Map<String, String> cookies) {
		if (auth == null || account == null || auth.getType() == null) {
			return;
		}
		if ("http".equalsIgnoreCase(auth.getType())) {
			if ("bearer".equalsIgnoreCase(auth.getScheme())) {
				if (account.getPassword() != null) {
					headers.put("Authorization", "Bearer " + account.getPassword());
				}
			}
			else {
				// Basic auth (default for type=http when scheme isn't "bearer")
				String user = account.getUsername() == null ? "" : account.getUsername();
				String pass = account.getPassword() == null ? "" : account.getPassword();
				String encoded = Base64.getEncoder()
					.encodeToString((user + ":" + pass).getBytes(StandardCharsets.UTF_8));
				headers.put("Authorization", "Basic " + encoded);
			}
		}
		else if ("apiKey".equalsIgnoreCase(auth.getType())) {
			String value = account.getPassword();
			if (value == null) {
				return;
			}
			String keyName = auth.getName() == null ? "X-API-Key" : auth.getName();
			if ("query".equalsIgnoreCase(auth.getIn())) {
				query.put(keyName, value);
			}
			else if ("cookie".equalsIgnoreCase(auth.getIn())) {
				cookies.put(keyName, value);
			}
			else {
				headers.put(keyName, value);
			}
		}
		// "oauth2" / "openIdConnect": schema is recognized and validated by
		// DeviceDriver, but the token fetch/cache/refresh flow against an IdP
		// is a deliberately deferred fast-follow, not implemented in Phase 1.
	}

	/**
	 * Perform an HTTP request.
	 * @param method the HTTP method (GET, POST, ...)
	 * @param path the request path (appended to the access's base path)
	 * @param headers extra request headers (driver-provided, may be null)
	 * @param query extra query parameters (driver-provided, may be null)
	 * @param cookies extra cookies (driver-provided, may be null)
	 * @param body the request body (null for none)
	 * @param httpConfig the access's declared HTTP configuration (base path, auth scheme)
	 * @param account the resolved credential set (may be null if the access has no auth)
	 * @return the HTTP result (status, headers, body)
	 * @throws IOException if the request could not be sent/received
	 */
	public HttpResult request(String method, String path, Map<String, String> headers,
			Map<String, String> query, Map<String, String> cookies, String body,
			HttpConfig httpConfig, DeviceHttpAccount account) throws IOException {
		this.connect();

		StringBuilder pathBuilder = new StringBuilder();
		if (httpConfig != null && httpConfig.getBasePath() != null && !httpConfig.getBasePath().isEmpty()) {
			String base = httpConfig.getBasePath();
			pathBuilder.append(base.startsWith("/") ? base : "/" + base);
		}
		if (path != null && !path.isEmpty()) {
			pathBuilder.append(path.startsWith("/") ? path : "/" + path);
		}

		String scheme = this.tls ? "https" : "http";
		String hostAddress = this.host.getInetAddress().getHostAddress();
		String uri = String.format("%s://%s:%d%s", scheme, hostAddress, this.port, pathBuilder.toString());

		Map<String, String> effectiveHeaders = new HashMap<>();
		if (headers != null) {
			effectiveHeaders.putAll(headers);
		}
		Map<String, String> effectiveQuery = new HashMap<>();
		if (query != null) {
			effectiveQuery.putAll(query);
		}
		Map<String, String> effectiveCookies = new HashMap<>();
		if (cookies != null) {
			effectiveCookies.putAll(cookies);
		}

		if (httpConfig != null) {
			this.applyAuth(httpConfig.getAuth(), account, effectiveHeaders, effectiveQuery, effectiveCookies);
		}

		WebTarget target = this.jerseyClient.target(uri);
		for (Map.Entry<String, String> entry : effectiveQuery.entrySet()) {
			target = target.queryParam(entry.getKey(), entry.getValue());
		}
		Invocation.Builder invocationBuilder = target.request();
		for (Map.Entry<String, String> entry : effectiveHeaders.entrySet()) {
			if ("Content-Type".equalsIgnoreCase(entry.getKey())) {
				continue;
			}
			invocationBuilder = invocationBuilder.header(entry.getKey(), entry.getValue());
		}
		for (Map.Entry<String, String> entry : effectiveCookies.entrySet()) {
			invocationBuilder = invocationBuilder.cookie(entry.getKey(), entry.getValue());
		}

		String contentType = effectiveHeaders.entrySet().stream()
			.filter(e -> "Content-Type".equalsIgnoreCase(e.getKey()))
			.map(Map.Entry::getValue)
			.findFirst()
			.orElse("application/json");

		String upperMethod = method == null ? "GET" : method.toUpperCase();
		try {
			Response response;
			if (body != null && !"GET".equals(upperMethod) && !"HEAD".equals(upperMethod)) {
				response = invocationBuilder.method(upperMethod, Entity.entity(body, contentType));
			}
			else {
				response = invocationBuilder.method(upperMethod);
			}
			int status = response.getStatus();
			Map<String, String> responseHeaders = new HashMap<>();
			response.getStringHeaders().forEach(
				(name, values) -> responseHeaders.put(name, String.join(", ", values)));
			String responseBody = response.hasEntity() ? response.readEntity(String.class) : "";
			response.close();
			return new HttpResult(status, responseHeaders, responseBody);
		}
		catch (ProcessingException e) {
			log.warn("HTTP request to {} failed.", uri, e);
			throw new IOException("HTTP request failed: " + e.getMessage(), e);
		}
	}

}
