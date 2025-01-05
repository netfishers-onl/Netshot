package net.netshot.netshot.crypto;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.PBEParameterSpec;

import lombok.extern.slf4j.Slf4j;

/**
 * Legacy MD5/DES-based password based encryption/decryption util class.
 */
@Slf4j
public class Md5DesPasswordBasedEncryptor extends PasswordBasedEncryptor {

	private static final String DEFAULT_ALGORITHM = "PBEWithMD5AndDES";
	private static Charset MESSAGE_CHARSET = StandardCharsets.UTF_8;
	private static Charset ENCRYPTED_CHARSET = StandardCharsets.US_ASCII;

	private int saltSize = 8;
	private int keyIterations = 1000;

	public Md5DesPasswordBasedEncryptor(String password) {
		super(password);
	}

	private byte[] generateSalt() {
		SecureRandom secureRandom = new SecureRandom();
		byte[] salt = new byte[this.saltSize];
		secureRandom.nextBytes(salt);
		return salt;
	}

	@Override
	public String encrypt(String input) {
		return this.encrypt(input, this.generateSalt());
	}

	public String encrypt(String input, byte[] salt) {
		if (input == null) {
			return null;
		}

		try {
			final byte[] inputBytes = input.getBytes(MESSAGE_CHARSET);
			Cipher cipher = Cipher.getInstance(DEFAULT_ALGORITHM);
			SecretKeyFactory keyFactory = SecretKeyFactory.getInstance(DEFAULT_ALGORITHM);

			PBEKeySpec keySpec = new PBEKeySpec(this.password.toCharArray());
			SecretKey key = keyFactory.generateSecret(keySpec);
			PBEParameterSpec paramSpec = new PBEParameterSpec(salt, this.keyIterations);

			cipher.init(Cipher.ENCRYPT_MODE, key, paramSpec);
			byte[] encrypted = cipher.doFinal(inputBytes);
			byte[] saltedEncrypted = new byte[salt.length + encrypted.length];
			System.arraycopy(salt, 0, saltedEncrypted, 0, salt.length);
			System.arraycopy(encrypted, 0, saltedEncrypted, salt.length, encrypted.length);
			return new String(Base64.getEncoder().encode(saltedEncrypted), ENCRYPTED_CHARSET);
		}
		catch (Exception e) {
			log.error("Unable to encrypt data with given arguments", e);
			throw new IllegalArgumentException("Unable to encrypt data with given arguments", e);
		}
	}

	public String decrypt(byte[] inputBytes, byte[] salt) {

		try {
			Cipher cipher = Cipher.getInstance(DEFAULT_ALGORITHM);
			SecretKeyFactory keyFactory = SecretKeyFactory.getInstance(DEFAULT_ALGORITHM);

			PBEKeySpec keySpec = new PBEKeySpec(this.password.toCharArray());
			SecretKey key = keyFactory.generateSecret(keySpec);
			PBEParameterSpec paramSpec = new PBEParameterSpec(salt, this.keyIterations);

			cipher.init(Cipher.DECRYPT_MODE, key, paramSpec);
			byte[] decrypted = cipher.doFinal(inputBytes);
			return new String(decrypted, MESSAGE_CHARSET);
		}
		catch (Exception e) {
			log.error("Unable to decrypt data with given arguments", e);
			throw new IllegalArgumentException("Unable to decrypt data with given arguments", e);
		}
	}

	@Override
	public String decrypt(String input) {
		if (input == null) {
			return null;
		}
		byte[] inputBytes = Base64.getDecoder().decode(input.getBytes(ENCRYPTED_CHARSET));
		byte[] salt = new byte[this.saltSize];
		System.arraycopy(inputBytes, 0, salt, 0, this.saltSize);
		inputBytes = Arrays.copyOfRange(inputBytes, this.saltSize, inputBytes.length);
		return this.decrypt(inputBytes, salt);
	}

}
