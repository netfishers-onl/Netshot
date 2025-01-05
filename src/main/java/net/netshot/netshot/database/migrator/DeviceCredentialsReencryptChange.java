package net.netshot.netshot.database.migrator;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import liquibase.change.custom.CustomSqlChange;
import liquibase.database.Database;
import liquibase.database.jvm.JdbcConnection;
import liquibase.exception.CustomChangeException;
import liquibase.exception.DatabaseException;
import liquibase.exception.SetupException;
import liquibase.exception.ValidationErrors;
import liquibase.resource.ResourceAccessor;
import liquibase.statement.SqlStatement;
import liquibase.statement.core.UpdateStatement;
import net.netshot.netshot.Netshot;
import net.netshot.netshot.crypto.Md5DesPasswordBasedEncryptor;
import net.netshot.netshot.crypto.PasswordBasedEncryptor;
import net.netshot.netshot.crypto.Sha2AesPasswordBasedEncryptor;

/**
 * Custom DB migration class to reencrypt device credentials with up-to-date mechanisms
 */
public class DeviceCredentialsReencryptChange implements CustomSqlChange {

	@Override
	public String getConfirmationMessage() {
		return null;
	}

	@Override
	public void setUp() throws SetupException {
		// Nothing to do
	}

	@Override
	public void setFileOpener(ResourceAccessor resourceAccessor) {
		// Nothing to do
	}

	@Override
	public ValidationErrors validate(Database database) {
		return null;
	}

	@Override
	public SqlStatement[] generateStatements(Database database) throws CustomChangeException {
		List<SqlStatement> statements = new ArrayList<>();

		final String tableName = "device_credential_set";
		final String idColumn = "id";
		final String[] sensitiveColumns = new String[] {
			"password", "super_password",
			"community",
			"username", "auth_type", "auth_key", "priv_type", "priv_key",
			"private_key"
		};
		String cryptPassword = Netshot.getConfig("netshot.db.encryptionpassword", null);
		if (cryptPassword == null) {
			// With capital P, for historical reasons
			cryptPassword = Netshot.getConfig("netshot.db.encryptionPassword", "NETSHOT");
		}

		JdbcConnection connection = (JdbcConnection) database.getConnection();
		String select = String.format("select dtype, %s, %s from %s", idColumn,
			String.join(", ", sensitiveColumns), tableName);
		try {
			PasswordBasedEncryptor oldEncryptor = new Md5DesPasswordBasedEncryptor(cryptPassword);
			PasswordBasedEncryptor newEncryptor = new Sha2AesPasswordBasedEncryptor(cryptPassword);
			ResultSet credentialSets = connection.createStatement().executeQuery(select);
			while (credentialSets.next()) {
				final long id = credentialSets.getLong(idColumn);
				final String dtype = credentialSets.getString("dtype");
				UpdateStatement update = new UpdateStatement(
					database.getDefaultCatalogName(), database.getDefaultSchemaName(), tableName)
					.setWhereClause("id = ?").addWhereParameter(id);
				for (String column : sensitiveColumns) {
					final String oldEncrypted = credentialSets.getString(column);
					if (oldEncrypted != null) {
						try {
							if (dtype.equals("DeviceSnmpv3Community") &&
							    (column.equals("username") ||
								   column.equals("auth_type") ||
								   column.equals("priv_type"))) {
								// Keep these columns unencrypted from now
								String plain = oldEncryptor.decrypt(oldEncrypted);
								update.addNewColumnValue(column, plain);
							}
							else if (column.equals("username")) {
								// Don't touch username for other credentialtypes
							}
							else {
								String plain = oldEncryptor.decrypt(oldEncrypted);
								String newEncrypted = newEncryptor.encrypt(plain);
								update.addNewColumnValue(column, newEncrypted);
							}
						}
						catch (Exception e) {
							throw new CustomChangeException(
								String.format(
									"Crypto error while processing table '%s', column '%s' for id %d",
								tableName, column, id), e);
						}
					}
				}
				statements.add(update);
			}
		}
		catch (DatabaseException | SQLException e) {
			throw new CustomChangeException(
				"Database error while preparing device senstive data re-encryption", e);
		}
		
		return statements.toArray(new SqlStatement[0]);
	}

	
}
