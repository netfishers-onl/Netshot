package onl.netfishers.netshot;

import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.util.text.AES256TextEncryptor;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Encryption basic tests")
public class CryptoTest {
	
	@Test
	public void decryptTestDefault() {
		String plain = "admin";
		String encrypted = "ACdTtNiLgWBoGs3qq+mbNA==";
		StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
		encryptor.setPassword("netshot");
		String decrypted = encryptor.decrypt(encrypted);
		Assertions.assertEquals(plain, decrypted);
	}

	@Test
	public void decryptTestStrong() {
		String plain = "admin";
		AES256TextEncryptor encryptor = new AES256TextEncryptor();
		encryptor.setPassword("netshot");
		String encrypted = encryptor.encrypt(plain);
		String decrypted = encryptor.decrypt(encrypted);
		Assertions.assertEquals(plain, decrypted);
	}
}
