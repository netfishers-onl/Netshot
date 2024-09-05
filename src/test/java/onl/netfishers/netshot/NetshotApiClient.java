package onl.netfishers.netshot;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodySubscriber;
import java.net.http.HttpResponse.ResponseInfo;
import java.nio.charset.StandardCharsets;
import java.util.List;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.Getter;
import lombok.Setter;

/**
 * Simple wrapper for Netshot REST API.
 */
public class NetshotApiClient {

	/**
	 * Simple exception to catch unexpected response and attach it.
	 */
	static public class WrongApiResponseException extends IOException {
		@Getter
		private HttpResponse<?> response;

		public WrongApiResponseException(String message, HttpResponse<?> response) {
			super(message);
			this.response = response;
		}
	}

	static protected final String SESSION_COOKIE_NAME = "NetshotSessionID";

	@Getter @Setter
	private String apiUrl;

	@Getter @Setter
	private String apiToken;

	@Getter @Setter
	private String username;

	@Getter @Setter
	private String password;

	/** To change the password on login */
	@Getter @Setter
	private String newPassword;

	@Getter @Setter
	private HttpCookie sessionCookie;

	private ObjectMapper objectMapper = null;

	@Getter
	private MediaType mediaType = MediaType.APPLICATION_JSON_TYPE;

	private HttpClient httpClient;

	public NetshotApiClient(String apiUrl, String apiToken) {
		this.httpClient = HttpClient.newHttpClient();
		this.apiUrl = apiUrl;
		this.apiToken = apiToken;
	}

	public NetshotApiClient(String apiUrl, String username, String password) {
		this.httpClient = HttpClient.newHttpClient();
		this.apiUrl = apiUrl;
		this.username = username;
		this.password = password;
	}

	public void setLogin(String username, String password) {
		this.username = username;
		this.password = password;
		this.apiToken = null;
	}

	private HttpRequest.BodyPublisher jsonNodePublisher(JsonNode jsonNode) throws JsonProcessingException {
		return HttpRequest.BodyPublishers.ofString(
			this.getObjectMapper().writeValueAsString(jsonNode));
	}

	private HttpResponse.BodyHandler<JsonNode> jsonNodeHandler() {
		return new HttpResponse.BodyHandler<JsonNode>() {
			@Override
			public BodySubscriber<JsonNode> apply(ResponseInfo responseInfo) {
				HttpResponse.BodySubscriber<String> upstream = HttpResponse.BodySubscribers.ofString(StandardCharsets.UTF_8);
				return HttpResponse.BodySubscribers.mapping(upstream, (String body) -> {
					try {
						ObjectMapper objectMapper = getObjectMapper();
						return objectMapper.readTree(body);
					}
					catch (IOException e) {
						throw new UncheckedIOException(e);
					}
				});
			}
		};
	}

	protected ObjectMapper getObjectMapper() {
		if (this.objectMapper == null) {
			if (this.mediaType.equals(MediaType.APPLICATION_XML_TYPE)) {
				this.objectMapper = new XmlMapper();
			}
			else {
				this.objectMapper = new JsonMapper();
			}
			this.objectMapper.enable(DeserializationFeature.USE_LONG_FOR_INTS);
		}
		return this.objectMapper;
	}

	public void setMediaType(MediaType mediaType) {
		this.mediaType = mediaType;
		this.objectMapper = null;
	}

	protected void login() throws IOException, InterruptedException {
		HttpRequest.Builder builder = HttpRequest.newBuilder();
		builder.version(HttpClient.Version.HTTP_1_1);
		builder.uri(URI.create(this.apiUrl + "/user"));
		builder.header("Accept", this.mediaType.toString());
		builder.header("Content-Type", this.mediaType.toString());
		ObjectNode payload = JsonNodeFactory.instance.objectNode();
		payload.put("username", this.username);
		payload.put("password", this.password);
		if (this.newPassword != null) {
			payload.put("newPassword", this.newPassword);
		}
		builder.POST(this.jsonNodePublisher(payload));
		HttpRequest request = builder.build();
		HttpResponse<JsonNode> response =
			this.httpClient.send(request, this.jsonNodeHandler());
		if (response.statusCode() != Response.Status.OK.getStatusCode()) {
			throw new WrongApiResponseException("Netshot REST API login failed", response);
		}
		String setCookie = response.headers().firstValue("Set-Cookie").get();
		List<HttpCookie> cookies = HttpCookie.parse(setCookie);
		for (HttpCookie cookie : cookies) {
			if (cookie.getName().equals(SESSION_COOKIE_NAME)) {
				this.sessionCookie = new HttpCookie(SESSION_COOKIE_NAME, cookie.getValue());
				break;
			}
		}
	}

	protected void logout() throws IOException, InterruptedException {
		if (this.sessionCookie == null) {
			return;
		}
		HttpRequest.Builder builder = HttpRequest.newBuilder();
		builder.version(HttpClient.Version.HTTP_1_1);
		builder.uri(URI.create(this.apiUrl + "/user/0"));
		builder.header("Cookie", this.sessionCookie.toString());
		builder.DELETE();
		HttpRequest request = builder.build();
		HttpResponse<JsonNode> response =
			this.httpClient.send(request, this.jsonNodeHandler());
		if (response.statusCode() != Response.Status.NO_CONTENT.getStatusCode()) {
			throw new RuntimeException("Netshot REST API logout failed");
		}
		this.sessionCookie = null;
	}

	protected HttpRequest.Builder initRequest(String path) throws IOException, InterruptedException {
		HttpRequest.Builder builder = HttpRequest.newBuilder();
		builder.version(HttpClient.Version.HTTP_1_1);
		if (this.apiToken != null) {
			builder.header("X-Netshot-API-Token", this.apiToken);
		}
		else if (this.username != null && this.password != null) {
			if (this.sessionCookie == null) {
				this.login();
			}
			builder.header("Cookie", this.sessionCookie.toString());
		}
		builder.header("Accept", this.mediaType.toString());
		builder.uri(URI.create(this.apiUrl + path));
		return builder;
	}

	public HttpResponse<JsonNode> get(String path) throws IOException, InterruptedException {
		HttpRequest request = initRequest(path).GET().build();
		HttpResponse<JsonNode> response =
			this.httpClient.send(request, this.jsonNodeHandler());
		return response;
	}

	public HttpResponse<JsonNode> post(String path, JsonNode data) throws IOException, InterruptedException {
		HttpRequest request = initRequest(path)
			.header("Content-Type", this.mediaType.toString())
			.POST(this.jsonNodePublisher(data))
			.build();
		HttpResponse<JsonNode> response =
			this.httpClient.send(request, this.jsonNodeHandler());
		return response;
	}

	public HttpResponse<JsonNode> put(String path, JsonNode data) throws IOException, InterruptedException {
		HttpRequest request = initRequest(path)
			.header("Content-Type", this.mediaType.toString())
			.PUT(this.jsonNodePublisher(data))
			.build();
		HttpResponse<JsonNode> response =
			this.httpClient.send(request, this.jsonNodeHandler());
		return response;
	}

	public HttpResponse<JsonNode> delete(String path) throws IOException, InterruptedException {
		HttpRequest request = initRequest(path).DELETE().build();
		HttpResponse<JsonNode> response =
			this.httpClient.send(request, this.jsonNodeHandler());
		return response;
	}
}