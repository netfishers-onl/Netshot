/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.compliance.rules;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.script.Bindings;
import javax.script.Invocable;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.compliance.CheckResult;
import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.Rule;
import onl.netfishers.netshot.compliance.CheckResult.ResultOption;
import onl.netfishers.netshot.device.Device;

import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A JavaScriptRule is a Javascript-coded script that will check the device
 * attributes, including config, and return whether the device is compliant
 * or not.
 */
@Entity
public class JavaScriptRule extends Rule {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(JavaScriptRule.class);

	/** The script. */
	private String script = "/*\n" + " * Script template - to be customized.\n"
			+ " */\n" + "function check(device) {\n"
			+ "    //var config = device.get('running-config');\n"
			+ "    //var name = device.get('name');\n" + "    return CONFORMING;\n"
			+ "    //return NONCONFORMING;\n" + "    //return NOTAPPLICABLE;\n"
			+ "}\n";
	
	private static final String JSLOADER = "var NONCONFORMING = \"NONCONFORMING\";\r\nvar NOTAPPLICABLE = \"NOTAPPLICABLE\";\r\nvar CONFORMING = \"CONFORMING\";\r\n\r\nfunction _check(provider) {\r\n\r\n\tvar debug = function(message) {\r\n\t\tif (typeof(message) == \"string\") {\r\n\t\t\tmessage = String(message);\r\n\t\t\tprovider.debug(message);\r\n\t\t}\r\n\t};\r\n\r\n\tvar _toNative = function(o) {\r\n\t\tif (o == null || typeof(o) == \"undefined\") {\r\n\t\t\treturn null;\r\n\t\t}\r\n\t\tif (typeof(o) == \"object\" && (o instanceof Array || o.class.toString().match(/^class \\[/))) {\r\n\t\t\tvar l = [];\r\n\t\t\tfor (var i in o) {\r\n\t\t\t\tl.push(_toNative(o[i]));\r\n\t\t\t}\r\n\t\t\treturn l;\r\n\t\t}\r\n\t\tif (typeof(o) == \"object\") {\r\n\t\t\tvar m = {};\r\n\t\t\tfor (var i in o) {\r\n\t\t\t\tm[i] = _toNative(o[i]);\r\n\t\t\t}\r\n\t\t\treturn m;\r\n\t\t}\r\n\t\treturn o;\r\n\t};\r\n\r\n\tvar device = {\r\n\t\r\n\t\tget: function(key, id) {\r\n\t\t\tif (typeof(key) == \"string\") {\r\n\t\t\t\tkey = String(key);\r\n\t\t\t\tif (typeof(id) == \"undefined\") {\r\n\t\t\t\t\treturn _toNative(provider.get(key));\r\n\t\t\t\t}\r\n\t\t\t\telse if (typeof(id) == \"number\" && !isNaN(id)) {\r\n\t\t\t\t\treturn _toNative(provider.get(key, id));\r\n\t\t\t\t}\r\n\t\t\t\telse if (typeof(id) == \"string\") {\r\n\t\t\t\t\tvar name = String(id);\r\n\t\t\t\t\treturn _toNative(provider.get(key, name));\r\n\t\t\t\t}\r\n\t\t\t\telse {\r\n\t\t\t\t\tthrow \"Invalid device id to retrieve data from.\";\r\n\t\t\t\t}\r\n\t\t\t}\r\n\t\t\tthrow \"Invalid key to retrieve.\";\r\n\t\t},\r\n\r\n\t\tnslookup: function(host) {\r\n\t\t\tif (typeof(host) == \"string\") {\r\n\t\t\t\treturn _toNative(provider.nslookup(String(host)));\r\n\t\t\t}\r\n\t\t\tthrow \"Invalid host to resolve.\";\r\n\t\t},\r\n\t\t\r\n\t\tfindSections: function(text, regex) {\r\n\t\t\tvar lines = text.split(/[\\r\\n]+/g);\r\n\t\t\tif (typeof(text) != \"string\") {\r\n\t\t\t\tthrow \"Invalid text string in findSections.\";\r\n\t\t\t}\r\n\t\t\tif (typeof(regex) != \"object\" || !(regex instanceof RegExp)) {\r\n\t\t\t\tthrow \"Invalid regex parameter in findSections.\";\r\n\t\t\t}\r\n\t\t\tvar sections = [];\r\n\t\t\tvar section;\r\n\t\t\tvar indent = -1;\r\n\t\t\tfor (var l in lines) {\r\n\t\t\t\tvar line = lines[l];\r\n\t\t\t\tvar i = line.search(/[^\\t\\s]/);\r\n\t\t\t\tif (i > indent) {\r\n\t\t\t\t\tif (indent > -1) {\r\n\t\t\t\t\t\tsection.lines.push(line);\r\n\t\t\t\t\t}\r\n\t\t\t\t}\r\n\t\t\t\telse {\r\n\t\t\t\t\tindent = -1;\r\n\t\t\t\t}\r\n\t\t\t\tif (indent == -1) {\r\n\t\t\t\t\tvar match = regex.exec(line);\r\n\t\t\t\t\tif (match) {\r\n\t\t\t\t\t\tindent = i;\r\n\t\t\t\t\t\tsection = {\r\n\t\t\t\t\t\t\tmatch: match,\r\n\t\t\t\t\t\t\tlines: []\r\n\t\t\t\t\t\t};\r\n\t\t\t\t\t\tsections.push(section);\r\n\t\t\t\t\t}\r\n\t\t\t\t}\r\n\t\t\t}\r\n\t\t\tfor (var s in sections) {\r\n\t\t\t\tsections[s].config = sections[s].lines.join(\"\\n\");\r\n\t\t\t}\r\n\t\t\treturn sections;\r\n\t\t}\r\n\r\n\t};\r\n\r\n\r\n\tvar r = check(device, debug);\r\n\r\n\tif (typeof(r) == \"string\") {\r\n\t\tr = String(r);\r\n\t\treturn {\r\n\t\t\tresult: r,\r\n\t\t\tcomment: \"\"\r\n\t\t};\r\n\t}\r\n\treturn r;\r\n\r\n}";
	
	private ScriptEngine engine;

	/**
	 * Instantiates a new java script rule.
	 */
	protected JavaScriptRule() {

	}

	/**
	 * Instantiates a new java script rule.
	 *
	 * @param name the name
	 * @param policy the policy
	 */
	public JavaScriptRule(String name, Policy policy) {
		super(name, policy);
	}

	/**
	 * Gets the script.
	 *
	 * @return the script
	 */
	@XmlElement
	@Column(length = 100000000)
	public String getScript() {
		return script;
	}

	/**
	 * Sets the script.
	 *
	 * @param script the new script
	 */
	public void setScript(String script) {
		this.script = script;
	}


	/** The allowed results. */
	private static CheckResult.ResultOption[] ALLOWED_RESULTS = new CheckResult.ResultOption[] {
		CheckResult.ResultOption.CONFORMING, CheckResult.ResultOption.NONCONFORMING,
		CheckResult.ResultOption.NOTAPPLICABLE };

	/** The prepared. */
	private boolean prepared = false;

	/** The js valid. */
	private boolean jsValid = false;

	/**
	 * Prepare.
	 */
	private void prepare() {
		if (prepared) {
			return;
		}
		prepared = true;
		
		try {
			engine = new ScriptEngineManager().getEngineByName("nashorn");
			engine.eval("delete load, com, edu, java, javafx, javax, org, JavaImporter, Java, loadWithNewGlobal;");
			engine.eval(script);
			engine.eval(JSLOADER);

			try {
				((Invocable) engine).invokeFunction("check");
				jsValid = true;
			}
			catch (NoSuchMethodException e) {
				logger.warn("The check function wasn't found in the script");
				logIt("The 'check' function couldn't be found in the script.", 2);
			}
			catch (Exception e) {
				jsValid = true;
			}
		}
		catch (ScriptException e) {
			this.logIt("Error while evaluating the Javascript script.", 2);
			logger.warn("Error while evaluating the Javascript script.", e);
			jsValid = false;
		}
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.compliance.Rule#check(onl.netfishers.netshot.device.Device, org.hibernate.Session)
	 */
	@Override
	public void check(Device device, Session session) {
		if (!this.isEnabled()) {
			this.setCheckResult(device, ResultOption.DISABLED, "", session);
			return;
		}
		prepare();
		if (!this.jsValid) {
			this.setCheckResult(device, ResultOption.INVALIDRULE, "", session);
			return;
		}
		if (device.isExempted(this)) {
			this.setCheckResult(device, ResultOption.EXEMPTED, "", session);
			return;
		}

		try {
			RuleDataProvider dataProvider = this.new RuleDataProvider(session, device);
			Object result = ((Invocable) engine).invokeFunction("_check", dataProvider);
			if (result != null && result instanceof Bindings) {
				String comment = "";
				Object jsComment = ((Bindings) result).get("comment");
				if (jsComment != null && jsComment instanceof String) {
					comment = (String) jsComment;
				}
				Object jsResult = ((Bindings) result).get("result");
				for (CheckResult.ResultOption allowedResult : ALLOWED_RESULTS) {
					if (allowedResult.toString().equals(jsResult)) {
						logIt(String.format("The script returned %s (%d), comment '%s'.",
								allowedResult.toString(), allowedResult.getValue(), comment), 2);
						this.setCheckResult(device, allowedResult, comment, session);
						return;
					}
				}
				
			}
		}
		catch (Exception e) {
			logIt("Error while running the script: " + e.getMessage(), 2);
			logger.error("Error while running the script on device {}.", device.getId(), e);
		}
		this.setCheckResult(device, ResultOption.INVALIDRULE, "", session);
	}

}
