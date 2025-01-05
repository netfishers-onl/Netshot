package net.netshot.netshot.crypto;

/**
 * Generic encryption/decryption class (using password).
 */
public abstract class PasswordBasedEncryptor {

	protected String password;

	public PasswordBasedEncryptor(String password) {
		this.password = password;
	}

	public abstract String encrypt(String input);

	public abstract String decrypt(String input);
}
