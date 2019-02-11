package onl.netfishers.netshot.device.script;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.script.Invocable;
import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptException;
import javax.script.SimpleScriptContext;

import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.Device.InvalidCredentialsException;
import onl.netfishers.netshot.device.Device.MissingDeviceDriverException;
import onl.netfishers.netshot.device.DeviceDriver.DriverProtocol;
import onl.netfishers.netshot.device.access.Cli;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.device.script.helper.JsCliHelper;
import onl.netfishers.netshot.device.script.helper.JsCliScriptOptions;
import onl.netfishers.netshot.device.script.helper.JsDeviceHelper;
import onl.netfishers.netshot.device.script.helper.JsDiagnosticHelper;
import onl.netfishers.netshot.diagnostic.Diagnostic;
import onl.netfishers.netshot.diagnostic.JsDiagnostic;
import onl.netfishers.netshot.work.TaskLogger;

public class RunDiagnosticCliScript extends CliScript {
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(RunDiagnosticCliScript.class);
	
	/** The diagnostics to execute. */
	private List<Diagnostic> diagnostics;

	
	/**
	 * Instantiates a JS-based script.
	 * @param code The JS code
	 */
	public RunDiagnosticCliScript(List<Diagnostic> diagnostics, boolean cliLogging) {
		super(cliLogging);
		this.diagnostics = diagnostics;
	}

	@Override
	protected void run(Session session, Device device, Cli cli, DriverProtocol protocol, DeviceCliAccount cliAccount)
			throws InvalidCredentialsException, IOException, ScriptException, MissingDeviceDriverException {

		JsCliHelper jsCliHelper = new JsCliHelper(cli, cliAccount, this.getJsLogger(), this.getCliLogger());
		TaskLogger taskLogger = this.getJsLogger();
		DeviceDriver driver = device.getDeviceDriver();
		List<Diagnostic> simpleDiagnostics = new ArrayList<Diagnostic>();
		// Filter on the device driver
		try {
			ScriptEngine engine = driver.getEngine();
			ScriptContext scriptContext = new SimpleScriptContext();
			scriptContext.setBindings(engine.getContext().getBindings(ScriptContext.ENGINE_SCOPE),
					ScriptContext.ENGINE_SCOPE);
			JsCliScriptOptions options = new JsCliScriptOptions(jsCliHelper);
			options.setDevice(new JsDeviceHelper(device, taskLogger));

			for (Diagnostic diagnostic : this.diagnostics) {
				if (diagnostic instanceof JsDiagnostic) {
					try {
						engine.eval(((JsDiagnostic) diagnostic).getScript(), scriptContext);
						Object d = scriptContext.getBindings(ScriptContext.ENGINE_SCOPE).get("diagnose");
					}
					catch (Exception e1) {

					}
				}
			}

			options.setDiagnostic(new JsDiagnosticHelper(device, diagnostics, taskLogger));
			((Invocable) engine).invokeFunction("_connect", "diagnostics", protocol.value(), options, taskLogger);
		}
		catch (ScriptException e) {
			logger.error("Error while running script using driver {}.", driver.getName(), e);
			taskLogger.error(String.format("Error while running script  using driver %s: '%s'.",
					driver.getName(), e.getMessage()));
			if (e.getMessage().contains("Authentication failed")) {
				throw new InvalidCredentialsException("Authentication failed");
			}
			else {
				throw e;
			}
		}
		catch (NoSuchMethodException e) {
			logger.error("No such method while using driver {}.", driver.getName(), e);
			taskLogger.error(String.format("No such method while using driver %s to execute script: '%s'.",
					driver.getName(), e.getMessage()));
			throw new ScriptException(e);
		}
	}

}
