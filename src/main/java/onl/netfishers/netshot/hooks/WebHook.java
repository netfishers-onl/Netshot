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
import java.security.cert.CertificateException;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import onl.netfishers.netshot.rest.RestViews;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * A Web hook, called after specific event.
 */
@Entity
public class WebHook extends Hook {

	/**
	 * Types of web hook
	 */
	static public enum Action {
		POST_XML, POST_JSON,
	};

	public static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
	public static final MediaType XML  = MediaType.parse("application/xml; charset=utf-8");

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
	 *                     The device
	 * @param diagnostic
	 *                     The diagnostic
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

	@XmlElement @JsonView(DefaultView.class)
	public boolean isSslValidation() {
		return sslValidation;
	}

	public void setSslValidation(boolean sslValidation) {
		this.sslValidation = sslValidation;
	}

	@XmlElement @JsonView(DefaultView.class)
	public Action getAction() {
		return action;
	}

	public void setAction(Action action) {
		this.action = action;
	}

	@Transient
	private OkHttpClient getHttpClient() {
		if (this.sslValidation) {
			return new OkHttpClient();
		}
		try {
			final TrustManager[] trustAllCerts = new TrustManager[] {
				new X509TrustManager(){
					@Override
					public void checkClientTrusted(java.security.cert.X509Certificate[] chain,
																					String authType) throws CertificateException {
					}
					@Override
					public void checkServerTrusted(java.security.cert.X509Certificate[] chain,
																					String authType) throws CertificateException {
					}
					@Override
					public java.security.cert.X509Certificate[] getAcceptedIssuers() {
						return new java.security.cert.X509Certificate[]{};
					}
				}
			};
 
			final SSLContext sslContext = SSLContext.getInstance("SSL");
			sslContext.init(null, trustAllCerts, new java.security.SecureRandom());
	
			final SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();
	
			OkHttpClient.Builder builder = new OkHttpClient.Builder();
			builder.sslSocketFactory(sslSocketFactory, (X509TrustManager) trustAllCerts[0]);
	
			builder.hostnameVerifier(new HostnameVerifier(){
				@Override
				public boolean verify(String hostname, SSLSession session) {
						return true;
				}
			});
			
			return builder.build();
		}
		catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	@Override
	public String execute(Object data) throws Exception {
		URL url = this.getParsedUrl();
		RequestBody body = null;
		switch (this.action) {
		case POST_JSON:
			ObjectMapper jsonMapper = new ObjectMapper();
			String json = jsonMapper.writerWithView(RestViews.HookView.class).writeValueAsString(data);
			body = RequestBody.create(json, JSON);
			break;
		case POST_XML:
			XmlMapper xmlMapper = new XmlMapper();
			String xml = xmlMapper.writerWithView(RestViews.HookView.class).writeValueAsString(data);
			body = RequestBody.create(xml, XML);
			break;
		default:
			throw new Exception("Invalid action");
		}

		Request httpRequest = new Request.Builder()
			.url(url)
			.post(body)
			.build();
		OkHttpClient httpClient = this.getHttpClient();
		Response httpResponse = httpClient.newCall(httpRequest).execute();
		return String.format("HTTP response code %d", httpResponse.code());
	}
}
