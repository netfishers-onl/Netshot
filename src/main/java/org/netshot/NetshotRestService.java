/*
 * Copyright Sylvain Cadilhac 2013
 */

package org.netshot;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.UnknownHostException;
import java.security.Principal;
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
import java.util.Set;
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
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.jersey.grizzly2.servlet.GrizzlyWebContainerFactory;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.servlet.ServletContainer;
import org.hibernate.Criteria;
import org.hibernate.HibernateException;
import org.hibernate.ObjectNotFoundException;
import org.hibernate.Query;
import org.hibernate.Session;
import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.Property;
import org.hibernate.criterion.Restrictions;
import org.hibernate.transform.Transformers;
import org.hibernate.type.StandardBasicTypes;
import org.netshot.aaa.Radius;
import org.netshot.aaa.User;
import org.netshot.compliance.CheckResult;
import org.netshot.compliance.CheckResult.ResultOption;
import org.netshot.compliance.HardwareRule;
import org.netshot.compliance.SoftwareRule.ConformanceLevel;
import org.netshot.compliance.Exemption;
import org.netshot.compliance.Policy;
import org.netshot.compliance.Rule;
import org.netshot.compliance.SoftwareRule;
import org.netshot.compliance.rules.JavaScriptRule;
import org.netshot.device.Config;
import org.netshot.device.Device;
import org.netshot.device.Device.Status;
import org.netshot.device.ConfigItem;
import org.netshot.device.Domain;
import org.netshot.device.Finder;
import org.netshot.device.Finder.Expression.FinderParseException;
import org.netshot.device.DeviceGroup;
import org.netshot.device.DynamicDeviceGroup;
import org.netshot.device.Module;
import org.netshot.device.Network4Address;
import org.netshot.device.Network6Address;
import org.netshot.device.NetworkAddress;
import org.netshot.device.NetworkInterface;
import org.netshot.device.StaticDeviceGroup;
import org.netshot.device.credentials.DeviceCliAccount;
import org.netshot.device.credentials.DeviceCredentialSet;
import org.netshot.device.credentials.DeviceSnmpCommunity;
import org.netshot.work.Task;
import org.netshot.work.Task.ScheduleType;
import org.netshot.work.tasks.CheckComplianceTask;
import org.netshot.work.tasks.CheckGroupComplianceTask;
import org.netshot.work.tasks.CheckGroupSoftwareTask;
import org.netshot.work.tasks.DiscoverDeviceTypeTask;
import org.netshot.work.tasks.PurgeDatabaseTask;
import org.netshot.work.tasks.ScanSubnetsTask;
import org.netshot.work.tasks.TakeGroupSnapshotTask;
import org.netshot.work.tasks.TakeSnapshotTask;
import org.quartz.SchedulerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.jaxrs.json.JacksonJaxbJsonProvider;

import difflib.Delta;
import difflib.DiffUtils;
import difflib.Patch;

/**
 * The NetshotRestService class exposes the Netshot methods as a REST service.
 */
@Path("/netshot")
@DenyAll
public class NetshotRestService extends Thread {

	/** The REST service will binds to this URL. */
	private static final URI BASE_URI = URI.create(Netshot.getConfig("", "http://localhost:9996/"));

	/** The HQL select query for "light" devices, to be prepended to the actual query. */
	private static final String DEVICELIST_BASEQUERY = "select d.id as id, d.name as name, d.family as family, d.mgmtAddress as mgmtAddress, d.status as status ";

	/** The logger. */
	private static Logger logger = LoggerFactory
			.getLogger(NetshotRestService.class);

	/** The static instance service. */
	private static NetshotRestService nsRestService;

	/**
	 * Initializes the service.
	 */
	public static void init() {
		nsRestService = new NetshotRestService();
		nsRestService.start();
	}

	/**
	 * Instantiates a new Netshot REST service.
	 */
	public NetshotRestService() {
		this.setName("REST Service");
	}

	/* (non-Javadoc)
	 * @see java.lang.Thread#run()
	 */
	public void run() {
		logger.info("Starting the REST service thread.");
		try {

			Map<String, String> initParams = new HashMap<String, String>();
			initParams.put(ServerProperties.PROVIDER_PACKAGES, "org.netshot");
			initParams.put(ServerProperties.PROVIDER_CLASSNAMES,
					NetshotRestService.class.getName() + ";" +
							JacksonJaxbJsonProvider.class.getName());


			final HttpServer server = GrizzlyWebContainerFactory.create(
					BASE_URI, ServletContainer.class, initParams);

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
	 * The NetshotBadRequestException class, a WebApplication exception
	 * embedding an error message, to be sent to the REST client.
	 */
	static public class NetshotBadRequestException extends
	WebApplicationException {

		/** The Constant NETSHOT_DATABASE_ACCESS_ERROR. */
		public static final int NETSHOT_DATABASE_ACCESS_ERROR = 20;

		/** The Constant NETSHOT_INVALID_IP_ADDRESS. */
		public static final int NETSHOT_INVALID_IP_ADDRESS = 100;

		/** The Constant NETSHOT_MALFORMED_IP_ADDRESS. */
		public static final int NETSHOT_MALFORMED_IP_ADDRESS = 101;

		/** The Constant NETSHOT_INVALID_DOMAIN. */
		public static final int NETSHOT_INVALID_DOMAIN = 110;

		/** The Constant NETSHOT_DUPLICATE_DOMAIN. */
		public static final int NETSHOT_DUPLICATE_DOMAIN = 111;

		/** The Constant NETSHOT_INVALID_DOMAIN_NAME. */
		public static final int NETSHOT_INVALID_DOMAIN_NAME = 112;

		/** The Constant NETSHOT_USED_DOMAIN. */
		public static final int NETSHOT_USED_DOMAIN = 113;

		/** The Constant NETSHOT_INVALID_TASK. */
		public static final int NETSHOT_INVALID_TASK = 120;

		/** The Constant NETSHOT_TASK_NOT_CANCELLABLE. */
		public static final int NETSHOT_TASK_NOT_CANCELLABLE = 121;

		/** The Constant NETSHOT_TASK_CANCEL_ERROR. */
		public static final int NETSHOT_TASK_CANCEL_ERROR = 122;

		/** The Constant NETSHOT_USED_CREDENTIALS. */
		public static final int NETSHOT_USED_CREDENTIALS = 130;

		/** The Constant NETSHOT_DUPLICATE_CREDENTIALS. */
		public static final int NETSHOT_DUPLICATE_CREDENTIALS = 131;

		/** The Constant NETSHOT_INVALID_CREDENTIALS_TYPE. */
		public static final int NETSHOT_INVALID_CREDENTIALS_TYPE = 132;

		/** The Constant NETSHOT_CREDENTIALS_NOTFOUND. */
		public static final int NETSHOT_CREDENTIALS_NOTFOUND = 133;

		/** The Constant NETSHOT_SCHEDULE_ERROR. */
		public static final int NETSHOT_SCHEDULE_ERROR = 30;

		/** The Constant NETSHOT_DUPLICATE_DEVICE. */
		public static final int NETSHOT_DUPLICATE_DEVICE = 140;

		/** The Constant NETSHOT_USED_DEVICE. */
		public static final int NETSHOT_USED_DEVICE = 141;

		/** The Constant NETSHOT_INVALID_DEVICE. */
		public static final int NETSHOT_INVALID_DEVICE = 142;

		/** The Constant NETSHOT_INVALID_CONFIG. */
		public static final int NETSHOT_INVALID_CONFIG = 143;

		/** The Constant NETSHOT_INCOMPATIBLE_CONFIGS. */
		public static final int NETSHOT_INCOMPATIBLE_CONFIGS = 144;

		/** The Constant NETSHOT_INVALID_DEVICE_CLASSNAME. */
		public static final int NETSHOT_INVALID_DEVICE_CLASSNAME = 150;

		/** The Constant NETSHOT_INVALID_SEARCH_STRING. */
		public static final int NETSHOT_INVALID_SEARCH_STRING = 151;

		/** The Constant NETSHOT_INVALID_GROUP_NAME. */
		public static final int NETSHOT_INVALID_GROUP_NAME = 160;

		/** The Constant NETSHOT_DUPLICATE_GROUP. */
		public static final int NETSHOT_DUPLICATE_GROUP = 161;

		/** The Constant NETSHOT_INCOMPATIBLE_GROUP_TYPE. */
		public static final int NETSHOT_INCOMPATIBLE_GROUP_TYPE = 162;

		/** The Constant NETSHOT_INVALID_DEVICE_IN_STATICGROUP. */
		public static final int NETSHOT_INVALID_DEVICE_IN_STATICGROUP = 163;

		/** The Constant NETSHOT_INVALID_GROUP. */
		public static final int NETSHOT_INVALID_GROUP = 164;

		/** The Constant NETSHOT_INVALID_DYNAMICGROUP_QUERY. */
		public static final int NETSHOT_INVALID_DYNAMICGROUP_QUERY = 165;

		/** The Constant NETSHOT_INVALID_SUBNET. */
		public static final int NETSHOT_INVALID_SUBNET = 170;

		/** The Constant NETSHOT_SCAN_SUBNET_TOO_BIG. */
		public static final int NETSHOT_SCAN_SUBNET_TOO_BIG = 171;

		/** The Constant NETSHOT_INVALID_POLICY_NAME. */
		public static final int NETSHOT_INVALID_POLICY_NAME = 180;

		/** The Constant NETSHOT_INVALID_POLICY. */
		public static final int NETSHOT_INVALID_POLICY = 181;

		/** The Constant NETSHOT_DUPLICATE_POLICY. */
		public static final int NETSHOT_DUPLICATE_POLICY = 182;

		/** The Constant NETSHOT_INVALID_RULE_NAME. */
		public static final int NETSHOT_INVALID_RULE_NAME = 190;

		/** The Constant NETSHOT_INVALID_RULE. */
		public static final int NETSHOT_INVALID_RULE = 191;

		/** The Constant NETSHOT_DUPLICATE_RULE. */
		public static final int NETSHOT_DUPLICATE_RULE = 192;

		/** The Constant NETSHOT_INVALID_USER. */
		public static final int NETSHOT_INVALID_USER = 200;

		/** The Constant NETSHOT_DUPLICATE_USER. */
		public static final int NETSHOT_DUPLICATE_USER = 201;

		/** The Constant NETSHOT_INVALID_USER_NAME. */
		public static final int NETSHOT_INVALID_USER_NAME = 202;

		/** The Constant NETSHOT_INVALID_PASSWORD. */
		public static final int NETSHOT_INVALID_PASSWORD = 203;

		/** The Constant serialVersionUID. */
		private static final long serialVersionUID = -4538169756895835186L;

		/**
		 * Instantiates a new netshot bad request exception.
		 *
		 * @param message the message
		 * @param errorCode the error code
		 */
		public NetshotBadRequestException(String message, int errorCode) {
			super(Response.status(Response.Status.BAD_REQUEST)
					.entity(new RsErrorBean(message, errorCode)).build());
		}
	}

	/**
	 * Gets the domains.
	 *
	 * @param request the request
	 * @return the domains
	 * @throws WebApplicationException the web application exception
	 */
	@SuppressWarnings("unchecked")
	@GET
	@Path("domains")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsDomain> getDomains(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, domains.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		List<Domain> domains;
		try {
			domains = session.createCriteria(Domain.class).list();
			List<RsDomain> rsDomains = new ArrayList<RsDomain>();
			for (Domain domain : domains) {
				rsDomains.add(new RsDomain(domain));
			}
			return rsDomains;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the domains.", e);
			throw new NetshotBadRequestException("Unable to fetch the domains",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
			this.ipAddress = domain.getServer4Address().getIP();
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
	@Path("domains")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public RsDomain addDomain(@Context HttpServletRequest request, RsDomain newDomain) throws WebApplicationException {
		logger.debug("REST request, add a domain");
		authorize(request, User.LEVEL_READWRITE);
		String name = newDomain.getName().trim();
		if (name.isEmpty()) {
			logger.warn("User posted an empty domain name.");
			throw new NetshotBadRequestException("Invalid domain name.",
					NetshotBadRequestException.NETSHOT_INVALID_DOMAIN_NAME);
		}
		String description = newDomain.getDescription().trim();
		try {
			Network4Address v4Address = new Network4Address(newDomain.getIpAddress());
			Network6Address v6Address = new Network6Address("::");
			if (!v4Address.isNormalUnicast()) {
				logger.warn("User posted an invalid IP address.");
				throw new NetshotBadRequestException("Invalid IP address",
						NetshotBadRequestException.NETSHOT_INVALID_IP_ADDRESS);
			}
			Domain domain = new Domain(name, description, v4Address, v6Address);
			Session session = NetshotDatabase.getSession();
			try {
				session.beginTransaction();
				session.save(domain);
				session.getTransaction().commit();
			}
			catch (HibernateException e) {
				session.getTransaction().rollback();
				logger.error("Error while adding a domain.", e);
				Throwable t = e.getCause();
				if (t != null && t.getMessage().contains("Duplicate entry")) {
					throw new NetshotBadRequestException(
							"A domain with this name already exists.",
							NetshotBadRequestException.NETSHOT_DUPLICATE_DOMAIN);
				}
				throw new NetshotBadRequestException(
						"Unable to add the domain to the database",
						NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			return new RsDomain(domain);
		}
		catch (UnknownHostException e) {
			logger.warn("User posted an invalid IP address.");
			throw new NetshotBadRequestException("Malformed IP address",
					NetshotBadRequestException.NETSHOT_MALFORMED_IP_ADDRESS);
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
	@Path("domains/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public RsDomain setDomain(@Context HttpServletRequest request, @PathParam("id") Long id, RsDomain rsDomain)
			throws WebApplicationException {
		logger.debug("REST request, edit domain {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		String name = rsDomain.getName().trim();
		if (name.isEmpty()) {
			logger.warn("User posted an invalid domain name.");
			throw new NetshotBadRequestException("Invalid domain name.",
					NetshotBadRequestException.NETSHOT_INVALID_DOMAIN_NAME);
		}
		String description = rsDomain.getDescription().trim();
		Network4Address v4Address;
		try {
			v4Address = new Network4Address(rsDomain.getIpAddress());
			if (!v4Address.isNormalUnicast()) {
				logger.warn("User posted an invalid IP address");
				throw new NetshotBadRequestException("Invalid IP address",
						NetshotBadRequestException.NETSHOT_INVALID_IP_ADDRESS);
			}
		}
		catch (UnknownHostException e) {
			logger.warn("Invalid IP address.", e);
			throw new NetshotBadRequestException("Malformed IP address",
					NetshotBadRequestException.NETSHOT_MALFORMED_IP_ADDRESS);
		}
		Session session = NetshotDatabase.getSession();
		Domain domain;
		try {
			session.beginTransaction();
			domain = (Domain) session.load(Domain.class, id);
			domain.setName(name);
			domain.setDescription(description);
			domain.setServer4Address(v4Address);
			session.update(domain);
			session.getTransaction().commit();
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The domain doesn't exist.", e);
			throw new NetshotBadRequestException("The domain doesn't exist.",
					NetshotBadRequestException.NETSHOT_INVALID_DOMAIN);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while editing the domain.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("Duplicate entry")) {
				throw new NetshotBadRequestException(
						"A domain with this name already exists.",
						NetshotBadRequestException.NETSHOT_DUPLICATE_DOMAIN);
			}
			throw new NetshotBadRequestException(
					"Unable to save the domain... is the name already in use?",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("domains/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public void deleteDomain(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete domain {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			Domain domain = (Domain) session.load(Domain.class, id);
			session.delete(domain);
			session.getTransaction().commit();
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The domain doesn't exist.");
			throw new NetshotBadRequestException("The domain doesn't exist.",
					NetshotBadRequestException.NETSHOT_INVALID_DOMAIN);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("foreign key constraint fails")) {
				throw new NetshotBadRequestException(
						"Unable to delete the domain, there must be devices or tasks using it.",
						NetshotBadRequestException.NETSHOT_USED_DOMAIN);
			}
			throw new NetshotBadRequestException("Unable to delete the domain",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@SuppressWarnings("unchecked")
	@GET
	@Path("devices/{id}/interfaces")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<NetworkInterface> getDeviceInterfaces(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, get device {} interfaces.", id);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			List<NetworkInterface> deviceInterfaces;
			deviceInterfaces = session
					.createQuery(
							"from NetworkInterface AS networkInterface "
									+ "left join fetch networkInterface.ip4Addresses "
									+ "left join fetch networkInterface.ip6Addresses "
									+ "where device = :device").setLong("device", id)
									.setResultTransformer(Criteria.DISTINCT_ROOT_ENTITY).list();
			return deviceInterfaces;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the interfaces.", e);
			throw new NetshotBadRequestException("Unable to fetch the interfaces",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@SuppressWarnings("unchecked")
	@GET
	@Path("devices/{id}/modules")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<Module> getDeviceModules(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, get device {} modules.", id);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			List<Module> deviceModules = session
					.createQuery("from Module m where device = :device")
					.setLong("device", id).list();
			return deviceModules;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the modules.", e);
			throw new NetshotBadRequestException("Unable to fetch the modules",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the device last 20 tasks.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the device tasks
	 * @throws WebApplicationException the web application exception
	 */
	@SuppressWarnings("unchecked")
	@GET
	@Path("devices/{id}/tasks")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<Task> getDeviceTasks(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, get device {} tasks.", id);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			final int max = 20;
			final Class<?>[] taskTypes = new Class<?>[] {
					CheckComplianceTask.class,
					DiscoverDeviceTypeTask.class,
					TakeSnapshotTask.class
			};
			final Criterion[] restrictions = new Criterion[] {
					Restrictions.eq("t.device.id", id),
					Restrictions.eq("t.deviceId", id),
					Restrictions.eq("t.device.id", id)
			};
			List<Task> tasks = new ArrayList<Task>();
			for (int i = 0; i < taskTypes.length; i++) {
				List<Task> typeTasks = session
						.createCriteria(taskTypes[i], "t")
						.add(restrictions[i])
						.list();
				tasks.addAll(typeTasks);
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
			return tasks.subList(0, (max > tasks.size() ? tasks.size() : max));
		}
		catch (Exception e) {
			logger.error("Unable to fetch the tasks.", e);
			throw new NetshotBadRequestException("Unable to fetch the tasks",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("devices/{id}/configs")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<Config> getDeviceConfigs(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, get device {} configs.", id);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<Config> deviceConfigs = session
			.createQuery("from Config c where device = :device")
			.setLong("device", id).list();
			return deviceConfigs;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the configs.", e);
			throw new NetshotBadRequestException("Unable to fetch the configs",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * Gets the device config plain.
	 *
	 * @param request the request
	 * @param id the id
	 * @param item the item
	 * @return the device config plain
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("configs/{id}/{item}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_OCTET_STREAM })
	public Response getDeviceConfigPlain(@Context HttpServletRequest request, @PathParam("id") Long id,
			@PathParam("item") String item) throws WebApplicationException {
		logger.debug("REST request, get device {id} config {}.", id, item);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			Config config = (Config) session.get(Config.class, id);
			if (config == null) {
				logger.warn("Unable to find the config object.");
				throw new WebApplicationException(
						"Unable to find the configuration set",
						javax.ws.rs.core.Response.Status.NOT_FOUND);
			}
			String text = config.getItem(item);
			if (text == null) {
				throw new WebApplicationException("Configuration item not available",
						javax.ws.rs.core.Response.Status.BAD_REQUEST);
			}
			String fileName = "config.cfg";
			try {
				SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd_hh-mm");
				fileName = String.format("%s_%s.cfg", config.getDevice().getName(), formatter.format(config.getChangeDate()));
			}
			catch (Exception e) {
			}
			return Response.ok(text)
					.header("Content-Disposition", "attachment; filename=" + fileName)
					.build();
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
		public Date getOriginalDate() {
			return originalDate;
		}

		/**
		 * Gets the revised date.
		 *
		 * @return the revised date
		 */
		@XmlElement
		public Date getRevisedDate() {
			return revisedDate;
		}

		/**
		 * Gets the deltas.
		 *
		 * @return the deltas
		 */
		@XmlElement
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
		public Type getDiffType() {
			return diffType;
		}

		/**
		 * Gets the original position.
		 *
		 * @return the original position
		 */
		@XmlElement
		public int getOriginalPosition() {
			return originalPosition;
		}

		/**
		 * Gets the revised position.
		 *
		 * @return the revised position
		 */
		@XmlElement
		public int getRevisedPosition() {
			return revisedPosition;
		}

		/**
		 * Gets the original lines.
		 *
		 * @return the original lines
		 */
		@XmlElement
		public List<String> getOriginalLines() {
			return originalLines;
		}

		/**
		 * Gets the revised lines.
		 *
		 * @return the revised lines
		 */
		@XmlElement
		public List<String> getRevisedLines() {
			return revisedLines;
		}

		/**
		 * Gets the item.
		 *
		 * @return the item
		 */
		@XmlElement
		public String getItem() {
			return item;
		}

		/**
		 * Gets the pre context.
		 *
		 * @return the pre context
		 */
		@XmlElement
		public List<String> getPreContext() {
			return preContext;
		}

		/**
		 * Gets the post context.
		 *
		 * @return the post context
		 */
		@XmlElement
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
	@Path("configs/{id1}/vs/{id2}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON })
	public RsConfigDiff getDeviceConfigDiff(@Context HttpServletRequest request, @PathParam("id1") Long id1,
			@PathParam("id2") Long id2) {
		logger.debug("REST request, get device config diff, id {} and {}.", id1,
				id2);
		authorize(request, User.LEVEL_READONLY);
		RsConfigDiff configDiffs;
		Session session = NetshotDatabase.getSession();
		Config config1 = null;
		Config config2 = null;
		try {
			config1 = (Config) session.get(Config.class, id1);
			config2 = (Config) session.get(Config.class, id2);
			if (config1 == null || config2 == null) {
				logger.error("Non existing config, {} or {}.", id1, id2);
				throw new NetshotBadRequestException("Unable to fetch the configs",
						NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			if (!config1.getClass().equals(config2.getClass())) {
				logger.error("Incompatible configurations, {} and {}.", id1, id2);
				throw new NetshotBadRequestException("Incompatible configurations",
						NetshotBadRequestException.NETSHOT_INCOMPATIBLE_CONFIGS);
			}
			configDiffs = new RsConfigDiff(config1.getChangeDate(),
					config2.getChangeDate());
			Map<String, String> items1 = config1.getDiffableItems();
			Map<String, String> items2 = config2.getDiffableItems();
			for (Map.Entry<String, String> item1 : items1.entrySet()) {
				String item = item1.getKey();
				List<String> lines1 = Arrays.asList(item1.getValue().replace("\r", "")
						.split("\n"));
				List<String> lines2 = Arrays.asList(items2.get(item).replace("\r", "")
						.split("\n"));
				Patch<String> patch = DiffUtils.diff(lines1, lines2);
				for (Delta<String> delta : patch.getDeltas()) {
					configDiffs.addDelta(item, new RsConfigDelta(delta, lines1));
				}
			}
			return configDiffs;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the configs", e);
			throw new NetshotBadRequestException("Unable to fetch the configs",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("devices/{id}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Device getDevice(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, device {}.", id);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		Device device;
		try {
			device = (Device) session
					.createQuery(
							"from Device d left join fetch d.credentialSets cs left join fetch d.ownerGroups g left join fetch d.complianceCheckResults left join fetch d.eolModule left join fetch d.eosModule where d.id = :id")
							.setLong("id", id).uniqueResult();
			if (device == null) {
				throw new NetshotBadRequestException("Can't find this device",
						NetshotBadRequestException.NETSHOT_INVALID_DEVICE);
			}
			device.setMgmtDomain(NetshotDatabase.unproxy(device.getMgmtDomain()));
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the device", e);
			throw new NetshotBadRequestException("Unable to fetch the device",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("devices")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<Device> getDevices(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, devices.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<Device> devices = session.createQuery(DEVICELIST_BASEQUERY + "from Device d")
			.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class))
			.list();
			return devices;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the devices", e);
			throw new NetshotBadRequestException("Unable to fetch the devices",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	/**
	 * The Class RsDeviceType.
	 */
	@XmlRootElement(name = "deviceType")
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsDeviceType {

		/** The name. */
		private String name;

		/** The description. */
		private String description;

		/**
		 * Instantiates a new rs device type.
		 */
		public RsDeviceType() {
		}

		/**
		 * Instantiates a new rs device type.
		 *
		 * @param deviceClass the device class
		 */
		public RsDeviceType(Class<? extends Device> deviceClass) {
			this.name = deviceClass.getName();
			try {
				this.description = (String) deviceClass.getMethod("getDeviceType")
						.invoke(null);
			}
			catch (Exception e) {
				this.description = "";
			}
		}

		/**
		 * Gets the name.
		 *
		 * @return the name
		 */
		@XmlElement
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
	}

	/**
	 * Gets the device types.
	 *
	 * @param request the request
	 * @return the device types
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("devicetypes")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsDeviceType> getDeviceTypes(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, device types.");
		authorize(request, User.LEVEL_READONLY);
		List<RsDeviceType> deviceTypes = new ArrayList<RsDeviceType>();
		Set<Class<? extends Device>> deviceClasses = Device.getDeviceClasses();
		for (Class<? extends Device> deviceClass : deviceClasses) {
			deviceTypes.add(new RsDeviceType(deviceClass));
		}
		return deviceTypes;
	}

	/**
	 * The Class RsDeviceFamily.
	 */
	@XmlRootElement(name = "deviceType")
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsDeviceFamily {

		/** The device type. */
		private Class<? extends Device> deviceType;

		/** The device family. */
		private String deviceFamily;

		/**
		 * Gets the device type.
		 *
		 * @return the device type
		 */
		@XmlElement
		public Class<? extends Device> getDeviceType() {
			return deviceType;
		}

		/**
		 * Sets the device type.
		 *
		 * @param deviceType the new device type
		 */
		public void setDeviceType(Class<? extends Device> deviceType) {
			this.deviceType = deviceType;
		}

		/**
		 * Gets the device family.
		 *
		 * @return the device family
		 */
		@XmlElement
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
	@Path("devicefamilies")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsDeviceFamily> getDeviceFamilies(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, device families.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<RsDeviceFamily> deviceFamilies = session
			.createQuery("select distinct type(d) as deviceType, d.family as deviceFamily from Device d")
			.setResultTransformer(Transformers.aliasToBean(RsDeviceFamily.class))
			.list();
			return deviceFamilies;
		}
		catch (HibernateException e) {
			logger.error("Error while loading device families.", e);
			throw new NetshotBadRequestException("Database error",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("partnumbers")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsPartNumber> getPartNumbers(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, dpart numbers.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<RsPartNumber> partNumbers = session
			.createQuery("select distinct m.partNumber as partNumber from Module m")
			.setResultTransformer(Transformers.aliasToBean(RsPartNumber.class))
			.list();
			return partNumbers;
		}
		catch (HibernateException e) {
			logger.error("Error while loading part numbers.", e);
			throw new NetshotBadRequestException("Database error",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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

		/**
		 * Checks if is auto discover.
		 *
		 * @return true, if is auto discover
		 */
		@XmlElement
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
	}

	/**
	 * Adds the device.
	 *
	 * @param request the request
	 * @param device the device
	 * @return the task
	 * @throws WebApplicationException the web application exception
	 */
	@SuppressWarnings("unchecked")
	@POST
	@Path("devices")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Task addDevice(@Context HttpServletRequest request, RsNewDevice device) throws WebApplicationException {
		logger.debug("REST request, new device.");
		User user = authorize(request, User.LEVEL_READWRITE);
		Network4Address deviceAddress;
		try {
			deviceAddress = new Network4Address(device.getIpAddress());
			if (!deviceAddress.isNormalUnicast()) {
				logger.warn("User posted an invalid IP address (not normal unicast).");
				throw new NetshotBadRequestException("Invalid IP address",
						NetshotBadRequestException.NETSHOT_INVALID_IP_ADDRESS);
			}
		}
		catch (UnknownHostException e) {
			logger.warn("User posted an invalid IP address.");
			throw new NetshotBadRequestException("Malformed IP address",
					NetshotBadRequestException.NETSHOT_MALFORMED_IP_ADDRESS);
		}
		Domain domain;
		List<DeviceCredentialSet> knownCommunities;
		Session session = NetshotDatabase.getSession();
		try {
			logger.debug("Looking for an existing device with this IP address.");
			Device duplicate = (Device) session
					.createQuery("from Device d where d.mgmtAddress.address = :ip")
					.setInteger("ip", deviceAddress.getIntAddress()).uniqueResult();
			if (duplicate != null) {
				logger.error("Device {} is already present with this IP address.",
						duplicate.getId());
				throw new NetshotBadRequestException(String.format(
						"The device '%s' already exists with this IP address.",
						duplicate.getName()),
						NetshotBadRequestException.NETSHOT_DUPLICATE_DEVICE);
			}
			domain = (Domain) session.load(Domain.class, device.getDomainId());
			knownCommunities = session.createCriteria(DeviceSnmpCommunity.class)
					.list();
			if (knownCommunities.size() == 0) {
				logger.error("No available SNMP community");
				throw new NetshotBadRequestException(
						"There is no known SNMP community in the database to poll the device.",
						NetshotBadRequestException.NETSHOT_CREDENTIALS_NOTFOUND);
			}
		}
		catch (ObjectNotFoundException e) {
			logger.error("Non existing domain.", e);
			throw new NetshotBadRequestException("Invalid domain",
					NetshotBadRequestException.NETSHOT_INVALID_DOMAIN);
		}
		catch (HibernateException e) {
			logger.error("Error while loading domain or communities.", e);
			throw new NetshotBadRequestException("Database error",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		if (device.isAutoDiscover()) {
			try {
				DiscoverDeviceTypeTask task = new DiscoverDeviceTypeTask(deviceAddress, domain,
						String.format("Device added by %s", user.getUsername()));
				task.setComments(String.format("Autodiscover device %s",
						deviceAddress.getIP()));
				for (DeviceCredentialSet credentialSet : knownCommunities) {
					task.addCredentialSet(credentialSet);
				}
				NetshotTaskManager.addTask(task);
				return task;
			}
			catch (SchedulerException e) {
				logger.error("Unable to schedule the discovery task.", e);
				throw new NetshotBadRequestException("Unable to schedule the task",
						NetshotBadRequestException.NETSHOT_SCHEDULE_ERROR);
			}
			catch (HibernateException e) {
				logger.error("Error while adding the discovery task.", e);
				throw new NetshotBadRequestException("Database error",
						NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
			}
		}
		else {
			Class<? extends Device> deviceClass = null;
			for (Class<? extends Device> clazz : Device.getDeviceClasses()) {
				if (clazz.getName().equals(device.getDeviceType())) {
					deviceClass = clazz;
					break;
				}
			}
			if (deviceClass == null) {
				logger.warn("Invalid poster device class.");
				throw new NetshotBadRequestException("Invalid device type.",
						NetshotBadRequestException.NETSHOT_INVALID_DEVICE_CLASSNAME);
			}
			session = NetshotDatabase.getSession();
			TakeSnapshotTask task;
			Device newDevice = null;
			try {
				session.beginTransaction();
				newDevice = deviceClass
						.getDeclaredConstructor(Network4Address.class, Domain.class)
						.newInstance(deviceAddress, domain);
				session.save(newDevice);
				task = new TakeSnapshotTask(newDevice, "Initial snapshot after device creation");
				session.save(task);
				session.getTransaction().commit();
			}
			catch (Exception e) {
				session.getTransaction().rollback();
				logger.error("Error while creating the device", e);
				throw new NetshotBadRequestException("Database error",
						NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			if (newDevice != null) {
				DynamicDeviceGroup.refreshAllGroups(newDevice);
			}
			try {
				NetshotTaskManager.addTask(task);
				return task;
			}
			catch (HibernateException e) {
				logger.error("Unable to add the task.", e);
				throw new NetshotBadRequestException(
						"Unable to add the task to the database.",
						NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			catch (SchedulerException e) {
				logger.error("Unable to schedule the task.", e);
				throw new NetshotBadRequestException("Unable to schedule the task.",
						NetshotBadRequestException.NETSHOT_SCHEDULE_ERROR);
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
	@Path("devices/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public void deleteDevice(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete device {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			Device device = (Device) session.load(Device.class, id);
			for (DeviceGroup group : device.getOwnerGroups()) {
				group.deleteCachedDevice(device);
			}
			session.delete(device);
			session.getTransaction().commit();
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the device {}.", id, e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("foreign key constraint fails")) {
				throw new NetshotBadRequestException(
						"Unable to delete the device, there must be other objects using it.",
						NetshotBadRequestException.NETSHOT_USED_DEVICE);
			}
			throw new NetshotBadRequestException("Unable to delete the device",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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

		/** The auto try credentials. */
		private Boolean autoTryCredentials = null;

		/** The credential set ids. */
		private List<Long> credentialSetIds = null;

		private List<Long> clearCredentialSetIds = null;

		private Long mgmtDomain = null;

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
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
		public Boolean isEnabled() {
			return enabled;
		}

		/**
		 * Sets the enable.
		 *
		 * @param enable the new enable
		 */
		public void setEnabled(Boolean enabled) {
			this.enabled = enabled;
		}

		@XmlElement
		public Long getMgmtDomain() {
			return mgmtDomain;
		}

		public void setMgmtDomain(Long mgmtDomain) {
			this.mgmtDomain = mgmtDomain;
		}

		@XmlElement
		public List<Long> getClearCredentialSetIds() {
			return clearCredentialSetIds;
		}

		public void setClearCredentialSetIds(List<Long> clearCredentialSetIds) {
			this.clearCredentialSetIds = clearCredentialSetIds;
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
	@Path("devices/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Device setDevice(@Context HttpServletRequest request, @PathParam("id") Long id, RsDevice rsDevice)
			throws WebApplicationException {
		logger.debug("REST request, edit device {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Device device;
		Session session = NetshotDatabase.getSession();
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
							NetshotBadRequestException.NETSHOT_INVALID_IP_ADDRESS);
				}
				device.setMgmtAddress(v4Address);
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
			if (rsDevice.getMgmtDomain() != null) {
				Domain domain = (Domain) session.load(Domain.class, rsDevice.getMgmtDomain());
				device.setMgmtDomain(domain);
			}
			session.update(device);
			session.getTransaction().commit();
		}
		catch (UnknownHostException e) {
			session.getTransaction().rollback();
			logger.warn("User posted an invalid IP address.", e);
			throw new NetshotBadRequestException("Malformed IP address",
					NetshotBadRequestException.NETSHOT_MALFORMED_IP_ADDRESS);
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The device doesn't exist.", e);
			throw new NetshotBadRequestException("The device doesn't exist anymore.",
					NetshotBadRequestException.NETSHOT_INVALID_DEVICE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Cannot edit the device.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("Duplicate entry")) {
				throw new NetshotBadRequestException(
						"A device with this IP address already exists.",
						NetshotBadRequestException.NETSHOT_DUPLICATE_DEVICE);
			}
			if (t != null && t.getMessage().contains("domain")) {
				throw new NetshotBadRequestException("Unable to find the domain",
						NetshotBadRequestException.NETSHOT_INVALID_DOMAIN);
			}
			throw new NetshotBadRequestException("Unable to save the device.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		DynamicDeviceGroup.refreshAllGroups(device);
		return this.getDevice(request, id);
	}

	/**
	 * Gets the task.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the task
	 */
	@GET
	@Path("tasks/{id}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Task getTask(@Context HttpServletRequest request, @PathParam("id") Long id) {
		logger.debug("REST request, get task {}", id);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		Task task;
		try {
			task = (Task) session.get(Task.class, id);
			return task;
		}
		catch (ObjectNotFoundException e) {
			logger.error("Unable to find the task {}.", id, e);
			throw new NetshotBadRequestException("Task not found",
					NetshotBadRequestException.NETSHOT_INVALID_TASK);
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the task {}.", id, e);
			throw new NetshotBadRequestException("Unable to fetch the task",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("tasks")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<Task> getTasks(@Context HttpServletRequest request) {
		logger.debug("REST request, get tasks.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<Task> tasks = session.createQuery("from Task t order by t.id desc")
			.list();
			return tasks;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the tasks.", e);
			throw new NetshotBadRequestException("Unable to fetch the tasks",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@SuppressWarnings("unchecked")
	@GET
	@Path("credentialsets")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<DeviceCredentialSet> getCredentialSets(@Context HttpServletRequest request)
			throws WebApplicationException {
		logger.debug("REST request, get credentials.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		List<DeviceCredentialSet> credentialSets;
		try {
			credentialSets = session.createCriteria(DeviceCredentialSet.class).list();
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the credentials.", e);
			throw new NetshotBadRequestException("Unable to fetch the credentials",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("credentialsets/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public void deleteCredentialSet(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete credentials {}", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			DeviceCredentialSet credentialSet = (DeviceCredentialSet) session.load(
					DeviceCredentialSet.class, id);
			session.delete(credentialSet);
			session.getTransaction().commit();
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the credentials {}", id, e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("foreign key constraint fails")) {
				throw new NetshotBadRequestException(
						"Unable to delete the credential set, there must be devices or tasks using it.",
						NetshotBadRequestException.NETSHOT_USED_CREDENTIALS);
			}
			throw new NetshotBadRequestException(
					"Unable to delete the credential set",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("credentialsets")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public DeviceCredentialSet addCredentialSet(@Context HttpServletRequest request, DeviceCredentialSet credentialSet)
			throws WebApplicationException {
		logger.debug("REST request, add credentials.");
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			if (credentialSet.getMgmtDomain() != null) {
				credentialSet.setMgmtDomain((Domain) session.load(Domain.class, credentialSet.getMgmtDomain().getId()));
			}
			session.save(credentialSet);
			session.getTransaction().commit();
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			Throwable t = e.getCause();
			logger.error("Can't add the credentials.", e);
			if (t != null && t.getMessage().contains("Duplicate entry")) {
				throw new NetshotBadRequestException(
						"A credential set with this name already exists.",
						NetshotBadRequestException.NETSHOT_DUPLICATE_CREDENTIALS);
			}
			else if (t != null && t.getMessage().contains("mgmt_domain")) {
				throw new NetshotBadRequestException(
						"The domain doesn't exist.",
						NetshotBadRequestException.NETSHOT_INVALID_DOMAIN);
			}
			throw new NetshotBadRequestException("Unable to save the credential set",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
		return credentialSet;
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
	@Path("credentialsets/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public DeviceCredentialSet setCredentialSet(@Context HttpServletRequest request, @PathParam("id") Long id,
			DeviceCredentialSet rsCredentialSet) throws WebApplicationException {
		logger.debug("REST request, edit credentials {}", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		DeviceCredentialSet credentialSet;
		try {
			session.beginTransaction();
			credentialSet = (DeviceCredentialSet) session.get(
					rsCredentialSet.getClass(), id);
			if (credentialSet == null) {
				logger.error("Unable to find the credential set {}.", id);
				throw new NetshotBadRequestException(
						"Unable to find the credential set.",
						NetshotBadRequestException.NETSHOT_CREDENTIALS_NOTFOUND);
			}
			if (!credentialSet.getClass().equals(rsCredentialSet.getClass())) {
				logger.error("Wrong posted credential type for credential set {}.", id);
				throw new NetshotBadRequestException(
						"The posted credential type doesn't match the existing one.",
						NetshotBadRequestException.NETSHOT_INVALID_CREDENTIALS_TYPE);
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
			}
			else if (DeviceSnmpCommunity.class.isInstance(credentialSet)) {
				((DeviceSnmpCommunity) credentialSet)
				.setCommunity(((DeviceSnmpCommunity) rsCredentialSet)
						.getCommunity());
			}
			session.update(credentialSet);
			session.getTransaction().commit();
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			Throwable t = e.getCause();
			logger.error("Unable to save the credentials {}.", id, e);
			if (t != null && t.getMessage().contains("Duplicate entry")) {
				throw new NetshotBadRequestException(
						"A credential set with this name already exists.",
						NetshotBadRequestException.NETSHOT_DUPLICATE_CREDENTIALS);
			}
			else if (t != null && t.getMessage().contains("mgmt_domain")) {
				throw new NetshotBadRequestException(
						"The domain doesn't exist.",
						NetshotBadRequestException.NETSHOT_INVALID_DOMAIN);
			}
			throw new NetshotBadRequestException("Unable to save the credential set",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	 * Gets the searchable config fields.
	 *
	 * @param request the request
	 * @param deviceClassName the device class name
	 * @return the searchable config fields
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("deviceconfigfields/{deviceclass}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Map<String, List<ConfigItem.Comparator>> getSearchableConfigFields(
			@Context HttpServletRequest request,
			@PathParam("deviceclass") String deviceClassName)
					throws WebApplicationException {
		logger.debug("REST request, searchable config fiels for class {}",
				deviceClassName);
		authorize(request, User.LEVEL_READONLY);
		Map<String, List<ConfigItem.Comparator>> fields = Finder
				.getSearchableFieldNames(Device.class);
		for (Class<? extends Device> deviceClass : Device.getDeviceClasses()) {
			if (deviceClass.getName().compareTo(deviceClassName) == 0) {
				fields = Finder.getSearchableFieldNames(deviceClass);
			}
		}
		fields.put("Module", Arrays.asList(ConfigItem.Comparator.TEXT));
		fields.put("Domain", Arrays.asList(ConfigItem.Comparator.ENUM));
		fields.put("IP", Arrays.asList(ConfigItem.Comparator.IPADDRESS));
		fields.put("MAC", Arrays.asList(ConfigItem.Comparator.MACADDRESS));
		return fields;
	}

	/**
	 * The Class RsSearchCriteria.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsSearchCriteria {

		/** The device class name. */
		private String deviceClassName;

		/** The query. */
		private String query;

		/**
		 * Gets the device class name.
		 *
		 * @return the device class name
		 */
		@XmlElement
		public String getDeviceClassName() {
			return deviceClassName;
		}

		/**
		 * Sets the device class name.
		 *
		 * @param deviceClassName the new device class name
		 */
		public void setDeviceClassName(String deviceClassName) {
			this.deviceClassName = deviceClassName;
		}

		/**
		 * Gets the query.
		 *
		 * @return the query
		 */
		@XmlElement
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
		private List<Device> devices;

		/**
		 * Gets the query.
		 *
		 * @return the query
		 */
		@XmlElement
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
		public List<Device> getDevices() {
			return devices;
		}

		/**
		 * Sets the devices.
		 *
		 * @param devices the new devices
		 */
		public void setDevices(List<Device> devices) {
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
	@Path("devices/search")
	@RolesAllowed("user")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public RsSearchResults searchDevices(@Context HttpServletRequest request, RsSearchCriteria criteria)
			throws WebApplicationException {
		logger.debug("REST request, search devices, query '{}', class '{}'.",
				criteria.getQuery(), criteria.getDeviceClassName());
		authorize(request, User.LEVEL_READONLY);
		Class<? extends Device> deviceClass = Device.class;

		for (Class<? extends Device> clazz : Device.getDeviceClasses()) {
			if (clazz.getName().compareTo(criteria.getDeviceClassName()) == 0) {
				deviceClass = clazz;
				break;
			}
		}
		try {
			Finder finder = new Finder(criteria.getQuery(), deviceClass);
			Session session = NetshotDatabase.getSession();
			try {
				Query query = session.createQuery(DEVICELIST_BASEQUERY
						+ finder.getHql());
				finder.setVariables(query);
				@SuppressWarnings("unchecked")
				List<Device> devices = query
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
						NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		catch (FinderParseException e) {
			logger.warn("User's query is invalid.", e);
			throw new NetshotBadRequestException("Invalid search string. "
					+ e.getMessage(),
					NetshotBadRequestException.NETSHOT_INVALID_SEARCH_STRING);
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
	@Path("groups")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public DeviceGroup addGroup(@Context HttpServletRequest request, DeviceGroup deviceGroup)
			throws WebApplicationException {
		logger.debug("REST request, add group.");
		authorize(request, User.LEVEL_READWRITE);
		String name = deviceGroup.getName().trim();
		if (name.isEmpty()) {
			logger.warn("User posted an empty group name.");
			throw new NetshotBadRequestException("Invalid group name.",
					NetshotBadRequestException.NETSHOT_INVALID_GROUP_NAME);
		}
		deviceGroup.setName(name);
		deviceGroup.setId(0);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			session.save(deviceGroup);
			session.getTransaction().commit();
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new device group.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("Duplicate entry")) {
				throw new NetshotBadRequestException(
						"A group with this name already exists.",
						NetshotBadRequestException.NETSHOT_DUPLICATE_GROUP);
			}
			throw new NetshotBadRequestException(
					"Unable to add the group to the database",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("groups")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<DeviceGroup> getGroups(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, get groups.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<DeviceGroup> deviceGroups = session
			.createCriteria(DeviceGroup.class).list();
			return deviceGroups;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the groups.", e);
			throw new NetshotBadRequestException("Unable to fetch the groups",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("groups/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public void deleteGroup(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete group {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			DeviceGroup deviceGroup = (DeviceGroup) session.load(DeviceGroup.class,
					id);
			session.delete(deviceGroup);
			session.getTransaction().commit();
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The group {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The group doesn't exist.",
					NetshotBadRequestException.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the group {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the group",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
		private String deviceClassName;

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
		public String getDeviceClassName() {
			return deviceClassName;
		}

		/**
		 * Sets the device class name.
		 *
		 * @param deviceClassName the new device class name
		 */
		public void setDeviceClassName(String deviceClassName) {
			this.deviceClassName = deviceClassName;
		}

		/**
		 * Gets the query.
		 *
		 * @return the query
		 */
		@XmlElement
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
		public String getFolder() {
			return folder;
		}

		public void setFolder(String folder) {
			this.folder = folder;
		}

		@XmlElement
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
	@Path("groups/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public DeviceGroup setGroup(@Context HttpServletRequest request, @PathParam("id") Long id, RsDeviceGroup rsGroup)
			throws WebApplicationException {
		logger.debug("REST request, edit group {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			DeviceGroup group = (DeviceGroup) session.get(DeviceGroup.class, id);
			if (group == null) {
				logger.error("Unable to find the group {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this group.",
						NetshotBadRequestException.NETSHOT_INVALID_GROUP);
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
				Class<? extends Device> deviceClass = Device.class;
				for (Class<? extends Device> clazz : Device.getDeviceClasses()) {
					if (clazz.getName().compareTo(rsGroup.getDeviceClassName()) == 0) {
						deviceClass = clazz;
						break;
					}
				}
				dynamicGroup.setDeviceClass(deviceClass);
				dynamicGroup.setQuery(rsGroup.getQuery());
				try {
					dynamicGroup.refreshCache(session);
				}
				catch (FinderParseException e) {
					throw new NetshotBadRequestException(
							"Invalid query for the group definition.",
							NetshotBadRequestException.NETSHOT_INVALID_DYNAMICGROUP_QUERY);
				}
			}
			else {
				throw new NetshotBadRequestException("Unknown group type.",
						NetshotBadRequestException.NETSHOT_INCOMPATIBLE_GROUP_TYPE);
			}
			group.setFolder(rsGroup.getFolder());
			group.setHiddenFromReports(rsGroup.isHiddenFromReports());
			session.update(group);
			session.getTransaction().commit();
			return group;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("Unable to find a device while editing group {}.", id, e);
			throw new NetshotBadRequestException(
					"Unable to find a device. Refresh and try again.",
					NetshotBadRequestException.NETSHOT_INVALID_DEVICE_IN_STATICGROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to save the group {}.", id, e);
			throw new NetshotBadRequestException("Unable to save the group.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("devices/group/{id}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<Device> getGroupDevices(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, get devices from group {}.", id);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		DeviceGroup group;
		try {
			group = (DeviceGroup) session.get(DeviceGroup.class, id);
			if (group == null) {
				logger.error("Unable to find the group {}.", id);
				throw new NetshotBadRequestException("Can't find this group",
						NetshotBadRequestException.NETSHOT_INVALID_GROUP);
			}
			Query query = session.createQuery(
					NetshotRestService.DEVICELIST_BASEQUERY
					+ "from Device d join d.ownerGroups g where g.id = :id").setLong(
							"id", id);
			@SuppressWarnings("unchecked")
			List<Device> devices = query
			.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class))
			.list();
			return devices;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the devices of group {}.", id, e);
			throw new NetshotBadRequestException("Unable to fetch the devices",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
		private Long group = new Long(0);

		/** The device. */
		private Long device = new Long(0);

		/** The domain. */
		private Long domain = new Long(0);

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

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
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
		 * Checks if is cancelled.
		 *
		 * @return true, if is cancelled
		 */
		@XmlElement
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
		public int getLimitToOutofdateDeviceHours() {
			return limitToOutofdateDeviceHours;
		}

		public void setLimitToOutofdateDeviceHours(int limitToOutofdateDeviceHours) {
			this.limitToOutofdateDeviceHours = limitToOutofdateDeviceHours;
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
	@Path("tasks/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Task setTask(@Context HttpServletRequest request, @PathParam("id") Long id, RsTask rsTask)
			throws WebApplicationException {
		logger.debug("REST request, edit task {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Task task = null;
		Session session = NetshotDatabase.getSession();
		try {
			task = (Task) session.get(Task.class, id);
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the task {}.", id, e);
			throw new NetshotBadRequestException("Unable to fetch the task.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}

		if (task == null) {
			logger.error("Unable to find the task {}.", id);
			throw new NetshotBadRequestException("Unable to find the task.",
					NetshotBadRequestException.NETSHOT_INVALID_TASK);
		}

		if (rsTask.isCancelled()) {
			if (task.getStatus() != Task.Status.SCHEDULED) {
				logger.error("User is trying to cancel task {} not in SCHEDULE state.",
						id);
				throw new NetshotBadRequestException(
						"The task isn't in 'SCHEDULED' state.",
						NetshotBadRequestException.NETSHOT_TASK_NOT_CANCELLABLE);
			}

			try {
				NetshotTaskManager.cancelTask(task, "Task manually cancelled by user."); //TODO
			}
			catch (Exception e) {
				logger.error("Unable to cancel the task {}.", id, e);
				throw new NetshotBadRequestException("Cannot cancel the task.",
						NetshotBadRequestException.NETSHOT_TASK_CANCEL_ERROR);
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
	@Path("tasks/search")
	@RolesAllowed("user")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<Task> searchTasks(@Context HttpServletRequest request, RsTaskCriteria criteria)
			throws WebApplicationException {

		logger.debug("REST request, search for tasks.");
		authorize(request, User.LEVEL_READONLY);

		Session session = NetshotDatabase.getSession();
		try {
			Criteria c = session.createCriteria(Task.class);
			Task.Status status = null;
			try {
				status = Task.Status.valueOf(criteria.getStatus());
				c.add(Property.forName("status").eq(status));
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
				c.add(Property.forName("executionDate").between(min.getTime(),
						max.getTime()));
			}
			else if (status == Task.Status.CANCELLED) {
				c.add(Property.forName("changeDate").between(min.getTime(),
						max.getTime()));
			}
			else if (status == null) {
				c.add(Restrictions.or(
						Property.forName("status").eq(Task.Status.RUNNING),
						Property.forName("status").eq(Task.Status.SCHEDULED),
						Property.forName("executionDate").between(min.getTime(),
								max.getTime()), Restrictions.and(
										Property.forName("executionDate").isNull(),
										Property.forName("changeDate").between(min.getTime(),
												max.getTime()))));
			}
			c.addOrder(Property.forName("id").desc());

			@SuppressWarnings("unchecked")
			List<Task> tasks = c.list();
			return tasks;
		}
		catch (HibernateException e) {
			logger.error("Error while searching for tasks.", e);
			throw new NetshotBadRequestException("Unable to fetch the tasks",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("tasks")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Task addTask(@Context HttpServletRequest request, RsTask rsTask) throws WebApplicationException {
		logger.debug("REST request, add task.");
		authorize(request, User.LEVEL_READWRITE);

		Task task;
		if (rsTask.getType().equals("TakeSnapshotTask")) {
			logger.trace("Adding a TakeSnapshotTask");
			Device device;
			Session session = NetshotDatabase.getSession();
			try {
				device = (Device) session.get(Device.class, rsTask.getDevice());
				if (device == null) {
					logger.error("Unable to find the device {}.", rsTask.getDevice());
					throw new NetshotBadRequestException("Unable to find the device.",
							NetshotBadRequestException.NETSHOT_INVALID_DEVICE);
				}
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the device.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			task = new TakeSnapshotTask(device, rsTask.getComments());
		}
		else if (rsTask.getType().equals("CheckComplianceTask")) {
			logger.trace("Adding a CheckComplianceTask");
			Device device;
			Session session = NetshotDatabase.getSession();
			try {
				device = (Device) session.get(Device.class, rsTask.getDevice());
				if (device == null) {
					logger.error("Unable to find the device {}.", rsTask.getDevice());
					throw new NetshotBadRequestException("Unable to find the device.",
							NetshotBadRequestException.NETSHOT_INVALID_DEVICE);
				}
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the device.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
			task = new CheckComplianceTask(device, rsTask.getComments());
		}
		else if (rsTask.getType().equals("TakeGroupSnapshotTask")) {
			logger.trace("Adding a TakeGroupSnapshotTask");
			DeviceGroup group;
			Session session = NetshotDatabase.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					logger.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.NETSHOT_INVALID_GROUP);
				}
				task = new TakeGroupSnapshotTask(group, rsTask.getComments(), rsTask.getLimitToOutofdateDeviceHours());
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("CheckGroupComplianceTask")) {
			logger.trace("Adding a CheckGroupComplianceTask");
			DeviceGroup group;
			Session session = NetshotDatabase.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					logger.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.NETSHOT_INVALID_GROUP);
				}
				task = new CheckGroupComplianceTask(group, rsTask.getComments());
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
			}
			finally {
				session.close();
			}
		}
		else if (rsTask.getType().equals("CheckGroupSoftwareTask")) {
			logger.trace("Adding a CheckGroupSoftwareTask");
			DeviceGroup group;
			Session session = NetshotDatabase.getSession();
			try {
				group = (DeviceGroup) session.get(DeviceGroup.class, rsTask.getGroup());
				if (group == null) {
					logger.error("Unable to find the group {}.", rsTask.getGroup());
					throw new NetshotBadRequestException("Unable to find the group.",
							NetshotBadRequestException.NETSHOT_INVALID_GROUP);
				}
				task = new CheckGroupSoftwareTask(group, rsTask.getComments());
			}
			catch (HibernateException e) {
				logger.error("Error while retrieving the group.", e);
				throw new NetshotBadRequestException("Database error.",
						NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
							NetshotBadRequestException.NETSHOT_INVALID_SUBNET);
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
							NetshotBadRequestException.NETSHOT_INVALID_SUBNET);
				}
				if (subnet.getPrefixLength() < 22 || subnet.getPrefixLength() > 32) {
					logger.warn("User posted an invalid prefix length {}.",
							subnet.getPrefix());
					throw new NetshotBadRequestException(String.format("Invalid prefix length for '%s'.", rsSubnet),
							NetshotBadRequestException.NETSHOT_SCAN_SUBNET_TOO_BIG);
				}
			}
			if (subnets.size() == 0) {
				logger.warn("User posted an invalid subnet list '{}'.", rsTask.getSubnets());
				throw new NetshotBadRequestException(String.format("Invalid subnet list '%s'.", rsTask.getSubnets()),
						NetshotBadRequestException.NETSHOT_INVALID_SUBNET);
			}
			Domain domain;
			if (rsTask.getDomain() == 0) {
				logger.error("Domain {} is invalid (0).", rsTask.getDomain());
				throw new NetshotBadRequestException("Invalid domain",
						NetshotBadRequestException.NETSHOT_INVALID_DOMAIN);
			}
			Session session = NetshotDatabase.getSession();
			try {
				domain = (Domain) session.load(Domain.class, rsTask.getDomain());
			}
			catch (Exception e) {
				logger.error("Unable to load the domain {}.", rsTask.getDomain());
				throw new NetshotBadRequestException("Invalid domain",
						NetshotBadRequestException.NETSHOT_INVALID_DOMAIN);
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
			task = new ScanSubnetsTask(subnets, domain, rsTask.getComments(), target.toString());
		}
		else if (rsTask.getType().equals("PurgeDatabaseTask")) {
			logger.trace("Adding a PurgeDatabaseTask");
			task = new PurgeDatabaseTask(rsTask.getComments());
		}
		else {
			logger.error("User posted an invalid task type '{}'.", rsTask.getType());
			throw new NetshotBadRequestException("Invalid task type.",
					NetshotBadRequestException.NETSHOT_INVALID_TASK);
		}
		if (rsTask.getScheduleReference() != null) {
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
							NetshotBadRequestException.NETSHOT_INVALID_TASK);
				}
			}
		}
		try {
			NetshotTaskManager.addTask(task);
		}
		catch (HibernateException e) {
			logger.error("Unable to add the task.", e);
			throw new NetshotBadRequestException(
					"Unable to add the task to the database.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		catch (SchedulerException e) {
			logger.error("Unable to schedule the task.", e);
			throw new NetshotBadRequestException("Unable to schedule the task.",
					NetshotBadRequestException.NETSHOT_SCHEDULE_ERROR);
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
		private long oldId;

		/** The new id. */
		private long newId;

		/**
		 * Gets the device name.
		 *
		 * @return the device name
		 */
		@XmlElement
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
	@Path("changes")
	@RolesAllowed("user")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsConfigChange> getChanges(@Context HttpServletRequest request, RsChangeCriteria criteria) throws WebApplicationException {
		logger.debug("REST request, config changes.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<RsConfigChange> changes = session
			.createSQLQuery(
					"SELECT c5.id AS newId, c5.change_date AS newChangeDate, c6.id AS oldId, c6.change_date as oldChangeDate, c5.device AS deviceId, c5.author AS author, d.name as deviceName FROM config c5 JOIN (SELECT c3.id AS id1, MAX(c2.id) AS id2 FROM config c3 LEFT JOIN (SELECT c2.id, c2.change_date, c2.device FROM config c1 LEFT JOIN config c2 ON c1.device = c2.device WHERE c1.change_date >= :start AND c1.change_date <= :end AND c1.change_date > c2.change_date) c2 ON c3.device = c2.device WHERE c3.change_date > c2.change_date OR (c2.id IS NULL AND c3.change_date >= :start AND c3.change_date <= :end) GROUP BY c3.id ORDER BY c3.change_date DESC, c3.id DESC) c0 ON c5.id = c0.id1 JOIN config c6 ON c6.id = c0.id2 JOIN device d ON c5.device = d.id WHERE c5.change_date >= :start AND c5.change_date <= :end")
					.addScalar("newId", StandardBasicTypes.LONG)
					.addScalar("oldId", StandardBasicTypes.LONG)
					.addScalar("newChangeDate", StandardBasicTypes.TIMESTAMP)
					.addScalar("oldChangeDate", StandardBasicTypes.TIMESTAMP)
					.addScalar("deviceId", StandardBasicTypes.LONG)
					.addScalar("author", StandardBasicTypes.STRING)
					.addScalar("deviceName", StandardBasicTypes.STRING)
					.setTimestamp("start", criteria.fromDate)
					.setTimestamp("end", criteria.toDate)
					.setResultTransformer(Transformers.aliasToBean(RsConfigChange.class))
					.list();
			return changes;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the devices", e);
			throw new NetshotBadRequestException("Unable to fetch the devices",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("policies")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<Policy> getPolicies(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, get policies.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<Policy> policies = session.createQuery("from Policy p join fetch p.targetGroup")
			.list();
			return policies;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the policies.", e);
			throw new NetshotBadRequestException("Unable to fetch the policies",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("rules/policy/{id}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<Rule> getPolicyRules(@Context HttpServletRequest request, @PathParam("id") Long id) throws WebApplicationException {
		logger.debug("REST request, get rules for policy {}.", id);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			Policy policy = (Policy) session.load(Policy.class, id);
			if (policy == null) {
				logger.error("Invalid policy.");
				throw new NetshotBadRequestException("Invalid policy",
						NetshotBadRequestException.NETSHOT_INVALID_POLICY);
			}
			List<Rule> rules = new ArrayList<Rule>();
			rules.addAll(policy.getRules());
			return rules;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the rules.", e);
			throw new NetshotBadRequestException("Unable to fetch the rules",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("policies")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Policy addPolicy(@Context HttpServletRequest request, RsPolicy rsPolicy) throws WebApplicationException {
		logger.debug("REST request, add policy.");
		authorize(request, User.LEVEL_READWRITE);
		String name = rsPolicy.getName().trim();
		if (name.isEmpty()) {
			logger.warn("User posted an empty policy name.");
			throw new NetshotBadRequestException("Invalid policy name.",
					NetshotBadRequestException.NETSHOT_INVALID_POLICY_NAME);
		}
		Policy policy;
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();

			DeviceGroup group = (DeviceGroup) session.load(DeviceGroup.class, rsPolicy.getGroup());

			policy = new Policy(name, group);

			session.save(policy);
			session.getTransaction().commit();
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The posted group doesn't exist", e);
			throw new NetshotBadRequestException(
					"Invalid group",
					NetshotBadRequestException.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new policy.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("Duplicate entry")) {
				throw new NetshotBadRequestException(
						"A policy with this name already exists.",
						NetshotBadRequestException.NETSHOT_DUPLICATE_POLICY);
			}
			throw new NetshotBadRequestException(
					"Unable to add the policy to the database",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("policies/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public void deletePolicy(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete policy {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			Policy policy = (Policy) session.load(Policy.class, id);
			session.delete(policy);
			session.getTransaction().commit();
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The policy {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The policy doesn't exist.",
					NetshotBadRequestException.NETSHOT_INVALID_POLICY);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the policy {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the policy",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("policies/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Policy setPolicy(@Context HttpServletRequest request, @PathParam("id") Long id, RsPolicy rsPolicy)
			throws WebApplicationException {
		logger.debug("REST request, edit policy {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			Policy policy = (Policy) session.get(Policy.class, id);
			if (policy == null) {
				logger.error("Unable to find the policy {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this policy.",
						NetshotBadRequestException.NETSHOT_INVALID_POLICY);
			}

			String name = rsPolicy.getName().trim();
			if (name.isEmpty()) {
				logger.warn("User posted an empty policy name.");
				throw new NetshotBadRequestException("Invalid policy name.",
						NetshotBadRequestException.NETSHOT_INVALID_POLICY_NAME);
			}
			policy.setName(name);

			if (policy.getTargetGroup().getId() != rsPolicy.getGroup()) {
				DeviceGroup group = (DeviceGroup) session.load(DeviceGroup.class, rsPolicy.getGroup());
				policy.setTargetGroup(group);
				session.createQuery("delete CheckResult cr where cr.key.rule in (select r from Rule r where r.policy = :id)")
				.setLong("id", policy.getId())
				.executeUpdate();
			}

			session.update(policy);
			session.getTransaction().commit();
			return policy;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("Unable to find the group {} to be assigned to the policy {}.",
					rsPolicy.getGroup(), id, e);
			throw new NetshotBadRequestException(
					"Unable to find the group.",
					NetshotBadRequestException.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to save the policy {}.", id, e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("Duplicate entry")) {
				throw new NetshotBadRequestException(
						"A policy with this name already exists.",
						NetshotBadRequestException.NETSHOT_DUPLICATE_POLICY);
			}
			throw new NetshotBadRequestException("Unable to save the policy.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	 * The Class RsJsRule.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsJsRule {

		/** The id. */
		private long id = 0;

		/** The name. */
		private String name = null;

		/** The script. */
		private String script = null;

		/** The policy. */
		private long policy = 0;

		/** The enabled. */
		private boolean enabled = false;

		/** The exemptions. */
		private Map<Long, Date> exemptions = new HashMap<Long, Date>();

		/**
		 * Gets the id.
		 *
		 * @return the id
		 */
		@XmlElement
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
		 * Gets the script.
		 *
		 * @return the script
		 */
		@XmlElement
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
		public Long getPolicy() {
			return policy;
		}

		/**
		 * Checks if is enabled.
		 *
		 * @return true, if is enabled
		 */
		@XmlElement
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
	@Path("rules")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Rule addJsRule(@Context HttpServletRequest request, RsJsRule rsRule) throws WebApplicationException {
		logger.debug("REST request, add rule.");
		authorize(request, User.LEVEL_READWRITE);
		if (rsRule.getName() == null || rsRule.getName().trim().isEmpty()) {
			logger.warn("User posted an empty rule name.");
			throw new NetshotBadRequestException("Invalid rule name.",
					NetshotBadRequestException.NETSHOT_INVALID_RULE_NAME);
		}
		String name = rsRule.getName().trim();

		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();

			Policy policy = (Policy) session.load(Policy.class, rsRule.getPolicy());

			JavaScriptRule rule = new JavaScriptRule(name, policy);

			session.save(rule);
			session.getTransaction().commit();
			return rule;
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The posted policy doesn't exist.", e);
			throw new NetshotBadRequestException(
					"Invalid policy.",
					NetshotBadRequestException.NETSHOT_INVALID_POLICY);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new rule.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("Duplicate entry")) {
				throw new NetshotBadRequestException(
						"A rule with this name already exists.",
						NetshotBadRequestException.NETSHOT_DUPLICATE_RULE);
			}
			throw new NetshotBadRequestException(
					"Unable to add the rule to the database",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("rules/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Rule setRule(@Context HttpServletRequest request, @PathParam("id") Long id, RsJsRule rsRule)
			throws WebApplicationException {
		logger.debug("REST request, edit rule {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			Rule rule = (Rule) session.get(Rule.class, id);
			if (rule == null) {
				logger.error("Unable to find the rule {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this rule.",
						NetshotBadRequestException.NETSHOT_INVALID_RULE);
			}

			if (rsRule.getName() != null) {
				String name = rsRule.getName().trim();
				if (name.isEmpty()) {
					logger.warn("User posted an empty rule name.");
					throw new NetshotBadRequestException("Invalid rule name.",
							NetshotBadRequestException.NETSHOT_INVALID_RULE_NAME);
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

			session.update(rule);
			session.getTransaction().commit();
			return rule;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new rule.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("Duplicate entry")) {
				throw new NetshotBadRequestException(
						"A rule with this name already exists.",
						NetshotBadRequestException.NETSHOT_DUPLICATE_RULE);
			}
			throw new NetshotBadRequestException(
					"Unable to save the rule.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("rules/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public void deleteRule(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete rule {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			Rule rule = (Rule) session.load(Rule.class, id);
			session.delete(rule);
			session.getTransaction().commit();
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The rule {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The rule doesn't exist.",
					NetshotBadRequestException.NETSHOT_INVALID_RULE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the rule {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the rule.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	public static class RsJsRuleTest {

		/** The script. */
		private String script = "";

		/** The device. */
		private long device = 0;

		/**
		 * Gets the script.
		 *
		 * @return the script
		 */
		@XmlElement
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
		 * Gets the device.
		 *
		 * @return the device
		 */
		@XmlElement
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
	 * The Class RsJsRuleTestResult.
	 */
	@XmlRootElement
	@XmlAccessorType(XmlAccessType.NONE)
	public static class RsJsRuleTestResult {

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
	 * Test js rule.
	 *
	 * @param request the request
	 * @param rsRule the rs rule
	 * @return the rs js rule test result
	 * @throws WebApplicationException the web application exception
	 */
	@POST
	@Path("rules/test")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public RsJsRuleTestResult testJsRule(@Context HttpServletRequest request, RsJsRuleTest rsRule) throws WebApplicationException {
		logger.debug("REST request, JavaScript rule test.");
		authorize(request, User.LEVEL_READWRITE);
		Device device;
		Session session = NetshotDatabase.getSession();
		try {
			device = (Device) session
					.createQuery("from Device d join fetch d.lastConfig where d.id = :id")
					.setLong("id", rsRule.getDevice()).uniqueResult();
			if (device == null) {
				logger.warn("Unable to find the device {}.", rsRule.getDevice());
				throw new NetshotBadRequestException("Unable to find the device.",
						NetshotBadRequestException.NETSHOT_INVALID_DEVICE);
			}

			JavaScriptRule rule = new JavaScriptRule("TEST", null);
			rule.setEnabled(true);
			rule.setScript(rsRule.getScript());

			RsJsRuleTestResult result = new RsJsRuleTestResult();

			rule.check(device, session);
			result.setResult(rule.getCheckResults().iterator().next().getResult());
			result.setScriptError(rule.getPlainLog());

			return result;
		}
		catch (Exception e) {
			logger.error("Unable to retrieve the device {}.", rsRule.getDevice(), e);
			throw new NetshotBadRequestException("Unable to retrieve the device.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("devices/rule/{id}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsLightExemptedDevice> getExemptedDevices(@Context HttpServletRequest request, @PathParam("id") Long id) throws WebApplicationException {
		logger.debug("REST request, get exemptions for rule {}.", id);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<RsLightExemptedDevice> exemptions = session
			.createQuery(DEVICELIST_BASEQUERY + ", e.expirationDate as expirationDate from Exemption e join e.key.device d where e.key.rule.id = :id")
			.setLong("id", id)
			.setResultTransformer(Transformers.aliasToBean(RsLightExemptedDevice.class))
			.list();
			return exemptions;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the exemptions.", e);
			throw new NetshotBadRequestException("Unable to fetch the exemptions",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	 * Gets the device compliance.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the device compliance
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("rules/device/{id}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsDeviceRule> getDeviceCompliance(@Context HttpServletRequest request, @PathParam("id") Long id) throws WebApplicationException {
		logger.debug("REST request, get exemptions for rules {}.", id);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<RsDeviceRule> rules = session.createQuery("select r.id as id, r.name as ruleName, p.name as policyName, cr.result as result, cr.checkDate as checkDate, cr.comment as comment, e.expirationDate as expirationDate from Rule r join r.policy p join p.targetGroup g join g.cachedDevices d1 with d1.id = :id left join r.checkResults cr with cr.key.device.id = :id left join r.exemptions e with e.key.device.id = :id")
			.setLong("id", id)
			.setResultTransformer(Transformers.aliasToBean(RsDeviceRule.class))
			.list();
			return rules;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the rules.", e);
			throw new NetshotBadRequestException("Unable to fetch the rules",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("reports/last7dayschangesbyday")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsConfigChangeNumberByDateStat> getLast7DaysChangesByDayStats(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, get last 7 day changes by day stats.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<RsConfigChangeNumberByDateStat> stats = session
			.createQuery("select count(c) as changeCount, cast(cast(c.changeDate as date) as timestamp) as changeDay from Config c group by cast(c.changeDate as date) order by changeDate desc")
			.setMaxResults(7)
			.setResultTransformer(Transformers.aliasToBean(RsConfigChangeNumberByDateStat.class))
			.list();
			return stats;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the stats.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
		 * Gets the compliant device count.
		 *
		 * @return the compliant device count
		 */
		@XmlElement
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
	@Path("reports/groupconfigcompliancestats")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsGroupConfigComplianceStat> getGroupConfigComplianceStats(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, group config compliance stats.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<RsGroupConfigComplianceStat> stats = session
			.createQuery("select g.id as groupId, g.name as groupName, (select count(d) from g.cachedDevices d where d.status = :enabled and (select count(ccr.result) from d.complianceCheckResults ccr where ccr.result = :nonConforming) = 0) as compliantDeviceCount, (select count(d) from g.cachedDevices d where d.status = :enabled) as deviceCount from DeviceGroup g where g.hiddenFromReports <> true")
			.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING)
			.setParameter("enabled", Device.Status.INPRODUCTION)
			.setResultTransformer(Transformers.aliasToBean(RsGroupConfigComplianceStat.class))
			.list();
			return stats;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the stats.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
		public Date getEoxDate() {
			return eoxDate;
		}
		public void setEoxDate(Date date) {
			this.eoxDate = date;
		}
		@XmlElement
		public long getDeviceCount() {
			return deviceCount;
		}
		public void setDeviceCount(long deviceCount) {
			this.deviceCount = deviceCount;
		}

	}

	public static class RsHardwareSupportEoSStat extends RsHardwareSupportStat {

	}

	public static class RsHardwareSupportEoLStat extends RsHardwareSupportStat {

	}

	@GET
	@Path("reports/hardwaresupportstats")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsHardwareSupportStat> getHardwareSupportStats(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, hardware support stats.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<RsHardwareSupportStat> eosStats = session
			.createQuery("select count(d) as deviceCount, d.eosDate AS eoxDate from Device d group by d.eosDate")
			.setResultTransformer(Transformers.aliasToBean(RsHardwareSupportEoSStat.class))
			.list();
			@SuppressWarnings("unchecked")
			List<RsHardwareSupportStat> eolStats = session
			.createQuery("select count(d) as deviceCount, d.eolDate AS eoxDate from Device d group by d.eolDate")
			.setResultTransformer(Transformers.aliasToBean(RsHardwareSupportEoLStat.class))
			.list();
			List<RsHardwareSupportStat> stats = new ArrayList<RsHardwareSupportStat>();
			stats.addAll(eosStats);
			stats.addAll(eolStats);
			return stats;
		}
		catch (HibernateException e) {
			logger.error("Unable to ge"
					+ ""
					+ "t the stats.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("reports/groupsoftwarecompliancestats")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsGroupSoftwareComplianceStat> getGroupSoftwareComplianceStats(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, group software compliance stats.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<RsGroupSoftwareComplianceStat> stats = session
			.createQuery("select g.id as groupId, g.name as groupName, (select count(d) from g.cachedDevices d where d.status = :enabled and d.softwareLevel = :gold) as goldDeviceCount, (select count(d) from g.cachedDevices d where d.status = :enabled and d.softwareLevel = :silver) as silverDeviceCount, (select count(d) from g.cachedDevices d where d.status = :enabled and d.softwareLevel = :bronze) as bronzeDeviceCount, (select count(d) from g.cachedDevices d where d.status = :enabled) as deviceCount from DeviceGroup g where g.hiddenFromReports <> true")
			.setParameter("gold", ConformanceLevel.GOLD)
			.setParameter("silver", ConformanceLevel.SILVER)
			.setParameter("bronze", ConformanceLevel.BRONZE)
			.setParameter("enabled", Device.Status.INPRODUCTION)
			.setResultTransformer(Transformers.aliasToBean(RsGroupSoftwareComplianceStat.class))
			.list();
			return stats;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the stats.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
		public String getRuleName() {
			return ruleName;
		}

		/**
		 * Gets the policy name.
		 *
		 * @return the policy name
		 */
		@XmlElement
		public String getPolicyName() {
			return policyName;
		}

		/**
		 * Gets the check date.
		 *
		 * @return the check date
		 */
		@XmlElement
		public Date getCheckDate() {
			return checkDate;
		}

		/**
		 * Gets the result.
		 *
		 * @return the result
		 */
		@XmlElement
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
	 * Gets the group config non compliant devices.
	 *
	 * @param request the request
	 * @param id the id
	 * @return the group config non compliant devices
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@Path("reports/groupconfignoncompliantdevices/{id}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsLightPolicyRuleDevice> getGroupConfigNonCompliantDevices(@Context HttpServletRequest request, @PathParam("id") Long id) throws WebApplicationException {
		logger.debug("REST request, group config non compliant devices.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<RsLightPolicyRuleDevice> devices = session
			.createQuery(DEVICELIST_BASEQUERY + ", p.name as policyName, r.name as ruleName, ccr.checkDate as checkDate, ccr.result as result from Device d join d.ownerGroups g join d.complianceCheckResults ccr join ccr.key.rule r join r.policy p where g.id = :id and ccr.result = :nonConforming")
			.setLong("id", id)
			.setParameter("nonConforming", CheckResult.ResultOption.NONCONFORMING)
			.setResultTransformer(Transformers.aliasToBean(RsLightPolicyRuleDevice.class))
			.list();
			return devices;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the devices.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	@GET
	@Path("reports/hardwaresupportdevices/{type}/{date}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsLightDevice> getHardwareStatusDevices(@Context HttpServletRequest request, @PathParam("type") String type, @PathParam("date") Long date) throws WebApplicationException {
		logger.debug("REST request, EoX devices by type and date.");
		authorize(request, User.LEVEL_READONLY);
		if (!type.equals("eol") && !type.equals("eos")) {
			logger.error("Invalid requested EoX type.");
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		Date eoxDate = new Date(date);
		Session session = NetshotDatabase.getSession();
		try {
			if (date == 0) {
				@SuppressWarnings("unchecked")
				List<RsLightDevice> devices = session
				.createQuery(DEVICELIST_BASEQUERY + "from Device d where d." + type + "Date is null")
				.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class))
				.list();
				return devices;
			}
			else {
				@SuppressWarnings("unchecked")
				List<RsLightDevice> devices = session
				.createQuery(DEVICELIST_BASEQUERY + "from Device d where d." + type + "Date = :eoxDate")
				.setDate("eoxDate", eoxDate)
				.setResultTransformer(Transformers.aliasToBean(RsLightDevice.class))
				.list();
				return devices;
			}
		}
		catch (HibernateException e) {
			logger.error("Unable to get the devices.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("hardwarerules")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<HardwareRule> getHardwareRules(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, hardware rules.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<HardwareRule> rules = session
			.createQuery("from HardwareRule r left join fetch r.targetGroup g")
			.list();
			return rules;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the hardware rules.", e);
			throw new NetshotBadRequestException("Unable to fetch the hardware rules.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
		private String deviceClass = "";

		/** The part number. */
		private String partNumber = "";

		private boolean partNumberRegExp = false;

		/** The family. */
		private String family = "";

		private boolean familyRegExp = false;

		private Date endOfSale = null;

		private Date endOfLife = null;

		@XmlElement
		public long getId() {
			return id;
		}

		public void setId(long id) {
			this.id = id;
		}

		@XmlElement
		public long getGroup() {
			return group;
		}

		public void setGroup(long group) {
			this.group = group;
		}

		@XmlElement
		public String getDeviceClass() {
			return deviceClass;
		}

		public void setDeviceClass(String deviceClass) {
			this.deviceClass = deviceClass;
		}

		@XmlElement
		public String getPartNumber() {
			return partNumber;
		}

		public void setPartNumber(String partNumber) {
			this.partNumber = partNumber;
		}

		@XmlElement
		public boolean isPartNumberRegExp() {
			return partNumberRegExp;
		}

		public void setPartNumberRegExp(boolean partNumberRegExp) {
			this.partNumberRegExp = partNumberRegExp;
		}

		@XmlElement
		public String getFamily() {
			return family;
		}

		public void setFamily(String family) {
			this.family = family;
		}

		@XmlElement
		public boolean isFamilyRegExp() {
			return familyRegExp;
		}

		public void setFamilyRegExp(boolean familyRegExp) {
			this.familyRegExp = familyRegExp;
		}

		@XmlElement(nillable = true)
		public Date getEndOfSale() {
			return endOfSale;
		}

		public void setEndOfSale(Date endOfSale) {
			this.endOfSale = endOfSale;
		}

		@XmlElement(nillable = true)
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
	@Path("hardwarerules")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public HardwareRule addHardwareRule(@Context HttpServletRequest request, RsHardwareRule rsRule) throws WebApplicationException {
		logger.debug("REST request, add hardware rule.");
		authorize(request, User.LEVEL_READWRITE);

		Class<? extends Device> deviceClass = Device.class;
		for (Class<? extends Device> clazz : Device.getDeviceClasses()) {
			if (clazz.getName().compareTo(rsRule.getDeviceClass()) == 0) {
				deviceClass = clazz;
				break;
			}
		}
		HardwareRule rule;
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();

			DeviceGroup group = null;
			if (rsRule.getGroup() != -1) {
				group = (DeviceGroup) session.load(DeviceGroup.class, rsRule.getGroup());
			}

			rule = new HardwareRule(deviceClass, group,
					rsRule.getFamily(), rsRule.isFamilyRegExp(), rsRule.getPartNumber(),
					rsRule.isPartNumberRegExp(), rsRule.getEndOfSale(), rsRule.getEndOfLife());

			session.save(rule);
			session.getTransaction().commit();
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The posted group doesn't exist", e);
			throw new NetshotBadRequestException(
					"Invalid group",
					NetshotBadRequestException.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new rule.", e);
			throw new NetshotBadRequestException(
					"Unable to add the rule to the database",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("hardwarerules/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public void deleteHardwareRule(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete hardware rule {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			HardwareRule rule = (HardwareRule) session.load(HardwareRule.class, id);
			session.delete(rule);
			session.getTransaction().commit();
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The rule {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The rule doesn't exist.",
					NetshotBadRequestException.NETSHOT_INVALID_RULE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the rule {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the rule.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("hardwarerules/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public HardwareRule setHardwareRule(@Context HttpServletRequest request, @PathParam("id") Long id, RsHardwareRule rsRule)
			throws WebApplicationException {
		logger.debug("REST request, edit hardware rule {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			HardwareRule rule = (HardwareRule) session.get(HardwareRule.class, id);
			if (rule == null) {
				logger.error("Unable to find the rule {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this rule.",
						NetshotBadRequestException.NETSHOT_INVALID_RULE);
			}

			Class<? extends Device> deviceClass = Device.class;
			for (Class<? extends Device> clazz : Device.getDeviceClasses()) {
				if (clazz.getName().compareTo(rsRule.getDeviceClass()) == 0) {
					deviceClass = clazz;
					break;
				}
			}
			rule.setDeviceClass(deviceClass);

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
			return rule;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the rule.", e);
			throw new NetshotBadRequestException(
					"Unable to save the rule.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("softwarerules")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<SoftwareRule> getSoftwareRules(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, software rules.");
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<SoftwareRule> rules = session
			.createQuery("from SoftwareRule r left join fetch r.targetGroup g")
			.list();
			return rules;
		}
		catch (HibernateException e) {
			logger.error("Unable to fetch the software rules.", e);
			throw new NetshotBadRequestException("Unable to fetch the software rules.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
		private String deviceClass = "";

		/** The version. */
		private String version = "";

		private boolean versionRegExp = false;

		/** The family. */
		private String family = "";

		private boolean familyRegExp = false;

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
		public String getDeviceClass() {
			return deviceClass;
		}

		/**
		 * Sets the device class name.
		 *
		 * @param deviceClassName the new device class name
		 */
		public void setDeviceClass(String deviceClass) {
			this.deviceClass = deviceClass;
		}

		/**
		 * Gets the version.
		 *
		 * @return the version
		 */
		@XmlElement
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
		public boolean isVersionRegExp() {
			return versionRegExp;
		}

		public void setVersionRegExp(boolean versionRegExp) {
			this.versionRegExp = versionRegExp;
		}

		@XmlElement
		public boolean isFamilyRegExp() {
			return familyRegExp;
		}

		public void setFamilyRegExp(boolean familyRegExp) {
			this.familyRegExp = familyRegExp;
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
	@Path("softwarerules")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public SoftwareRule addSoftwareRule(@Context HttpServletRequest request, RsSoftwareRule rsRule) throws WebApplicationException {
		logger.debug("REST request, add software rule.");
		authorize(request, User.LEVEL_READWRITE);

		Class<? extends Device> deviceClass = Device.class;
		for (Class<? extends Device> clazz : Device.getDeviceClasses()) {
			if (clazz.getName().compareTo(rsRule.getDeviceClass()) == 0) {
				deviceClass = clazz;
				break;
			}
		}
		SoftwareRule rule;
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();

			DeviceGroup group = null;
			if (rsRule.getGroup() != -1) {
				group = (DeviceGroup) session.load(DeviceGroup.class, rsRule.getGroup());
			}

			rule = new SoftwareRule(rsRule.getPriority(), group, deviceClass,
					rsRule.getFamily(), rsRule.isFamilyRegExp(), rsRule.getVersion(),
					rsRule.isVersionRegExp(), rsRule.getLevel());

			session.save(rule);
			session.getTransaction().commit();
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The posted group doesn't exist", e);
			throw new NetshotBadRequestException(
					"Invalid group",
					NetshotBadRequestException.NETSHOT_INVALID_GROUP);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new rule.", e);
			throw new NetshotBadRequestException(
					"Unable to add the policy to the database",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("softwarerules/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public void deleteSoftwareRule(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete software rule {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			SoftwareRule rule = (SoftwareRule) session.load(SoftwareRule.class, id);
			session.delete(rule);
			session.getTransaction().commit();
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The rule {} to be deleted doesn't exist.", id, e);
			throw new NetshotBadRequestException("The rule doesn't exist.",
					NetshotBadRequestException.NETSHOT_INVALID_RULE);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to delete the rule {}.", id, e);
			throw new NetshotBadRequestException("Unable to delete the rule.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("softwarerules/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public SoftwareRule setSoftwareRule(@Context HttpServletRequest request, @PathParam("id") Long id, RsSoftwareRule rsRule)
			throws WebApplicationException {
		logger.debug("REST request, edit software rule {}.", id);
		authorize(request, User.LEVEL_READWRITE);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			SoftwareRule rule = (SoftwareRule) session.get(SoftwareRule.class, id);
			if (rule == null) {
				logger.error("Unable to find the rule {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this rule.",
						NetshotBadRequestException.NETSHOT_INVALID_RULE);
			}

			Class<? extends Device> deviceClass = Device.class;
			for (Class<? extends Device> clazz : Device.getDeviceClasses()) {
				if (clazz.getName().compareTo(rsRule.getDeviceClass()) == 0) {
					deviceClass = clazz;
					break;
				}
			}
			rule.setDeviceClass(deviceClass);

			DeviceGroup group = null;
			if (rsRule.getGroup() != -1) {
				group = (DeviceGroup) session.load(DeviceGroup.class, rsRule.getGroup());
			}
			rule.setTargetGroup(group);

			rule.setFamily(rsRule.getFamily());
			rule.setFamilyRegExp(rsRule.isFamilyRegExp());
			rule.setVersion(rsRule.getVersion());
			rule.setVersionRegExp(rsRule.isVersionRegExp());
			rule.setPriority(rsRule.getPriority());
			rule.setLevel(rsRule.getLevel());

			session.update(rule);
			session.getTransaction().commit();
			return rule;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the rule.", e);
			throw new NetshotBadRequestException(
					"Unable to save the rule.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("reports/groupdevicesbysoftwarelevel/{id}/{level}")
	@RolesAllowed("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<RsLightSoftwareLevelDevice> getGroupDevicesBySoftwareLevel(@Context HttpServletRequest request, @PathParam("id") Long id, @PathParam("level") String level) throws WebApplicationException {
		logger.debug("REST request, group {} devices by software level {}.", id, level);
		authorize(request, User.LEVEL_READONLY);
		Session session = NetshotDatabase.getSession();

		ConformanceLevel filterLevel = ConformanceLevel.UNKNOWN;
		for (ConformanceLevel l : ConformanceLevel.values()) {
			if (l.toString().equalsIgnoreCase(level)) {
				filterLevel = l;
				break;
			}
		}

		try {
			@SuppressWarnings("unchecked")
			List<RsLightSoftwareLevelDevice> devices = session
			.createQuery(DEVICELIST_BASEQUERY + ", d.softwareLevel as softwareLevel from Device d join d.ownerGroups g where g.id = :id and d.softwareLevel = :level")
			.setLong("id", id)
			.setParameter("level", filterLevel)
			.setResultTransformer(Transformers.aliasToBean(RsLightSoftwareLevelDevice.class))
			.list();
			return devices;
		}
		catch (HibernateException e) {
			logger.error("Unable to get the devices.", e);
			throw new NetshotBadRequestException("Unable to get the stats",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("user/{id}")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Boolean logout(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST logout request.");
		HttpSession httpSession = request.getSession();
		httpSession.invalidate();
		return true;
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
	@Path("user/{id}")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public User setPassword(@Context HttpServletRequest request, RsLogin rsLogin) throws WebApplicationException {
		logger.debug("REST password change request, username {}.", rsLogin.getUsername());
		User sessionUser = authorize(request, 1);

		User user;
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			user = (User) session.bySimpleNaturalId(User.class).load(rsLogin.getUsername());
			if (user == null || !user.getUsername().equals(sessionUser.getUsername()) || !user.isLocal()) {
				throw new NetshotBadRequestException("Invalid user.",
						NetshotBadRequestException.NETSHOT_INVALID_USER);
			}

			if (!user.checkPassword(rsLogin.getPassword())) {
				throw new NetshotBadRequestException("Invalid current password.",
						NetshotBadRequestException.NETSHOT_INVALID_USER);
			}

			String newPassword = rsLogin.getNewPassword();
			if (newPassword.equals("")) {
				throw new NetshotBadRequestException("The password cannot be empty.",
						NetshotBadRequestException.NETSHOT_INVALID_USER);
			}

			user.setPassword(newPassword);
			session.save(user);
			session.getTransaction().commit();
			return sessionUser;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to retrieve the user {}.", rsLogin.getUsername(), e);
			throw new NetshotBadRequestException("Unable to retrieve the user.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("user")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public User login(@Context HttpServletRequest request, RsLogin rsLogin) throws WebApplicationException {
		logger.debug("REST authentication request, username {}.", rsLogin.getUsername());

		User user = null;

		Session session = NetshotDatabase.getSession();
		try {
			user = (User) session.bySimpleNaturalId(User.class).load(rsLogin.getUsername());
		}
		catch (HibernateException e) {
			logger.error("Unable to retrieve the user {}.", rsLogin.getUsername(), e);
			throw new NetshotBadRequestException("Unable to retrieve the user.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}

		if (user != null && user.isLocal()) {
			if (!user.checkPassword(rsLogin.getPassword())) {
				user = null;
			}
		}
		else {
			if (Radius.authenticate(rsLogin.getUsername(), rsLogin.getPassword())) {
				if (user == null) {
					user = new User(rsLogin.getUsername(), false, "");
				}
			}
			else {
				user = null;
			}
		}
		if (user == null) {
			HttpSession httpSession = request.getSession();
			httpSession.invalidate();
		}
		else {
			HttpSession httpSession = request.getSession();
			httpSession.setAttribute("user", user);
			httpSession.setMaxInactiveInterval(User.MAX_IDLE_TIME);
			return user;
		}
		throw new WebApplicationException(Response.status(Response.Status.UNAUTHORIZED).build());
	}

	/**
	 * Gets the user.
	 *
	 * @param request the request
	 * @return the user
	 * @throws WebApplicationException the web application exception
	 */
	@GET
	@RolesAllowed("user")
	@Path("user")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public Principal getUser(@Context HttpServletRequest request) throws WebApplicationException {
		User user = authorize(request, User.LEVEL_READONLY);
		return user;
	}

	/**
	 * Authorize.
	 *
	 * @param request the request
	 * @param level the level
	 * @return the user
	 * @throws WebApplicationException the web application exception
	 */
	private User authorize(HttpServletRequest request, int level) throws WebApplicationException {
		HttpSession httpSession = request.getSession();
		User user = (User) httpSession.getAttribute("user");
		if (user == null) {
			logger.warn("Authorization failed, user is null, {}.", request.getRequestURI());
			throw new WebApplicationException(Response.status(Response.Status.UNAUTHORIZED).build());
		}
		else if (user.getLevel() < level) {
			logger.warn("Authorization failed, user {}, needed level {}, {}.", user.getUsername(), level, request.getRequestURI());
			throw new WebApplicationException(Response.status(Response.Status.FORBIDDEN).build());
		}
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
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public List<User> getUsers(@Context HttpServletRequest request) throws WebApplicationException {
		logger.debug("REST request, get user list.");
		authorize(request, User.LEVEL_ADMIN);
		Session session = NetshotDatabase.getSession();
		try {
			@SuppressWarnings("unchecked")
			List<User> users = session.createCriteria(User.class).list();
			return users;
		}
		catch (HibernateException e) {
			logger.error("Unable to retrieve the users.", e);
			throw new NetshotBadRequestException("Unable to retrieve the users.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("users")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public User addUser(@Context HttpServletRequest request, RsUser rsUser) {
		logger.debug("REST request, add user");
		authorize(request, User.LEVEL_ADMIN);

		String username = rsUser.getUsername();
		if (username == null || username.trim().isEmpty()) {
			logger.warn("User posted an empty user name.");
			throw new NetshotBadRequestException("Invalid user name.",
					NetshotBadRequestException.NETSHOT_INVALID_USER_NAME);
		}
		username = username.trim();

		String password = rsUser.getPassword();
		if (rsUser.isLocal()) {
			if (password == null || password.equals("")) {
				logger.warn("User tries to create a local account without password.");
				throw new NetshotBadRequestException("Please set a password.",
						NetshotBadRequestException.NETSHOT_INVALID_PASSWORD);
			}
		}
		else {
			password = "";
		}

		User user = new User(username, rsUser.isLocal(), password);
		user.setLevel(rsUser.level);

		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			session.save(user);
			session.getTransaction().commit();
			return user;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Error while saving the new user.", e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("Duplicate entry")) {
				throw new NetshotBadRequestException(
						"A user with this name already exists.",
						NetshotBadRequestException.NETSHOT_DUPLICATE_USER);
			}
			throw new NetshotBadRequestException(
					"Unable to add the group to the database",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("users/{id}")
	@RolesAllowed("admin")
	@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public User setUser(@Context HttpServletRequest request, @PathParam("id") Long id, RsUser rsUser)
			throws WebApplicationException {
		logger.debug("REST request, edit user {}.", id);
		authorize(request, User.LEVEL_ADMIN);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			User user = (User) session.get(User.class, id);
			if (user == null) {
				logger.error("Unable to find the user {} to be edited.", id);
				throw new NetshotBadRequestException("Unable to find this user.",
						NetshotBadRequestException.NETSHOT_INVALID_USER);
			}

			String username = rsUser.getUsername();
			if (username == null || username.trim().isEmpty()) {
				logger.warn("User posted an empty user name.");
				throw new NetshotBadRequestException("Invalid user name.",
						NetshotBadRequestException.NETSHOT_INVALID_USER_NAME);
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
							NetshotBadRequestException.NETSHOT_INVALID_PASSWORD);
				}
			}
			else {
				user.setPassword("");
			}
			user.setLocal(rsUser.isLocal());
			session.update(user);
			session.getTransaction().commit();
			return user;
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			logger.error("Unable to save the user {}.", id, e);
			Throwable t = e.getCause();
			if (t != null && t.getMessage().contains("Duplicate entry")) {
				throw new NetshotBadRequestException(
						"A user with this name already exists.",
						NetshotBadRequestException.NETSHOT_DUPLICATE_USER);
			}
			throw new NetshotBadRequestException("Unable to save the user.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
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
	@Path("users/{id}")
	@RolesAllowed("admin")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
	public void deleteUser(@Context HttpServletRequest request, @PathParam("id") Long id)
			throws WebApplicationException {
		logger.debug("REST request, delete user {}.", id);
		authorize(request, User.LEVEL_ADMIN);
		Session session = NetshotDatabase.getSession();
		try {
			session.beginTransaction();
			User user = (User) session.load(User.class, id);
			session.delete(user);
			session.getTransaction().commit();
		}
		catch (ObjectNotFoundException e) {
			session.getTransaction().rollback();
			logger.error("The user doesn't exist.");
			throw new NetshotBadRequestException("The user doesn't exist.",
					NetshotBadRequestException.NETSHOT_INVALID_USER);
		}
		catch (HibernateException e) {
			session.getTransaction().rollback();
			throw new NetshotBadRequestException("Unable to delete the user.",
					NetshotBadRequestException.NETSHOT_DATABASE_ACCESS_ERROR);
		}
		finally {
			session.close();
		}
	}

	@GET
	@Path("reports/export")
	@RolesAllowed("user")
	@Produces({ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
	public Response getDataXLSX(@Context HttpServletRequest request,
			@DefaultValue("-1") @QueryParam("group") long group,
			@DefaultValue("false") @QueryParam("interfaces") boolean exportInterfaces,
			@DefaultValue("false") @QueryParam("inventory") boolean exportInventory,
			@DefaultValue("xlsx") @QueryParam("format") String fileFormat) throws WebApplicationException {
		logger.debug("REST request, export data.");
		User user = authorize(request, User.LEVEL_READONLY);

		if (fileFormat.compareToIgnoreCase("xlsx") == 0) {
			String fileName = String.format("netshot-export_%s.xlsx", (new SimpleDateFormat("yyyyMMdd-HHmmss")).format(new Date()));

			Session session = NetshotDatabase.getSession();
			try {
				Workbook workBook = new XSSFWorkbook();
				Row row;
				Cell cell;

				CreationHelper createHelper = workBook.getCreationHelper();
				CellStyle datetimeCellStyle = workBook.createCellStyle();
				datetimeCellStyle.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-mm-dd hh:mm"));
				CellStyle dateCellStyle = workBook.createCellStyle();
				dateCellStyle.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-mm-dd"));

				Sheet summarySheet = workBook.createSheet("Summary");
				row = summarySheet.createRow(0);
				row.createCell(0).setCellValue("Netshot version");
				row.createCell(1).setCellValue(Netshot.VERSION);
				row = summarySheet.createRow(1);
				row.createCell(0).setCellValue("Exported by");
				row.createCell(1).setCellValue(user.getName());
				row = summarySheet.createRow(2);
				row.createCell(0).setCellValue("Date and time");
				cell = row.createCell(1);
				cell.setCellValue(new Date());
				cell.setCellStyle(datetimeCellStyle);
				row = summarySheet.createRow(4);
				row.createCell(0).setCellValue("Selected Group");
				Query query;
				if (group == -1) {
					query = session.createQuery("select d from Device d");
					row.createCell(1).setCellValue("None");
				}
				else {
					query = session
							.createQuery("select d from Device d join d.ownerGroups g where g.id = :id")
							.setLong("id", group);
					DeviceGroup deviceGroup = (DeviceGroup) session.get(DeviceGroup.class, group);
					row.createCell(1).setCellValue(deviceGroup.getName());
				}

				Sheet deviceSheet = workBook.createSheet("Devices");
				row = deviceSheet.createRow(0);
				row.createCell(0).setCellValue("ID");
				row.createCell(1).setCellValue("Name");
				row.createCell(2).setCellValue("Management IP");
				row.createCell(3).setCellValue("Domain");
				row.createCell(4).setCellValue("Network Class");
				row.createCell(5).setCellValue("Family");
				row.createCell(6).setCellValue("Creation");
				row.createCell(7).setCellValue("Last Change");
				row.createCell(8).setCellValue("Software");
				row.createCell(9).setCellValue("End of Sale Date");
				row.createCell(10).setCellValue("End Of Life Date");

				int yDevice = 1;

				@SuppressWarnings("unchecked")
				List<Device> devices = query.list();
				for (Device device : devices) {
					row = deviceSheet.createRow(yDevice++);
					row.createCell(0).setCellValue(device.getId());
					row.createCell(1).setCellValue(device.getName());
					row.createCell(2).setCellValue(device.getMgmtAddress().getIP());
					row.createCell(3).setCellValue(device.getMgmtDomain().getName());
					row.createCell(4).setCellValue(device.getNetworkClass().toString());
					row.createCell(5).setCellValue(device.getFamily());
					cell = row.createCell(6);
					cell.setCellValue(device.getCreatedDate());
					cell.setCellStyle(datetimeCellStyle);
					cell = row.createCell(7);
					cell.setCellValue(device.getChangeDate());
					cell.setCellStyle(datetimeCellStyle);
					row.createCell(8).setCellValue(device.getSoftwareVersion());
					if (device.getEosDate() != null) {
						cell = row.createCell(9);
						cell.setCellValue(device.getEosDate());
						cell.setCellStyle(dateCellStyle);
					}
					if (device.getEolDate() != null) {
						cell = row.createCell(10);
						cell.setCellValue(device.getEolDate());
						cell.setCellStyle(dateCellStyle);
					}
				}

				if (exportInterfaces) {
					Sheet interfaceSheet = workBook.createSheet("Interfaces");
					row = interfaceSheet.createRow(0);
					row.createCell(0).setCellValue("Device ID");
					row.createCell(1).setCellValue("Virtual Device");
					row.createCell(2).setCellValue("Name");
					row.createCell(3).setCellValue("Description");
					row.createCell(4).setCellValue("VRF");
					row.createCell(5).setCellValue("MAC Address");
					row.createCell(6).setCellValue("Enabled");
					row.createCell(7).setCellValue("Level 3");
					row.createCell(8).setCellValue("IP Address");
					row.createCell(9).setCellValue("Mask Length");
					row.createCell(10).setCellValue("Usage");

					int yInterface = 1;
					for (Device device : devices) {
						for (NetworkInterface networkInterface : device.getNetworkInterfaces()) {
							for (NetworkAddress address : networkInterface.getIpAddresses()) {
								row = interfaceSheet.createRow(yInterface++);
								row.createCell(0).setCellValue(device.getId());
								row.createCell(1).setCellValue(networkInterface.getVirtualDevice());
								row.createCell(2).setCellValue(networkInterface.getInterfaceName());
								row.createCell(3).setCellValue(networkInterface.getDescription());
								row.createCell(4).setCellValue(networkInterface.getVrfInstance());
								row.createCell(5).setCellValue(networkInterface.getMacAddress());
								row.createCell(6).setCellValue(networkInterface.isEnabled());
								row.createCell(7).setCellValue(networkInterface.isLevel3());
								row.createCell(8).setCellValue(address.getIP());
								row.createCell(9).setCellValue(address.getPrefixLength());
								row.createCell(10).setCellValue(address.getAddressUsage() == null ? "" : address.getAddressUsage().toString());
							}
						}
					}
				}

				if (exportInventory) {
					Sheet inventorySheet = workBook.createSheet("Inventory");
					row = inventorySheet.createRow(0);
					row.createCell(0).setCellValue("Device ID");
					row.createCell(1).setCellValue("Slot");
					row.createCell(2).setCellValue("Part Number");
					row.createCell(3).setCellValue("Serial Number");

					int yInventory = 1;
					for (Device device : devices) {
						for (Module module : device.getModules()) {
							row = inventorySheet.createRow(yInventory++);
							row.createCell(0).setCellValue(device.getId());
							row.createCell(1).setCellValue(module.getSlot());
							row.createCell(2).setCellValue(module.getPartNumber());
							row.createCell(3).setCellValue(module.getSerialNumber());
						}
					}
				}

				ByteArrayOutputStream output = new ByteArrayOutputStream();
				workBook.write(output);
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

}
