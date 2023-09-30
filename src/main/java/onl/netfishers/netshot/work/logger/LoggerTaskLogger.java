package onl.netfishers.netshot.work.logger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.work.TaskLogger;

/**
 * Slf4j logger-based Task Logger
 */
public class LoggerTaskLogger implements TaskLogger {
	private Logger logger;

	public LoggerTaskLogger(Class<?> clazz) {
		this.logger = LoggerFactory.getLogger(clazz);
	}

	@Override
	public void warn(String message) {
		this.logger.warn("[WARN] {}", message);
	}

	@Override
	public void trace(String message) {
		this.logger.warn("[TRACE] {}", message);
	}

	@Override
	public void info(String message) {
		this.logger.warn("[INFO] {}", message);
	}

	@Override
	public void error(String message) {
		this.logger.warn("[ERROR] {}", message);
	}

	@Override
	public void debug(String message) {
		this.logger.warn("[DEBUG] {}", message);
	}
}
