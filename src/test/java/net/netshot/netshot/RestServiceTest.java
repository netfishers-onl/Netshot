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
import java.io.InputStream;
import java.net.HttpCookie;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpResponse;
import java.security.GeneralSecurityException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.function.Function;

import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.hibernate.Session;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;
import net.netshot.netshot.NetshotApiClient.WrongApiResponseException;
import net.netshot.netshot.aaa.ApiToken;
import net.netshot.netshot.aaa.Oidc;
import net.netshot.netshot.aaa.PasswordPolicy;
import net.netshot.netshot.aaa.PasswordPolicy.PasswordPolicyException;
import net.netshot.netshot.aaa.UiUser;
import net.netshot.netshot.database.Database;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.Device.MissingDeviceDriverException;
import net.netshot.netshot.device.DeviceDriver;
import net.netshot.netshot.device.DeviceDriver.DriverProtocol;
import net.netshot.netshot.device.Domain;
import net.netshot.netshot.device.Network4Address;
import net.netshot.netshot.device.attribute.AttributeDefinition;
import net.netshot.netshot.rest.NetshotBadRequestException;
import net.netshot.netshot.rest.RestService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.junit.jupiter.api.parallel.ResourceLock;

public class RestServiceTest {

	private static final String apiUrl = "http://localhost:8888/api";
	private static final long UNKNOWN_ID = 99999999;

	protected static final Map<Integer, String> API_TOKENS = Map.of(
		UiUser.LEVEL_READONLY, "mwAPEe0mQlBvKuUYYS5MiFsmnVRWZpca",
		UiUser.LEVEL_OPERATOR, "vMLKSPWMq9hFRtKkhXbvHhveXEn3Y4BZ",
		UiUser.LEVEL_READWRITE, "rCSrr3S3PGsLmi54HFw6a3PbZClpCivk",
		UiUser.LEVEL_EXECUTEREADWRITE, "PXlJ4r8VvTObn6hyknI1lwOoxEPJjCDO",
		UiUser.LEVEL_ADMIN, "hLXg3ABu1qWJPle3Z3Z22X0aLkx5T354"
	);

	protected static void createApiTokens() {
		try (Session session = Database.getSession()) {
			session.beginTransaction();
			// Remove default admin account
			session
				.createMutationQuery("delete from net.netshot.netshot.aaa.UiUser")
				.executeUpdate();
			for (Map.Entry<Integer, String> entry : API_TOKENS.entrySet()) {
				String description = "Test Token - level %d".formatted(entry.getKey());
				ApiToken token = new ApiToken(description, entry.getValue(), entry.getKey());
				session.persist(token);
			}
			session.getTransaction().commit();
		}
	}

	protected static Properties getNetshotConfig() {
		Properties config = new Properties();
		config.setProperty("netshot.log.file", "CONSOLE");
		config.setProperty("netshot.log.level", "INFO");
		config.setProperty("netshot.db.driver_class", "org.h2.Driver");
		config.setProperty("netshot.db.url",
			"jdbc:h2:mem:restservicetest;TRACE_LEVEL_SYSTEM_OUT=2;"
				+ "CASE_INSENSITIVE_IDENTIFIERS=true;DB_CLOSE_DELAY=-1");
		config.setProperty("netshot.http.ssl.enabled", "false");
		URI uri = UriBuilder.fromUri(apiUrl).replacePath("/").build();
		config.setProperty("netshot.http.baseurl", uri.toString());
		// Very low value for session expiration testing
		config.setProperty("netshot.aaa.maxidletime", "10");
		return config;
	}

	@BeforeAll
	protected static void initNetshot() throws Exception {
		Netshot.initConfig(RestServiceTest.getNetshotConfig());
		Netshot.loadModuleConfigs();
		Database.update();
		Database.init();
		TaskManager.init();
		RestService.init();
		Thread.sleep(1000);
	}

	private NetshotApiClient apiClient;

	@BeforeEach
	void createToken() throws URISyntaxException {
		RestServiceTest.createApiTokens();
		this.apiClient = new NetshotApiClient(RestServiceTest.apiUrl,
			RestServiceTest.API_TOKENS.get(UiUser.LEVEL_ADMIN));
	}

	@AfterEach
	void flushTokens() {
		try (Session session = Database.getSession()) {
			session.beginTransaction();
			session
				.createMutationQuery("delete from ApiToken")
				.executeUpdate();
			session.getTransaction().commit();
		}
	}


	@Nested
	@DisplayName("Authentication Tests")
	class ApiTokenTest {

		@AfterEach
		void cleanUpData() {
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				session
					.createMutationQuery("delete from net.netshot.netshot.aaa.UiUser")
					.executeUpdate();
				session.getTransaction().commit();
			}
		}

		@Test
		@DisplayName("Missing API token")
		void missingApiToken() throws IOException, InterruptedException {
			apiClient.setApiToken(null);
			HttpResponse<JsonNode> response = apiClient.get("/devices");
			Assertions.assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), response.statusCode(),
				"Not getting 401 response for missing API token");
			Assertions.assertInstanceOf(MissingNode.class,
				response.body(), "Response body not empty");
		}

		@Test
		@DisplayName("Empty API token")
		void emptyApiToken() throws IOException, InterruptedException {
			apiClient.setApiToken("");
			HttpResponse<JsonNode> response = apiClient.get("/devices");
			Assertions.assertEquals(
				Response.Status.UNAUTHORIZED.getStatusCode(), response.statusCode(),
				"Not getting 401 response for empty API token");
			Assertions.assertInstanceOf(MissingNode.class,
				response.body(), "Response body not empty");
		}

		@Test
		@DisplayName("Wrong API token")
		void wrongApiToken() throws IOException, InterruptedException {
			apiClient.setApiToken("WRONGTOKEN");
			HttpResponse<JsonNode> response = apiClient.get("/devices");
			Assertions.assertEquals(
				Response.Status.UNAUTHORIZED.getStatusCode(), response.statusCode(),
				"Not getting 401 response for wrong API token");
			Assertions.assertInstanceOf(MissingNode.class,
				response.body(), "Response body not empty");
		}

		@Test
		@DisplayName("Missing privilege")
		void notAdminToken() throws IOException, InterruptedException {
			apiClient.setApiToken(RestServiceTest.API_TOKENS.get(UiUser.LEVEL_EXECUTEREADWRITE));
			HttpResponse<JsonNode> response = apiClient.get("/apitokens");
			Assertions.assertEquals(Response.Status.FORBIDDEN.getStatusCode(), response.statusCode(),
				"Not getting 403 response while missing privileges");
			Assertions.assertInstanceOf(MissingNode.class,
				response.body(), "Response body not empty");
		}

		@Test
		@DisplayName("Current user retrieval for API token")
		void currentUser() throws IOException, InterruptedException {
			String secret = "jmE5C9JHDpLtbGswYfWBdUayKFn7Th6R";
			ApiToken token1 = new ApiToken("Token get test", secret, UiUser.LEVEL_READONLY);
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				session.persist(token1);
				session.getTransaction().commit();
			}
			apiClient.setApiToken(secret);
			HttpResponse<JsonNode> response = apiClient.get("/user");
			Assertions.assertEquals(
				Response.Status.OK.getStatusCode(), response.statusCode(),
				"Not getting 200 response for /user");

			Assertions.assertEquals(
				JsonNodeFactory.instance.objectNode()
					.put("id", token1.getId())
					.put("description", token1.getDescription())
					.put("level", Long.valueOf(token1.getLevel())),
				response.body(),
				"Retrieved user/token doesn't match expected object");
		}


	}

	@Nested
	@DisplayName("Local Authentication Tests")
	class LocalAuthenticationTest {

		private String testUsername = "testuser";
		private String testPassword = "testpassword";
		private String[] testOldPasswords = new String[] {
			"testpassword02",
			"testpassword01",
			"testpassword00",
		};
		private int testUserLevel = UiUser.LEVEL_ADMIN;
		private int passwordAge;
		private UiUser testUser;

		private void createTestUser() {
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				List<String> oldPasswords = new ArrayList<>(List.of(testOldPasswords));
				UiUser user = new UiUser(testUsername, true, oldPasswords.removeLast());
				while (oldPasswords.size() > 0) {
					try {
						user.setPassword(oldPasswords.removeLast(), PasswordPolicy.getMainPolicy());
					}
					catch (PasswordPolicyException e) {
						// Ignore
					}
				}
				user.setPassword(testPassword);
				user.setLevel(testUserLevel);
				if (passwordAge > 0) {
					Calendar oneYearAgo = Calendar.getInstance();
					oneYearAgo.add(Calendar.DATE, -1 * passwordAge);
					user.setLastPasswordChangeDate(oneYearAgo.getTime());
				}
				session.persist(user);
				session.getTransaction().commit();
				this.testUser = user;
			}
		}

		@Test
		@DisplayName("Local user authentication and cookie")
		@ResourceLock("DB")
		void localUserAuth() throws IOException, InterruptedException {
			this.createTestUser();
			apiClient.setLogin(testUsername, testPassword);
			HttpResponse<JsonNode> response1 = apiClient.get("/domains");
			Assertions.assertEquals(
				Response.Status.OK.getStatusCode(), response1.statusCode(),
				"Unable to get data using username/password and cookie API access");
			HttpCookie sessionCookie = apiClient.getSessionCookie();
			apiClient.logout();
			apiClient.addSessionCookie(sessionCookie);
			HttpResponse<JsonNode> response2 = apiClient.get("/domains");
			Assertions.assertEquals(
				Response.Status.UNAUTHORIZED.getStatusCode(), response2.statusCode(),
				"Not getting 401 response for post-logout request");
		}

		@Test
		@DisplayName("Local user authentication and idle session timeout")
		@ResourceLock("DB")
		void sessionTimeout() throws IOException, InterruptedException {
			this.createTestUser();
			apiClient.setLogin(testUsername, testPassword);
			HttpResponse<JsonNode> response1 = apiClient.get("/domains");
			Assertions.assertEquals(
				Response.Status.OK.getStatusCode(), response1.statusCode(),
				"Unable to get data using username/password and cookie API access");
			Thread.sleep(Duration.ofSeconds(15));
			HttpResponse<JsonNode> response2 = apiClient.get("/domains");
			Assertions.assertEquals(
				Response.Status.UNAUTHORIZED.getStatusCode(), response2.statusCode(),
				"Not getting 401 response while session have expired");
		}

		@Test
		@DisplayName("Current user retrieval for local user")
		void currentUser() throws IOException, InterruptedException {
			this.createTestUser();
			apiClient.setLogin(testUsername, testPassword);
			HttpResponse<JsonNode> response = apiClient.get("/user");
			Assertions.assertEquals(
				Response.Status.OK.getStatusCode(), response.statusCode(),
				"Not getting 200 response for /user");

			Assertions.assertEquals(
				JsonNodeFactory.instance.objectNode()
					.put("id", this.testUser.getId())
					.put("username", this.testUser.getUsername())
					.put("local", true)
					.put("level", Long.valueOf(this.testUser.getLevel())),
				response.body(),
				"Retrieved user doesn't match expected object");
		}

		@Test
		@DisplayName("Wrong cookie")
		void wrongCookie() throws IOException, InterruptedException {
			apiClient.setApiToken(null);
			apiClient.addSessionCookie("9212336284027029412");
			HttpResponse<JsonNode> response = apiClient.get("/devices");
			Assertions.assertEquals(
				Response.Status.UNAUTHORIZED.getStatusCode(), response.statusCode(),
				"Not getting 401 response for wrong cookie");
			Assertions.assertInstanceOf(MissingNode.class,
				response.body(), "Response body not empty");
		}

		@Test
		@DisplayName("Expired password authentication attempt")
		@ResourceLock("DB")
		void expiredPasswordFailAuth() throws IOException, InterruptedException {
			Properties config = RestServiceTest.getNetshotConfig();
			config.setProperty("netshot.aaa.passwordpolicy.maxduration", "90");
			Netshot.initConfig(config);
			PasswordPolicy.loadConfig();
			this.passwordAge = 365;
			this.createTestUser();
			apiClient.setLogin(testUsername, testPassword);
			WrongApiResponseException thrown = Assertions.assertThrows(WrongApiResponseException.class,
				() -> apiClient.get("/domains"),
				"Login not failing as expected");
			Assertions.assertEquals(
				Response.Status.PRECONDITION_FAILED.getStatusCode(), thrown.getResponse().statusCode(),
				"Not getting 412 when logging in with expired password");
		}

		@Test
		@DisplayName("Expired password, change and authentication attempt")
		@ResourceLock("DB")
		void expiredPasswordChangeAuth() throws IOException, InterruptedException {
			Properties config = RestServiceTest.getNetshotConfig();
			config.setProperty("netshot.aaa.passwordpolicy.maxduration", "90");
			Netshot.initConfig(config);
			PasswordPolicy.loadConfig();
			String newPassword = "testpassword1";
			this.passwordAge = 365;
			this.createTestUser();
			apiClient.setLogin(testUsername, testPassword);
			apiClient.setNewPassword(newPassword);
			HttpResponse<JsonNode> response = apiClient.get("/domains");
			Assertions.assertEquals(
				Response.Status.OK.getStatusCode(), response.statusCode(),
				"Not getting 200 response");
			try (Session session = Database.getSession()) {
				UiUser user = session
					.bySimpleNaturalId(UiUser.class)
					.load(testUsername);
				Assertions.assertDoesNotThrow(() -> user.checkPassword(newPassword, null),
					"Password not changed as expected");
			}
		}

		@Test
		@DisplayName("The password cannot be changed if auth fails")
		@ResourceLock("DB")
		void wrongAuthCantChangePassword() throws IOException, InterruptedException {
			String newPassword = "testpassword1";
			this.createTestUser();
			apiClient.setLogin(testUsername, "wrongpass");
			apiClient.setNewPassword(newPassword);
			Assertions.assertThrows(WrongApiResponseException.class,
				() -> apiClient.get("/domains"),
				"Login should have failed");
			try (Session session = Database.getSession()) {
				UiUser user = session
					.bySimpleNaturalId(UiUser.class)
					.load(testUsername);
				Assertions.assertDoesNotThrow(() -> user.checkPassword(testPassword, null),
					"Password should not have changed");
			}
		}

		@Test
		@DisplayName("Password policy")
		@ResourceLock("DB")
		void passwordChangeWithPolicy() throws IOException, InterruptedException {
			Properties config = RestServiceTest.getNetshotConfig();
			config.setProperty("netshot.aaa.passwordpolicy.maxhistory", "5");
			Netshot.initConfig(config);
			PasswordPolicy.loadConfig();
			this.createTestUser();
			config.setProperty("netshot.aaa.passwordpolicy.mintotalchars", "16");
			config.setProperty("netshot.aaa.passwordpolicy.minspecialchars", "3");
			config.setProperty("netshot.aaa.passwordpolicy.minnumericalchars", "3");
			config.setProperty("netshot.aaa.passwordpolicy.minlowercasechars", "3");
			config.setProperty("netshot.aaa.passwordpolicy.minuppercasechars", "3");
			Netshot.initConfig(config);
			PasswordPolicy.loadConfig();
			apiClient.setLogin(testUsername, testPassword);
			{
				HttpResponse<JsonNode> response = apiClient.get("/user");
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response");
				JsonNode userNode = response.body();
				Assertions.assertEquals(testUsername, userNode.get("username").asText());
				Assertions.assertEquals(testUserLevel, userNode.get("level").asInt());
			}
			{
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("username", testUsername)
					// missing password
					.put("newPassword", "New902C0pml;(EP!$");
				HttpResponse<JsonNode> response = apiClient.put("/user/0", data);
				Assertions.assertEquals(
					Response.Status.BAD_REQUEST.getStatusCode(), response.statusCode(),
					"Not getting 400 response");
				Assertions.assertEquals(
					response.body().get("errorCode").asInt(),
					NetshotBadRequestException.Reason.NETSHOT_INVALID_PASSWORD.getCode(),
					"Unexpected Netshot error code");
			}
			{
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("username", testUsername)
					.put("password", "invalidpass")
					.put("newPassword", "New902C0pml;(EP!$");
				HttpResponse<JsonNode> response = apiClient.put("/user/0", data);
				Assertions.assertEquals(
					Response.Status.BAD_REQUEST.getStatusCode(), response.statusCode(),
					"Not getting 400 response");
				Assertions.assertEquals(
					response.body().get("errorCode").asInt(),
					NetshotBadRequestException.Reason.NETSHOT_INVALID_PASSWORD.getCode(),
					"Unexpected Netshot error code");
			}
			{
				String newPassword = testOldPasswords[2];
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("username", testUsername)
					.put("password", testPassword)
					.put("newPassword", newPassword);
				HttpResponse<JsonNode> response = apiClient.put("/user/0", data);
				Assertions.assertEquals(
					Response.Status.BAD_REQUEST.getStatusCode(), response.statusCode(),
					"Not getting 400 response");
				Assertions.assertEquals(
					response.body().get("errorCode").asInt(),
					NetshotBadRequestException.Reason.NETSHOT_FAILED_PASSWORD_POLICY.getCode(),
					"Unexpected Netshot error code");
			}
			{
				String newPassword = "pass";
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("username", testUsername)
					.put("password", testPassword)
					.put("newPassword", newPassword);
				HttpResponse<JsonNode> response = apiClient.put("/user/0", data);
				Assertions.assertEquals(
					Response.Status.BAD_REQUEST.getStatusCode(), response.statusCode(),
					"Not getting 400 response");
				Assertions.assertEquals(
					response.body().get("errorCode").asInt(),
					NetshotBadRequestException.Reason.NETSHOT_FAILED_PASSWORD_POLICY.getCode(),
					"Unexpected Netshot error code");
			}
			{
				String newPassword = "newverylongpassword";
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("username", testUsername)
					.put("password", testPassword)
					.put("newPassword", newPassword);
				HttpResponse<JsonNode> response = apiClient.put("/user/0", data);
				Assertions.assertEquals(
					Response.Status.BAD_REQUEST.getStatusCode(), response.statusCode(),
					"Not getting 400 response");
				Assertions.assertEquals(
					response.body().get("errorCode").asInt(),
					NetshotBadRequestException.Reason.NETSHOT_FAILED_PASSWORD_POLICY.getCode(),
					"Unexpected Netshot error code");
			}
			{
				String newPassword = "newverylongpassword123";
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("username", testUsername)
					.put("password", testPassword)
					.put("newPassword", newPassword);
				HttpResponse<JsonNode> response = apiClient.put("/user/0", data);
				Assertions.assertEquals(
					Response.Status.BAD_REQUEST.getStatusCode(), response.statusCode(),
					"Not getting 400 response");
				Assertions.assertEquals(
					response.body().get("errorCode").asInt(),
					NetshotBadRequestException.Reason.NETSHOT_FAILED_PASSWORD_POLICY.getCode(),
					"Unexpected Netshot error code");
			}
			{
				String newPassword = "newverylongPASSWORD123";
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("username", testUsername)
					.put("password", testPassword)
					.put("newPassword", newPassword);
				HttpResponse<JsonNode> response = apiClient.put("/user/0", data);
				Assertions.assertEquals(
					Response.Status.BAD_REQUEST.getStatusCode(), response.statusCode(),
					"Not getting 400 response");
				Assertions.assertEquals(
					response.body().get("errorCode").asInt(),
					NetshotBadRequestException.Reason.NETSHOT_FAILED_PASSWORD_POLICY.getCode(),
					"Unexpected Netshot error code");
			}
			{
				String newPassword = "newverylongPASS123!!$$";
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("username", testUsername)
					.put("password", testPassword)
					.put("newPassword", newPassword);
				HttpResponse<JsonNode> response = apiClient.put("/user/0", data);
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response");
				try (Session session = Database.getSession()) {
					UiUser user = session
						.bySimpleNaturalId(UiUser.class)
						.load(testUsername);
					Assertions.assertDoesNotThrow(() -> user.checkPassword(newPassword, null),
						"Password should have changed");
				}
			}

		}
	}

	@Nested
	@DisplayName("OIDC Authentication Tests")
	@TestInstance(Lifecycle.PER_CLASS)
	class OidcAuthenticationTest {

		private final URI redirectUri = URI.create("http://localhost:8080/");
		private final String clientId = "netshot";
		private final String clientSecret = "iR56DPj4ZX0TrB1NSCHsPNk6LAbrN3HE";
		private FakeOidcIdpServer idpServer;

		@BeforeAll
		void prepareOidc() throws IOException, InterruptedException, GeneralSecurityException {
			this.idpServer = new FakeOidcIdpServer();
			this.idpServer.registerClient(clientId, clientSecret, redirectUri);
			this.idpServer.start();
			Properties config = RestServiceTest.getNetshotConfig();
			config.setProperty("netshot.aaa.oidc.idp.url", this.idpServer.getBaseUri().toString());
			config.setProperty("netshot.aaa.oidc.clientid", clientId);
			config.setProperty("netshot.aaa.oidc.clientsecret", clientSecret);
			Netshot.initConfig(config);
			Oidc.loadConfig();
			Thread.sleep(3000);
		}

		@AfterAll
		void stopOidc() {
			this.idpServer.shutdown();
		}

		@Test
		@DisplayName("OIDC code based authentication")
		void oidcCodeAuth() throws IOException, InterruptedException {
			final String username = "oidcreadwrite";
			final UiUser.Role role = UiUser.Role.READWRITE;
			final String authorizationCode = "apzoeilpqoisdmlkaze120398O2374lmakzhe123";
			this.idpServer.addAuthorizatioCode(authorizationCode, username, role.getName());

			// Authentication attempt with wrong authorization code
			apiClient.setOidcCodeLogin("wrongcode", redirectUri.toString());
			WrongApiResponseException thrown = Assertions.assertThrows(WrongApiResponseException.class,
				() -> apiClient.get("/user"),
				"Login not failing as expected");
			Assertions.assertEquals(
				Response.Status.UNAUTHORIZED.getStatusCode(), thrown.getResponse().statusCode(),
				"Not getting 401 when logging in with wrong authorization code");

			// Authentication attempt with proper authorization code
			apiClient.setOidcCodeLogin(authorizationCode, redirectUri.toString());
			HttpResponse<JsonNode> response2 = apiClient.get("/user");
			Assertions.assertEquals(
				Response.Status.OK.getStatusCode(), response2.statusCode(),
				"Unable to get user profile after OIDC code and cookie API access");
			Assertions.assertEquals(
				JsonNodeFactory.instance.objectNode()
					.put("id", Long.valueOf(0))
					.put("local", false)
					.put("username", username)
					.put("level", Long.valueOf(role.getLevel())),
				response2.body(),
				"Retrieved user doesn't match expected object");

			// Permission test
			HttpResponse<JsonNode> response = apiClient.get("/apitokens");
			Assertions.assertEquals(Response.Status.FORBIDDEN.getStatusCode(), response.statusCode(),
				"Not getting 403 response while missing privileges");
			Assertions.assertInstanceOf(MissingNode.class,
				response.body(), "Response body not empty");

			// Forced logout and try again with cookie
			HttpCookie sessionCookie = apiClient.getSessionCookie();
			apiClient.logout();
			apiClient.addSessionCookie(sessionCookie);
			HttpResponse<JsonNode> response3 = apiClient.get("/domains");
			Assertions.assertEquals(
				Response.Status.UNAUTHORIZED.getStatusCode(), response3.statusCode(),
				"Not getting 401 response for post-logout request");
		}

		@Test
		@DisplayName("OIDC idle timeout")
		void oidcIdleTimeout() throws IOException, InterruptedException {
			final String username = "oidcreadonly";
			final UiUser.Role role = UiUser.Role.READONLY;
			final String authorizationCode = "pAmljUL1h23JKDSo1kjoi23KJSDnhkj028Jkj";
			this.idpServer.addAuthorizatioCode(authorizationCode, username, role.getName());

			apiClient.setOidcCodeLogin(authorizationCode, redirectUri.toString());
			{
				HttpResponse<JsonNode> response = apiClient.get("/user");
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Unable to get user profile after OIDC code and cookie API access");
				Assertions.assertEquals(
					JsonNodeFactory.instance.objectNode()
						.put("id", Long.valueOf(0))
						.put("local", false)
						.put("username", username)
						.put("level", Long.valueOf(role.getLevel())),
					response.body(),
					"Retrieved user doesn't match expected object");
			}
			Thread.sleep(Duration.ofSeconds(5));
			{
				HttpResponse<JsonNode> response = apiClient.get("/user");
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Unable to get user profile before reaching idle timeout");
			}
			Thread.sleep(Duration.ofSeconds(8));
			{
				HttpResponse<JsonNode> response = apiClient.get("/user");
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Unable to get user profile before reaching idle timeout");
			}
			Thread.sleep(Duration.ofSeconds(15));
			{
				HttpResponse<JsonNode> response = apiClient.get("/user");
				Assertions.assertEquals(
					Response.Status.UNAUTHORIZED.getStatusCode(), response.statusCode(),
					"The session didn't expire after idle timeout as planned");
			}
		}
	}

	@Nested
	@DisplayName("Admin API Tests")
	class AdminTest {

		@Nested
		@DisplayName("Domain API Tests")
		class DomainTest {

			@AfterEach
			void cleanUpData() {
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session
						.createMutationQuery("delete from Domain")
						.executeUpdate();
					session.getTransaction().commit();
				}
			}

			@Test
			@DisplayName("List domains")
			@ResourceLock("DB")
			void listDomains() throws IOException, InterruptedException {
				{
					HttpResponse<JsonNode> response = apiClient.get("/domains");
					Assertions.assertEquals(
						Response.Status.OK.getStatusCode(), response.statusCode(),
						"Not getting 200 response for initial list");
					Assertions.assertEquals(0, response.body().size(),
						"Domain list is not empty");
				}
				Domain domain1 = new Domain(
					"Test1", "Test Domain1 for listing",
					new Network4Address("10.1.1.1"),
					null
				);
				Domain domain2 = new Domain(
					"Test2", "Test Domain2 for listing",
					new Network4Address("10.1.2.1"),
					null
				);
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session.persist(domain1);
					session.persist(domain2);
					session.getTransaction().commit();
				}
				{
					HttpResponse<JsonNode> response = apiClient.get("/domains");
					Assertions.assertEquals(
						Response.Status.OK.getStatusCode(), response.statusCode(),
						"Not getting 200 response for domain list");
					Assertions.assertEquals(2, response.body().size(),
						"Domain list doesn't have 2 elements");
					Iterator<JsonNode> domainNodeIt = response.body().iterator();
					JsonNode domainNode1 = domainNodeIt.next();
					Assertions.assertEquals(
						JsonNodeFactory.instance.objectNode()
							.put("id", domain1.getId())
							.put("name", domain1.getName())
							.put("description", domain1.getDescription())
							.put("ipAddress", domain1.getServer4Address().getIp()),
						domainNode1,
						"Retrieved domain doesn't match expected object");
				}
			}

			@Test
			@DisplayName("List domains with pagination")
			@ResourceLock("DB")
			void listPaginatedDomains() throws IOException, InterruptedException {
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					for (int i = 1; i <= 15; i++) {
						Domain domain = new Domain(
							"Test%d".formatted(i),
							"Test Domain%d for pagination".formatted(i),
							new Network4Address("10.1.%d.1".formatted(i)),
							null
						);
						session.persist(domain);
					}
					session.getTransaction().commit();
				}
				{
					HttpResponse<JsonNode> response = apiClient.get("/domains?limit=10");
					Assertions.assertEquals(
						Response.Status.OK.getStatusCode(), response.statusCode(),
						"Not getting 200 response for domain list");
					Assertions.assertEquals(10, response.body().size(),
						"Domain list doesn't have 10 elements");
					JsonNode firstNode = response.body().iterator().next();
					Assertions.assertEquals("Test1", firstNode.get("name").asText());
				}
				{
					HttpResponse<JsonNode> response = apiClient.get("/domains?limit=10&offset=10");
					Assertions.assertEquals(
						Response.Status.OK.getStatusCode(), response.statusCode(),
						"Not getting 200 response for domain list");
					Assertions.assertEquals(5, response.body().size(),
						"Domain list doesn't have 5 elements");
					JsonNode firstNode = response.body().iterator().next();
					Assertions.assertEquals("Test11", firstNode.get("name").asText());
				}
			}


			@Test
			@DisplayName("Create domain")
			@ResourceLock("DB")
			void createDomain() throws IOException, InterruptedException {
				Domain domain = new Domain(
					"Test", "Test Domain for creation",
					new Network4Address("10.1.1.1"),
					null
				);
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("name", domain.getName())
					.put("description", domain.getDescription())
					.put("ipAddress", domain.getServer4Address().getIp());
				HttpResponse<JsonNode> response = apiClient.post("/domains", data);
				Assertions.assertEquals(
					Response.Status.CREATED.getStatusCode(), response.statusCode(),
					"Not getting 201 response for created domain");

				try (Session session = Database.getSession()) {
					Domain newDomain = session
						.createQuery("from Domain d where d.name = :name", Domain.class)
						.setParameter("name", domain.getName())
						.uniqueResult();
					domain.setId(newDomain.getId());
					Assertions.assertEquals(domain, newDomain, "Domain not created as expected");
				}
			}

			@Test
			@DisplayName("Delete domain")
			@ResourceLock("DB")
			void deleteDomain() throws IOException, InterruptedException {
				Domain domain1 = new Domain(
					"Test1", "Test Domain1 for deletion",
					new Network4Address("10.1.1.1"),
					null
				);
				Domain domain2 = new Domain(
					"Test2", "Test Domain2 for deletion",
					new Network4Address("10.1.2.1"),
					null
				);
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session.persist(domain1);
					session.persist(domain2);
					session.getTransaction().commit();
				}
				{
					HttpResponse<JsonNode> response = apiClient.delete(
						"/domains/%d".formatted(UNKNOWN_ID));
					Assertions.assertEquals(
						Response.Status.NOT_FOUND.getStatusCode(), response.statusCode(),
						"Not getting 404 response for unknown domain deletion");
				}
				{
					HttpResponse<JsonNode> response = apiClient.delete(
						"/domains/%d".formatted(domain1.getId()));
					Assertions.assertEquals(
						Response.Status.NO_CONTENT.getStatusCode(), response.statusCode(),
						"Not getting 204 response for domain deletion");
				}
				HttpResponse<JsonNode> listResponse = apiClient.get("/domains");
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), listResponse.statusCode(),
					"Not getting 200 response for domain listing");
				Assertions.assertEquals(1, listResponse.body().size(),
					"Domain list doesn't have 1 element");
				JsonNode domainNode = listResponse.body().iterator().next();
				Assertions.assertEquals(
					JsonNodeFactory.instance.objectNode()
						.put("id", domain2.getId())
						.put("name", domain2.getName())
						.put("description", domain2.getDescription())
						.put("ipAddress", domain2.getServer4Address().getIp()),
					domainNode,
					"Retrieved domain doesn't match expected object");
			}

			@Test
			@DisplayName("Update domain")
			@ResourceLock("DB")
			void updateDomain() throws IOException, InterruptedException {
				Domain domain = new Domain(
					"Test1", "Test Domain1 for update",
					new Network4Address("10.1.1.1"),
					null
				);
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session.persist(domain);
					session.getTransaction().commit();
				}
				Domain targetDomain = new Domain(
					"Test2", "Test Domain2 for update",
					new Network4Address("10.1.2.1"),
					null
				);
				targetDomain.setId(domain.getId());

				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("name", targetDomain.getName())
					.put("description", targetDomain.getDescription())
					.put("ipAddress", targetDomain.getServer4Address().getIp());
				{
					HttpResponse<JsonNode> response = apiClient.put(
						"/domains/%d".formatted(UNKNOWN_ID), data);
					Assertions.assertEquals(
						Response.Status.NOT_FOUND.getStatusCode(), response.statusCode(),
						"Not getting 404 response for unknown domain update");
				}
				{
					HttpResponse<JsonNode> response = apiClient.put(
						"/domains/%d".formatted(domain.getId()), data);
					Assertions.assertEquals(
						Response.Status.OK.getStatusCode(), response.statusCode(),
						"Not getting 200 response for domain update");
				}
				try (Session session = Database.getSession()) {
					Domain dbDomain = session.byId(Domain.class)
						.load(targetDomain.getId());
					Assertions.assertEquals(
						targetDomain, dbDomain, "Domain not updated as expected");
				}
			}
		}

		@Nested
		@DisplayName("User management API Tests")
		class UserTest {

			@AfterEach
			void cleanUpData() {
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session
						.createMutationQuery("delete from net.netshot.netshot.aaa.UiUser")
						.executeUpdate();
					session.getTransaction().commit();
				}
			}

			@Test
			@DisplayName("List users")
			@ResourceLock("DB")
			void listUsers() throws IOException, InterruptedException {
				{
					HttpResponse<JsonNode> response = apiClient.get("/users");
					Assertions.assertEquals(
						Response.Status.OK.getStatusCode(), response.statusCode(),
						"Not getting 200 response for initial list");
					Assertions.assertEquals(0, response.body().size(),
						"User list is not empty");
				}
				UiUser user1 = new UiUser("user1", true, "pass1");
				user1.setLevel(UiUser.LEVEL_EXECUTEREADWRITE);
				UiUser user2 = new UiUser("user2", false, "pass2");
				user2.setLevel(UiUser.LEVEL_READONLY);
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session.persist(user1);
					session.persist(user2);
					session.getTransaction().commit();
				}
				{
					HttpResponse<JsonNode> response = apiClient.get("/users");
					Assertions.assertEquals(
						Response.Status.OK.getStatusCode(), response.statusCode(),
						"Not getting 200 response for user list");
					Assertions.assertEquals(2, response.body().size(),
						"User list doesn't have 2 elements");
					Iterator<JsonNode> userNodeIt = response.body().iterator();
					JsonNode userNode1 = userNodeIt.next();
					Assertions.assertEquals(
						JsonNodeFactory.instance.objectNode()
							.put("id", user1.getId())
							.put("local", user1.isLocal())
							.put("username", user1.getUsername())
							.put("level", Long.valueOf(user1.getLevel())),
						userNode1,
						"Retrieved user doesn't match expected object");
					JsonNode userNode2 = userNodeIt.next();
					Assertions.assertEquals(
						JsonNodeFactory.instance.objectNode()
							.put("id", user2.getId())
							.put("local", user2.isLocal())
							.put("username", user2.getUsername())
							.put("level", Long.valueOf(user2.getLevel())),
						userNode2,
						"Retrieved user doesn't match expected object");
				}
			}


			@Test
			@DisplayName("Create user")
			@ResourceLock("DB")
			void createUser() throws IOException, InterruptedException {
				String password = "userpass";
				UiUser user = new UiUser("newuser", true, password);
				user.setLevel(UiUser.LEVEL_EXECUTEREADWRITE);
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("username", user.getUsername())
					.put("password", password)
					.put("level", Long.valueOf(user.getLevel()))
					.put("local", user.isLocal());
				HttpResponse<JsonNode> response = apiClient.post("/users", data);
				Assertions.assertEquals(
					Response.Status.CREATED.getStatusCode(), response.statusCode(),
					"Not getting 201 response for created user");

				try (Session session = Database.getSession()) {
					UiUser newUser = session
						.createQuery("from net.netshot.netshot.aaa.UiUser u where u.username = :name", UiUser.class)
						.setParameter("name", user.getUsername())
						.uniqueResult();
					Assertions.assertEquals(user.getUsername(), newUser.getUsername(), "User not created as expected");
					Assertions.assertEquals(user.getLevel(), newUser.getLevel(), "User not created as expected");
					Assertions.assertEquals(user.isLocal(), newUser.isLocal(), "User not created as expected");
				}
			}

			@Test
			@DisplayName("Delete user")
			@ResourceLock("DB")
			void deleteUser() throws IOException, InterruptedException {
				UiUser user1 = new UiUser("user1", true, "pass1");
				user1.setLevel(UiUser.LEVEL_EXECUTEREADWRITE);
				UiUser user2 = new UiUser("user2", false, "pass2");
				user2.setLevel(UiUser.LEVEL_READONLY);
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session.persist(user1);
					session.persist(user2);
					session.getTransaction().commit();
				}
				HttpResponse<JsonNode> response = apiClient.delete(
					"/users/%d".formatted(user1.getId()));
				Assertions.assertEquals(
					Response.Status.NO_CONTENT.getStatusCode(), response.statusCode(),
					"Not getting 204 response for user deletion");
				HttpResponse<JsonNode> listResponse = apiClient.get("/users");
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), listResponse.statusCode(),
					"Not getting 200 response for user listing");
				Assertions.assertEquals(1, listResponse.body().size(),
					"User list doesn't have 1 element");
				JsonNode userNode = listResponse.body().iterator().next();
				Assertions.assertEquals(
					JsonNodeFactory.instance.objectNode()
						.put("id", user2.getId())
						.put("local", user2.isLocal())
						.put("username", user2.getUsername())
						.put("level", Long.valueOf(user2.getLevel())),
					userNode,
					"Retrieved user doesn't match expected object");
			}

			@Test
			@DisplayName("Update user")
			@ResourceLock("DB")
			void updateUser() throws IOException, InterruptedException {
				UiUser user = new UiUser("user1", true, "pass1");
				user.setLevel(UiUser.LEVEL_EXECUTEREADWRITE);
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session.persist(user);
					session.getTransaction().commit();
				}
				UiUser targetUser = new UiUser("user2", true, "pass1");
				targetUser.setLevel(UiUser.LEVEL_READONLY);
				targetUser.setHashedPassword(user.getHashedPassword());
				targetUser.setId(user.getId());
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("local", targetUser.isLocal())
					.put("username", targetUser.getUsername())
					.put("level", Long.valueOf(targetUser.getLevel()));
				HttpResponse<JsonNode> response = apiClient.put(
					"/users/%d".formatted(user.getId()), data);
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response for user update");
				try (Session session = Database.getSession()) {
					UiUser dbUser = session.byId(UiUser.class)
						.load(targetUser.getId());
					Assertions.assertEquals(targetUser.getName(), dbUser.getName(),
						"User not updated as expected");
					Assertions.assertEquals(targetUser.getLevel(), dbUser.getLevel(),
						"User not updated as expected");
				}
			}

			@Test
			@DisplayName("Update remote user")
			@ResourceLock("DB")
			void updateRemoteUser() throws IOException, InterruptedException {
				UiUser user = new UiUser("user1", false, "pass1");
				user.setLevel(UiUser.LEVEL_OPERATOR);
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session.persist(user);
					session.getTransaction().commit();
				}
				UiUser targetUser = new UiUser("user2", true, "pass1");
				targetUser.setLevel(UiUser.LEVEL_OPERATOR);
				targetUser.setHashedPassword(user.getHashedPassword());
				targetUser.setId(user.getId());
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("local", true)
					.put("username", targetUser.getUsername())
					.put("level", Long.valueOf(targetUser.getLevel()));
				{
					HttpResponse<JsonNode> response = apiClient.put(
						"/users/%d".formatted(user.getId()), data);
					Assertions.assertEquals(
						Response.Status.BAD_REQUEST.getStatusCode(), response.statusCode(),
						"Not getting 400 response for erroneous user update");
				}
				data.put("password", "pass2");
				{
					HttpResponse<JsonNode> response = apiClient.put(
						"/users/%d".formatted(user.getId()), data);
					Assertions.assertEquals(
						Response.Status.OK.getStatusCode(), response.statusCode(),
						"Not getting 200 response for user update");
				}
				try (Session session = Database.getSession()) {
					UiUser dbUser = session.byId(UiUser.class)
						.load(targetUser.getId());
					Assertions.assertEquals(targetUser.getName(), dbUser.getName(),
						"User not updated as expected");
					Assertions.assertEquals(targetUser.getLevel(), dbUser.getLevel(),
						"User not updated as expected");
					Assertions.assertEquals(targetUser.isLocal(), dbUser.isLocal(),
						"User not updated as expected");
				}
			}
		}

		@Nested
		@DisplayName("API token management API Tests")
		class ApiTokenTest {

			@Test
			@DisplayName("List tokens")
			@ResourceLock("DB")
			void listTokens() throws IOException, InterruptedException {
				// Tokens already created like before all tests
				HttpResponse<JsonNode> response = apiClient.get("/apitokens");
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response for token list");
				Assertions.assertEquals(API_TOKENS.size(), response.body().size(),
					"User list doesn't have as many elements as API_TOKENS");
			}


			@Test
			@DisplayName("Create token")
			@ResourceLock("DB")
			void createToken() throws IOException, InterruptedException {
				String tokenString = "dZLV0zCn5gmbUJIebRHBxM4QjIAoNruK";
				ApiToken token = new ApiToken(
					"Test API token",
					tokenString,
					UiUser.LEVEL_READWRITE
				);
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("description", token.getDescription())
					.put("token", tokenString)
					.put("level", token.getLevel());
				HttpResponse<JsonNode> response = apiClient.post("/apitokens", data);
				Assertions.assertEquals(
					Response.Status.CREATED.getStatusCode(), response.statusCode(),
					"Not getting 201 response for created API token");

				try (Session session = Database.getSession()) {
					ApiToken newToken = session
						.createQuery("from ApiToken t where t.description = :description", ApiToken.class)
						.setParameter("description", token.getDescription())
						.uniqueResult();
					Assertions.assertEquals(token.getLevel(), newToken.getLevel(),
						"Token not created as expected");
				}
			}

			@Test
			@DisplayName("Delete token")
			@ResourceLock("DB")
			void deleteToken() throws IOException, InterruptedException {
				ApiToken token1 = new ApiToken(
					"Temp token", "dZLV0zCn5gmbUJIebRHBxM4QjIAoNruK", UiUser.LEVEL_OPERATOR);
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session.persist(token1);
					session.getTransaction().commit();
				}
				HttpResponse<JsonNode> response = apiClient.delete(
					"/apitokens/%d".formatted(token1.getId()));
				Assertions.assertEquals(
					Response.Status.NO_CONTENT.getStatusCode(), response.statusCode(),
					"Not getting 204 response for token deletion");
				HttpResponse<JsonNode> listResponse = apiClient.get("/apitokens");
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), listResponse.statusCode(),
					"Not getting 200 response for token listing");
				Assertions.assertEquals(API_TOKENS.size(), listResponse.body().size(),
					"User list doesn't have the right number of elements");
			}
		}

	}

	@Nested
	@DisplayName("Device tests")
	@ResourceLock("DB")
	class DeviceTest {

		private String testDomainName = "Domain 1";
		private Domain testDomain;

		private static enum DeviceField {
			AUTO_TRY_CREDENTIALS(Device::isAutoTryCredentials),
			CONTACT(Device::getContact),
			CREATED_DATE(Device::getCreatedDate),
			CREATOR(Device::getCreator),
			SPECIFIC_CREDENTIAL_SET(Device::getSpecificCredentialSet),
			DRIVER(Device::getDriver),
			EOL_DATE(Device::getEolDate),
			EOS_DATE(Device::getEosDate),
			FAMILY(Device::getFamily),
			LOCATION(Device::getLocation),
			MGMT_ADDRESS(Device::getMgmtAddress),
			NAME(Device::getName),
			NETWORK_CLASS(Device::getNetworkClass),
			SERIAL_NUMBER(Device::getSerialNumber),
			SOFTWARE_LEVEL(Device::getSoftwareLevel),
			SOFTWARE_VERSION(Device::getSoftwareVersion),
			STATUS(Device::getStatus),
			SSH_PORT(Device::getSshPort),
			TELNET_PORT(Device::getTelnetPort),
			CONNECT_ADDRESS(Device::getConnectAddress),
			COMMENTS(Device::getComments);

			private Function<Device, ?> getter;

			private DeviceField(Function<Device, ?> getter) {
				this.getter = getter;
			}
		}

		private void createTestDomain() throws IOException {
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				this.testDomain = new Domain(
					this.testDomainName, "Test Domain for devices",
					new Network4Address("10.1.1.1"),
					null
				);
				session.persist(this.testDomain);
				session.getTransaction().commit();
			}
		}

		private DeviceDriver getTestDriver() {
			return DeviceDriver.getDriverByName("CiscoIOS12");
		}

		private void assertDevicesEqual(Device d1, Device d2, DeviceField... ignoredFields) {
			List<DeviceField> iFields = Arrays.asList(ignoredFields);
			for (DeviceField field : DeviceField.values()) {
				if (!iFields.contains(field)) {
					Object v1 = field.getter.apply(d1);
					Object v2 = field.getter.apply(d2);
					if ((v1 == null && v2 != null) || (v1 != null && !v1.equals(v2))) {
						Assertions.fail("Passed devices are not equal, check field %s".formatted(field.name()));
					}
				}
			}
		}

		@BeforeAll
		static void loadDrivers() throws Exception {
			DeviceDriver.refreshDrivers();
		}

		@AfterEach
		void cleanUpData() {
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				session
					.createMutationQuery("delete from Device")
					.executeUpdate();
				session
					.createMutationQuery("delete from Domain")
					.executeUpdate();
				session.getTransaction().commit();
			}
		}

		@Test
		@DisplayName("List device types")
		void listDeviceTypes() throws Exception {
			List<DeviceDriver> drivers = DeviceDriver.getAllDrivers();
			HttpResponse<JsonNode> response = apiClient.get("/devicetypes");
			Assertions.assertEquals(
				Response.Status.OK.getStatusCode(), response.statusCode(),
				"Not getting 200 response for device type list");
			Assertions.assertEquals(
				drivers.size(), response.body().size(),
				"Not getting the right number of device drivers");
			DeviceDriver testDriver = this.getTestDriver();
			JsonNode testDriverNode = null;
			Iterator<JsonNode> driverIt = response.body().iterator();
			while (driverIt.hasNext()) {
				JsonNode driverNode = driverIt.next();
				if (driverNode.get("name").asText().equals(testDriver.getName())) {
					testDriverNode = driverNode;
				}
			}
			Assertions.assertNotNull(testDriverNode, "API didn't return test driver");

			ObjectNode targetData = JsonNodeFactory.instance.objectNode()
				.put("name", testDriver.getName())
				.put("author", testDriver.getAuthor())
				.put("description", testDriver.getDescription())
				.put("version", testDriver.getVersion())
				.put("priority", Long.valueOf(testDriver.getPriority()));
			for (AttributeDefinition attribute : testDriver.getAttributes()) {
				targetData.withArray("attributes").add(
					JsonNodeFactory.instance.objectNode()
						.put("type", attribute.getType().toString())
						.put("level", attribute.getLevel().toString())
						.put("name", attribute.getName())
						.put("title", attribute.getTitle())
						.put("comparable", attribute.isComparable())
						.put("searchable", attribute.isSearchable())
						.put("checkable", attribute.isCheckable())
				);
			}
			for (DriverProtocol protocol : testDriver.getProtocols()) {
				targetData.withArray("protocols")
					.add(protocol.toString());
			}
			for (String mode : testDriver.getCliMainModes()) {
				targetData.withArray("cliMainModes").add(mode);
			}
			targetData.put("sourceHash", testDriver.getSourceHash())
				.set("location", JsonNodeFactory.instance.objectNode()
					.put("type", testDriver.getLocation().getType().toString())
					.put("fileName", testDriver.getLocation().getFileName()));
			if (testDriver.getSshConfig() != null) {
				targetData.set("sshConfig", JsonNodeFactory.instance.objectNode());
			}
			if (testDriver.getTelnetConfig() != null) {
				targetData.set("telnetConfig",
					JsonNodeFactory.instance.objectNode()
						.put("terminalType", testDriver.getTelnetConfig().getTerminalType()));
			}
			Assertions.assertEquals(targetData, testDriverNode,
				"Retrieved device type doesn't match expected object");
		}

		@Test
		@DisplayName("List devices")
		@ResourceLock("DB")
		void listDevices() throws IOException, InterruptedException {
			{
				HttpResponse<JsonNode> response = apiClient.get("/devices");
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response for initial list");
				Assertions.assertEquals(0, response.body().size(),
					"Device list is not empty");
			}
			this.createTestDomain();
			Device device1 = new Device(this.getTestDriver().getName(),
				new Network4Address("10.1.1.1"), this.testDomain, "test");
			device1.setName("device1");
			Device device2 = new Device(this.getTestDriver().getName(),
				new Network4Address("10.1.1.2"), this.testDomain, "test");
			device2.setName("device2");
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				session.persist(device1);
				session.persist(device2);
				session.getTransaction().commit();
			}
			{
				HttpResponse<JsonNode> response = apiClient.get("/devices");
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response for device list");
				Assertions.assertEquals(2, response.body().size(),
					"Device list doesn't have 2 elements");
				Iterator<JsonNode> deviceNodeIt = response.body().iterator();
				JsonNode deviceNode1 = deviceNodeIt.next();
				Assertions.assertEquals(
					JsonNodeFactory.instance.objectNode()
						.put("id", device1.getId())
						.put("name", device1.getName())
						.put("family", device1.getFamily())
						.put("mgmtAddress", device1.getMgmtAddress().getIp())
						.put("status", device1.getStatus().toString())
						.put("driver", device1.getDriver())
						.put("eol", device1.isEndOfLife())
						.put("eos", device1.isEndOfSale())
						.put("configCompliant", device1.isCompliant())
						.put("serialNumber", device1.getSerialNumber())
						.put("softwareLevel", device1.getSoftwareLevel().toString()),
					deviceNode1,
					"Retrieved device doesn't match expected object");
			}
		}

		@Test
		@DisplayName("Get device")
		@ResourceLock("DB")
		void getDevice() throws IOException, InterruptedException, MissingDeviceDriverException {
			this.createTestDomain();
			Device device1 = new Device(this.getTestDriver().getName(),
				new Network4Address("10.1.1.1"), this.testDomain, "test");
			device1.setName("device1");
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				session.persist(device1);
				session.getTransaction().commit();
			}
			{
				HttpResponse<JsonNode> response = apiClient.get("/devices/%d".formatted(UNKNOWN_ID));
				Assertions.assertEquals(
					Response.Status.NOT_FOUND.getStatusCode(), response.statusCode(),
					"Not getting 404 response for nonexistent device");
			}
			{
				HttpResponse<JsonNode> response = apiClient.get("/devices/%d".formatted(device1.getId()));
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response for device");
				JsonNode deviceNode1 = response.body();
				ObjectNode expectedNode1 = JsonNodeFactory.instance.objectNode()
					.put("id", device1.getId())
					.put("name", device1.getName())
					.put("networkClass", device1.getNetworkClass().toString())
					.put("family", device1.getFamily())
					.put("mgmtAddress", device1.getMgmtAddress().getIp())
					.putNull("connectAddress")
					.put("status", device1.getStatus().toString())
					.put("driver", device1.getDriver())
					.put("realDeviceType", device1.getDeviceDriver().getDescription())
					.put("serialNumber", device1.getSerialNumber())
					.put("softwareVersion", device1.getSoftwareVersion())
					.put("softwareLevel", device1.getSoftwareLevel().toString())
					.put("contact", device1.getContact())
					.put("location", device1.getLocation())
					.put("creator", device1.getCreator())
					.put("changeDate", device1.getChangeDate().getTime())
					.put("createdDate", device1.getCreatedDate().getTime())
					.putNull("specificCredentialSet")
					.putNull("eolDate")
					.putNull("eolModule")
					.putNull("eosDate")
					.putNull("eosModule")
					.put("endOfLife", device1.isEndOfLife())
					.put("endOfSale", device1.isEndOfSale())
					.put("compliant", device1.isCompliant())
					.put("autoTryCredentials", device1.isAutoTryCredentials())
					.put("comments", device1.getComments())
					.put("sshPort", Integer.toUnsignedLong(device1.getSshPort()))
					.put("telnetPort", Integer.toUnsignedLong(device1.getTelnetPort()));
				expectedNode1.putArray("ownerGroups");
				expectedNode1.putArray("attributes");
				expectedNode1.putArray("credentialSetIds");
				expectedNode1.putArray("credentialSets");
				expectedNode1.set("mgmtDomain",
					JsonNodeFactory.instance.objectNode()
						.put("id", device1.getMgmtDomain().getId())
						.put("name", device1.getMgmtDomain().getName())
						.put("changeDate", device1.getMgmtDomain().getChangeDate().getTime())
						.put("description", device1.getMgmtDomain().getDescription())
						.put("server4Address", device1.getMgmtDomain().getServer4Address().getIp())
						.putNull("server6Address"));
				Assertions.assertEquals(expectedNode1, deviceNode1,
					"Retrieved device doesn't match expected object");
			}
		}

		@Test
		@DisplayName("Create device")
		@ResourceLock("DB")
		void createDevice() throws IOException, InterruptedException {
			this.createTestDomain();
			Device device1 = new Device(this.getTestDriver().getName(),
				new Network4Address("10.1.1.1"), this.testDomain, "test");
			ObjectNode data = JsonNodeFactory.instance.objectNode()
				.put("autoDiscover", false)
				.put("ipAddress", device1.getMgmtAddress().getIp())
				.put("domainId", this.testDomain.getId())
				.put("name", device1.getName())
				.put("deviceType", device1.getDriver());
			{
				HttpResponse<JsonNode> response = apiClient.post("/devices",
					data.deepCopy().put("domainId", UNKNOWN_ID));
				Assertions.assertEquals(
					Response.Status.BAD_REQUEST.getStatusCode(), response.statusCode(),
					"Not getting 400 response for invalid domain");
			}
			{
				HttpResponse<JsonNode> response = apiClient.post("/devices",
					data.deepCopy().put("deviceType", "NonExistingDriver"));
				Assertions.assertEquals(
					Response.Status.BAD_REQUEST.getStatusCode(), response.statusCode(),
					"Not getting 400 response for invalid domain");
			}
			{
				HttpResponse<JsonNode> response = apiClient.post("/devices", data);
				Assertions.assertEquals(
					Response.Status.CREATED.getStatusCode(), response.statusCode(),
					"Not getting 201 response for created device");
			}

			try (Session session = Database.getSession()) {
				Device newDevice = session
					.createQuery("from Device d", Device.class)
					.uniqueResult();
				device1.setId(newDevice.getId());
				this.assertDevicesEqual(device1, newDevice,
					DeviceField.CREATED_DATE, DeviceField.CREATOR);
			}
		}

		@Test
		@DisplayName("Create devices with same management address")
		@ResourceLock("DB")
		void createDevicesWithSameMgmtAddress() throws IOException, InterruptedException {
			this.createTestDomain();
			Device device1 = FakeDeviceFactory.getFakeCiscoIosDevice(this.testDomain, null, 0);
			ObjectNode data = JsonNodeFactory.instance.objectNode()
				.put("autoDiscover", false)
				.put("ipAddress", device1.getMgmtAddress().getIp())
				.put("domainId", this.testDomain.getId())
				.put("name", device1.getName())
				.put("deviceType", device1.getDriver());
			{
				HttpResponse<JsonNode> response = apiClient.post("/devices", data);
				Assertions.assertEquals(
					Response.Status.CREATED.getStatusCode(), response.statusCode(),
					"Not getting 201 response for created device");
			}
			try (Session session = Database.getSession()) {
				Device newDevice = session
					.createQuery("from Device d where d.mgmtAddress = :ip", Device.class)
					.setParameter("ip", device1.getMgmtAddress())
					.uniqueResult();
				device1.setId(newDevice.getId());
			}
			{
				HttpResponse<JsonNode> response = apiClient.post("/devices", data);
				Assertions.assertEquals(
					Response.Status.CONFLICT.getStatusCode(), response.statusCode(),
					"Not getting 409 response for duplicated device");
			}
			{
				// Disable first device
				ObjectNode editData = JsonNodeFactory.instance.objectNode()
					.put("enabled", false);
				HttpResponse<JsonNode> response = apiClient.put(
					"/devices/%d".formatted(device1.getId()), editData);
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response for edited device");
			}
			{
				// New creation attempt
				HttpResponse<JsonNode> response = apiClient.post("/devices", data);
				Assertions.assertEquals(
					Response.Status.CREATED.getStatusCode(), response.statusCode(),
					"Not getting 201 response for second created device");
			}
			{
				// Try to re-enable first device
				ObjectNode editData = JsonNodeFactory.instance.objectNode()
					.put("enabled", true);
				HttpResponse<JsonNode> response = apiClient.put(
					"/devices/%d".formatted(device1.getId()), editData);
				Assertions.assertEquals(
					Response.Status.CONFLICT.getStatusCode(), response.statusCode(),
					"Not getting 409 response for edited device");
			}
		}

		@Test
		@DisplayName("Delete device")
		@ResourceLock("DB")
		void deleteDevice() throws IOException, InterruptedException {
			this.createTestDomain();
			Device device1 = new Device(this.getTestDriver().getName(),
				new Network4Address("10.1.1.1"), this.testDomain, "test");
			device1.setName("device1");
			Device device2 = new Device(this.getTestDriver().getName(),
				new Network4Address("10.1.1.2"), this.testDomain, "test");
			device2.setName("device2");
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				session.persist(device1);
				session.persist(device2);
				session.getTransaction().commit();
			}
			{
				HttpResponse<JsonNode> response = apiClient.delete(
					"/devices/%d".formatted(UNKNOWN_ID));
				Assertions.assertEquals(
					Response.Status.NOT_FOUND.getStatusCode(), response.statusCode(),
					"Not getting 404 response for unknown device deletion");
			}
			{
				HttpResponse<JsonNode> response = apiClient.delete(
					"/devices/%d".formatted(device1.getId()));
				Assertions.assertEquals(
					Response.Status.NO_CONTENT.getStatusCode(), response.statusCode(),
					"Not getting 204 response for device deletion");
			}
			HttpResponse<JsonNode> listResponse = apiClient.get("/devices");
			Assertions.assertEquals(
				Response.Status.OK.getStatusCode(), listResponse.statusCode(),
				"Not getting 200 response for device listing");
			Assertions.assertEquals(1, listResponse.body().size(),
				"Device list doesn't have 1 element");
			JsonNode deviceNode = listResponse.body().iterator().next();
			Assertions.assertEquals(
				JsonNodeFactory.instance.objectNode()
					.put("id", device2.getId())
					.put("name", device2.getName())
					.put("family", device2.getFamily())
					.put("mgmtAddress", device2.getMgmtAddress().getIp())
					.put("status", device2.getStatus().toString())
					.put("driver", device2.getDriver())
					.put("serialNumber", device2.getSerialNumber())
					.put("eol", device2.isEndOfLife())
					.put("eos", device2.isEndOfSale())
					.put("configCompliant", device2.isCompliant())
					.put("softwareLevel", device2.getSoftwareLevel().toString()),
				deviceNode,
				"Retrieved device doesn't match expected object");
		}

		@Test
		@DisplayName("Edit device")
		@ResourceLock("DB")
		void editDevice() throws IOException, InterruptedException {
			this.createTestDomain();
			Device device1 = FakeDeviceFactory.getFakeCiscoIosDevice(this.testDomain, null, 1);
			Device device2 = FakeDeviceFactory.getFakeCiscoIosDevice(this.testDomain, null, 2);
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				session.persist(device1);
				session.persist(device2);
				session.getTransaction().commit();
			}
			{
				ObjectNode editData = JsonNodeFactory.instance.objectNode()
					.put("enabled", false);
				HttpResponse<JsonNode> response = apiClient.put(
					"/devices/%d".formatted(UNKNOWN_ID), editData);
				Assertions.assertEquals(
					Response.Status.NOT_FOUND.getStatusCode(), response.statusCode(),
					"Not getting 404 response for unknown edited device");
			}
			{
				ObjectNode editData = JsonNodeFactory.instance.objectNode()
					.put("enabled", false);
				HttpResponse<JsonNode> response = apiClient.put(
					"/devices/%d".formatted(device1.getId()), editData);
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response for edited device");

				try (Session session = Database.getSession()) {
					Device editedDevice = session
						.createQuery("from Device d where d.id = :id", Device.class)
						.setParameter("id", device1.getId())
						.uniqueResult();
					Assertions.assertEquals(Device.Status.DISABLED, editedDevice.getStatus(),
						"The edited device is not disabled");
					this.assertDevicesEqual(device1, editedDevice, DeviceField.STATUS);
				}
			}
			{
				ObjectNode editData = JsonNodeFactory.instance.objectNode()
					.put("enabled", true);
				HttpResponse<JsonNode> response = apiClient.put(
					"/devices/%d".formatted(device1.getId()), editData);
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response for edited device");

				try (Session session = Database.getSession()) {
					Device editedDevice = session
						.createQuery("from Device d where d.id = :id", Device.class)
						.setParameter("id", device1.getId())
						.uniqueResult();
					Assertions.assertEquals(Device.Status.INPRODUCTION, editedDevice.getStatus(),
						"The edited device is not enabled");
					this.assertDevicesEqual(device1, editedDevice);
				}
			}
			{
				final String comments = "TEST EDIT COMMENT";
				ObjectNode editData = JsonNodeFactory.instance.objectNode()
					.put("comments", comments);
				HttpResponse<JsonNode> response = apiClient.put(
					"/devices/%d".formatted(device1.getId()), editData);
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response for edited device");

				try (Session session = Database.getSession()) {
					Device editedDevice = session
						.createQuery("from Device d where d.id = :id", Device.class)
						.setParameter("id", device1.getId())
						.uniqueResult();
					Assertions.assertEquals(comments, editedDevice.getComments(),
						"The edited device comments are not correct");
					this.assertDevicesEqual(device1, editedDevice, DeviceField.COMMENTS);
				}
			}
		}

	}


	@Nested
	@DisplayName("Report tests")
	@ResourceLock("DB")
	class ReportTests {

		private String testDomainName = "Domain 1";
		private Domain testDomain;
		private List<Device> testDevices;

		private void createTestDomain() throws IOException {
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				this.testDomain = new Domain(
					this.testDomainName, "Test Domain for devices",
					new Network4Address("10.1.1.1"),
					null
				);
				session.persist(this.testDomain);
				session.getTransaction().commit();
			}
		}

		private void createTestDevices() {
			this.testDevices = new ArrayList<>();
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				for (int i = 0; i < 1000; i++) {
					Device device = FakeDeviceFactory.getFakeCiscoIosDevice(this.testDomain, null, i);
					this.testDevices.add(device);
					session.persist(device);
				}
				session.getTransaction().commit();
			}
		}

		@BeforeAll
		static void loadDrivers() throws Exception {
			DeviceDriver.refreshDrivers();
		}

		@AfterEach
		void cleanUpData() {
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				session
					.createMutationQuery("delete from Device")
					.executeUpdate();
				session
					.createMutationQuery("delete from DeviceCredentialSet cs where cs.deviceSpecific is true")
					.executeUpdate();
				session
					.createMutationQuery("delete from Domain")
					.executeUpdate();
				session.getTransaction().commit();
			}
		}

		@Test
		@DisplayName("Export data test")
		@ResourceLock("DB")
		void exportDataTest() throws IOException, InterruptedException {
			this.createTestDomain();
			this.createTestDevices();
			apiClient.setMediaType(MediaType.WILDCARD_TYPE);
			{
				InputStream xlsStream = apiClient.download("/reports/export?format=xlsx").body();
				try (XSSFWorkbook wb = new XSSFWorkbook(xlsStream)) {
					Assertions.assertEquals(wb.getNumberOfSheets(), 2);
					XSSFSheet deviceSheet = wb.getSheet("Devices");
					Assertions.assertEquals(this.testDevices.size(), deviceSheet.getLastRowNum(),
						"Excel report doesn't have the expected number of lines in Devices sheet");
				}
			}
			{
				InputStream xlsStream = apiClient.download("/reports/export?interfaces=true").body();
				try (XSSFWorkbook wb = new XSSFWorkbook(xlsStream)) {
					Assertions.assertEquals(wb.getNumberOfSheets(), 3);
					XSSFSheet deviceSheet = wb.getSheet("Devices");
					Assertions.assertEquals(deviceSheet.getLastRowNum(), this.testDevices.size(),
						"Excel report doesn't have the expected number of lines in Devices sheet");
					XSSFSheet intfSheet = wb.getSheet("Interfaces");
					Assertions.assertEquals(this.testDevices.size() * 4, intfSheet.getLastRowNum(),
						"Excel report doesn't have the expected number of lines in Interfaces sheet");
				}
			}
			{
				InputStream xlsStream = apiClient.download("/reports/export?inventory=true").body();
				try (XSSFWorkbook wb = new XSSFWorkbook(xlsStream)) {
					Assertions.assertEquals(wb.getNumberOfSheets(), 3);
					XSSFSheet deviceSheet = wb.getSheet("Devices");
					Assertions.assertEquals(deviceSheet.getLastRowNum(), this.testDevices.size(),
						"Excel report doesn't have the expected number of lines in Devices sheet");
					XSSFSheet intfSheet = wb.getSheet("Inventory");
					Assertions.assertEquals(this.testDevices.size() * 2, intfSheet.getLastRowNum(),
						"Excel report doesn't have the expected number of lines in Inventory sheet");
				}
			}
		}

	}

}
