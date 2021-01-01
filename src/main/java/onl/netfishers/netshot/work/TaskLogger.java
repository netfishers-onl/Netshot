package onl.netfishers.netshot.work;

import org.graalvm.polyglot.HostAccess.Export;

public interface TaskLogger {
	
	@Export
	public void trace(String message);
	@Export
	public void debug(String message);
	@Export
	public void info(String message);
	@Export
	public void warn(String message);
	@Export
	public void error(String message);

}
