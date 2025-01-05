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
 * SHA2-based hash.
 * By default, SHA256, 1000 iterations and 8-byte salt.
 */
public class Sha2BasedHash extends Hash {
	private static Charset HASH_CHARSET = StandardCharsets.US_ASCII;
	private static Charset MESSAGE_CHARSET = StandardCharsets.UTF_8;
	private static String DEFAULT_ALGORITHM = "SHA-256";

	private static final Pattern HASHSTRING_PATTERN = Pattern.compile(
		"^\\$(?<version>5|6)(\\$t=(?<iterations>[0-9]+))?(\\$(?<salt>[-A-Za-z0-9+/]+))?\\$(?<hash>[-A-Za-z0-9+/]+)$");

	public static Sha2BasedHash fromHashString(String hashString) throws InvalidClassException {
		if (hashString == null) {
			return null;
		}
		final Matcher matcher = HASHSTRING_PATTERN.matcher(hashString);
		if (!matcher.matches()) {
			throw new InvalidClassException("Cannot parse SHA2 hash string");
		}
		Sha2BasedHash sha2Hash = new Sha2BasedHash();
		final String saltString = matcher.group("salt");
		if (saltString == null) {
			sha2Hash.setSalt(null);
		}
		else {
			try {
				sha2Hash.setSalt(Base64.getDecoder().decode(saltString.getBytes(HASH_CHARSET)));
			}
			catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Salt component cannot be decoded", e);
			}
		}
		try {
			sha2Hash.hash = Base64.getDecoder().decode(matcher.group("hash").getBytes(HASH_CHARSET));
		}
		catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("Hash component cannot be decoded", e);
		}
		int version = Integer.parseInt(matcher.group("version"));
		if (version == 5) {
			sha2Hash.algorithm = "SHA-256";
			if (sha2Hash.hash.length != 32) {
				throw new IllegalArgumentException("Invalid length for hash component");
			}
		}
		else if (version == 6) {
			sha2Hash.algorithm = "SHA-512";
			if (sha2Hash.hash.length != 64) {
				throw new IllegalArgumentException("Invalid length for hash component");
			}
		}
		else {
			throw new IllegalArgumentException("Unknown SHA2 version/algorithm");
		}
		final String iterationString = matcher.group("iterations");
		if (iterationString != null) {
			sha2Hash.iterations = Integer.parseInt(iterationString);
			if (sha2Hash.iterations < 1 || sha2Hash.iterations > (1 << 24)) {
				throw new IllegalArgumentException("Invalid iteration component value");
			}
		}
		return sha2Hash;
	}

	public static Sha2BasedHash fromRawHashString(String hashString) throws InvalidClassException {
		if (hashString == null) {
			return null;
		}
		Sha2BasedHash sha2Hash = new Sha2BasedHash();
		sha2Hash.setSalt(null);
		sha2Hash.hash = Base64.getDecoder().decode(hashString.getBytes(HASH_CHARSET));
		if (sha2Hash.hash.length == 32) {
			sha2Hash.algorithm = "SHA-256";
		}
		else if (sha2Hash.hash.length == 64) {
			sha2Hash.algorithm = "SHA-512";
		}
		else {
			throw new InvalidClassException("Invalid hash size for SHA2");
		}
		return sha2Hash;
	}

	private int saltSize = 8;
	@Getter
	private byte[] salt = null;

	@Getter
	private byte[] hash = null;

	@Getter
	@Setter
	private int iterations = 1000;

	@Getter
	@Setter
	private String algorithm = DEFAULT_ALGORITHM;

	public Sha2BasedHash() {

	}

	public Sha2BasedHash(String input) {
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
			md = MessageDigest.getInstance(this.algorithm);
		}
		catch (NoSuchAlgorithmException e) {
			throw new RuntimeException("Lack of SHA2 support in the JVM", e);
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
		int version = 5;
		if ("SHA-512".equals(this.algorithm)) {
			version = 6;
		}
		StringBuffer sb = new StringBuffer()
			.append("$").append(version);
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
		Sha2BasedHash other = new Sha2BasedHash();
		other.salt = (this.salt == null) ? null : Arrays.copyOf(this.salt, this.salt.length);
		other.saltSize = this.saltSize;
		other.iterations = this.iterations;
		other.algorithm = this.algorithm;
		other.digest(input);
		return Arrays.equals(other.hash, this.hash);
	}

	public void setSalt(byte[] salt) {
		this.salt = salt;
		this.saltSize = (salt == null) ? 0 : salt.length;
	}
	
}
