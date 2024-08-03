package onl.netfishers.netshot.rest;

import java.io.IOException;
import java.security.Principal;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.core.UriInfo;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.aaa.User;

/**
 * Filter to authorize based on user and role.
 */
@Priority(Priorities.AUTHORIZATION)
@PreMatching class SecurityFilter implements ContainerRequestFilter {

	@Context
	private HttpServletRequest httpRequest;

	@Inject
	jakarta.inject.Provider<UriInfo> uriInfo;

	@Override
	public void filter(ContainerRequestContext requestContext) throws IOException {
		User user = (User) httpRequest.getAttribute("apiToken");
		if (user == null) {
			user = (User) httpRequest.getSession().getAttribute("user");
		}
		httpRequest.setAttribute("user", user);
		requestContext.setSecurityContext(new Authorizer(user));
	}

	private class Authorizer implements SecurityContext {

		final private User user;

		public Authorizer(User user) {
			this.user = user;
		}

		@Override
		public boolean isUserInRole(String role) {
			boolean result = (user != null && (
					("admin".equals(role) && user.getLevel() >= User.LEVEL_ADMIN) ||
					("executereadwrite".equals(role) && user.getLevel() >= User.LEVEL_EXECUTEREADWRITE) ||
					("readwrite".equals(role) && user.getLevel() >= User.LEVEL_READWRITE) ||
					("operator".equals(role) && user.getLevel() >= User.LEVEL_OPERATOR) ||
					("readonly".equals(role) && user.getLevel() >= User.LEVEL_READONLY)));
			Netshot.aaaLogger.debug("Role {} requested for user {}: result {}.", role,
					user == null ? "<null>" : user.getUsername(), result);
			return result;
		}

		@Override
		public boolean isSecure() {
			return "https".equals(uriInfo.get().getRequestUri().getScheme());
		}

		@Override
		public Principal getUserPrincipal() {
			return user;
		}

		@Override
		public String getAuthenticationScheme() {
			return SecurityContext.FORM_AUTH;
		}
	}
}