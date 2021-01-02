package onl.netfishers.netshot.rest;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;

import onl.netfishers.netshot.rest.RestService.RsErrorBean;

/**
 * Exception to be thrown when the users is not authorized to perform an action.
 */
public class NetshotNotAuthorizedException extends WebApplicationException {

	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = -453816975689585686L;

	public NetshotNotAuthorizedException(String message, int errorCode) {
		super(Response.status(Response.Status.FORBIDDEN)
				.entity(new RsErrorBean(message, errorCode)).build());
	}
}