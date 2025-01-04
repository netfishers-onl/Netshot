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

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;

import com.augur.tacacs.TacacsException;

import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.Netshot;
import net.netshot.netshot.aaa.Tacacs;
import net.netshot.netshot.aaa.User;

/**
 * Filter to log requests.
 */
@Slf4j
public class LoggerFilter implements ContainerResponseFilter {

	static private boolean trustXForwardedFor = false;

	static public void init() {
		trustXForwardedFor = Netshot.getConfig("netshot.http.trustxforwardedfor", false);
	}

	@Context
	private HttpServletRequest httpRequest;

	/**
	 * Guess the client IP address based on X-Forwarded-For header (if present).
	 * @return the probable client IP address
	 */
	static public String getClientAddress(HttpServletRequest request) {
		String address = null;
		if (trustXForwardedFor) {
			String forwardedFor = request.getHeader("X-Forwarded-For");
			if (forwardedFor != null) {
				String[] addresses = forwardedFor.split(",");
				address = addresses[0].trim();
			}
		}
		if (address == null) {
			address = request.getRemoteAddr();
		}
		return address;
	}

	@Override
	public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext)
			throws IOException {
		User user = null;
		try {
			user = (User) requestContext.getSecurityContext().getUserPrincipal();
		}
		catch (Exception e) {
			//
		}
		String method = requestContext.getMethod().toUpperCase();
		String remoteAddr = LoggerFilter.getClientAddress(this.httpRequest);
		if ("GET".equals(method)) {
			Netshot.aaaLogger.debug("Request from {} ({}) - {} - \"{} {}\" - {}.", remoteAddr,
					requestContext.getHeaderString(HttpHeaders.USER_AGENT), user == null ? "<none>" : user.getUsername(),
					requestContext.getMethod(), requestContext.getUriInfo().getRequestUri(), responseContext.getStatus());
		}
		else {
			Netshot.aaaLogger.info("Request from {} ({}) - {} - \"{} {}\" - {}.", remoteAddr,
					requestContext.getHeaderString(HttpHeaders.USER_AGENT), user == null ? "<none>" : user.getUsername(),
					requestContext.getMethod(), requestContext.getUriInfo().getRequestUri(), responseContext.getStatus());
			try {
				Tacacs.account(
					requestContext.getMethod(),
					requestContext.getUriInfo().getRequestUri().getPath(),
					user == null ? "<none>" : user.getUsername(),
					Integer.toString(responseContext.getStatus()),
					remoteAddr);
			}
			catch (TacacsException e) {
				log.warn("Unable to send accounting message to TACACS+ server", e);
			}
		}
	}
}