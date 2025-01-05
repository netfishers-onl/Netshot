package net.netshot.netshot.crypto;

import java.io.InvalidClassException;


/**
 * Generic hash faciliy class, to compute and check digests.
 */
public abstract class Hash {

	/**
	 * Create specific hash object based on hash string.
	 * @param hashString hash string in Modular Crypt Format
	 * @return the hash object
	 * @throws InvalidClassException if the hash format was not recognized
	 */
	static public Hash fromHashString(String hashString) throws InvalidClassException {
		try {
			return Argon2idHash.fromHashString(hashString);
		}
		catch (InvalidClassException e)  {
			// Try next option
		}
		try {
			return Md5BasedHash.fromHashString(hashString);
		}
		catch (InvalidClassException e)  {
			// Try next option
		}
		try {
			return Sha2BasedHash.fromHashString(hashString);
		}
		catch (InvalidClassException e)  {
			// Try next option
		}
		try {
			return Md5BasedHash.fromRawHashString(hashString);
		}
		catch (InvalidClassException e)  {
			// Try next option
		}
		throw new InvalidClassException("Unknown hash string format");
	}

	/**
	 * Compute the hash of the passed string.
	 * @param input the data to hash
	 */
	public abstract void digest(String input);

	/**
	 * Produce the string representation of the hash in Modular Crypt Format.
	 * @return the string representation of the hash
	 */
	public abstract String toHashString();

	/**
	 * Check whether the passed input matches the current hash.
	 * @param input the data to digest
	 * @return true if the input validates the hash
	 */
	public abstract boolean check(String input);

}
