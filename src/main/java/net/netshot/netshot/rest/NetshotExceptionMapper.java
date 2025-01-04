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

import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;

/**
 * Mapper to convert exception raised in the Web method to http error.
 */
public class NetshotExceptionMapper implements ExceptionMapper<Throwable> {

	public Response toResponse(Throwable t) {
		if (!(t instanceof ForbiddenException)) {
			if (t instanceof NetshotAuthenticationRequiredException) {
				RestService.log.info("Authentication required.", t);
			}
			else {
				RestService.log.error("Uncaught exception thrown by REST service", t);
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