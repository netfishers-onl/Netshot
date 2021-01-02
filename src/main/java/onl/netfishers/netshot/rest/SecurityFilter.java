package onl.netfishers.netshot.rest;

import java.io.IOException;
import java.security.Principal;

import javax.annotation.Priority;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Priorities;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.PreMatching;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.UriInfo;

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
	javax.inject.Provider<UriInfo> uriInfo;

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

		private User user;

		public Authorizer(User user) {
			this.user = user;
		}

		@Override
		public boolean isUserInRole(String role) {
			boolean result = (user != null && (("admin".equals(role) && user.getLevel() >= User.LEVEL_ADMIN)
					|| ("executereadwrite".equals(role) && user.getLevel() >= User.LEVEL_EXECUTEREADWRITE)
					|| ("readwrite".equals(role) && user.getLevel() >= User.LEVEL_READWRITE)
					|| ("readonly".equals(role) && user.getLevel() >= User.LEVEL_READONLY)));
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