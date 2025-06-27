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
package net.netshot.netshot.rest;

import java.io.IOException;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.PreMatching;
import org.hibernate.HibernateException;
import org.hibernate.Session;

import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.database.Database;
import net.netshot.netshot.Netshot;
import net.netshot.netshot.aaa.ApiToken;

/**
 * Filter to authenticate requests based on API token.
 */
@Priority(Priorities.AUTHENTICATION)
@PreMatching
@Slf4j
public class ApiTokenAuthFilter implements ContainerRequestFilter {

	/** Name of the HTTP header used for API token */
	static public final String HTTP_API_TOKEN_HEADER = "X-Netshot-API-Token";

	/** Name of the attribute attached to the the request to carry the token */
	static public final String ATTRIBUTE = "apiToken";

	@Override
	public void filter(ContainerRequestContext requestContext) throws IOException {
		String token = requestContext.getHeaderString(ApiTokenAuthFilter.HTTP_API_TOKEN_HEADER);
		if (token == null) {
			return;
		}
		Netshot.aaaLogger.debug("Received request with API token.");
		token = token.trim();
		String hash = ApiToken.hashToken(token);
		Session session = Database.getSession();
		try {
			ApiToken apiToken = session
				.createQuery("from ApiToken t where t.hashedToken = :hash", ApiToken.class)
				.setParameter("hash", hash).uniqueResult();
			if (apiToken == null) {
				Netshot.aaaLogger.warn("Invalid API token received.");
			}
			else {
				Netshot.aaaLogger.info("Successful API token usage {}.", apiToken);
				requestContext.setProperty(ApiTokenAuthFilter.ATTRIBUTE, apiToken);
			}
		}
		catch (HibernateException e) {
			log.error("Database error while looking for API token", e);
		}
		finally {
			session.close();
		}
	}

}