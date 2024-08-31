package onl.netfishers.netshot;

import java.io.IOException;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpResponse;
import java.util.Iterator;
import java.util.Map;
import java.util.Properties;
import org.hibernate.Session;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.ResourceLock;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;
import onl.netfishers.netshot.aaa.ApiToken;
import onl.netfishers.netshot.aaa.UiUser;
import onl.netfishers.netshot.database.Database;
import onl.netfishers.netshot.device.Domain;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.rest.RestService;

public class RestServiceTest {

	private static final String apiUrl = "http://localhost:8888/api";

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
				.createMutationQuery("delete from onl.netfishers.netshot.aaa.UiUser")
				.executeUpdate();
			for (Map.Entry<Integer, String> entry : API_TOKENS.entrySet()) {
				String description = String.format("Test Token - level %d", entry.getKey());
				ApiToken token = new ApiToken(description, entry.getValue(), entry.getKey());
				session.persist(token);
			}
			session.getTransaction().commit();
		}
	}

	@BeforeAll
	protected static void initNetshot() throws Exception {
		Properties config = new Properties();
		config.setProperty("netshot.log.file", "CONSOLE");
		config.setProperty("netshot.log.level", "INFO");
		config.setProperty("netshot.db.driver_class", "org.h2.Driver");
		config.setProperty("netshot.db.url", 
			"jdbc:h2:mem:nstest;TRACE_LEVEL_SYSTEM_OUT=2;" +
			"CASE_INSENSITIVE_IDENTIFIERS=true;DB_CLOSE_DELAY=-1");
		config.setProperty("netshot.http.ssl.enabled", "false");
		URI uri = UriBuilder.fromUri(apiUrl).replacePath("/").build();
		config.setProperty("netshot.http.baseurl", uri.toString());
		Netshot.initConfig(config);
		Database.update();
		Database.init();
		RestService.init();
		Thread.sleep(1000);
	}

	private NetshotApiClient apiClient;

	@BeforeEach
	void createData() {
		RestServiceTest.createApiTokens();
		this.apiClient = new NetshotApiClient(RestServiceTest.apiUrl,
			RestServiceTest.API_TOKENS.get(UiUser.LEVEL_ADMIN));
	}

	@Nested
	@DisplayName("Authentication Tests")
	class AuthenticationTest {

		@AfterEach
		void cleanUpData() {
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				session
					.createMutationQuery("delete from onl.netfishers.netshot.aaa.UiUser")
					.executeUpdate();
				session
					.createMutationQuery("delete from ApiToken")
					.executeUpdate();
				session.getTransaction().commit();
			}
		}

		@Test
		@DisplayName("Missing API token")
		void missingApiToken() throws IOException, InterruptedException {
			apiClient.setApiToken(null);
			HttpResponse<JsonNode> response = apiClient.get("/devices");
			Assertions.assertEquals(Response.Status.FORBIDDEN.getStatusCode(), response.statusCode(),
				"Not getting 403 response for missing API token");
			Assertions.assertInstanceOf(MissingNode.class,
				response.body(), "Response body not empty");
		}

		@Test
		@DisplayName("Empty API token")
		void emptyApiToken() throws IOException, InterruptedException {
			apiClient.setApiToken("");
			HttpResponse<JsonNode> response = apiClient.get("/devices");
			Assertions.assertEquals(
				Response.Status.FORBIDDEN.getStatusCode(), response.statusCode(),
				"Not getting 403 response for empty API token");
			Assertions.assertInstanceOf(MissingNode.class,
				response.body(), "Response body not empty");
		}

		@Test
		@DisplayName("Wrong API token")
		void wrongApiToken() throws IOException, InterruptedException {
			apiClient.setApiToken("WRONGTOKEN");
			HttpResponse<JsonNode> response = apiClient.get("/devices");
			Assertions.assertEquals(
				Response.Status.FORBIDDEN.getStatusCode(), response.statusCode(),
				"Not getting 403 response for wrong API token");
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
		@DisplayName("Local user authentication and cookie")
		@ResourceLock(value = "DB")
		void localUserAuth() throws IOException, InterruptedException {
			String username = "testuser";
			String password = "testpassword";
			try (Session session = Database.getSession()) {
				session.beginTransaction();
				UiUser user = new UiUser(username, true, password);
				user.setLevel(UiUser.LEVEL_ADMIN);
				session.persist(user);
				session.getTransaction().commit();
			}
			apiClient.setLogin(username, password);
			HttpResponse<JsonNode> response1 = apiClient.get("/domains");
			Assertions.assertEquals(
				Response.Status.OK.getStatusCode(), response1.statusCode(),
				"Unable to get data using username/password and cookie API access");
			HttpCookie sessionCookie = apiClient.getSessionCookie();
			apiClient.logout();
			apiClient.setSessionCookie(sessionCookie);
			HttpResponse<JsonNode> response2 = apiClient.get("/domains");
			Assertions.assertEquals(
				Response.Status.FORBIDDEN.getStatusCode(), response2.statusCode(),
				"Not getting 403 response for post-logout request");
		}

		@Test
		@DisplayName("Wrong cookie")
		void wrongCookie() throws IOException, InterruptedException {
			apiClient.setApiToken(null);
			apiClient.setSessionCookie(
				new HttpCookie(NetshotApiClient.SESSION_COOKIE_NAME,
				"9212336284027029412"));
			HttpResponse<JsonNode> response = apiClient.get("/devices");
			Assertions.assertEquals(
				Response.Status.FORBIDDEN.getStatusCode(), response.statusCode(),
				"Not getting 403 response for wrong cookie");
			Assertions.assertInstanceOf(MissingNode.class,
				response.body(), "Response body not empty");
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
					session
						.createMutationQuery("delete from ApiToken")
						.executeUpdate();
					session.getTransaction().commit();
				}
			}

			@Test
			@DisplayName("List domains")
			@ResourceLock(value = "DB")
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
			@ResourceLock(value = "DB")
			void listPaginatedDomains() throws IOException, InterruptedException {
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					for (int i = 1; i <= 15; i++) {
						Domain domain = new Domain(
							String.format("Test%d", i),
							String.format("Test Domain%d for pagination", i),
							new Network4Address(String.format("10.1.%d.1", i)),
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
			@ResourceLock(value = "DB")
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
			@ResourceLock(value = "DB")
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
				HttpResponse<JsonNode> response = apiClient.delete(
					String.format("/domains/%d", domain1.getId()));
				Assertions.assertEquals(
					Response.Status.NO_CONTENT.getStatusCode(), response.statusCode(),
					"Not getting 204 response for domain deletion");
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
			@ResourceLock(value = "DB")
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
				HttpResponse<JsonNode> response = apiClient.put(
					String.format("/domains/%d", domain.getId()), data);
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response for domain update");
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
						.createMutationQuery("delete from onl.netfishers.netshot.aaa.UiUser")
						.executeUpdate();
					session
						.createMutationQuery("delete from ApiToken")
						.executeUpdate();
					session.getTransaction().commit();
				}
			}

			@Test
			@DisplayName("List users")
			@ResourceLock(value = "DB")
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
			@ResourceLock(value = "DB")
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
						.createQuery("from onl.netfishers.netshot.aaa.UiUser u where u.username = :name", UiUser.class)
						.setParameter("name", user.getUsername())
						.uniqueResult();
					Assertions.assertEquals(user.getUsername(), newUser.getUsername(), "User not created as expected");
					Assertions.assertEquals(user.getLevel(), newUser.getLevel(), "User not created as expected");
					Assertions.assertEquals(user.isLocal(), newUser.isLocal(), "User not created as expected");
				}
			}

			@Test
			@DisplayName("Delete user")
			@ResourceLock(value = "DB")
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
					String.format("/users/%d", user1.getId()));
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
			@ResourceLock(value = "DB")
			void updateDomain() throws IOException, InterruptedException {
				UiUser user = new UiUser("user1", true, "pass1");
				user.setLevel(UiUser.LEVEL_EXECUTEREADWRITE);
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session.persist(user);
					session.getTransaction().commit();
				}
				UiUser targetUser = new UiUser("user2", true, "pass1");
				targetUser.setHashedPassword(user.getHashedPassword());
				targetUser.setLevel(UiUser.LEVEL_READONLY);
				targetUser.setId(user.getId());
				ObjectNode data = JsonNodeFactory.instance.objectNode()
					.put("local", targetUser.isLocal())
					.put("username", targetUser.getUsername())
					.put("level", Long.valueOf(targetUser.getLevel()));
				HttpResponse<JsonNode> response = apiClient.put(
					String.format("/users/%d", user.getId()), data);
				Assertions.assertEquals(
					Response.Status.OK.getStatusCode(), response.statusCode(),
					"Not getting 200 response for user update");
				try (Session session = Database.getSession()) {
					UiUser dbUser = session.byId(UiUser.class)
						.load(targetUser.getId());
					Assertions.assertEquals(
						targetUser, dbUser, "User not updated as expected");
				}
			}
		}

		@Nested
		@DisplayName("API token management API Tests")
		class ApiTokenTest {

			@AfterEach
			void cleanUpData() {
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session
						.createMutationQuery("delete from ApiToken")
						.executeUpdate();
					session.getTransaction().commit();
				}
			}

			@Test
			@DisplayName("List tokens")
			@ResourceLock(value = "DB")
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
			@ResourceLock(value = "DB")
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
			@ResourceLock(value = "DB")
			void deleteToken() throws IOException, InterruptedException {
				ApiToken token1 = new ApiToken(
					"Temp token", "dZLV0zCn5gmbUJIebRHBxM4QjIAoNruK", UiUser.LEVEL_OPERATOR);
				try (Session session = Database.getSession()) {
					session.beginTransaction();
					session.persist(token1);
					session.getTransaction().commit();
				}
				HttpResponse<JsonNode> response = apiClient.delete(
					String.format("/apitokens/%d", token1.getId()));
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
	
}
