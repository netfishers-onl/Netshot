package onl.netfishers.netshot;

import org.hibernate.Session;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import onl.netfishers.netshot.compliance.CheckResult;
import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.rules.JavaScriptRule;
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
	
	@Nested
	@DisplayName("JavaScript Rule")
	class JsRuleTest {
		
		Policy policy = new Policy("Fake policy", null);
		Device device = FakeDeviceFactory.getFakeCiscoIosDevice();
		FakeTaskLogger taskLogger = new FakeTaskLogger();
		Session fakeSession = new FakeSession();
		JavaScriptRule rule;

		JsRuleTest() {
			this.rule = new JavaScriptRule("Testing rule", policy);
			rule.setEnabled(true);
			rule.setScript(
				"function check(device) {" +
				"  const type = device.get('type');" +
				"  if (type !== 'Cisco IOS and IOS-XE') {" +
				"    return {" +
				"      result: NOTAPPLICABLE," +
				"      comment: 'Type is ' + type," +
				"     };" +
				"  }" +
				"  const name = device.get('name');" +
				"  if (name.match(/router1/)) {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
		}

		@Test
		@DisplayName("Conforming rule")
		void conformingRule() {
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Not applicable rule")
		void notApplicableRule() {
			device.setDriver("None");
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.NOTAPPLICABLE, result.getResult(), 
				"The result is not NOTAPPLICABLE");
		}

		@Test
		@DisplayName("Non conforming rule")
		void nonConformingRule() {
			device.setName("router2");
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.NONCONFORMING, result.getResult(), 
				"The result is not NONCONFORMING");
		}

		@Test
		@DisplayName("Name-based JS rule")
		void nameRule() {
			rule.setScript(
				"function check(device) {" +
				"  if (device.get('name') === 'router1') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Location-based JS rule")
		void locationRule() {
			rule.setScript(
				"function check(device) {" +
				"  if (device.get('location') === 'Test Location') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Contact-based JS rule")
		void contactRule() {
			rule.setScript(
				"function check(device) {" +
				"  if (device.get('contact') === 'Test Contact') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Family-based JS rule")
		void familyRule() {
			rule.setScript(
				"function check(device) {" +
				"  if (device.get('family') === 'Unknown IOS device') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Class-based JS rule")
		void classRule() {
			rule.setScript(
				"function check(device) {" +
				"  if (device.get('networkClass') === 'ROUTER') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Software version-based JS rule")
		void softwareVersionRule() {
			rule.setScript(
				"function check(device) {" +
				"  if (device.get('softwareVersion') === '16.1.6') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Serial-based JS rule")
		void serialRule() {
			rule.setScript(
				"function check(device) {" +
				"  if (device.get('serialNumber') === '16161616TEST16') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Comments-based JS rule")
		void commentRule() {
			rule.setScript(
				"function check(device) {" +
				"  if (device.get('comments').match(/testing/)) {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("VRF-based JS rule")
		void vrfRule() {
			rule.setScript(
				"function check(device) {" +
				"  const vrfs = device.get('vrfs');" +
				"  if (vrfs[0] === 'VRF1') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Module-based JS rule")
		void moduleRule() {
			rule.setScript(
				"function check(device) {" +
				"  const modules = device.get('modules');" +
				"  if (modules[1].serialNumber === '29038POSD203') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Interface-based JS rule")
		void interfaceRule() {
			rule.setScript(
				"function check(device) {" +
				"  const interfaces = device.get('interfaces');" +
				"  if (interfaces[1].name === 'GigabitEthernet0/1' && interfaces[1].ip[0].ip === '10.0.1.1') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Running config-based JS rule")
		void runningConfigRule() {
			rule.setScript(
				"function check(device) {" +
				"  const runningConfig = device.get('runningConfig');" +
				"  if (runningConfig.match(/^enable secret .+/m)) {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			CheckResult result = rule.getCheckResults().iterator().next();
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("JS rule with debug")
		void debugRule() {
			rule.setScript(
				"function check(device, debug) {" +
				"  debug('Debug message');" +
				"  return NONCONFORMING;" +
				"}"
			);
			rule.check(device, fakeSession, taskLogger);
			Assertions.assertTrue(taskLogger.getLog().contains("DEBUG - Debug message\n"),
				"Debug message is not correct");
		}




	}
	
}
