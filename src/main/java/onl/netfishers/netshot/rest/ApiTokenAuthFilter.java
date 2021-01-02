package onl.netfishers.netshot.rest;

import java.io.IOException;

import javax.annotation.Priority;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Priorities;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.PreMatching;
import javax.ws.rs.core.Context;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.aaa.ApiToken;

/**
 * Filter to authenticate requests based on API token.
 */
@Priority(Priorities.AUTHENTICATION)
@PreMatching
class ApiTokenAuthFilter implements ContainerRequestFilter {

	/** The logger. */
	static Logger logger = LoggerFactory.getLogger(ApiTokenAuthFilter.class);

	/** Name of the HTTP header used for API token */
	static public final String HTTP_API_TOKEN_HEADER = "X-Netshot-API-Token";

	@Context
	private HttpServletRequest httpRequest;

	@Override
	public void filter(ContainerRequestContext requestContext) throws IOException {
		String token = httpRequest.getHeader(ApiTokenAuthFilter.HTTP_API_TOKEN_HEADER);
		if (token != null) {
			Netshot.aaaLogger.debug("Received request with API token.");
			String hash = ApiToken.hashToken(token);
			Session session = Database.getSession();
			try {
				ApiToken apiToken = session.createQuery("from ApiToken t where t.hashedToken = :hash", ApiToken.class)
						.setParameter("hash", hash).uniqueResult();
				if (apiToken == null) {
					Netshot.aaaLogger.warn("Invalid API token received.");
				}
				else {
					Netshot.aaaLogger.info("Successful API token usage {}.", apiToken);
					httpRequest.setAttribute("apiToken", apiToken);
				}
			}
			catch (HibernateException e) {
				logger.error("Database error while looking for API token", e);
			}
			finally {
				session.close();
			}
		}
	}

}