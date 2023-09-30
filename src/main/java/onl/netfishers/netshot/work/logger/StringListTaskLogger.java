package onl.netfishers.netshot.work.logger;

import java.util.List;

import org.graalvm.polyglot.HostAccess.Export;

import onl.netfishers.netshot.work.TaskLogger;

/**
 * Simple List-based task logger implementation.
 */
public class StringListTaskLogger implements TaskLogger {

	private List<String> logs;

	public StringListTaskLogger(List<String> logs) {
		this.logs = logs;
	}

	@Export
	@Override
	public void warn(String message) {
		this.logs.add(String.format("[WARN] %s", message));
	}
	
	@Export
	@Override
	public void trace(String message) {
		this.logs.add(String.format("[TRACE] %s", message));
	}
	
	@Export
	@Override
	public void info(String message) {
		this.logs.add(String.format("[INFO] %s", message));
	}
	
	@Export
	@Override
	public void error(String message) {
		this.logs.add(String.format("[ERROR] %s", message));
	}
	
	@Export
	@Override
	public void debug(String message) {
		this.logs.add(String.format("[DEBUG] %s", message));
	}
	
}
