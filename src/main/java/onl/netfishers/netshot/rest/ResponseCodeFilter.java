package onl.netfishers.netshot.rest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;

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
		Response.Status status = (Response.Status) httpRequest.getAttribute(ResponseCodeFilter.SUGGESTED_RESPONSE_CODE);
		if (status != null) {
			responseContext.setStatus(status.getStatusCode());
		}
	}
}