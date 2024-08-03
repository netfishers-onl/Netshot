package onl.netfishers.netshot.database;

import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import onl.netfishers.netshot.Netshot;

@Converter
public class StringEncryptorConverter implements AttributeConverter<String, String> {

	private StandardPBEStringEncryptor encryptor;

	public StringEncryptorConverter() {
		this.encryptor = new StandardPBEStringEncryptor();
		String cryptPassword = Netshot.getConfig("netshot.db.encryptionpassword", null);
		if (cryptPassword == null) {
			cryptPassword = Netshot.getConfig("netshot.db.encryptionPassword", "NETSHOT"); // Historical reasons
		}
		this.encryptor.setPassword(cryptPassword);
	}

	@Override
	public String convertToDatabaseColumn(String attribute) {
		return this.encryptor.encrypt(attribute);
	}

	@Override
	public String convertToEntityAttribute(String dbData) {
		return this.encryptor.decrypt(dbData);
	}
	
}
