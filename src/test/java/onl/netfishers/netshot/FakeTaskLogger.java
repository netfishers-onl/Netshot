package onl.netfishers.netshot;

import onl.netfishers.netshot.work.TaskLogger;

public class FakeTaskLogger implements TaskLogger {
	public void trace(String message) {}
	public void debug(String message) {}
	public void info(String message) {}
	public void warn(String message) {}
	public void error(String message) {}
}
