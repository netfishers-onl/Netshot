/**
 * Copyright 2013-2024 Netshot
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
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import onl.netfishers.netshot.Netshot;
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
import org.slf4j.MarkerFactory;

/**
 * A JavaScriptRule is a Javascript-coded script that will check the device
 * attributes, including config, and return whether the device is compliant
 * or not.
 */
@Entity
@Slf4j
public class JavaScriptRule extends Rule {

	/** The allowed results. */
	private static CheckResult.ResultOption[] ALLOWED_RESULTS = new CheckResult.ResultOption[] {
		CheckResult.ResultOption.CONFORMING,
		CheckResult.ResultOption.NONCONFORMING,
		CheckResult.ResultOption.NOTAPPLICABLE,
	};
	
	/** Rule loader JavaScript source */
	private static Source JSLOADER_SOURCE;

	/** Max time (ms) to wait for script to execute */
	private static long MAX_EXECUTION_TIME;

	/** The Python execution engine (for eval caching) */
	private static Engine engine = Engine.create();

	/**
	 * Initialize some additional static variables from global configuration.
	 */
	public static void loadConfig() {
		long maxExecutionTime = 60000;
		try {
			maxExecutionTime = Long.parseLong(Netshot.getConfig("netshot.javascript.maxexecutiontime",
					Long.toString(maxExecutionTime)));
		}
		catch (IllegalArgumentException e) {
			log.error(
				"Invalid value for JavaScript max execution time (netshot.javascript.maxexecutiontime), using {}ms.",
				maxExecutionTime);
		}
		JavaScriptRule.MAX_EXECUTION_TIME = maxExecutionTime;
	}
	
	static {
		try {
			log.info("Reading the JavaScript rule loader code from the resource JS file.");
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
			log.debug("The JavaScript rule loader code has been read from the resource JS file.");
		}
		catch (Exception e) {
			log.error(MarkerFactory.getMarker("FATAL"),
					"Unable to read the Javascript rule loader.", e);
			System.err.println("NETSHOT FATAL ERROR");
			e.printStackTrace();
			System.exit(1);
		}
		JavaScriptRule.loadConfig();
	}

	/** The prepared. */
	private boolean prepared = false;

	/** The js valid. */
	private boolean jsValid = false;

	/** The script. */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class),
		@Column(length = 10000000)
	}))
	@Setter
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
	 * Instantiates a new JavaScript rule.
	 */
	protected JavaScriptRule() {

	}

	/**
	 * Instantiates a new JavaScript rule.
	 *
	 * @param name the name
	 * @param policy the policy
	 */
	public JavaScriptRule(String name, Policy policy) {
		super(name, policy);
	}

	/**
	 * Prepare the polyglot source.
	 * @return the source
	 */
	@Transient
	protected Source getSource() {
		return Source
			.newBuilder("js", this.script, "JsRule" + this.getId())
			.cached(false).buildLiteral();
	}

	@Transient
	public Context getContext() throws IOException {
		Context.Builder builder = Context
			.newBuilder("js");
		builder.allowExperimentalOptions(true)
			.option("js.console", "false")
			.option("js.load", "false")
			.option("js.polyglot-builtin", "false");
		Context context;
		synchronized (engine) {
			context = builder.engine(engine).build();
		}
		return context;
	}

	/**
	 * Prepare.
	 */
	private void prepare(Context context, TaskLogger taskLogger) {
		if (prepared) {
			return;
		}
		prepared = true;
		jsValid = false;
		
		try {
			Value checkFunction = context.getBindings("js").getMember("check");
			if (checkFunction == null || !checkFunction.canExecute()) {
				log.warn("The check function wasn't found in the script");
				taskLogger.error("The 'check' function couldn't be found in the script.");
			}
			else {
				jsValid = true;
			}
		}
		catch (PolyglotException e) {
			taskLogger.error("Error while evaluating the Javascript script.");
			log.warn("Error while evaluating the Javascript script.", e);
			jsValid = false;
		}
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.compliance.Rule#check(onl.netfishers.netshot.device.Device, org.hibernate.Session)
	 */
	@Override
	public CheckResult check(Device device, Session session, TaskLogger taskLogger) {
		if (!this.isEnabled()) {
			return new CheckResult(this, device, ResultOption.DISABLED);
		}

		try (Context context = this.getContext()) {
			context.eval(this.getSource());
			context.eval(JSLOADER_SOURCE);
			prepare(context, taskLogger);
			if (!this.jsValid) {
				return new CheckResult(this, device, ResultOption.INVALIDRULE);
			}
			if (device.isExempted(this)) {
				return new CheckResult(this, device, ResultOption.EXEMPTED);
			}
			JsDeviceHelper deviceHelper = new JsDeviceHelper(device, null, session, taskLogger, true);
			Future<Value> futureResult = Executors.newSingleThreadExecutor().submit(new Callable<Value>() {
				@Override
				public Value call() throws Exception {
					return context.getBindings("js").getMember("_check").execute(deviceHelper);
				}
			});
			Value result;
			try {
				result = futureResult.get(JavaScriptRule.MAX_EXECUTION_TIME, TimeUnit.MILLISECONDS);
			}
			catch (TimeoutException e1) {
				try {
					context.close(true);
				}
				catch (Exception e2) {
					log.warn("Error while closing abnormally long JavaScript context", e2);
				}
				throw new TimeoutException(
					"The rule took too long to execute (check for endless loop in the script or adjust netshot.javascript.maxexecutiontime value)");
			}
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
					return new CheckResult(this, device, allowedResult, comment);
				}
			}
		}
		catch (Exception e) {
			taskLogger.error("Error while running the script: " + e.getMessage());
			log.error("Error while running the script on device {}.", device.getId(), e);
		}
		finally {
			taskLogger.debug("End of check");
		}
		return new CheckResult(this, device, ResultOption.INVALIDRULE);
	}

	@Override
	public String toString() {
		return "Compliance JavaScript-based rule " + id + " (name '" + name + "')";
	}

}
