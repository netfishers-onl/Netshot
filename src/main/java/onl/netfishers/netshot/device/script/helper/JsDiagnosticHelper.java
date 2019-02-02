package onl.netfishers.netshot.device.script.helper;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.diagnostic.Diagnostic;
import onl.netfishers.netshot.diagnostic.DiagnosticBinaryResult;
import onl.netfishers.netshot.diagnostic.DiagnosticLongTextResult;
import onl.netfishers.netshot.diagnostic.DiagnosticNumericResult;
import onl.netfishers.netshot.diagnostic.DiagnosticTextResult;
import onl.netfishers.netshot.diagnostic.SimpleDiagnostic;
import onl.netfishers.netshot.work.TaskLogger;

/**
 * This class is used to control the diagnostic results from JavaScript.
 * @author sylvain.cadilhac
 *
 */
public class JsDiagnosticHelper {
	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(JsDiagnosticHelper.class);
	
	/** The device the diagnostic is running on. */
	private final Device device;
	/** The list of diagnostics. */
	private List<Diagnostic> diagnostics;
	/** The JS Logger. */
	private TaskLogger taskLogger;
	
	/**
	 * Instantiate a new JS diagnostic helper.
	 * @param device The device to run the diagnostics on
	 * @param diagnostics The set of diagnostics to run
	 * @param taskLogger the JS logger
	 */
	public JsDiagnosticHelper(Device device, List<Diagnostic> diagnostics, TaskLogger taskLogger) {
		this.device = device;
		this.diagnostics = diagnostics;
		this.taskLogger = taskLogger;
	}
	
	/**
	 * Set a diagnostic result.
	 * @param key The key
	 * @param value The value
	 */
	public void set(String key, Double value) {
		if (value == null) {
			return;
		}
		try {
			for (Diagnostic diagnostic : diagnostics) {
				if (diagnostic.getName().equals(key)) {
					switch (diagnostic.getResultType()) {
					case NUMERIC:
						device.addDiagnosticResult(new DiagnosticNumericResult(device, diagnostic, value));
						break;
					default:
					}
					break;
				}
			}
		}
		catch (Exception e) {
			logger.warn("Error while setting the numeric diagnostic result '{}'.", key);
			taskLogger.error(String.format("Can't set numeric diagnostic result %s: %s", key,  e.getMessage()));
		}
	}

	/**
	 * Set a diagnostic result.
	 * @param key The key
	 * @param value The value
	 */
	public void set(String key, Boolean value) {
		if (value == null) {
			return;
		}
		try {
			for (Diagnostic diagnostic : diagnostics) {
				if (diagnostic.getName().equals(key)) {
					switch (diagnostic.getResultType()) {
					case BINARY:
						device.addDiagnosticResult(new DiagnosticBinaryResult(device, diagnostic, value));
						break;
					default:
					}
					break;
				}
			}
		}
		catch (Exception e) {
			logger.warn("Error while setting the boolean diagnostic result '{}'.", key);
			taskLogger.error(String.format("Can't set boolean diagnostic result %s: %s", key,  e.getMessage()));
		}
	}
	
	/**
	 * Set a diagnostic result.
	 * @param key The key
	 * @param value The value
	 */
	public void set(String key, Object value) {
		if (value == null) {
			return;
		}
		try {
			for (Diagnostic diagnostic : diagnostics) {
				if (diagnostic.getName().equals(key)) {
					switch (diagnostic.getResultType()) {
					case LONGTEXT:
						device.addDiagnosticResult(new DiagnosticLongTextResult(device, diagnostic, (String) value));
						break;
					case TEXT:
						device.addDiagnosticResult(new DiagnosticTextResult(device, diagnostic, (String) value));
						break;
					case NUMERIC:
						device.addDiagnosticResult(new DiagnosticNumericResult(device, diagnostic, (String) value));
						break;
					case BINARY:
						device.addDiagnosticResult(new DiagnosticBinaryResult(device, diagnostic, (String) value));
						break;
					default:
					}
					break;
				}
			}
		}
		catch (Exception e) {
			logger.warn("Error while setting the textual diagnostic result '{}'.", key);
			taskLogger.error(String.format("Can't set diagnostic result %s: %s", key,  e.getMessage()));
		}
	}
	
	/**
	 * Get the diagnostics.
	 * @return the diagnostics
	 */
	public List<Diagnostic> getDiagnostics() {
		return diagnostics;
	}
	
	/**
	 * Get the simple diagnostics.
	 * @return the diagnostics
	 */
	public Set<SimpleDiagnostic> getSimpleDiagnostics() {
		Set<SimpleDiagnostic> simpleDiagnostics = new HashSet<SimpleDiagnostic>();
		for (Diagnostic diagnostic : diagnostics) {
			if (diagnostic instanceof SimpleDiagnostic) {
				simpleDiagnostics.add((SimpleDiagnostic) diagnostic);
			}
		}
		return simpleDiagnostics;
	}

}
