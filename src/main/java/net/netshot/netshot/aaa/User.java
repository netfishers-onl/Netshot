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
package net.netshot.netshot.aaa;

import java.security.Principal;

import lombok.Getter;

/**
 * Netshot user with permission level.
 */
public interface User extends Principal {

	/** Read-only authorization level. */
	public final static int LEVEL_READONLY = 10;
	public final static String ROLE_READONLY = "read-only";

	/** Operator authorization level. */
	public final static int LEVEL_OPERATOR = 50;
	public final static String ROLE_OPERATOR = "operator";

	/** Read-write authorization level. */
	public final static int LEVEL_READWRITE = 100;
	public final static String ROLE_READWRITE = "read-write";

	/** Read-write and command executer (on devices) level. */
	public final static int LEVEL_EXECUTEREADWRITE = 500;
	public final static String ROLE_EXECUTEREADWRITE = "execute-read-write";

	/** Admin authorization level. */
	public final static int LEVEL_ADMIN = 1000;
	public final static String ROLE_ADMIN = "admin";

	/** Role with name and level */
	public static enum Role {
		READONLY(ROLE_READONLY, LEVEL_READONLY),
		OPERATOR(ROLE_OPERATOR, LEVEL_OPERATOR),
		READWRITE(ROLE_READWRITE, LEVEL_READWRITE),
		EXECUTEREADWRITE(ROLE_EXECUTEREADWRITE, LEVEL_EXECUTEREADWRITE),
		ADMIN(ROLE_ADMIN, LEVEL_ADMIN);

		/** Name of the role */
		@Getter
		final private String name;

		/** Numerical authorization level of the role  */
		@Getter
		final private int level;

		/** Private constructor */
		private Role(String name, int level) {
			this.name = name;
			this.level = level;
		}
	}

	/**
	 * Gets the username.
	 *
	 * @return the username
	 */
	public String getUsername();

	/**
	 * Gets the level.
	 *
	 * @return the level
	 */
	public int getLevel();
	
}
