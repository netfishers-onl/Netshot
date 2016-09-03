/**
 * Copyright 2013-2016 Sylvain Cadilhac (NetFishers)
 * 
 * This file is part of Netshot.
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
package onl.netfishers.netshot.compliance.rules;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

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
import onl.netfishers.netshot.device.DeviceDriver;

import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MarkerFactory;

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
			+ "    //var config = device.get('runningConfig');\n"
			+ "    //var name = device.get('name');\n" + "    return CONFORMING;\n"
			+ "    //return NONCONFORMING;\n" + "    //return NOTAPPLICABLE;\n"
			+ "}\n";
	
	private static String JSLOADER;
	
	static {
		try {
			logger.info("Reading the JavaScript rule loader code from the resource JS file.");
			// Read the JavaScript loader code from the resource file.
			String path = "interfaces/rule-loader.js";
			InputStream in = DeviceDriver.class.getResourceAsStream("/" + path);
			BufferedReader reader = new BufferedReader(new InputStreamReader(in));
			StringBuffer buffer = new StringBuffer();
			String line = null;
			while ((line = reader.readLine()) != null) {
				buffer.append(line + "\n");
			}
			JSLOADER = buffer.toString();
			reader.close();
			in.close();
			logger.debug("The JavaScript rule loader code has been read from the resource JS file.");
		}
		catch (Exception e) {
			logger.error(MarkerFactory.getMarker("FATAL"),
					"Unable to read the Javascript rule loader.", e);
			System.err.println("NETSHOT FATAL ERROR");
			e.printStackTrace();
			System.exit(1);
		}
	}
	
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
