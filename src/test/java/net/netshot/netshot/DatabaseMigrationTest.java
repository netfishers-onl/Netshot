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

import java.net.Inet4Address;
import java.net.InetAddress;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import liquibase.UpdateSummaryOutputEnum;
import liquibase.changelog.ChangeLogParameters;
import liquibase.changelog.ChangeSet;
import liquibase.changelog.DatabaseChangeLog;
import liquibase.command.CommandScope;
import liquibase.command.core.UpdateCountCommandStep;
import liquibase.command.core.helpers.DbUrlConnectionArgumentsCommandStep;
import liquibase.command.core.helpers.ShowSummaryArgument;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.parser.ChangeLogParserFactory;
import liquibase.resource.ClassLoaderResourceAccessor;
import liquibase.resource.ResourceAccessor;
import net.netshot.netshot.database.Database;
import net.netshot.netshot.database.migrator.NetworkAddressMigrator;
import net.netshot.netshot.device.Network4Address;
import net.netshot.netshot.device.Network6Address;

/**
 * Tests for the Liquibase {@code CustomSqlChange} data migrators under
 * {@link net.netshot.netshot.database.migrator} (currently just
 * {@link NetworkAddressMigrator} - add further migrators here as
 * additional {@code @Nested} classes). Testcontainers-backed tests
 * otherwise only ever see a freshly created schema, so these
 * data-migration paths (as opposed to fresh-install schema creation) are
 * never exercised elsewhere: each test here stops the schema migration
 * just before the migrator's own changeset, seeds rows directly via JDBC
 * in the legacy pre-migration shape, resumes the migration to completion,
 * and checks the result.
 */
public class DatabaseMigrationTest extends WithDatabaseTest {

	private static void assertInetColumn(Statement statement, String query, String expectedAddress)
			throws SQLException {
		try (var rows = statement.executeQuery(query)) {
			Assertions.assertTrue(rows.next(), "No row returned for: %s".formatted(query));
			Assertions.assertEquals(expectedAddress, rows.getString(1),
				"Unexpected migrated inet value for: %s".formatted(query));
		}
	}

	/**
	 * Updates the database schema up to (and including) the given changeset
	 * only, leaving any later changesets unapplied, so a test can seed rows
	 * in that intermediate schema shape, then resume the migration (via
	 * {@link Database#update()}) and check the result. The changeset count
	 * to stop at is resolved dynamically by parsing the changelog and
	 * locating the given id/author, rather than requiring a permanent tag
	 * changeset in the real changelog just for test purposes.
	 *
	 * @param changeSetId the id of the changeset to stop at (inclusive)
	 * @param changeSetAuthor the author of the changeset to stop at
	 * @throws Exception
	 */
	private static void updateToChangeSet(String changeSetId, String changeSetAuthor) throws Exception {
		System.setProperty("liquibase.analytics.enabled", "false");
		try (Connection connection = Database.getConnection(false)) {
			liquibase.database.Database database = DatabaseFactory.getInstance()
				.findCorrectDatabaseImplementation(new JdbcConnection(connection));

			ResourceAccessor resourceAccessor = new ClassLoaderResourceAccessor();
			DatabaseChangeLog changeLog = ChangeLogParserFactory.getInstance()
				.getParser("migration/netshot0.xml", resourceAccessor)
				.parse("migration/netshot0.xml", new ChangeLogParameters(database), resourceAccessor);

			int count = 0;
			boolean found = false;
			for (ChangeSet changeSet : changeLog.getChangeSets()) {
				count += 1;
				if (changeSet.getId().equals(changeSetId) && changeSet.getAuthor().equals(changeSetAuthor)) {
					found = true;
					break;
				}
			}
			if (!found) {
				throw new IllegalArgumentException(
					"No such changeset '%s' by '%s' in the changelog".formatted(changeSetId, changeSetAuthor));
			}

			new CommandScope(UpdateCountCommandStep.COMMAND_NAME)
				.addArgumentValue(DbUrlConnectionArgumentsCommandStep.DATABASE_ARG, database)
				.addArgumentValue(UpdateCountCommandStep.CHANGELOG_FILE_ARG, "migration/netshot0.xml")
				.addArgumentValue(UpdateCountCommandStep.COUNT_ARG, count)
				.addArgumentValue(ShowSummaryArgument.SHOW_SUMMARY_OUTPUT, UpdateSummaryOutputEnum.LOG)
				.execute();
		}
	}

	@Nested
	@DisplayName("0.25.0_24 - NetworkAddressMigrator (legacy int/bigint IP columns to native inet)")
	class Changeset_0_25_0_24_NetworkAddressMigratorTest {

		private Properties getNetshotConfig() {
			// Fresh (dropped and recreated) schema: this test drives the schema
			// migration through an intermediate stage itself, so it cannot
			// tolerate a schema left mid-migration (or fully migrated) by an
			// earlier run against the same live container.
			Properties config = getFreshDatabaseConfig("networkaddressmigratortest");
			config.setProperty("netshot.log.file", "CONSOLE");
			config.setProperty("netshot.log.level", "INFO");
			return config;
		}

		@Test
		@DisplayName("Legacy int/bigint IP columns are converted to inet on upgrade")
		void migratesLegacyAddressesToInet() throws Exception {
			Netshot.initConfig(this.getNetshotConfig());

			// Bring the schema up to right before the inet conversion (the last
			// changeset before the block that adds the inet columns).
			updateToChangeSet("0.25.0_21", "netshot");

			// Compute the legacy int/bigint representations the same way the
			// pre-migration application code used to.
			int domainIpv4Int = Network4Address.inetAddressToInt(
				(Inet4Address) InetAddress.getByName("10.20.30.40"));
			Network6Address domainIpv6 = new Network6Address("2001:db8:1234::5678", 64);
			int interfaceIpv4Int = Network4Address.inetAddressToInt(
				(Inet4Address) InetAddress.getByName("192.168.100.1"));
			Network6Address interfaceIpv6 = new Network6Address("fe80::dead:beef", 64);
			int subnetIpv4Int = Network4Address.inetAddressToInt(
				(Inet4Address) InetAddress.getByName("172.16.0.0"));

			try (Connection connection = Database.getConnection(false);
					Statement statement = connection.createStatement()) {
				statement.execute(
					"insert into domain (id, name, version, ipv4_address, ipv4_pfxlen, ipv4_usage, "
						+ "ipv6_address1, ipv6_address2, ipv6_usage) values "
						+ "(1, 'MigrationTestDomain', 0, %d, 24, 0, %d, %d, 0)".formatted(
							domainIpv4Int, domainIpv6.getAddress1(), domainIpv6.getAddress2()));

				statement.execute(
					"insert into device (id, auto_try_credentials, version, ssh_port, telnet_port) "
						+ "values (1, false, 0, 22, 23)");
				statement.execute(
					"insert into network_interface (id, enabled, level3, device) values (1, true, true, 1)");
				statement.execute(
					"insert into network_interface_ip4addresses (network_interface, address, prefix_length, address_usage) "
						+ "values (1, %d, 24, 0)".formatted(interfaceIpv4Int));
				statement.execute(
					"insert into network_interface_ip6addresses (network_interface, address1, address2, prefix_length, address_usage) "
						+ "values (1, %d, %d, 64, 0)".formatted(
							interfaceIpv6.getAddress1(), interfaceIpv6.getAddress2()));

				statement.execute(
					"insert into task (id, version, dtype, debug_enabled, priority, "
						+ "run_snapshot, run_diagnostics, check_compliance, dont_run_diagnostics, "
						+ "dont_check_compliance, child_order, schedule_mode, stop_on_failure, cancel_requested) "
						+ "values (1, 0, 'ScanSubnetsTask', false, 5, "
						+ "false, false, false, false, false, 0, 0, false, false)");
				statement.execute(
					"insert into scan_subnets_task_subnets (scan_subnets_task, ipv4address, ipv4mask, ipv4usage) "
						+ "values (1, %d, 16, 0)".formatted(subnetIpv4Int));
			}

			// Resume the migration to completion: this is where NetworkAddressMigrator runs.
			Database.update();

			try (Connection connection = Database.getConnection(false);
					Statement statement = connection.createStatement()) {
				assertInetColumn(statement,
					"select ipv4_address from domain where id = 1", "10.20.30.40");
				assertInetColumn(statement,
					"select ipv6_address from domain where id = 1", "2001:db8:1234::5678");
				assertInetColumn(statement,
					"select address from network_interface_ip4addresses where network_interface = 1",
					"192.168.100.1");
				assertInetColumn(statement,
					"select address from network_interface_ip6addresses where network_interface = 1",
					"fe80::dead:beef");
				assertInetColumn(statement,
					"select ipv4address from scan_subnets_task_subnets where scan_subnets_task = 1",
					"172.16.0.0");
			}
		}
	}
}
