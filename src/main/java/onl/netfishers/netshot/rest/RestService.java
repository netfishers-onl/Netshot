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
package onl.netfishers.netshot.rest;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.UnknownHostException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.TimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.annotation.security.DenyAll;
import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.UriBuilder;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.aaa.ApiToken;
import onl.netfishers.netshot.aaa.Radius;
import onl.netfishers.netshot.aaa.UiUser;
import onl.netfishers.netshot.aaa.User;
import onl.netfishers.netshot.compliance.CheckResult;
import onl.netfishers.netshot.compliance.Exemption;
import onl.netfishers.netshot.compliance.HardwareRule;
import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.Rule;
import onl.netfishers.netshot.compliance.SoftwareRule;
import onl.netfishers.netshot.compliance.CheckResult.ResultOption;
import onl.netfishers.netshot.compliance.SoftwareRule.ConformanceLevel;
import onl.netfishers.netshot.compliance.rules.JavaScriptRule;
import onl.netfishers.netshot.compliance.rules.TextRule;
import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.device.Domain;
import onl.netfishers.netshot.device.DynamicDeviceGroup;
import onl.netfishers.netshot.device.Finder;
import onl.netfishers.netshot.device.Module;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.device.Network6Address;
import onl.netfishers.netshot.device.NetworkAddress;
import onl.netfishers.netshot.device.NetworkInterface;
import onl.netfishers.netshot.device.StaticDeviceGroup;
import onl.netfishers.netshot.device.Device.MissingDeviceDriverException;
import onl.netfishers.netshot.device.Device.Status;
import onl.netfishers.netshot.device.Finder.Expression.FinderParseException;
import onl.netfishers.netshot.device.attribute.AttributeDefinition;
import onl.netfishers.netshot.device.attribute.ConfigAttribute;
import onl.netfishers.netshot.device.attribute.ConfigBinaryFileAttribute;
import onl.netfishers.netshot.device.attribute.ConfigLongTextAttribute;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeType;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
import onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity;
import onl.netfishers.netshot.device.credentials.DeviceSnmpv3Community;
import onl.netfishers.netshot.device.credentials.DeviceSshKeyAccount;
import onl.netfishers.netshot.diagnostic.Diagnostic;
import onl.netfishers.netshot.diagnostic.DiagnosticResult;
import onl.netfishers.netshot.diagnostic.JavaScriptDiagnostic;
import onl.netfishers.netshot.diagnostic.SimpleDiagnostic;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.DebugLog;
import onl.netfishers.netshot.work.Task;
import onl.netfishers.netshot.work.TaskLogger;
import onl.netfishers.netshot.work.Task.ScheduleType;
import onl.netfishers.netshot.work.tasks.CheckComplianceTask;
import onl.netfishers.netshot.work.tasks.CheckGroupComplianceTask;
import onl.netfishers.netshot.work.tasks.CheckGroupSoftwareTask;
import onl.netfishers.netshot.work.tasks.DeviceJsScript;
import onl.netfishers.netshot.work.tasks.DiscoverDeviceTypeTask;
import onl.netfishers.netshot.work.tasks.PurgeDatabaseTask;
import onl.netfishers.netshot.work.tasks.RunDeviceGroupScriptTask;
import onl.netfishers.netshot.work.tasks.RunDeviceScriptTask;
import onl.netfishers.netshot.work.tasks.RunDiagnosticsTask;
import onl.netfishers.netshot.work.tasks.RunGroupDiagnosticsTask;
import onl.netfishers.netshot.work.tasks.ScanSubnetsTask;
import onl.netfishers.netshot.work.tasks.TakeGroupSnapshotTask;
import onl.netfishers.netshot.work.tasks.TakeSnapshotTask;

import org.apache.poi.ss.usermodel.BuiltinFormats;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.glassfish.grizzly.http.server.CLStaticHttpHandler;
import org.glassfish.grizzly.http.server.HttpHandler;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.grizzly.servlet.ServletRegistration;
import org.glassfish.grizzly.servlet.WebappContext;
import org.glassfish.grizzly.ssl.SSLContextConfigurator;
import org.glassfish.grizzly.ssl.SSLEngineConfigurator;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpContainer;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.jersey.servlet.ServletContainer;
import org.glassfish.jersey.servlet.ServletProperties;
import org.graalvm.polyglot.HostAccess.Export;
import org.hibernate.Criteria;
import org.hibernate.HibernateException;
import org.hibernate.ObjectNotFoundException;
import org.hibernate.query.Query;
import org.hibernate.Session;
import org.hibernate.transform.Transformers;
import org.quartz.SchedulerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;

import difflib.Delta;
import difflib.DiffUtils;
import difflib.Patch;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;

/**
 * The RestService class exposes the Netshot methods as a REST service.
 */
@Path("/")
@DenyAll
public class RestService extends Thread {

	/**
	 * The HQL select query for "light" devices, to be prepended to the actual
	 * query.
	 */
	private static final String DEVICELIST_BASEQUERY = "select d.id as id, d.name as name, d.family as family, d.mgmtAddress as mgmtAddress, d.status as status ";

	/** The logger. */
	static Logger logger = LoggerFactory.getLogger(RestService.class);

	/** The static instance service. */
	private static RestService nsRestService;

	/** Pagination size for dump queries */
	private static final int PAGINATION_SIZE = 1000;

	private static final String HTTP_STATIC_PATH = Netshot.getConfig("netshot.http.staticpath", "/");
	static final String HTTP_API_PATH = Netshot.getConfig("netshot.http.apipath", "/api");

	/**
	 * Initializes the service.
	 */
	public static void init() {
		nsRestService = new RestService();
		nsRestService.setUncaughtExceptionHandler(Netshot.exceptionHandler);
		nsRestService.start();
	}

	private String httpBaseUrl;
	private int httpBasePort;
	private boolean httpUseSsl;
	private String httpSslKeystoreFile;
	private String httpSslKeystorePass;

	@Context
	private HttpServletRequest request;

	/**
	 * Instantiates a new Netshot REST service.
	 */
	public RestService() {
		this.setName("REST Service");
		httpUseSsl = true;
		if (Netshot.getConfig("netshot.http.ssl.enabled", "true").equals("false")) {
			httpUseSsl = false;
		}
		
		if (httpUseSsl) {
			httpBaseUrl = Netshot.getConfig("netshot.http.baseurl", "http://localhost:8443");
			httpSslKeystoreFile = Netshot.getConfig("netshot.http.ssl.keystore.file", "netshot.jks");
			httpSslKeystorePass = Netshot.getConfig("netshot.http.ssl.keystore.pass", "netshotpass");
			httpBasePort = 8443;
		}
		else {
			httpBaseUrl = Netshot.getConfig("netshot.http.baseurl", "http://localhost:8080");
			httpBasePort = 8080;
		}
		try {
			httpBasePort = Integer.parseInt(Netshot.getConfig("netshot.http.baseport",
					Integer.toString(httpBasePort)));
		}
		catch (Exception e) {
			logger.warn("Unable to understand the HTTP base port configuration, using {}.",
					httpBasePort);
		}
	}

	/**
	 * Attach a suggested return code to the request, so the ResponseCodeFilter
	 * can in turn change the return code of the response.
	 * e.g. 201 or 204 instead of default 200
	 */
	private void suggestReturnCode(Response.Status status) {
		this.request.setAttribute(ResponseCodeFilter.SUGGESTED_RESPONSE_CODE, status);
	}

	/* (non-Javadoc)
	 * @see java.lang.Thread#run()
	 */
	public void run() {
		logger.info("Starting the Web/REST service thread.");
		try {

			SSLEngineConfigurator sslConfig = null;
			if (httpUseSsl) {
				SSLContextConfigurator sslContext = new SSLContextConfigurator();
				sslContext.setKeyStoreFile(httpSslKeystoreFile);
				sslContext.setKeyStorePass(httpSslKeystorePass);
				if (!httpSslKeystoreFile.endsWith(".jks")) {
					sslContext.setKeyStoreType("pkcs12");
				}
	
				// Create the context and raise any error if anything is wrong with the SSL configuration.
				sslContext.createSSLContext(true);
				sslConfig = new SSLEngineConfigurator(sslContext)
						.setClientMode(false).setNeedClientAuth(false).setWantClientAuth(false);
			}
			URI url = UriBuilder.fromUri(httpBaseUrl).port(httpBasePort).build();
			HttpServer server = GrizzlyHttpServerFactory.createHttpServer(
					url, (GrizzlyHttpContainer) null, httpUseSsl, sslConfig, false);
			server.getServerConfiguration().setSessionTimeoutSeconds(UiUser.MAX_IDLE_TIME);

			WebappContext context = new WebappContext("GrizzlyContext", HTTP_API_PATH);
			ServletRegistration registration = context.addServlet("Jersey", ServletContainer.class);
			registration.setInitParameter(ServletProperties.JAXRS_APPLICATION_CLASS,
					NetshotWebApplication.class.getName());
			registration.addMapping(HTTP_API_PATH);
			context.deploy(server);
			HttpHandler staticHandler = new CLStaticHttpHandler(Netshot.class.getClassLoader(), "/www/");
			server.getServerConfiguration().addHttpHandler(staticHandler, HTTP_STATIC_PATH);

			server.start();

			synchronized (this) {
				while (true) {
					this.wait();
				}
			}
		}
		catch (Exception e) {
			logger.error(MarkerFactory.getMarker("FATAL"),
					"Fatal error with the REST service.", e);
			throw new RuntimeException(
					"Error with the REST service, see logs for more details.");
		}
	}


	/**
	 * An error bean to be sent to the REST client.
	 */
	@XmlRootElement(name = "error")
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsErrorBean {

		/** The error message. */
		private String errorMsg;

		/** The error code. */
		private int errorCode;

		/**
		 * Instantiates a new error bean.
		 */
		public RsErrorBean() {
		}

		/**
		 * Instantiates a new error bean.
		 *
		 * @param errorMsg the error msg
		 * @param errorCode the error code
		 */
		public RsErrorBean(String errorMsg, int errorCode) {
			super();
			this.errorMsg = errorMsg;
			this.errorCode = errorCode;
		}

		/**
		 * Gets the error message.msg
		 *
		 * @return the error message
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getErrorMsg() {
			return errorMsg;
		}

		/**
		 * Sets the error message.
		 *
		 * @param errorMsg the new error message
		 */
		public void setErrorMsg(String errorMsg) {
			this.errorMsg = errorMsg;
		}

		/**
		 * Gets the error code.
		 *
		 * @return the error code
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public int getErrorCode() {
			return errorCode;
		}

		/**
		 * Sets the error code.
		 *
		 * @param errorCode the new error code
		 */
		public void setErrorCode(int errorCode) {
			this.errorCode = errorCode;
		}
	}
	
	/**
	 * Gets the domains.
	 *
	 * @param request the request
	 * @return the domains
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/domains")
	@ApiResponse()
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the device domains",
		description = "Returns the list of device domains."
	)
	public List<RsDomain> getDomains() throws WebApplicationException {
		logger.debug("REST request, domains.");
		Session session = Database.getSession();
		List<Domain> domains;
		try {
			domains = session.createQuery("select d from Domain d", Domain.class).list();
			List<RsDomain> rsDomains = new ArrayList<RsDomain>();
			for (Domain domain : domains) {
				rsDomains.add(new RsDomain(domain));
			}
			return rsDomains;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the domains.", e);
			throw new NetshotBadRequestException("Unable to fetch the domains",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsDomain.
	 */
	@XmlRootElement(name = "domain")
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsDomain {

		/** The id. */
		private long id = -1;

		/** The name. */
		private String name = "";

		/** The description. */
		private String description = "";

		/** The ip address. */
		private String ipAddress = "";

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Gets the name.
		 *
		 * @return the name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getName() {
			return name;
		}

		/**
		 * Sets the name.
		 *
		 * @param name the new name
		 */
		public void setName(String name) {
			this.name = name;
		}

		/**
		 * Gets the description.
		 *
		 * @return the description
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getDescription() {
			return description;
		}

		/**
		 * Sets the description.
		 *
		 * @param description the new description
		 */
		public void setDescription(String description) {
			this.description = description;
		}

		/**
		 * Gets the ip address.
		 *
		 * @return the ip address
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getIpAddress() {
			return ipAddress;
		}

		/**
		 * Sets the ip address.
		 *
		 * @param ipAddress the new ip address
		 */
		public void setIpAddress(String ipAddress) {
			this.ipAddress = ipAddress;
		}

		/**
		 * Instantiates a new rs domain.
		 */
		public RsDomain() {

		}

		/**
		 * Instantiates a new rs domain.
		 *
		 * @param domain the domain
		 */
		public RsDomain(Domain domain) {
			this.id = domain.getId();
			this.name = domain.getName();
			this.description = domain.getDescription();
			this.ipAddress = domain.getServer4Address().getIp();
		}

	}

	/**
	 * Adds the domain.
	 *
	 * @param request the request
	 * @param newDomain the new domain
	 * @return the rs domain
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/domains")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a device domain",
		description = "Creates a device domain."
	)
	public RsDomain addDomain(RsDomain newDomain) throws WebApplicationException {
		logger.debug("REST request, add a domain");
		String name = newDomain.getName().trim();
		if (name.isEmpty()) {
			logger.warn("User posted an empty domain name.");
			throw new NetshotBadRequestException("Invalid domain name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN_NAME);
		}
		String description = newDomain.getDescription().trim();
		try {
			Network4Address v4Address = new Network4Address(newDomain.getIpAddress());
			Network6Address v6Address = new Network6Address("::");
			if (!v4Address.isNormalUnicast()) {
				logger.warn("User posted an invalid IP address.");
				throw new NetshotBadRequestException("Invalid IP address",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_IP_ADDRESS);
			}
			Domain domain = new Domain(name, description, v4Address, v6Address);
			Session session = Database.getSession();
			try {
				session.beginTransaction();
				session.save(domain);
				session.getTransaction().commit();
				Netshot.aaaLogger.info("{} has been created.", domain);
				this.suggestReturnCode(Response.Status.CREATED);
			}
			catch (HibernateException e) {
				session.getTransaction().rollback();
				logger.error("Error while adding a domain.", e);
				Throwable t = e.getCause();
				if (t != null && t.getMessage().contains("uplicate")) {
					throw new NetshotBadRequestException(
							"A domain with this name already exists.",
							NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_DOMAIN);
				}
				throw new NetshotBadRequestException(
						"Unable to add the domain to the database",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			return new RsDomain(domain);
		}
		catch (UnknownHostException e) {
			logger.warn("User posted an invalid IP address.");
			throw new NetshotBadRequestException("Malformed IP address",
					NetshotBadRequestException.Reason.NETSHOT_MALFORMED_IP_ADDRESS);
		}
	}

	/**
	 * Sets the domain.
	 *
	 * @param request the request
	 * @param id the id
	 * @param rsDomain the rs domain
	 * @return the rs domain
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/domains/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update a device domain",
		description = "Edits a device domain, by ID."
	)
	public RsDomain setDomain(@PathParam("id") Long id, RsDomain rsDomain)
			throws WebApplicationException {
		logger.debug("REST request, edit domain {}.", id);
		String name = rsDomain.getName().trim();
		if (name.isEmpty()) {
			logger.warn("User posted an invalid domain name.");
			throw new NetshotBadRequestException("Invalid domain name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN_NAME);
		}
		String description = rsDomain.getDescription().trim();
		Network4Address v4Address;
		try {
			v4Address = new Network4Address(rsDomain.getIpAddress());
			if (!v4Address.isNormalUnicast()) {
				logger.warn("User posted an invalid IP address");
				throw new NetshotBadRequestException("Invalid IP address",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_IP_ADDRESS);
			}
		}
		catch (UnknownHostException e) {
			logger.warn("Invalid IP address.", e);
			throw new NetshotBadRequestException("Malformed IP address",
					NetshotBadRequestException.Reason.NETSHOT_MALFORMED_IP_ADDRESS);
		}
		Session session = Database.getSession();
		Domain domain;
		try {
			session.beginTransaction();
			domain = (Domain) session.load(Domain.class, id);
			domain.setName(name);
			domain.setDescription(description);
			domain.setServer4Address(v4Address);
			session.update(domain);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited.", domain);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The domain doesn't exist.", e);
			throw new NetshotBadRequestException("The domain doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while editing the domain.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A domain with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_DOMAIN);
			}
			throw new NetshotBadRequestException(
					"Unable to save the domain... is the name already in use?",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		return new RsDomain(domain);
	}

	/**
	 * Delete a domain.
	 *
	 * @param request the request
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/domains/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove a device domain",
		description = "Remove the given device domain, by ID."
	)
	public void deleteDomain(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete domain {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Domain domain = (Domain) session.load(Domain.class, id);
			session.delete(domain);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted.", domain);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The domain doesn't exist.");
			throw new NetshotBadRequestException("The domain doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("foreign key constraint fails")) {
				throw new NetshotBadRequestException(
						"Unable to delete the domain, there must be devices or tasks using it.",
						NetshotBadRequestException.Reason.NETSHOT_USED_DOMAIN);
			}
			throw new NetshotBadRequestException("Unable to delete the domain",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the device interfaces.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the device interfaces
	 * @throws WebApplicationException the web application exception
	 */
	@SuppressWarnings("deprecation")
	@GET
	@Path("/devices/{id}/interfaces")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get device interfaces",
		description = "Returns the list of interfaces of a given device (by ID)."
	)
	public List<NetworkInterface> getDeviceInterfaces(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, get device {} interfaces.", id);
		Session session = Database.getSession();
		try {
			List<NetworkInterface> deviceInterfaces;
			deviceInterfaces = session
					.createQuery(
							"from NetworkInterface AS networkInterface "
									+ "left join fetch networkInterface.ip4Addresses "
									+ "left join fetch networkInterface.ip6Addresses "
									+ "where device = :device", NetworkInterface.class)
					.setParameter("device", id)
					.setResultTransformer(Criteria.DISTINCT_ROOT_ENTITY).list();
			return deviceInterfaces;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the interfaces.", e);
			throw new NetshotBadRequestException("Unable to fetch the interfaces",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the device modules.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the device modules
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}/modules")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get device modules",
		description = "Returns the list of hardware modules of a given device, by ID."
	)
	public List<Module> getDeviceModules(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, get device {} modules.", id);
		Session session = Database.getSession();
		try {
			List<Module> deviceModules = session
					.createQuery("from Module m where m.device.id = :device", Module.class)
					.setParameter("device", id).list();
			return deviceModules;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the modules.", e);
			throw new NetshotBadRequestException("Unable to fetch the modules",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the device last n (default 20) tasks.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the device tasks
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}/tasks")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get device tasks",
		description = "Returns the list of tasks of a given device (by ID). Up to 'max' tasks are returned, sorted by status and significant date."
	)
	public List<Task> getDeviceTasks(@PathParam("id") Long id,
			@PathParam("max") @DefaultValue("20") Integer maxCount)
			throws WebApplicationException {
		logger.debug("REST request, get device {} tasks.", id);
		Session session = Database.getSession();
		try {
			List<Task> tasks = new ArrayList<Task>();
			tasks.addAll(session.createQuery(
					"select t from CheckComplianceTask t where t.device.id = :deviceId order by t.changeDate desc", CheckComplianceTask.class)
					.setParameter("deviceId", id).setMaxResults(maxCount).list());
			tasks.addAll(session.createQuery(
					"select t from DiscoverDeviceTypeTask t where t.deviceId = :deviceId order by t.changeDate desc", DiscoverDeviceTypeTask.class)
					.setParameter("deviceId", id).setMaxResults(maxCount).list());
			tasks.addAll(session.createQuery(
					"select t from TakeSnapshotTask t where t.device.id = :deviceId order by t.changeDate desc", TakeSnapshotTask.class)
					.setParameter("deviceId", id).setMaxResults(maxCount).list());
			tasks.addAll(session.createQuery(
					"select t from RunDeviceScriptTask t where t.device.id = :deviceId order by t.changeDate desc", RunDeviceScriptTask.class)
					.setParameter("deviceId", id).setMaxResults(maxCount).list());
			tasks.addAll(session.createQuery(
					"select t from RunDiagnosticsTask t where t.device.id = :deviceId order by t.changeDate desc", RunDiagnosticsTask.class)
					.setParameter("deviceId", id).setMaxResults(maxCount).list());
			
			Collections.sort(tasks, new Comparator<Task>() {
				private int getPriority(Task.Status status) {
					switch (status) {
					case RUNNING: return 1;
					case WAITING: return 2;
					case SCHEDULED: return 3;
					case NEW: return 4;
					default: return 10;
					}
				}
				
				private Date getSignificantDate(Task t) {
					if (t.getExecutionDate() == null) {
						return t.getChangeDate();
					}
					else {
						return t.getExecutionDate();
					}
				}

				@Override
				public int compare(Task o1, Task o2) {
					int statusDiff = Integer.compare(
							this.getPriority(o1.getStatus()), this.getPriority(o2.getStatus()));
					if (statusDiff == 0) {
						Date d1 = this.getSignificantDate(o1);
						Date d2 = this.getSignificantDate(o2);
						if (d1 == null) {
							if (d2 == null) {
								return 0;
							}
							else {
								return -1;
							}
						}
						else {
							if (d2 == null) {
								return 1;
							}
							else {
								return d2.compareTo(d1);
							}
						}
					}
					return statusDiff;
				}
			});
			return tasks.subList(0, (maxCount > tasks.size() ? tasks.size() : maxCount));
		}
		catch (Exception e) {
			logger.error("Unable to fetch the tasks.", e);
			throw new NetshotBadRequestException("Unable to fetch the tasks",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the device configs.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the device configs
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}/configs")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get device configs",
		description = "Returns the list of configurations of the given device, by ID."
	)
	public List<Config> getDeviceConfigs(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, get device {} configs.", id);
		Session session = Database.getSession();
		try {
			session.enableFilter("lightAttributesOnly");
			List<Config> deviceConfigs = session
				.createQuery("from Config c left join fetch c.attributes ca where c.device.id = :device", Config.class)
				.setParameter("device", id).list();
			return deviceConfigs;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the configs.", e);
			throw new NetshotBadRequestException("Unable to fetch the configs",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the device config as plain text.
	 *
	 * @param request the request
	 * @param id the id
	 * @param item the item
	 * @return the device config plain
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/configs/{id}/{item}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_OCTET_STREAM })
	@Operation(
		summary = "Get a device configuration item",
		description = "Retrieves a device configuration item, in plain text."
	)
	public Response getDeviceConfigPlain(@PathParam("id") Long id,
			@PathParam("item") String item) throws WebApplicationException {
		logger.debug("REST request, get device {} config {}.", id, item);
		Session session = Database.getSession();
		try {
			Config config = (Config) session.get(Config.class, id);
			if (config == null) {
				logger.warn("Unable to find the config object.");
				throw new WebApplicationException(
						"Unable to find the configuration set",
						javax.ws.rs.core.Response.Status.NOT_FOUND);
			}
			for (ConfigAttribute attribute : config.getAttributes()) {
				if (attribute.getName().equals(item)) {
					if (attribute instanceof ConfigLongTextAttribute) {
						String text = ((ConfigLongTextAttribute) attribute).getLongText().getText();
						if (text == null) {
							throw new WebApplicationException("Configuration item not available",
									javax.ws.rs.core.Response.Status.BAD_REQUEST);
						}
						String fileName = "config.cfg";
						try {
							SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd_HH-mm");
							fileName = String.format("%s_%s_%s.cfg", config.getDevice().getName(), attribute.getName(),
								formatter.format(config.getChangeDate()));
						}
						catch (Exception e) {
						}
						return Response.ok(text)
							.header("Content-Disposition", String.format("attachment; filename=\"%s\"", fileName))
							.build();
					}
					else if (attribute instanceof ConfigBinaryFileAttribute) {
						ConfigBinaryFileAttribute fileAttribute = (ConfigBinaryFileAttribute) attribute;
						File file = fileAttribute.getFileName();
						String fileName = fileAttribute.getOriginalName();
						if (fileName == null) {
							SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd_HH-mm");
							fileName = String.format("%s_%s_%s.dat", config.getDevice().getName(), attribute.getName(),
								formatter.format(config.getChangeDate()));
						}
						return Response.ok(file, MediaType.APPLICATION_OCTET_STREAM)
							.header("Content-Disposition", String.format("attachment; filename=\"%s\"", fileName))
							.build();
					}
				}
			}
			throw new WebApplicationException("Invalid configuration item",
				javax.ws.rs.core.Response.Status.BAD_REQUEST);
		}
		catch (HibernateException e) {
			throw new WebApplicationException("Unable to get the configuration",
					javax.ws.rs.core.Response.Status.INTERNAL_SERVER_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsConfigDiff.
	 */
	@XmlRootElement
	public static class RsConfigDiff {

		/** The original date. */
		private Date originalDate;

		/** The revised date. */
		private Date revisedDate;

		/** The deltas. */
		private Map<String, List<RsConfigDelta>> deltas = new HashMap<String, List<RsConfigDelta>>();

		/**
		 * Instantiates a new rs config diff.
		 *
		 * @param originalDate the original date
		 * @param revisedDate the revised date
		 */
		public RsConfigDiff(Date originalDate, Date revisedDate) {
			this.originalDate = originalDate;
			this.revisedDate = revisedDate;
		}

		/**
		 * Adds the delta.
		 *
		 * @param item the item
		 * @param delta the delta
		 */
		public void addDelta(String item, RsConfigDelta delta) {
			if (!deltas.containsKey(item)) {
				deltas.put(item, new ArrayList<RsConfigDelta>());
			}
			deltas.get(item).add(delta);
		}

		/**
		 * Gets the original date.
		 *
		 * @return the original date
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getOriginalDate() {
			return originalDate;
		}

		/**
		 * Gets the revised date.
		 *
		 * @return the revised date
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getRevisedDate() {
			return revisedDate;
		}

		/**
		 * Gets the deltas.
		 *
		 * @return the deltas
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Map<String, List<RsConfigDelta>> getDeltas() {
			return deltas;
		}
	}

	/**
	 * The Class RsConfigDelta.
	 */
	@XmlRootElement
	public static class RsConfigDelta {

		/**
		 * The Enum Type.
		 */
		public static enum Type {

			/** The change. */
			CHANGE,

			/** The delete. */
			DELETE,

			/** The insert. */
			INSERT;
		}

		/** The item. */
		private String item;

		/** The diff type. */
		private Type diffType;

		/** The original position. */
		private int originalPosition;

		/** The revised position. */
		private int revisedPosition;

		/** The original lines. */
		private List<String> originalLines;

		/** The revised lines. */
		private List<String> revisedLines;

		/** The pre context. */
		private List<String> preContext;

		/** The post context. */
		private List<String> postContext;

		/**
		 * Instantiates a new rs config delta.
		 *
		 * @param delta the delta
		 * @param context the context
		 */
		public RsConfigDelta(Delta<String> delta, List<String> context) {
			switch (delta.getType()) {
			case INSERT:
				this.diffType = Type.INSERT;
				break;
			case DELETE:
				this.diffType = Type.DELETE;
				break;
			case CHANGE:
			default:
				this.diffType = Type.CHANGE;
			}
			this.originalPosition = delta.getOriginal().getPosition();
			this.originalLines = delta.getOriginal().getLines();
			this.revisedPosition = delta.getRevised().getPosition();
			this.revisedLines = delta.getRevised().getLines();
			this.preContext = context.subList(Math.max(this.originalPosition - 3, 0),
					this.originalPosition);
			this.postContext = context.subList(Math.min(this.originalPosition
					+ this.originalLines.size(), context.size() - 1),
					Math.min(this.originalPosition + this.originalLines.size() + 3,
							context.size() - 1));
		}

		/**
		 * Gets the diff type.
		 *
		 * @return the diff type
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Type getDiffType() {
			return diffType;
		}

		/**
		 * Gets the original position.
		 *
		 * @return the original position
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public int getOriginalPosition() {
			return originalPosition;
		}

		/**
		 * Gets the revised position.
		 *
		 * @return the revised position
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public int getRevisedPosition() {
			return revisedPosition;
		}

		/**
		 * Gets the original lines.
		 *
		 * @return the original lines
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public List<String> getOriginalLines() {
			return originalLines;
		}

		/**
		 * Gets the revised lines.
		 *
		 * @return the revised lines
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public List<String> getRevisedLines() {
			return revisedLines;
		}

		/**
		 * Gets the item.
		 *
		 * @return the item
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getItem() {
			return item;
		}

		/**
		 * Gets the pre context.
		 *
		 * @return the pre context
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public List<String> getPreContext() {
			return preContext;
		}

		/**
		 * Gets the post context.
		 *
		 * @return the post context
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public List<String> getPostContext() {
			return postContext;
		}
	}

	/**
	 * Gets the device config diff.
	 *
	 * @param request the request
	 * @param id1 the id1
	 * @param id2 the id2
	 * @return the device config diff
	 */
	@GET
	@Path("/configs/{id1}/vs/{id2}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON })
	@Operation(
		summary = "Get the diff between two configuration objects",
		description = "Retrieves the differences between two given device configuration objets, identified by full IDs."
	)
	public RsConfigDiff getDeviceConfigDiff(@PathParam("id1") Long id1,
			@PathParam("id2") Long id2) {
		logger.debug("REST request, get device config diff, id {} and {}.", id1,
				id2);
		RsConfigDiff configDiffs;
		Session session = Database.getSession();
		Config config1 = null;
		Config config2 = null;
		try {
			config2 = (Config) session.get(Config.class, id2);
			if (config2 != null && id1 == 0) {
				config1 = (Config) session
					.createQuery("from Config c where c.device = :device and c.changeDate < :date2 order by c.changeDate desc")
					.setParameter("device", config2.getDevice())
					.setParameter("date2", config2.getChangeDate())
					.setMaxResults(1)
					.uniqueResult();
				if (config1 == null) {
					config1 = new Config(config2.getDevice());
				}
			}
			else {
				config1 = (Config) session.get(Config.class, id1);
			}
			if (config1 == null || config2 == null) {
				logger.error("Non existing config, {} or {}.", id1, id2);
				throw new NetshotBadRequestException("Unable to fetch the configs",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			DeviceDriver driver1;
			DeviceDriver driver2;
			try {
				driver1 = config1.getDevice().getDeviceDriver();
				driver2 = config2.getDevice().getDeviceDriver();
			}
			catch (MissingDeviceDriverException e) {
				logger.error("Missing driver.");
				throw new NetshotBadRequestException("Missing driver",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			if (!driver1.equals(driver2)) {
				logger.error("Incompatible configurations, {} and {} (different drivers).", id1, id2);
				throw new NetshotBadRequestException("Incompatible configurations",
						NetshotBadRequestException.Reason.NETSHOT_INCOMPATIBLE_CONFIGS);
			}
			
			configDiffs = new RsConfigDiff(config1.getChangeDate(),
					config2.getChangeDate());
			Map<String, ConfigAttribute> attributes1 = config1.getAttributeMap();
			Map<String, ConfigAttribute> attributes2 = config2.getAttributeMap();
			for (AttributeDefinition definition : driver1.getAttributes()) {
				if (definition.isComparable()) {
					ConfigAttribute attribute1 = attributes1.get(definition.getName());
					ConfigAttribute attribute2 = attributes2.get(definition.getName());
					String text1 = (attribute1 == null ? "" : attribute1.getAsText());
					String text2 = (attribute2 == null ? "" : attribute2.getAsText());
					List<String> lines1 = Arrays.asList(text1.replace("\r", "").split("\n"));
					List<String> lines2 = Arrays.asList(text2.replace("\r", "").split("\n"));
					Patch<String> patch = DiffUtils.diff(lines1, lines2);
					for (Delta<String> delta : patch.getDeltas()) {
						configDiffs.addDelta(definition.getTitle(), new RsConfigDelta(delta, lines1));
					}
				}
			}
			return configDiffs;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the configs", e);
			throw new NetshotBadRequestException("Unable to fetch the configs",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the device.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the device
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get a device",
		description = "Retrieve a device will all details."
	)
	public Device getDevice(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, device {}.", id);
		Session session = Database.getSession();
		Device device;
		try {
			device = (Device) session
				.createQuery("from Device d left join fetch d.credentialSets cs left join fetch d.ownerGroups g left join fetch d.complianceCheckResults left join fetch d.attributes where d.id = :id")
				.setParameter("id", id)
				.uniqueResult();
			if (device == null) {
				throw new NetshotBadRequestException("Can't find this device",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
			}
			device.setMgmtDomain(Database.unproxy(device.getMgmtDomain()));
			device.setEolModule(Database.unproxy(device.getEolModule()));
			device.setEosModule(Database.unproxy(device.getEosModule()));
			if (device.getSpecificCredentialSet() != null) {
				DeviceCredentialSet credentialSet = Database.unproxy(device.getSpecificCredentialSet());
				if (DeviceCliAccount.class.isInstance(credentialSet)) {
					((DeviceCliAccount) credentialSet).setPassword("=");
					((DeviceCliAccount) credentialSet).setSuperPassword("=");
				}
				device.setSpecificCredentialSet(credentialSet);
			}
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the device", e);
			throw new NetshotBadRequestException("Unable to fetch the device",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		return device;
	}

	/**
	 * The Class RsLightDevice.
	 */
	@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
	public static class RsLightDevice {

		/** The id. */
		private long id;

		/** The name. */
		private String name;

		/** The family. */
		private String family;

		/** The mgmt address. */
		private Network4Address mgmtAddress;

		/** The status. */
		private Device.Status status;

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Gets the name.
		 *
		 * @return the name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getName() {
			return name;
		}

		/**
		 * Sets the name.
		 *
		 * @param name the new name
		 */
		public void setName(String name) {
			this.name = name;
		}

		/**
		 * Gets the family.
		 *
		 * @return the family
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getFamily() {
			return family;
		}

		/**
		 * Sets the family.
		 *
		 * @param family the new family
		 */
		public void setFamily(String family) {
			this.family = family;
		}

		/**
		 * Gets the mgmt address.
		 *
		 * @return the mgmt address
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Network4Address getMgmtAddress() {
			return mgmtAddress;
		}

		/**
		 * Sets the mgmt address.
		 *
		 * @param mgmtAddress the new mgmt address
		 */
		public void setMgmtAddress(Network4Address mgmtAddress) {
			this.mgmtAddress = mgmtAddress;
		}

		/**
		 * Gets the status.
		 *
		 * @return the status
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Device.Status getStatus() {
			return status;
		}

		/**
		 * Sets the status.
		 *
		 * @param status the new status
		 */
		public void setStatus(Device.Status status) {
			this.status = status;
		}


	}

	/**
	 * Gets the devices.
	 *
	 * @param request the request
	 * @return the devices
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the devices",
		description = "Retrieves the device list with minimal details."
	)
	public List<RsLightDevice> getDevices() throws WebApplicationException {
		logger.debug("REST request, devices.");
		Session session = Database.getSession();
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			List<RsLightDevice> devices = session.createQuery(DEVICELIST_BASEQUERY + "from Device d")
				.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class))
				.list();
			return devices;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the devices", e);
			throw new NetshotBadRequestException("Unable to fetch the devices",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the device types.
	 *
	 * @param request the request
	 * @return the device types
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devicetypes")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the device types",
		description = "Returns the list of device types (drivers)."
	)
	public List<DeviceDriver> getDeviceTypes(@DefaultValue("false") @QueryParam("refresh") boolean refresh) throws WebApplicationException {
		logger.debug("REST request, device types.");
		if (refresh) {
			try {
				DeviceDriver.refreshDrivers();
			}
			catch (Exception e) {
				logger.error("Error in REST service while refreshing the device types.", e);
			}
		}
		List<DeviceDriver> deviceTypes = new ArrayList<DeviceDriver>();
		deviceTypes.addAll(DeviceDriver.getAllDrivers());
		return deviceTypes;
	}

	/**
	 * The Class RsDeviceFamily.
	 */
	@XmlRootElement(name = "deviceType")
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsDeviceFamily {

		/** The device type. */
		private String driver;

		/** The device family. */
		private String deviceFamily;

		@XmlElement
		@JsonView(DefaultView.class)
		public String getDriver() {
			return driver;
		}

		public void setDriver(String driver) {
			this.driver = driver;
		}

		/**
		 * Gets the device family.
		 *
		 * @return the device family
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getDeviceFamily() {
			return deviceFamily;
		}

		/**
		 * Sets the device family.
		 *
		 * @param deviceFamily the new device family
		 */
		public void setDeviceFamily(String deviceFamily) {
			this.deviceFamily = deviceFamily;
		}
	}

	/**
	 * Gets the device families.
	 *
	 * @param request the request
	 * @return the device families
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devicefamilies")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the existing device families",
		description = "Returns the list of device families (driver specific) currenly known in the database."
	)
	public List<RsDeviceFamily> getDeviceFamilies() throws WebApplicationException {
		logger.debug("REST request, device families.");
		Session session = Database.getSession();
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			List<RsDeviceFamily> deviceFamilies = session
				.createQuery("select distinct d.driver as driver, d.family as deviceFamily from Device d")
				.setResultTransformer(Transformers.aliasToBean(RsDeviceFamily.class))
				.list();
			return deviceFamilies;
		}
		catch (HibernateException e) {
			logger.error("Error while loading device families.", e);
			throw new NetshotBadRequestException("Database error",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	@XmlRootElement(name = "partNumber")
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsPartNumber {
		private String partNumber;

		@XmlElement
		@JsonView(DefaultView.class)
		public String getPartNumber() {
			return partNumber;
		}

		public void setPartNumber(String partNumber) {
			this.partNumber = partNumber;
		}
	}


	/**
	 * Gets the known part numbers.
	 *
	 * @param request the request
	 * @return the part numbers
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/partnumbers")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the known part numbers",
		description = "Returns the list of all known part numbers currently existing in the module table."
	)
	public List<RsPartNumber> getPartNumbers() throws WebApplicationException {
		logger.debug("REST request, dpart numbers.");
		Session session = Database.getSession();
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			List<RsPartNumber> partNumbers = session
				.createQuery("select distinct m.partNumber as partNumber from Module m")
				.setResultTransformer(Transformers.aliasToBean(RsPartNumber.class))
				.list();
			return partNumbers;
		}
		catch (HibernateException e) {
			logger.error("Error while loading part numbers.", e);
			throw new NetshotBadRequestException("Database error",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsNewDevice.
	 */
	@XmlRootElement(name = "device")
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsNewDevice {

		/** The auto discover. */
		private boolean autoDiscover = true;

		/** The auto discovery task. */
		private long autoDiscoveryTask = 0;

		/** The ip address. */
		private String ipAddress = "";

		/** The domain id. */
		private long domainId = -1;

		/** The name. */
		private String name = "";

		/** The device type. */
		private String deviceType = "";

		/** The connection IP address (optional). */
		private String connectIpAddress = null;
		
		/** The SSH port. */
		private String sshPort;

		/** The Telnet port. */
		private String telnetPort;
		
		/** A device-specific credential set. */
		private DeviceCredentialSet specificCredentialSet;
		
		/**
		 * Checks if is auto discover.
		 *
		 * @return true, if is auto discover
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isAutoDiscover() {
			return autoDiscover;
		}

		/**
		 * Sets the auto discover.
		 *
		 * @param autoDiscover the new auto discover
		 */
		public void setAutoDiscover(boolean autoDiscover) {
			this.autoDiscover = autoDiscover;
		}

		/**
		 * Gets the auto discovery task.
		 *
		 * @return the auto discovery task
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getAutoDiscoveryTask() {
			return autoDiscoveryTask;
		}

		/**
		 * Sets the auto discovery task.
		 *
		 * @param autoDiscoveryTask the new auto discovery task
		 */
		public void setAutoDiscoveryTask(long autoDiscoveryTask) {
			this.autoDiscoveryTask = autoDiscoveryTask;
		}

		/**
		 * Gets the ip address.
		 *
		 * @return the ip address
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getIpAddress() {
			return ipAddress;
		}

		/**
		 * Sets the ip address.
		 *
		 * @param ipAddress the new ip address
		 */
		public void setIpAddress(String ipAddress) {
			this.ipAddress = ipAddress;
		}

		/**
		 * Gets the domain id.
		 *
		 * @return the domain id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getDomainId() {
			return domainId;
		}

		/**
		 * Sets the domain id.
		 *
		 * @param domainId the new domain id
		 */
		public void setDomainId(long domainId) {
			this.domainId = domainId;
		}

		/**
		 * Gets the name.
		 *
		 * @return the name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getName() {
			return name;
		}

		/**
		 * Sets the name.
		 *
		 * @param name the new name
		 */
		public void setName(String name) {
			this.name = name;
		}

		/**
		 * Gets the device type.
		 *
		 * @return the device type
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getDeviceType() {
			return deviceType;
		}

		/**
		 * Sets the device type.
		 *
		 * @param deviceType the new device type
		 */
		public void setDeviceType(String deviceType) {
			this.deviceType = deviceType;
		}


		/**
		 * Gets the connect IP address.
		 * @return the connect IP address
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getConnectIpAddress() {
			return connectIpAddress;
		}

		/**
		 * Sets the connection IP address.
		 * @param connectIpAddress the new connection IP address. "" to clear it.
		 */
		public void setConnectIpAddress(String connectIpAddress) {
			this.connectIpAddress = connectIpAddress;
		}

		/**
		 * Gets the SSH port.
		 * @return the SSH port
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getSshPort() {
			return sshPort;
		}

		/**
		 * Sets the SSH port.
		 * @param sshPort the new SSH port; "" to clear it
		 */
		public void setSshPort(String sshPort) {
			this.sshPort = sshPort;
		}

		/**
		 * Gets the Telnet port.
		 * @return the Telnet port
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getTelnetPort() {
			return telnetPort;
		}

		/**
		 * Sets the Telnet port.
		 * @param telnetPort the new Telnet port; "" to clear it
		 */
		public void setTelnetPort(String telnetPort) {
			this.telnetPort = telnetPort;
		}

		/**
		 * Gets the device-specific credential set.
		 * @return the specific credential set
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public DeviceCredentialSet getSpecificCredentialSet() {
			return specificCredentialSet;
		}

		/**
		 * Sets a device-specific credential set.
		 * @param specificCredentialSet the new specific credential set
		 */
		public void setSpecificCredentialSet(DeviceCredentialSet specificCredentialSet) {
			this.specificCredentialSet = specificCredentialSet;
		}
	}

	/**
	 * Adds the device.
	 *
	 * @param request the request
	 * @param device the device
	 * @return the task
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/devices")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a device",
		description = "In auto discovery mode, this will create a 'discover device' task, and the device will be create if the discovery is successful." +
		" Otherwise, the device will be immediately created in the database, and a 'snapshot' task will be created."
	)
	public Task addDevice(RsNewDevice device) throws WebApplicationException {
		logger.debug("REST request, new device.");
		Network4Address deviceAddress;
		try {
			deviceAddress = new Network4Address(device.getIpAddress());
			if (!deviceAddress.isNormalUnicast()) {
				logger.warn("User posted an invalid IP address (not normal unicast).");
				throw new NetshotBadRequestException("Invalid IP address",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_IP_ADDRESS);
			}
		}
		catch (UnknownHostException e) {
			logger.warn("User posted an invalid IP address.");
			throw new NetshotBadRequestException("Malformed IP address",
					NetshotBadRequestException.Reason.NETSHOT_MALFORMED_IP_ADDRESS);
		}
		Network4Address connectAddress = null;
		if (device.getConnectIpAddress() != null && !device.getConnectIpAddress().equals("")) {
			try {
				connectAddress = new Network4Address(device.getConnectIpAddress());
				if (!deviceAddress.isNormalUnicast()) {
					logger.warn("User posted an invalid connect IP address (not normal unicast).");
					throw new NetshotBadRequestException("Invalid connect IP address",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_IP_ADDRESS);
				}
			}
			catch (UnknownHostException e) {
				logger.warn("User posted an invalid IP address.");
				throw new NetshotBadRequestException("Malformed connect IP address",
						NetshotBadRequestException.Reason.NETSHOT_MALFORMED_IP_ADDRESS);
			}
		}
		Integer sshPort = null;
		if (device.getSshPort() != null && !"".equals(device.getSshPort())) {
			try {
				int port = Integer.parseInt(device.getSshPort());
				if (port < 1 || port > 65535) {
					throw new Exception();
				}
				sshPort = port;
			}
			catch (Exception e) {
				throw new NetshotBadRequestException("Invalid SSH port",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_PORT);
			}
		}
		Integer telnetPort = null;
		if (device.getTelnetPort() != null && !"".equals(device.getTelnetPort())) {
			try {
				int port = Integer.parseInt(device.getTelnetPort());
				if (port < 1 || port > 65535) {
					throw new Exception();
				}
				telnetPort = port;
			}
			catch (Exception e) {
				throw new NetshotBadRequestException("Invalid Telnet port",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_PORT);
			}
		}
		Domain domain;
		List<DeviceCredentialSet> knownCommunities;
		Session session = Database.getSession();
		try {
			logger.debug("Looking for an existing device with this IP address.");
			Device duplicate = (Device) session
					.createQuery("from Device d where d.mgmtAddress.address = :ip")
					.setParameter("ip", deviceAddress.getIntAddress()).uniqueResult();
			if (duplicate != null) {
				logger.error("Device {} is already present with this IP address.",
						duplicate.getId());
				throw new NetshotBadRequestException(String.format(
						"The device '%s' already exists with this IP address.",
						duplicate.getName()),
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_DEVICE);
			}
			domain = (Domain) session.load(Domain.class, device.getDomainId());
			knownCommunities = session
				.createQuery("from DeviceSnmpCommunity c where (mgmtDomain = :domain or mgmtDomain is null) and (not (c.deviceSpecific = :true))",
						DeviceCredentialSet.class)
				.setParameter("domain", domain)
				.setParameter("true", true)
				.list();
			if (knownCommunities.size() == 0 && device.isAutoDiscover()) {
				logger.error("No available SNMP community");
				throw new NetshotBadRequestException(
						"There is no known SNMP community in the database to poll the device.",
						NetshotBadRequestException.Reason.NETSHOT_CREDENTIALS_NOTFOUND);
			}
		}
		catch (ObjectNotFoundException e) {
			logger.error("Non existing domain.", e);
			throw new NetshotBadRequestException("Invalid domain",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
		}
		catch (HibernateException e) {
			logger.error("Error while loading domain or communities.", e);
			throw new NetshotBadRequestException("Database error",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		User user = (User) request.getAttribute("user");
		if (device.isAutoDiscover()) {
			try {
				DiscoverDeviceTypeTask task = new DiscoverDeviceTypeTask(deviceAddress, domain,
						String.format("Device added by %s", user.getUsername()), user.getUsername());
				task.setComments(String.format("Autodiscover device %s",
						deviceAddress.getIp()));
				for (DeviceCredentialSet credentialSet : knownCommunities) {
					task.addCredentialSet(credentialSet);
				}
				TaskManager.addTask(task);
				Netshot.aaaLogger.info("{} has been added.", task);
				this.suggestReturnCode(Response.Status.CREATED);
				return task;
			}
			catch (SchedulerException e) {
				logger.error("Unable to schedule the discovery task.", e);
				throw new NetshotBadRequestException("Unable to schedule the task",
						NetshotBadRequestException.Reason.NETSHOT_SCHEDULE_ERROR);
			}
			catch (HibernateException e) {
				logger.error("Error while adding the discovery task.", e);
				throw new NetshotBadRequestException("Database error",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
		}
		else {
			DeviceDriver driver = DeviceDriver.getDriverByName(device.getDeviceType());
			if (driver == null) {
				logger.warn("Invalid posted device driver.");
				throw new NetshotBadRequestException("Invalid device type.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE_CLASSNAME);
			}
			session = Database.getSession();
			TakeSnapshotTask task;
			Device newDevice = null;
			try {
				session.beginTransaction();
				newDevice = new Device(driver.getName(), deviceAddress, domain, user.getUsername());
				if (connectAddress != null) {
					newDevice.setConnectAddress(connectAddress);
				}
				if (sshPort != null) {
					newDevice.setSshPort(sshPort);
				}
				if (telnetPort != null) {
					newDevice.setTelnetPort(telnetPort);
				}
				if (device.getSpecificCredentialSet() != null && device.getSpecificCredentialSet() instanceof DeviceCliAccount) {
					device.getSpecificCredentialSet().setName(DeviceCredentialSet.generateSpecificName());
					device.getSpecificCredentialSet().setDeviceSpecific(true);
					session.save(device.getSpecificCredentialSet());
					newDevice.setSpecificCredentialSet(device.getSpecificCredentialSet());
					newDevice.setAutoTryCredentials(false);
				}
				session.save(newDevice);
				task = new TakeSnapshotTask(newDevice, "Initial snapshot after device creation", user.getUsername(), true, false, false);
				session.save(task);
				session.getTransaction().commit();
				Netshot.aaaLogger.info("{} has been created.", newDevice);
			}
			catch (Exception e) {
				session.getTransaction().rollback();
				logger.error("Error while creating the device", e);
				throw new NetshotBadRequestException("Database error",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			if (newDevice != null) {
				DynamicDeviceGroup.refreshAllGroups(newDevice);
			}
			try {
				TaskManager.addTask(task);
				this.suggestReturnCode(Response.Status.CREATED);
				return task;
			}
			catch (HibernateException e) {
				logger.error("Unable to add the task.", e);
				throw new NetshotBadRequestException(
						"Unable to add the task to the database.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			catch (SchedulerException e) {
				logger.error("Unable to schedule the task.", e);
				throw new NetshotBadRequestException("Unable to schedule the task.",
						NetshotBadRequestException.Reason.NETSHOT_SCHEDULE_ERROR);
			}
		}

	}

	/**
	 * Delete device.
	 *
	 * @param request the request
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/devices/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove a device",
		description = "Remove the given device, by ID."
	)
	public void deleteDevice(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete device {}.", id);
		Session session = Database.getSession();
		try {
			List<File> toDeleteFiles = new ArrayList<File>();
			List<ConfigBinaryFileAttribute> attributes = session
					.createQuery("from ConfigBinaryFileAttribute cfa where cfa.config.device.id = :id",
							ConfigBinaryFileAttribute.class)
					.setParameter("id", id)
					.list();
			for (ConfigBinaryFileAttribute attribute : attributes) {
				toDeleteFiles.add(attribute.getFileName());
			}
			session.beginTransaction();
			Device device = (Device) session.load(Device.class, id);
			for (DeviceGroup group : device.getOwnerGroups()) {
				group.deleteCachedDevice(device);
			}
			session.delete(device);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted.", device);
			for (File toDeleteFile : toDeleteFiles) {
				try {
					toDeleteFile.delete();
				}
				catch (Exception e) {
					logger.error("Error while removing binary file {}", toDeleteFile, e);
				}
			}
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the device {}.", id, e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("foreign key constraint fails")) {
				throw new NetshotBadRequestException(
						"Unable to delete the device, there must be other objects using it.",
						NetshotBadRequestException.Reason.NETSHOT_USED_DEVICE);
			}
			throw new NetshotBadRequestException("Unable to delete the device",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (Exception e) {
			logger.error("Error", e);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsDevice.
	 */
	@XmlRootElement(name = "device")
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsDevice {

		/** The id. */
		private long id = -1;

		/** The enable. */
		private Boolean enabled = null;

		/** The comments. */
		private String comments = null;

		/** The ip address. */
		private String ipAddress = null;

		/** The connection IP address (optional). */
		private String connectIpAddress = null;
		
		/** The SSH port. */
		private String sshPort;

		/** The Telnet port. */
		private String telnetPort;

		/** The auto try credentials. */
		private Boolean autoTryCredentials = null;

		/** The credential set ids. */
		private List<Long> credentialSetIds = null;

		private List<Long> clearCredentialSetIds = null;

		private Long mgmtDomain = null;
		
		/** A device-specific credential set. */
		private DeviceCredentialSet specificCredentialSet = null;

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Gets the comments.
		 *
		 * @return the comments
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getComments() {
			return comments;
		}

		/**
		 * Sets the comments.
		 *
		 * @param comments the new comments
		 */
		public void setComments(String comments) {
			this.comments = comments;
		}

		/**
		 * Gets the ip address.
		 *
		 * @return the ip address
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getIpAddress() {
			return ipAddress;
		}

		/**
		 * Sets the ip address.
		 *
		 * @param ipAddress the new ip address
		 */
		public void setIpAddress(String ipAddress) {
			this.ipAddress = ipAddress;
		}

		/**
		 * Checks if is auto try credentials.
		 *
		 * @return true, if is auto try credentials
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Boolean isAutoTryCredentials() {
			return autoTryCredentials;
		}

		/**
		 * Sets the auto try credentials.
		 *
		 * @param autoTryCredentials the new auto try credentials
		 */
		public void setAutoTryCredentials(Boolean autoTryCredentials) {
			this.autoTryCredentials = autoTryCredentials;
		}

		/**
		 * Gets the credential set ids.
		 *
		 * @return the credential set ids
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public List<Long> getCredentialSetIds() {
			return credentialSetIds;
		}

		/**
		 * Sets the credential set ids.
		 *
		 * @param credentialSetIds the new credential set ids
		 */
		public void setCredentialSetIds(List<Long> credentialSetIds) {
			this.credentialSetIds = credentialSetIds;
		}

		/**
		 * Instantiates a new rs device.
		 */
		public RsDevice() {

		}

		/**
		 * Checks if is enable.
		 *
		 * @return true, if is enable
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Boolean isEnabled() {
			return enabled;
		}

		/**
		 * Sets the device as enabled.
		 *
		 * @param enable the new enable
		 */
		public void setEnabled(Boolean enabled) {
			this.enabled = enabled;
		}

		/**
		 * Gets the management domain.
		 * @return the management domain
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Long getMgmtDomain() {
			return mgmtDomain;
		}

		/**
		 * Sets the management domain.
		 * @param mgmtDomain the new management domain
		 */
		public void setMgmtDomain(Long mgmtDomain) {
			this.mgmtDomain = mgmtDomain;
		}

		/**
		 * Gets the list of credential set IDs.
		 * @return the list of credential sets
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public List<Long> getClearCredentialSetIds() {
			return clearCredentialSetIds;
		}

		/**
		 * Sets the list of credential set IDs to use with this device.
		 * @param clearCredentialSetIds the new list of credential sets
		 */
		public void setClearCredentialSetIds(List<Long> clearCredentialSetIds) {
			this.clearCredentialSetIds = clearCredentialSetIds;
		}

		/**
		 * Gets the connect IP address.
		 * @return the connect IP address
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getConnectIpAddress() {
			return connectIpAddress;
		}

		/**
		 * Sets the connection IP address.
		 * @param connectIpAddress the new connection IP address. "" to clear it.
		 */
		public void setConnectIpAddress(String connectIpAddress) {
			this.connectIpAddress = connectIpAddress;
		}

		/**
		 * Gets the SSH port.
		 * @return the SSH port
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getSshPort() {
			return sshPort;
		}

		/**
		 * Sets the SSH port.
		 * @param sshPort the new SSH port; "" to clear it
		 */
		public void setSshPort(String sshPort) {
			this.sshPort = sshPort;
		}

		/**
		 * Gets the Telnet port.
		 * @return the Telnet port
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getTelnetPort() {
			return telnetPort;
		}

		/**
		 * Sets the Telnet port.
		 * @param telnetPort the new Telnet port; "" to clear it
		 */
		public void setTelnetPort(String telnetPort) {
			this.telnetPort = telnetPort;
		}
		

		/**
		 * Gets the device-specific credential set.
		 * @return the specific credential set
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public DeviceCredentialSet getSpecificCredentialSet() {
			return specificCredentialSet;
		}

		/**
		 * Sets a device-specific credential set.
		 * @param specificCredentialSet the new specific credential set
		 */
		public void setSpecificCredentialSet(DeviceCredentialSet specificCredentialSet) {
			this.specificCredentialSet = specificCredentialSet;
		}
	}

	/**
	 * Sets the device.
	 *
	 * @param request the request
	 * @param id the id
	 * @param rsDevice the rs device
	 * @return the device
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/devices/{id}")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update a device",
		description = "Edits a device, by ID."
	)
	public Device setDevice(@PathParam("id") Long id, RsDevice rsDevice)
			throws WebApplicationException {
		logger.debug("REST request, edit device {}.", id);
		Device device;
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			device = (Device) session.load(Device.class, id);
			if (rsDevice.isEnabled() != null) {
				if (rsDevice.isEnabled()) {
					device.setStatus(Status.INPRODUCTION);
				}
				else {
					device.setStatus(Status.DISABLED);
				}
			}
			if (rsDevice.getIpAddress() != null) {
				Network4Address v4Address = new Network4Address(rsDevice.getIpAddress());
				if (!v4Address.isNormalUnicast()) {
					session.getTransaction().rollback();
					throw new NetshotBadRequestException("Invalid IP address",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_IP_ADDRESS);
				}
				device.setMgmtAddress(v4Address);
			}
			if (rsDevice.getConnectIpAddress() != null) {
				if ("".equals(rsDevice.getConnectIpAddress())) {
					device.setConnectAddress(null);
				}
				else {
					Network4Address v4ConnectAddress = new Network4Address(rsDevice.getConnectIpAddress());
					if (!v4ConnectAddress.isNormalUnicast() && !v4ConnectAddress.isLoopback()) {
						session.getTransaction().rollback();
						throw new NetshotBadRequestException("Invalid Connect IP address",
								NetshotBadRequestException.Reason.NETSHOT_INVALID_IP_ADDRESS);
					}
					device.setConnectAddress(v4ConnectAddress);
				}
			}
			if (rsDevice.getSshPort() != null) {
				if ("".equals(rsDevice.getSshPort())) {
					device.setSshPort(0);
				}
				else {
					try {
						int port = Integer.parseInt(rsDevice.getSshPort());
						if (port < 1 || port > 65535) {
							throw new Exception();
						}
						device.setSshPort(port);
					}
					catch (Exception e) {
						session.getTransaction().rollback();
						throw new NetshotBadRequestException("Invalid SSH port",
								NetshotBadRequestException.Reason.NETSHOT_INVALID_PORT);
					}
				}
			}
			if (rsDevice.getTelnetPort() != null) {
				if ("".equals(rsDevice.getTelnetPort())) {
					device.setTelnetPort(0);
				}
				else {
					try {
						int port = Integer.parseInt(rsDevice.getTelnetPort());
						if (port < 1 || port > 65535) {
							throw new Exception();
						}
						device.setTelnetPort(port);
					}
					catch (Exception e) {
						session.getTransaction().rollback();
						throw new NetshotBadRequestException("Invalid Telnet port",
								NetshotBadRequestException.Reason.NETSHOT_INVALID_PORT);
					}
				}
			}
			if (rsDevice.getComments() != null) {
				device.setComments(rsDevice.getComments());
			}
			if (rsDevice.getCredentialSetIds() != null) {
				if (rsDevice.getClearCredentialSetIds() == null) {
					device.clearCredentialSets();
				}
				else {
					Iterator<DeviceCredentialSet> csIterator = device.getCredentialSets().iterator();
					while (csIterator.hasNext()) {
						if (rsDevice.getClearCredentialSetIds().contains(csIterator.next().getId())) {
							csIterator.remove();
						}
					}
				}
				for (Long credentialSetId : rsDevice.getCredentialSetIds()) {
					try {
						DeviceCredentialSet credentialSet = (DeviceCredentialSet) session
								.load(DeviceCredentialSet.class, credentialSetId);
						device.addCredentialSet(credentialSet);
					}
					catch (ObjectNotFoundException e) {
						logger.error("Non existing credential set {}.", credentialSetId);
					}
				}
			}
			if (rsDevice.isAutoTryCredentials() != null) {
				device.setAutoTryCredentials(rsDevice.isAutoTryCredentials());
			}
			DeviceCredentialSet rsCredentialSet = rsDevice.getSpecificCredentialSet();
			DeviceCredentialSet credentialSet = device.getSpecificCredentialSet();
			
			if (rsCredentialSet == null) {
				if (credentialSet != null) {
					session.delete(credentialSet);
					device.setSpecificCredentialSet(null);
				}
			}
			else if (DeviceCliAccount.class.isInstance(rsCredentialSet)) {
				if (credentialSet != null && !credentialSet.getClass().equals(rsCredentialSet.getClass())) {
					session.delete(credentialSet);
					credentialSet = null;
				}
				if (credentialSet == null) {
					credentialSet = rsCredentialSet;
					credentialSet.setDeviceSpecific(true);
					credentialSet.setName(DeviceCredentialSet.generateSpecificName());
					session.save(credentialSet);
					device.setSpecificCredentialSet(credentialSet);
				}
				else {
					DeviceCliAccount cliAccount = (DeviceCliAccount) credentialSet;
					DeviceCliAccount rsCliAccount = (DeviceCliAccount) rsCredentialSet;
					cliAccount.setUsername(rsCliAccount.getUsername());
					if (!rsCliAccount.getPassword().equals("=")) {
						cliAccount.setPassword(rsCliAccount.getPassword());
					}
					if (!rsCliAccount.getSuperPassword().equals("=")) {
						cliAccount.setSuperPassword(rsCliAccount.getSuperPassword());
					}
					if (DeviceSshKeyAccount.class.isInstance(credentialSet)) {
						((DeviceSshKeyAccount) cliAccount).setPublicKey(((DeviceSshKeyAccount) rsCliAccount).getPublicKey());
						((DeviceSshKeyAccount) cliAccount).setPrivateKey(((DeviceSshKeyAccount) rsCliAccount).getPrivateKey());
					}
				}
			}
			if (rsDevice.getMgmtDomain() != null) {
				Domain domain = (Domain) session.load(Domain.class, rsDevice.getMgmtDomain());
				device.setMgmtDomain(domain);
			}
			session.update(device);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited.", device); 
		}
		catch (UnknownHostException e) {
			session.getTransaction().rollback();
			logger.warn("User posted an invalid IP address.", e);
			throw new NetshotBadRequestException("Malformed IP address",
					NetshotBadRequestException.Reason.NETSHOT_MALFORMED_IP_ADDRESS);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The device doesn't exist.", e);
			throw new NetshotBadRequestException("The device doesn't exist anymore.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Cannot edit the device.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A device with this IP address already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_DEVICE);
			}
			if (t != null && t.getMessage().contains("domain")) {
				throw new NetshotBadRequestException("Unable to find the domain",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
			}
			throw new NetshotBadRequestException("Unable to save the device.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		DynamicDeviceGroup.refreshAllGroups(device);
		return this.getDevice(id);
	}

	/**
	 * Gets the task.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the task
	 */
	@GET
	@Path("/tasks/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get a task.",
		description = "Retrieves the status of a given task, by ID."
	)
	public Task getTask(@PathParam("id") Long id) {
		logger.debug("REST request, get task {}", id);
		Session session = Database.getSession();
		Task task;
		try {
			task = (Task) session.get(Task.class, id);
			return task;
		}
		catch (ObjectNotFoundException e) {
			logger.error("Unable to find the task {}.", id, e);
			throw new NetshotBadRequestException("Task not found",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the task {}.", id, e);
			throw new NetshotBadRequestException("Unable to fetch the task",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}
	
	/**
	 * Gets the debug log of a task
	 *
	 * @param request the request
	 * @param id the id
	 * @param item the item
	 * @return the device config plain
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/tasks/{id}/debuglog")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_OCTET_STREAM })
	@Operation(
		summary = "Get the debug log of a task",
		description = "Retrieves the full debug log of a given task, by ID."
	)
	public Response getTaskDebugLog(@PathParam("id") Long id) throws WebApplicationException {
		logger.debug("REST request, get task {} debug log.", id);
		Session session = Database.getSession();
		Task task;
		try {
			task = (Task) session.get(Task.class, id);
			DebugLog log = task.getDebugLog();
			String text = log == null ? "" : log.getText();
			String fileName = String.format("debug_%d.log", id);
			return Response.ok(text)
					.header("Content-Disposition", "attachment; filename=" + fileName)
					.build();
		}
		catch (ObjectNotFoundException e) {
			logger.error("Unable to find the task {}.", id, e);
			throw new WebApplicationException(
					"Task not found",
					javax.ws.rs.core.Response.Status.NOT_FOUND);
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the task {}.", id, e);
			throw new WebApplicationException("Unable to get the task",
					javax.ws.rs.core.Response.Status.INTERNAL_SERVER_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the tasks.
	 *
	 * @param request the request
	 * @return the tasks
	 */
	@GET
	@Path("/tasks")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the tasks",
		description = "Returns the list of tasks. Up to 'max' tasks are returned."
	)
	public List<Task> getTasks(@PathParam("max") @DefaultValue("1000") Integer maxCount) {
		logger.debug("REST request, get tasks.");
		Session session = Database.getSession();
		try {
			List<Task> tasks = session
				.createQuery("from Task t order by t.id desc", Task.class)
				.setMaxResults(maxCount)
				.list();
			return tasks;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the tasks.", e);
			throw new NetshotBadRequestException("Unable to fetch the tasks",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the credential sets.
	 *
	 * @param request the request
	 * @return the credential sets
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/credentialsets")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the global credential sets",
		description = "Returns the list of global credential sets (SSH, SNMP, etc. accounts) for authentication against the devices."
	)
	public List<DeviceCredentialSet> getCredentialSets()
			throws WebApplicationException {
		logger.debug("REST request, get credentials.");
		Session session = Database.getSession();
		List<DeviceCredentialSet> credentialSets;
		try {
			credentialSets = session
				.createQuery("select cs from DeviceCredentialSet cs where not (cs.deviceSpecific = :true)",
						DeviceCredentialSet.class)
				.setParameter("true", true)
				.list();
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the credentials.", e);
			throw new NetshotBadRequestException("Unable to fetch the credentials",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		for (DeviceCredentialSet credentialSet : credentialSets) {
			if (DeviceCliAccount.class.isInstance(credentialSet)) {
				((DeviceCliAccount) credentialSet).setPassword("=");
				((DeviceCliAccount) credentialSet).setSuperPassword("=");
			}
		}
		return credentialSets;
	}

	/**
	 * Delete credential set.
	 *
	 * @param request the request
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/credentialsets/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove a credential set",
		description = "Removes the given credential set, by ID."
	)
	public void deleteCredentialSet(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete credentials {}", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			DeviceCredentialSet credentialSet = (DeviceCredentialSet) session.load(
					DeviceCredentialSet.class, id);
			if (credentialSet.isDeviceSpecific()) {
				throw new NetshotBadRequestException(
						"Can't delete a device-specific credential set.",
						NetshotBadRequestException.Reason.NETSHOT_USED_CREDENTIALS);
			}
			/* HACK! In JPA, this would require updating each task one by one... */
			session
					.createSQLQuery("delete from discover_device_type_task_credential_sets where credential_sets = :cs")
					.setParameter("cs", id)
					.executeUpdate();
			session.delete(credentialSet);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted.", credentialSet);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (Exception e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the credentials {}", id, e);
			Throwable t = e.getCause();
			if (e instanceof NetshotBadRequestException) {
				throw e;
			}
			if (t != null && t.getMessage().contains("foreign key constraint fails")) {
				throw new NetshotBadRequestException(
						"Unable to delete the credential set, there must be devices or tasks using it.",
						NetshotBadRequestException.Reason.NETSHOT_USED_CREDENTIALS);
			}
			throw new NetshotBadRequestException(
					"Unable to delete the credential set",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Adds the credential set.
	 *
	 * @param request the request
	 * @param credentialSet the credential set
	 * @return the device credential set
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/credentialsets")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a credential set",
		description = "Creates a credential set, which then can be used to authenticate against the devices."
	)
	public void addCredentialSet(DeviceCredentialSet credentialSet)
			throws WebApplicationException {
		logger.debug("REST request, add credentials.");
		if (credentialSet.getName() == null || credentialSet.getName().trim().equals("")) {
			logger.error("Invalid credential set name.");
			throw new NetshotBadRequestException("Invalid name for the credential set",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_CREDENTIALS_NAME);
		}
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			if (credentialSet.getMgmtDomain() != null) {
				credentialSet.setMgmtDomain((Domain) session.load(Domain.class, credentialSet.getMgmtDomain().getId()));
			}
			credentialSet.setDeviceSpecific(false);
			session.save(credentialSet);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created.", credentialSet);
			this.suggestReturnCode(Response.Status.CREATED);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			Throwable t = e.getCause();
			logger.error("Can't add the credentials.", e);
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A credential set with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_CREDENTIALS);
			}
			else if (t != null && t.getMessage().contains("mgmt_domain")) {
				throw new NetshotBadRequestException(
						"The domain doesn't exist.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
			}
			throw new NetshotBadRequestException("Unable to save the credential set",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Sets the credential set.
	 *
	 * @param request the request
	 * @param id the id
	 * @param rsCredentialSet the rs credential set
	 * @return the device credential set
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/credentialsets/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update a credential set",
		description = "Edits a credential set, by ID."
	)
	public DeviceCredentialSet setCredentialSet(@PathParam("id") Long id,
			DeviceCredentialSet rsCredentialSet) throws WebApplicationException {
		logger.debug("REST request, edit credentials {}", id);
		Session session = Database.getSession();
		DeviceCredentialSet credentialSet;
		try {
			session.beginTransaction();
			credentialSet = (DeviceCredentialSet) session.get(
					rsCredentialSet.getClass(), id);
			if (credentialSet == null) {
				logger.error("Unable to find the credential set {}.", id);
				throw new NetshotBadRequestException(
						"Unable to find the credential set.",
						NetshotBadRequestException.Reason.NETSHOT_CREDENTIALS_NOTFOUND);
			}
			if (!credentialSet.getClass().equals(rsCredentialSet.getClass())) {
				logger.error("Wrong posted credential type for credential set {}.", id);
				throw new NetshotBadRequestException(
						"The posted credential type doesn't match the existing one.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_CREDENTIALS_TYPE);
			}
			if (rsCredentialSet.getMgmtDomain() == null) {
				credentialSet.setMgmtDomain(null);
			}
			else {
				credentialSet.setMgmtDomain((Domain) session.load(Domain.class, rsCredentialSet.getMgmtDomain().getId()));
			}
			credentialSet.setName(rsCredentialSet.getName());
			if (DeviceCliAccount.class.isInstance(credentialSet)) {
				DeviceCliAccount cliAccount = (DeviceCliAccount) credentialSet;
				DeviceCliAccount rsCliAccount = (DeviceCliAccount) rsCredentialSet;
				cliAccount.setUsername(rsCliAccount.getUsername());
				if (!rsCliAccount.getPassword().equals("=")) {
					cliAccount.setPassword(rsCliAccount.getPassword());
				}
				if (!rsCliAccount.getSuperPassword().equals("=")) {
					cliAccount.setSuperPassword(rsCliAccount.getSuperPassword());
				}
				if (DeviceSshKeyAccount.class.isInstance(credentialSet)) {
					((DeviceSshKeyAccount) cliAccount).setPublicKey(((DeviceSshKeyAccount) rsCliAccount).getPublicKey());
					((DeviceSshKeyAccount) cliAccount).setPrivateKey(((DeviceSshKeyAccount) rsCliAccount).getPrivateKey());
				}
			}
			else if (DeviceSnmpv3Community.class.isInstance(credentialSet)) {
				((DeviceSnmpv3Community) credentialSet).setUsername( ((DeviceSnmpv3Community) rsCredentialSet).getUsername() ); 
				((DeviceSnmpv3Community) credentialSet).setAuthType( ((DeviceSnmpv3Community) rsCredentialSet).getAuthType() ); 
				((DeviceSnmpv3Community) credentialSet).setAuthKey( ((DeviceSnmpv3Community) rsCredentialSet).getAuthKey() ); 
				((DeviceSnmpv3Community) credentialSet).setPrivType( ((DeviceSnmpv3Community) rsCredentialSet).getPrivType() ); 
				((DeviceSnmpv3Community) credentialSet).setPrivKey( ((DeviceSnmpv3Community) rsCredentialSet).getPrivKey() ); 
				
			}
			else if (DeviceSnmpCommunity.class.isInstance(credentialSet)) {
				((DeviceSnmpCommunity) credentialSet)
				.setCommunity(((DeviceSnmpCommunity) rsCredentialSet)
						.getCommunity());
			}
			session.update(credentialSet);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited", credentialSet);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			Throwable t = e.getCause();
			logger.error("Unable to save the credentials {}.", id, e);
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A credential set with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_CREDENTIALS);
			}
			else if (t != null && t.getMessage().contains("mgmt_domain")) {
				throw new NetshotBadRequestException(
						"The domain doesn't exist.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
			}
			throw new NetshotBadRequestException("Unable to save the credential set",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (NetshotBadRequestException e) {
			session.getTransaction().rollback();
			throw e;
		}
		finally {
			session.close();
		}
		return credentialSet;
	}

	/**
	 * The Class RsSearchCriteria.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsSearchCriteria {

		/** The device class name. */
		private String driver;

		/** The query. */
		private String query;

		/**
		 * Gets the device class name.
		 *
		 * @return the device class name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getDriver() {
			return driver;
		}

		public void setDriver(String driver) {
			this.driver = driver;
		}

		/**
		 * Gets the query.
		 *
		 * @return the query
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getQuery() {
			return query;
		}

		/**
		 * Sets the query.
		 *
		 * @param query the new query
		 */
		public void setQuery(String query) {
			this.query = query;
		}
	}

	/**
	 * The Class RsSearchResults.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsSearchResults {

		/** The query. */
		private String query;

		/** The devices. */
		private List<RsLightDevice> devices;

		/**
		 * Gets the query.
		 *
		 * @return the query
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getQuery() {
			return query;
		}

		/**
		 * Sets the query.
		 *
		 * @param query the new query
		 */
		public void setQuery(String query) {
			this.query = query;
		}

		/**
		 * Gets the devices.
		 *
		 * @return the devices
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public List<RsLightDevice> getDevices() {
			return devices;
		}

		/**
		 * Sets the devices.
		 *
		 * @param devices the new devices
		 */
		public void setDevices(List<RsLightDevice> devices) {
			this.devices = devices;
		}
	}

	/**
	 * Search devices.
	 *
	 * @param request the request
	 * @param criteria the criteria
	 * @return the rs search results
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/devices/search")
	@RolesAllowed("readonly")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Search for devices",
		description = "Find devices using a string-based query."
	)
	public RsSearchResults searchDevices(RsSearchCriteria criteria)
			throws WebApplicationException {
		logger.debug("REST request, search devices, query '{}', driver '{}'.",
				criteria.getQuery(), criteria.getDriver());
		
		DeviceDriver driver = DeviceDriver.getDriverByName(criteria.getDriver());
		try {
			Finder finder = new Finder(criteria.getQuery(), driver);
			Session session = Database.getSession();
			try {
				@SuppressWarnings("unchecked")
				Query<RsLightDevice> query = session.createQuery(DEVICELIST_BASEQUERY
						+ finder.getHql());
				finder.setVariables(query);
				@SuppressWarnings("deprecation")
				List<RsLightDevice> devices = query
					.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class))
					.list();
				RsSearchResults results = new RsSearchResults();
				results.setDevices(devices);
				results.setQuery(finder.getFormattedQuery());
				return results;
			}
			catch (HibernateException e) {
				logger.error("Error while searching for the devices.", e);
				throw new NetshotBadRequestException("Unable to fetch the devices",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		catch (FinderParseException e) {
			logger.warn("User's query is invalid.", e);
			throw new NetshotBadRequestException("Invalid search string. "
					+ e.getMessage(),
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SEARCH_STRING);
		}
	}

	/**
	 * Adds the group.
	 *
	 * @param request the request
	 * @param deviceGroup the device group
	 * @return the device group
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/groups")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a device group",
		description = "Creates a device group. A group can be either static (fixed list) or dynamic (query-based list)."
	)
	public DeviceGroup addGroup(DeviceGroup deviceGroup)
			throws WebApplicationException {
		logger.debug("REST request, add group.");
		String name = deviceGroup.getName().trim();
		if (name.isEmpty()) {
			logger.warn("User posted an empty group name.");
			throw new NetshotBadRequestException("Invalid group name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP_NAME);
		}
		deviceGroup.setName(name);
		deviceGroup.setId(0);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			session.save(deviceGroup);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created.", deviceGroup);
			this.suggestReturnCode(Response.Status.CREATED);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new device group.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A group with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_GROUP);
			}
			throw new NetshotBadRequestException(
					"Unable to add the group to the database",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		return deviceGroup;
	}

	/**
	 * Gets the groups.
	 *
	 * @param request the request
	 * @return the groups
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/groups")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the device groups",
		description = "Returns the list of device groups, including their definition."
	)
	public List<DeviceGroup> getGroups() throws WebApplicationException {
		logger.debug("REST request, get groups.");
		Session session = Database.getSession();
		try {
			List<DeviceGroup> deviceGroups =
					session.createQuery("select g from DeviceGroup g", DeviceGroup.class).list();
			return deviceGroups;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the groups.", e);
			throw new NetshotBadRequestException("Unable to fetch the groups",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Delete group.
	 *
	 * @param request the request
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/groups/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove a device group",
		description = "Removes a device group. This doesn't remove the devices themselves."
	)
	public void deleteGroup(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete group {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			DeviceGroup deviceGroup = (DeviceGroup) session.load(DeviceGroup.class, id);
			for (Policy policy : deviceGroup.getAppliedPolicies()) {
				policy.setTargetGroup(null);
				session.save(policy);
			}
			session.delete(deviceGroup);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted.", deviceGroup);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The group {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The group doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the group {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the group",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsDeviceGroup.
	 */
	@XmlRootElement(name = "group")
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsDeviceGroup {

		/** The id. */
		private long id = -1;

		/** The type. */
		private String type;

		/** The static devices. */
		private List<Long> staticDevices = new ArrayList<Long>();

		/** The device class name. */
		private String driver;

		/** The query. */
		private String query;

		/** The folder. */
		private String folder = "";

		/** Hide the group in reports. */
		private boolean hiddenFromReports = false;

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Instantiates a new rs device group.
		 */
		public RsDeviceGroup() {

		}

		/**
		 * Gets the type.
		 *
		 * @return the type
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getType() {
			return type;
		}

		/**
		 * Sets the type.
		 *
		 * @param type the new type
		 */
		public void setType(String type) {
			this.type = type;
		}

		/**
		 * Gets the static devices.
		 *
		 * @return the static devices
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public List<Long> getStaticDevices() {
			return staticDevices;
		}

		/**
		 * Sets the static devices.
		 *
		 * @param staticDevices the new static devices
		 */
		public void setStaticDevices(List<Long> staticDevices) {
			this.staticDevices = staticDevices;
		}

		/**
		 * Gets the device class name.
		 *
		 * @return the device class name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getDriver() {
			return driver;
		}

		public void setDriver(String driver) {
			this.driver = driver;
		}

		/**
		 * Gets the query.
		 *
		 * @return the query
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getQuery() {
			return query;
		}

		/**
		 * Sets the query.
		 *
		 * @param query the new query
		 */
		public void setQuery(String query) {
			this.query = query;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public String getFolder() {
			return folder;
		}

		public void setFolder(String folder) {
			this.folder = folder;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isHiddenFromReports() {
			return hiddenFromReports;
		}

		public void setHiddenFromReports(boolean hiddenFromReports) {
			this.hiddenFromReports = hiddenFromReports;
		}

	}

	/**
	 * Sets the group.
	 *
	 * @param request the request
	 * @param id the id
	 * @param rsGroup the rs group
	 * @return the device group
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/groups/{id}")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update a device group",
		description = "Edits a device group, by ID."
	)
	public DeviceGroup setGroup(@PathParam("id") Long id, RsDeviceGroup rsGroup)
			throws WebApplicationException {
		logger.debug("REST request, edit group {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			DeviceGroup group = (DeviceGroup) session.get(DeviceGroup.class, id);
			if (group == null) {
				logger.error("Unable to find the group {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this group.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
			}
			if (group instanceof StaticDeviceGroup) {
				StaticDeviceGroup staticGroup = (StaticDeviceGroup) group;
				Set<Device> devices = new HashSet<Device>();
				for (Long deviceId : rsGroup.getStaticDevices()) {
					Device device = (Device) session.load(Device.class, deviceId);
					devices.add(device);
				}
				staticGroup.updateCachedDevices(devices);
			}
			else if (group instanceof DynamicDeviceGroup) {
				DynamicDeviceGroup dynamicGroup = (DynamicDeviceGroup) group;
				dynamicGroup.setDriver(rsGroup.getDriver());
				dynamicGroup.setQuery(rsGroup.getQuery());
				try {
					dynamicGroup.refreshCache(session);
				}
				catch (FinderParseException e) {
					throw new NetshotBadRequestException(
							"Invalid query for the group definition.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DYNAMICGROUP_QUERY);
				}
			}
			else {
				throw new NetshotBadRequestException("Unknown group type.",
						NetshotBadRequestException.Reason.NETSHOT_INCOMPATIBLE_GROUP_TYPE);
			}
			group.setFolder(rsGroup.getFolder());
			group.setHiddenFromReports(rsGroup.isHiddenFromReports());
			session.update(group);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited.", group);
			return group;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("Unable to find a device while editing group {}.", id, e);
			throw new NetshotBadRequestException(
					"Unable to find a device. Refresh and try again.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE_IN_STATICGROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to save the group {}.", id, e);
			throw new NetshotBadRequestException("Unable to save the group.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (WebApplicationException e) {
			session.getTransaction().rollback();
			throw e;
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the group devices.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the group devices
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/group/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get members of a device group",
		description = "Returns the list of devices which belong to the given group, by ID."
	)
	public List<RsLightDevice> getGroupDevices(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, get devices from group {}.", id);
		Session session = Database.getSession();
		DeviceGroup group;
		try {
			group = (DeviceGroup) session.get(DeviceGroup.class, id);
			if (group == null) {
				logger.error("Unable to find the group {}.", id);
				throw new NetshotBadRequestException("Can't find this group",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
			}
			@SuppressWarnings("unchecked")
			Query<RsLightDevice> query = session.createQuery(
					RestService.DEVICELIST_BASEQUERY
					+ "from Device d join d.ownerGroups g where g.id = :id")
					.setParameter("id", id);
			@SuppressWarnings("deprecation")
			List<RsLightDevice> devices = query
				.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class))
				.list();
			return devices;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the devices of group {}.", id, e);
			throw new NetshotBadRequestException("Unable to fetch the devices",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsTask.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsTask {

		/** The id. */
		private long id;

		/** The cancelled. */
		private boolean cancelled = false;

		/** The type. */
		private String type = "";

		/** The group. */
		private Long group = 0L;

		/** The device. */
		private Long device = 0L;

		/** The domain. */
		private Long domain = 0L;

		/** The subnets. */
		private String subnets = "";

		/** The IP addresses. */
		private String ipAddresses = "";

		/** The schedule reference. */
		private Date scheduleReference = new Date();

		/** The schedule type. */
		private Task.ScheduleType scheduleType = ScheduleType.ASAP;

		/** The comments. */
		private String comments = "";

		private int limitToOutofdateDeviceHours = -1;
		
		private int daysToPurge = 90;
		
		private int configDaysToPurge = -1;
		
		private int configSizeToPurge = 0;
		
		private int configKeepDays = 0;
		
		private String script = "";
		
		private String driver;
		
		private boolean debugEnabled = false;

		/** Disable automatic diagnostic task (applies to snapshot tasks) */
		private boolean dontRunDiagnostics = false;

		/** Disable automatic check compliance task (applies to snapshot and diagnostic tasks)  */
		private boolean dontCheckCompliance = false;

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id
		 *             the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Checks if is cancelled.
		 *
		 * @return true, if is cancelled
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isCancelled() {
			return cancelled;
		}

		/**
		 * Sets the cancelled.
		 *
		 * @param cancelled the new cancelled
		 */
		public void setCancelled(boolean cancelled) {
			this.cancelled = cancelled;
		}

		/**
		 * Gets the type.
		 *
		 * @return the type
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getType() {
			return type;
		}

		/**
		 * Sets the type.
		 *
		 * @param type the new type
		 */
		public void setType(String type) {
			this.type = type;
		}

		/**
		 * Gets the group.
		 *
		 * @return the group
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Long getGroup() {
			return group;
		}

		/**
		 * Sets the group.
		 *
		 * @param group the new group
		 */
		public void setGroup(Long group) {
			this.group = group;
		}

		/**
		 * Gets the device.
		 *
		 * @return the device
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Long getDevice() {
			return device;
		}

		/**
		 * Sets the device.
		 *
		 * @param device the new device
		 */
		public void setDevice(Long device) {
			this.device = device;
		}

		/**
		 * Gets the subnets.
		 *
		 * @return the subnets
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getSubnets() {
			return subnets;
		}

		/**
		 * Sets the subnets.
		 *
		 * @param subnets the new subnets
		 */
		public void setSubnets(String subnet) {
			this.subnets = subnet;
		}

		/**
		 * Gets the schedule reference.
		 *
		 * @return the schedule reference
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getScheduleReference() {
			return scheduleReference;
		}

		/**
		 * Sets the schedule reference.
		 *
		 * @param scheduleReference the new schedule reference
		 */
		public void setScheduleReference(Date scheduleReference) {
			this.scheduleReference = scheduleReference;
		}

		/**
		 * Gets the schedule type.
		 *
		 * @return the schedule type
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Task.ScheduleType getScheduleType() {
			return scheduleType;
		}

		/**
		 * Sets the schedule type.
		 *
		 * @param scheduleType the new schedule type
		 */
		public void setScheduleType(Task.ScheduleType scheduleType) {
			this.scheduleType = scheduleType;
		}

		/**
		 * Gets the comments.
		 *
		 * @return the comments
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getComments() {
			return comments;
		}

		/**
		 * Sets the comments.
		 *
		 * @param comments the new comments
		 */
		public void setComments(String comments) {
			this.comments = comments;
		}

		/**
		 * Gets the domain.
		 *
		 * @return the domain
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Long getDomain() {
			return domain;
		}

		/**
		 * Sets the domain.
		 *
		 * @param domain the new domain
		 */
		public void setDomain(Long domain) {
			this.domain = domain;
		}

		/**
		 * Gets the ip addresses.
		 *
		 * @return the ip addresses
		 */
		public String getIpAddresses() {
			return ipAddresses;
		}

		/**
		 * Sets the ip addresses.
		 *
		 * @param ipAddresses the new ip addresses
		 */
		public void setIpAddresses(String ipAddresses) {
			this.ipAddresses = ipAddresses;
		}

		/**
		 * Gets the limit to outofdate device hours.
		 *
		 * @return the limit to outofdate device hours
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public int getLimitToOutofdateDeviceHours() {
			return limitToOutofdateDeviceHours;
		}

		public void setLimitToOutofdateDeviceHours(int limitToOutofdateDeviceHours) {
			this.limitToOutofdateDeviceHours = limitToOutofdateDeviceHours;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public int getDaysToPurge() {
			return daysToPurge;
		}

		public void setDaysToPurge(int days) {
			this.daysToPurge = days;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public String getScript() {
			return script;
		}

		public void setScript(String script) {
			this.script = script;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public String getDriver() {
			return driver;
		}

		public void setDriver(String driver) {
			this.driver = driver;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public int getConfigDaysToPurge() {
			return configDaysToPurge;
		}

		public void setConfigDaysToPurge(int configDaysToPurge) {
			this.configDaysToPurge = configDaysToPurge;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public int getConfigSizeToPurge() {
			return configSizeToPurge;
		}

		public void setConfigSizeToPurge(int configSizeToPurge) {
			this.configSizeToPurge = configSizeToPurge;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public int getConfigKeepDays() {
			return configKeepDays;
		}

		public void setConfigKeepDays(int configKeepDays) {
			this.configKeepDays = configKeepDays;
		}
		
		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isDebugEnabled() {
			return debugEnabled;
		}
		
		public void setDebugEnabled(boolean debugEnabled) {
			this.debugEnabled = debugEnabled;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isDontRunDiagnostics() {
			return dontRunDiagnostics;
		}

		public void setDontRunDiagnostics(boolean dontRunDiagnostics) {
			this.dontRunDiagnostics = dontRunDiagnostics;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isDontCheckCompliance() {
			return dontCheckCompliance;
		}

		public void setDontCheckCompliance(boolean dontCheckCompliance) {
			this.dontCheckCompliance = dontCheckCompliance;
		}
		
	}

	/**
	 * Sets the task.
	 *
	 * @param request the request
	 * @param id the id
	 * @param rsTask the rs task
	 * @return the task
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/tasks/{id}")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update a task",
		description = "Edits a task, by ID. Set 'cancel' property to true to cancel the task."
	)
	public Task setTask(@PathParam("id") Long id, RsTask rsTask)
			throws WebApplicationException {
		logger.debug("REST request, edit task {}.", id);
		Task task = null;
		Session session = Database.getSession();
		try {
			task = (Task) session.get(Task.class, id);
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the task {}.", id, e);
			throw new NetshotBadRequestException("Unable to fetch the task.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}

		if (task == null) {
			logger.error("Unable to find the task {}.", id);
			throw new NetshotBadRequestException("Unable to find the task.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
		}

		if (rsTask.isCancelled()) {
			if (task.getStatus() != Task.Status.SCHEDULED) {
				logger.error("User is trying to cancel task {} not in SCHEDULE state.",
						id);
				throw new NetshotBadRequestException(
						"The task isn't in 'SCHEDULED' state.",
						NetshotBadRequestException.Reason.NETSHOT_TASK_NOT_CANCELLABLE);
			}

			try {
				TaskManager.cancelTask(task, "Task manually cancelled by user."); //TODO
				Netshot.aaaLogger.info("{} has been manually cancelled.", task);
			}
			catch (Exception e) {
				logger.error("Unable to cancel the task {}.", id, e);
				throw new NetshotBadRequestException("Cannot cancel the task.",
						NetshotBadRequestException.Reason.NETSHOT_TASK_CANCEL_ERROR);
			}
		}

		return task;
	}

	/**
	 * The Class RsTaskCriteria.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsTaskCriteria {

		/** The status. */
		private String status = "";

		/** The day. */
		private Date day = new Date();

		/**
		 * Gets the status.
		 *
		 * @return the status
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getStatus() {
			return status;
		}

		/**
		 * Sets the status.
		 *
		 * @param status the new status
		 */
		public void setStatus(String status) {
			this.status = status;
		}

		/**
		 * Gets the day.
		 *
		 * @return the day
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getDay() {
			return day;
		}

		/**
		 * Sets the day.
		 *
		 * @param day the new day
		 */
		public void setDay(Date day) {
			this.day = day;
		}
	}

	/**
	 * Search tasks.
	 *
	 * @param request the request
	 * @param criteria the criteria
	 * @return the list
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/tasks/search")
	@RolesAllowed("readonly")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Search for tasks",
		description = "Retrieves a list of tasks based on passed criteria."
	)
	public List<Task> searchTasks(RsTaskCriteria criteria)
			throws WebApplicationException {

		logger.debug("REST request, search for tasks.");

		Session session = Database.getSession();
		try {
			StringBuilder hqlQuery = new StringBuilder("select t from Task t where (1 = 1)");
			Map<String, Object> hqlParams = new HashMap<String, Object>();
			
			Task.Status status = null;
			try {
				if (!"ANY".equals(criteria.getStatus())) {
					status = Task.Status.valueOf(criteria.getStatus());
					hqlQuery.append(" and status = :status");
					hqlParams.put("status", status);
				}
			}
			catch (Exception e) {
				logger.warn("Invalid status {}.", criteria.getStatus());
			}
			Calendar min = Calendar.getInstance();
			min.setTime(criteria.getDay());
			min.set(Calendar.HOUR_OF_DAY, 0);
			min.set(Calendar.MINUTE, 0);
			min.set(Calendar.SECOND, 0);
			min.set(Calendar.MILLISECOND, 0);
			Calendar max = (Calendar) min.clone();
			max.add(Calendar.DAY_OF_MONTH, 1);

			if (status == Task.Status.SUCCESS || status == Task.Status.FAILURE) {
				hqlQuery.append(" and executionDate >= :minDate and executionDate <= :maxDate");
				hqlParams.put("minDate", min.getTime());
				hqlParams.put("maxDate", max.getTime());
			}
			else if (status == Task.Status.CANCELLED) {
				hqlQuery.append(" and changeDate >= :minDate and changeDate <= :maxDate");
				hqlParams.put("minDate", min.getTime());
				hqlParams.put("maxDate", max.getTime());
			}
			else if (status == null) {
				hqlQuery.append(" and (status = :running or status = :scheduled or (executionDate >= :minDate and executionDate <= :maxDate) " +
						"or (executionDate is null and (changeDate >= :minDate and changeDate <= :maxDate)))");
				hqlParams.put("minDate", min.getTime());
				hqlParams.put("maxDate", max.getTime());
				hqlParams.put("running", Task.Status.RUNNING);
				hqlParams.put("scheduled", Task.Status.SCHEDULED);
			}
			hqlQuery.append(" order by id desc");
			
			Query<Task> query = session.createQuery(hqlQuery.toString(), Task.class);
			for (Entry<String, Object> k : hqlParams.entrySet()) {
				query.setParameter(k.getKey(), k.getValue());
			}
			
			List<Task> tasks = query.list();
			return tasks;
		}
		catch (HibernateException e) {
			logger.error("Error while searching for tasks.", e);
			throw new NetshotBadRequestException("Unable to fetch the tasks",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Adds the task.
	 *
	 * @param request the request
	 * @param rsTask the rs task
	 * @return the task
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/tasks")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a task",
		description = "Creates a task and schedule it for execution."
	)
	public Task addTask(@Context HttpServletRequest request,
			@Context SecurityContext securityContext,
			RsTask rsTask) throws WebApplicationException {
		logger.debug("REST request, add task.");
		User user = (User) request.getAttribute("user");
		String userName = "";
		try {
			userName = user.getUsername();
		}
		catch (Exception e) {
		}

		Task task;
		if (rsTask.getType().equals("TakeSnapshotTask")) {
			logger.trace("Adding a TakeSnapshotTask");
			Device device;
			Session session = Database.getSession();
			try {
				device = (Device) session.get(Device.class, rsTask.getDevice());
				if (device == null) {
					logger.error("Unable to find the device {}.", rsTask.getDevice());
					throw new NetshotBadRequestException("Unable to find the device.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
				}
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the device.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			task = new TakeSnapshotTask(device, rsTask.getComments(), userName, false,
					rsTask.isDontRunDiagnostics(), rsTask.isDontCheckCompliance());
		}
		else if (rsTask.getType().equals("RunDeviceScriptTask")) {
			if (!securityContext.isUserInRole("executereadwrite")) {
				throw new NetshotNotAuthorizedException("Insufficient permissions to run scripts on devices.", 0);
			}
			logger.trace("Adding a RunDeviceScriptTask");
			DeviceDriver driver = DeviceDriver.getDriverByName(rsTask.getDriver());
			if (driver == null) {
				logger.error("Unknown device driver {}.", rsTask.getType());
				throw new NetshotBadRequestException("Unknown device driver.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
			}
			if (rsTask.getScript() == null) {
				logger.error("The script can't be empty.");
				throw new NetshotBadRequestException("The script can't be empty.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
			}
			Device device;
			Session session = Database.getSession();
			try {
				device = (Device) session.get(Device.class, rsTask.getDevice());
				if (device == null) {
					logger.error("Unable to find the device {}.", rsTask.getDevice());
					throw new NetshotBadRequestException("Unable to find the device.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
				}
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the device.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			task = new RunDeviceScriptTask(device, rsTask.getScript(), driver, rsTask.getComments(), userName);
		}
		else if (rsTask.getType().equals("RunDeviceGroupScriptTask")) {
			logger.trace("Adding a RunDeviceGroupScriptTask");
			DeviceDriver driver = DeviceDriver.getDriverByName(rsTask.getDriver());
			if (driver == null) {
				logger.error("Unknown device driver {}.", rsTask.getType());
				throw new NetshotBadRequestException("Unknown device driver.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
			}
			if (rsTask.getScript() == null) {
				logger.error("The script can't be empty.");
				throw new NetshotBadRequestException("The script can't be empty.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
			}
			DeviceGroup group;
			Session session = Database.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					logger.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
				}
				task = new RunDeviceGroupScriptTask(group, rsTask.getScript(), driver, rsTask.getComments(), userName);
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("CheckComplianceTask")) {
			logger.trace("Adding a CheckComplianceTask");
			Device device;
			Session session = Database.getSession();
			try {
				device = (Device) session.get(Device.class, rsTask.getDevice());
				if (device == null) {
					logger.error("Unable to find the device {}.", rsTask.getDevice());
					throw new NetshotBadRequestException("Unable to find the device.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
				}
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the device.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			task = new CheckComplianceTask(device, rsTask.getComments(), userName);
		}
		else if (rsTask.getType().equals("TakeGroupSnapshotTask")) {
			logger.trace("Adding a TakeGroupSnapshotTask");
			DeviceGroup group;
			Session session = Database.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					logger.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
				}
				task = new TakeGroupSnapshotTask(group, rsTask.getComments(), userName,
						rsTask.getLimitToOutofdateDeviceHours(), rsTask.isDontRunDiagnostics(),
						rsTask.isDontCheckCompliance());
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("CheckGroupComplianceTask")) {
			logger.trace("Adding a CheckGroupComplianceTask");
			DeviceGroup group;
			Session session = Database.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					logger.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
				}
				task = new CheckGroupComplianceTask(group, rsTask.getComments(), userName);
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("CheckGroupSoftwareTask")) {
			logger.trace("Adding a CheckGroupSoftwareTask");
			DeviceGroup group;
			Session session = Database.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					logger.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
				}
				task = new CheckGroupSoftwareTask(group, rsTask.getComments(), userName);
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("RunGroupDiagnosticsTask")) {
			logger.trace("Adding a RunGroupDiagnosticsTask");
			DeviceGroup group;
			Session session = Database.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					logger.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
				}
				task = new RunGroupDiagnosticsTask(group, rsTask.getComments(), userName,
					rsTask.isDontCheckCompliance());
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("ScanSubnetsTask")) {
			logger.trace("Adding a ScanSubnetsTask");
			Set<Network4Address> subnets = new HashSet<Network4Address>();
			String[] rsSubnets = rsTask.getSubnets().split("(\r\n|\n|;| |,)");
			Pattern pattern = Pattern.compile("^(?<ip>[0-9\\.]+)(/(?<mask>[0-9]+))?$");
			for (String rsSubnet : rsSubnets) {
				Matcher matcher = pattern.matcher(rsSubnet);
				if (!matcher.find()) {
					logger.warn("User posted an invalid subnet '{}'.", rsSubnet);
					throw new NetshotBadRequestException(String.format("Invalid subnet '%s'.", rsSubnet),
							NetshotBadRequestException.Reason.NETSHOT_INVALID_SUBNET);
				}
				Network4Address subnet;
				try {
					int mask = 32;
					if (matcher.group("mask") != null) {
						mask = Integer.parseInt(matcher.group("mask"));
					}
					subnet = new Network4Address(matcher.group("ip"), mask);
					subnets.add(subnet);
				}
				catch (Exception e) {
					logger.warn("User posted an invalid subnet '{}'.", rsSubnet, e);
					throw new NetshotBadRequestException(String.format("Invalid subnet '%s'.", rsSubnet),
							NetshotBadRequestException.Reason.NETSHOT_INVALID_SUBNET);
				}
				if (subnet.getPrefixLength() < 22 || subnet.getPrefixLength() > 32) {
					logger.warn("User posted an invalid prefix length {}.",
							subnet.getPrefix());
					throw new NetshotBadRequestException(String.format("Invalid prefix length for '%s'.", rsSubnet),
							NetshotBadRequestException.Reason.NETSHOT_SCAN_SUBNET_TOO_BIG);
				}
			}
			if (subnets.size() == 0) {
				logger.warn("User posted an invalid subnet list '{}'.", rsTask.getSubnets());
				throw new NetshotBadRequestException(String.format("Invalid subnet list '%s'.", rsTask.getSubnets()),
						NetshotBadRequestException.Reason.NETSHOT_INVALID_SUBNET);
			}
			Domain domain;
			if (rsTask.getDomain() == 0) {
				logger.error("Domain {} is invalid (0).", rsTask.getDomain());
				throw new NetshotBadRequestException("Invalid domain",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
			}
			Session session = Database.getSession();
			try {
				domain = (Domain) session.load(Domain.class, rsTask.getDomain());
			}
			catch (Exception e) {
				logger.error("Unable to load the domain {}.", rsTask.getDomain());
				throw new NetshotBadRequestException("Invalid domain",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
			}
			finally {
				session.close();
			}
			StringBuffer target = new StringBuffer();
			target.append("{");
			for (Network4Address subnet : subnets) {
				if (target.length() > 1) {
					target.append(", ");
				}
				target.append(subnet.getPrefix());
			}
			target.append("}");
			task = new ScanSubnetsTask(subnets, domain, rsTask.getComments(), target.toString(), userName);
		}
		else if (rsTask.getType().equals("PurgeDatabaseTask")) {
			logger.trace("Adding a PurgeDatabaseTask");
			if (rsTask.getDaysToPurge() < 2) {
				logger.error(String.format("Invalid number of days %d for the PurgeDatabaseTask task.", rsTask.getDaysToPurge()));
				throw new NetshotBadRequestException("Invalid number of days.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
			}
			int configDays = rsTask.getConfigDaysToPurge();
			int configSize = rsTask.getConfigSizeToPurge();
			int configKeepDays = rsTask.getConfigKeepDays();
			if (configDays == -1) {
				configSize = 0;
				configKeepDays = 0;
			}
			else if (configDays <= 3) {
				logger.error("The number of days of configurations to purge must be greater than 3.");
				throw new NetshotBadRequestException("The number of days of configurations to purge must be greater than 3.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
			}
			else {
				if (configSize < 0) {
					logger.error("The configuration size limit can't be negative.");
					throw new NetshotBadRequestException("The limit on the configuration size can't be negative.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
				}
				if (configKeepDays < 0) {
					logger.error("The interval of days between configurations to keep can't be negative.");
					throw new NetshotBadRequestException("The number of days of configurations to purge can't be negative.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
				}
				if (configDays <= configKeepDays) {
					logger.error("The number of days of configurations to purge must be greater than the number of days between two successive configurations to keep.");
					throw new NetshotBadRequestException("The number of days of configurations to purge must be greater than the number of days between two successive configurations to keep.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
				}
			}
			task = new PurgeDatabaseTask(rsTask.getComments(), userName, rsTask.getDaysToPurge(),
					configDays, configSize, configKeepDays);
		}
		else if (rsTask.getType().equals("RunDiagnosticsTask")) {
			logger.trace("Adding a RunDiagnosticsTask");
			Device device;
			Session session = Database.getSession();
			try {
				device = (Device) session.get(Device.class, rsTask.getDevice());
				if (device == null) {
					logger.error("Unable to find the device {}.", rsTask.getDevice());
					throw new NetshotBadRequestException("Unable to find the device.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
				}
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the device.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			task = new RunDiagnosticsTask(device, rsTask.getComments(), userName, rsTask.isDontCheckCompliance());
		}
		else {
			logger.error("User posted an invalid task type '{}'.", rsTask.getType());
			throw new NetshotBadRequestException("Invalid task type.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
		}
		if (rsTask.getScheduleReference() != null) {
			task.setDebugEnabled(rsTask.isDebugEnabled());
			task.setScheduleReference(rsTask.getScheduleReference());
			task.setScheduleType(rsTask.getScheduleType());
			if (task.getScheduleType() == ScheduleType.AT) {
				Calendar inOneMinute = Calendar.getInstance();
				inOneMinute.add(Calendar.MINUTE, 1);
				if (task.getScheduleReference().before(inOneMinute.getTime())) {
					logger
					.error(
							"The schedule for the task occurs in less than one minute ({} vs {}).",
							task.getScheduleReference(), inOneMinute.getTime());
					throw new NetshotBadRequestException(
							"The schedule occurs in the past.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
				}
			}
		}
		try {
			TaskManager.addTask(task);
			Netshot.aaaLogger.info("The task {} has been created.", task);
			this.suggestReturnCode(Response.Status.CREATED);
		}
		catch (HibernateException e) {
			logger.error("Unable to add the task.", e);
			throw new NetshotBadRequestException(
					"Unable to add the task to the database.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (SchedulerException e) {
			logger.error("Unable to schedule the task.", e);
			throw new NetshotBadRequestException("Unable to schedule the task.",
					NetshotBadRequestException.Reason.NETSHOT_SCHEDULE_ERROR);
		}
		return task;
	}

	/**
	 * The Class RsConfigChange.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsConfigChange {

		/** The device name. */
		private String deviceName;

		/** The device id. */
		private long deviceId;

		/** The old change date. */
		private Date oldChangeDate;

		/** The new change date. */
		private Date newChangeDate;

		/** The author. */
		private String author;

		/** The old id. */
		private long oldId = 0L;

		/** The new id. */
		private long newId = 0L;

		/**
		 * Gets the device name.
		 *
		 * @return the device name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getDeviceName() {
			return deviceName;
		}

		/**
		 * Sets the device name.
		 *
		 * @param deviceName the new device name
		 */
		public void setDeviceName(String deviceName) {
			this.deviceName = deviceName;
		}

		/**
		 * Gets the device id.
		 *
		 * @return the device id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getDeviceId() {
			return deviceId;
		}

		/**
		 * Sets the device id.
		 *
		 * @param deviceId the new device id
		 */
		public void setDeviceId(long deviceId) {
			this.deviceId = deviceId;
		}

		/**
		 * Gets the author.
		 *
		 * @return the author
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getAuthor() {
			return author;
		}

		/**
		 * Sets the author.
		 *
		 * @param author the new author
		 */
		public void setAuthor(String author) {
			this.author = author;
		}

		/**
		 * Gets the old change date.
		 *
		 * @return the old change date
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getOldChangeDate() {
			return oldChangeDate;
		}

		/**
		 * Sets the old change date.
		 *
		 * @param oldChangeDate the new old change date
		 */
		public void setOldChangeDate(Date oldChangeDate) {
			this.oldChangeDate = oldChangeDate;
		}

		/**
		 * Gets the new change date.
		 *
		 * @return the new change date
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getNewChangeDate() {
			return newChangeDate;
		}

		/**
		 * Sets the new change date.
		 *
		 * @param newChangeDate the new new change date
		 */
		public void setNewChangeDate(Date newChangeDate) {
			this.newChangeDate = newChangeDate;
		}

		/**
		 * Gets the old id.
		 *
		 * @return the old id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getOldId() {
			return oldId;
		}

		/**
		 * Sets the old id.
		 *
		 * @param oldId the new old id
		 */
		public void setOldId(long oldId) {
			this.oldId = oldId;
		}

		/**
		 * Gets the new id.
		 *
		 * @return the new id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getNewId() {
			return newId;
		}

		/**
		 * Sets the new id.
		 *
		 * @param newId the new new id
		 */
		public void setNewId(long newId) {
			this.newId = newId;
		}
	}

	/**
	 * The Class RsChangeCriteria.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsChangeCriteria {

		/** The from date. */
		private Date fromDate;

		/** The to date. */
		private Date toDate;

		/**
		 * Instantiates a new rs change criteria.
		 */
		public RsChangeCriteria() {
			this.toDate = new Date();
			Calendar c = Calendar.getInstance();
			c.setTime(this.toDate);
			c.add(Calendar.DAY_OF_MONTH, -1);
			this.fromDate = c.getTime();
		}

		/**
		 * Gets the from date.
		 *
		 * @return the from date
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getFromDate() {
			return fromDate;
		}

		/**
		 * Sets the from date.
		 *
		 * @param fromDate the new from date
		 */
		public void setFromDate(Date fromDate) {
			this.fromDate = fromDate;
		}

		/**
		 * Gets the to date.
		 *
		 * @return the to date
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getToDate() {
			return toDate;
		}

		/**
		 * Sets the to date.
		 *
		 * @param toDate the new to date
		 */
		public void setToDate(Date toDate) {
			this.toDate = toDate;
		}
	}

	/**
	 * Gets the changes.
	 *
	 * @param request the request
	 * @param criteria the criteria
	 * @return the changes
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/changes")
	@RolesAllowed("readonly")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get last configuration changes",
		description = "Retrieves the list of last configuration changes, based on passed criteria."
	)
	public List<RsConfigChange> getChanges(RsChangeCriteria criteria) throws WebApplicationException {
		logger.debug("REST request, config changes.");
		Session session = Database.getSession();
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			List<RsConfigChange> changes = session
				.createQuery("select c.id as newId, c.changeDate as newChangeDate, c.device.id as deviceId, c.author as author, " +
						"c.device.name as deviceName from Config c where c.changeDate >= :start and c.changeDate <= :end")
				.setParameter("start", criteria.fromDate)
				.setParameter("end", criteria.toDate)
				.setResultTransformer(Transformers.aliasToBean(RsConfigChange.class))
				.list();
			return changes;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the devices", e);
			throw new NetshotBadRequestException("Unable to fetch the devices",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the policies.
	 *
	 * @param request the request
	 * @return the policies
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/policies")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the compliance policies",
		description = "Returns the list of compliance policies."
	)
	public List<Policy> getPolicies() throws WebApplicationException {
		logger.debug("REST request, get policies.");
		Session session = Database.getSession();
		try {
			List<Policy> policies = session
				.createQuery("from Policy p left join fetch p.targetGroup", Policy.class)
				.list();
			return policies;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the policies.", e);
			throw new NetshotBadRequestException("Unable to fetch the policies",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the policy rules.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the policy rules
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/rules/policy/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the compliance rules of a policy",
		description = "Returns the rules owned by a given compliance policy."
	)
	public List<Rule> getPolicyRules(@PathParam("id") Long id) throws WebApplicationException {
		logger.debug("REST request, get rules for policy {}.", id);
		Session session = Database.getSession();
		try {
			Policy policy = (Policy) session.load(Policy.class, id);
			if (policy == null) {
				logger.error("Invalid policy.");
				throw new NetshotBadRequestException("Invalid policy",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY);
			}
			List<Rule> rules = new ArrayList<Rule>();
			rules.addAll(policy.getRules());
			return rules;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the rules.", e);
			throw new NetshotBadRequestException("Unable to fetch the rules",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsPolicy.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsPolicy {

		/** The id. */
		private long id = 0;

		/** The name. */
		private String name = "";

		/** The group. */
		private long group = 0;

		/**
		 * Instantiates a new rs policy.
		 */
		public RsPolicy() {

		}

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Gets the name.
		 *
		 * @return the name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getName() {
			return name;
		}

		/**
		 * Sets the name.
		 *
		 * @param name the new name
		 */
		public void setName(String name) {
			this.name = name;
		}

		/**
		 * Gets the group.
		 *
		 * @return the group
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getGroup() {
			return group;
		}

		/**
		 * Sets the group.
		 *
		 * @param group the new group
		 */
		public void setGroup(long group) {
			this.group = group;
		}
	}

	/**
	 * Adds the policy.
	 *
	 * @param request the request
	 * @param rsPolicy the rs policy
	 * @return the policy
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/policies")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a compliance policy",
		description = "Creates a compliance policy."
	)
	public Policy addPolicy(RsPolicy rsPolicy) throws WebApplicationException {
		logger.debug("REST request, add policy.");
		String name = rsPolicy.getName().trim();
		if (name.isEmpty()) {
			logger.warn("User posted an empty policy name.");
			throw new NetshotBadRequestException("Invalid policy name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY_NAME);
		}
		Policy policy;
		Session session = Database.getSession();
		try {
			session.beginTransaction();

			DeviceGroup group = null;
			if (rsPolicy.getGroup() != -1) {
				group = (DeviceGroup) session.load(DeviceGroup.class, rsPolicy.getGroup());
			}

			policy = new Policy(name, group);

			session.save(policy);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created.", policy);
			this.suggestReturnCode(Response.Status.CREATED);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The posted group doesn't exist", e);
			throw new NetshotBadRequestException(
					"Invalid group",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new policy.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A policy with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_POLICY);
			}
			throw new NetshotBadRequestException(
					"Unable to add the policy to the database",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		return policy;
	}

	/**
	 * Delete policy.
	 *
	 * @param request the request
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/policies/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove a compliance policy",
		description = "Removes a given compliance policy, by ID"
	)
	public void deletePolicy(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete policy {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Policy policy = (Policy) session.load(Policy.class, id);
			session.delete(policy);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted.", policy);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The policy {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The policy doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the policy {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the policy",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Sets the policy.
	 *
	 * @param request the request
	 * @param id the id
	 * @param rsPolicy the rs policy
	 * @return the policy
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/policies/{id}")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update a compliance policy",
		description = "Edits a compliance policy, by ID."
	)
	public Policy setPolicy(@PathParam("id") Long id, RsPolicy rsPolicy)
			throws WebApplicationException {
		logger.debug("REST request, edit policy {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Policy policy = (Policy) session.get(Policy.class, id);
			if (policy == null) {
				logger.error("Unable to find the policy {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this policy.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY);
			}

			String name = rsPolicy.getName().trim();
			if (name.isEmpty()) {
				logger.warn("User posted an empty policy name.");
				throw new NetshotBadRequestException("Invalid policy name.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY_NAME);
			}
			policy.setName(name);
			
			if (policy.getTargetGroup() != null && policy.getTargetGroup().getId() != rsPolicy.getGroup()) {
				session.createQuery("delete CheckResult cr where cr.key.rule in (select r from Rule r where r.policy = :id)")
					.setParameter("id", policy.getId())
					.executeUpdate();
			}
			DeviceGroup group = null;
			if (rsPolicy.getGroup() != -1) {
				group = (DeviceGroup) session.load(DeviceGroup.class, rsPolicy.getGroup());
			}
			policy.setTargetGroup(group);

			session.update(policy);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited.", policy);
			return policy;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("Unable to find the group {} to be assigned to the policy {}.",
					rsPolicy.getGroup(), id, e);
			throw new NetshotBadRequestException(
					"Unable to find the group.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to save the policy {}.", id, e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A policy with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_POLICY);
			}
			throw new NetshotBadRequestException("Unable to save the policy.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (WebApplicationException e) {
			session.getTransaction().rollback();
			throw e;
		}
		finally {
			session.close();
		}
	}


	/**
	 * The Class RsRule.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsRule {

		/** The id. */
		private long id = 0;

		/** The name. */
		private String name = null;
		
		/** The type. */
		private String type = "";

		/** The script. */
		private String script = null;

		/** The policy. */
		private long policy = 0;

		/** The enabled. */
		private boolean enabled = false;

		/** The exemptions. */
		private Map<Long, Date> exemptions = new HashMap<Long, Date>();
		
		private String text = null;
		private Boolean regExp;
		private String context = null;
		private String driver = null;
		private String field = null;
		private Boolean anyBlock;
		private Boolean matchAll;
		private Boolean invert;
		private Boolean normalize;

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Gets the name.
		 *
		 * @return the name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getName() {
			return name;
		}

		/**
		 * Sets the name.
		 *
		 * @param name the new name
		 */
		public void setName(String name) {
			this.name = name;
		}
		
		
		@XmlElement
		@JsonView(DefaultView.class)
		public String getType() {
			return type;
		}

		public void setType(String type) {
			this.type = type;
		}

		/**
		 * Gets the script.
		 *
		 * @return the script
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getScript() {
			return script;
		}

		/**
		 * Sets the script.
		 *
		 * @param script the new script
		 */
		public void setScript(String script) {
			this.script = script;
		}

		/**
		 * Gets the policy.
		 *
		 * @return the policy
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Long getPolicy() {
			return policy;
		}

		/**
		 * Checks if is enabled.
		 *
		 * @return true, if is enabled
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isEnabled() {
			return enabled;
		}

		/**
		 * Sets the enabled.
		 *
		 * @param enabled the new enabled
		 */
		public void setEnabled(boolean enabled) {
			this.enabled = enabled;
		}

		/**
		 * Sets the policy.
		 *
		 * @param policy the new policy
		 */
		public void setPolicy(long policy) {
			this.policy = policy;
		}

		/**
		 * Gets the exemptions.
		 *
		 * @return the exemptions
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Map<Long, Date> getExemptions() {
			return exemptions;
		}

		/**
		 * Sets the exemptions.
		 *
		 * @param exemptions the exemptions
		 */
		public void setExemptions(Map<Long, Date> exemptions) {
			this.exemptions = exemptions;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public String getText() {
			return text;
		}

		public void setText(String text) {
			this.text = text;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public Boolean isRegExp() {
			return regExp;
		}

		public void setRegExp(Boolean regExp) {
			this.regExp = regExp;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public String getContext() {
			return context;
		}

		public void setContext(String context) {
			this.context = context;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public String getField() {
			return field;
		}

		public void setField(String field) {
			this.field = field;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public String getDriver() {
			return driver;
		}

		public void setDriver(String driver) {
			this.driver = driver;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public Boolean isInvert() {
			return invert;
		}

		public void setInvert(Boolean invert) {
			this.invert = invert;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public Boolean isAnyBlock() {
			return anyBlock;
		}

		public void setAnyBlock(Boolean anyBlock) {
			this.anyBlock = anyBlock;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public Boolean isMatchAll() {
			return matchAll;
		}

		public void setMatchAll(Boolean matchAll) {
			this.matchAll = matchAll;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public Boolean isNormalize() {
			return normalize;
		}

		public void setNormalize(Boolean normalize) {
			this.normalize = normalize;
		}
	}

	/**
	 * Adds the js rule.
	 *
	 * @param request the request
	 * @param rsRule the rs rule
	 * @return the rule
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/rules")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a compliance rule",
		description = "Creates a compliance rule. The associated policy must already exist."
	)
	public Rule addRule(RsRule rsRule) throws WebApplicationException {
		logger.debug("REST request, add rule.");
		if (rsRule.getName() == null || rsRule.getName().trim().isEmpty()) {
			logger.warn("User posted an empty rule name.");
			throw new NetshotBadRequestException("Invalid rule name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE_NAME);
		}
		String name = rsRule.getName().trim();

		Session session = Database.getSession();
		try {
			session.beginTransaction();

			Policy policy = (Policy) session.load(Policy.class, rsRule.getPolicy());
			
			Rule rule;
			if (".TextRule".equals(rsRule.getType())) {
				rule = new TextRule(name, policy);
			}
			else {
				rule = new JavaScriptRule(name, policy);
			}

			session.save(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created.", rule);
			this.suggestReturnCode(Response.Status.CREATED);
			return rule;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The posted policy doesn't exist.", e);
			throw new NetshotBadRequestException(
					"Invalid policy.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new rule.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A rule with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_RULE);
			}
			throw new NetshotBadRequestException(
					"Unable to add the rule to the database",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Sets the rule.
	 *
	 * @param request the request
	 * @param id the id
	 * @param rsRule the rs rule
	 * @return the rule
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/rules/{id}")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update a compliance rule",
		description = "Edits a compliance rule, by ID."
	)
	public Rule setRule(@PathParam("id") Long id, RsRule rsRule)
			throws WebApplicationException {
		logger.debug("REST request, edit rule {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Rule rule = (Rule) session.get(Rule.class, id);
			if (rule == null) {
				logger.error("Unable to find the rule {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this rule.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
			}

			if (rsRule.getName() != null) {
				String name = rsRule.getName().trim();
				if (name.isEmpty()) {
					logger.warn("User posted an empty rule name.");
					throw new NetshotBadRequestException("Invalid rule name.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE_NAME);
				}
				rule.setName(name);
			}
			rule.setEnabled(rsRule.isEnabled());

			Map<Long, Date> postedExemptions = new HashMap<Long, Date>();
			postedExemptions.putAll(rsRule.getExemptions());
			Iterator<Exemption> i = rule.getExemptions().iterator();
			while (i.hasNext()) {
				Exemption exemption = i.next();
				Long deviceId = exemption.getDevice().getId();
				if (postedExemptions.containsKey(deviceId)) {
					exemption.setExpirationDate(postedExemptions.get(deviceId));
					postedExemptions.remove(deviceId);
				}
				else {
					i.remove();
				}
			}
			for (Map.Entry<Long, Date> postedExemption : postedExemptions.entrySet()) {
				Device device = (Device) session.load(Device.class, postedExemption.getKey());
				Exemption exemption = new Exemption(rule, device, postedExemption.getValue());
				rule.addExemption(exemption);
			}

			if (rule instanceof JavaScriptRule) {
				if (rsRule.getScript() != null) {
					String script = rsRule.getScript().trim();
					((JavaScriptRule) rule).setScript(script);
				}
			}
			else if (rule instanceof TextRule) {
				if (rsRule.getText() != null) {
					((TextRule) rule).setText(rsRule.getText());
				}
				if (rsRule.isRegExp() != null) {
					((TextRule) rule).setRegExp(rsRule.isRegExp());
				}
				if (rsRule.getContext() != null) {
					((TextRule) rule).setContext(rsRule.getContext());
				}
				if (rsRule.getField() != null) {
					((TextRule) rule).setField(rsRule.getField());
				}
				if (rsRule.getDriver() != null) {
					((TextRule) rule).setDeviceDriver(rsRule.getDriver());
				}
				if (rsRule.isInvert() != null) {
					((TextRule) rule).setInvert(rsRule.isInvert());
				}
				if (rsRule.isMatchAll() != null) {
					((TextRule) rule).setMatchAll(rsRule.isMatchAll());
				}
				if (rsRule.isAnyBlock() != null) {
					((TextRule) rule).setAnyBlock(rsRule.isAnyBlock());
				}
				if (rsRule.isNormalize() != null) {
					((TextRule) rule).setNormalize(rsRule.isNormalize());
				}
			}

			session.update(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited.", rule);
			return rule;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new rule.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A rule with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_RULE);
			}
			throw new NetshotBadRequestException(
					"Unable to save the rule.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (WebApplicationException e) {
			session.getTransaction().rollback();
			throw e;
		}
		finally {
			session.close();
		}
	}

	/**
	 * Delete rule.
	 *
	 * @param request the request
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/rules/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove a compliance rule",
		description = "Removes a compliance rule, by ID."
	)
	public void deleteRule(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete rule {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Rule rule = (Rule) session.load(Rule.class, id);
			session.delete(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted.", rule);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The rule {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The rule doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the rule {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the rule.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsJsRuleTest.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsRuleTest extends RsRule {

		/** The device. */
		private long device = 0;

		/**
		 * Gets the device.
		 *
		 * @return the device
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getDevice() {
			return device;
		}

		/**
		 * Sets the device.
		 *
		 * @param device the new device
		 */
		public void setDevice(long device) {
			this.device = device;
		}


	}

	/**
	 * The Class RsRuleTestResult.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsRuleTestResult {

		/** The result. */
		private CheckResult.ResultOption result;

		/** The script error. */
		private String scriptError;

		/**
		 * Gets the result.
		 *
		 * @return the result
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public CheckResult.ResultOption getResult() {
			return result;
		}

		/**
		 * Sets the result.
		 *
		 * @param result the new result
		 */
		public void setResult(CheckResult.ResultOption result) {
			this.result = result;
		}

		/**
		 * Gets the script error.
		 *
		 * @return the script error
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getScriptError() {
			return scriptError;
		}

		/**
		 * Sets the script error.
		 *
		 * @param scriptError the new script error
		 */
		public void setScriptError(String scriptError) {
			this.scriptError = scriptError;
		}

	}

	/**
	 * Test rule.
	 *
	 * @param request the request
	 * @param rsRule the rs rule
	 * @return the rule test result
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/rules/test")
	@RolesAllowed("readonly")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Test a compliance rule",
		description = "Test a compliance rule against a given device, in dry run mode."
	)
	public RsRuleTestResult testRule(RsRuleTest rsRule) throws WebApplicationException {
		logger.debug("REST request, rule test.");
		Device device;
		Session session = Database.getSession();
		try {
			device = (Device) session
					.createQuery("from Device d join fetch d.lastConfig where d.id = :id")
					.setParameter("id", rsRule.getDevice()).uniqueResult();
			if (device == null) {
				logger.warn("Unable to find the device {}.", rsRule.getDevice());
				throw new NetshotBadRequestException("Unable to find the device.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
			}
			
			Rule rule;
			
			if (".TextRule".equals(rsRule.getType())) {
				TextRule txRule = new TextRule("TEST", null);
				txRule.setDeviceDriver(rsRule.getDriver());
				txRule.setField(rsRule.getField());
				txRule.setInvert(rsRule.isInvert());
				txRule.setContext(rsRule.getContext());
				txRule.setRegExp(rsRule.isRegExp());
				txRule.setText(rsRule.getText());
				txRule.setAnyBlock(rsRule.isAnyBlock());
				txRule.setMatchAll(rsRule.isMatchAll());
				txRule.setNormalize(rsRule.isNormalize());
				rule = txRule;
			}
			else {
				JavaScriptRule jsRule = new JavaScriptRule("TEST", null);
				jsRule.setScript(rsRule.getScript());
				rule = jsRule;
			}

			RsRuleTestResult result = new RsRuleTestResult();

			StringBuffer log = new StringBuffer();
			TaskLogger taskLogger = new TaskLogger() {
			
				@Override
				@Export
				public void warn(String message) {
					log.append(String.format("[WARN] %s\n", message));
				}
			
				@Override
				@Export
				public void trace(String message) {
					log.append(String.format("[TRACE] %s\n", message));
				}
			
				@Override
				@Export
				public void info(String message) {
					log.append(String.format("[INFO] %s\n", message));
				}
			
				@Override
				@Export
				public void error(String message) {
					log.append(String.format("[ERROR] %s\n", message));
				}
			
				@Override
				@Export
				public void debug(String message) {
					log.append(String.format("[DEBUG] %s\n", message));
				}
			};

			rule.setEnabled(true);
			rule.check(device, session, taskLogger);
			result.setResult(rule.getCheckResults().iterator().next().getResult());
			result.setScriptError(log.toString());

			return result;
		}
		catch (Exception e) {
			logger.error("Unable to retrieve the device {}.", rsRule.getDevice(), e);
			throw new NetshotBadRequestException("Unable to retrieve the device.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsLightExemptedDevice.
	 */
	@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
	public static class RsLightExemptedDevice extends RsLightDevice {

		/** The expiration date. */
		private Date expirationDate;

		/**
		 * Gets the expiration date.
		 *
		 * @return the expiration date
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getExpirationDate() {
			return expirationDate;
		}

		/**
		 * Sets the expiration date.
		 *
		 * @param expirationDate the new expiration date
		 */
		public void setExpirationDate(Date expirationDate) {
			this.expirationDate = expirationDate;
		}

	}

	/**
	 * Gets the exempted devices.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the exempted devices
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/rule/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the exempted devices of a compliance rule",
		description = "Returns the list of devices which have an exemption against a given compliance rule, by ID."
	)
	public List<RsLightExemptedDevice> getExemptedDevices(@PathParam("id") Long id) throws WebApplicationException {
		logger.debug("REST request, get exemptions for rule {}.", id);
		Session session = Database.getSession();
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			List<RsLightExemptedDevice> exemptions = session
				.createQuery(DEVICELIST_BASEQUERY + ", e.expirationDate as expirationDate from Exemption e join e.key.device d where e.key.rule.id = :id")
				.setParameter("id", id)
				.setResultTransformer(Transformers.aliasToBean(RsLightExemptedDevice.class))
				.list();
			return exemptions;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the exemptions.", e);
			throw new NetshotBadRequestException("Unable to fetch the exemptions",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsDeviceRule.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsDeviceRule {

		/** The id. */
		private long id = 0;

		/** The rule name. */
		private String ruleName = "";

		/** The policy name. */
		private String policyName = "";

		/** The result. */
		private CheckResult.ResultOption result;

		/** The comment. */
		private String comment = "";

		/** The check date. */
		private Date checkDate;

		/** The expiration date. */
		private Date expirationDate;


		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Gets the rule name.
		 *
		 * @return the rule name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getRuleName() {
			return ruleName;
		}

		/**
		 * Sets the rule name.
		 *
		 * @param ruleName the new rule name
		 */
		public void setRuleName(String ruleName) {
			this.ruleName = ruleName;
		}

		/**
		 * Gets the policy name.
		 *
		 * @return the policy name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getPolicyName() {
			return policyName;
		}

		/**
		 * Sets the policy name.
		 *
		 * @param policyName the new policy name
		 */
		public void setPolicyName(String policyName) {
			this.policyName = policyName;
		}

		/**
		 * Gets the result.
		 *
		 * @return the result
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public CheckResult.ResultOption getResult() {
			return result;
		}

		/**
		 * Sets the result.
		 *
		 * @param result the new result
		 */
		public void setResult(CheckResult.ResultOption result) {
			this.result = result;
		}

		/**
		 * Gets the check date.
		 *
		 * @return the check date
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getCheckDate() {
			return checkDate;
		}

		/**
		 * Sets the check date.
		 *
		 * @param checkDate the new check date
		 */
		public void setCheckDate(Date checkDate) {
			this.checkDate = checkDate;
		}

		/**
		 * Gets the expiration date.
		 *
		 * @return the expiration date
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getExpirationDate() {
			return expirationDate;
		}

		/**
		 * Sets the expiration date.
		 *
		 * @param expirationDate the new expiration date
		 */
		public void setExpirationDate(Date expirationDate) {
			this.expirationDate = expirationDate;
		}

		/**
		 * Gets the comment.
		 *
		 * @return the comment
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getComment() {
			return comment;
		}

		/**
		 * Sets the comment.
		 *
		 * @param comment the new comment
		 */
		public void setComment(String comment) {
			this.comment = comment;
		}

	}

	/**
	 * Gets the device compliance results.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the device compliance
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}/complianceresults")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the compliance results for a device",
		description = "Returns the compliance results for a give device, by ID."
	)
	public List<RsDeviceRule> getDeviceComplianceResults(@PathParam("id") Long id) throws WebApplicationException {
		logger.debug("REST request, get compliance results for device {}.", id);
		Session session = Database.getSession();
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			List<RsDeviceRule> rules = session.createQuery(
					"select r.id as id, r.name as ruleName, p.name as policyName, cr.result as result, cr.checkDate as checkDate, cr.comment as comment, " +
					"e.expirationDate as expirationDate from Rule r join r.policy p join p.targetGroup g join g.cachedDevices d1 with d1.id = :id " +
					"left join r.checkResults cr with cr.key.device.id = :id left join r.exemptions e with e.key.device.id = :id")
				.setParameter("id", id)
				.setResultTransformer(Transformers.aliasToBean(RsDeviceRule.class))
				.list();
			return rules;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the rules.", e);
			throw new NetshotBadRequestException("Unable to fetch the rules",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsConfigChangeNumberByDateStat.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsConfigChangeNumberByDateStat {

		public RsConfigChangeNumberByDateStat(long changeCount, Date changeDay) {
			this.changeCount = changeCount;
			this.changeDay = changeDay;
		}

		/** The change count. */
		private long changeCount;

		/** The change day. */
		private Date changeDay;

		/**
		 * Gets the change count.
		 *
		 * @return the change count
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getChangeCount() {
			return changeCount;
		}

		/**
		 * Sets the change count.
		 *
		 * @param changes the new change count
		 */
		public void setChangeCount(long changes) {
			this.changeCount = changes;
		}

		/**
		 * Gets the change day.
		 *
		 * @return the change day
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getChangeDay() {
			return changeDay;
		}

		/**
		 * Sets the change day.
		 *
		 * @param date the new change day
		 */
		public void setChangeDay(Date date) {
			this.changeDay = date;
		}


	}

	/**
	 * Gets the last7 days changes by day stats.
	 *
	 * @param request the request
	 * @return the last7 days changes by day stats
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/reports/last7dayschangesbyday")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the number of configuration changes for the last 7 days",
		description = "Returns the number of device configuration changes per day, for the last 7 days."
	)
	public List<RsConfigChangeNumberByDateStat> getLast7DaysChangesByDayStats(@QueryParam("tz") String jsTimeZone) throws WebApplicationException {
		logger.debug("REST request, get last 7 day changes by day stats.");
		Session session = Database.getSession();

		TimeZone timeZone = TimeZone.getDefault();
		try {
			timeZone = TimeZone.getTimeZone(jsTimeZone);
		}
		catch (Exception e) {
			logger.warn("Unable to parse timezone '{}'", jsTimeZone);
		}
		Calendar today = Calendar.getInstance(timeZone);
		today.set(Calendar.HOUR_OF_DAY, 0);
		today.set(Calendar.MINUTE, 0);
		today.set(Calendar.SECOND, 0);
		today.set(Calendar.MILLISECOND, 0);
		try {
			List<RsConfigChangeNumberByDateStat> stats = new ArrayList<RsConfigChangeNumberByDateStat>();
			for (int d = 7; d > 0; d--) {
				Calendar dayStart = (Calendar)today.clone();
				Calendar dayEnd = (Calendar)today.clone();
				dayStart.add(Calendar.DATE, -d + 1);
				dayEnd.add(Calendar.DATE, -d + 2);
				Long changeCount = (Long)session
					.createQuery("select count(*) from Config c where c.changeDate >= :dayStart and c.changeDate < :dayEnd")
					.setParameter("dayStart", dayStart.getTime())
					.setParameter("dayEnd", dayEnd.getTime())
					.uniqueResult();
				stats.add(new RsConfigChangeNumberByDateStat(changeCount == null ? 0 : changeCount, dayStart.getTime()));
			}
			return stats;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the stats.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsGroupConfigComplianceStat.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsGroupConfigComplianceStat {

		/** The group id. */
		private long groupId;

		/** The group name. */
		private String groupName;

		/** The group folder. */
		private String groupFolder;

		/** The compliant device count. */
		private long compliantDeviceCount;

		/** The device count. */
		private long deviceCount;

		/**
		 * Gets the group id.
		 *
		 * @return the group id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getGroupId() {
			return groupId;
		}

		/**
		 * Sets the group id.
		 *
		 * @param groupId the new group id
		 */
		public void setGroupId(long groupId) {
			this.groupId = groupId;
		}

		/**
		 * Gets the group name.
		 *
		 * @return the group name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getGroupName() {
			return groupName;
		}

		/**
		 * Sets the group name.
		 *
		 * @param groupName the new group name
		 */
		public void setGroupName(String groupName) {
			this.groupName = groupName;
		}

		/**
		 * Gets the group folder.
		 *
		 * @return the group folder
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getGroupFolder() {
			return groupFolder;
		}

		/**
		 * Sets the group folder.
		 *
		 * @param groupFolder the new group folder
		 */
		public void setGroupFolder(String groupFolder) {
			this.groupFolder = groupFolder;
		}

		/**
		 * Gets the compliant device count.
		 *
		 * @return the compliant device count
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getCompliantDeviceCount() {
			return compliantDeviceCount;
		}

		/**
		 * Sets the compliant device count.
		 *
		 * @param compliantCount the new compliant device count
		 */
		public void setCompliantDeviceCount(long compliantCount) {
			this.compliantDeviceCount = compliantCount;
		}

		/**
		 * Gets the device count.
		 *
		 * @return the device count
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getDeviceCount() {
			return deviceCount;
		}

		/**
		 * Sets the device count.
		 *
		 * @param deviceCount the new device count
		 */
		public void setDeviceCount(long deviceCount) {
			this.deviceCount = deviceCount;
		}
	}

	/**
	 * Gets the group config compliance stats.
	 *
	 * @param request the request
	 * @return the group config compliance stats
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/reports/groupconfigcompliancestats")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the compliance status of a device group",
		description = "Returns the compliance status of a given device group, by ID."
	)
	public List<RsGroupConfigComplianceStat> getGroupConfigComplianceStats(@QueryParam("domain") Set<Long> domains,
			@QueryParam("group") Set<Long> deviceGroups, @QueryParam("policy") Set<Long> policies) throws WebApplicationException {
		logger.debug("REST request, group config compliance stats.");
		Session session = Database.getSession();
		try {
			String domainFilter = "";
			if (domains.size() > 0) {
				domainFilter = " d.mgmtDomain.id in (:domainIds) and";
			}
			String ccrFilter = "";
			if (policies.size() > 0) {
				ccrFilter = " rule.policy.id in (:policyIds) and";
			}
			String groupFilter = "";
			if (deviceGroups.size() > 0) {
				groupFilter = " g.id in (:groupIds) and";
			}
			
			@SuppressWarnings("unchecked")
			Query<RsGroupConfigComplianceStat> query = session
				.createQuery("select g.id as groupId, g.name as groupName, g.folder as groupFolder, "
						+ "(select count(d) from g.cachedDevices d where" + domainFilter + " d.status = :enabled and (select count(ccr.result) from d.complianceCheckResults ccr join ccr.key.rule rule where"
							+ ccrFilter + " ccr.result = :nonConforming) = 0) as compliantDeviceCount, "
						+ "(select count(d) from g.cachedDevices d where" + domainFilter + " d.status = :enabled) as deviceCount "
						+ "from DeviceGroup g where" + groupFilter + " g.hiddenFromReports <> true")
				.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING)
				.setParameter("enabled", Device.Status.INPRODUCTION);
			if (domains.size() > 0) {
				query.setParameterList("domainIds", domains);
			}
			if (policies.size() > 0) {
				query.setParameterList("policyIds", policies);
			}
			if (deviceGroups.size() > 0) {
				query.setParameterList("groupIds", deviceGroups);
			}
			@SuppressWarnings("deprecation")
			List<RsGroupConfigComplianceStat> stats = query
				.setResultTransformer(Transformers.aliasToBean(RsGroupConfigComplianceStat.class))
				.list();
			return stats;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the stats.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	@JsonTypeInfo(use = JsonTypeInfo.Id.MINIMAL_CLASS, include = JsonTypeInfo.As.PROPERTY, property = "type")
	public abstract static class RsHardwareSupportStat {
		private Date eoxDate;
		private long deviceCount;

		@XmlElement
		@JsonView(DefaultView.class)
		public Date getEoxDate() {
			return eoxDate;
		}
		public void setEoxDate(Date date) {
			this.eoxDate = date;
		}
		@XmlElement
		@JsonView(DefaultView.class)
		public long getDeviceCount() {
			return deviceCount;
		}
		public void setDeviceCount(long deviceCount) {
			this.deviceCount = deviceCount;
		}

	}

	@XmlType
	public static class RsHardwareSupportEoSStat extends RsHardwareSupportStat {

	}

	@XmlType
	public static class RsHardwareSupportEoLStat extends RsHardwareSupportStat {

	}

	@GET
	@Path("/reports/hardwaresupportstats")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the global hardware support status",
		description = "Returns the global hardware support status, i.e. a list of End-of-Life and End-of-Sale dates with the corresponding device count."
	)
	public List<RsHardwareSupportStat> getHardwareSupportStats() throws WebApplicationException {
		logger.debug("REST request, hardware support stats.");
		Session session = Database.getSession();
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			List<RsHardwareSupportStat> eosStats = session
				.createQuery("select count(d) as deviceCount, d.eosDate AS eoxDate from Device d where d.status = :enabled group by d.eosDate")
				.setParameter("enabled", Device.Status.INPRODUCTION)
				.setResultTransformer(Transformers.aliasToBean(RsHardwareSupportEoSStat.class))
				.list();
			@SuppressWarnings({ "deprecation", "unchecked" })
			List<RsHardwareSupportStat> eolStats = session
				.createQuery("select count(d) as deviceCount, d.eolDate AS eoxDate from Device d where d.status = :enabled group by d.eolDate")
				.setParameter("enabled", Device.Status.INPRODUCTION)
				.setResultTransformer(Transformers.aliasToBean(RsHardwareSupportEoLStat.class))
				.list();
			List<RsHardwareSupportStat> stats = new ArrayList<RsHardwareSupportStat>();
			stats.addAll(eosStats);
			stats.addAll(eolStats);
			return stats;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the stats.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsGroupSoftwareComplianceStat.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsGroupSoftwareComplianceStat {

		/** The group id. */
		private long groupId;

		/** The group name. */
		private String groupName;

		/** The gold device count. */
		private long goldDeviceCount;

		/** The silver device count. */
		private long silverDeviceCount;

		/** The bronze device count. */
		private long bronzeDeviceCount;

		/** The device count. */
		private long deviceCount;

		/**
		 * Gets the group id.
		 *
		 * @return the group id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getGroupId() {
			return groupId;
		}

		/**
		 * Sets the group id.
		 *
		 * @param groupId the new group id
		 */
		public void setGroupId(long groupId) {
			this.groupId = groupId;
		}

		/**
		 * Gets the group name.
		 *
		 * @return the group name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getGroupName() {
			return groupName;
		}

		/**
		 * Sets the group name.
		 *
		 * @param groupName the new group name
		 */
		public void setGroupName(String groupName) {
			this.groupName = groupName;
		}

		/**
		 * Gets the gold device count.
		 *
		 * @return the gold device count
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getGoldDeviceCount() {
			return goldDeviceCount;
		}

		/**
		 * Sets the gold device count.
		 *
		 * @param goldDeviceCount the new gold device count
		 */
		public void setGoldDeviceCount(long goldDeviceCount) {
			this.goldDeviceCount = goldDeviceCount;
		}

		/**
		 * Gets the silver device count.
		 *
		 * @return the silver device count
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getSilverDeviceCount() {
			return silverDeviceCount;
		}

		/**
		 * Sets the silver device count.
		 *
		 * @param silverDeviceCount the new silver device count
		 */
		public void setSilverDeviceCount(long silverDeviceCount) {
			this.silverDeviceCount = silverDeviceCount;
		}

		/**
		 * Gets the bronze device count.
		 *
		 * @return the bronze device count
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getBronzeDeviceCount() {
			return bronzeDeviceCount;
		}

		/**
		 * Sets the bronze device count.
		 *
		 * @param bronzeDeviceCount the new bronze device count
		 */
		public void setBronzeDeviceCount(long bronzeDeviceCount) {
			this.bronzeDeviceCount = bronzeDeviceCount;
		}

		/**
		 * Gets the device count.
		 *
		 * @return the device count
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getDeviceCount() {
			return deviceCount;
		}

		/**
		 * Sets the device count.
		 *
		 * @param deviceCount the new device count
		 */
		public void setDeviceCount(long deviceCount) {
			this.deviceCount = deviceCount;
		}
	}

	/**
	 * Gets the group software compliance stats.
	 *
	 * @param request the request
	 * @return the group software compliance stats
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/reports/groupsoftwarecompliancestats")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the global software compliance status",
		description = "Returns the software compliance status of devices, optionally filtered by a list of device domains."
	)
	public List<RsGroupSoftwareComplianceStat> getGroupSoftwareComplianceStats(@QueryParam("domain") Set<Long> domains) throws WebApplicationException {
		logger.debug("REST request, group software compliance stats.");
		Session session = Database.getSession();
		try {
			String domainFilter = "";
			if (domains.size() > 0) {
				domainFilter = " and d.mgmtDomain.id in (:domainIds)";
			}
			@SuppressWarnings("unchecked")
			Query<RsGroupSoftwareComplianceStat> query = session
				.createQuery("select g.id as groupId, g.name as groupName, "
						+ "(select count(d) from g.cachedDevices d where d.status = :enabled and d.softwareLevel = :gold" + domainFilter + ") as goldDeviceCount, "
						+ "(select count(d) from g.cachedDevices d where d.status = :enabled and d.softwareLevel = :silver" + domainFilter + ") as silverDeviceCount, "
						+ "(select count(d) from g.cachedDevices d where d.status = :enabled and d.softwareLevel = :bronze"  + domainFilter + ") as bronzeDeviceCount, "
						+ "(select count(d) from g.cachedDevices d where d.status = :enabled"  + domainFilter + ") as deviceCount "
						+ "from DeviceGroup g where g.hiddenFromReports <> true")
				.setParameter("gold", ConformanceLevel.GOLD)
				.setParameter("silver", ConformanceLevel.SILVER)
				.setParameter("bronze", ConformanceLevel.BRONZE)
				.setParameter("enabled", Device.Status.INPRODUCTION);
			if (domains.size() > 0) {
				query.setParameterList("domainIds", domains);
			}
			@SuppressWarnings("deprecation")
			List<RsGroupSoftwareComplianceStat> stats = query
				.setResultTransformer(Transformers.aliasToBean(RsGroupSoftwareComplianceStat.class))
				.list();
			return stats;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the stats.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsLightPolicyRuleDevice.
	 */
	@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
	public static class RsLightPolicyRuleDevice extends RsLightDevice {

		/** The rule name. */
		private String ruleName;

		/** The policy name. */
		private String policyName;

		/** The check date. */
		private Date checkDate;

		/** The result. */
		private ResultOption result;

		/**
		 * Gets the rule name.
		 *
		 * @return the rule name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getRuleName() {
			return ruleName;
		}

		/**
		 * Gets the policy name.
		 *
		 * @return the policy name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getPolicyName() {
			return policyName;
		}

		/**
		 * Gets the check date.
		 *
		 * @return the check date
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public Date getCheckDate() {
			return checkDate;
		}

		/**
		 * Gets the result.
		 *
		 * @return the result
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public ResultOption getResult() {
			return result;
		}

		/**
		 * Sets the rule name.
		 *
		 * @param ruleName the new rule name
		 */
		public void setRuleName(String ruleName) {
			this.ruleName = ruleName;
		}

		/**
		 * Sets the policy name.
		 *
		 * @param policyName the new policy name
		 */
		public void setPolicyName(String policyName) {
			this.policyName = policyName;
		}

		/**
		 * Sets the check date.
		 *
		 * @param checkDate the new check date
		 */
		public void setCheckDate(Date checkDate) {
			this.checkDate = checkDate;
		}

		/**
		 * Sets the result.
		 *
		 * @param result the new result
		 */
		public void setResult(ResultOption result) {
			this.result = result;
		}
	}
	

	/**
	 * Gets the configuration compliance results.
	 *
	 * @param request the request
	 * @param domains optional filter on device domain
	 * @param groups optional filter on device groups
	 * @param policies optional filter on compliance policy
	 * @param resuts optional filter on compliance result
	 * @return the config compliance results
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/reports/configcompliancedevicestatuses")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the configuration compliance status of devices",
		description = "Returns the configuration compliance status of devices; optionally filtered by domain, group, policy or compliance level."
	)
	public List<RsLightPolicyRuleDevice> getConfigComplianceDeviceStatuses(
			@QueryParam("domain") Set<Long> domains,
			@QueryParam("group") Set<Long> groups,
			@QueryParam("policy") Set<Long> policies,
			@QueryParam("result") Set<CheckResult.ResultOption> results) throws WebApplicationException {

		logger.debug("REST request, config compliant device statuses.");
		Session session = Database.getSession();
		try {
			String hqlQuery = "";
			hqlQuery += DEVICELIST_BASEQUERY;
			hqlQuery += ", p.name as policyName, r.name as ruleName, ccr.checkDate as checkDate, ccr.result as result from Device d ";
			hqlQuery += "left join d.ownerGroups g join d.complianceCheckResults ccr join ccr.key.rule r join r.policy p ";
			hqlQuery += "where d.status = :enabled";
			if (domains.size() > 0) {
				hqlQuery += " and d.mgmtDomain.id in (:domainIds)";
			}
			if (groups.size() > 0) {
				hqlQuery += " and g.id in (:groupIds)";
			}
			if (policies.size() > 0) {
				hqlQuery += " and p.id in (:policyIds)";
			}
			if (results.size() > 0) {
				hqlQuery += " and ccr.result in (:results)";
			}
			@SuppressWarnings("unchecked")
			Query<RsLightPolicyRuleDevice> query = session.createQuery(hqlQuery);
			query.setParameter("enabled", Device.Status.INPRODUCTION);
			if (domains.size() > 0) {
				query.setParameterList("domainIds", domains);
			}
			if (groups.size() > 0) {
				query.setParameterList("groupIds", groups);
			}
			if (policies.size() > 0) {
				query.setParameterList("policyIds", policies);
			}
			if (results.size() > 0) {
				query.setParameterList("results", results);
			}
			@SuppressWarnings("deprecation")
			List<RsLightPolicyRuleDevice> devices = query
				.setResultTransformer(Transformers.aliasToBean(RsLightPolicyRuleDevice.class))
				.list();
			return devices;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the devices.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the group config non compliant devices.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the group config non compliant devices
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/reports/groupconfignoncompliantdevices/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the non compliant devices of a group",
		description = "Returns the list of non-compliance devices part of a given group, optionally filtered by domains and policies"
	)
	public List<RsLightPolicyRuleDevice> getGroupConfigNonCompliantDevices(@PathParam("id") Long id,
			@QueryParam("domain") Set<Long> domains, @QueryParam("policy") Set<Long> policies) throws WebApplicationException {
		logger.debug("REST request, group config non compliant devices.");
		Session session = Database.getSession();
		try {
			String domainFilter = "";
			if (domains.size() > 0) {
				domainFilter = " and d.mgmtDomain.id in (:domainIds)";
			}
			String policyFilter = "";
			if (policies.size() > 0) {
				policyFilter = " and p.id in (:policyIds)";
			}
			@SuppressWarnings("unchecked")
			Query<RsLightPolicyRuleDevice> query = session
				.createQuery(DEVICELIST_BASEQUERY + ", p.name as policyName, r.name as ruleName, ccr.checkDate as checkDate, ccr.result as result from Device d "
						+ "join d.ownerGroups g join d.complianceCheckResults ccr join ccr.key.rule r join r.policy p "
						+ "where g.id = :id and ccr.result = :nonConforming and d.status = :enabled" + domainFilter + policyFilter)
				.setParameter("id", id)
				.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING)
				.setParameter("enabled", Device.Status.INPRODUCTION);
			if (domains.size() > 0) {
				query.setParameterList("domainIds", domains);
			}
			if (policies.size() > 0) {
				query.setParameterList("policyIds", policies);
			}
			@SuppressWarnings("deprecation")
			List<RsLightPolicyRuleDevice> devices = query
				.setResultTransformer(Transformers.aliasToBean(RsLightPolicyRuleDevice.class))
				.list();
			return devices;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the devices.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	@GET
	@Path("/reports/hardwaresupportdevices/{type}/{date}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the End-of-Life or End-of-Sale devices matching a date.",
		description = "Returns the list of devices getting End-of-Life (type 'eol') or End-of-Sale (type 'eos') at the given date (or never if 'date' is not given)."
	)
	public List<RsLightDevice> getHardwareStatusDevices(@PathParam("type") String type, @PathParam("date") Long date) throws WebApplicationException {
		logger.debug("REST request, EoX devices by type and date.");
		if (!type.equals("eol") && !type.equals("eos")) {
			logger.error("Invalid requested EoX type.");
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		Date eoxDate = new Date(date);
		Session session = Database.getSession();
		try {
			if (date == 0) {
				@SuppressWarnings({ "deprecation", "unchecked" })
				List<RsLightDevice> devices = session
				.createQuery(DEVICELIST_BASEQUERY + "from Device d where d." + type + "Date is null and d.status = :enabled")
				.setParameter("enabled", Device.Status.INPRODUCTION)
				.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class))
				.list();
				return devices;
			}
			else {
				@SuppressWarnings({ "deprecation", "unchecked" })
				List<RsLightDevice> devices = session
				.createQuery(DEVICELIST_BASEQUERY + "from Device d where date(d." + type + "Date) = :eoxDate and d.status = :enabled")
				.setParameter("eoxDate", eoxDate)
				.setParameter("enabled", Device.Status.INPRODUCTION)
				.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class))
				.list();
				return devices;
			}
		}
		catch (HibernateException e) {
			logger.error("Unable to get the devices.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the hardware rules.
	 *
	 * @param request the request
	 * @return the harware rules
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/hardwarerules")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the hardware compliance rules",
		description = "Returns the list of hardware compliance rules."
	)
	public List<HardwareRule> getHardwareRules() throws WebApplicationException {
		logger.debug("REST request, hardware rules.");
		Session session = Database.getSession();
		try {
			List<HardwareRule> rules = session
				.createQuery("from HardwareRule r left join fetch r.targetGroup g", HardwareRule.class)
				.list();
			return rules;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the hardware rules.", e);
			throw new NetshotBadRequestException("Unable to fetch the hardware rules.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsHardwareRule.
	 */
	@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
	public static class RsHardwareRule {

		/** The id. */
		private long id;

		/** The group. */
		private long group = -1;

		/** The device class name. */
		private String driver = "";

		/** The part number. */
		private String partNumber = "";

		private boolean partNumberRegExp = false;

		/** The family. */
		private String family = "";

		private boolean familyRegExp = false;

		private Date endOfSale = null;

		private Date endOfLife = null;

		@XmlElement
		@JsonView(DefaultView.class)
		public long getId() {
			return id;
		}

		public void setId(long id) {
			this.id = id;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public long getGroup() {
			return group;
		}

		public void setGroup(long group) {
			this.group = group;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public String getDriver() {
			return driver;
		}

		public void setDriver(String driver) {
			this.driver = driver;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public String getPartNumber() {
			return partNumber;
		}

		public void setPartNumber(String partNumber) {
			this.partNumber = partNumber;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isPartNumberRegExp() {
			return partNumberRegExp;
		}

		public void setPartNumberRegExp(boolean partNumberRegExp) {
			this.partNumberRegExp = partNumberRegExp;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public String getFamily() {
			return family;
		}

		public void setFamily(String family) {
			this.family = family;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isFamilyRegExp() {
			return familyRegExp;
		}

		public void setFamilyRegExp(boolean familyRegExp) {
			this.familyRegExp = familyRegExp;
		}

		@XmlElement(nillable = true)
		@JsonView(DefaultView.class)
		public Date getEndOfSale() {
			return endOfSale;
		}

		public void setEndOfSale(Date endOfSale) {
			this.endOfSale = endOfSale;
		}

		@XmlElement(nillable = true)
		@JsonView(DefaultView.class)
		public Date getEndOfLife() {
			return endOfLife;
		}

		public void setEndOfLife(Date endOfLife) {
			this.endOfLife = endOfLife;
		}
	}

	/**
	 * Adds an hardware rule.
	 *
	 * @param request the request
	 * @param rsRule the rs rule
	 * @return the hardware rule
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/hardwarerules")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add an hardware compliance rule",
		description = "Creates an hardware compliance rule."
	)
	public HardwareRule addHardwareRule(RsHardwareRule rsRule) throws WebApplicationException {
		logger.debug("REST request, add hardware rule.");

		HardwareRule rule;
		Session session = Database.getSession();
		try {
			session.beginTransaction();

			DeviceGroup group = null;
			if (rsRule.getGroup() != -1) {
				group = (DeviceGroup) session.load(DeviceGroup.class, rsRule.getGroup());
			}

			String driver = rsRule.getDriver(); 
			if (DeviceDriver.getDriverByName(driver) == null) {
				driver = null;
			}
			
			rule = new HardwareRule(driver, group,
					rsRule.getFamily(), rsRule.isFamilyRegExp(), rsRule.getPartNumber(),
					rsRule.isPartNumberRegExp(), rsRule.getEndOfSale(), rsRule.getEndOfLife());

			session.save(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created", rule);
			this.suggestReturnCode(Response.Status.CREATED);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The posted group doesn't exist", e);
			throw new NetshotBadRequestException(
					"Invalid group",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new rule.", e);
			throw new NetshotBadRequestException(
					"Unable to add the rule to the database",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		return rule;
	}


	/**
	 * Delete hardware rule.
	 *
	 * @param request the request
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/hardwarerules/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove an hardware compliance rule",
		description = "Removes an hardware compliance rule, by ID."
	)
	public void deleteHardwareRule(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete hardware rule {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			HardwareRule rule = (HardwareRule) session.load(HardwareRule.class, id);
			session.delete(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted", rule);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The rule {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The rule doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the rule {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the rule.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}


	/**
	 * Sets the hardware rule.
	 *
	 * @param request the request
	 * @param id the id
	 * @param rsRule the rs rule
	 * @return the hardware rule
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/hardwarerules/{id}")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update an hardware compliance rule",
		description = "Edits an hardware compliance rule, by ID."
	)
	public HardwareRule setHardwareRule(@PathParam("id") Long id, RsHardwareRule rsRule)
			throws WebApplicationException {
		logger.debug("REST request, edit hardware rule {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			HardwareRule rule = (HardwareRule) session.get(HardwareRule.class, id);
			if (rule == null) {
				logger.error("Unable to find the rule {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this rule.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
			}

			String driver = rsRule.getDriver(); 
			if (DeviceDriver.getDriverByName(driver) == null) {
				driver = null;
			}
			rule.setDriver(driver);

			DeviceGroup group = null;
			if (rsRule.getGroup() != -1) {
				group = (DeviceGroup) session.load(DeviceGroup.class, rsRule.getGroup());
			}
			rule.setTargetGroup(group);

			rule.setFamily(rsRule.getFamily());
			rule.setFamilyRegExp(rsRule.isFamilyRegExp());
			rule.setEndOfLife(rsRule.getEndOfLife());
			rule.setEndOfSale(rsRule.getEndOfSale());
			rule.setPartNumber(rsRule.getPartNumber());
			rule.setPartNumberRegExp(rsRule.isPartNumberRegExp());

			session.update(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited", rule);
			return rule;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the rule.", e);
			throw new NetshotBadRequestException(
					"Unable to save the rule.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (WebApplicationException e) {
			session.getTransaction().rollback();
			throw e;
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the software rules.
	 *
	 * @param request the request
	 * @return the software rules
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/softwarerules")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the software compliance rules",
		description = "Returns the list of software compliance rules."
	)
	public List<SoftwareRule> getSoftwareRules() throws WebApplicationException {
		logger.debug("REST request, software rules.");
		Session session = Database.getSession();
		try {
			List<SoftwareRule> rules = session
				.createQuery("from SoftwareRule r left join fetch r.targetGroup g", SoftwareRule.class)
				.list();
			return rules;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the software rules.", e);
			throw new NetshotBadRequestException("Unable to fetch the software rules.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsSoftwareRule.
	 */
	@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
	public static class RsSoftwareRule {

		/** The id. */
		private long id;

		/** The group. */
		private long group = -1;

		/** The device class name. */
		private String driver = "";

		/** The version. */
		private String version = "";

		private boolean versionRegExp = false;

		/** The family. */
		private String family = "";

		private boolean familyRegExp = false;

		/** The part number. */
		private String partNumber = "";

		private boolean partNumberRegExp = false;

		/** The level. */
		private SoftwareRule.ConformanceLevel level = ConformanceLevel.GOLD;

		/** The priority. */
		private double priority = -1;

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Gets the group.
		 *
		 * @return the group
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getGroup() {
			return group;
		}

		/**
		 * Sets the group.
		 *
		 * @param group the new group
		 */
		public void setGroup(long group) {
			this.group = group;
		}

		/**
		 * Gets the device class name.
		 *
		 * @return the device class name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getDriver() {
			return driver;
		}

		public void setDriver(String driver) {
			this.driver = driver;
		}

		/**
		 * Gets the version.
		 *
		 * @return the version
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getVersion() {
			return version;
		}

		/**
		 * Sets the version.
		 *
		 * @param version the new version
		 */
		public void setVersion(String version) {
			this.version = version;
		}

		/**
		 * Gets the family.
		 *
		 * @return the family
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getFamily() {
			return family;
		}

		/**
		 * Sets the family.
		 *
		 * @param family the new family
		 */
		public void setFamily(String family) {
			this.family = family;
		}

		/**
		 * Gets the level.
		 *
		 * @return the level
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public SoftwareRule.ConformanceLevel getLevel() {
			return level;
		}

		/**
		 * Sets the level.
		 *
		 * @param level the new level
		 */
		public void setLevel(SoftwareRule.ConformanceLevel level) {
			this.level = level;
		}

		/**
		 * Gets the priority.
		 *
		 * @return the priority
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public double getPriority() {
			return priority;
		}

		/**
		 * Sets the priority.
		 *
		 * @param priority the new priority
		 */
		public void setPriority(double priority) {
			this.priority = priority;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isVersionRegExp() {
			return versionRegExp;
		}

		public void setVersionRegExp(boolean versionRegExp) {
			this.versionRegExp = versionRegExp;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isFamilyRegExp() {
			return familyRegExp;
		}

		public void setFamilyRegExp(boolean familyRegExp) {
			this.familyRegExp = familyRegExp;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public String getPartNumber() {
			return partNumber;
		}

		public void setPartNumber(String partNumber) {
			this.partNumber = partNumber;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isPartNumberRegExp() {
			return partNumberRegExp;
		}

		public void setPartNumberRegExp(boolean partNumberRegExp) {
			this.partNumberRegExp = partNumberRegExp;
		}
	}

	/**
	 * Adds the software rule.
	 *
	 * @param request the request
	 * @param rsRule the rs rule
	 * @return the software rule
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/softwarerules")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a software compliance rule",
		description = "Creates a software compliance rule."
	)
	public SoftwareRule addSoftwareRule(RsSoftwareRule rsRule) throws WebApplicationException {
		logger.debug("REST request, add software rule.");

		SoftwareRule rule;
		Session session = Database.getSession();
		try {
			session.beginTransaction();

			DeviceGroup group = null;
			if (rsRule.getGroup() != -1) {
				group = (DeviceGroup) session.load(DeviceGroup.class, rsRule.getGroup());
			}
			
			String driver = rsRule.getDriver(); 
			if (DeviceDriver.getDriverByName(driver) == null) {
				driver = null;
			}

			rule = new SoftwareRule(rsRule.getPriority(), group, driver,
					rsRule.getFamily(), rsRule.isFamilyRegExp(), rsRule.getVersion(),
					rsRule.isVersionRegExp(), rsRule.getPartNumber(), rsRule.isPartNumberRegExp(),
					rsRule.getLevel());

			session.save(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created", rule);
			this.suggestReturnCode(Response.Status.CREATED);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The posted group doesn't exist", e);
			throw new NetshotBadRequestException(
					"Invalid group",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new rule.", e);
			throw new NetshotBadRequestException(
					"Unable to add the policy to the database",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		return rule;
	}

	/**
	 * Delete software rule.
	 *
	 * @param request the request
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/softwarerules/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove a software compliance rule",
		description = "Removes a software compliance rule, by ID"
	)
	public void deleteSoftwareRule(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete software rule {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			SoftwareRule rule = (SoftwareRule) session.load(SoftwareRule.class, id);
			session.delete(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted", rule);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The rule {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The rule doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the rule {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the rule.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}


	/**
	 * Sets the software rule.
	 *
	 * @param request the request
	 * @param id the id
	 * @param rsRule the rs rule
	 * @return the software rule
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/softwarerules/{id}")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update a software compliance rule",
		description = "Edits a software compliance rule."
	)
	public SoftwareRule setSoftwareRule(@PathParam("id") Long id, RsSoftwareRule rsRule)
			throws WebApplicationException {
		logger.debug("REST request, edit software rule {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			SoftwareRule rule = (SoftwareRule) session.get(SoftwareRule.class, id);
			if (rule == null) {
				logger.error("Unable to find the rule {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this rule.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
			}

			String driver = rsRule.getDriver(); 
			if (DeviceDriver.getDriverByName(driver) == null) {
				driver = null;
			}
			rule.setDriver(driver);

			DeviceGroup group = null;
			if (rsRule.getGroup() != -1) {
				group = (DeviceGroup) session.load(DeviceGroup.class, rsRule.getGroup());
			}
			rule.setTargetGroup(group);

			rule.setFamily(rsRule.getFamily());
			rule.setFamilyRegExp(rsRule.isFamilyRegExp());
			rule.setVersion(rsRule.getVersion());
			rule.setVersionRegExp(rsRule.isVersionRegExp());
			rule.setPartNumber(rsRule.getPartNumber());
			rule.setPartNumberRegExp(rsRule.isPartNumberRegExp());
			rule.setPriority(rsRule.getPriority());
			rule.setLevel(rsRule.getLevel());

			session.update(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited", rule);
			return rule;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the rule.", e);
			throw new NetshotBadRequestException(
					"Unable to save the rule.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (WebApplicationException e) {
			session.getTransaction().rollback();
			throw e;
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsLightSoftwareLevelDevice.
	 */
	@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
	public static class RsLightSoftwareLevelDevice extends RsLightDevice {

		/** The software level. */
		private ConformanceLevel softwareLevel;

		/**
		 * Gets the software level.
		 *
		 * @return the software level
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public ConformanceLevel getSoftwareLevel() {
			return softwareLevel;
		}

		/**
		 * Sets the software level.
		 *
		 * @param level the new software level
		 */
		public void setSoftwareLevel(ConformanceLevel level) {
			this.softwareLevel = level;
		}
	}

	/**
	 * Gets the group devices by software level.
	 *
	 * @param request the request
	 * @param id the id
	 * @param level the level
	 * @return the group devices by software level
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/reports/groupdevicesbysoftwarelevel/{id}/{level}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the devices of a group based on software compliance level",
		description = "Returns the list of devices of a given group by ID, and matching the given software compliance level."
	)
	public List<RsLightSoftwareLevelDevice> getGroupDevicesBySoftwareLevel(@PathParam("id") Long id, @PathParam("level") String level,
			@QueryParam("domain") Set<Long> domains) throws WebApplicationException {
		logger.debug("REST request, group {} devices by software level {}.", id, level);
		Session session = Database.getSession();

		ConformanceLevel filterLevel = ConformanceLevel.UNKNOWN;
		for (ConformanceLevel l : ConformanceLevel.values()) {
			if (l.toString().equalsIgnoreCase(level)) {
				filterLevel = l;
				break;
			}
		}

		try {
			String domainFilter = "";
			if (domains.size() > 0) {
				domainFilter = " and d.mgmtDomain.id in (:domainIds)";
			}
			@SuppressWarnings("unchecked")
			Query<RsLightSoftwareLevelDevice> query =  session
				.createQuery(DEVICELIST_BASEQUERY + ", d.softwareLevel as softwareLevel "
						+ "from Device d join d.ownerGroups g where g.id = :id and d.softwareLevel = :level and d.status = :enabled" + domainFilter)
				.setParameter("id", id)
				.setParameter("level", filterLevel)
				.setParameter("enabled", Device.Status.INPRODUCTION);
			if (domains.size() > 0) {
				query.setParameterList("domainIds", domains);
			}
			@SuppressWarnings("deprecation")
			List<RsLightSoftwareLevelDevice> devices = query
				.setResultTransformer(Transformers.aliasToBean(RsLightSoftwareLevelDevice.class))
				.list();
			return devices;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the devices.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}
	
	/**
	 * The Class RsLightSoftwareLevelDevice.
	 */
	@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
	public static class RsLightAccessFailureDevice extends RsLightDevice {

		private Date lastSuccess;
		
		private Date lastFailure;

		@XmlElement
		@JsonView(DefaultView.class)
		public Date getLastSuccess() {
			return lastSuccess;
		}

		public void setLastSuccess(Date lastSuccess) {
			this.lastSuccess = lastSuccess;
		}

		@XmlElement
		@JsonView(DefaultView.class)
		public Date getLastFailure() {
			return lastFailure;
		}

		public void setLastFailure(Date lastFailure) {
			this.lastFailure = lastFailure;
		}
	}
	
	@GET
	@Path("/reports/accessfailuredevices")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the devices without successful snapshot over a given period",
		description = "Returns the list of devices which didn't have a successful snapshot over the given number of days, optionally "
			+ "filtered by device domain."
	)
	public List<RsLightAccessFailureDevice> getAccessFailureDevices(@QueryParam("days") Integer days, @QueryParam("domain") Set<Long> domains) throws WebApplicationException {
		logger.debug("REST request, devices without successful snapshot over the last {} days.", days);
		
		if (days == null || days < 1) {
			logger.warn("Invalid number of days {} to find the unreachable devices, using 3.", days);
			days = 3;
		}
		
		Session session = Database.getSession();

		try {
			Calendar when = Calendar.getInstance();
			when.add(Calendar.DATE, -days);
			
			String domainFilter = "";
			if (domains.size() > 0) {
				domainFilter = " and d.mgmtDomain.id in (:domainIds)";
			}
			
			@SuppressWarnings("unchecked")
			Query<RsLightAccessFailureDevice> query = session
				.createQuery(DEVICELIST_BASEQUERY + ", (select max(t.executionDate) from TakeSnapshotTask t where t.device = d and t.status = :success) as lastSuccess, "
						+ "(select max(t.executionDate) from TakeSnapshotTask t where t.device = d and t.status = :failure) as lastFailure from Device d where d.status = :enabled"
						+ domainFilter)
				.setParameter("success", Task.Status.SUCCESS)
				.setParameter("failure", Task.Status.FAILURE)
				.setParameter("enabled", Device.Status.INPRODUCTION);
			if (domainFilter.length() > 0) {
				query.setParameterList("domainIds", domains);
			}
			@SuppressWarnings("deprecation")
			List<RsLightAccessFailureDevice> devices = query
				.setResultTransformer(Transformers.aliasToBean(RsLightAccessFailureDevice.class))
				.list();
			Iterator<RsLightAccessFailureDevice> d = devices.iterator();
			while (d.hasNext()) {
				RsLightAccessFailureDevice device = d.next();
				if (device.getLastSuccess() != null && device.getLastSuccess().after(when.getTime())) {
					d.remove();
				}
			}
			return devices;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the devices.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsLogin.
	 */
	@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
	public static class RsLogin {

		/** The username. */
		private String username;

		/** The password. */
		private String password;

		/** The new password. */
		private String newPassword = "";

		/**
		 * Gets the username.
		 *
		 * @return the username
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getUsername() {
			return username;
		}

		/**
		 * Sets the username.
		 *
		 * @param username the new username
		 */
		public void setUsername(String username) {
			this.username = username;
		}

		/**
		 * Gets the password.
		 *
		 * @return the password
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getPassword() {
			return password;
		}

		/**
		 * Sets the password.
		 *
		 * @param password the new password
		 */
		public void setPassword(String password) {
			this.password = password;
		}

		/**
		 * Gets the new password.
		 *
		 * @return the new password
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getNewPassword() {
			return newPassword;
		}

		/**
		 * Sets the new password.
		 *
		 * @param newPassword the new new password
		 */
		public void setNewPassword(String newPassword) {
			this.newPassword = newPassword;
		}
	}

	/**
	 * Logout.
	 *
	 * @param request the request
	 * @return the boolean
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/user/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "User log out",
		description = "Terminates the current user session (useless when using API tokens)."
	)
	public void logout(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST logout request.");
		User sessionUser = (User) request.getSession().getAttribute("user");
		HttpSession httpSession = request.getSession();
		httpSession.invalidate();
		Netshot.aaaLogger.warn("User {} has logged out.", sessionUser.getUsername());
		this.suggestReturnCode(Response.Status.NO_CONTENT);
	}

	/**
	 * Sets the password.
	 *
	 * @param request the request
	 * @param rsLogin the rs login
	 * @return the user
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/user/{id}")
	@RolesAllowed("readonly")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update a user",
		description = "Edits a given user, by ID, especially the password for a local user."
	)
	public UiUser setPassword(RsLogin rsLogin) throws WebApplicationException {
		logger.debug("REST password change request, username {}.", rsLogin.getUsername());
		User currentUser = (User) request.getAttribute("user");
		Netshot.aaaLogger.warn("Password change request via REST by user {} for user {}.", currentUser.getUsername(), rsLogin.getUsername());

		UiUser user;
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			user = (UiUser) session.bySimpleNaturalId(UiUser.class).load(rsLogin.getUsername());
			if (user == null || !user.getUsername().equals(currentUser.getUsername()) || !user.isLocal()) {
				throw new NetshotBadRequestException("Invalid user.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_USER);
			}

			if (!user.checkPassword(rsLogin.getPassword())) {
				throw new NetshotBadRequestException("Invalid current password.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_USER);
			}

			String newPassword = rsLogin.getNewPassword();
			if (newPassword.equals("")) {
				throw new NetshotBadRequestException("The password cannot be empty.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_USER);
			}

			user.setPassword(newPassword);
			session.save(user);
			session.getTransaction().commit();
			Netshot.aaaLogger.warn("Password successfully changed by user {} for user {}.", currentUser.getUsername(), rsLogin.getUsername());
			return user;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to retrieve the user {}.", rsLogin.getUsername(), e);
			throw new NetshotBadRequestException("Unable to retrieve the user.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Login.
	 *
	 * @param request the request
	 * @param rsLogin the rs login
	 * @return the user
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@PermitAll
	@Path("/user")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Log in",
		description = "Logs in (create session) by username and password (useless when using API tokens)."
	)
	public UiUser login(RsLogin rsLogin) throws WebApplicationException {
		logger.debug("REST authentication request, username {}.", rsLogin.getUsername());
		Netshot.aaaLogger.info("REST authentication request, username {}.", rsLogin.getUsername());

		UiUser user = null;

		Session session = Database.getSession();
		try {
			user = (UiUser) session.bySimpleNaturalId(UiUser.class).load(rsLogin.getUsername());
		}
		catch (HibernateException e) {
			logger.error("Unable to retrieve the user {}.", rsLogin.getUsername(), e);
			throw new NetshotBadRequestException("Unable to retrieve the user.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}

		if (user != null && user.isLocal()) {
			if (user.checkPassword(rsLogin.getPassword())) {
				Netshot.aaaLogger.info("Local authentication success for user {}.", rsLogin.getUsername());
			}
			else {
				Netshot.aaaLogger.warn("Local authentication failure for user {}.", rsLogin.getUsername());
				user = null;
			}
		}
		else {
			UiUser remoteUser = Radius.authenticate(rsLogin.getUsername(), rsLogin.getPassword());
			if (remoteUser != null && user != null) {
				remoteUser.setLevel(user.getLevel());
				Netshot.aaaLogger.info("Remote authentication success for user {}.", rsLogin.getUsername());
			}
			else {
				Netshot.aaaLogger.warn("Remote authentication failure for user {}.", rsLogin.getUsername());
			}
			user = remoteUser;
		}
		if (user == null) {
			HttpSession httpSession = request.getSession();
			httpSession.invalidate();
		}
		else {
			HttpSession httpSession = request.getSession();
			httpSession.setAttribute("user", user);
			return user;
		}
		throw new NetshotAuthenticationRequiredException();
	}

	/**
	 * Gets the user.
	 *
	 * @param request the request
	 * @return the user
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@RolesAllowed("readonly")
	@Path("/user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the current user",
		description = "Returns the current logged in user."
	)
	public User getUser(@Context HttpServletRequest request) throws WebApplicationException {
		User user = (User) request.getAttribute("user");
		return user;
	}

	/**
	 * Gets the users.
	 *
	 * @param request the request
	 * @return the users
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/users")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the users",
		description = "Returns the list of Netshot users."
	)
	public List<UiUser> getUsers() throws WebApplicationException {
		logger.debug("REST request, get user list.");
		Session session = Database.getSession();
		try {
			List<UiUser> users = session.createQuery("from onl.netfishers.netshot.aaa.UiUser", UiUser.class).list();
			return users;
		}
		catch (HibernateException e) {
			logger.error("Unable to retrieve the users.", e);
			throw new NetshotBadRequestException("Unable to retrieve the users.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsUser.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsUser {

		/** The id. */
		private long id;

		/** The username. */
		private String username;

		/** The password. */
		private String password;

		/** The level. */
		private int level;

		/** The local. */
		private boolean local;

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Gets the username.
		 *
		 * @return the username
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getUsername() {
			return username;
		}

		/**
		 * Sets the username.
		 *
		 * @param username the new username
		 */
		public void setUsername(String username) {
			this.username = username;
		}

		/**
		 * Gets the password.
		 *
		 * @return the password
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getPassword() {
			return password;
		}

		/**
		 * Sets the password.
		 *
		 * @param password the new password
		 */
		public void setPassword(String password) {
			this.password = password;
		}

		/**
		 * Gets the level.
		 *
		 * @return the level
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public int getLevel() {
			return level;
		}

		/**
		 * Sets the level.
		 *
		 * @param level the new level
		 */
		public void setLevel(int level) {
			this.level = level;
		}

		/**
		 * Checks if is local.
		 *
		 * @return true, if is local
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isLocal() {
			return local;
		}

		/**
		 * Sets the local.
		 *
		 * @param local the new local
		 */
		public void setLocal(boolean local) {
			this.local = local;
		}
	}

	/**
	 * Adds the user.
	 *
	 * @param request the request
	 * @param rsUser the rs user
	 * @return the user
	 */
	@POST
	@Path("/users")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a user to Netshot",
		description = "Create a Netshot user."
	)
	public UiUser addUser(RsUser rsUser) {
		logger.debug("REST request, add user");

		String username = rsUser.getUsername();
		if (username == null || username.trim().isEmpty()) {
			logger.warn("User posted an empty user name.");
			throw new NetshotBadRequestException("Invalid user name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_USER_NAME);
		}
		username = username.trim();

		String password = rsUser.getPassword();
		if (rsUser.isLocal()) {
			if (password == null || password.equals("")) {
				logger.warn("User tries to create a local account without password.");
				throw new NetshotBadRequestException("Please set a password.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_PASSWORD);
			}
		}
		else {
			password = "";
		}

		UiUser user = new UiUser(username, rsUser.isLocal(), password);
		user.setLevel(rsUser.level);

		Session session = Database.getSession();
		try {
			session.beginTransaction();
			session.save(user);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created", user);
			this.suggestReturnCode(Response.Status.CREATED);
			return user;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new user.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A user with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_USER);
			}
			throw new NetshotBadRequestException(
					"Unable to add the user to the database",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}


	/**
	 * Sets the user.
	 *
	 * @param request the request
	 * @param id the id
	 * @param rsUser the rs user
	 * @return the user
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/users/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update a Netshot user",
		description = "Edits a Netshot user, by ID."
	)
	public UiUser setUser(@PathParam("id") Long id, RsUser rsUser)
			throws WebApplicationException {
		logger.debug("REST request, edit user {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			UiUser user = (UiUser) session.get(UiUser.class, id);
			if (user == null) {
				logger.error("Unable to find the user {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this user.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_USER);
			}

			String username = rsUser.getUsername();
			if (username == null || username.trim().isEmpty()) {
				logger.warn("User posted an empty user name.");
				throw new NetshotBadRequestException("Invalid user name.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_USER_NAME);
			}
			username = username.trim();
			user.setUsername(username);

			user.setLevel(rsUser.getLevel());
			if (rsUser.isLocal()) {
				if (rsUser.getPassword() != null && !rsUser.getPassword().equals("-")) {
					user.setPassword(rsUser.getPassword());
				}
				if (user.getHashedPassword().equals("")) {
					logger.error("The password cannot be empty for user {}.", id);
					throw new NetshotBadRequestException("You must set a password.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_PASSWORD);
				}
			}
			else {
				user.setPassword("");
			}
			user.setLocal(rsUser.isLocal());
			session.update(user);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited", user);
			return user;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to save the user {}.", id, e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A user with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_USER);
			}
			throw new NetshotBadRequestException("Unable to save the user.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (WebApplicationException e) {
			session.getTransaction().rollback();
			throw e;
		}
		finally {
			session.close();
		}
	}

	/**
	 * Delete user.
	 *
	 * @param request the request
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/users/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove a Netshot user.",
		description = "Removes a user from the Netshot database."
	)
	public void deleteUser(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete user {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			UiUser user = (UiUser) session.load(UiUser.class, id);
			session.delete(user);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted", user);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The user doesn't exist.");
			throw new NetshotBadRequestException("The user doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_USER);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			throw new NetshotBadRequestException("Unable to delete the user.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}


	/**
	 * The Class RsApiToken.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsApiToken {

		/** The id. */
		private long id;

		/** The description. */
		private String description;

		/** The token. */
		private String token;

		/** The level. */
		private int level;

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Gets the description.
		 *
		 * @return the description
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getDescription() {
			return description;
		}

		/**
		 * Sets the description.
		 *
		 * @param description the new description
		 */
		public void setDescription(String description) {
			this.description = description;
		}

		/**
		 * Gets the token.
		 *
		 * @return the token
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getToken() {
			return token;
		}

		/**
		 * Sets the token.
		 *
		 * @param token the new token
		 */
		public void setToken(String token) {
			this.token = token;
		}

		/**
		 * Gets the level.
		 *
		 * @return the level
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public int getLevel() {
			return level;
		}

		/**
		 * Sets the level.
		 *
		 * @param level the new level
		 */
		public void setLevel(int level) {
			this.level = level;
		}
	}

	/**
	 * Adds the API token.
	 *
	 * @param request the request
	 * @param rsAPiToken the rs API token
	 * @return the API token
	 */
	@POST
	@Path("/apitokens")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a new API token",
		description = "Creates a new API token."
	)
	public ApiToken addApiToken(RsApiToken rsApiToken) {
		logger.debug("REST request, add API token");

		String description = rsApiToken.getDescription();
		if (description == null || description.trim().isEmpty()) {
			description = "";
		}
		description = description.trim();

		String token = rsApiToken.getToken();
		if (!ApiToken.isValidToken(token)) {
			logger.warn("The passed token is not valid");
			throw new NetshotBadRequestException("Invalid token format.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_API_TOKEN_FORMAT);
		}

		ApiToken apiToken = new ApiToken(description, token, rsApiToken.getLevel());

		Session session = Database.getSession();
		try {
			session.beginTransaction();
			session.save(apiToken);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created", apiToken);
			this.suggestReturnCode(Response.Status.CREATED);
			return apiToken;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new API token.", e);
			throw new NetshotBadRequestException(
					"Unable to add the API token to the database",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the API tokens.
	 *
	 * @return the API tokens
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/apitokens")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the API tokens",
		description = "Returns the list of API tokens."
	)
	public List<ApiToken> getApiTokens() throws WebApplicationException {
		logger.debug("REST request, get API token list.");
		Session session = Database.getSession();
		try {
			List<ApiToken> apiTokens = session.createQuery("from ApiToken", ApiToken.class).list();
			return apiTokens;
		}
		catch (HibernateException e) {
			logger.error("Unable to retrieve the API tokens.", e);
			throw new NetshotBadRequestException("Unable to retrieve the API tokens.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Delete API token.
	 *
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/apitokens/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove an API token",
		description = "Removes an API token, by ID."
	)
	public void deleteApiToken(@PathParam("id") Long id) throws WebApplicationException {
		logger.debug("REST request, delete API token {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			ApiToken apiToken = (ApiToken) session.load(ApiToken.class, id);
			session.delete(apiToken);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted", apiToken);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The API token doesn't exist.");
			throw new NetshotBadRequestException("The API token doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_USER);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			throw new NetshotBadRequestException("Unable to delete the API token.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}



	@GET
	@Path("/reports/export")
	@RolesAllowed("readonly")
	@Produces({ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
	@Operation(
		summary = "Export data",
		description = "Exports data as Excel datasheet. The devices can be filtered by groups or domains. " +
			"The report can be customized to include or not interfaces, inventory, locations, compliance, groups. " +
			"The only supported and default output format is xlsx (Excel file)."
	)
	public Response getDataXLSX(@Context HttpServletRequest request,
			@QueryParam("group") Set<Long> groups,
			@QueryParam("domain") Set<Long> domains,
			@DefaultValue("false") @QueryParam("interfaces") boolean exportInterfaces,
			@DefaultValue("false") @QueryParam("inventory") boolean exportInventory,
			@DefaultValue("false") @QueryParam("locations") boolean exportLocations,
			@DefaultValue("false") @QueryParam("compliance") boolean exportCompliance,
			@DefaultValue("false") @QueryParam("groups") boolean exportGroups,
			@DefaultValue("xlsx") @QueryParam("format") String fileFormat) throws WebApplicationException {
		logger.debug("REST request, export data.");
		User user = (User) request.getAttribute("user");

		if (fileFormat.compareToIgnoreCase("xlsx") == 0) {
			String fileName = String.format("netshot-export_%s.xlsx", (new SimpleDateFormat("yyyyMMdd-HHmmss")).format(new Date()));

			Session session = Database.getSession();
			try {
				Workbook workBook = new SXSSFWorkbook(100);
				Row row;
				Cell cell;

				CreationHelper createHelper = workBook.getCreationHelper();
				CellStyle datetimeCellStyle = workBook.createCellStyle();
				datetimeCellStyle.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-mm-dd hh:mm"));
				datetimeCellStyle.setAlignment(HorizontalAlignment.LEFT);
				CellStyle dateCellStyle = workBook.createCellStyle();
				dateCellStyle.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-mm-dd"));
				CellStyle titleCellStyle = workBook.createCellStyle();
				Font titleFont = workBook.createFont();
				titleFont.setBold(true);
				titleCellStyle.setFont(titleFont);
				CellStyle percentCellStyle = workBook.createCellStyle();
				percentCellStyle.setDataFormat(workBook.createDataFormat()
						.getFormat(BuiltinFormats.getBuiltinFormat(0x09)));

				Sheet summarySheet = workBook.createSheet("Summary");
				summarySheet.setColumnWidth(0, 5000);
				summarySheet.setColumnWidth(1, 8000);

				{
					int y = -1;
					row = summarySheet.createRow(++y);
					row.createCell(0).setCellValue("Netshot version");
					row.getCell(0).setCellStyle(titleCellStyle);
					row.createCell(1).setCellValue(Netshot.VERSION);
					row = summarySheet.createRow(++y);
					row.createCell(0).setCellValue("Exported by");
					row.getCell(0).setCellStyle(titleCellStyle);
					row.createCell(1).setCellValue(user.getName());
					row = summarySheet.createRow(++y);
					row.createCell(0).setCellValue("Date and time");
					row.getCell(0).setCellStyle(titleCellStyle);
					cell = row.createCell(1);
					cell.setCellValue(new Date());
					cell.setCellStyle(datetimeCellStyle);
					
					row = summarySheet.createRow(++y);
					row.createCell(0).setCellValue("Selected Domain");
					row.getCell(0).setCellStyle(titleCellStyle);
					if (domains.size() == 0) {
						row.createCell(1).setCellValue("Any");
					}
					else {
						List<Domain> deviceDomains = session
							.createQuery("select d from Domain d where d.id in (:domainIds)", Domain.class)
							.setParameterList("domainIds", domains)
							.list();
						List<String> domainNames = new ArrayList<String>();
						for (Domain deviceDomain : deviceDomains) {
							domainNames.add(String.format("%s (%d)", deviceDomain.getName(), deviceDomain.getId()));
						}
						row.createCell(1).setCellValue(String.join(", ", domainNames));
					}
					row = summarySheet.createRow(++y);
					row.createCell(0).setCellValue("Selected Group");
					row.getCell(0).setCellStyle(titleCellStyle);
					if (groups.size() == 0) {
						row.createCell(1).setCellValue("Any");
					}
					else {
						List<DeviceGroup> deviceGroups = session
							.createQuery("select g from DeviceGroup g where g.id in (:groupIds)", DeviceGroup.class)
							.setParameterList("groupIds", groups)
							.list();
						List<String> groupNames = new ArrayList<String>();
						for (DeviceGroup group : deviceGroups) {
							groupNames.add(String.format("%s (%d)", group.getName(), group.getId()));
						}
						row.createCell(1).setCellValue(String.join(", ", groupNames));
					}
					summarySheet.setDefaultColumnStyle(0, titleCellStyle);
				}

				{
					StringBuffer deviceHqlQuery = new StringBuffer(
							"select d from Device d left join d.ownerGroups g left join fetch d.mgmtDomain " +
							"where 1 = 1");
					if (domains.size() > 0) {
						deviceHqlQuery.append(" and d.mgmtDomain.id in (:domainIds)");
					}
					if (groups.size() > 0) {
						deviceHqlQuery.append(" and g.id in (:groupIds)");
					}
					deviceHqlQuery.append(" order by d.name asc");
					Query<Device> deviceQuery = session.createQuery(deviceHqlQuery.toString(), Device.class);
					if (domains.size() > 0) {
						deviceQuery.setParameterList("domainIds", domains);
					}
					if (groups.size() > 0) {
						deviceQuery.setParameterList("groupIds", groups);
					}
					deviceQuery.setMaxResults(PAGINATION_SIZE);

					Sheet deviceSheet = workBook.createSheet("Devices");
					((SXSSFSheet) deviceSheet).setRandomAccessWindowSize(100);
					int y = -1;
					{
						row = deviceSheet.createRow(++y);
						int x = -1;
						row.createCell(++x).setCellValue("ID");
						row.getCell(x).setCellStyle(titleCellStyle);
						deviceSheet.setColumnWidth(x, 2200);
						row.createCell(++x).setCellValue("Name");
						row.getCell(x).setCellStyle(titleCellStyle);
						deviceSheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("Management IP");
						row.getCell(x).setCellStyle(titleCellStyle);
						deviceSheet.setColumnWidth(x, 4000);
						row.createCell(++x).setCellValue("Domain");
						row.getCell(x).setCellStyle(titleCellStyle);
						deviceSheet.setColumnWidth(x, 4000);
						row.createCell(++x).setCellValue("Network Class");
						row.getCell(x).setCellStyle(titleCellStyle);
						deviceSheet.setColumnWidth(x, 4000);
						row.createCell(++x).setCellValue("Family");
						row.getCell(x).setCellStyle(titleCellStyle);
						deviceSheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("Creation");
						row.getCell(x).setCellStyle(titleCellStyle);
						deviceSheet.setColumnWidth(x, 4200);
						row.createCell(++x).setCellValue("Last Change");
						row.getCell(x).setCellStyle(titleCellStyle);
						deviceSheet.setColumnWidth(x, 4200);
						row.createCell(++x).setCellValue("Software");
						row.getCell(x).setCellStyle(titleCellStyle);
						deviceSheet.setColumnWidth(x, 5000);
						if (exportCompliance) {
							row.createCell(++x).setCellValue("Software Level");
							row.getCell(x).setCellStyle(titleCellStyle);
							deviceSheet.setColumnWidth(x, 3500);
							row.createCell(++x).setCellValue("End of Sale Date");
							row.getCell(x).setCellStyle(titleCellStyle);
							deviceSheet.setColumnWidth(x, 4200);
							row.createCell(++x).setCellValue("End Of Life Date");
							row.getCell(x).setCellStyle(titleCellStyle);
							deviceSheet.setColumnWidth(x, 4200);
						}
						if (exportLocations) {
							row.createCell(++x).setCellValue("Location");
							row.getCell(x).setCellStyle(titleCellStyle);
							deviceSheet.setColumnWidth(x, 5000);
							row.createCell(++x).setCellValue("Contact");
							row.getCell(x).setCellStyle(titleCellStyle);
							deviceSheet.setColumnWidth(x, 5000);
						}
						row.setRowStyle(titleCellStyle);
						deviceSheet.createFreezePane(0, y + 1);
						deviceSheet.setAutoFilter(new CellRangeAddress(0, y, 0, x));
					}

					for (int n = 0; true; n += PAGINATION_SIZE) {
						List<Device> devices = deviceQuery.setFirstResult(n).list();
						for (Device device : devices) {
							int x = -1;
							row = deviceSheet.createRow(++y);
							row.createCell(++x).setCellValue(device.getId());
							row.createCell(++x).setCellValue(device.getName());
							row.createCell(++x).setCellValue(device.getMgmtAddress().getIp());
							row.createCell(++x).setCellValue(device.getMgmtDomain().getName());
							row.createCell(++x).setCellValue(device.getNetworkClass().toString());
							row.createCell(++x).setCellValue(device.getFamily());
							cell = row.createCell(++x);
							cell.setCellValue(device.getCreatedDate());
							cell.setCellStyle(datetimeCellStyle);
							cell = row.createCell(++x);
							cell.setCellValue(device.getChangeDate());
							cell.setCellStyle(datetimeCellStyle);
							row.createCell(++x).setCellValue(device.getSoftwareVersion());
							if (exportCompliance) {
								row.createCell(++x).setCellValue((device.getSoftwareLevel() == null ?
										ConformanceLevel.UNKNOWN : device.getSoftwareLevel()).toString());
								if (device.getEosDate() != null) {
									cell = row.createCell(++x);
									cell.setCellValue(device.getEosDate());
									cell.setCellStyle(dateCellStyle);
								}
								if (device.getEolDate() != null) {
									cell = row.createCell(++x);
									cell.setCellValue(device.getEolDate());
									cell.setCellStyle(dateCellStyle);
								}
							}
							if (exportLocations) {
								row.createCell(++x).setCellValue(device.getLocation());
								row.createCell(++x).setCellValue(device.getContact());
							}
						}
						if (devices.size() < PAGINATION_SIZE) {
							break;
						}
					}
				}
	
				if (exportInterfaces) {
					logger.debug("Exporting interface data");
					StringBuffer interfaceHqlQuery = new StringBuffer(
							"select ni from NetworkInterface ni " +
							"left join fetch ni.ip4Addresses left join fetch ni.ip6Addresses " +
							"join fetch ni.device left join ni.device.ownerGroups g where 1 = 1");
					if (domains.size() > 0) {
						interfaceHqlQuery.append(" and ni.device.mgmtDomain.id in (:domainIds)");
					}
					if (groups.size() > 0) {
						interfaceHqlQuery.append(" and g.id in (:groupIds)");
					}
					interfaceHqlQuery.append(" order by ni.device.name asc, ni.id asc");
					Query<NetworkInterface> interfaceQuery = session.createQuery(interfaceHqlQuery.toString(),
							NetworkInterface.class);
					if (domains.size() > 0) {
						interfaceQuery.setParameterList("domainIds", domains);
					}
					if (groups.size() > 0) {
						interfaceQuery.setParameterList("groupIds", groups);
					}
					
					Sheet interfaceSheet = workBook.createSheet("Interfaces");
					((SXSSFSheet) interfaceSheet).setRandomAccessWindowSize(100);
					int y = -1;
					{
						row = interfaceSheet.createRow(++y);
						int x = -1;
						row.createCell(++x).setCellValue("Device ID");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 2200);
						row.createCell(++x).setCellValue("Device Name");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("Virtual Device");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("Name");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("Description");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 7000);
						row.createCell(++x).setCellValue("VRF");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("MAC Address");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 4000);
						row.createCell(++x).setCellValue("Enabled");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 2000);
						row.createCell(++x).setCellValue("Level 3");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 2000);
						row.createCell(++x).setCellValue("IP Address");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 4000);
						row.createCell(++x).setCellValue("Length");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 2000);
						row.createCell(++x).setCellValue("Usage");
						row.getCell(x).setCellStyle(titleCellStyle);
						interfaceSheet.setColumnWidth(x, 4000);
						row.setRowStyle(titleCellStyle);
						interfaceSheet.createFreezePane(0, y + 1);
						interfaceSheet.setAutoFilter(new CellRangeAddress(0, y, 0, x));
					}

					List<NetworkInterface> networkInterfaces = interfaceQuery.list();
					for (NetworkInterface networkInterface : networkInterfaces) {
						Device device = networkInterface.getDevice();
						if (networkInterface.getIpAddresses().size() == 0) {
							row = interfaceSheet.createRow(++y);
							int x = -1;
							row.createCell(++x).setCellValue(device.getId());
							row.createCell(++x).setCellValue(device.getName());
							row.createCell(++x).setCellValue(networkInterface.getVirtualDevice());
							row.createCell(++x).setCellValue(networkInterface.getInterfaceName());
							row.createCell(++x).setCellValue(networkInterface.getDescription());
							row.createCell(++x).setCellValue(networkInterface.getVrfInstance());
							row.createCell(++x).setCellValue(networkInterface.getMacAddress());
							row.createCell(++x).setCellValue(networkInterface.isEnabled());
							row.createCell(++x).setCellValue(networkInterface.isLevel3());
							row.createCell(++x).setCellValue("");
							row.createCell(++x).setCellValue("");
							row.createCell(++x).setCellValue("");
						}
						for (NetworkAddress address : networkInterface.getIpAddresses()) {
							row = interfaceSheet.createRow(++y);
							int x = -1;
							row.createCell(++x).setCellValue(device.getId());
							row.createCell(++x).setCellValue(device.getName());
							row.createCell(++x).setCellValue(networkInterface.getVirtualDevice());
							row.createCell(++x).setCellValue(networkInterface.getInterfaceName());
							row.createCell(++x).setCellValue(networkInterface.getDescription());
							row.createCell(++x).setCellValue(networkInterface.getVrfInstance());
							row.createCell(++x).setCellValue(networkInterface.getMacAddress());
							row.createCell(++x).setCellValue(networkInterface.isEnabled());
							row.createCell(++x).setCellValue(networkInterface.isLevel3());
							row.createCell(++x).setCellValue(address.getIp());
							row.createCell(++x).setCellValue(address.getPrefixLength());
							row.createCell(++x).setCellValue(address.getAddressUsage() == null ? "" : address.getAddressUsage().toString());
						}
					}
					session.clear();
				}
	
				if (exportInventory) {
					logger.debug("Exporting device inventory");
					StringBuffer moduleHqlQuery = new StringBuffer(
							"select m from Module m join fetch m.device left join m.device.ownerGroups g where 1 = 1");
					if (domains.size() > 0) {
						moduleHqlQuery.append(" and m.device.mgmtDomain.id in (:domainIds)");
					}
					if (groups.size() > 0) {
						moduleHqlQuery.append(" and g.id in (:groupIds)");
					}
					moduleHqlQuery.append(" order by m.device.name asc, m.id asc");
					Query<Module> moduleQuery = session.createQuery(moduleHqlQuery.toString(), Module.class);
					if (domains.size() > 0) {
						moduleQuery.setParameterList("domainIds", domains);
					}
					if (groups.size() > 0) {
						moduleQuery.setParameterList("groupIds", groups);
					}
					moduleQuery.setMaxResults(PAGINATION_SIZE);

					Sheet inventorySheet = workBook.createSheet("Inventory");
					((SXSSFSheet) inventorySheet).setRandomAccessWindowSize(100);
					int y = -1;
					{
						row = inventorySheet.createRow(++y);
						int x = -1;
						row.createCell(++x).setCellValue("Device ID");
						row.getCell(x).setCellStyle(titleCellStyle);
						inventorySheet.setColumnWidth(x, 2200);
						row.createCell(++x).setCellValue("Device Name");
						row.getCell(x).setCellStyle(titleCellStyle);
						inventorySheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("Slot");
						row.getCell(x).setCellStyle(titleCellStyle);
						inventorySheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("Part Number");
						row.getCell(x).setCellStyle(titleCellStyle);
						inventorySheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("Serial Number");
						row.getCell(x).setCellStyle(titleCellStyle);
						inventorySheet.setColumnWidth(x, 4000);
						row.setRowStyle(titleCellStyle);
						inventorySheet.createFreezePane(0, y + 1);
						inventorySheet.setAutoFilter(new CellRangeAddress(0, y, 0, x));
					}
					for (int n = 0; true; n += PAGINATION_SIZE) {
						List<Module> modules = moduleQuery.setFirstResult(n).list();
						for (Module module : modules) {
							Device device = module.getDevice();
							int x = -1;
							row = inventorySheet.createRow(++y);
							row.createCell(++x).setCellValue(device.getId());
							row.createCell(++x).setCellValue(device.getName());
							row.createCell(++x).setCellValue(module.getSlot());
							row.createCell(++x).setCellValue(module.getPartNumber());
							row.createCell(++x).setCellValue(module.getSerialNumber());
						}
						session.clear();
						if (modules.size() < PAGINATION_SIZE) {
							break;
						}
					}
				}
					
				if (exportCompliance) {
					logger.debug("Exporting compliance data");
					List<RsLightPolicyRuleDevice> checkResults = getConfigComplianceDeviceStatuses(domains, groups,
							new HashSet<Long>(), new HashSet<CheckResult.ResultOption>(
									Arrays.asList(new CheckResult.ResultOption[] { CheckResult.ResultOption.CONFORMING,
											CheckResult.ResultOption.NONCONFORMING, CheckResult.ResultOption.EXEMPTED })));

					Sheet complianceSheet = workBook.createSheet("Configuration Compliance");
					((SXSSFSheet) complianceSheet).setRandomAccessWindowSize(100);
					int y = -1;
					{
						row = complianceSheet.createRow(++y);
						int x = -1;
						row.createCell(++x).setCellValue("Device ID");
						row.getCell(x).setCellStyle(titleCellStyle);
						complianceSheet.setColumnWidth(x, 2200);
						row.createCell(++x).setCellValue("Device Name");
						row.getCell(x).setCellStyle(titleCellStyle);
						complianceSheet.setColumnWidth(x, 5000);

						row.createCell(++x).setCellValue("Policy");
						row.getCell(x).setCellStyle(titleCellStyle);
						complianceSheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("Rule");
						row.getCell(x).setCellStyle(titleCellStyle);
						complianceSheet.setColumnWidth(x, 8000);
						row.createCell(++x).setCellValue("Check Date");
						row.getCell(x).setCellStyle(titleCellStyle);
						complianceSheet.setColumnWidth(x, 4200);
						row.createCell(++x).setCellValue("Result");
						row.getCell(x).setCellStyle(titleCellStyle);
						complianceSheet.setColumnWidth(x, 4000);		
						row.setRowStyle(titleCellStyle);
						complianceSheet.createFreezePane(0, y + 1);
						complianceSheet.setAutoFilter(new CellRangeAddress(0, y, 0, x));				
					}

					for (RsLightPolicyRuleDevice checkResult : checkResults) {
						int x = -1;
						row = complianceSheet.createRow(++y);
						row.createCell(++x).setCellValue(checkResult.getId());
						row.createCell(++x).setCellValue(checkResult.getName());
						row.createCell(++x).setCellValue(checkResult.getPolicyName());
						row.createCell(++x).setCellValue(checkResult.getRuleName());
						row.createCell(++x).setCellValue(checkResult.getCheckDate());
						row.getCell(x).setCellStyle(datetimeCellStyle);
						row.createCell(++x).setCellValue(checkResult.getResult().toString());
					}
					session.clear();
				}
				
				if (exportGroups) {
					{
						logger.debug("Exporting group data");
						List<RsGroupConfigComplianceStat> groupConfigComplianceStats =
								this.getGroupConfigComplianceStats(domains, groups, new HashSet<>());
						
						Sheet groupSheet = workBook.createSheet("Device Groups");
						((SXSSFSheet) groupSheet).setRandomAccessWindowSize(100);
						int y = -1;
						{
							row = groupSheet.createRow(++y);
							int x = -1;
							row.createCell(++x).setCellValue("Group ID");
							row.getCell(x).setCellStyle(titleCellStyle);
							groupSheet.setColumnWidth(x, 2200);
							row.createCell(++x).setCellValue("Group Name");
							row.getCell(x).setCellStyle(titleCellStyle);
							groupSheet.setColumnWidth(x, 5000);
							row.createCell(++x).setCellValue("Folder");
							row.getCell(x).setCellStyle(titleCellStyle);
							groupSheet.setColumnWidth(x, 8000);
							row.createCell(++x).setCellValue("Device Count");
							row.getCell(x).setCellStyle(titleCellStyle);
							groupSheet.setColumnWidth(x, 4000);
							if (exportCompliance) {
								row.createCell(++x).setCellValue("Config Compliant Count");
								row.getCell(x).setCellStyle(titleCellStyle);
								groupSheet.setColumnWidth(x, 6000);
								row.createCell(++x).setCellValue("Config Compliance");
								row.getCell(x).setCellStyle(titleCellStyle);
								groupSheet.setColumnWidth(x, 5000);
							}
							groupSheet.createFreezePane(0, y + 1);
							groupSheet.setAutoFilter(new CellRangeAddress(0, y, 0, x));	
						}
						
						for (RsGroupConfigComplianceStat stat : groupConfigComplianceStats) {
							row = groupSheet.createRow(++y);
							int x = -1;
							row.createCell(++x).setCellValue(stat.getGroupId());
							row.createCell(++x).setCellValue(stat.getGroupName());
							row.createCell(++x).setCellValue(stat.getGroupFolder());
							row.createCell(++x).setCellValue(stat.getDeviceCount());
							if (exportCompliance) {
								row.createCell(++x).setCellValue(stat.getCompliantDeviceCount());
								row.createCell(++x).setCellFormula(String.format("%s%d / %s%d",
										CellReference.convertNumToColString(x - 1), y + 1,
										CellReference.convertNumToColString(x - 2), y + 1));
								row.getCell(x).setCellStyle(percentCellStyle);
							}
						}
						session.clear();
					}
					{
						logger.debug("Exporting group memberships");
						StringBuffer deviceHqlQuery = new StringBuffer(
								"select d from Device d left join d.ownerGroups g left join d.mgmtDomain " +
								"where 1 = 1");
						if (domains.size() > 0) {
							deviceHqlQuery.append(" and d.mgmtDomain.id in (:domainIds)");
						}
						if (groups.size() > 0) {
							deviceHqlQuery.append(" and g.id in (:groupIds)");
						}
						deviceHqlQuery.append(" order by d.name asc");
						Query<Device> deviceQuery = session.createQuery(deviceHqlQuery.toString(), Device.class);
						if (domains.size() > 0) {
							deviceQuery.setParameterList("domainIds", domains);
						}
						if (groups.size() > 0) {
							deviceQuery.setParameterList("groupIds", groups);
						}
						deviceQuery.setMaxResults(PAGINATION_SIZE);
						
						Sheet groupSheet = workBook.createSheet("Group Memberships");
						((SXSSFSheet) groupSheet).setRandomAccessWindowSize(100);
						int y = -1;
						{
							row = groupSheet.createRow(++y);
							int x = -1;
							row.createCell(++x).setCellValue("Device ID");
							row.getCell(x).setCellStyle(titleCellStyle);
							groupSheet.setColumnWidth(x, 2200);
							row.createCell(++x).setCellValue("Device Name");
							row.getCell(x).setCellStyle(titleCellStyle);
							groupSheet.setColumnWidth(x, 5000);
							row.createCell(++x).setCellValue("Group ID");
							row.getCell(x).setCellStyle(titleCellStyle);
							groupSheet.setColumnWidth(x, 2200);
							row.createCell(++x).setCellValue("Group Name");
							row.getCell(x).setCellStyle(titleCellStyle);
							groupSheet.setColumnWidth(x, 5000);
							groupSheet.createFreezePane(0, y + 1);
							groupSheet.setAutoFilter(new CellRangeAddress(0, y, 0, x));	
						}
						
						for (int n = 0; true; n += PAGINATION_SIZE) {
							List<Device> devices = deviceQuery.setFirstResult(n).list();
							for (Device device : devices) {
								for (DeviceGroup group : device.getOwnerGroups()) {
									if (group.isHiddenFromReports()) {
										continue;
									}
									row = groupSheet.createRow(++y);
									int x = -1;
									row.createCell(++x).setCellValue(device.getId());
									row.createCell(++x).setCellValue(device.getName());
									row.createCell(++x).setCellValue(group.getId());
									row.createCell(++x).setCellValue(group.getName());
								}
							}
							session.clear();
							if (devices.size() < PAGINATION_SIZE) {
								break;
							}
						}
					}
					
				}

				ByteArrayOutputStream output = new ByteArrayOutputStream();
				workBook.write(output);
				workBook.close();
				return Response.ok(output.toByteArray()).header("Content-Disposition", "attachment; filename=" + fileName).build();
			}
			catch (IOException e) {
				logger.error("Unable to write the resulting file.", e);
				throw new WebApplicationException(
						"Unable to write the resulting file.",
						javax.ws.rs.core.Response.Status.INTERNAL_SERVER_ERROR);
			}
			catch (Exception e) {
				logger.error("Unable to generate the report.", e);
				throw new WebApplicationException("Unable to generate the report.",
						javax.ws.rs.core.Response.Status.INTERNAL_SERVER_ERROR);
			}
			finally {
				session.close();
			}
		}

		logger.warn("Invalid requested file format.");
		throw new WebApplicationException(
				"The requested file format is invalid or not supported.",
				javax.ws.rs.core.Response.Status.BAD_REQUEST);

	}
	
	@POST
	@Path("/scripts")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a command script",
		description = "Create a command script (script to be later run over devices)."
	)
	public DeviceJsScript addScript(DeviceJsScript rsScript) throws WebApplicationException {
		logger.debug("REST request, add device script.");
		DeviceDriver driver = DeviceDriver.getDriverByName(rsScript.getDeviceDriver());
		if (driver == null) {
			logger.warn("Invalid driver name.");
			throw new NetshotBadRequestException("Invalid driver name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
		}
		if (rsScript.getName() == null || rsScript.getName().trim().equals("")) {
			logger.warn("Invalid script name.");
			throw new NetshotBadRequestException("Invalid script name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
		}
		if (rsScript.getScript() == null) {
			logger.warn("Invalid script.");
			throw new NetshotBadRequestException("The script content can't be empty.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
		}
		try {
			User user = (User) request.getAttribute("user");
			rsScript.setAuthor(user.getUsername());
		}
		catch (Exception e) {
		}
		rsScript.setId(0);

		Session session = Database.getSession();
		try {
			session.beginTransaction();
			session.save(rsScript);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created", rsScript);
			this.suggestReturnCode(Response.Status.CREATED);
			return rsScript;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new rule.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A script with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_SCRIPT);
			}
			throw new NetshotBadRequestException(
					"Unable to add the script to the database",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}
	
	@DELETE
	@Path("/scripts/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove a script",
		description = "Removes a given script, by ID."
	)
	public void deleteScript(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete script {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			DeviceJsScript script = (DeviceJsScript) session.load(DeviceJsScript.class, id);
			session.delete(script);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted", script);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The script {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The script doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the script {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the script.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}
	
	@GET
	@Path("/scripts/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get a command script",
		description = "Returns a given command script, by ID."
	)
	public DeviceJsScript getScript(@PathParam("id") Long id) {
		logger.debug("REST request, get script {}", id);
		Session session = Database.getSession();
		try {
			DeviceJsScript script = (DeviceJsScript) session.get(DeviceJsScript.class, id);
			return script;
		}
		catch (ObjectNotFoundException e) {
			logger.error("Unable to find the script {}.", id, e);
			throw new NetshotBadRequestException("Script not found.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the script {}.", id, e);
			throw new NetshotBadRequestException("Unable to fetch the script.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}
	
	@GET
	@Path("/scripts")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get command scripts",
		description = "Returns the list of command scripts."
	)
	public List<DeviceJsScript> getScripts() {
		logger.debug("REST request, get scripts.");
		Session session = Database.getSession();
		try {
			List<DeviceJsScript> scripts =
					session.createQuery("from DeviceJsScript s", DeviceJsScript.class).list();
			for (DeviceJsScript script : scripts) {
				script.setScript(null);
			}
			return scripts;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the scripts.", e);
			throw new NetshotBadRequestException("Unable to fetch the scripts",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}



	/**
	 * The Class RsDiagnostic.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsDiagnostic {

		/** The id. */
		private long id = 0;

		/** The name. */
		private String name = "";

		/** The group. */
		private long targetGroup = 0;

		/** Whether the diagnostic is enabled or not. */
		private boolean enabled = false;

		/** The type of result (boolean, text, etc.). */
		private String resultType;

		/** The type of diagnostic. */
		private String type;

		/** The Javascript script (in case of JavaScriptDiagnostic). */
		private String script;

		/** The device driver name (in case of SimpleDiagnostic). */
		private String deviceDriver;

		/** The mode in which to run the command (in case of SimpleDiagnostic). */
		private String cliMode;

		/** The CLI command to execute (in case of SimpleDiagnostic). */
		private String command;

		/** The pattern to match (in case of SimpleDiagnostic). */
		private String modifierPattern;

		/** The replacement text (in case of SimpleDiagnostic). */
		private String modifierReplacement;

		/**
		 * Instantiates a new rs policy.
		 */
		public RsDiagnostic() {

		}

		/**
		 * @return the deviceDriver
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getDeviceDriver() {
			return deviceDriver;
		}

		/**
		 * @param deviceDriver the deviceDriver to set
		 */
		public void setDeviceDriver(String deviceDriver) {
			this.deviceDriver = deviceDriver;
		}

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getId() {
			return id;
		}

		/**
		 * Sets the id.
		 *
		 * @param id the new id
		 */
		public void setId(long id) {
			this.id = id;
		}

		/**
		 * Gets the name.
		 *
		 * @return the name
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getName() {
			return name;
		}

		/**
		 * Sets the name.
		 *
		 * @param name the new name
		 */
		public void setName(String name) {
			this.name = name;
		}

		/**
		 * Gets the group.
		 *
		 * @return the target group
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public long getTargetGroup() {
			return targetGroup;
		}

		/**
		 * Sets the group.
		 *
		 * @param targetGroup the new group
		 */
		public void setTargetGroup(long targetGroup) {
			this.targetGroup = targetGroup;
		}

		/**
		 * Set to yes to enable to diagnostic.
		 * @return the enabled True to enable, false to disable
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public boolean isEnabled() {
			return enabled;
		}

		/**
		 * Returns whether the diagnostic should be enabled or disabled.
		 * @param enabled set to true to enable the diagnostic
		 */
		public void setEnabled(boolean enabled) {
			this.enabled = enabled;
		}

		/**
		 * @return the script
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getScript() {
			return script;
		}

		/**
		 * @param script
		 *                   the script to set
		 */
		public void setScript(String script) {
			this.script = script;
		}

		/**
		 * @return the command
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getCommand() {
			return command;
		}

		/**
		 * @param command
		 *                    the command to set
		 */
		public void setCommand(String command) {
			this.command = command;
		}

		/**
		 * @return the modifierPattern
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getModifierPattern() {
			return modifierPattern;
		}

		/**
		 * @param modifierPattern
		 *                            the modifierPattern to set
		 */
		public void setModifierPattern(String modifierPattern) {
			this.modifierPattern = modifierPattern;
		}

		/**
		 * @return the modifierReplacement
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getModifierReplacement() {
			return modifierReplacement;
		}

		/**
		 * @param modifierReplacement the modifierReplacement to set
		 */
		public void setModifierReplacement(String modifierReplacement) {
			this.modifierReplacement = modifierReplacement;
		}

		/**
		 * Gets the type of diagnostic.
		 * @return the type
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getType() {
			return type;
		}

		/**
		 * Sets the type of diagnostic.
		 * @param type the type to set
		 */
		public void setType(String type) {
			this.type = type;
		}

		/**
		 * Gets the CLI mode.
		 * @return the cliMode
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getCliMode() {
			return cliMode;
		}

		/**
		 * Sets the CLI mode.
		 * @param cliMode the cliMode to set
		 */
		public void setCliMode(String cliMode) {
			this.cliMode = cliMode;
		}

		/**
		 * Gets the type of result.
		 * @return the resultType
		 */
		@XmlElement
		@JsonView(DefaultView.class)
		public String getResultType() {
			return resultType;
		}

		/**
		 * Sets the type of result.
		 * @param resultType the resultType to set
		 */
		public void setResultType(String resultType) {
			this.resultType = resultType;
		}
	}



	/**
	 * Gets the diagnotics.
	 *
	 * @param request the request
	 * @return the diagnotics
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/diagnostics")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get the diagnostics",
		description = "Returns the list of diagnostics."
	)
	public List<Diagnostic> getDiagnostics() throws WebApplicationException {
		logger.debug("REST request, get diagnotics.");
		Session session = Database.getSession();
		try {
			List<Diagnostic> diagnostics =
					session.createQuery("select d from Diagnostic d left join fetch d.targetGroup", Diagnostic.class)
					.list();
			return diagnostics;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the diagnostics.", e);
			throw new NetshotBadRequestException("Unable to fetch the diagnostics",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	
	@POST
	@Path("/diagnostics")
	@RolesAllowed("executereadwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Add a diagnostic.",
		description = "Creates a diagnostic."
	)
	public Diagnostic addDiagnostic(RsDiagnostic rsDiagnostic) throws WebApplicationException {
		logger.debug("REST request, add diagnostic");
		String name = rsDiagnostic.getName().trim();
		if (name.isEmpty()) {
			logger.warn("User posted an empty diagnostic name.");
			throw new NetshotBadRequestException("Invalid diagnostic name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC_NAME);
		}
		if (name.contains("\"")) {
			logger.warn("Double-quotes are not allowed in the diagnostic name.");
			throw new NetshotBadRequestException("Double-quotes are not allowed in the name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC_NAME);
		}
		AttributeType resultType;
		try {
			resultType = AttributeType.valueOf(rsDiagnostic.getResultType());
		}
		catch (Exception e) {
			throw new NetshotBadRequestException("Invalid diagnostic result type.",
				NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
		}

		Diagnostic diagnostic;
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			DeviceGroup group = null;
			if (rsDiagnostic.getTargetGroup() != -1) {
				group = (DeviceGroup) session.load(DeviceGroup.class, rsDiagnostic.getTargetGroup());
			}

			if (".JavaScriptDiagnostic".equals(rsDiagnostic.getType())) {
				if (rsDiagnostic.getScript() == null || rsDiagnostic.getScript().trim() == "") {
					throw new NetshotBadRequestException(
						"Invalid diagnostic script",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				diagnostic = new JavaScriptDiagnostic(name, rsDiagnostic.isEnabled(), group, 
						resultType, rsDiagnostic.getScript());
			}
			else if (".SimpleDiagnostic".equals(rsDiagnostic.getType())) {
				if (rsDiagnostic.getCliMode() == null || rsDiagnostic.getCliMode().trim() == "") {
					throw new NetshotBadRequestException("The CLI mode must be provided.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				if (rsDiagnostic.getCommand() == null || rsDiagnostic.getCommand().trim() == "") {
					throw new NetshotBadRequestException("The command cannot be empty.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				diagnostic = new SimpleDiagnostic(name, rsDiagnostic.isEnabled(), group, resultType, rsDiagnostic.getDeviceDriver(),
						rsDiagnostic.getCliMode(), rsDiagnostic.getCommand(), rsDiagnostic.getModifierPattern(),
						rsDiagnostic.getModifierReplacement());
			}
			else {
				throw new NetshotBadRequestException(
					"Invalid diagnostic type.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC_TYPE);
			}
			
			session.save(diagnostic);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created", diagnostic);
			this.suggestReturnCode(Response.Status.CREATED);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The posted group doesn't exist", e);
			throw new NetshotBadRequestException(
					"Invalid group",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new diagnostic.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A diagnostic with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_DIAGNOSTIC);
			}
			throw new NetshotBadRequestException(
					"Unable to add the policy to the database.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		return diagnostic;
	}


	/**
	 * Updates the diagnostic.
	 * 
	 * @param request the request
	 * @param id the diagnostic ID
	 * @param rsDiagnostic the passed diagnostic
	 * @return the updated diagnostic
	 * @throws WebApplicationException a web application exception
	 */
	@PUT
	@Path("/diagnostics/{id}")
	@RolesAllowed("executereadwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Update a diagnostic",
		description = "Creates a new diagnostic."
	)
	public Diagnostic setDiagnostic(@PathParam("id") Long id, RsDiagnostic rsDiagnostic)
			throws WebApplicationException {
		logger.debug("REST request, edit diagnostic {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Diagnostic diagnostic = (Diagnostic) session.get(Diagnostic.class, id);
			if (diagnostic == null) {
				logger.error("Unable to find the diagnostic {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this diagnostic.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
			}
			
			String name = rsDiagnostic.getName().trim();
			if (name.isEmpty()) {
				logger.warn("User posted an empty diagnostic name.");
				throw new NetshotBadRequestException("Invalid diagnostic name.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC_NAME);
			}
			if (name.contains("\"")) {
				logger.warn("Double-quotes are not allowed in the diagnostic name.");
				throw new NetshotBadRequestException("Double-quotes are not allowed in the name.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC_NAME);
			}
			AttributeType resultType;
			try {
				resultType = AttributeType.valueOf(rsDiagnostic.getResultType());
			}
			catch (Exception e) {
				throw new NetshotBadRequestException("Invalid diagnostic result type.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
			}
			diagnostic.setName(name);
			if (diagnostic.getTargetGroup() != null && diagnostic.getTargetGroup().getId() != rsDiagnostic.getTargetGroup()) {
				session.createQuery("delete DiagnosticResult dr where dr.diagnostic.id = :id")
					.setParameter("id", diagnostic.getId())
					.executeUpdate();
			}
			DeviceGroup group = null;
			if (rsDiagnostic.getTargetGroup() != -1) {
				group = (DeviceGroup) session.load(DeviceGroup.class, rsDiagnostic.getTargetGroup());
			}
			diagnostic.setTargetGroup(group);

			diagnostic.setResultType(resultType);
			diagnostic.setEnabled(rsDiagnostic.isEnabled());
			if (diagnostic instanceof JavaScriptDiagnostic) {
				if (!".JavaScriptDiagnostic".equals(rsDiagnostic.getType())) {
					throw new NetshotBadRequestException("Incompatible posted diagnostic.",
							NetshotBadRequestException.Reason.NETSHOT_INCOMPATIBLE_DIAGNOSTIC);
				}
				if (rsDiagnostic.getScript() == null || rsDiagnostic.getScript().trim() == "") {
					throw new NetshotBadRequestException(
						"Invalid diagnostic script",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				((JavaScriptDiagnostic) diagnostic).setScript(rsDiagnostic.getScript());
			}
			else if (diagnostic instanceof SimpleDiagnostic) {
				if (!".SimpleDiagnostic".equals(rsDiagnostic.getType())) {
					throw new NetshotBadRequestException("Incompatible posted diagnostic.",
							NetshotBadRequestException.Reason.NETSHOT_INCOMPATIBLE_DIAGNOSTIC);
				}
				if (rsDiagnostic.getCliMode() == null || rsDiagnostic.getCliMode().trim() == "") {
					throw new NetshotBadRequestException("The CLI mode must be provided.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				if (rsDiagnostic.getCommand() == null || rsDiagnostic.getCommand().trim() == "") {
					throw new NetshotBadRequestException("The command cannot be empty.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				SimpleDiagnostic simpleDiagnostic = (SimpleDiagnostic) diagnostic;
				simpleDiagnostic.setDeviceDriver(rsDiagnostic.getDeviceDriver());
				simpleDiagnostic.setCliMode(rsDiagnostic.getCliMode());
				simpleDiagnostic.setCommand(rsDiagnostic.getCommand());
				simpleDiagnostic.setModifierPattern(rsDiagnostic.getModifierPattern());
				simpleDiagnostic.setModifierReplacement(rsDiagnostic.getModifierReplacement());
			}

			session.update(diagnostic);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited", diagnostic);
			return diagnostic;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("Unable to find the group {} to be assigned to the diagnostic {}.",
					rsDiagnostic.getTargetGroup(), id, e);
			throw new NetshotBadRequestException(
					"Unable to find the group.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to save the diagnostic {}.", id, e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException("A diagnostic with this name already exists.",
					NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_DIAGNOSTIC);
			}
			throw new NetshotBadRequestException("Unable to save the policy.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (WebApplicationException e) {
			session.getTransaction().rollback();
			throw e;
		}
		finally {
			session.close();
		}
	}


	/**
	 * Delete diagnostic.
	 *
	 * @param request the request
	 * @param id the id of the diagnostic to delete
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/diagnostics/{id}")
	@RolesAllowed("executereadwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Remove a diagnostic",
		description = "Removes a given diagnostic, by ID."
	)
	public void deleteDiagnostic(@PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete diagnostic {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Diagnostic diagnostic = (Diagnostic) session.load(Diagnostic.class, id);
			session.delete(diagnostic);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted", diagnostic);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The diagnostic {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The diagnostic doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the diagnostic {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the diagnostic",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the device diagnostic results
	 *
	 * @param request the request
	 * @param id the id
	 * @return the device compliance
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}/diagnosticresults")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Operation(
		summary = "Get diagnostic results",
		description = "Returns the results of a given diagnostic, by ID."
	)
	public List<DiagnosticResult> getDeviceDiagnosticResults(@PathParam("id") Long id) throws WebApplicationException {
		logger.debug("REST request, get diagnostic results for device {}.", id);
		Session session = Database.getSession();
		try {
			List<DiagnosticResult> results = session
				.createQuery("from DiagnosticResult dr where dr.device.id = :id", DiagnosticResult.class)
				.setParameter("id", id)
				.list();
			return results;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the diagnostic results.", e);
			throw new NetshotBadRequestException("Unable to fetch the diagnostic results",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

}


