package onl.netfishers.netshot;

import onl.netfishers.netshot.work.TaskLogger;

public class FakeTaskLogger implements TaskLogger {
	private StringBuffer buffer = new StringBuffer();
	public void trace(String message) {
		buffer.append("TRACE - ");
		buffer.append(message);
		buffer.append("\n");
	}
	public void debug(String message) {
		buffer.append("DEBUG - ");
		buffer.append(message);
		buffer.append("\n");
	}
	public void info(String message) {
		buffer.append("INFO - ");
		buffer.append(message);
		buffer.append("\n");
	}
	public void warn(String message) {
		buffer.append("WARN - ");
		buffer.append(message);
		buffer.append("\n");
	}
	public void error(String message) {
		buffer.append("ERROR - ");
		buffer.append(message);
		buffer.append("\n");
	}
	public String getLog() {
		return buffer.toString();
	}
}
