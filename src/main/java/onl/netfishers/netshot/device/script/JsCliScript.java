package onl.netfishers.netshot.device.script;

import java.io.IOException;

import javax.script.Invocable;
import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptException;
import javax.script.SimpleScriptContext;

import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.Device.InvalidCredentialsException;
import onl.netfishers.netshot.device.Device.MissingDeviceDriverException;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.DeviceDriver.DriverProtocol;
import onl.netfishers.netshot.device.access.Cli;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.device.script.helper.JsCliHelper;
import onl.netfishers.netshot.device.script.helper.JsCliScriptOptions;
import onl.netfishers.netshot.device.script.helper.JsDeviceHelper;
import onl.netfishers.netshot.work.TaskLogger;

/**
 * A JavaScript-based script to execute on a device.
 * @author sylvain.cadilhac
 *
 */
public class JsCliScript extends CliScript {
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(JsCliScript.class);

	// The JavaScript code to execute
	private String code;
	
	/**
	 * Instantiates a JS-based script.
	 * @param code The JS code
	 */
	public JsCliScript(String code, boolean cliLogging) {
		super(cliLogging);
		this.code = code;
	}
	
	/**
	 * Gets the JS code.
	 * @return the JS code
	 */
	public String getCode() {
		return code;
	}

	@Override
	protected void run(Session session, Device device, Cli cli, DriverProtocol protocol, DeviceCliAccount cliAccount)
			throws InvalidCredentialsException, IOException, ScriptException, MissingDeviceDriverException {
		JsCliHelper jsCliHelper = new JsCliHelper(cli, cliAccount, this.getJsLogger(), this.getCliLogger());
		TaskLogger taskLogger = this.getJsLogger();
		DeviceDriver driver = device.getDeviceDriver();
		try {
			ScriptEngine engine = driver.getEngine();
			ScriptContext scriptContext = new SimpleScriptContext();
			scriptContext.setBindings(engine.getContext().getBindings(ScriptContext.ENGINE_SCOPE),
					ScriptContext.ENGINE_SCOPE);
			engine.eval(code, scriptContext);
			JsCliScriptOptions options = new JsCliScriptOptions(jsCliHelper);
			options.setDevice(new JsDeviceHelper(device, taskLogger));
			((Invocable) engine).invokeFunction("_connect", "run", protocol.value(), options, taskLogger);
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
