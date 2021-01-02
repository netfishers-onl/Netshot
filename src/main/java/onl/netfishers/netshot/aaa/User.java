/**
 * Copyright 2013-2021 Sylvain Cadilhac (NetFishers)
 * 
 * This file is part of Netshot.
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
package onl.netfishers.netshot.aaa;

import java.security.Principal;

public interface User extends Principal {

	/** Read-only authorization level. */
	public final static int LEVEL_READONLY = 10;

	/** Read-write authorization level. */
	public final static int LEVEL_READWRITE = 100;

	/** Read-write and command executer (on devices) level. */
	public final static int LEVEL_EXECUTEREADWRITE = 500;

	/** Admin authorization level. */
	public final static int LEVEL_ADMIN = 1000;

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
