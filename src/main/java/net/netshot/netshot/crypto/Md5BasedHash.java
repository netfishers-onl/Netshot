package net.netshot.netshot.crypto;

import java.io.InvalidClassException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.Getter;
import lombok.Setter;

/**
 * (Legacy) MD5-based hash.
 * By default, 1000 iterations and 8-byte salt.
 * Compatible with default Jasypt BasicPasswordEncryptor implementation.
 */
public class Md5BasedHash extends Hash {
	private static Charset HASH_CHARSET = StandardCharsets.US_ASCII;
	private static Charset MESSAGE_CHARSET = StandardCharsets.UTF_8;

	private static int HASH_SIZE = 16; // MD5 hash size

	private static final Pattern HASHSTRING_PATTERN = Pattern.compile(
		"^\\$1(\\$t=(?<iterations>[0-9]+))?(\\$(?<salt>[-A-Za-z0-9+/]+))?\\$(?<hash>[-A-Za-z0-9+/]+)$");

	public static Md5BasedHash fromHashString(String hashString) throws InvalidClassException {
		if (hashString == null) {
			return null;
		}
		final Matcher matcher = HASHSTRING_PATTERN.matcher(hashString);
		if (!matcher.matches()) {
			throw new InvalidClassException("Cannot parse MD5 hash string");
		}
		Md5BasedHash md5Hash = new Md5BasedHash();
		final String saltString = matcher.group("salt");
		if (saltString == null) {
			md5Hash.setSalt(null);
		}
		else {
			try {
				md5Hash.setSalt(Base64.getDecoder().decode(saltString.getBytes(HASH_CHARSET)));
			}
			catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Salt component cannot be decoded", e);
			}
		}
		try {
			md5Hash.hash = Base64.getDecoder().decode(matcher.group("hash").getBytes(HASH_CHARSET));
		}
		catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("Hash component cannot be decoded", e);
		}
		if (md5Hash.hash.length != HASH_SIZE) {
			throw new IllegalArgumentException("Invalid length for hash component");
		}
		final String iterationString = matcher.group("iterations");
		if (iterationString != null) {
			md5Hash.iterations = Integer.parseInt(iterationString);
			if (md5Hash.iterations < 1 || md5Hash.iterations >= (1 << 24)) {
				throw new IllegalArgumentException("Invalid iteration component value");
			}
		}
		return md5Hash;
	}

	public static Md5BasedHash fromRawHashString(String hashString) throws InvalidClassException {
		if (hashString == null) {
			return null;
		}
		byte[] saltedHash = Base64.getDecoder().decode(hashString.getBytes(HASH_CHARSET));
		if (saltedHash.length < Md5BasedHash.HASH_SIZE) {
			throw new InvalidClassException("Too short hash string for MD5");
		}
		Md5BasedHash md5Hash = new Md5BasedHash();
		md5Hash.hash = Arrays.copyOfRange(saltedHash, saltedHash.length - HASH_SIZE, saltedHash.length);
		if (saltedHash.length > Md5BasedHash.HASH_SIZE) {
			md5Hash.setSalt(Arrays.copyOfRange(saltedHash, 0, saltedHash.length - HASH_SIZE));
		}
		else {
			md5Hash.setSalt(null);
		}
		return md5Hash;
	}

	private int saltSize = 8;
	@Getter
	private byte[] salt = null;

	@Getter
	private byte[] hash = null;

	@Getter
	@Setter
	private int iterations = 1000;

	public Md5BasedHash() {

	}

	public Md5BasedHash(String input) {
		this.digest(input);
	}

	private void generateSalt() {
		if (this.saltSize == 0) {
			this.salt = null;
			return;
		}
		SecureRandom secureRandom = new SecureRandom();
		this.salt = new byte[this.saltSize];
		secureRandom.nextBytes(this.salt);
	}

	@Override
	public void digest(String input) {
		if (input == null) {
			this.hash = null;
			return;
		}
		if (this.salt == null) {
			this.generateSalt();
		}

		byte[] inputBytes = input.getBytes(MESSAGE_CHARSET);
		MessageDigest md;
		try {
			md = MessageDigest.getInstance("MD5");
		}
		catch (NoSuchAlgorithmException e) {
			throw new RuntimeException("Lack of MD5 support in the JVM", e);
		}
		md.reset();
		if (this.salt != null) {
			md.update(this.salt);
		}
		md.update(inputBytes);
		byte[] digest = md.digest();
		for (int i = 1; i < this.iterations; i++) {
			md.reset();
			digest = md.digest(digest);
		}
		this.hash = digest;
	}

	@Override
	public String toHashString() {
		if (this.hash == null) {
			return null;
		}
		StringBuffer sb = new StringBuffer()
			.append("$").append("1");
		if (this.iterations != 1) {
			sb.append("$").append(String.format("t=%d", this.iterations));
		}
		if (this.salt != null) {
			sb.append("$").append(
				new String(Base64.getEncoder().withoutPadding().encode(this.salt),
				HASH_CHARSET));
		}
		sb.append("$").append(
			new String(Base64.getEncoder().withoutPadding().encode(this.hash),
			HASH_CHARSET));
		return sb.toString();
	}

	@Override
	public boolean check(String input) {
		if (input == null) {
			return this.hash == null;
		}
		Md5BasedHash other = new Md5BasedHash();
		other.salt = (this.salt == null) ? null : Arrays.copyOf(this.salt, this.salt.length);
		other.saltSize = this.saltSize;
		other.iterations = this.iterations;
		other.digest(input);
		return Arrays.equals(other.hash, this.hash);
	}

	public void setSalt(byte[] salt) {
		this.salt = salt;
		this.saltSize = (salt == null) ? 0 : salt.length;
	}
	
}
