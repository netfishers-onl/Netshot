package onl.netfishers.netshot;

import org.junit.jupiter.api.Test;

import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.Finder;
import onl.netfishers.netshot.device.Finder.Expression.FinderParseException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Date;
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
			Assertions.assertEquals(expectedHql, hqlQuery, "Unexpected HQL");
			for (Map.Entry<String, Object> actualEntry : fakeQuery.getParameterHash().entrySet()) {
				if (actualEntry.getValue() instanceof Date) {
					// For relative dates, as the reference "now" is not passed to finder,
					// if the expected and actual dates are very close,
					// we manually override the expected value to let the test pass
					Date actualDate = (Date) actualEntry.getValue();
					Object expectedValue = expectedParameters.get(actualEntry.getKey());
					if (expectedValue instanceof Date) {
						Date expectedDate = (Date) expectedValue;
						Duration diff = Duration.between(actualDate.toInstant(), expectedDate.toInstant());
						if (diff.abs().toMillis() < 500) {
							actualEntry.setValue(expectedDate);
						}
					}
				}
			}
			Assertions.assertEquals(expectedParameters, fakeQuery.getParameterHash(), "Unexpected query parameters");
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
		@DisplayName("Query device by name containing text, case insensitive")
		void queryByNameContainingNoCase() throws Exception {
			assertFinder("[NAME] CONTAINSNOCASE \"Name Example\"", null,
				" from Device d where (lower(d.name) like :var)",
				Map.of("var", "%name example%"));
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
		@DisplayName("Query device by module containing text, case insensitive")
		void queryByModuleText() throws Exception {
			assertFinder("[MODULE] CONTAINSNOCASE \"abcDEFgh01\"", null,
				" from Device d left join d.modules m where (((lower(m.serialNumber) like :var or lower(m.partNumber) like :var) and m.removed is not true))",
				Map.of("var", "%abcdefgh01%"));
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
		@DisplayName("Query device by creation date with absolute date")
		void queryByChangeDateAbsolute1() throws Exception {
			assertFinder("[Creation date] AFTER \"2023-01-02\"", null,
				" from Device d where (d.createdDate >= :var)",
				Map.of(
					"var", Date.from(LocalDate.parse("2023-01-02").atStartOfDay(ZoneId.systemDefault()).toInstant())
				));
		}

		@Test
		@DisplayName("Query device by creation date range with absolute date")
		void queryByChangeDateAbsolute2() throws Exception {
			assertFinder("[Creation date] IS \"2023-01-02\"", null,
				" from Device d where ((d.createdDate >= :var_1 and d.createdDate <= :var_2))",
				Map.of(
					"var_1", Date.from(LocalDate.parse("2023-01-02").atStartOfDay(ZoneId.systemDefault()).toInstant()),
					"var_2", Date.from(LocalDate.parse("2023-01-02").plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant())
				));
		}

		@Test
		@DisplayName("Query device by creation date range with TODAY keyword")
		void queryByChangeDateRelative1() throws Exception {
			assertFinder("[Creation date] IS \"TODAY\"", null,
				" from Device d where ((d.createdDate >= :var_1 and d.createdDate <= :var_2))",
				Map.of(
					"var_1", Date.from(LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()),
					"var_2", Date.from(LocalDate.now().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant())
				));
		}

		@Test
		@DisplayName("Query device by creation date with NOW -7d keyword")
		void queryByChangeDateRelative2() throws Exception {
			assertFinder("[Creation date] BEFORE \"NOW -7d\"", null,
				" from Device d where (d.createdDate <= :var)",
				Map.of(
					"var", Date.from(LocalDateTime.now().minusDays(7).atZone(ZoneId.systemDefault()).toInstant())
				));
		}

		@Test
		@DisplayName("Query device by creation date with NOW -7d keyword")
		void queryByChangeDateRelative3() throws Exception {
			assertFinder("[Creation date] IS \"TODAY - 1 D\"", null,
				" from Device d where ((d.createdDate >= :var_1 and d.createdDate <= :var_2))",
				Map.of(
					"var_1", Date.from(LocalDate.now().minusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()),
					"var_2", Date.from(LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant())
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

	@Nested
	@DisplayName("Device config tests")
	class ConfigTest {

		@Test
		@DisplayName("Config line parents")
		void configLineParents() {
			String[] configLines = new String[]{
				/* 00 */ "version 16",
				/* 01 */ "!",
				/* 02 */ "service timestamps debug datetime msec",
				/* 03 */ "no service password-encryption",
				/* 04 */ "",
				/* 05 */ "vrf definition VRF1",
				/* 06 */ " rd 16:16",
				/* 07 */ " address-family ipv4",
				/* 08 */ " exit-address-family",
				/* 09 */ "!",
				/* 10 */ "!",
				/* 11 */ "ip cef",
				/* 12 */ "no ipv6 cef",
				/* 13 */ "!",
				/* 14 */ "!",
				/* 15 */ "spanning-tree mode rapid-pvst",
				/* 16 */ "!",
				/* 17 */ "interface GigabitEthernet0/1",
				/* 18 */ " description Some description",
				/* 19 */ " ip address 192.168.1.254 255.255.255.0",
				/* 20 */ " bandwidth 100000",
				/* 21 */ " negotiation auto",
				/* 22 */ "!",
				/* 23 */ "interface GigabitEthernet0/2",
				/* 24 */ " description Some description",
				/* 25 */ " ip address 192.168.2.254 255.255.255.0",
				/* 26 */ " ip ospf network point-to-point",
				/* 27 */ " negotiation auto",
				/* 28 */ " shutdown",
				/* 29 */ "!",
				/* 30 */ "router bgp 16",
				/* 31 */ " bgp log-neighbor-changes",
				/* 32 */ " no bgp default ipv4-unicast",
				/* 33 */ " neighbor 192.168.255.1 remote-as 17",
				/* 34 */ " !",
				/* 35 */ " address-family ipv4",
				/* 36 */ "  neigbor 192.168.255.1 activate",
				/* 37 */ " exit-address-family",
				/* 38 */ " !",
				/* 39 */ " address-family ipv4 vrf VRF1",
				/* 40 */ "  neighbor 192.168.254.3 remote-as 18",
				/* 41 */ "  neighbor 192.168.254.3 activate",
				/* 42 */ " exit-address-family",
				/* 43 */ "!",
				/* 44 */ "ip forward-protocol nd",
				/* 45 */ "!",
				/* 46 */ "no ip http server",
				/* 47 */ "end",
				/* 48 */ ""
			};
			int[] parents = new int[] {
				-1, -1, -1, -1, -1, -1,
				5,  5,  5,
				-1, -1, -1, -1, -1, -1, -1, -1, -1,
				17, 17, 17, 17,
				-1, -1,
				23, 23, 23, 23, 23,
				-1, -1,
				30, 30, 30, 30, 30,
				35,
				30, 30, 30,
				39, 39,
				30,
				-1 ,-1, -1, -1, -1, -1,
			};
			int[] computedParents = Config.getLineParents(Arrays.asList(configLines));
			Assertions.assertArrayEquals(parents, computedParents,
				"Parent line indices do not match the expected ones");
		}

	}
}
