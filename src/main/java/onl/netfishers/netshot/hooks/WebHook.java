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
package onl.netfishers.netshot.hooks;

import java.net.MalformedURLException;
import java.net.URL;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.SecureRandom;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.jaxrs.json.JacksonJaxbJsonProvider;
import com.fasterxml.jackson.jaxrs.xml.JacksonJaxbXMLProvider;

import org.glassfish.jersey.client.ClientConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.rest.RestViews.HookView;

/**
 * A Web hook, called after specific event.
 */
@Entity
public class WebHook extends Hook {
	/* Class logger */
	final private static Logger logger = LoggerFactory.getLogger(WebHook.class);

	/**
	 * Types of web hook
	 */
	static public enum Action {
		POST_XML, POST_JSON,
	};

	static {
		try {
			// Try to instanciate Trust Manager and change the trustStoreType to JKS
			// if we see an error about PKCS#12 loader from BC.
			// This happens on Debian where the ca-certificates-java package
			// generates the /etc/ssl/certs/java/cacerts file in JKS format
			// while the default keystore format in OpenJDK 11 is PKCS#12.
			// The default Java security code automatically tries both formats
			// but BouncyCastle is more strict on this.
			TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm()).init((KeyStore) null);
		}
		catch (Exception e) {
			if (e instanceof KeyStoreException && e.getCause() != null &&
					"stream does not represent a PKCS12 key store".equals(e.getCause().getMessage())) {
				logger.info("Changing trustStoreType to JKS");
				System.setProperty("javax.net.ssl.trustStoreType", "JKS");
			}
		}
	}

	/** Action of the hook */
	private Action action;

	/** The target http URL */
	private String url;

	/** Enable/disable SSL validation for https links */
	private boolean sslValidation = true;

	/**
	 * Instantiates a new diagnostic result (for Hibernate)
	 */
	protected WebHook() {
	}

	/**
	 * Instantiates a new diagnostic result
	 * 
	 * @param device
	 *                       The device
	 * @param diagnostic
	 *                       The diagnostic
	 */
	public WebHook(String url) {

	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	@Transient
	public URL getParsedUrl() throws MalformedURLException {
		if (this.url == null || this.url.trim().equals("")) {
			throw new MalformedURLException("Empty URL");
		}
		URL pUrl = new URL(this.url.trim());
		if (!pUrl.getProtocol().equals("http") && !pUrl.getProtocol().equals("https")) {
			throw new MalformedURLException("Invalid protocol");
		}
		return pUrl;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public boolean isSslValidation() {
		return sslValidation;
	}

	public void setSslValidation(boolean sslValidation) {
		this.sslValidation = sslValidation;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public Action getAction() {
		return action;
	}

	public void setAction(Action action) {
		this.action = action;
	}

	static public class InsecureHostnameVerifier implements HostnameVerifier {
		@Override
		public boolean verify(String arg0, SSLSession arg1) {
			return true;
		}
	}

	static public class InsecureTrustManager implements X509TrustManager {
		@Override
		public void checkClientTrusted(X509Certificate[] arg0, String arg1) throws CertificateException {
		}

		@Override
		public void checkServerTrusted(X509Certificate[] arg0, String arg1) throws CertificateException {
		}

		@Override
		public X509Certificate[] getAcceptedIssuers() {
			return new X509Certificate[0];
		}
	}

	@Override
	public String execute(Object data) throws Exception {
		URL targetUrl = this.getParsedUrl();

		ClientConfig config = new ClientConfig();
		MediaType mediaType;
		switch (this.action) {
		case POST_JSON:
			mediaType = MediaType.APPLICATION_JSON_TYPE;
			JacksonJaxbJsonProvider jsonProvider = new JacksonJaxbJsonProvider();
			jsonProvider.setDefaultView(HookView.class);
			config.register(jsonProvider);
			break;
		case POST_XML:
			mediaType = MediaType.APPLICATION_XML_TYPE;
			JacksonJaxbXMLProvider xmlProvider = new JacksonJaxbXMLProvider();
			xmlProvider.setDefaultView(HookView.class);
			config.register(xmlProvider);
			break;
		default:
			throw new Exception("Invalid action");
		}
		
		TrustManagerFactory factory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
		factory.init((KeyStore) null);

		SSLContext sslContext = SSLContext.getInstance("TLS");
		if (this.isSslValidation()) {
			sslContext.init(null, null, new SecureRandom());
		}
		else {
			sslContext.init(null, new TrustManager[] { new InsecureTrustManager() }, new SecureRandom());
		}

		ClientBuilder clientBuilder = ClientBuilder.newBuilder().sslContext(sslContext);
		if (!this.isSslValidation()) {
			clientBuilder.hostnameVerifier(new InsecureHostnameVerifier());
		}
		clientBuilder.withConfig(config);

		Client client = clientBuilder.build();
		Response response = client.target(targetUrl.toURI()).request().post(javax.ws.rs.client.Entity.entity(data, mediaType));

		return String.format("HTTP response code %d", response.getStatus());
	}
}
