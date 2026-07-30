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
package net.netshot.netshot;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import net.netshot.netshot.device.NetworkAddress;
import net.netshot.netshot.device.access.Http;
import net.netshot.netshot.device.access.Http.AuthScheme;
import net.netshot.netshot.device.access.Http.HttpConfig;
import net.netshot.netshot.device.access.Http.HttpResult;
import net.netshot.netshot.device.credentials.DeviceHttpAccount;

/**
 * Unit tests for {@link Http}, in particular the per-access-declared
 * authentication scheme injection (basic / bearer / apiKey), against a real
 * (plain HTTP, loopback) {@code com.sun.net.httpserver.HttpServer} - no mock
 * framework needed, and no TLS involved since {@code tls=false} is used
 * throughout (trust/certificate behavior is out of scope for Phase 1 tests).
 */
public class HttpTest {

	private HttpServer server;
	private int port;
	private final AtomicReference<HttpExchange> lastExchange = new AtomicReference<>();
	private final AtomicReference<String> lastBody = new AtomicReference<>();

	@BeforeEach
	void startServer() throws IOException {
		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/", exchange -> {
			this.lastExchange.set(exchange);
			byte[] requestBody = exchange.getRequestBody().readAllBytes();
			this.lastBody.set(new String(requestBody, StandardCharsets.UTF_8));
			byte[] response = "{\"ok\":true}".getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, response.length);
			try (OutputStream os = exchange.getResponseBody()) {
				os.write(response);
			}
		});
		this.server.start();
		this.port = this.server.getAddress().getPort();
	}

	@AfterEach
	void stopServer() {
		this.server.stop(0);
	}

	private Http newClient() throws IOException {
		NetworkAddress address = NetworkAddress.getNetworkAddress(InetAddress.getByName("127.0.0.1"));
		return new Http(address, this.port, false, new FakeTaskContext());
	}

	@Test
	@DisplayName("Basic auth injects a Base64-encoded Authorization header")
	void basicAuthHeader() throws IOException {
		HttpConfig config = new HttpConfig();
		AuthScheme auth = new AuthScheme();
		auth.setType("http");
		auth.setScheme("basic");
		config.setAuth(auth);
		DeviceHttpAccount account = new DeviceHttpAccount("bob", "s3cret", "cred");

		HttpResult result = newClient().request("GET", "/status", null, null, null, null, config, account);

		Assertions.assertEquals(200, result.getStatus());
		String expected = "Basic " + Base64.getEncoder().encodeToString("bob:s3cret".getBytes(StandardCharsets.UTF_8));
		Assertions.assertEquals(expected, this.lastExchange.get().getRequestHeaders().getFirst("Authorization"));
	}

	@Test
	@DisplayName("Bearer auth injects the token as an Authorization header")
	void bearerAuthHeader() throws IOException {
		HttpConfig config = new HttpConfig();
		AuthScheme auth = new AuthScheme();
		auth.setType("http");
		auth.setScheme("bearer");
		config.setAuth(auth);
		DeviceHttpAccount account = new DeviceHttpAccount(null, "tok3n", "cred");

		HttpResult result = newClient().request("GET", "/status", null, null, null, null, config, account);

		Assertions.assertEquals(200, result.getStatus());
		Assertions.assertEquals("Bearer tok3n", this.lastExchange.get().getRequestHeaders().getFirst("Authorization"));
	}

	@Test
	@DisplayName("apiKey (header) auth injects the configured header name")
	void apiKeyHeader() throws IOException {
		HttpConfig config = new HttpConfig();
		AuthScheme auth = new AuthScheme();
		auth.setType("apiKey");
		auth.setIn("header");
		auth.setName("X-API-Key");
		config.setAuth(auth);
		DeviceHttpAccount account = new DeviceHttpAccount(null, "the-key", "cred");

		HttpResult result = newClient().request("GET", "/status", null, null, null, null, config, account);

		Assertions.assertEquals(200, result.getStatus());
		Assertions.assertEquals("the-key", this.lastExchange.get().getRequestHeaders().getFirst("X-API-Key"));
	}

	@Test
	@DisplayName("apiKey (query) auth injects the configured query parameter")
	void apiKeyQuery() throws IOException {
		HttpConfig config = new HttpConfig();
		AuthScheme auth = new AuthScheme();
		auth.setType("apiKey");
		auth.setIn("query");
		auth.setName("api_key");
		config.setAuth(auth);
		DeviceHttpAccount account = new DeviceHttpAccount(null, "the-key", "cred");

		HttpResult result = newClient().request("GET", "/status", null, null, null, null, config, account);

		Assertions.assertEquals(200, result.getStatus());
		Assertions.assertEquals("/status?api_key=the-key", this.lastExchange.get().getRequestURI().toString());
	}

	@Test
	@DisplayName("Custom headers/body pass through untouched, and the base path is prepended")
	void customHeadersAndBasePath() throws IOException {
		HttpConfig config = new HttpConfig();
		config.setBasePath("/api/v1");

		HttpResult result = newClient().request("POST", "/things", Map.of("X-Custom", "value"), null, null,
			"{\"name\":\"test\"}", config, null);

		Assertions.assertEquals(200, result.getStatus());
		Assertions.assertEquals("/api/v1/things", this.lastExchange.get().getRequestURI().toString());
		Assertions.assertEquals("value", this.lastExchange.get().getRequestHeaders().getFirst("X-Custom"));
		Assertions.assertEquals("{\"name\":\"test\"}", this.lastBody.get());
	}

}
