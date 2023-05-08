package onl.netfishers.netshot.rest;

import java.io.IOException;
import java.net.UnknownHostException;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;

import com.augur.tacacs.TacacsException;

import lombok.extern.slf4j.Slf4j;
import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.aaa.Tacacs;
import onl.netfishers.netshot.aaa.User;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.device.NetworkAddress;

/**
 * Filter to log requests.
 */
@Slf4j
public class LoggerFilter implements ContainerResponseFilter {

	static private boolean trustXForwardedFor = false;

	static public void init() {
		trustXForwardedFor = Netshot.getConfig("netshot.http.trustxforwardedfor", "false").equals("true");
	}

	@Context
	private HttpServletRequest httpRequest;

	/**
	 * Guess the client IP address based on X-Forwarded-For header (if present).
	 * @return the probable client IP address
	 */
	private String getClientAddress() {
		String address = null;
		if (trustXForwardedFor) {
			String forwardedFor = httpRequest.getHeader("X-Forwarded-For");
			if (forwardedFor != null) {
				String[] addresses = forwardedFor.split(",");
				address = addresses[0].trim();
			}
		}
		if (address == null) {
			address = httpRequest.getRemoteAddr();
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
		String remoteAddr = this.getClientAddress();
		if ("GET".equals(method)) {
			Netshot.aaaLogger.debug("Request from {} ({}) - {} - \"{} {}\" - {}.",remoteAddr,
					requestContext.getHeaderString(HttpHeaders.USER_AGENT), user == null ? "<none>" : user.getUsername(),
					requestContext.getMethod(), requestContext.getUriInfo().getRequestUri(), responseContext.getStatus());
		}
		else {
			Netshot.aaaLogger.info("Request from {} ({}) - {} - \"{} {}\" - {}.", remoteAddr,
					requestContext.getHeaderString(HttpHeaders.USER_AGENT), user == null ? "<none>" : user.getUsername(),
					requestContext.getMethod(), requestContext.getUriInfo().getRequestUri(), responseContext.getStatus());
			NetworkAddress na;
			try {
				na = NetworkAddress.getNetworkAddress(remoteAddr);
			}
			catch (UnknownHostException e) {
				na = new Network4Address(0, 0);
			}
			try {
				Tacacs.account(requestContext.getMethod(), requestContext.getUriInfo().getRequestUri().getPath(),
					user == null ? "<none>" : user.getUsername(), Integer.toString(responseContext.getStatus()), na);
			}
			catch (TacacsException e) {
				log.warn("Unable to send accounting message to TACACS+ server", e);
			}
		}
	}
}