package onl.netfishers.netshot;

import java.lang.reflect.Field;

import org.hibernate.Session;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import onl.netfishers.netshot.compliance.CheckResult;
import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.rules.JavaScriptRule;
import onl.netfishers.netshot.compliance.rules.PythonRule;
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Non-conforming rule")
		void matchAllFail() {
			rule.setText("no service mlqksd");
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.NONCONFORMING, result.getResult(), 
				"The result is not NONCONFORMING");
		}

		@Test
		@DisplayName("Disabled rule")
		void disabled() {
			rule.setEnabled(false);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.DISABLED, result.getResult(), 
				"The result is not DISABLED");
		}

		@Test
		@DisplayName("Unknown field rule")
		void unknownField() {
			rule.setField("doesNotExist");
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.INVALIDRULE, result.getResult(), 
				"The result is not INVALIDRULE");
		}

		@Test
		@DisplayName("Conforming rule with context, all blocks")
		void contextAllBlocks() {
			rule.setContext("^interface .*");
			rule.setText(" description ");
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Non-conforming rule with context, all blocks")
		void contextAllBlocksFail() {
			rule.setContext("^interface .*");
			rule.setText(" no shutdown");
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.NONCONFORMING, result.getResult(), 
				"The result is not NONCONFORMING");
		}

		@Test
		@DisplayName("Conforming rule with context, any block")
		void contextAnyBlock() {
			rule.setContext("^interface .*");
			rule.setText(" no shutdown");
			rule.setAnyBlock(true);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Non-conforming rule with context, any block")
		void contextAnyBlockFail() {
			rule.setContext("^interface .*");
			rule.setText(" no description");
			rule.setAnyBlock(true);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Multiline Regexp")
		void multilineRegexp() {
			rule.setText("(?m)^hostname router[0-9]+$");
			rule.setRegExp(true);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Regexp fail")
		void regexpFail() {
			rule.setText("^hostname router[0-9]+");
			rule.setRegExp(true);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.NONCONFORMING, result.getResult(), 
				"The result is not NONCONFORMING");
		}

		@Test
		@DisplayName("Invalid Regexp")
		void invalidRegexp() {
			rule.setText("^(h");
			rule.setRegExp(true);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.INVALIDRULE, result.getResult(), 
				"The result is not INVALIDRULE");
		}

		@Test
		@DisplayName("Without normalization")
		void withoutNormalization() {
			rule.setText("(?m)^ipv6 unicast-routing$");
			rule.setRegExp(true);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.NONCONFORMING, result.getResult(), 
				"The result is not NONCONFORMING");
		}

		@Test
		@DisplayName("With normalization")
		void withNormalization() {
			rule.setText("(?m)^ipv6 unicast-routing$");
			rule.setRegExp(true);
			rule.setNormalize(true);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Not applicable rule")
		void notApplicableRule() {
			device.setDriver("None");
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.NOTAPPLICABLE, result.getResult(), 
				"The result is not NOTAPPLICABLE");
		}

		@Test
		@DisplayName("Non conforming rule")
		void nonConformingRule() {
			device.setName("router2");
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Domain-based JS rule")
		void domainRule() {
			rule.setScript(
				"function check(device) {" +
				"  if (device.get('managementDomain') === 'Test domain') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Management IP-based JS rule")
		void managementIpRule() {
			rule.setScript(
				"function check(device) {" +
				"  if (device.get('managementIpAddress').startsWith('172.16.')) {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("VRF-based JS rule")
		void vrfRule() {
			rule.setScript(
				"function check(device) {" +
				"  const vrfs = device.get('vrfs');" +
				"  if (vrfs.includes('VRF1')) {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Diagnostic result-based JS rule")
		void diagnosticResultRule() {
			rule.setScript(
				"function check(device) {" +
				"  const reloadReason = device.get('Reload reason');" +
				"  if (reloadReason === 'Reload Command') {" +
				"    return CONFORMING;" +
				"  }" +
				"  return NONCONFORMING;" +
				"}"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
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

		@Test
		@DisplayName("JS rule with direct DNS resolution")
		void directNsRule() {
			rule.setScript(
				"function check(device) {" +
				"  const record = device.nslookup('dns.google');" +
				"  return { result: CONFORMING, comment: record.address };" +
				"}"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			String comment = result.getComment();
			Assertions.assertTrue("8.8.8.8".equals(comment) || "8.8.4.4".equals(comment),
				"The resolved IP is not 8.8.8.8 nor 8.8.4.4");
		}

		@Test
		@DisplayName("JS rule with reverse DNS resolution")
		void reverseNsRule() {
			rule.setScript(
				"function check(device) {" +
				"  const record = device.nslookup('8.8.8.8');" +
				"  return { result: CONFORMING, comment: record.name };" +
				"}"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(result.getComment(), "dns.google",
				"The resolved name is not dns.google");
		}
		
		@Test
		@DisplayName("Endless JS rule")
		void endlessRule() throws NoSuchFieldException, SecurityException, IllegalArgumentException, IllegalAccessException {
			rule.setScript(
				"function check(device) {" +
				" while (true) {}" +
				" return CONFORMING;" +
				"}"
			);
			// Use reflection to set the max execution time
			Field maxTimeField = JavaScriptRule.class.getDeclaredField("MAX_EXECUTION_TIME");
			maxTimeField.setAccessible(true);
			maxTimeField.setLong(null, 5000);
			// Check
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.INVALIDRULE, result.getResult(), 
				"The result is not INVALIDRULE");
			Assertions.assertTrue(taskLogger.getLog().contains("rule took too long"),
				"Error message is not correct");
		}
	}
	
	@Nested
	@DisplayName("Python Rule")
	class PyRuleTest {
		
		Policy policy = new Policy("Fake policy", null);
		Device device = FakeDeviceFactory.getFakeCiscoIosDevice();
		FakeTaskLogger taskLogger = new FakeTaskLogger();
		Session fakeSession = new FakeSession();
		PythonRule rule;

		PyRuleTest() {
			this.rule = new PythonRule("Testing rule", policy);
			rule.setEnabled(true);
			rule.setScript(
				"import re" + "\n" +
				"" + "\n" +
				"def check(device):" + "\n" +
				"  type = device.get('type')" + "\n" +
				"  if type != 'Cisco IOS and IOS-XE':" + "\n" +
				"    return {" + "\n" +
				"      'result': result_option.NOTAPPLICABLE," + "\n" +
				"      'comment': 'Type is {}'.format(type)"+ "\n" +
				"    }" + "\n" +
				"  name = device.get('name')" + "\n" +
				"  if re.search(r'router1', name):" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"\n"
			);
		}

		@Test
		@DisplayName("Conforming rule")
		void conformingRule() {
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Not applicable rule")
		void notApplicableRule() {
			device.setDriver("None");
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.NOTAPPLICABLE, result.getResult(), 
				"The result is not NOTAPPLICABLE");
		}

		@Test
		@DisplayName("Non conforming rule")
		void nonConformingRule() {
			device.setName("router2");
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.NONCONFORMING, result.getResult(), 
				"The result is not NONCONFORMING");
		}

		@Test
		@DisplayName("Name-based Python rule")
		void nameRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  if device.get('name') == 'router1':" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Location-based Python rule")
		void locationRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  if device.get('location') == 'Test Location':" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Contact-based Python rule")
		void contactRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  if device.get('contact') == 'Test Contact':" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Family-based Python rule")
		void familyRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  if device.get('family') == 'Unknown IOS device':" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Domain-based Python rule")
		void domainRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  if device.get('management_domain') == 'Test domain':" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Management IP-based Python rule")
		void managementIpRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  if device.get('management_ip_address').startswith('172.16.'):" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Class-based Python rule")
		void classRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  if device.get('network_class') == 'ROUTER':" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Software version-based Python rule")
		void softwareVersionRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  if device.get('software_version') == '16.1.6':" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Serial-based Python rule")
		void serialRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  if device.get('serial_number') == '16161616TEST16':" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Comments-based Python rule")
		void commentRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  if 'testing' in device.get('comments'):" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("VRF-based Python rule")
		void vrfRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  vrfs = device.get('vrfs')" + "\n" +
				"  if 'VRF1' in vrfs:" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Module-based Python rule")
		void moduleRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  modules = device.get('modules')" + "\n" +
				"  if modules[1]['serial_number'] == '29038POSD203':" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Interface-based Python rule")
		void interfaceRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  interfaces = device.get('interfaces')" + "\n" +
				"  if interfaces[1]['name'] == 'GigabitEthernet0/1' and interfaces[1]['ip'][0]['ip'] == '10.0.1.1':" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Running config-based Python rule")
		void runningConfigRule() {
			rule.setScript(
				"import re" + "\n" +
				"def check(device):" + "\n" +
				"  running_config = device.get('running_config')" + "\n" +
				"  if re.search(r'^enable secret .+', running_config, re.MULTILINE):" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Diagnostic result-based Python rule")
		void diagnosticResultRule() {
			rule.setScript(
				"import re" + "\n" +
				"def check(device):" + "\n" +
				"  reload_reason = device.get('Reload reason')" + "\n" +
				"  if reload_reason == 'Reload Command':" + "\n" +
				"    return result_option.CONFORMING" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.CONFORMING, result.getResult(), 
				"The result is not CONFORMING");
		}

		@Test
		@DisplayName("Python rule with debug")
		void debugRule() {
			rule.setScript(
				"import re" + "\n" +
				"def check(device):" + "\n" +
				"  debug('Debug message')" + "\n" +
				"  return result_option.NONCONFORMING" + "\n" +
				"" + "\n"
			);
			rule.check(device, fakeSession, taskLogger);
			Assertions.assertTrue(taskLogger.getLog().contains("DEBUG - Debug message\n"),
				"Debug message is not correct");
		}

		@Test
		@DisplayName("Python rule with direct DNS resolution")
		void directNsRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  record = device.nslookup('dns.google')" + "\n" +
				"  return {" + "\n" +
				"    'result': result_option.CONFORMING," + "\n" +
				"    'comment': record['address']"+ "\n" +
				"  }" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			String comment = result.getComment();
			Assertions.assertTrue("8.8.8.8".equals(comment) || "8.8.4.4".equals(comment),
				"The resolved IP is not 8.8.8.8 nor 8.8.4.4");
		}

		@Test
		@DisplayName("Python rule with reverse DNS resolution")
		void reverseNsRule() {
			rule.setScript(
				"def check(device):" + "\n" +
				"  record = device.nslookup('8.8.8.8')" + "\n" +
				"  return {" + "\n" +
				"    'result': result_option.CONFORMING," + "\n" +
				"    'comment': record['name']"+ "\n" +
				"  }" + "\n"
			);
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(result.getComment(), "dns.google",
				"The resolved name is not dns.google");
		}
		
		@Test
		@DisplayName("Endless Python rule")
		void endlessRule() throws NoSuchFieldException, SecurityException, IllegalArgumentException, IllegalAccessException {
			rule.setScript(
				"def check(device):" + "\n" +
				"  while True:" + "\n" +
				"    pass" + "\n" +
				"  return result_option.CONFORMING" + "\n" +
				"" + "\n"
			);
			// Use reflection to set the max execution time
			Field maxTimeField = PythonRule.class.getDeclaredField("MAX_EXECUTION_TIME");
			maxTimeField.setAccessible(true);
			maxTimeField.setLong(null, 5000);
			// Check
			CheckResult result = rule.check(device, fakeSession, taskLogger);
			Assertions.assertEquals(CheckResult.ResultOption.INVALIDRULE, result.getResult(), 
				"The result is not INVALIDRULE");
			Assertions.assertTrue(taskLogger.getLog().contains("rule took too long"),
				"Error message is not correct");
		}
	}
}
