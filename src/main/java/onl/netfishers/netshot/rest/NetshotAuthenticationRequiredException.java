package onl.netfishers.netshot.rest;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;

/**
 * The NetshotAuthenticationRequiredException class, which indicates that user authentication is required (401 error).
 */
class NetshotAuthenticationRequiredException extends WebApplicationException {
	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = -2463854660543944995L;
	
	/**
	 * Default constructor.
	 */
	public NetshotAuthenticationRequiredException() {
		super(Response.status(Response.Status.UNAUTHORIZED).build());
	}
}