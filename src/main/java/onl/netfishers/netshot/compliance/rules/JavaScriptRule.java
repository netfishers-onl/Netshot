/**
 * Copyright 2013-2021 Sylvain Cadilhac (NetFishers)
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
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.compliance.CheckResult;
import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.Rule;
import onl.netfishers.netshot.compliance.CheckResult.ResultOption;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.script.helper.JsDeviceHelper;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.TaskLogger;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Engine;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.Value;
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
	final private static Logger logger = LoggerFactory.getLogger(JavaScriptRule.class);

	/** The allowed results. */
	private static CheckResult.ResultOption[] ALLOWED_RESULTS = new CheckResult.ResultOption[] {
		CheckResult.ResultOption.CONFORMING,
		CheckResult.ResultOption.NONCONFORMING,
		CheckResult.ResultOption.NOTAPPLICABLE,
	};
	
	private static Source JSLOADER_SOURCE;
	
	static {
		try {
			logger.info("Reading the JavaScript rule loader code from the resource JS file.");
			// Read the JavaScript loader code from the resource file.
			String path = "interfaces/rule-loader.js";
			InputStream in = DeviceDriver.class.getResourceAsStream("/" + path);
			BufferedReader reader = new BufferedReader(new InputStreamReader(in));
			StringBuffer buffer = new StringBuffer();
			String line;
			while ((line = reader.readLine()) != null) {
				buffer.append(line);
				buffer.append("\n");
			}
			JSLOADER_SOURCE = Source.create("js", buffer.toString());
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

	/** The JS execution engine (for eval caching) */
	private Engine engine;

	/** The prepared. */
	private boolean prepared = false;

	/** The js valid. */
	private boolean jsValid = false;

	/** The script. */
	private String script = "" +
			"/*\n" +
			" * Script template - to be customized.\n" +
			" */\n" +
			"function check(device) {\n" +
			"    //var config = device.get('runningConfig');\n" +
			"    //var name = device.get('name');\n" +
			"    return CONFORMING;\n" +
			"    //return NONCONFORMING;\n" +
			"    //return NOTAPPLICABLE;\n" +
			"}\n";

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
	@XmlElement @JsonView(DefaultView.class)
	@Column(length = 10000000)
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

	@Transient
	public Context getContext() {
		Context context = Context.newBuilder().engine(this.engine).build();
		context.eval("js", this.script);
		context.eval(JSLOADER_SOURCE);
		return context;
	}

	/**
	 * Prepare.
	 */
	private void prepare(TaskLogger taskLogger) {
		if (prepared) {
			return;
		}
		prepared = true;
		this.engine = Engine.create();
		jsValid = false;
		
		try {
			Context context = getContext();
			Value checkFunction = context.getBindings("js").getMember("check");
			if (checkFunction == null || !checkFunction.canExecute()) {
				logger.warn("The check function wasn't found in the script");
				taskLogger.error("The 'check' function couldn't be found in the script.");
			}
			else {
				jsValid = true;
			}
		}
		catch (PolyglotException e) {
			taskLogger.error("Error while evaluating the Javascript script.");
			logger.warn("Error while evaluating the Javascript script.", e);
			jsValid = false;
		}
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.compliance.Rule#check(onl.netfishers.netshot.device.Device, org.hibernate.Session)
	 */
	@Override
	public void check(Device device, Session session, TaskLogger taskLogger) {
		if (!this.isEnabled()) {
			this.setCheckResult(device, ResultOption.DISABLED, "", session);
			return;
		}
		prepare(taskLogger);
		if (!this.jsValid) {
			this.setCheckResult(device, ResultOption.INVALIDRULE, "", session);
			return;
		}
		if (device.isExempted(this)) {
			this.setCheckResult(device, ResultOption.EXEMPTED, "", session);
			return;
		}

		try {
			JsDeviceHelper deviceHelper = new JsDeviceHelper(device, session, taskLogger, true);
			Context context = this.getContext();
			Value result = context.getBindings("js").getMember("_check").execute(deviceHelper);
			String txtResult = null;
			String comment = "";
			if (result.isString()) {
				txtResult = result.asString();
			}
			else if (result.hasMembers()) {
				Value jsComment = result.getMember("comment");
				if (jsComment != null && jsComment.isString()) {
					comment = jsComment.asString();
				}
				Value jsResult = result.getMember("result");
				if (jsResult != null && jsResult.isString()) {
					txtResult = jsResult.asString();
				}
			}
			for (CheckResult.ResultOption allowedResult : ALLOWED_RESULTS) {
				if (allowedResult.toString().equals(txtResult)) {
					taskLogger.info(String.format("The script returned %s (%d), comment '%s'.",
							allowedResult.toString(), allowedResult.getValue(), comment));
					this.setCheckResult(device, allowedResult, comment, session);
					return;
				}
			}
		}
		catch (Exception e) {
			taskLogger.error("Error while running the script: " + e.getMessage());
			logger.error("Error while running the script on device {}.", device.getId(), e);
		}
		finally {
			taskLogger.debug("End of check");
		}
		this.setCheckResult(device, ResultOption.INVALIDRULE, "", session);
	}

	@Override
	public String toString() {
		return "Compliance JavaScript-based rule " + id + " (name '" + name + "')";
	}

}
