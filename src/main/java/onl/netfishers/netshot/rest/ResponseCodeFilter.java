package onl.netfishers.netshot.rest;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;

/**
 * Filter to set the custom status code.
 */
class ResponseCodeFilter implements ContainerResponseFilter {
	/** Request property name to embed the suggested HTTP response code */
	static final String SUGGESTED_RESPONSE_CODE = "onl.netfishers.netshot.rest.SuggestedResponseCode";

	@Context
	private HttpServletRequest httpRequest;

	@Override
	public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
		if (responseContext.getStatus() == 200) {
			Response.Status status = (Response.Status) httpRequest.getAttribute(ResponseCodeFilter.SUGGESTED_RESPONSE_CODE);
			if (status != null) {
				responseContext.setStatus(status.getStatusCode());
			}
		}
	}
}