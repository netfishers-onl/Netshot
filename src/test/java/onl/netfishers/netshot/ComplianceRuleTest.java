package onl.netfishers.netshot;

import org.hibernate.Session;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import onl.netfishers.netshot.compliance.CheckResult;
import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.rules.TextRule;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.work.TaskLogger;

public class ComplianceRuleTest {

	@BeforeAll
	static void initNetshot() throws Exception {
		Netshot.initConfig();
		DeviceDriver.refreshDrivers();
	}
	
	@Nested
	@DisplayName("Simple Text Rule")
	class TextRuleTest {
		
		Policy policy = new Policy("Fake policy", null);
		Device device = FakeDeviceFactory.getFakeCiscoIosDevice();
		TaskLogger taskLogger = new FakeTaskLogger();
		Session fakeSession = new FakeSession();
		TextRule rule;

		TextRuleTest() {
			this.rule = new TextRule("Testing rule", policy);
			rule.setEnabled(true);
			rule.setDeviceDriver("CiscoIOS12");
			rule.setField("runningConfig");
			rule.setRegExp(false);
			rule.setContext(null);
			rule.setAnyBlock(false);
			rule.setMatchAll(false);
			rule.setNormalize(false);
		}

		@Test
		@DisplayName("Conforming rule")
		void matchAll() {
			rule.setText("no service pad");
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Non-conforming rule")
		void matchAllFail() {
			rule.setText("no service mlqksd");
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.NONCONFORMING, result.getResult(), 
				"The result is not NONCONFORMING");
		}

		@Test
		@DisplayName("Disabled rule")
		void disabled() {
			rule.setEnabled(false);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.DISABLED, result.getResult(), 
				"The result is not DISABLED");
		}

		@Test
		@DisplayName("Unknown field rule")
		void unknownField() {
			rule.setField("doesNotExist");
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.INVALIDRULE, result.getResult(), 
				"The result is not INVALIDRULE");
		}

		@Test
		@DisplayName("Conforming rule with context, all blocks")
		void contextAllBlocks() {
			rule.setContext("^interface .*");
			rule.setText(" description ");
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Non-conforming rule with context, all blocks")
		void contextAllBlocksFail() {
			rule.setContext("^interface .*");
			rule.setText(" no shutdown");
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.NONCONFORMING, result.getResult(), 
				"The result is not NONCONFORMING");
		}

		@Test
		@DisplayName("Conforming rule with context, any block")
		void contextAnyBlock() {
			rule.setContext("^interface .*");
			rule.setText(" no shutdown");
			rule.setAnyBlock(true);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Non-conforming rule with context, any block")
		void contextAnyBlockFail() {
			rule.setContext("^interface .*");
			rule.setText(" no description");
			rule.setAnyBlock(true);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.NONCONFORMING, result.getResult(), 
				"The result is not NONCONFORMING");
		}

		@Test
		@DisplayName("Conforming rule with context, any block, match all")
		void contextAnyBlockMatchAll() {
			rule.setContext("^line .*");
			rule.setText(" password something");
			rule.setAnyBlock(true);
			rule.setMatchAll(true);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Multiline Regexp")
		void multilineRegexp() {
			rule.setText("(?m)^hostname router[0-9]+$");
			rule.setRegExp(true);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Regexp fail")
		void regexpFail() {
			rule.setText("^hostname router[0-9]+");
			rule.setRegExp(true);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.NONCONFORMING, result.getResult(), 
				"The result is not NONCONFORMING");
		}

		@Test
		@DisplayName("Invalid Regexp")
		void invalidRegexp() {
			rule.setText("^(h");
			rule.setRegExp(true);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.INVALIDRULE, result.getResult(), 
				"The result is not INVALIDRULE");
		}

		@Test
		@DisplayName("Without normalization")
		void withoutNormalization() {
			rule.setText("(?m)^ipv6 unicast-routing$");
			rule.setRegExp(true);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.NONCONFORMING, result.getResult(), 
				"The result is not NONCONFORMING");
		}

		@Test
		@DisplayName("With normalization")
		void withNormalization() {
			rule.setText("(?m)^ipv6 unicast-routing$");
			rule.setRegExp(true);
			rule.setNormalize(true);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}



	}
}
