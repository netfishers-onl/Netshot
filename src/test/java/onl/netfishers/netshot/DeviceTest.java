package onl.netfishers.netshot;

import org.junit.jupiter.api.Test;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.Finder;
import onl.netfishers.netshot.device.Finder.Expression.FinderParseException;

import java.util.Map;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;

public class DeviceTest {
	
	@Nested
	@DisplayName("Device finder test")
	class DeviceFinderTest {

		/**
		 * Assert finder HQL and parameters results equal the expected values.
		 * @param nsQuery = Netshot query
		 * @param driver = The device driver
		 * @param expectedHql = the expected HQL
		 * @param expectedParameters = the expected query parameters
		 * @throws Exception
		 */
		private void assertFinder(String nsQuery, String driverName,
					String expectedHql, Map<String, Object> expectedParameters) throws Exception {
			if (driverName != null) {
				Netshot.initConfig();
				DeviceDriver.refreshDrivers();
			}
			FakeQuery<Device> fakeQuery = new FakeQuery<>();
			Finder finder = new Finder(nsQuery, DeviceDriver.getDriverByName(driverName));
			finder.setVariables(fakeQuery);
			String hqlQuery = finder.getHql();
			Assertions.assertEquals(hqlQuery, expectedHql, "Unexpected HQL");
			Assertions.assertEquals(fakeQuery.getParameterHash(), expectedParameters, "Unexpected query parameters");
		}

		@Test
		@DisplayName("Query device by name")
		void queryByName() throws Exception {
			assertFinder("[NAME] IS \"Name Example\"", null,
				" from Device d where (d.name like :var)",
				Map.of("var", "Name Example"));
		}

		@Test
		@DisplayName("Query device by name starting with text")
		void queryByNameStartingWith() throws Exception {
			assertFinder("[NAME] STARTSWITH \"Name Example\"", null,
				" from Device d where (d.name like :var)",
				Map.of("var", "Name Example%"));
		}

		@Test
		@DisplayName("Query device by name ending with text")
		void queryByNameEndingWith() throws Exception {
			assertFinder("[NAME] ENDSWITH \"Name Example\"", null,
				" from Device d where (d.name like :var)",
				Map.of("var", "%Name Example"));
		}

		@Test
		@DisplayName("Query device by name containing text")
		void queryByNameContaining() throws Exception {
			assertFinder("[NAME] CONTAINS \"Name Example\"", null,
				" from Device d where (d.name like :var)",
				Map.of("var", "%Name Example%"));
		}

		@Test
		@DisplayName("Query device by name matching text")
		void queryByNameMatching() throws Exception {
			assertFinder("[NAME] MATCHES \"^Na.*$\"", null,
				" from Device d where (regexp_like(d.name, :var) = 1)",
				Map.of("var", "^Na.*$"));
		}

		@Test
		@DisplayName("Query device by IP")
		void queryByIp() throws Exception {
			assertFinder("[IP] IS 1.2.3.4", null,
				" from Device d left join d.networkInterfaces ni left join ni.ip4Addresses ip4 where ((d.mgmtAddress.address = :var_0 or ip4.address = :var_0))",
				Map.of("var_0", 1 << 24 | 2 << 16 | 3 << 8 | 4));
		}

		@Test
		@DisplayName("Query device by IP range")
		void queryByIpRange() throws Exception {
			assertFinder("[IP] IN 192.168.1.0/24", null,
				" from Device d left join d.networkInterfaces ni left join ni.ip4Addresses ip4 where (((d.mgmtAddress.address >= :var_0 and d.mgmtAddress.address <= :var_1) or (ip4.address >= :var_0 and ip4.address < :var_1)))",
				Map.of("var_0", 192 << 24 | 168 << 16 | 1 << 8 | 0, "var_1", 192 << 24 | 168 << 16 | 1 << 8 | 255));
		}

		@Test
		@DisplayName("Query device by interface description")
		void queryByInterfaceDescription() throws Exception {
			assertFinder("[INTERFACE] IS \"some description\"", null,
				" from Device d left join d.networkInterfaces ni where ((ni.interfaceName like :var or ni.description like :var))",
				Map.of("var", "some description"));
		}

		@Test
		@DisplayName("Query IOS device by image file")
		void queryByIosImageFile() throws Exception {
			assertFinder("[IOS image file] IS \"blablabla.bin\"", "CiscoIOS12",
				" from Device d, Config c left join c.attributes var_ca with var_ca.name = :var_name where d.driver = :driver and d.lastConfig = c and (var_ca.text like :var)",
				Map.of(
					"var", "blablabla.bin",
					"var_name", "iosImageFile",
					"driver", "CiscoIOS12"
				));
		}

		@Test
		@DisplayName("Query device by name with advanced boolean expression")
		void queryByNameAdvancedBoolean1() throws Exception {
			assertFinder("[NAME] IS \"Name 1\" OR [NAME] IS \"Name 2\" AND NOT([NAME] IS \"Name 3\")", null,
				" from Device d where ((d.name like :var_0 or (d.name like :var_1_0 and not (d.name like :var_1_1_0))))",
				Map.of(
					"var_0", "Name 1",
					"var_1_0", "Name 2",
					"var_1_1_0", "Name 3"
				));
		}

		@Test
		@DisplayName("Query device by name with advanced boolean expression")
		void queryByNameAdvancedBoolean2() throws Exception {
			assertFinder("([NAME] IS \"Name 1\" OR [NAME] IS \"Name 2\") AND NOT([NAME] IS \"Name 3\")", null,
				" from Device d where (((d.name like :var_0_0 or d.name like :var_0_1) and not (d.name like :var_1_0)))",
				Map.of(
					"var_0_0", "Name 1",
					"var_0_1", "Name 2",
					"var_1_0", "Name 3"
				));
		}

		@Test
		@DisplayName("Simple parser exception")
		void throwParserExceptionSimple() throws Exception {
			Assertions.assertThrows(FinderParseException.class,
				() -> new Finder("[INVALID] IS TRUE", null),
				"Parser didn't throw exception as expected");
		}
	}
}
