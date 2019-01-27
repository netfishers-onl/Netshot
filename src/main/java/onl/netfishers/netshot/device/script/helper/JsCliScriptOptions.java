package onl.netfishers.netshot.device.script.helper;

import onl.netfishers.netshot.device.DeviceDataProvider;

/**
 * The options object to pass data to JavaScript entry function in a generic way.
 * @author sylvain.cadilhac
 *
 */
public class JsCliScriptOptions {
	private JsCliHelper cli;
	private JsDeviceHelper device;
	private JsConfigHelper config;
	private DeviceDataProvider dataProvider;
	private JsDiagnosticHelper diagnostic;

	public JsDiagnosticHelper getDiagnostic() {
		return diagnostic;
	}

	public void setDiagnostic(JsDiagnosticHelper diagnostic) {
		this.diagnostic = diagnostic;
	}

	public JsCliScriptOptions(JsCliHelper cli) {
		this.cli = cli;
	}

	public JsCliHelper getCli() {
		return cli;
	}

	public void setCli(JsCliHelper cli) {
		this.cli = cli;
	}

	public JsDeviceHelper getDevice() {
		return device;
	}

	public void setDevice(JsDeviceHelper device) {
		this.device = device;
	}

	public JsConfigHelper getConfig() {
		return config;
	}

	public void setConfig(JsConfigHelper config) {
		this.config = config;
	}

	public DeviceDataProvider getDataProvider() {
		return dataProvider;
	}

	public void setDataProvider(DeviceDataProvider dataProvider) {
		this.dataProvider = dataProvider;
	}
	
	public void logIt(String log, int level) {
		
	}

}
