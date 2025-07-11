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
import jakarta.ws.rs.core.Response;

/**
 * The NetshotAuthenticationRequiredException class, which indicates that user authentication is required (401 error).
 */
public class NetshotAuthenticationRequiredException extends ForbiddenException {
	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = -2463854660543944995L;
	
	/**
	 * Default constructor.
	 */
	public NetshotAuthenticationRequiredException() {
		super(Response.status(Response.Status.FORBIDDEN).build());
	}
}
