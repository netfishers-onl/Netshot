package onl.netfishers.netshot.rest;

import javax.ws.rs.ForbiddenException;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;

/**
 * Mapper to convert exception raised in the Web method to http error.
 */
public class NetshotExceptionMapper implements ExceptionMapper<Throwable> {

	public Response toResponse(Throwable t) {
		if (!(t instanceof ForbiddenException)) {
			if (t instanceof NetshotAuthenticationRequiredException) {
				RestService.logger.info("Authentication required.", t);
			}
			else {
				RestService.logger.error("Uncaught exception thrown by REST service", t);
			}
		}
		if (t instanceof WebApplicationException) {
			return ((WebApplicationException) t).getResponse();
		}
		else {
			return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
		}
	}
}