/**
 * Copyright 2013-2024 Netshot
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
import java.net.MalformedURLException;
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
import java.util.ListIterator;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.TimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.annotation.security.DenyAll;
import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.persistence.PersistenceException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.BeanParam;
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
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.UriBuilder;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;

import onl.netfishers.netshot.database.Database;
import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.aaa.ApiToken;
import onl.netfishers.netshot.aaa.Radius;
import onl.netfishers.netshot.aaa.Tacacs;
import onl.netfishers.netshot.aaa.UiUser;
import onl.netfishers.netshot.aaa.User;
import onl.netfishers.netshot.cluster.ClusterManager;
import onl.netfishers.netshot.cluster.ClusterMember;
import onl.netfishers.netshot.cluster.ClusterMember.MastershipStatus;
import onl.netfishers.netshot.compliance.CheckResult;
import onl.netfishers.netshot.compliance.Exemption;
import onl.netfishers.netshot.compliance.HardwareRule;
import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.Rule;
import onl.netfishers.netshot.compliance.SoftwareRule;
import onl.netfishers.netshot.compliance.CheckResult.ResultOption;
import onl.netfishers.netshot.compliance.SoftwareRule.ConformanceLevel;
import onl.netfishers.netshot.compliance.rules.JavaScriptRule;
import onl.netfishers.netshot.compliance.rules.PythonRule;
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
import onl.netfishers.netshot.device.attribute.DeviceAttribute;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeLevel;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeType;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
import onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity;
import onl.netfishers.netshot.device.credentials.DeviceSnmpv3Community;
import onl.netfishers.netshot.device.credentials.DeviceSshKeyAccount;
import onl.netfishers.netshot.diagnostic.Diagnostic;
import onl.netfishers.netshot.diagnostic.DiagnosticResult;
import onl.netfishers.netshot.diagnostic.JavaScriptDiagnostic;
import onl.netfishers.netshot.diagnostic.PythonDiagnostic;
import onl.netfishers.netshot.diagnostic.SimpleDiagnostic;
import onl.netfishers.netshot.hooks.Hook;
import onl.netfishers.netshot.hooks.HookTrigger;
import onl.netfishers.netshot.hooks.WebHook;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.rest.RestViews.RestApiView;
import onl.netfishers.netshot.work.DebugLog;
import onl.netfishers.netshot.work.Task;
import onl.netfishers.netshot.work.TaskLogger;
import onl.netfishers.netshot.work.Task.ScheduleType;
import onl.netfishers.netshot.work.tasks.CheckComplianceTask;
import onl.netfishers.netshot.work.tasks.CheckGroupComplianceTask;
import onl.netfishers.netshot.work.tasks.CheckGroupSoftwareTask;
import onl.netfishers.netshot.work.tasks.DeviceBasedTask;
import onl.netfishers.netshot.work.tasks.DeviceJsScript;
import onl.netfishers.netshot.work.tasks.DiscoverDeviceTypeTask;
import onl.netfishers.netshot.work.tasks.DomainBasedTask;
import onl.netfishers.netshot.work.tasks.GroupBasedTask;
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
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
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
import org.slf4j.MarkerFactory;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.jaxrs.cfg.EndpointConfigBase;
import com.fasterxml.jackson.jaxrs.cfg.ObjectWriterInjector;
import com.fasterxml.jackson.jaxrs.cfg.ObjectWriterModifier;
import com.github.difflib.DiffUtils;
import com.github.difflib.patch.AbstractDelta;
import com.github.difflib.patch.Patch;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Getter;
import lombok.Setter;

/**
 * The RestService class exposes the Netshot methods as a REST service.
 */
@Path("/")
@DenyAll
public class RestService extends Thread {
	public static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RestService.class);

	/**
	 * The HQL select query for "light" devices, to be prepended to the actual
	 * query.
	 */
	private static final String LIGHTDEVICELIST_BASEQUERY =
		"select distinct d.id as id, d.name as name, d.family as family, d.mgmtAddress as mgmtAddress, " +
		"d.status as status, d.driver as driver, d.softwareLevel as softwareLevel, " +
		"case when (d.eosDate < current_date()) then true else false end as eos, " +
		"case when (d.eolDate < current_date()) then true else false end as eol,  " +
		"case when (select count(cr) from CheckResult cr where cr.key.device = d and cr.result = :nonConforming) = 0 then true else false end as configCompliant ";

	/** The static instance service. */
	private static RestService nsRestService;

	/** Pagination size for dump queries */
	private static final int PAGINATION_SIZE = 1000;

	private static final String HTTP_STATIC_PATH = Netshot.getConfig("netshot.http.staticpath", "/");
	static final String HTTP_API_PATH = Netshot.getConfig("netshot.http.apipath", "/api");

	/** Pagination default query params */
	public static class PaginationParams {
		/** Pagination offset */
		@Parameter(description = "Pagination offset for the first item to return")
		@QueryParam("offset")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Integer offset;

		/** Pagination limit */
		@Parameter(description = "Maximum number of items to return")
		@QueryParam("limit")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Integer limit;

		/**
		 * Apply the pagination parameters to the HQL query.
		 * @param query The query being prepared
		 */
		public void apply(Query<?> query) {
			if (this.offset != null) {
				if (this.offset < 0) {
					throw new NetshotBadRequestException("Invalid offset parameter",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_REQUEST_PARAMETER);
				}
				query.setFirstResult(this.offset);
			}
			if (this.limit != null) {
				if (this.limit < 1) {
					throw new NetshotBadRequestException("Invalid limit parameter",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_REQUEST_PARAMETER);
				}
				query.setMaxResults(this.limit);
			}
		}
	}

	/**
	 * Get the current REST service TCP port.
	 * @return the current REST service TCP port
	 */
	public static int getRestPort() {
		return nsRestService == null ? 0 : nsRestService.httpBasePort;
	}

	/**
	 * Initializes the service.
	 */
	public static void init() {
		if (!Netshot.getConfig("netshot.http.enabled", true)) {
			log.info("HTTP server is not enabled.");
			return;
		}
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
		if (!Netshot.getConfig("netshot.http.ssl.enabled", true)) {
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
		httpBasePort = Netshot.getConfig("netshot.http.baseport", httpBasePort, 1, 65535);
	}

	/**
	 * Override the resource JSON view.
	 * @param view = The view to use to serialize data
	 */
	protected void setWriterView(Class<? extends RestApiView> view) {
		ObjectWriterInjector.set(new ObjectWriterModifier() {
			@Override
			public ObjectWriter modify(EndpointConfigBase<?> endpoint, MultivaluedMap<String, Object> responseHeaders,
					Object valueToWrite, ObjectWriter w, JsonGenerator g) throws IOException {
				return w.withView(view);
			}
		});
	}

	/**
	 * Attach a suggested return code to the request, so the ResponseCodeFilter
	 * can in turn change the return code of the response.
	 * e.g. 201 or 204 instead of default 200
	 */
	private void suggestReturnCode(Response.Status status) {
		this.request.setAttribute(ResponseCodeFilter.SUGGESTED_RESPONSE_CODE, status);
	}

	/**
	 * Check whether a PersistenceException is caused by key conflict (duplicate key).
	 */
	private boolean isDuplicateException(PersistenceException e) {
		Throwable t = e;
		for (int i = 0; i < 2; i++) {
			t = t.getCause();
			if (t == null) {
				return false;
			}
			if (t.getMessage().toLowerCase().contains("duplicate")) {
				return true;
			}
		}
		return false;
	}

	/* (non-Javadoc)
	 * @see java.lang.Thread#run()
	 */
	@Override
	public void run() {
		log.info("Starting the Web/REST service thread.");
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
			log.error(MarkerFactory.getMarker("FATAL"),
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String errorMsg;

		/** The error code. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
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
	}
	
	/**
	 * Gets the domains.
	 *
	 * @return the domains
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/domains")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the device domains",
		description = "Returns the list of device domains."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public List<RsDomain> getDomains(@BeanParam PaginationParams paginationParams) throws WebApplicationException {
		log.debug("REST request, domains.");
		Session session = Database.getSession(true);
		try {
			Query<Domain> query = session.createQuery("select d from Domain d", Domain.class);
			paginationParams.apply(query);
			List<Domain> domains = query.list();
			List<RsDomain> rsDomains = new ArrayList<>();
			for (Domain domain : domains) {
				rsDomains.add(new RsDomain(domain));
			}
			return rsDomains;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the domains.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id = -1;

		/** The name. */

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String name = "";

		/** The description. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String description = "";

		/** The ip address. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String ipAddress = "";

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
	 * @param newDomain the new domain
	 * @return the rs domain
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/domains")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a device domain",
		description = "Creates a device domain."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public RsDomain addDomain(RsDomain newDomain) throws WebApplicationException {
		log.debug("REST request, add a domain");
		String name = newDomain.getName().trim();
		if (name.isEmpty()) {
			log.warn("User posted an empty domain name.");
			throw new NetshotBadRequestException("Invalid domain name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN_NAME);
		}
		String description = newDomain.getDescription().trim();
		try {
			Network4Address v4Address = new Network4Address(newDomain.getIpAddress());
			Network6Address v6Address = new Network6Address("::");
			if (!v4Address.isNormalUnicast()) {
				log.warn("User posted an invalid IP address.");
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
				return new RsDomain(domain);
			}
			catch (HibernateException e) {
				session.getTransaction().rollback();
				log.error("Error while adding a domain.", e);
				if (this.isDuplicateException(e)) {
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
		}
		catch (UnknownHostException e) {
			log.warn("User posted an invalid IP address.");
			throw new NetshotBadRequestException("Malformed IP address",
					NetshotBadRequestException.Reason.NETSHOT_MALFORMED_IP_ADDRESS);
		}
	}

	/**
	 * Sets the domain.
	 *
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a device domain",
		description = "Edits a device domain, by ID."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public RsDomain setDomain(@PathParam("id") @Parameter(description = "Domain ID") Long id, RsDomain rsDomain)
			throws WebApplicationException {
		log.debug("REST request, edit domain {}.", id);
		String name = rsDomain.getName().trim();
		if (name.isEmpty()) {
			log.warn("User posted an invalid domain name.");
			throw new NetshotBadRequestException("Invalid domain name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN_NAME);
		}
		String description = rsDomain.getDescription().trim();
		Network4Address v4Address;
		try {
			v4Address = new Network4Address(rsDomain.getIpAddress());
			if (!v4Address.isNormalUnicast()) {
				log.warn("User posted an invalid IP address");
				throw new NetshotBadRequestException("Invalid IP address",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_IP_ADDRESS);
			}
		}
		catch (UnknownHostException e) {
			log.warn("Invalid IP address.", e);
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
			log.error("The domain doesn't exist.", e);
			throw new NetshotBadRequestException("The domain doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Error while editing the domain.", e);
			if (this.isDuplicateException(e)) {
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
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/domains/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove a device domain",
		description = "Remove the given device domain, by ID."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public void deleteDomain(@PathParam("id") @Parameter(description = "Domain ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, delete domain {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Domain domain = (Domain) session.load(Domain.class, id);
			// Remove the tasks
			for (Class<? extends Task> taskClass : Task.getTaskClasses()) {
				if (DomainBasedTask.class.isAssignableFrom(taskClass)) {
					session.createQuery(
							String.format("delete from %s t where t.domain = :domain", taskClass.getSimpleName()))
						.setParameter("domain", domain)
						.executeUpdate();
				}
			}
			session.createQuery("delete from Domain d where d = :domain")
				.setParameter("domain", domain)
				.executeUpdate();
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted.", domain);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("The domain doesn't exist.");
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
	 * @param id the id
	 * @return the device interfaces
	 * @throws WebApplicationException the web application exception
	 */
	@SuppressWarnings("deprecation")
	@GET
	@Path("/devices/{id}/interfaces")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get device interfaces",
		description = "Returns the list of interfaces of a given device (by ID)."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public List<NetworkInterface> getDeviceInterfaces(@PathParam("id") @Parameter(description = "Device ID") Long id,
			@BeanParam PaginationParams paginationParams)
			throws WebApplicationException {
		log.debug("REST request, get device {} interfaces.", id);
		Session session = Database.getSession(true);
		try {
			List<NetworkInterface> deviceInterfaces;
			Query<NetworkInterface> query = session
				.createQuery(
						"from NetworkInterface AS networkInterface "
								+ "left join fetch networkInterface.ip4Addresses "
								+ "left join fetch networkInterface.ip6Addresses "
								+ "where device = :device", NetworkInterface.class)
				.setParameter("device", id)
				.setResultTransformer(Criteria.DISTINCT_ROOT_ENTITY);
			paginationParams.apply(query);
			deviceInterfaces = query.list();
			return deviceInterfaces;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the interfaces.", e);
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
	 * @param id the id
	 * @return the device modules
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}/modules")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get device modules",
		description = "Returns the list of hardware modules of a given device, by ID."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public List<Module> getDeviceModules(@PathParam("id") @Parameter(description = "Device ID") Long id,
			@Parameter(description = "Whether to include history (removed modules with dates)") @QueryParam("history") boolean includeHistory,
			@BeanParam PaginationParams paginationParams)
			throws WebApplicationException {
		log.debug("REST request, get device {} modules.", id);
		Session session = Database.getSession(true);
		try {
			String hqlQuery = "from Module m where m.device.id = :device";
			if (!includeHistory) {
				hqlQuery += " and m.removed = :false";
			}
			Query<Module> query = session
				.createQuery(hqlQuery, Module.class)
				.setParameter("device", id);
			if (!includeHistory) {
				query.setParameter("false", false);
			}
			paginationParams.apply(query);
			List<Module> deviceModules = query.list();
			return deviceModules;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the modules.", e);
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
	 * @param id the id
	 * @return the device tasks
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}/tasks")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get device tasks",
		description = "Returns the list of tasks of a given device (by ID). Tasks are returned sorted by status and significant date."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	@Tag(name = "Tasks", description = "Task management")
	public List<Task> getDeviceTasks(@PathParam("id") @Parameter(description = "Device ID") Long id, @BeanParam PaginationParams paginationParams)
			throws WebApplicationException {
		log.debug("REST request, get device {} tasks.", id);
		if (paginationParams.offset != null) {
			throw new NetshotBadRequestException("Offset is not supported on this endpoint",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_REQUEST_PARAMETER);
		}
		if (paginationParams.limit == null) {
			paginationParams.limit = 100;
		}
		Session session = Database.getSession(true);
		try {
			List<Task> tasks = new ArrayList<>();
			
			for (Class<? extends Task> taskClass : Task.getTaskClasses()) {
				if (DeviceBasedTask.class.isAssignableFrom(taskClass)) {
					tasks.addAll(session.createQuery(
							String.format("select t from %s t where t.device.id = :deviceId order by t.changeDate desc",
							taskClass.getSimpleName()), taskClass)
						.setParameter("deviceId", id)
						.setMaxResults(paginationParams.limit)
						.list());
				}
			}
			
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
			int max =  tasks.size();
			if (paginationParams.limit < tasks.size()) {
				max = paginationParams.limit;
			}
			return tasks.subList(0, max);
		}
		catch (Exception e) {
			log.error("Unable to fetch the tasks.", e);
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
	 * @param id the id
	 * @return the device configs
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}/configs")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get device configs",
		description = "Returns the list of configurations of the given device, by ID."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public List<Config> getDeviceConfigs(@PathParam("id") @Parameter(description = "Device ID") Long id, @BeanParam PaginationParams paginationParams)
			throws WebApplicationException {
		log.debug("REST request, get device {} configs.", id);
		Session session = Database.getSession(true);
		try {
			session.enableFilter("lightAttributesOnly");
			Query<Config> query = session
				.createQuery(
					"select distinct c from Config c left join fetch c.attributes ca where c.device.id = :device order by c.changeDate desc",
					Config.class)
				.setParameter("device", id);
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the configs.", e);
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
	 * @param id the id
	 * @param item the item
	 * @return the device config plain
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/configs/{id}/{item}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_OCTET_STREAM })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get a device configuration item",
		description = "Retrieves a device configuration item, in plain text."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public Response getDeviceConfigPlain(@PathParam("id") @Parameter(description = "Config ID") Long id,
			@PathParam("item") @Parameter(description = "Config item name") String item) throws WebApplicationException {
		log.debug("REST request, get device {} config {}.", id, item);
		Session session = Database.getSession(true);
		try {
			Config config = (Config) session.get(Config.class, id);
			if (config == null) {
				log.warn("Unable to find the config object.");
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Date originalDate;

		/** The revised date. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Date revisedDate;

		/** The original config ID. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Long originalConfigId;

		/** The revised config ID. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Long revisedConfigId;

		/** The original config. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Config originalConfig;

		/** The revised config. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Config revisedConfig;

		/** The deltas. */
		@Getter(onMethod=@__({
			@XmlElement(), @JsonView(DefaultView.class),
			@JsonInclude(Include.NON_NULL)
		}))
		@Setter
		private Map<String, List<RsConfigDelta>> deltas = new HashMap<>();

		/**
		 * Instantiates a new rs config diff.
		 *
		 * @param originalDate the original date
		 * @param revisedDate the revised date
		 */
		public RsConfigDiff(Date originalDate, Date revisedDate,
				Long originalConfigId, Long revisedConfigId) {
			this.originalDate = originalDate;
			this.revisedDate = revisedDate;
			this.originalConfigId = originalConfigId;
			this.revisedConfigId = revisedConfigId;
		}

		/**
		 * Adds the delta.
		 *
		 * @param item the item
		 * @param delta the delta
		 */
		public void addDelta(String item, RsConfigDelta delta) {
			if (!deltas.containsKey(item)) {
				deltas.put(item, new ArrayList<>());
			}
			deltas.get(item).add(delta);
		}
	}

	/**
	 * The Class RsConfigDelta.
	 */
	@XmlRootElement
	public static class RsConfigDelta {

		/**
		 * Type of difference
		 */
		public static enum Type {
			CHANGE,
			DELETE,
			INSERT;
		}

		/**
		 * Class representing a line in configuration with its number (position).
		 */
		@XmlRootElement
		public static class LineWithPosition {
			@Getter(onMethod=@__({
				@XmlElement, @JsonView(DefaultView.class)
			}))
			@Setter
			private String line;

			@Getter(onMethod=@__({
				@XmlElement, @JsonView(DefaultView.class)
			}))
			@Setter
			private int position;

			public LineWithPosition(String line, int position) {
				this.line = line;
				this.position = position;
			}
		}

		/** The item. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String item;

		/** The diff type. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Type diffType;

		/** The original position. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private int originalPosition;

		/** The revised position. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private int revisedPosition;

		/** The original lines. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private List<String> originalLines;

		/** The revised lines. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private List<String> revisedLines;

		/** The pre context. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private List<String> preContext;

		/** The post context. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private List<String> postContext;

		/** The (indentation-based) hierarchy lines and positions */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private List<LineWithPosition> hierarchy;

		/**
		 * Instantiates a new rs config delta.
		 *
		 * @param delta the delta
		 * @param context the context
		 */
		public RsConfigDelta(AbstractDelta<String> delta, List<String> allOldLines, int[] oldLineParents) {
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
			this.originalPosition = delta.getSource().getPosition();
			this.originalLines = delta.getSource().getLines();
			this.revisedPosition = delta.getTarget().getPosition();
			this.revisedLines = delta.getTarget().getLines();
			this.preContext = allOldLines.subList(Math.max(this.originalPosition - 3, 0),
					this.originalPosition);
			this.postContext = allOldLines.subList(Math.min(this.originalPosition
					+ this.originalLines.size(), allOldLines.size() - 1),
					Math.min(this.originalPosition + this.originalLines.size() + 3,
						allOldLines.size() - 1));
			this.hierarchy = new ArrayList<>();
			int p = this.originalPosition;
			if (p < oldLineParents.length) {
				p = oldLineParents[p];
				while (p >= 0) {
					this.hierarchy.add(new LineWithPosition(allOldLines.get(p), p));
					p = oldLineParents[p];
				}
			}
			Collections.reverse(this.hierarchy);
		}
	}

	/**
	 * Gets the device config diff.
	 *
	 * @param id1 the id1
	 * @param id2 the id2
	 * @return the device config diff
	 */
	@GET
	@Path("/configs/{id1}/vs/{id2}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the diff between two configuration objects",
		description = "Retrieves the differences between two given device configuration objets, identified by full IDs."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public RsConfigDiff getDeviceConfigDiff(
			@PathParam("id1") @Parameter(description = "First config ID") Long id1,
			@PathParam("id2") @Parameter(description = "Second config ID") Long id2,
			@DefaultValue("true") @QueryParam("deltas") @Parameter(description = "Include/compute deltas") boolean includeDeltas,
			@DefaultValue("false") @QueryParam("fullconfigs") @Parameter(description = "Include full configs") boolean includeConfigs) {
		log.debug("REST request, get device config diff, id {} and {} ({} deltas).",
				id1, id2, includeDeltas ? "with" : "without");
		RsConfigDiff configDiffs;
		Session session = Database.getSession(true);
		Config config1;
		Config config2;
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
				log.error("Non existing config, {} or {}.", id1, id2);
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
				log.error("Missing driver.");
				throw new NetshotBadRequestException("Missing driver",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			if (!driver1.equals(driver2)) {
				log.error("Incompatible configurations, {} and {} (different drivers).", id1, id2);
				throw new NetshotBadRequestException("Incompatible configurations",
						NetshotBadRequestException.Reason.NETSHOT_INCOMPATIBLE_CONFIGS);
			}
			
			configDiffs = new RsConfigDiff(config1.getChangeDate(), config2.getChangeDate(),
				config1.getId(), config2.getId());
			if (includeDeltas) {
				Map<String, ConfigAttribute> attributes1 = config1.getAttributeMap();
				Map<String, ConfigAttribute> attributes2 = config2.getAttributeMap();
				for (AttributeDefinition definition : driver1.getAttributes()) {
					if (definition.isComparable()) {
						ConfigAttribute attribute1 = attributes1.get(definition.getName());
						ConfigAttribute attribute2 = attributes2.get(definition.getName());
						String text1 = (attribute1 == null ? "" : attribute1.getAsText());
						String text2 = (attribute2 == null ? "" : attribute2.getAsText());
						List<String> lines1 = Arrays.asList(text1.replace("\r", "").split("\n"));
						int[] lineParents1 = Config.getLineParents(lines1);
						List<String> lines2 = Arrays.asList(text2.replace("\r", "").split("\n"));
						Patch<String> patch = DiffUtils.diff(lines1, lines2);
						for (AbstractDelta<String> delta : patch.getDeltas()) {
							configDiffs.addDelta(definition.getTitle(), new RsConfigDelta(delta, lines1, lineParents1));
						}
					}
				}
			}
			else {
				configDiffs.setDeltas(null);
			}

			if (includeConfigs) {
				configDiffs.setOriginalConfig(config1);
				configDiffs.setRevisedConfig(config2);
			}
			return configDiffs;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the configs", e);
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
	 * @param id the id
	 * @return the device
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get a device",
		description = "Retrieve a device will all details."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public Device getDevice(@PathParam("id") @Parameter(description = "Device ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, device {}.", id);
		Session session = Database.getSession(true);
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
				credentialSet.removeSensitive();
				device.setSpecificCredentialSet(credentialSet);
			}
			for (DeviceCredentialSet cs : device.getCredentialSets()) {
				cs.removeSensitive();
			}
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the device", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id;

		/** The name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String name;

		/** The family. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String family;

		/** The mgmt address. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class),
			@JsonSerialize(using = Network4Address.AddressOnlySerializer.class),
			@JsonDeserialize(using = Network4Address.AddressOnlyDeserializer.class)
		}))
		@Setter
		private Network4Address mgmtAddress;

		/** The status. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Device.Status status;

		/** The device deviceDriver name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		protected String driver;

		/** End of Life. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		protected Boolean eol;
	
		/** End of Sale. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		protected Boolean eos;
	
		/** Configuration compliant. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		protected Boolean configCompliant;

		/** The software level. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		protected SoftwareRule.ConformanceLevel softwareLevel = ConformanceLevel.UNKNOWN;
	}

	/**
	 * Gets the devices.
	 *
	 * @return the devices
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the devices",
		description = "Retrieves the device list with minimal details."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public List<RsLightDevice> getDevices(
			@BeanParam PaginationParams paginationParams,
			@QueryParam("group") @Parameter(description = "Filter on devices of the given group ID") Long groupId,
			@QueryParam("details") Boolean withDetails) throws WebApplicationException {
		log.debug("REST request, devices.");

		Session session = Database.getSession(true);
		try {
			String hqlQuery = LIGHTDEVICELIST_BASEQUERY + "from Device d";
			if (groupId != null) {
				hqlQuery += " join d.ownerGroups g where g.id = :groupId";
			}
			@SuppressWarnings({ "unchecked", "deprecation" })
			Query<RsLightDevice> query = session.createQuery(hqlQuery)
				.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class));
			query.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING);
			if (groupId != null) {
				query.setParameter("groupId", groupId);
			}
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the devices", e);
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
	 * @return the device types
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devicetypes")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the device types",
		description = "Returns the list of device types (drivers)."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public List<DeviceDriver> getDeviceTypes(
			@DefaultValue("false") @QueryParam("refresh") @Parameter(description = "Whether to reload all drivers from sources") boolean refresh)
			throws WebApplicationException {
		log.debug("REST request, device types.");
		if (refresh) {
			ClusterManager.requestDriverReload();
			try {
				DeviceDriver.refreshDrivers();
			}
			catch (Exception e) {
				log.error("Error in REST service while refreshing the device types.", e);
			}
		}
		List<DeviceDriver> deviceTypes = new ArrayList<>();
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String driver;

		/** The device family. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String deviceFamily;
	}

	/**
	 * Gets the device families.
	 *
	 * @return the device families
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devicefamilies")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the existing device families",
		description = "Returns the list of device families (driver specific) currenly known in the database."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public List<RsDeviceFamily> getDeviceFamilies(@BeanParam PaginationParams paginationParams) throws WebApplicationException {
		log.debug("REST request, device families.");
		Session session = Database.getSession(true);
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			Query<RsDeviceFamily> query = session
				.createQuery("select distinct d.driver as driver, d.family as deviceFamily from Device d")
				.setResultTransformer(Transformers.aliasToBean(RsDeviceFamily.class));
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Error while loading device families.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String partNumber;
	}


	/**
	 * Gets the known part numbers.
	 *
	 * @return the part numbers
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/partnumbers")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the known part numbers",
		description = "Returns the list of all known part numbers currently existing in the module table."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public List<RsPartNumber> getPartNumbers(@BeanParam PaginationParams paginationParams) throws WebApplicationException {
		log.debug("REST request, part numbers.");
		Session session = Database.getSession(true);
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			Query<RsPartNumber> query = session
				.createQuery("select distinct m.partNumber as partNumber from Module m")
				.setResultTransformer(Transformers.aliasToBean(RsPartNumber.class));
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Error while loading part numbers.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean autoDiscover = true;

		/** The auto discovery task. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long autoDiscoveryTask = 0;

		/** The ip address. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String ipAddress = "";

		/** The domain id. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long domainId = -1;

		/** The name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String name = "";

		/** The device type. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String deviceType = "";

		/** The connection IP address (optional). */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String connectIpAddress = null;
		
		/** The SSH port. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String sshPort;

		/** The Telnet port. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String telnetPort;
		
		/** A device-specific credential set. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private DeviceCredentialSet specificCredentialSet;
	}

	/**
	 * Adds the device.
	 *
	 * @param device the device
	 * @return the task
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/devices")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a device",
		description = "In auto discovery mode, this will create a 'discover device' task, and the device will be create if the discovery is successful." +
		" Otherwise, the device will be immediately created in the database, and a 'snapshot' task will be created."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public Task addDevice(RsNewDevice device) throws WebApplicationException {
		log.debug("REST request, new device.");
		Network4Address deviceAddress;
		try {
			deviceAddress = new Network4Address(device.getIpAddress());
			if (!deviceAddress.isNormalUnicast()) {
				log.warn("User posted an invalid IP address (not normal unicast).");
				throw new NetshotBadRequestException("Invalid IP address",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_IP_ADDRESS);
			}
		}
		catch (UnknownHostException e) {
			log.warn("User posted an invalid IP address.");
			throw new NetshotBadRequestException("Malformed IP address",
					NetshotBadRequestException.Reason.NETSHOT_MALFORMED_IP_ADDRESS);
		}
		Network4Address connectAddress = null;
		if (device.getConnectIpAddress() != null && !device.getConnectIpAddress().equals("")) {
			try {
				connectAddress = new Network4Address(device.getConnectIpAddress());
				if (!deviceAddress.isNormalUnicast()) {
					log.warn("User posted an invalid connect IP address (not normal unicast).");
					throw new NetshotBadRequestException("Invalid connect IP address",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_IP_ADDRESS);
				}
			}
			catch (UnknownHostException e) {
				log.warn("User posted an invalid IP address.");
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
			log.debug("Looking for an existing device with this IP address.");
			Device duplicate = (Device) session
					.createQuery("from Device d where d.mgmtAddress.address = :ip")
					.setParameter("ip", deviceAddress.getIntAddress()).uniqueResult();
			if (duplicate != null) {
				log.error("Device {} is already present with this IP address.",
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
			if (knownCommunities.isEmpty() && device.isAutoDiscover()) {
				log.error("No available SNMP community");
				throw new NetshotBadRequestException(
						"There is no known SNMP community in the database to poll the device.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_CREDENTIALS);
			}
		}
		catch (ObjectNotFoundException e) {
			log.error("Non existing domain.", e);
			throw new NetshotBadRequestException("Invalid domain",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
		}
		catch (HibernateException e) {
			log.error("Error while loading domain or communities.", e);
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
				log.error("Unable to schedule the discovery task.", e);
				throw new NetshotBadRequestException("Unable to schedule the task",
						NetshotBadRequestException.Reason.NETSHOT_SCHEDULE_ERROR);
			}
			catch (HibernateException e) {
				log.error("Error while adding the discovery task.", e);
				throw new NetshotBadRequestException("Database error",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
		}
		else {
			DeviceDriver driver = DeviceDriver.getDriverByName(device.getDeviceType());
			if (driver == null) {
				log.warn("Invalid posted device driver.");
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
				log.error("Error while creating the device", e);
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
				log.error("Unable to add the task.", e);
				throw new NetshotBadRequestException(
						"Unable to add the task to the database.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			catch (SchedulerException e) {
				log.error("Unable to schedule the task.", e);
				throw new NetshotBadRequestException("Unable to schedule the task.",
						NetshotBadRequestException.Reason.NETSHOT_SCHEDULE_ERROR);
			}
		}

	}

	/**
	 * Delete device.
	 *
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/devices/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove a device",
		description = "Remove the given device, by ID."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public void deleteDevice(@PathParam("id") @Parameter(description = "Device ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, delete device {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Device device = session.load(Device.class, id);
			List<File> toDeleteFiles = new ArrayList<>();
			List<ConfigBinaryFileAttribute> attributes = session
				.createQuery("from ConfigBinaryFileAttribute cfa where cfa.config.device.id = :id",
						ConfigBinaryFileAttribute.class)
				.setParameter("id", id)
				.list();
			for (ConfigBinaryFileAttribute attribute : attributes) {
				toDeleteFiles.add(attribute.getFileName());
			}
			// Remove the long text attributes (due to delete cascade constraint)
			session
				.createQuery("delete from LongTextConfiguration ltc where ltc in (select da.longText from DeviceLongTextAttribute da where da.device = :device)")
				.setParameter("device", device)
				.executeUpdate();
			session
				.createQuery("delete from LongTextConfiguration ltc where ltc in (select ca.longText from Config c join c.attributes ca where c.device = :device)")
				.setParameter("device", device)
				.executeUpdate();
			session
				.createQuery("delete from LongTextConfiguration ltc where ltc in (select dr.longText from DiagnosticLongTextResult dr where dr.device = :device)")
				.setParameter("device", device)
				.executeUpdate();
			// Remove the tasks
			for (Class<? extends Task> taskClass : Task.getTaskClasses()) {
				if (DeviceBasedTask.class.isAssignableFrom(taskClass)) {
					session.createQuery(
							String.format("delete from %s t where t.device.id = :deviceId", taskClass.getSimpleName()))
						.setParameter("deviceId", id)
						.executeUpdate();
				}
			}
			// Remove the device
			session
				.createQuery("delete from Device d where d = :device")
				.setParameter("device", device)
				.executeUpdate();
			session.getTransaction().commit();
			Netshot.aaaLogger.info("Device ID {} has been deleted.", id);
			for (File toDeleteFile : toDeleteFiles) {
				try {
					toDeleteFile.delete();
				}
				catch (Exception e) {
					log.error("Error while removing binary file {}", toDeleteFile, e);
				}
			}
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Unable to delete the device {}.", id, e);
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
			log.error("Error", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id = -1;

		/** The enable. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Boolean enabled = null;

		/** The comments. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String comments = null;

		/** The ip address. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String ipAddress = null;

		/** The connection IP address (optional). */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String connectIpAddress = null;
		
		/** The SSH port. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String sshPort;

		/** The Telnet port. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String telnetPort;

		/** The auto try credentials. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Boolean autoTryCredentials = null;

		/** The credential set ids. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private List<Long> credentialSetIds = null;

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private List<Long> clearCredentialSetIds = null;

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Long mgmtDomain = null;
		
		/** A device-specific credential set. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private DeviceCredentialSet specificCredentialSet = null;

		/**
		 * Instantiates a new rs device.
		 */
		public RsDevice() {

		}
	}

	/**
	 * Sets the device.
	 *
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a device",
		description = "Edits a device, by ID."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public Device setDevice(@PathParam("id") @Parameter(description = "Device ID") Long id, RsDevice rsDevice)
			throws WebApplicationException {
		log.debug("REST request, edit device {}.", id);
		Device device;
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			device = (Device) session.load(Device.class, id);
			if (rsDevice.getEnabled() != null) {
				if (rsDevice.getEnabled()) {
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
						log.error("Non existing credential set {}.", credentialSetId);
					}
				}
			}
			if (rsDevice.getAutoTryCredentials() != null) {
				device.setAutoTryCredentials(rsDevice.getAutoTryCredentials());
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
			log.warn("User posted an invalid IP address.", e);
			throw new NetshotBadRequestException("Malformed IP address",
					NetshotBadRequestException.Reason.NETSHOT_MALFORMED_IP_ADDRESS);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("The device doesn't exist.", e);
			throw new NetshotBadRequestException("The device doesn't exist anymore.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Cannot edit the device.", e);
			if (this.isDuplicateException(e)) {
				throw new NetshotBadRequestException(
						"A device with this IP address already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_DEVICE);
			}
			Throwable t = e.getCause();
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
	 * @param id the id
	 * @return the task
	 */
	@GET
	@Path("/tasks/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get a task.",
		description = "Retrieves the status of a given task, by ID."
	)
	@Tag(name = "Tasks", description = "Task management")
	public Task getTask(@PathParam("id") @Parameter(description = "Task ID") Long id) {
		log.debug("REST request, get task {}", id);
		Session session = Database.getSession(true);
		Task task;
		try {
			task = (Task) session.get(Task.class, id);
			return task;
		}
		catch (ObjectNotFoundException e) {
			log.error("Unable to find the task {}.", id, e);
			throw new NetshotBadRequestException("Task not found",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the task {}.", id, e);
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
	 * @param id the id
	 * @param item the item
	 * @return the device config plain
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/tasks/{id}/debuglog")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_OCTET_STREAM })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the debug log of a task",
		description = "Retrieves the full debug log of a given task, by ID."
	)
	@Tag(name = "Tasks", description = "Task management")
	public Response getTaskDebugLog(@PathParam("id") @Parameter(description = "Task ID") Long id) throws WebApplicationException {
		log.debug("REST request, get task {} debug log.", id);
		Session session = Database.getSession(true);
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
			log.error("Unable to find the task {}.", id, e);
			throw new WebApplicationException(
					"Task not found",
					javax.ws.rs.core.Response.Status.NOT_FOUND);
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the task {}.", id, e);
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
	 * @return the tasks
	 */
	@GET
	@Path("/tasks")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the tasks",
		description = "Returns the list of tasks. Limited to 100 if no specific limit is provided."
	)
	@Tag(name = "Tasks", description = "Task management")
	public List<Task> getTasks(@BeanParam PaginationParams paginationParams,
			@QueryParam("status") @Parameter(description = "Include tasks of given status(es)") Set<Task.Status> statuses,
			@QueryParam("after") @Parameter(description = "Tasks executed or changed after this date (as milliseconds since 1970)") Long startDate,
			@QueryParam("before") @Parameter(description = "Tasks executed or changed before this date (as milliseconds since 1970)") Long endDate) {

		log.debug("REST request, get tasks.");
		if (paginationParams.limit == null) {
			paginationParams.limit = 100;
		}

		Session session = Database.getSession(true);
		try {
			StringBuilder hqlQuery = new StringBuilder("select t from Task t where (1 = 1)");
			Map<String, Object> hqlParams = new HashMap<>();

			if (!statuses.isEmpty()) {
				hqlQuery.append(" and t.status in :statuses");
				hqlParams.put("statuses", statuses);
			}
			if (startDate != null) {
				hqlQuery.append(" and (((t.executionDate is not null) and (t.executionDate >= :startDate)) " +
					"or ((t.executionDate is null) and (t.changeDate >= :startDate)))");
				hqlParams.put("startDate", new Date(startDate));
			}
			if (endDate != null) {
				hqlQuery.append(" and (((t.executionDate is not null) and (t.executionDate <= :endDate)) " +
					"or ((t.executionDate is null) and (t.changeDate < :endDate)))");
				hqlParams.put("endDate", new Date(endDate));
			}
			hqlQuery.append(" order by id desc");
			
			Query<Task> query = session.createQuery(hqlQuery.toString(), Task.class);
			for (Entry<String, Object> k : hqlParams.entrySet()) {
				query.setParameter(k.getKey(), k.getValue());
			}
			
			paginationParams.apply(query);
			List<Task> tasks = query.list();
			return tasks;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the tasks.", e);
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
	 * @return the credential sets
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/credentialsets")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the global credential sets",
		description = "Returns the list of global credential sets (SSH, SNMP, etc. accounts) for authentication against the devices."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public List<DeviceCredentialSet> getCredentialSets(@BeanParam PaginationParams paginationParams)
			throws WebApplicationException {
		log.debug("REST request, get credentials.");
		Session session = Database.getSession(true);
		List<DeviceCredentialSet> credentialSets;
		try {
			Query<DeviceCredentialSet> query = session
				.createQuery("select cs from DeviceCredentialSet cs where not (cs.deviceSpecific = :true)",
						DeviceCredentialSet.class)
				.setParameter("true", true);
			paginationParams.apply(query);
			credentialSets = query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the credentials.", e);
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
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/credentialsets/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove a credential set",
		description = "Removes the given credential set, by ID."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public void deleteCredentialSet(@PathParam("id") @Parameter(description = "Credential set ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, delete credentials {}", id);
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
					.createNativeQuery("delete from discover_device_type_task_credential_sets where credential_sets = :cs")
					.setParameter("cs", id)
					.executeUpdate();
			session.delete(credentialSet);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted.", credentialSet);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (Exception e) {
			session.getTransaction().rollback();
			log.error("Unable to delete the credentials {}", id, e);
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
	 * @param credentialSet the credential set
	 * @return the device credential set
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/credentialsets")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a credential set",
		description = "Creates a credential set, which then can be used to authenticate against the devices."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public DeviceCredentialSet addCredentialSet(DeviceCredentialSet credentialSet)
			throws WebApplicationException {
		log.debug("REST request, add credentials.");
		if (credentialSet.getName() == null || credentialSet.getName().trim().equals("")) {
			log.error("Invalid credential set name.");
			throw new NetshotBadRequestException("Invalid name for the credential set",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_CREDENTIALS_NAME);
		}
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			if (credentialSet.getMgmtDomain() != null) {
				credentialSet.setMgmtDomain(session.load(Domain.class, credentialSet.getMgmtDomain().getId()));
			}
			credentialSet.setDeviceSpecific(false);
			session.save(credentialSet);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created.", credentialSet);
			session.refresh(credentialSet);
			this.suggestReturnCode(Response.Status.CREATED);
			credentialSet.removeSensitive();
			return credentialSet;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			Throwable t = e.getCause();
			log.error("Can't add the credentials.", e);
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a credential set",
		description = "Edits a credential set, by ID."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public DeviceCredentialSet setCredentialSet(@PathParam("id") @Parameter(description = "Credential set ID") Long id,
			DeviceCredentialSet rsCredentialSet) throws WebApplicationException {
		log.debug("REST request, edit credentials {}", id);
		Session session = Database.getSession();
		DeviceCredentialSet credentialSet;
		try {
			session.beginTransaction();
			credentialSet = (DeviceCredentialSet) session.get(
					rsCredentialSet.getClass(), id);
			if (credentialSet == null) {
				log.error("Unable to find the credential set {}.", id);
				throw new NetshotBadRequestException(
						"Unable to find the credential set.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_CREDENTIALS);
			}
			if (!credentialSet.getClass().equals(rsCredentialSet.getClass())) {
				log.error("Wrong posted credential type for credential set {}.", id);
				throw new NetshotBadRequestException(
						"The posted credential type doesn't match the existing one.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_CREDENTIALS_TYPE);
			}
			if (rsCredentialSet.getMgmtDomain() == null) {
				credentialSet.setMgmtDomain(null);
			}
			else {
				credentialSet.setMgmtDomain((Domain) session.get(Domain.class, rsCredentialSet.getMgmtDomain().getId()));
			}
			credentialSet.setName(rsCredentialSet.getName());
			if (credentialSet.getName() == null || credentialSet.getName().trim().equals("")) {
				log.error("Invalid credential set name.");
				throw new NetshotBadRequestException("Invalid name for the credential set",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_CREDENTIALS_NAME);
			}
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
				DeviceSnmpv3Community rsSnmp3 = (DeviceSnmpv3Community)rsCredentialSet;
				((DeviceSnmpv3Community) credentialSet).setUsername(rsSnmp3.getUsername());
				((DeviceSnmpv3Community) credentialSet).setAuthType(rsSnmp3.getAuthType());
				if (!rsSnmp3.getAuthKey().equals("-")) {
					((DeviceSnmpv3Community) credentialSet).setAuthKey(rsSnmp3.getAuthKey());
				}
				((DeviceSnmpv3Community) credentialSet).setPrivType(rsSnmp3.getPrivType());
				if (!rsSnmp3.getPrivKey().equals("-")) {
					((DeviceSnmpv3Community) credentialSet).setPrivKey(rsSnmp3.getPrivKey());
				}
				
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
			log.error("Unable to save the credentials {}.", id, e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String driver;

		/** The query. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String query;
	}

	/**
	 * The Class RsSearchResults.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsSearchResults {

		/** The query. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String query;

		/** The devices. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private List<RsLightDevice> devices;
	}

	/**
	 * Search devices.
	 *
	 * @param criteria the criteria
	 * @return the rs search results
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/devices/search")
	@RolesAllowed("readonly")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Search for devices",
		description = "Find devices using a string-based query."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public RsSearchResults searchDevices(RsSearchCriteria criteria)
			throws WebApplicationException {
		log.debug("REST request, search devices, query '{}', driver '{}'.",
				criteria.getQuery(), criteria.getDriver());
		
		DeviceDriver driver = DeviceDriver.getDriverByName(criteria.getDriver());
		try {
			Finder finder = new Finder(criteria.getQuery(), driver);
			Session session = Database.getSession();
			try {
				@SuppressWarnings("unchecked")
				Query<RsLightDevice> query = session.createQuery(LIGHTDEVICELIST_BASEQUERY
						+ finder.getHql());
				finder.setVariables(query);
				query.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING);
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
				log.error("Error while searching for the devices.", e);
				throw new NetshotBadRequestException("Unable to fetch the devices",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		catch (FinderParseException e) {
			log.warn("User's query is invalid.", e);
			throw new NetshotBadRequestException("Invalid search string. "
					+ e.getMessage(),
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SEARCH_STRING);
		}
	}

	/**
	 * Adds the group.
	 *
	 * @param deviceGroup the device group
	 * @return the device group
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/groups")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a device group",
		description = "Creates a device group. A group can be either static (fixed list) or dynamic (query-based list)."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public DeviceGroup addGroup(RsDeviceGroup rsGroup)
			throws WebApplicationException {
		log.debug("REST request, add group.");
		String name = rsGroup.getName().trim();
		if (name.isEmpty()) {
			log.warn("User posted an empty group name.");
			throw new NetshotBadRequestException("Invalid group name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP_NAME);
		}

		Session session = Database.getSession();
		try {
			session.beginTransaction();
			DeviceGroup deviceGroup;
			if ("StaticDeviceGroup".equals(rsGroup.getType())) {
				StaticDeviceGroup staticGroup = new StaticDeviceGroup(name);
				Set<Device> devices = new HashSet<>();
				for (Long deviceId : rsGroup.getStaticDevices()) {
					Device device = (Device) session.load(Device.class, deviceId);
					devices.add(device);
				}
				staticGroup.updateCachedDevices(devices);
				deviceGroup = staticGroup;
			}
			else if ("DynamicDeviceGroup".equals(rsGroup.getType())) {
				DynamicDeviceGroup dynamicGroup = new DynamicDeviceGroup(name);
				if (rsGroup.getDriver() != null) {
					dynamicGroup.setDriver(rsGroup.getDriver());
				}
				if (rsGroup.getQuery() != null) {
					dynamicGroup.setQuery(rsGroup.getQuery());
				}
				try {
					dynamicGroup.refreshCache(session);
				}
				catch (FinderParseException e) {
					throw new NetshotBadRequestException(
							"Invalid query for the group definition.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DYNAMICGROUP_QUERY);
				}
				deviceGroup = dynamicGroup;
			}
			else {
				throw new NetshotBadRequestException(
					"Invalid group type.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
			}
			deviceGroup.setFolder(rsGroup.getFolder());
			deviceGroup.setHiddenFromReports(rsGroup.isHiddenFromReports());
			session.save(deviceGroup);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created.", deviceGroup);
			this.suggestReturnCode(Response.Status.CREATED);
			return deviceGroup;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Error while saving the new device group.", e);
			if (this.isDuplicateException(e)) {
				throw new NetshotBadRequestException(
						"A group with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_GROUP);
			}
			throw new NetshotBadRequestException(
					"Unable to add the group to the database",
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
	 * Gets the groups.
	 *
	 * @return the groups
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/groups")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the device groups",
		description = "Returns the list of device groups, including their definition."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public List<DeviceGroup> getGroups(@BeanParam PaginationParams paginationParams) throws WebApplicationException {
		log.debug("REST request, get groups.");
		Session session = Database.getSession(true);
		try {
			Query<DeviceGroup> query =
					session.createQuery("select g from DeviceGroup g", DeviceGroup.class);
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the groups.", e);
			throw new NetshotBadRequestException("Unable to fetch the groups",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets a specific device group.
	 *
	 * @return the group
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/groups/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get a device group",
		description = "Returns a specific group, by ID."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public DeviceGroup getGroup(@PathParam("id") @Parameter(description = "Group ID") Long id) throws WebApplicationException {
		log.debug("REST request, get group.");
		Session session = Database.getSession(true);
		try {
			Query<DeviceGroup> query = session
				.createQuery("select g from DeviceGroup g where g.id = :id", DeviceGroup.class)
				.setParameter("id", id);
			DeviceGroup group = query.uniqueResult();
			if (group == null) {
				log.warn("Unable to find the device group.");
				throw new WebApplicationException(
						"Unable to find the device group",
						javax.ws.rs.core.Response.Status.NOT_FOUND);
			}
			return group;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the group.", e);
			throw new NetshotBadRequestException("Unable to fetch the group",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Delete group.
	 *
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/groups/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove a device group",
		description = "Removes a device group. This doesn't remove the devices themselves."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public void deleteGroup(@PathParam("id") @Parameter(description = "Group ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, delete group {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			DeviceGroup deviceGroup = (DeviceGroup) session.load(DeviceGroup.class, id);
			// Remove the linked tasks
			for (Class<? extends Task> taskClass : Task.getTaskClasses()) {
				if (GroupBasedTask.class.isAssignableFrom(taskClass)) {
					session.createQuery(
							String.format("delete from %s t where t.deviceGroup = :group", taskClass.getSimpleName()))
						.setParameter("group", deviceGroup)
						.executeUpdate();
				}
			}
			// Remove the software rules
			session
				.createQuery("delete from SoftwareRule r where r.targetGroup = :group")
				.setParameter("group", deviceGroup)
				.executeUpdate();
			// Remove the hardware rules
			session
				.createQuery("delete from HardwareRule r where r.targetGroup = :group")
				.setParameter("group", deviceGroup)
				.executeUpdate();
			// Unset from diagnostics
			session
				.createQuery("update Diagnostic dc set dc.targetGroup = null where dc.targetGroup = :group")
				.setParameter("group", deviceGroup)
				.executeUpdate();
			// Remove from the policies using native SQL
			session
				.createNativeQuery("delete from policy_target_groups where target_groups = :id")
				.setParameter("id", id)
				.executeUpdate();
			// Remove the group
			session
				.createQuery("delete from DeviceGroup g where g = :group")
				.setParameter("group", deviceGroup)
				.executeUpdate();
			session.getTransaction().commit();
			Netshot.aaaLogger.info("Device group ID {} has been deleted.", id);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("The group {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The group doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Unable to delete the group {}.", id, e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id = -1;

		/** The name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String name;

		/** The type. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String type;

		/** The static devices. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private List<Long> staticDevices = new ArrayList<>();

		/** The device class name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String driver;

		/** The query. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String query;

		/** The folder. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String folder = "";

		/** Hide the group in reports. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean hiddenFromReports = false;

	}

	/**
	 * Sets the group.
	 *
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a device group",
		description = "Edits a device group, by ID."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public DeviceGroup setGroup(@PathParam("id") @Parameter(description = "Group ID") Long id, RsDeviceGroup rsGroup)
			throws WebApplicationException {
		log.debug("REST request, edit group {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			DeviceGroup group = (DeviceGroup) session.get(DeviceGroup.class, id);
			if (group == null) {
				log.error("Unable to find the group {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this group.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
			}
			if (group instanceof StaticDeviceGroup) {
				StaticDeviceGroup staticGroup = (StaticDeviceGroup) group;
				Set<Device> devices = new HashSet<>();
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
			String name = rsGroup.getName().trim();
			if (name.isEmpty()) {
				log.warn("User posted an empty group name.");
				throw new NetshotBadRequestException("Invalid group name.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP_NAME);
			}
			group.setName(name);
			group.setFolder(rsGroup.getFolder());
			group.setHiddenFromReports(rsGroup.isHiddenFromReports());
			session.update(group);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited.", group);
			return group;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("Unable to find a device while editing group {}.", id, e);
			throw new NetshotBadRequestException(
					"Unable to find a device. Refresh and try again.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE_IN_STATICGROUP);
		}
		catch (PersistenceException e) {
			session.getTransaction().rollback();
			log.error("Unable to save the group {}.", id, e);
			if (this.isDuplicateException(e)) {
				throw new NetshotBadRequestException(
						"A group with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_GROUP);
			}
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
	 * The Class RsTask.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsTask {

		/** The id. */
		@Schema(description = "Task unique ID")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id;

		/** The cancelled status. */
		@Schema(description = "Set to cancel the task")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean cancelled = false;

		/** The type. */
		@Schema(description = "Type of task")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String type = "";

		/** The group. */
		@Schema(description = "The group ID for group-based task")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Long group = 0L;

		/** The device. */
		@Schema(description = "The device ID for device-based task")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Long device = 0L;

		/** The domain. */
		@Schema(description = "The domain ID when applicable")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Long domain = 0L;

		/** The subnets. */
		@Schema(description = "Subnets to scan (comma, space or new line separated)")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String subnets = "";

		/** The schedule reference. */
		@Schema(description = "Scheduling reference date for scheduled task")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Date scheduleReference = new Date();

		/** The schedule type. */
		@Schema(description = "Scheduling mode (ASAP, once, recurring...)")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Task.ScheduleType scheduleType = ScheduleType.ASAP;

		/** The schedule factor */
		@Schema(description = "Scheduling factor for recurring task")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private int scheduleFactor = 1;

		/** The comments. */
		@Schema(description = "Task comment")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String comments = "";

		@Schema(description = "Ignore devices that had a successful snapshot in the last given hours")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private int limitToOutofdateDeviceHours = -1;
		
		@Schema(description = "Purge tasks older than this number of days")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private int daysToPurge = 90;
		
		@Schema(description = "Purge configurations older than this number of days")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private int configDaysToPurge = -1;
		
		@Schema(description = "Purge configurations bigger than this size (KB)")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private int configSizeToPurge = 0;
		
		@Schema(description = "When purging old configurations, keep a configuration every n days")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private int configKeepDays = 0;
		
		@Schema(description = "The script to execute")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String script = "";
		
		@Schema(description = "The device driver to use")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String driver;

		@Schema(description = "The user inputs for the script")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Map<String, String> userInputs;
		
		@Schema(description = "Enable task debugging")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean debugEnabled = false;

		/** Disable automatic diagnostic task (applies to snapshot tasks) */
		@Schema(description = "Disable automatic diagnostic task (applies to snapshot tasks)")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean dontRunDiagnostics = false;

		/** Disable automatic check compliance task (applies to snapshot and diagnostic tasks)  */
		@Schema(description = "Disable automatic check compliance task (applies to snapshot and diagnostic tasks)")
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean dontCheckCompliance = false;
	}

	/**
	 * Sets the task.
	 *
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a task",
		description = "Edits a task, by ID. Set 'cancel' property to true to cancel the task."
	)
	@Tag(name = "Tasks", description = "Task management")
	public Task setTask(@PathParam("id") @Parameter(description = "Task ID") Long id, RsTask rsTask)
			throws WebApplicationException {
		log.debug("REST request, edit task {}.", id);
		Task task = null;
		Session session = Database.getSession();
		try {
			task = (Task) session.get(Task.class, id);
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the task {}.", id, e);
			throw new NetshotBadRequestException("Unable to fetch the task.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}

		if (task == null) {
			log.error("Unable to find the task {}.", id);
			throw new NetshotBadRequestException("Unable to find the task.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
		}

		if (rsTask.isCancelled()) {
			if (task.getStatus() != Task.Status.SCHEDULED) {
				log.error("User is trying to cancel task {} not in SCHEDULE state.",
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
				log.error("Unable to cancel the task {}.", id, e);
				throw new NetshotBadRequestException("Cannot cancel the task.",
						NetshotBadRequestException.Reason.NETSHOT_TASK_CANCEL_ERROR);
			}
		}

		return task;
	}

	/**
	 * Task status and corresponding count.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsTaskStatusCount {

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Task.Status status;


		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long count;

		public RsTaskStatusCount(Task.Status status, long count) {
			this.status = status;
			this.count = count;
		}
		public RsTaskStatusCount() {
		}
	}

	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsTaskSummary {
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Map<Task.Status, Long> countByStatus = new HashMap<>();


		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private int threadCount = TaskManager.THREAD_COUNT;
	}

	@GET
	@Path("/tasks/summary")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get summary/overview of tasks",
		description = "Retrieves global info about tasks."
	)
	@Tag(name = "Tasks", description = "Task management")
	public RsTaskSummary getTaskSummary() throws WebApplicationException {

		log.debug("REST request, get task summary.");

		RsTaskSummary summary = new RsTaskSummary();
		Session session = Database.getSession(true);
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			List<RsTaskStatusCount> counts = session
				.createQuery("select t.status as status, count(t.id) as count from Task t group by t.status")
				.setResultTransformer(Transformers.aliasToBean(RsTaskStatusCount.class))
				.list();
			for (Task.Status status : Task.Status.values()) {
				summary.getCountByStatus().put(status, 0L);
			}
			for (RsTaskStatusCount taskCount : counts) {
				summary.getCountByStatus().put(taskCount.getStatus(), taskCount.getCount());
			}
			return summary;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the task counts", e);
			throw new NetshotBadRequestException("Unable to fetch the task counts",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Adds a new task.
	 *
	 * @param rsTask the rs task
	 * @return the task
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/tasks")
	@RolesAllowed("operator")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a task",
		description = "Creates a task and schedule it for execution."
	)
	@Tag(name = "Tasks", description = "Task management")
	public Task addTask(@Context HttpServletRequest request,
			@Context SecurityContext securityContext,
			RsTask rsTask) throws WebApplicationException {
		log.debug("REST request, add task.");
		User user = (User) request.getAttribute("user");
		String userName = "";
		try {
			userName = user.getUsername();
		}
		catch (Exception e) {
		}

		Task task;
		if (rsTask.getType().equals("TakeSnapshotTask")) {
			log.trace("Adding a TakeSnapshotTask");
			Device device;
			Session session = Database.getSession();
			try {
				device = (Device) session.get(Device.class, rsTask.getDevice());
				if (device == null) {
					log.error("Unable to find the device {}.", rsTask.getDevice());
					throw new NetshotBadRequestException("Unable to find the device.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
				}
			}
			catch (HibernateException e) {
				log.error("Error while retrieving the device.", e);
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
			log.trace("Adding a RunDeviceScriptTask");
			DeviceDriver driver = DeviceDriver.getDriverByName(rsTask.getDriver());
			if (driver == null) {
				log.error("Unknown device driver {}.", rsTask.getType());
				throw new NetshotBadRequestException("Unknown device driver.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
			}
			if (rsTask.getScript() == null) {
				log.error("The script can't be empty.");
				throw new NetshotBadRequestException("The script can't be empty.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
			}
			Device device;
			Session session = Database.getSession();
			try {
				device = (Device) session.get(Device.class, rsTask.getDevice());
				if (device == null) {
					log.error("Unable to find the device {}.", rsTask.getDevice());
					throw new NetshotBadRequestException("Unable to find the device.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
				}
			}
			catch (HibernateException e) {
				log.error("Error while retrieving the device.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			try {
				DeviceJsScript jsScript = new DeviceJsScript("__toValidate", rsTask.getDriver(), rsTask.getScript(), userName);
				jsScript.validateUserInputs(rsTask.getUserInputs());
			}
			catch (IllegalArgumentException e) {
				log.warn("Invalid script.");
				throw new NetshotBadRequestException(e.getMessage(),
						NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
			}
			task = new RunDeviceScriptTask(device, rsTask.getScript(), driver, rsTask.getComments(), userName);
			((RunDeviceScriptTask) task).setUserInputValues(rsTask.getUserInputs());
		}
		else if (rsTask.getType().equals("RunDeviceGroupScriptTask")) {
			if (!securityContext.isUserInRole("executereadwrite")) {
				throw new NetshotNotAuthorizedException("Insufficient permissions to run scripts on devices.", 0);
			}
			log.trace("Adding a RunDeviceGroupScriptTask");
			DeviceDriver driver = DeviceDriver.getDriverByName(rsTask.getDriver());
			if (driver == null) {
				log.error("Unknown device driver {}.", rsTask.getType());
				throw new NetshotBadRequestException("Unknown device driver.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
			}
			if (rsTask.getScript() == null) {
				log.error("The script can't be empty.");
				throw new NetshotBadRequestException("The script can't be empty.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
			}
			try {
				DeviceJsScript jsScript = new DeviceJsScript("__toValidate", rsTask.getDriver(), rsTask.getScript(), userName);
				jsScript.validateUserInputs(rsTask.getUserInputs());
			}
			catch (IllegalArgumentException e) {
				log.warn("Invalid script.");
				throw new NetshotBadRequestException(e.getMessage(),
						NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
			}
			DeviceGroup group;
			Session session = Database.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					log.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
				}
				task = new RunDeviceGroupScriptTask(group, rsTask.getScript(), driver, rsTask.getComments(), userName);
			((RunDeviceGroupScriptTask) task).setUserInputValues(rsTask.getUserInputs());
			}
			catch (HibernateException e) {
				log.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("CheckComplianceTask")) {
			log.trace("Adding a CheckComplianceTask");
			Device device;
			Session session = Database.getSession();
			try {
				device = (Device) session.get(Device.class, rsTask.getDevice());
				if (device == null) {
					log.error("Unable to find the device {}.", rsTask.getDevice());
					throw new NetshotBadRequestException("Unable to find the device.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
				}
			}
			catch (HibernateException e) {
				log.error("Error while retrieving the device.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			task = new CheckComplianceTask(device, rsTask.getComments(), userName);
		}
		else if (rsTask.getType().equals("TakeGroupSnapshotTask")) {
			log.trace("Adding a TakeGroupSnapshotTask");
			DeviceGroup group;
			Session session = Database.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					log.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
				}
				task = new TakeGroupSnapshotTask(group, rsTask.getComments(), userName,
						rsTask.getLimitToOutofdateDeviceHours(), rsTask.isDontRunDiagnostics(),
						rsTask.isDontCheckCompliance());
			}
			catch (HibernateException e) {
				log.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("CheckGroupComplianceTask")) {
			log.trace("Adding a CheckGroupComplianceTask");
			DeviceGroup group;
			Session session = Database.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					log.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
				}
				task = new CheckGroupComplianceTask(group, rsTask.getComments(), userName);
			}
			catch (HibernateException e) {
				log.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("CheckGroupSoftwareTask")) {
			log.trace("Adding a CheckGroupSoftwareTask");
			DeviceGroup group;
			Session session = Database.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					log.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
				}
				task = new CheckGroupSoftwareTask(group, rsTask.getComments(), userName);
			}
			catch (HibernateException e) {
				log.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("RunGroupDiagnosticsTask")) {
			log.trace("Adding a RunGroupDiagnosticsTask");
			DeviceGroup group;
			Session session = Database.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					log.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
				}
				task = new RunGroupDiagnosticsTask(group, rsTask.getComments(), userName,
					rsTask.isDontCheckCompliance());
			}
			catch (HibernateException e) {
				log.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("ScanSubnetsTask")) {
			if (!securityContext.isUserInRole("readwrite")) {
				throw new NetshotNotAuthorizedException("Insufficient permissions to scan for devices.", 0);
			}
			log.trace("Adding a ScanSubnetsTask");
			Set<Network4Address> subnets = new HashSet<>();
			String[] rsSubnets = rsTask.getSubnets().split("(\r\n|\n|;| |,)");
			Pattern pattern = Pattern.compile("^(?<ip>[0-9\\.]+)(/(?<mask>[0-9]+))?$");
			for (String rsSubnet : rsSubnets) {
				Matcher matcher = pattern.matcher(rsSubnet);
				if (!matcher.find()) {
					log.warn("User posted an invalid subnet '{}'.", rsSubnet);
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
					log.warn("User posted an invalid subnet '{}'.", rsSubnet, e);
					throw new NetshotBadRequestException(String.format("Invalid subnet '%s'.", rsSubnet),
							NetshotBadRequestException.Reason.NETSHOT_INVALID_SUBNET);
				}
				if (subnet.getPrefixLength() < 22 || subnet.getPrefixLength() > 32) {
					log.warn("User posted an invalid prefix length {}.",
							subnet.getPrefix());
					throw new NetshotBadRequestException(String.format("Invalid prefix length for '%s'.", rsSubnet),
							NetshotBadRequestException.Reason.NETSHOT_SCAN_SUBNET_TOO_BIG);
				}
			}
			if (subnets.isEmpty()) {
				log.warn("User posted an invalid subnet list '{}'.", rsTask.getSubnets());
				throw new NetshotBadRequestException(String.format("Invalid subnet list '%s'.", rsTask.getSubnets()),
						NetshotBadRequestException.Reason.NETSHOT_INVALID_SUBNET);
			}
			Domain domain;
			if (rsTask.getDomain() == 0) {
				log.error("Domain {} is invalid (0).", rsTask.getDomain());
				throw new NetshotBadRequestException("Invalid domain",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
			}
			Session session = Database.getSession();
			try {
				domain = (Domain) session.load(Domain.class, rsTask.getDomain());
			}
			catch (Exception e) {
				log.error("Unable to load the domain {}.", rsTask.getDomain());
				throw new NetshotBadRequestException("Invalid domain",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DOMAIN);
			}
			finally {
				session.close();
			}
			StringBuilder target = new StringBuilder();
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
			if (!securityContext.isUserInRole("admin")) {
				throw new NetshotNotAuthorizedException("Insufficient permissions to purge database.", 0);
			}
			log.trace("Adding a PurgeDatabaseTask");
			if (rsTask.getDaysToPurge() < 2) {
				log.error(String.format("Invalid number of days %d for the PurgeDatabaseTask task.", rsTask.getDaysToPurge()));
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
				log.error("The number of days of configurations to purge must be greater than 3.");
				throw new NetshotBadRequestException("The number of days of configurations to purge must be greater than 3.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
			}
			else {
				if (configSize < 0) {
					log.error("The configuration size limit can't be negative.");
					throw new NetshotBadRequestException("The limit on the configuration size can't be negative.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
				}
				if (configKeepDays < 0) {
					log.error("The interval of days between configurations to keep can't be negative.");
					throw new NetshotBadRequestException("The number of days of configurations to purge can't be negative.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
				}
				if (configDays <= configKeepDays) {
					log.error("The number of days of configurations to purge must be greater than the number of days between two successive configurations to keep.");
					throw new NetshotBadRequestException("The number of days of configurations to purge must be greater than the number of days between two successive configurations to keep.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
				}
			}
			task = new PurgeDatabaseTask(rsTask.getComments(), userName, rsTask.getDaysToPurge(),
					configDays, configSize, configKeepDays);
		}
		else if (rsTask.getType().equals("RunDiagnosticsTask")) {
			log.trace("Adding a RunDiagnosticsTask");
			Device device;
			Session session = Database.getSession();
			try {
				device = (Device) session.get(Device.class, rsTask.getDevice());
				if (device == null) {
					log.error("Unable to find the device {}.", rsTask.getDevice());
					throw new NetshotBadRequestException("Unable to find the device.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DEVICE);
				}
			}
			catch (HibernateException e) {
				log.error("Error while retrieving the device.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			task = new RunDiagnosticsTask(device, rsTask.getComments(), userName, rsTask.isDontCheckCompliance());
		}
		else {
			log.error("User posted an invalid task type '{}'.", rsTask.getType());
			throw new NetshotBadRequestException("Invalid task type.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
		}
		if (rsTask.getScheduleReference() != null) {
			task.setDebugEnabled(rsTask.isDebugEnabled());
			task.setScheduleReference(rsTask.getScheduleReference());
			task.setScheduleType(rsTask.getScheduleType());
			task.setScheduleFactor(rsTask.getScheduleFactor());
			if (task.getScheduleType() == ScheduleType.AT) {
				Calendar inOneMinute = Calendar.getInstance();
				inOneMinute.add(Calendar.MINUTE, 1);
				if (task.getScheduleReference().before(inOneMinute.getTime())) {
					log.error(
							"The schedule for the task occurs in less than one minute ({} vs {}).",
							task.getScheduleReference(), inOneMinute.getTime());
					throw new NetshotBadRequestException(
							"The schedule occurs in the past.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
				}
			}
			else if (task.getScheduleFactor() < 1) {
				log.error("The repeating factor {} is invalid.", task.getScheduleFactor());
				throw new NetshotBadRequestException(
						"The repeating factor is invalid.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_TASK);
			}
		}
		try {
			TaskManager.addTask(task);
			Netshot.aaaLogger.info("The task {} has been created.", task);
			this.suggestReturnCode(Response.Status.CREATED);
			return task;
		}
		catch (HibernateException e) {
			log.error("Unable to add the task.", e);
			throw new NetshotBadRequestException(
					"Unable to add the task to the database.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (SchedulerException e) {
			log.error("Unable to schedule the task.", e);
			throw new NetshotBadRequestException("Unable to schedule the task.",
					NetshotBadRequestException.Reason.NETSHOT_SCHEDULE_ERROR);
		}
	}

	/**
	 * The Class RsLightConfig.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsLightConfig {

		/** The device name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String deviceName;

		/** The device id. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long deviceId;

		/** The change date. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Date changeDate;

		/** The author. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String author;

		/** The config id. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id = 0L;
	}

	/**
	 * Get configuration changes with optinal filtering criteria.
	 *
	 * @param startDate = after date filter
	 * @param endDate = before date filter
	 * @param domains = domain filter
	 * @param deviceGroups = group filter
	 * @param paginationParams = pagination parameters
	 * @return the changes
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/configs")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get configuration changes",
		description = "Retrieves a list of configurations, based on given criteria."
	)
	@Tag(name = "Reports", description = "Report and statistics")
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	public List<RsLightConfig> getConfigs(
			@QueryParam("after") @Parameter(description = "Configs gathered after this date (as milliseconds since 1970)") Long startDate,
			@QueryParam("before") @Parameter(description = "Configs gathered before this date (as milliseconds since 1970)") Long endDate,
			@QueryParam("domain") @Parameter(description = "Filter on given domain ID(s)") Set<Long> domains,
			@QueryParam("group") @Parameter(description = "Filter on given group ID(s)") Set<Long> deviceGroups,
			@BeanParam PaginationParams paginationParams)
			throws WebApplicationException {
		log.debug("REST request, config changes.");
		try (Session session = Database.getSession(true)) {
			String hqlQuery = "select distinct ";
			hqlQuery += "c.id as id, c.changeDate as changeDate, c.device.id as deviceId, c.author as author, c.device.name as deviceName ";
			hqlQuery += " from Config c join c.device d ";
			Map<String, Object> hqlParams = new HashMap<>();
			if (!deviceGroups.isEmpty()) {
				hqlQuery += "join d.ownerGroups g ";
				hqlParams.put("groupIds", deviceGroups);
			}
			hqlQuery += " where ";
			if (!domains.isEmpty()) {
				hqlQuery += "d.mgmtDomain.id in (:domainIds) and ";
				hqlParams.put("domainIds", domains);
			}
			if (!deviceGroups.isEmpty()) {
				hqlQuery += "g.id in (:groupIds) and ";
			}
			if (startDate != null) {
				hqlQuery += "c.changeDate >= :startDate and ";
				hqlParams.put("startDate", new Date(startDate));
			}
			if (endDate != null) {
				hqlQuery += "c.changeDate < :endDate and ";
				hqlParams.put("endDate", new Date(endDate));
			}
			hqlQuery += "1 = 1";
			@SuppressWarnings({ "unchecked" })
			Query<RsLightConfig> query = session.createQuery(hqlQuery);
			for (Entry<String, Object> k : hqlParams.entrySet()) {
				query.setParameter(k.getKey(), k.getValue());
			}
			paginationParams.apply(query);
			@SuppressWarnings({ "deprecation" })
			List<RsLightConfig> configs = query
				.setResultTransformer(Transformers.aliasToBean(RsLightConfig.class))
				.list();
			return configs;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the configs", e);
			throw new NetshotBadRequestException("Unable to fetch the configs",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
	}

	/**
	 * Gets the policies.
	 *
	 * @return the policies
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/policies")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the compliance policies",
		description = "Returns the list of compliance policies."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<Policy> getPolicies(@BeanParam PaginationParams paginationParams) throws WebApplicationException {
		log.debug("REST request, get policies.");
		Session session = Database.getSession(true);
		try {
			// Join p.rules to get rule count... not optimal
			Query<Policy> query = session
				.createQuery("select distinct p from Policy p left join fetch p.targetGroups left join fetch p.rules", Policy.class);
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the policies.", e);
			throw new NetshotBadRequestException("Unable to fetch the policies",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the rules of a policy
	 *
	 * @param id the id
	 * @return the policy rules
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/policies/{id}/rules")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the compliance rules of a policy",
		description = "Returns the rules owned by a given compliance policy."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<Rule> getPolicyRules(
			@BeanParam PaginationParams paginationParams,
			@PathParam("id") @Parameter(description = "Policy ID") Long id) throws WebApplicationException {
		log.debug("REST request, get rules for policy {}.", id);
		Session session = Database.getSession(true);
		try {
			Policy policy = (Policy) session.get(Policy.class, id);
			if (policy == null) {
				log.error("Invalid policy.");
				throw new NetshotBadRequestException("Invalid policy",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY);
			}
			Query<Rule> query = session
				.createQuery("from Rule r where r.policy.id = :pid", Rule.class)
				.setParameter("pid", id);
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the rules.", e);
			throw new NetshotBadRequestException("Unable to fetch the rules",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets a specific rule of a specific policy
	 *
	 * @param pid the policy id
	 * @param id the rule id
	 * @return the rule
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/policies/{pid}/rules/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get a specific compliance rule of a specific policy",
		description = "Returns the specific rule owned by a given compliance policy."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public Rule getPolicyRule(
			@PathParam("pid") @Parameter(description = "Policy ID") Long pid,
			@PathParam("id") @Parameter(description = "Rule ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, get rule {}, policy {}.", id, pid);
		Session session = Database.getSession(true);
		try {
			Policy policy = (Policy) session.get(Policy.class, pid);
			if (policy == null) {
				log.error("Invalid policy.");
				throw new NetshotBadRequestException("Invalid policy",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY);
			}
			Rule rule = session
				.createQuery("from Rule r where r.policy.id = :pid and r.id = :rid", Rule.class)
				.setParameter("pid", pid)
				.setParameter("rid", id)
				.uniqueResult();
			if (rule == null) {
				log.warn("Unable to find the rule object.");
				throw new WebApplicationException(
						"Unable to find the rule",
						javax.ws.rs.core.Response.Status.NOT_FOUND);
			}
			return rule;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the rule.", e);
			throw new NetshotBadRequestException("Unable to fetch the rule",
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id = 0;

		/** The name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String name = "";

		/** The groups. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Set<Long> targetGroups = new HashSet<>();

		/**
		 * Instantiates a new rs policy.
		 */
		public RsPolicy() {

		}
	}

	/**
	 * Adds the policy.
	 *
	 * @param rsPolicy the rs policy
	 * @return the policy
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/policies")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a compliance policy",
		description = "Creates a compliance policy."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public Policy addPolicy(RsPolicy rsPolicy) throws WebApplicationException {
		log.debug("REST request, add policy.");
		String name = rsPolicy.getName().trim();
		if (name.isEmpty()) {
			log.warn("User posted an empty policy name.");
			throw new NetshotBadRequestException("Invalid policy name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY_NAME);
		}
		Policy policy;
		Session session = Database.getSession();
		try {
			session.beginTransaction();

			Set<DeviceGroup> groups = new HashSet<>();
			for (Long groupId : rsPolicy.getTargetGroups()) {
				DeviceGroup group = (DeviceGroup) session.get(DeviceGroup.class, groupId);
				groups.add(group);
			}

			policy = new Policy(name, groups);

			session.save(policy);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created.", policy);
			this.suggestReturnCode(Response.Status.CREATED);
			return policy;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("The posted group doesn't exist", e);
			throw new NetshotBadRequestException(
					"Invalid group",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Error while saving the new policy.", e);
			if (this.isDuplicateException(e)) {
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
	}

	/**
	 * Delete policy.
	 *
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/policies/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove a compliance policy",
		description = "Removes a given compliance policy, by ID"
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public void deletePolicy(@PathParam("id") @Parameter(description = "Policy ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, delete policy {}.", id);
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
			log.error("The policy {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The policy doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Unable to delete the policy {}.", id, e);
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a compliance policy",
		description = "Edits a compliance policy, by ID."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public Policy setPolicy(@PathParam("id") @Parameter(description = "Policy ID") Long id, RsPolicy rsPolicy)
			throws WebApplicationException {
		log.debug("REST request, edit policy {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Policy policy = (Policy) session.get(Policy.class, id);
			if (policy == null) {
				log.error("Unable to find the policy {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this policy.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY);
			}

			String name = rsPolicy.getName().trim();
			if (name.isEmpty()) {
				log.warn("User posted an empty policy name.");
				throw new NetshotBadRequestException("Invalid policy name.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY_NAME);
			}
			policy.setName(name);

			// Remove orphan check results
			for (DeviceGroup group : policy.getTargetGroups()) {
				if (!rsPolicy.getTargetGroups().contains(group.getId())) {
					session.createQuery(
						"delete CheckResult cr where cr.key.rule in (select r from Rule r where r.policy.id = :policyId) " +
							"and cr.key.device in (select d from DeviceGroup g join g.cachedDevices d where g.id = :groupId)")
						.setParameter("policyId", policy.getId())
						.setParameter("groupId", group.getId())
						.executeUpdate();
				}
			}
			policy.getTargetGroups().clear();
			for (Long groupId : rsPolicy.getTargetGroups()) {
				DeviceGroup group = (DeviceGroup) session.get(DeviceGroup.class, groupId);
				policy.getTargetGroups().add(group);
			}

			session.update(policy);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited.", policy);
			return policy;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("Unable to find a group to be assigned to the policy {}.", id, e);
			throw new NetshotBadRequestException(
					"Unable to find the group.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Unable to save the policy {}.", id, e);
			if (this.isDuplicateException(e)) {
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id = 0;

		/** The name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String name = null;
		
		/** The type. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String type = "";

		/** The script. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String script = null;

		/** The policy. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long policy = 0;

		/** The enabled. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean enabled = false;

		/** The exemptions. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Map<Long, Date> exemptions = new HashMap<>();
		
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String text = null;
	
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Boolean regExp;
	
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String context = null;

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String driver = null;

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String field = null;

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Boolean anyBlock;

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Boolean matchAll;

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Boolean invert;

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Boolean normalize;
	}

	/**
	 * Adds the js rule.
	 *
	 * @param rsRule the rs rule
	 * @return the rule
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/rules")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a compliance rule",
		description = "Creates a compliance rule. The associated policy must already exist."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public Rule addRule(RsRule rsRule) throws WebApplicationException {
		log.debug("REST request, add rule.");
		if (rsRule.getName() == null || rsRule.getName().trim().isEmpty()) {
			log.warn("User posted an empty rule name.");
			throw new NetshotBadRequestException("Invalid rule name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE_NAME);
		}
		String name = rsRule.getName().trim();

		Session session = Database.getSession();
		try {
			session.beginTransaction();

			Policy policy = (Policy) session.load(Policy.class, rsRule.getPolicy());
			
			Rule rule;
			if ("TextRule".equals(rsRule.getType())) {
				rule = new TextRule(name, policy);
			}
			else if ("JavaScriptRule".equals(rsRule.getType())) {
				rule = new JavaScriptRule(name, policy);
			}
			else if ("PythonRule".equals(rsRule.getType())) {
				rule = new PythonRule(name, policy);
			}
			else {
				throw new NetshotBadRequestException(
					"Invalid rule type.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
			}

			session.save(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created.", rule);
			this.suggestReturnCode(Response.Status.CREATED);
			return rule;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("The posted policy doesn't exist.", e);
			throw new NetshotBadRequestException(
					"Invalid policy.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_POLICY);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Error while saving the new rule.", e);
			if (this.isDuplicateException(e)) {
				throw new NetshotBadRequestException(
						"A rule with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_RULE);
			}
			throw new NetshotBadRequestException(
					"Unable to add the rule to the database",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (NetshotBadRequestException e) {
			session.getTransaction().rollback();
			log.error("Error while saving the new rule.", e);
			throw e;
		}
		finally {
			session.close();
		}
	}

	/**
	 * Sets the rule.
	 *
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a compliance rule",
		description = "Edits a compliance rule, by ID."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public Rule setRule(@PathParam("id") @Parameter(description = "Rule ID") Long id, RsRule rsRule)
			throws WebApplicationException {
		log.debug("REST request, edit rule {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Rule rule = (Rule) session.get(Rule.class, id);
			if (rule == null) {
				log.error("Unable to find the rule {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this rule.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
			}

			if (rsRule.getName() != null) {
				String name = rsRule.getName().trim();
				if (name.isEmpty()) {
					log.warn("User posted an empty rule name.");
					throw new NetshotBadRequestException("Invalid rule name.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE_NAME);
				}
				rule.setName(name);
			}
			rule.setEnabled(rsRule.isEnabled());

			Map<Long, Date> postedExemptions = new HashMap<>();
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
			else if (rule instanceof PythonRule) {
				if (rsRule.getScript() != null) {
					String script = rsRule.getScript().trim();
					((PythonRule) rule).setScript(script);
				}
			}
			else if (rule instanceof TextRule) {
				if (rsRule.getText() != null) {
					((TextRule) rule).setText(rsRule.getText());
				}
				if (rsRule.getRegExp() != null) {
					((TextRule) rule).setRegExp(rsRule.getRegExp());
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
				if (rsRule.getInvert() != null) {
					((TextRule) rule).setInvert(rsRule.getInvert());
				}
				if (rsRule.getMatchAll() != null) {
					((TextRule) rule).setMatchAll(rsRule.getMatchAll());
				}
				if (rsRule.getAnyBlock() != null) {
					((TextRule) rule).setAnyBlock(rsRule.getAnyBlock());
				}
				if (rsRule.getNormalize() != null) {
					((TextRule) rule).setNormalize(rsRule.getNormalize());
				}
			}

			session.update(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited.", rule);
			return rule;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Error while saving the new rule.", e);
			if (this.isDuplicateException(e)) {
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
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/rules/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove a compliance rule",
		description = "Removes a compliance rule, by ID."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public void deleteRule(@PathParam("id") @Parameter(description = "Rule ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, delete rule {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Rule rule = (Rule) session.load(Rule.class, id);
			/* HACK! In JPA, this would require updating each task one by one... */
			session
					.createNativeQuery("delete from check_result where rule = :r")
					.setParameter("r", id)
					.executeUpdate();
			session.delete(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted.", rule);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("The rule {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The rule doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Unable to delete the rule {}.", id, e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long device = 0;

	}

	/**
	 * The Class RsRuleTestResult.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsRuleTestResult {

		/** The result. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private CheckResult.ResultOption result;

		/** The script error. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String scriptError;

		/** Result comment. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String comment;

	}

	/**
	 * Test rule.
	 *
	 * @param rsRule the rs rule
	 * @return the rule test result
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/rules/test")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Test a compliance rule",
		description = "Test a compliance rule against a given device, in dry run mode."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public RsRuleTestResult testRule(RsRuleTest rsRule) throws WebApplicationException {
		log.debug("REST request, rule test.");
		Device device;
		Session session = Database.getSession(true);
		RsRuleTestResult result = new RsRuleTestResult();
		try {
			device = (Device) session
					.createQuery("from Device d join fetch d.lastConfig where d.id = :id")
					.setParameter("id", rsRule.getDevice())
					.uniqueResult();
			if (device == null) {
				log.warn("Unable to find the device {}.", rsRule.getDevice());
				result.setResult(CheckResult.ResultOption.NOTAPPLICABLE);
				result.setComment("Unable to find the device");
				return result;
			}
			
			Rule rule;
			
			if ("TextRule".equals(rsRule.getType())) {
				TextRule txRule = new TextRule("TEST", null);
				txRule.setDeviceDriver(rsRule.getDriver());
				txRule.setField(rsRule.getField());
				txRule.setInvert(rsRule.getInvert());
				txRule.setContext(rsRule.getContext());
				txRule.setRegExp(rsRule.getRegExp());
				txRule.setText(rsRule.getText());
				txRule.setAnyBlock(rsRule.getAnyBlock());
				txRule.setMatchAll(rsRule.getMatchAll());
				txRule.setNormalize(rsRule.getNormalize());
				rule = txRule;
			}
			else if ("JavaScriptRule".equals(rsRule.getType())) {
				JavaScriptRule jsRule = new JavaScriptRule("TEST", null);
				jsRule.setScript(rsRule.getScript());
				rule = jsRule;
			}
			else if ("PythonRule".equals(rsRule.getType())) {
				PythonRule pyRule = new PythonRule("TEST", null);
				pyRule.setScript(rsRule.getScript());
				rule = pyRule;
			}
			else {
				log.warn("Invalid rule type {}.", rsRule.getType());
				throw new NetshotBadRequestException("Invalid rule type",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
			}


			StringBuilder log = new StringBuilder();
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
			CheckResult check = rule.check(device, session, taskLogger);
			result.setResult(check.getResult());
			result.setScriptError(log.toString());
			result.setComment(check.getComment());

			return result;
		}
		catch (NetshotBadRequestException e) {
			throw e;
		}
		catch (Exception e) {
			log.error("Unable to retrieve the device {}.", rsRule.getDevice(), e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Date expirationDate;
	}

	/**
	 * Gets the exempted devices.
	 *
	 * @param id the id
	 * @return the exempted devices
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/rule/{id}/exempteddevices")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the exempted devices of a compliance rule",
		description = "Returns the list of devices which have an exemption against a given compliance rule, by ID."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<RsLightExemptedDevice> getExemptedDevices(@BeanParam PaginationParams paginationParams,
			@PathParam("id") @Parameter(description = "Rule ID") Long id) throws WebApplicationException {
		log.debug("REST request, get exemptions for rule {}.", id);
		Session session = Database.getSession(true);
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			Query<RsLightExemptedDevice> query = session
				.createQuery(LIGHTDEVICELIST_BASEQUERY + ", e.expirationDate as expirationDate from Exemption e join e.key.device d where e.key.rule.id = :id")
				.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING)
				.setParameter("id", id)
				.setResultTransformer(Transformers.aliasToBean(RsLightExemptedDevice.class));
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the exemptions.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id = 0;

		/** The rule name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String ruleName = "";

		/** The policy name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String policyName = "";

		/** The result. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private CheckResult.ResultOption result;

		/** The comment. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String comment = "";

		/** The check date. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Date checkDate;

		/** The expiration date. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Date expirationDate;
	}

	/**
	 * Gets the device compliance results.
	 *
	 * @param id the id
	 * @return the device compliance
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}/complianceresults")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the compliance results for a device",
		description = "Returns the compliance results for a give device, by ID."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<RsDeviceRule> getDeviceComplianceResults(@BeanParam PaginationParams paginationParams,
			@PathParam("id") @Parameter(description = "Device ID") Long id) throws WebApplicationException {
		log.debug("REST request, get compliance results for device {}.", id);
		Session session = Database.getSession(true);
		try {
			@SuppressWarnings({ "deprecation", "unchecked" })
			Query<RsDeviceRule> query = session.createQuery(
					"select r.id as id, r.name as ruleName, p.name as policyName, cr.result as result, cr.checkDate as checkDate, cr.comment as comment, " +
					"e.expirationDate as expirationDate from Rule r join r.policy p join p.targetGroups g join g.cachedDevices d1 with d1.id = :id " +
					"left join CheckResult cr with cr.key.rule.id = r.id and cr.key.device.id = :id left join r.exemptions e with e.key.device.id = :id")
				.setParameter("id", id)
				.setResultTransformer(Transformers.aliasToBean(RsDeviceRule.class));
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the rules.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long changeCount;

		/** The change day. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Date changeDay;
	}

	/**
	 * Gets the last7 days changes by day stats.
	 *
	 * @return the last7 days changes by day stats
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/reports/last7dayschangesbyday")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the number of configuration changes for the last 7 days",
		description = "Returns the number of device configuration changes per day, for the last 7 days."
	)
	@Deprecated
	public List<RsConfigChangeNumberByDateStat> getLast7DaysChangesByDayStats(@QueryParam("tz") String jsTimeZone) throws WebApplicationException {
		log.debug("REST request, get last 7 day changes by day stats.");
		Session session = Database.getSession(true);

		TimeZone timeZone = TimeZone.getDefault();
		try {
			timeZone = TimeZone.getTimeZone(jsTimeZone);
		}
		catch (Exception e) {
			log.warn("Unable to parse timezone '{}'", jsTimeZone);
		}
		Calendar today = Calendar.getInstance(timeZone);
		today.set(Calendar.HOUR_OF_DAY, 0);
		today.set(Calendar.MINUTE, 0);
		today.set(Calendar.SECOND, 0);
		today.set(Calendar.MILLISECOND, 0);
		try {
			List<RsConfigChangeNumberByDateStat> stats = new ArrayList<>();
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
			log.error("Unable to get the stats.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long groupId;

		/** The group name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String groupName;

		/** The group folder. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String groupFolder;

		/** The compliant device count. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long compliantDeviceCount;

		/** The device count. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long deviceCount;
	}

	/**
	 * Gets the group config compliance stats.
	 *
	 * @return the group config compliance stats
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/reports/groupconfigcompliancestats")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the compliance status of a device group",
		description = "Returns the compliance status of a given device group, by ID."
	)
	@Tag(name = "Reports", description = "Report and statistics")
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<RsGroupConfigComplianceStat> getGroupConfigComplianceStats(
			@QueryParam("domain") @Parameter(description = "Filter on given domain ID(s)") Set<Long> domains,
			@QueryParam("group") @Parameter(description = "Filter on given group ID(s)") Set<Long> deviceGroups,
			@QueryParam("policy") @Parameter(description = "Filter on given policy ID(s)") Set<Long> policies)
			throws WebApplicationException {
		log.debug("REST request, group config compliance stats.");
		Session session = Database.getSession(true);
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
			log.error("Unable to get the stats.", e);
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

		@XmlElement @JsonView(DefaultView.class)
		public Date getEoxDate() {
			return eoxDate;
		}
		public void setEoxDate(Date date) {
			this.eoxDate = date;
		}
		@XmlElement @JsonView(DefaultView.class)
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the global hardware support status",
		description = "Returns the global hardware support status, i.e. a list of End-of-Life and End-of-Sale dates with the corresponding device count."
	)
	@Tag(name = "Reports", description = "Report and statistics")
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<RsHardwareSupportStat> getHardwareSupportStats() throws WebApplicationException {
		log.debug("REST request, hardware support stats.");
		Session session = Database.getSession(true);
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
			List<RsHardwareSupportStat> stats = new ArrayList<>();
			stats.addAll(eosStats);
			stats.addAll(eolStats);
			return stats;
		}
		catch (HibernateException e) {
			log.error("Unable to get the stats.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long groupId;

		/** The group name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String groupName;

		/** The gold device count. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long goldDeviceCount;

		/** The silver device count. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long silverDeviceCount;

		/** The bronze device count. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long bronzeDeviceCount;

		/** The device count. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long deviceCount;
	}

	/**
	 * Gets the group software compliance stats.
	 *
	 * @return the group software compliance stats
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/reports/groupsoftwarecompliancestats")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the global software compliance status",
		description = "Returns the software compliance status of devices, optionally filtered by a list of device domains."
	)
	@Tag(name = "Reports", description = "Report and statistics")
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<RsGroupSoftwareComplianceStat> getGroupSoftwareComplianceStats(
			@QueryParam("domain") @Parameter(description = "Filter on given domain ID(s)") Set<Long> domains)
			throws WebApplicationException {
		log.debug("REST request, group software compliance stats.");
		Session session = Database.getSession(true);
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
			log.error("Unable to get the stats.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String ruleName;

		/** The policy name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String policyName;

		/** The check date. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Date checkDate;

		/** The result. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private ResultOption result;
	}
	

	/**
	 * Gets the configuration compliance results.
	 *
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the configuration compliance status of devices",
		description = "Returns the configuration compliance status of devices; optionally filtered by domain, group, policy or compliance level."
	)
	@Tag(name = "Reports", description = "Report and statistics")
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<RsLightPolicyRuleDevice> getConfigComplianceDeviceStatuses(
			@QueryParam("domain") @Parameter(description = "Filter on given domain ID(s)") Set<Long> domains,
			@QueryParam("group") @Parameter(description = "Filter on given group ID(s)") Set<Long> groups,
			@QueryParam("policy") @Parameter(description = "Filter on given policy ID(s)") Set<Long> policies,
			@QueryParam("result") @Parameter(description = "Filter on given result(s)") Set<CheckResult.ResultOption> results)
			throws WebApplicationException {

		log.debug("REST request, config compliant device statuses.");
		Session session = Database.getSession(true);
		try {
			String hqlQuery = "";
			hqlQuery += LIGHTDEVICELIST_BASEQUERY;
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
			query.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING);
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
			log.error("Unable to get the devices.", e);
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
	 * @param id the id
	 * @return the group config non compliant devices
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/reports/groupconfignoncompliantdevices/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the non compliant devices of a group",
		description = "Returns the list of non-compliance devices part of a given group, optionally filtered by domains and policies"
	)
	@Tag(name = "Reports", description = "Report and statistics")
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<RsLightPolicyRuleDevice> getGroupConfigNonCompliantDevices(
			@PathParam("id") @Parameter(description = "Group ID") Long id,
			@QueryParam("domain") @Parameter(description = "Filter on given domain ID(s)") Set<Long> domains,
			@QueryParam("policy") @Parameter(description = "Filter on given policy ID(s)") Set<Long> policies)
			throws WebApplicationException {
		log.debug("REST request, group config non compliant devices.");
		Session session = Database.getSession(true);
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
				.createQuery(LIGHTDEVICELIST_BASEQUERY + ", p.name as policyName, r.name as ruleName, ccr.checkDate as checkDate, ccr.result as result from Device d "
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
			log.error("Unable to get the devices.", e);
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the End-of-Life or End-of-Sale devices matching a date.",
		description = "Returns the list of devices getting End-of-Life (type 'eol') or End-of-Sale (type 'eos') at the given date (or never if 'date' is not given)."
	)
	@Tag(name = "Reports", description = "Report and statistics")
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<RsLightDevice> getHardwareStatusDevices(
		@PathParam("type") @Parameter(description = "eos (end-of-sale) or eol (end-of-life), type of date") String type,
		@PathParam("date") @Parameter(description = "EoX date to filter on") Long date) throws WebApplicationException {
		log.debug("REST request, EoX devices by type and date.");
		if (!type.equals("eol") && !type.equals("eos")) {
			log.error("Invalid requested EoX type.");
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		Date eoxDate = new Date(date);
		Session session = Database.getSession(true);
		try {
			if (date == 0) {
				@SuppressWarnings({ "deprecation", "unchecked" })
				List<RsLightDevice> devices = session
					.createQuery(LIGHTDEVICELIST_BASEQUERY + "from Device d where d." + type + "Date is null and d.status = :enabled")
					.setParameter("enabled", Device.Status.INPRODUCTION)
					.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING)
					.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class))
					.list();
				return devices;
			}
			else {
				@SuppressWarnings({ "deprecation", "unchecked" })
				List<RsLightDevice> devices = session
					.createQuery(LIGHTDEVICELIST_BASEQUERY + "from Device d where date(d." + type + "Date) = :eoxDate and d.status = :enabled")
					.setParameter("eoxDate", eoxDate)
					.setParameter("enabled", Device.Status.INPRODUCTION)
					.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING)
					.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class))
					.list();
				return devices;
			}
		}
		catch (HibernateException e) {
			log.error("Unable to get the devices.", e);
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
	 * @return the harware rules
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/hardwarerules")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the hardware compliance rules",
		description = "Returns the list of hardware compliance rules."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<HardwareRule> getHardwareRules() throws WebApplicationException {
		log.debug("REST request, hardware rules.");
		Session session = Database.getSession(true);
		try {
			List<HardwareRule> rules = session
				.createQuery("from HardwareRule r left join fetch r.targetGroup g", HardwareRule.class)
				.list();
			return rules;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the hardware rules.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id;

		/** The group. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long group = -1;

		/** The device class name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String driver = "";

		/** The part number. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String partNumber = "";

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean partNumberRegExp = false;

		/** The family. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String family = "";

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean familyRegExp = false;

		@Getter(onMethod=@__({
			@XmlElement(nillable = true), @JsonView(DefaultView.class)
		}))
		@Setter
		private Date endOfSale = null;

		@Getter(onMethod=@__({
			@XmlElement(nillable = true), @JsonView(DefaultView.class)
		}))
		@Setter
		private Date endOfLife = null;
	}

	/**
	 * Adds an hardware rule.
	 *
	 * @param rsRule the rs rule
	 * @return the hardware rule
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/hardwarerules")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add an hardware compliance rule",
		description = "Creates an hardware compliance rule."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public HardwareRule addHardwareRule(RsHardwareRule rsRule) throws WebApplicationException {
		log.debug("REST request, add hardware rule.");

		HardwareRule rule;
		Session session = Database.getSession();
		try {
			session.beginTransaction();

			DeviceGroup group = null;
			if (rsRule.getGroup() != -1) {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsRule.getGroup());
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
			return rule;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("The posted group doesn't exist", e);
			throw new NetshotBadRequestException(
					"Invalid group",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Error while saving the new rule.", e);
			throw new NetshotBadRequestException(
					"Unable to add the rule to the database",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}


	/**
	 * Delete hardware rule.
	 *
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/hardwarerules/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove an hardware compliance rule",
		description = "Removes an hardware compliance rule, by ID."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public void deleteHardwareRule(@PathParam("id") @Parameter(description = "Hardware rule ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, delete hardware rule {}.", id);
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
			log.error("The rule {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The rule doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Unable to delete the rule {}.", id, e);
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update an hardware compliance rule",
		description = "Edits an hardware compliance rule, by ID."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public HardwareRule setHardwareRule(
			@PathParam("id") @Parameter(description = "Hardware rule ID") Long id,
			RsHardwareRule rsRule)
			throws WebApplicationException {
		log.debug("REST request, edit hardware rule {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			HardwareRule rule = (HardwareRule) session.get(HardwareRule.class, id);
			if (rule == null) {
				log.error("Unable to find the rule {} to be edited.", id);
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
				group = (DeviceGroup) session.get(DeviceGroup.class, rsRule.getGroup());
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
			log.error("Error while saving the rule.", e);
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
	 * @return the software rules
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/softwarerules")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the software compliance rules",
		description = "Returns the list of software compliance rules."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<SoftwareRule> getSoftwareRules(@BeanParam PaginationParams paginationParams) throws WebApplicationException {
		log.debug("REST request, software rules.");
		Session session = Database.getSession(true);
		try {
			Query<SoftwareRule> query = session
				.createQuery("from SoftwareRule r left join fetch r.targetGroup g order by r.priority asc", SoftwareRule.class);
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the software rules.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id;

		/** The group. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long group = -1;

		/** The device class name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String driver = "";

		/** The version. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String version = "";

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean versionRegExp = false;

		/** The family. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String family = "";

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean familyRegExp = false;

		/** The part number. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String partNumber = "";

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean partNumberRegExp = false;

		/** The level. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private SoftwareRule.ConformanceLevel level = ConformanceLevel.GOLD;
	}

	/**
	 * Creates a software rule.
	 *
	 * @param rsRule the rs rule
	 * @return the software rule
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/softwarerules")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a software compliance rule",
		description = "Creates a software compliance rule."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public SoftwareRule addSoftwareRule(RsSoftwareRule rsRule) throws WebApplicationException {
		log.debug("REST request, add software rule.");

		SoftwareRule rule;
		Session session = Database.getSession();
		try {
			session.beginTransaction();

			DeviceGroup group = null;
			if (rsRule.getGroup() != -1) {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsRule.getGroup());
			}
			
			String driver = rsRule.getDriver(); 
			if (DeviceDriver.getDriverByName(driver) == null) {
				driver = null;
			}

			rule = new SoftwareRule(Double.MAX_VALUE, group, driver,
					rsRule.getFamily(), rsRule.isFamilyRegExp(), rsRule.getVersion(),
					rsRule.isVersionRegExp(), rsRule.getPartNumber(), rsRule.isPartNumberRegExp(),
					rsRule.getLevel());

			session.save(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created", rule);
			this.suggestReturnCode(Response.Status.CREATED);
			return rule;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("The posted group doesn't exist", e);
			throw new NetshotBadRequestException(
					"Invalid group",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Error while saving the new rule.", e);
			throw new NetshotBadRequestException(
					"Unable to add the policy to the database",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Delete software rule.
	 *
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/softwarerules/{id}")
	@RolesAllowed("readwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove a software compliance rule",
		description = "Removes a software compliance rule, by ID"
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public void deleteSoftwareRule(@PathParam("id") @Parameter(description = "Software rule ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, delete software rule {}.", id);
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
			log.error("The rule {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The rule doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Unable to delete the rule {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the rule.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}


	/**
	 * Updates the software rule.
	 *
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a software compliance rule",
		description = "Edits a software compliance rule."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public SoftwareRule setSoftwareRule(
			@PathParam("id") @Parameter(description = "Software rule ID") Long id,
			RsSoftwareRule rsRule)
			throws WebApplicationException {
		log.debug("REST request, edit software rule {}.", id);
		Session session = Database.getSession();
		SoftwareRule rule = null;
		try {
			session.beginTransaction();
			rule = session.get(SoftwareRule.class, id);
			if (rule == null) {
				log.error("Unable to find the rule {} to be edited.", id);
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
				group = (DeviceGroup) session.get(DeviceGroup.class, rsRule.getGroup());
			}
			rule.setTargetGroup(group);

			rule.setFamily(rsRule.getFamily());
			rule.setFamilyRegExp(rsRule.isFamilyRegExp());
			rule.setVersion(rsRule.getVersion());
			rule.setVersionRegExp(rsRule.isVersionRegExp());
			rule.setPartNumber(rsRule.getPartNumber());
			rule.setPartNumberRegExp(rsRule.isPartNumberRegExp());
			rule.setLevel(rsRule.getLevel());

			session.update(rule);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been edited", rule);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Error while saving the rule.", e);
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
		return rule;
	}



	/**
	 * Sort a software rule.
	 *
	 * @param rsRule the rs rule
	 * @return the software rule
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/softwarerules/{id}/sort")
	@RolesAllowed("readwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Sort a software compliance rule",
		description = "Sorts a software compliance rule by moving it before another one."
	)
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public void sortSoftwareRule(
			@PathParam("id") @Parameter(description = "Software rule ID to move") Long id,
			@QueryParam("next")
				@Parameter(description = "ID of the other rule to move this rule before (omit parameter to place the rule at last position)")
				Long nextId)
			throws WebApplicationException {
		log.debug("REST request, sort software rule.");

		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Query<SoftwareRule> query = session
				.createQuery("from SoftwareRule r order by r.priority asc", SoftwareRule.class);
			List<SoftwareRule> rules = query.list();

			SoftwareRule targetRule = null;
			int nextIndex = -1;
			ListIterator<SoftwareRule> ruleIt = rules.listIterator();
			while (ruleIt.hasNext()) {
				SoftwareRule rule = ruleIt.next();
				if (rule.getId() == id) {
					targetRule = rule;
					ruleIt.remove();
				}
				else if (nextId != null && nextId.equals(rule.getId())) {
					nextIndex = ruleIt.previousIndex();
				}
			}

			if (targetRule == null) {
				log.error("Unable to find the rule {} to be moved.", id);
				throw new NetshotBadRequestException("Unable to find this rule.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
			}
			if (nextIndex == -1 && nextId != null) {
				log.error("Unable to find the previous rule of ID {}.", nextId);
				throw new NetshotBadRequestException("Unable to find this rule.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_RULE);
			}
			if (nextIndex == -1) {
				rules.add(targetRule);
			}
			else {
				rules.add(nextIndex, targetRule);
			}
			double priority = 0;
			for (SoftwareRule rule : rules) {
				priority += 10;
				rule.setPriority(priority);
				session.save(rule);
			}
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been sorted (moved before at index {})", targetRule, nextIndex);

			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Error while saving the new rule.", e);
			throw new NetshotBadRequestException(
					"Unable to add the policy to the database",
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
		@XmlElement @JsonView(DefaultView.class)
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
	 * @param id the id
	 * @param level the level
	 * @return the group devices by software level
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/reports/groupdevicesbysoftwarelevel/{id}/{level}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the devices of a group based on software compliance level",
		description = "Returns the list of devices of a given group by ID, and matching the given software compliance level."
	)
	@Tag(name = "Reports", description = "Report and statistics")
	@Tag(name = "Compliance", description = "Configuration, software, hardware compliance")
	public List<RsLightSoftwareLevelDevice> getGroupDevicesBySoftwareLevel(
			@PathParam("id") @Parameter(description = "Group ID") Long id,
			@PathParam("level") @Parameter(description = "Software compliance level") String level,
			@QueryParam("domain") @Parameter(description = "Filter on given domain ID(s)") Set<Long> domains)
			throws WebApplicationException {
		log.debug("REST request, group {} devices by software level {}.", id, level);
		Session session = Database.getSession(true);

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
				.createQuery(LIGHTDEVICELIST_BASEQUERY + ", d.softwareLevel as softwareLevel "
						+ "from Device d join d.ownerGroups g where g.id = :id and d.softwareLevel = :level and d.status = :enabled" + domainFilter)
				.setParameter("id", id)
				.setParameter("level", filterLevel)
				.setParameter("enabled", Device.Status.INPRODUCTION)
				.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING);
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
			log.error("Unable to get the devices.", e);
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

		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Date lastSuccess;
		
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private Date lastFailure;
	}
	
	@GET
	@Path("/reports/accessfailuredevices")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the devices without successful snapshot over a given period",
		description = "Returns the list of devices which didn't have a successful snapshot over the given number of days, optionally "
			+ "filtered by device domain."
	)
	@Tag(name = "Reports", description = "Report and statistics")
	public List<RsLightAccessFailureDevice> getAccessFailureDevices(
			@QueryParam("days") @Parameter(description = "Look for the given number of last days") Integer days,
			@QueryParam("domain") @Parameter(description = "Filter on given domain ID(s)") Set<Long> domains,
			@BeanParam PaginationParams paginationParams)
			throws WebApplicationException {
		log.debug("REST request, devices without successful snapshot over the last {} days.", days);
		
		if (days == null || days < 1) {
			log.warn("Invalid number of days {} to find the unreachable devices, using 3.", days);
			days = 3;
		}
		
		Session session = Database.getSession(true);

		try {
			Calendar when = Calendar.getInstance();
			when.add(Calendar.DATE, -days);
			
			String domainFilter = "";
			if (domains.size() > 0) {
				domainFilter = "and d.mgmtDomain.id in (:domainIds) ";
			}
			
			@SuppressWarnings("unchecked")
			Query<RsLightAccessFailureDevice> query = session
				.createQuery(LIGHTDEVICELIST_BASEQUERY + ", "
						+ "(select max(t.executionDate) from TakeSnapshotTask t where t.device = d and t.status = :success) as lastSuccess, "
						+ "(select max(t.executionDate) from TakeSnapshotTask t where t.device = d and t.status = :failure) as lastFailure "
						+ "from Device d where d.status = :enabled " + domainFilter
						+ "and (select max(t.executionDate) from TakeSnapshotTask t where t.device = d and t.status = :success) < :when "
						+ "order by lastSuccess desc")
				.setParameter("when", when.getTime())
				.setParameter("success", Task.Status.SUCCESS)
				.setParameter("failure", Task.Status.FAILURE)
				.setParameter("enabled", Device.Status.INPRODUCTION)
				.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING);
			if (domainFilter.length() > 0) {
				query.setParameterList("domainIds", domains);
			}
			paginationParams.apply(query);
			@SuppressWarnings("deprecation")
			List<RsLightAccessFailureDevice> devices = query
				.setResultTransformer(Transformers.aliasToBean(RsLightAccessFailureDevice.class))
				.list();
			return devices;
		}
		catch (HibernateException e) {
			log.error("Unable to get the devices.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String username;

		/** The password. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String password;

		/** The new password. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String newPassword = "";
	}

	/**
	 * Logout.
	 *
	 * @return the boolean
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/user/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "User log out",
		description = "Terminates the current user session (useless when using API tokens)."
	)
	@Tag(name = "Login", description = "Login and password management for standard user")
	public void logout(@Context HttpServletRequest request,
			@PathParam("id") @Parameter(description = "User ID - not used") Long id)
			throws WebApplicationException {
		log.debug("REST logout request.");
		User sessionUser = (User) request.getSession().getAttribute("user");
		HttpSession httpSession = request.getSession();
		httpSession.invalidate();
		Netshot.aaaLogger.warn("User {} has logged out.", sessionUser.getUsername());
		this.suggestReturnCode(Response.Status.NO_CONTENT);
	}

	/**
	 * Sets the password.
	 *
	 * @param rsLogin the rs login
	 * @return the user
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/user/{id}")
	@RolesAllowed("readonly")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a user",
		description = "Edits a given user, by ID, especially the password for a local user."
	)
	@Tag(name = "Login", description = "Login and password management for standard user")
	public UiUser setPassword(RsLogin rsLogin,
			@PathParam("id") @Parameter(description = "User ID") Long id)
			throws WebApplicationException {
		log.debug("REST password change request, username {}.", rsLogin.getUsername());
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
			log.error("Unable to retrieve the user {}.", rsLogin.getUsername(), e);
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
	 * @param rsLogin the rs login
	 * @return the user
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@PermitAll
	@Path("/user")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Log in",
		description = "Logs in (create session) by username and password (useless when using API tokens)."
	)
	@Tag(name = "Login", description = "Login and password management for standard user")
	public UiUser login(RsLogin rsLogin) throws WebApplicationException {
		log.debug("REST authentication request, username {}.", rsLogin.getUsername());
		Netshot.aaaLogger.info("REST authentication request, username {}.", rsLogin.getUsername());

		NetworkAddress remoteAddress = null;
		{
			String address = null;
			try {
				address = request.getHeader("X-Forwarded-For");
				if (address == null) {
					address = request.getRemoteAddr();
				}
				remoteAddress = NetworkAddress.getNetworkAddress(address, 0);
			}
			catch (UnknownHostException e) {
				log.warn("Unable to parse remote address", address);
				try {
					remoteAddress = new Network4Address(0, 0);
				}
				catch (UnknownHostException e1) {
				}
			}
		}

		UiUser user = null;

		Session session = Database.getSession();
		try {
			user = (UiUser) session.bySimpleNaturalId(UiUser.class).load(rsLogin.getUsername());
		}
		catch (HibernateException e) {
			log.error("Unable to retrieve the user {}.", rsLogin.getUsername(), e);
			throw new NetshotBadRequestException("Unable to retrieve the user.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}

		if (user != null && user.isLocal()) {
			if (user.checkPassword(rsLogin.getPassword())) {
				Netshot.aaaLogger.info("Local authentication success for user {} from {}.", rsLogin.getUsername(), remoteAddress);
			}
			else {
				Netshot.aaaLogger.warn("Local authentication failure for user {} from {}.", rsLogin.getUsername(), remoteAddress);
				user = null;
			}
		}
		else {
			UiUser remoteUser = null;
			if (Radius.isAvailable()) {
				remoteUser = Radius.authenticate(rsLogin.getUsername(), rsLogin.getPassword(), remoteAddress);
			}
			if (remoteUser == null && Tacacs.isAvailable()) {
				remoteUser = Tacacs.authenticate(rsLogin.getUsername(), rsLogin.getPassword(), remoteAddress);
			}
			if (remoteUser == null) {
				Netshot.aaaLogger.warn("Remote authentication failure for user {} from {}.", rsLogin.getUsername(), remoteAddress);
			}
			else {
				Netshot.aaaLogger.info("Remote authentication success for user {} from {}.", rsLogin.getUsername(), remoteAddress);
				if (user != null) {
					remoteUser.setLevel(user.getLevel());
					Netshot.aaaLogger.info("Level permission for user {} is locally overriden: {}.", rsLogin.getUsername(), user.getLevel());
				}
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
	 * @return the user
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@RolesAllowed("readonly")
	@Path("/user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the current user",
		description = "Returns the current logged in user."
	)
	@Tag(name = "Login", description = "Login and password management for standard user")
	public UiUser getUser(@Context HttpServletRequest request) throws WebApplicationException {
		UiUser user = (UiUser) request.getAttribute("user");
		return user;
	}

	/**
	 * Gets the users.
	 *
	 * @return the users
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/users")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the users",
		description = "Returns the list of Netshot users."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public List<UiUser> getUsers(@BeanParam PaginationParams paginationParams) throws WebApplicationException {
		log.debug("REST request, get user list.");
		Session session = Database.getSession(true);
		try {
			Query<UiUser> query = session.createQuery("from onl.netfishers.netshot.aaa.UiUser", UiUser.class);
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to retrieve the users.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id;

		/** The username. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String username;

		/** The password. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String password;

		/** The level. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private int level;

		/** The local. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean local;
	}

	/**
	 * Adds the user.
	 *
	 * @param rsUser the rs user
	 * @return the user
	 */
	@POST
	@Path("/users")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a user to Netshot",
		description = "Create a Netshot user."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public UiUser addUser(RsUser rsUser) {
		log.debug("REST request, add user");

		String username = rsUser.getUsername();
		if (username == null || username.trim().isEmpty()) {
			log.warn("User posted an empty user name.");
			throw new NetshotBadRequestException("Invalid user name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_USER_NAME);
		}
		username = username.trim();

		String password = rsUser.getPassword();
		if (rsUser.isLocal()) {
			if (password == null || password.equals("")) {
				log.warn("User tries to create a local account without password.");
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
			log.error("Error while saving the new user.", e);
			if (this.isDuplicateException(e)) {
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a Netshot user",
		description = "Edits a Netshot user, by ID."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public UiUser setUser(@PathParam("id") @Parameter(description = "User ID") Long id, RsUser rsUser)
			throws WebApplicationException {
		log.debug("REST request, edit user {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			UiUser user = (UiUser) session.get(UiUser.class, id);
			if (user == null) {
				log.error("Unable to find the user {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this user.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_USER);
			}

			String username = rsUser.getUsername();
			if (username == null || username.trim().isEmpty()) {
				log.warn("User posted an empty user name.");
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
					log.error("The password cannot be empty for user {}.", id);
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
			log.error("Unable to save the user {}.", id, e);
			if (this.isDuplicateException(e)) {
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
	 * @param id the id
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/users/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove a Netshot user.",
		description = "Removes a user from the Netshot database."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public void deleteUser(@PathParam("id") @Parameter(description = "User ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, delete user {}.", id);
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
			log.error("The user doesn't exist.");
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
		@XmlElement @JsonView(DefaultView.class)
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
		@XmlElement @JsonView(DefaultView.class)
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
		@XmlElement @JsonView(DefaultView.class)
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
		@XmlElement @JsonView(DefaultView.class)
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
	 * @param rsAPiToken the rs API token
	 * @return the API token
	 */
	@POST
	@Path("/apitokens")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a new API token",
		description = "Creates a new API token."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public ApiToken addApiToken(RsApiToken rsApiToken) {
		log.debug("REST request, add API token");

		String description = rsApiToken.getDescription();
		if (description == null || description.trim().isEmpty()) {
			description = "";
		}
		description = description.trim();

		String token = rsApiToken.getToken();
		if (!ApiToken.isValidToken(token)) {
			log.warn("The passed token is not valid");
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
			log.error("Error while saving the new API token.", e);
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the API tokens",
		description = "Returns the list of API tokens."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public List<ApiToken> getApiTokens(@BeanParam PaginationParams paginationParams) throws WebApplicationException {
		log.debug("REST request, get API token list.");
		Session session = Database.getSession(true);
		try {
			Query<ApiToken> query = session.createQuery("from ApiToken", ApiToken.class);
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to retrieve the API tokens.", e);
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove an API token",
		description = "Removes an API token, by ID."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public void deleteApiToken(@PathParam("id") @Parameter(description = "Token ID") Long id) throws WebApplicationException {
		log.debug("REST request, delete API token {}.", id);
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
			log.error("The API token doesn't exist.");
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Export data",
		description = "Exports data as Excel datasheet. The devices can be filtered by groups or domains. " +
			"The report can be customized to include or not interfaces, inventory, locations, compliance, groups. " +
			"The only supported and default output format is xlsx (Excel file)."
	)
	@Tag(name = "Reports", description = "Report and statistics")
	public Response getDataXLSX(@Context HttpServletRequest request,
			@QueryParam("group") @Parameter(description = "Filter on given group ID(s)") Set<Long> groups,
			@QueryParam("domain") @Parameter(description = "Filter on given domain ID(s)") Set<Long> domains,
			@DefaultValue("false") @QueryParam("interfaces") @Parameter(description = "Whether to export interface data") boolean exportInterfaces,
			@DefaultValue("false") @QueryParam("inventory") @Parameter(description = "Whether to export inventory data") boolean exportInventory,
			@DefaultValue("false") @QueryParam("inventoryhistory") @Parameter(description = "Whether to export interface history") boolean exportInventoryHistory,
			@DefaultValue("false") @QueryParam("locations") @Parameter(description = "Whether to export locations") boolean exportLocations,
			@DefaultValue("false") @QueryParam("compliance") @Parameter(description = "Whether to export compliance results") boolean exportCompliance,
			@DefaultValue("false") @QueryParam("groups") @Parameter(description = "Whether to export group info") boolean exportGroups,
			@DefaultValue("false") @QueryParam("devicedriverattributes") @Parameter(description = "Whether to export driver-specific attributes for devices") boolean exportDeviceDriverAttributes,
			@DefaultValue("xlsx") @QueryParam("format") @Parameter(description = "Export format (xlsx is supported)") String fileFormat) throws WebApplicationException {
		log.debug("REST request, export data.");
		User user = (User) request.getAttribute("user");

		if (fileFormat.compareToIgnoreCase("xlsx") == 0) {
			String fileName = String.format("netshot-export_%s.xlsx", (new SimpleDateFormat("yyyyMMdd-HHmmss")).format(new Date()));

			Session session = Database.getSession(true);
			SXSSFWorkbook workBook = new SXSSFWorkbook(100);
			try {
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
					if (domains.isEmpty()) {
						row.createCell(1).setCellValue("Any");
					}
					else {
						List<Domain> deviceDomains = session
							.createQuery("select d from Domain d where d.id in (:domainIds)", Domain.class)
							.setParameterList("domainIds", domains)
							.list();
						List<String> domainNames = new ArrayList<>();
						for (Domain deviceDomain : deviceDomains) {
							domainNames.add(String.format("%s (%d)", deviceDomain.getName(), deviceDomain.getId()));
						}
						row.createCell(1).setCellValue(String.join(", ", domainNames));
					}
					row = summarySheet.createRow(++y);
					row.createCell(0).setCellValue("Selected Group");
					row.getCell(0).setCellStyle(titleCellStyle);
					if (groups.isEmpty()) {
						row.createCell(1).setCellValue("Any");
					}
					else {
						List<DeviceGroup> deviceGroups = session
							.createQuery("select g from DeviceGroup g where g.id in (:groupIds)", DeviceGroup.class)
							.setParameterList("groupIds", groups)
							.list();
						List<String> groupNames = new ArrayList<>();
						for (DeviceGroup group : deviceGroups) {
							groupNames.add(String.format("%s (%d)", group.getName(), group.getId()));
						}
						row.createCell(1).setCellValue(String.join(", ", groupNames));
					}
					summarySheet.setDefaultColumnStyle(0, titleCellStyle);
				}

				{
					StringBuilder deviceHqlQuery = new StringBuilder(
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
					log.debug("Exporting interface data");
					StringBuilder interfaceHqlQuery = new StringBuilder(
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
						if (networkInterface.getIpAddresses().isEmpty()) {
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
					log.debug("Exporting device inventory");
					StringBuilder moduleHqlQuery = new StringBuilder(
							"select distinct m from Module m join fetch m.device left join m.device.ownerGroups g where 1 = 1");
					if (!exportInventoryHistory) {
						moduleHqlQuery.append(" and m.removed is not true");
					}
					if (domains.size() > 0) {
						moduleHqlQuery.append(" and m.device.mgmtDomain.id in (:domainIds)");
					}
					if (groups.size() > 0) {
						moduleHqlQuery.append(" and g.id in (:groupIds)");
					}
					moduleHqlQuery.append(" order by m.device.id asc, m.id asc");
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
						if (exportInventoryHistory) {
							row.createCell(++x).setCellValue("First seen");
							row.getCell(x).setCellStyle(titleCellStyle);
							inventorySheet.setColumnWidth(x, 4200);
							row.createCell(++x).setCellValue("Last seen");
							row.getCell(x).setCellStyle(titleCellStyle);
							inventorySheet.setColumnWidth(x, 4200);
							row.createCell(++x).setCellValue("Removed");
							row.getCell(x).setCellStyle(titleCellStyle);
							inventorySheet.setColumnWidth(x, 4200);
						}
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
							if (exportInventoryHistory) {
								cell = row.createCell(++x);
								cell.setCellValue(module.getFirstSeenDate());
								cell.setCellStyle(datetimeCellStyle);
								cell = row.createCell(++x);
								cell.setCellValue(module.getLastSeenDate());
								cell.setCellStyle(datetimeCellStyle);
								cell = row.createCell(++x, CellType.BOOLEAN);
								cell.setCellValue(module.isRemoved());
							}
						}
						session.clear();
						if (modules.size() < PAGINATION_SIZE) {
							break;
						}
					}
				}
					
				if (exportCompliance) {
					log.debug("Exporting compliance data");
					List<RsLightPolicyRuleDevice> checkResults = getConfigComplianceDeviceStatuses(domains, groups,
							new HashSet<Long>(), new HashSet<>(
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
						log.debug("Exporting group data");
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
						log.debug("Exporting group memberships");
						StringBuilder deviceHqlQuery = new StringBuilder(
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

				if (exportDeviceDriverAttributes) {
					log.debug("Exporting driver-specific device attributes");
					StringBuilder attributeHqlQuery = new StringBuilder(
							"select da from DeviceAttribute da " +
							"join fetch da.device where 1 = 1");
					if (domains.size() > 0) {
						attributeHqlQuery.append(" and da.device.mgmtDomain.id in (:domainIds)");
					}
					if (groups.size() > 0) {
						attributeHqlQuery.append(" and da.device.id in (select d.id from Device d left join d.ownerGroups g where g.id in (:groupIds))");
					}
					attributeHqlQuery.append(" order by da.device.name asc, da.id asc");
					Query<DeviceAttribute> attributeQuery = session.createQuery(attributeHqlQuery.toString(),
							DeviceAttribute.class);
					if (domains.size() > 0) {
						attributeQuery.setParameterList("domainIds", domains);
					}
					if (groups.size() > 0) {
						attributeQuery.setParameterList("groupIds", groups);
					}

					Sheet attributeSheet = workBook.createSheet("Device Attributes");
					((SXSSFSheet) attributeSheet).setRandomAccessWindowSize(100);
					int y = -1;
					{
						row = attributeSheet.createRow(++y);
						int x = -1;
						row.createCell(++x).setCellValue("Device ID");
						row.getCell(x).setCellStyle(titleCellStyle);
						attributeSheet.setColumnWidth(x, 2200);
						row.createCell(++x).setCellValue("Device Name");
						row.getCell(x).setCellStyle(titleCellStyle);
						attributeSheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("Attribute Name");
						row.getCell(x).setCellStyle(titleCellStyle);
						attributeSheet.setColumnWidth(x, 5000);
						row.createCell(++x).setCellValue("Attribute Value");
						row.getCell(x).setCellStyle(titleCellStyle);
						attributeSheet.setColumnWidth(x, 7000);
						row.setRowStyle(titleCellStyle);
						attributeSheet.createFreezePane(0, y + 1);
						attributeSheet.setAutoFilter(new CellRangeAddress(0, y, 0, x));
					}

					for (int n = 0; true; n += PAGINATION_SIZE) {
						List<DeviceAttribute> attributes = attributeQuery.setFirstResult(n).list();
						for (DeviceAttribute attribute : attributes) {
							try {
								String value = attribute.getData().toString();
								Device device = attribute.getDevice();
								DeviceDriver driver = device.getDeviceDriver();
								AttributeDefinition definition = driver.getAttributeDefinition(AttributeLevel.DEVICE, attribute.getName());
								int x = -1;
								row = attributeSheet.createRow(++y);
								row.createCell(++x).setCellValue(device.getId());
								row.createCell(++x).setCellValue(device.getName());
								row.createCell(++x).setCellValue(definition.getTitle());
								row.createCell(++x).setCellValue(value);
								attribute.getData();
							}
							catch (Exception e) {
								log.warn("Error while exporting attribute (ID {}, name {})... skipping",
									attribute.getId(), attribute.getName(), e);
							}
						}
						session.clear();
						if (attributes.size() < PAGINATION_SIZE) {
							break;
						}
						session.clear();
					}
				}

				ByteArrayOutputStream output = new ByteArrayOutputStream();
				workBook.write(output);
				return Response.ok(output.toByteArray()).header("Content-Disposition", "attachment; filename=" + fileName).build();
			}
			catch (IOException e) {
				log.error("Unable to write the resulting file.", e);
				throw new WebApplicationException(
						"Unable to write the resulting file.",
						javax.ws.rs.core.Response.Status.INTERNAL_SERVER_ERROR);
			}
			catch (Exception e) {
				log.error("Unable to generate the report.", e);
				throw new WebApplicationException("Unable to generate the report.",
						javax.ws.rs.core.Response.Status.INTERNAL_SERVER_ERROR);
			}
			finally {
				session.close();
				try {
					workBook.close();
					workBook.dispose();
				}
				catch (IOException e) {
					log.warn("Error while closing work book", e);
				}
			}
		}

		log.warn("Invalid requested file format.");
		throw new WebApplicationException(
				"The requested file format is invalid or not supported.",
				javax.ws.rs.core.Response.Status.BAD_REQUEST);
	}
	
	@POST
	@Path("/scripts")
	@RolesAllowed("executereadwrite")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add/validate a command script",
		description = "Create a command script (script to be later run over devices)."
	)
	@Tag(name = "Scripts", description = "Script management (push changes to devices)")
	public DeviceJsScript addScript(
			DeviceJsScript rsScript,
			@DefaultValue("false") @QueryParam("validateonly") @Parameter(description = "True to validate script without saving") boolean validateOnly)
			throws WebApplicationException {
		log.debug("REST request, add device script.");
		DeviceDriver driver = DeviceDriver.getDriverByName(rsScript.getDeviceDriver());
		if (driver == null) {
			log.warn("Invalid driver name.");
			throw new NetshotBadRequestException("Invalid driver name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
		}
		if (rsScript.getName() == null || rsScript.getName().trim().equals("")) {
			log.warn("Invalid script name.");
			throw new NetshotBadRequestException("Invalid script name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
		}
		if (rsScript.getScript() == null) {
			log.warn("Invalid script.");
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

		try {
			rsScript.extractUserInputDefinitions();
		}
		catch (IllegalArgumentException e) {
			log.warn("Invalid script.");
			throw new NetshotBadRequestException(e.getMessage(),
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
		}

		if (!validateOnly) {
			Session session = Database.getSession();
			try {
				session.beginTransaction();
				session.save(rsScript);
				session.getTransaction().commit();
				Netshot.aaaLogger.info("{} has been created", rsScript);
				this.suggestReturnCode(Response.Status.CREATED);
			}
			catch (HibernateException e) {
				session.getTransaction().rollback();
				log.error("Error while saving the new rule.", e);
				if (this.isDuplicateException(e)) {
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
		
		return rsScript;
	}
	
	@DELETE
	@Path("/scripts/{id}")
	@RolesAllowed("executereadwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove a script",
		description = "Removes a given script, by ID."
	)
	@Tag(name = "Scripts", description = "Script management (push changes to devices)")
	public void deleteScript(@PathParam("id") @Parameter(description = "Script ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, delete script {}.", id);
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
			log.error("The script {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The script doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Unable to delete the script {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the script.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}
	
	@GET
	@Path("/scripts/{id}")
	@RolesAllowed("executereadwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get a command script",
		description = "Returns a given command script, by ID."
	)
	@Tag(name = "Scripts", description = "Script management (push changes to devices)")
	public DeviceJsScript getScript(@PathParam("id") @Parameter(description = "Script ID") Long id) {
		log.debug("REST request, get script {}", id);
		Session session = Database.getSession(true);
		try {
			DeviceJsScript script = (DeviceJsScript) session.get(DeviceJsScript.class, id);
			return script;
		}
		catch (ObjectNotFoundException e) {
			log.error("Unable to find the script {}.", id, e);
			throw new NetshotBadRequestException("Script not found.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_SCRIPT);
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the script {}.", id, e);
			throw new NetshotBadRequestException("Unable to fetch the script.",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}
	
	@GET
	@Path("/scripts")
	@RolesAllowed("executereadwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get command scripts",
		description = "Returns the list of command scripts."
	)
	@Tag(name = "Scripts", description = "Script management (push changes to devices)")
	public List<DeviceJsScript> getScripts(@BeanParam PaginationParams paginationParams) {
		log.debug("REST request, get scripts.");
		Session session = Database.getSession(true);
		try {
			Query<DeviceJsScript> query = session.createQuery("from DeviceJsScript s", DeviceJsScript.class);
			paginationParams.apply(query);
			List<DeviceJsScript> scripts = query.list();
			for (DeviceJsScript script : scripts) {
				script.setScript(null);
			}
			return scripts;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the scripts.", e);
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
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long id = 0;

		/** The name. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String name = "";

		/** The group. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private long targetGroup = 0;

		/** Whether the diagnostic is enabled or not. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean enabled = false;

		/** The type of result (boolean, text, etc.). */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String resultType;

		/** The type of diagnostic. */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String type;

		/** The Javascript script (in case of JavaScriptDiagnostic). */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String script;

		/** The device driver name (in case of SimpleDiagnostic). */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String deviceDriver;

		/** The mode in which to run the command (in case of SimpleDiagnostic). */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String cliMode;

		/** The CLI command to execute (in case of SimpleDiagnostic). */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String command;

		/** The pattern to match (in case of SimpleDiagnostic). */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String modifierPattern;

		/** The replacement text (in case of SimpleDiagnostic). */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String modifierReplacement;

		/**
		 * Instantiates a new rs policy.
		 */
		public RsDiagnostic() {

		}
	}



	/**
	 * Gets the diagnotics.
	 *
	 * @return the diagnotics
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/diagnostics")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the diagnostics",
		description = "Returns the list of diagnostics."
	)
	@Tag(
		name = "Diagnostics",
		description = "Diagnostic management (execute commands and retrieve custom data from devices)"
	)
	public List<Diagnostic> getDiagnostics(@BeanParam PaginationParams paginationParams) throws WebApplicationException {
		log.debug("REST request, get diagnotics.");
		Session session = Database.getSession(true);
		try {
			Query<Diagnostic> query =
					session.createQuery("select d from Diagnostic d left join fetch d.targetGroup", Diagnostic.class);
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the diagnostics.", e);
			throw new NetshotBadRequestException("Unable to fetch the diagnostics",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}



	/**
	 * Gets a specific diagnotic.
	 *
	 * @return the diagnotic
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/diagnostics/{id}")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get a diagnostic",
		description = "Returns a specific diagnostic, by ID."
	)
	@Tag(
		name = "Diagnostics",
		description = "Diagnostic management (execute commands and retrieve custom data from devices)"
	)
	public Diagnostic getDiagnostic(@PathParam("id") @Parameter(description = "Diagnostic ID") Long id) throws WebApplicationException {
		log.debug("REST request, get diagnotic.");
		Session session = Database.getSession(true);
		try {
			Query<Diagnostic> query = session
				.createQuery("select d from Diagnostic d left join fetch d.targetGroup where d.id = :id", Diagnostic.class)
				.setParameter("id", id);
			Diagnostic diagnostic = query.uniqueResult();
			if (diagnostic == null) {
				log.warn("Unable to find the diagnostic object.");
				throw new WebApplicationException(
						"Unable to find the diagnostic",
						javax.ws.rs.core.Response.Status.NOT_FOUND);
			}
			return diagnostic;
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the diagnostic.", e);
			throw new NetshotBadRequestException("Unable to fetch the diagnostic",
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a diagnostic.",
		description = "Creates a diagnostic."
	)
	@Tag(
		name = "Diagnostics",
		description = "Diagnostic management (execute commands and retrieve custom data from devices)"
	)
	public Diagnostic addDiagnostic(RsDiagnostic rsDiagnostic) throws WebApplicationException {
		log.debug("REST request, add diagnostic");
		String name = rsDiagnostic.getName().trim();
		if (name.isEmpty()) {
			log.warn("User posted an empty diagnostic name.");
			throw new NetshotBadRequestException("Invalid diagnostic name.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC_NAME);
		}
		if (name.contains("\"")) {
			log.warn("Double-quotes are not allowed in the diagnostic name.");
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
				group = (DeviceGroup) session.get(DeviceGroup.class, rsDiagnostic.getTargetGroup());
			}

			if ("JavaScriptDiagnostic".equals(rsDiagnostic.getType())) {
				if (rsDiagnostic.getScript() == null || rsDiagnostic.getScript().trim().equals("")) {
					throw new NetshotBadRequestException(
						"Invalid diagnostic script",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				diagnostic = new JavaScriptDiagnostic(name, rsDiagnostic.isEnabled(), group, 
						resultType, rsDiagnostic.getScript());
			}
			else if ("PythonDiagnostic".equals(rsDiagnostic.getType())) {
				if (rsDiagnostic.getScript() == null || rsDiagnostic.getScript().trim().equals("")) {
					throw new NetshotBadRequestException(
						"Invalid diagnostic script",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				diagnostic = new PythonDiagnostic(name, rsDiagnostic.isEnabled(), group, 
						resultType, rsDiagnostic.getScript());
			}
			else if ("SimpleDiagnostic".equals(rsDiagnostic.getType())) {
				if (rsDiagnostic.getCliMode() == null || rsDiagnostic.getCliMode().trim().equals("")) {
					throw new NetshotBadRequestException("The CLI mode must be provided.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				if (rsDiagnostic.getCommand() == null || rsDiagnostic.getCommand().trim().equals("")) {
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
			return diagnostic;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("The posted group doesn't exist", e);
			throw new NetshotBadRequestException(
					"Invalid group",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Error while saving the new diagnostic.", e);
			if (this.isDuplicateException(e)) {
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
	}


	/**
	 * Updates the diagnostic.
	 * 
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
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a diagnostic",
		description = "Creates a new diagnostic."
	)
	@Tag(
		name = "Diagnostics",
		description = "Diagnostic management (execute commands and retrieve custom data from devices)"
	)
	public Diagnostic setDiagnostic(@PathParam("id") @Parameter(description = "Diagnostic ID") Long id, RsDiagnostic rsDiagnostic)
			throws WebApplicationException {
		log.debug("REST request, edit diagnostic {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Diagnostic diagnostic = (Diagnostic) session.get(Diagnostic.class, id);
			if (diagnostic == null) {
				log.error("Unable to find the diagnostic {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this diagnostic.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
			}
			
			String name = rsDiagnostic.getName().trim();
			if (name.isEmpty()) {
				log.warn("User posted an empty diagnostic name.");
				throw new NetshotBadRequestException("Invalid diagnostic name.",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC_NAME);
			}
			if (name.contains("\"")) {
				log.warn("Double-quotes are not allowed in the diagnostic name.");
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
				group = (DeviceGroup) session.get(DeviceGroup.class, rsDiagnostic.getTargetGroup());
			}
			diagnostic.setTargetGroup(group);

			diagnostic.setResultType(resultType);
			diagnostic.setEnabled(rsDiagnostic.isEnabled());
			if (diagnostic instanceof JavaScriptDiagnostic) {
				if (!"JavaScriptDiagnostic".equals(rsDiagnostic.getType())) {
					throw new NetshotBadRequestException("Incompatible posted diagnostic.",
							NetshotBadRequestException.Reason.NETSHOT_INCOMPATIBLE_DIAGNOSTIC);
				}
				if (rsDiagnostic.getScript() == null || rsDiagnostic.getScript().trim().equals("")) {
					throw new NetshotBadRequestException(
						"Invalid diagnostic script",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				((JavaScriptDiagnostic) diagnostic).setScript(rsDiagnostic.getScript());
			}
			else if (diagnostic instanceof PythonDiagnostic) {
				if (!"PythonDiagnostic".equals(rsDiagnostic.getType())) {
					throw new NetshotBadRequestException("Incompatible posted diagnostic.",
							NetshotBadRequestException.Reason.NETSHOT_INCOMPATIBLE_DIAGNOSTIC);
				}
				if (rsDiagnostic.getScript() == null || rsDiagnostic.getScript().trim().equals("")) {
					throw new NetshotBadRequestException(
						"Invalid diagnostic script",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				((PythonDiagnostic) diagnostic).setScript(rsDiagnostic.getScript());
			}
			else if (diagnostic instanceof SimpleDiagnostic) {
				if (!"SimpleDiagnostic".equals(rsDiagnostic.getType())) {
					throw new NetshotBadRequestException("Incompatible posted diagnostic.",
							NetshotBadRequestException.Reason.NETSHOT_INCOMPATIBLE_DIAGNOSTIC);
				}
				if (rsDiagnostic.getCliMode() == null || rsDiagnostic.getCliMode().trim().equals("")) {
					throw new NetshotBadRequestException("The CLI mode must be provided.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
				}
				if (rsDiagnostic.getCommand() == null || rsDiagnostic.getCommand().trim().equals("")) {
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
			log.error("Unable to find the group {} to be assigned to the diagnostic {}.",
					rsDiagnostic.getTargetGroup(), id, e);
			throw new NetshotBadRequestException(
					"Unable to find the group.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Unable to save the diagnostic {}.", id, e);
			if (this.isDuplicateException(e)) {
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
	 * @param id the id of the diagnostic to delete
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/diagnostics/{id}")
	@RolesAllowed("executereadwrite")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove a diagnostic",
		description = "Removes a given diagnostic, by ID."
	)
	@Tag(
		name = "Diagnostics",
		description = "Diagnostic management (execute commands and retrieve custom data from devices)"
	)
	public void deleteDiagnostic(@PathParam("id") @Parameter(description = "Diagnostic ID") Long id)
			throws WebApplicationException {
		log.debug("REST request, delete diagnostic {}.", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Diagnostic diagnostic = (Diagnostic) session.load(Diagnostic.class, id);
			// Remove the related results
			session
				.createQuery("delete from DiagnosticResult dr where dr.diagnostic = :diagnostic")
				.setParameter("diagnostic", diagnostic)
				.executeUpdate();
			// Remove the diagnostic
			session
				.createQuery("delete from Diagnostic d where d = :diagnostic")
				.setParameter("diagnostic", diagnostic)
				.executeUpdate();
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted", diagnostic);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("The diagnostic {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The diagnostic doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_DIAGNOSTIC);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			log.error("Unable to delete the diagnostic {}.", id, e);
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
	 * @param id the id
	 * @return the device compliance
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/devices/{id}/diagnosticresults")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get diagnostic results",
		description = "Returns the results of a given diagnostic, by ID."
	)
	@Tag(name = "Devices", description = "Device (such as network or security equipment) management")
	@Tag(
		name = "Diagnostics",
		description = "Diagnostic management (execute commands and retrieve custom data from devices)"
	)
	public List<DiagnosticResult> getDeviceDiagnosticResults(@BeanParam PaginationParams paginationParams,
			@PathParam("id") @Parameter(description = "Device ID") Long id) throws WebApplicationException {
		log.debug("REST request, get diagnostic results for device {}.", id);
		Session session = Database.getSession(true);
		try {
			Query<DiagnosticResult> query = session
				.createQuery("from DiagnosticResult dr join fetch dr.diagnostic where dr.device.id = :id", DiagnosticResult.class)
				.setParameter("id", id);
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the diagnostic results.", e);
			throw new NetshotBadRequestException("Unable to fetch the diagnostic results",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}
	
	/**
	 * Gets the hooks.
	 *
	 * @return the current hooks
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/hooks")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get the hooks",
		description = "Returns the current list of hooks."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public List<Hook> getHooks(@BeanParam PaginationParams paginationParams) throws WebApplicationException {
		log.debug("REST request, hooks.");
		Session session = Database.getSession(true);
		try {
			Query<Hook> query = session.createQuery("select distinct h from Hook h left join fetch h.triggers", Hook.class);
			paginationParams.apply(query);
			return query.list();
		}
		catch (HibernateException e) {
			log.error("Unable to fetch the hooks.", e);
			throw new NetshotBadRequestException("Unable to fetch the hooks",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}


	/**
	 * Adds the hook.
	 *
	 * @param hook the hook
	 * @return the new hook
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("/hooks")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Add a hook",
		description = "Creates a hook. Based on given criteria, Netshot will run the given action when specific events occur."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public Hook addHook(Hook hook) throws WebApplicationException {
		log.debug("REST request, add hook.");
		if (hook.getName() == null || hook.getName().trim().equals("")) {
			log.error("Invalid hook name.");
			throw new NetshotBadRequestException("Invalid name for the hook",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_HOOK_NAME);
		}
		if (hook.getTriggers() != null) {
			for (HookTrigger trigger : hook.getTriggers()) {
				trigger.setHook(hook);
			}
		}
		if (hook instanceof WebHook) {
			WebHook webHook = (WebHook)hook;
			try {
				webHook.getParsedUrl();
			}
			catch (MalformedURLException e) {
				throw new NetshotBadRequestException("Invalid Web hook target URL",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_HOOK_WEB_URL);
			}
			if (webHook.getAction() == null) {
				throw new NetshotBadRequestException("Invalid action",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_HOOK_WEB);
			}
		}
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			session.save(hook);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been created.", hook);
			this.suggestReturnCode(Response.Status.CREATED);
			return hook;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			Throwable t = e.getCause();
			log.error("Can't add the hook.", e);
			if (t != null && t.getMessage().contains("uplicate")) {
				throw new NetshotBadRequestException(
						"A hook with this name already exists.",
						NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_HOOK);
			}
			throw new NetshotBadRequestException("Unable to save the hook",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Delete hook.
	 *
	 * @param id the id of the hook
	 * @throws WebApplicationException the web application exception
	 */
	@DELETE
	@Path("/hooks/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Remove a hook",
		description = "Removes the hook, by ID."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public void deleteHook(@PathParam("id") @Parameter(description = "Hook ID") Long id) throws WebApplicationException {
		log.debug("REST request, delete hook {}", id);
		Session session = Database.getSession();
		try {
			session.beginTransaction();
			Hook hook = session.load(Hook.class, id);
			session.delete(hook);
			session.getTransaction().commit();
			Netshot.aaaLogger.info("{} has been deleted.", hook);
			this.suggestReturnCode(Response.Status.NO_CONTENT);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			log.error("The hook {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The hook doesn't exist.",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_HOOK);
		}
		catch (Exception e) {
			session.getTransaction().rollback();
			log.error("Unable to delete the hook {}", id, e);
			throw new NetshotBadRequestException(
					"Unable to delete the hook",
					NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Sets the hook.
	 *
	 * @param id the id
	 * @param rsHook the hook
	 * @return the updated hook
	 * @throws WebApplicationException the web application exception
	 */
	@PUT
	@Path("/hooks/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Update a hook",
		description = "Edits a hook, by ID."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public Hook setHook(@PathParam("id") @Parameter(description = "Hook ID") Long id, Hook rsHook) throws WebApplicationException {
		log.debug("REST request, edit hook {}", id);
		rsHook.setId(id);
		if (rsHook.getName() == null || rsHook.getName().trim().equals("")) {
			log.error("Invalid hook name.");
			throw new NetshotBadRequestException("Invalid name for the hook",
					NetshotBadRequestException.Reason.NETSHOT_INVALID_HOOK_NAME);
		}
		if (rsHook instanceof WebHook) {
			WebHook rsWebHook = (WebHook)rsHook;
			try {
				rsWebHook.getParsedUrl();
			}
			catch (MalformedURLException e) {
				throw new NetshotBadRequestException("Invalid Web hook target URL",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_HOOK_WEB_URL);
			}
			if (rsWebHook.getAction() == null) {
				throw new NetshotBadRequestException("Invalid action",
						NetshotBadRequestException.Reason.NETSHOT_INVALID_HOOK_WEB);
			}
		}
		{
			Session session = Database.getSession();
			try {
				session.beginTransaction();
				Hook hook = session.get(rsHook.getClass(), id);
				if (hook == null) {
					log.error("Unable to find the hook {}.", id);
					throw new NetshotBadRequestException(
							"Unable to find the hook.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_HOOK);
				}
				if (!hook.getClass().equals(rsHook.getClass())) {
					log.error("Wrong posted type for hook {}.", id);
					throw new NetshotBadRequestException(
							"The posted hook type doesn't match the existing one.",
							NetshotBadRequestException.Reason.NETSHOT_INVALID_HOOK_TYPE);
				}
				hook.setEnabled(rsHook.isEnabled());
				hook.setName(rsHook.getName());
				for (HookTrigger trigger : rsHook.getTriggers()) {
					trigger.setHook(hook);
				}
				// Ensure we keep the same HookTrigger object instances
				hook.getTriggers().retainAll(rsHook.getTriggers());
				hook.getTriggers().addAll(rsHook.getTriggers());
				if (rsHook instanceof WebHook) {
					WebHook rsWebHook = (WebHook)rsHook;
					WebHook webHook = (WebHook)hook;
					webHook.setAction(rsWebHook.getAction());
					webHook.setUrl(rsWebHook.getUrl());
					webHook.setSslValidation(rsWebHook.isSslValidation());
				}
				session.update(hook);
				session.getTransaction().commit();
				Netshot.aaaLogger.info("{} has been edited", rsHook);
				return rsHook;
			}
			catch (HibernateException e) {
				session.getTransaction().rollback();
				Throwable t = e.getCause();
				log.error("Unable to save the hook {}.", id, e);
				if (t != null && t.getMessage().contains("uplicate")) {
					throw new NetshotBadRequestException(
							"A hook with this name already exists.",
							NetshotBadRequestException.Reason.NETSHOT_DUPLICATE_HOOK);
				}
				throw new NetshotBadRequestException("Unable to save the hook",
						NetshotBadRequestException.Reason.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			catch (NetshotBadRequestException e) {
				session.getTransaction().rollback();
				throw e;
			}
			finally {
				session.close();
			}
		}
	}

	/**
	 * Gets the cluster members.
	 *
	 * @return the cluster members
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("/cluster/members")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get cluster members",
		description = "Returns the members of the Netshot high availability cluster " +
				"(empty list if clustering is not enabled)."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public List<ClusterMember> getClusterMembers() throws WebApplicationException {
		log.debug("REST request, get cluster members");
		return ClusterManager.getClusterMembers();
	}

	@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
	public static class RsClusterMasterCheck {

		/** Is clustering enabled */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean clusterEnabled = false;

		/** Is local server master */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private boolean master = true;

		/** Current master instance ID */
		@Getter(onMethod=@__({
			@XmlElement, @JsonView(DefaultView.class)
		}))
		@Setter
		private String currentMasterId = null;
	}
	
	/**
	 * Gets the cluster mastership status of the current node.
	 *
	 * @return the mastership status
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@PermitAll
	@Path("/cluster/masterstatus")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Check if local server is cluster master",
		description = "Returns cluster mastership info of the current node. " +
			"Might be used by local-balancer to redirect http to the proper server " +
			"(return code 205 means the local server is not master)."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public RsClusterMasterCheck getClusterMasterStatus() throws WebApplicationException {
		RsClusterMasterCheck check = new RsClusterMasterCheck();
		List<ClusterMember> members = ClusterManager.getClusterMembers();
		if (members.size() > 0) {
			check.setClusterEnabled(true);
			check.setMaster(false);
			for (ClusterMember member : members) {
				if (MastershipStatus.MASTER.equals(member.getStatus())) {
					check.setCurrentMasterId(member.getInstanceId());
					if (member.isLocal()) {
						check.setMaster(true);
					}
				}
			}
			if (!check.isMaster()) {
				this.suggestReturnCode(Response.Status.RESET_CONTENT);
			}
		}
		return check;
	}

	/**
	 * Utility class to send server information
	 */
	@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
	public static class RsServerInfo {

		/**
		 * Gets the server version
		 *
		 * @return the server version
		 */
		@XmlElement @JsonView(DefaultView.class)
		public String getServerVersion() {
			return Netshot.VERSION;
		}

		/**
		 * Gets the user max idle time (in seconds)
		 * 
		 * @return the max idle time
		 */
		@XmlElement @JsonView(DefaultView.class)
		public int getMaxIdleTimout() {
			return UiUser.MAX_IDLE_TIME;
		}
	}

	@GET
	@Path("/serverinfo")
	@RolesAllowed("readonly")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@JsonView(RestApiView.class)
	@Operation(
		summary = "Get Netshot server info.",
		description = "Retrieves some general info about Netshot server."
	)
	@Tag(name = "Admin", description = "Administrative actions")
	public RsServerInfo getServerInfo() {
		log.debug("REST request, get server info");
		return new RsServerInfo();
	}

}


