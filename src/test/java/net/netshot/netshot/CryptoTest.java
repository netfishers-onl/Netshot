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
package net.netshot.netshot;

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
