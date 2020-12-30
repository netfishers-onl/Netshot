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
