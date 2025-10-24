package net.netshot.netshot.device.script.helper;

import java.util.regex.Pattern;

import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.SourceSection;
import org.graalvm.polyglot.Value;

/**
 * Common utils for JavaScript scripts.
 */
public class JsUtils {

	/**
	 * Converts a JavaScript RegExp object to a Java Pattern.
	 * @param jsRegExp the JavaScript RegExp object as a GraalVM {@link Value}
	 * @return a Java {@link Pattern} compiled from the JavaScript RegExp
	 * @throws IllegalArgumentException if the provided Value is not a JavaScript RegExp object
	 * @throws RuntimeException if the pattern cannot be compiled (wraps the underlying exception)
	 */
	public static Pattern jsRegExpToPattern(Value jsRegExp) {
		if (!"RegExp".equals(jsRegExp.getMetaObject().getMetaSimpleName())) {
			throw new IllegalArgumentException("JS object is not a RegExp");
		}
		String jsSource = jsRegExp.getMember("source").asString();
		String jsFlags = jsRegExp.getMember("flags").asString();   // e.g. "gi"

		int flags = 0;
		for (char f : jsFlags.toCharArray()) {
			switch (f) {
			case 'i':
				flags |= Pattern.CASE_INSENSITIVE;
				break;
			case 'm':
				flags |= Pattern.MULTILINE;
				break;
			case 's':
				flags |= Pattern.DOTALL;
				break;
			case 'u':
				// JS 'u' (Unicode) partially maps to UNICODE_CASE
				flags |= Pattern.UNICODE_CASE;
				break;
			default:
				// JS 'g', 'y', and 'd' are for JS runtime behavior, not needed for Java Pattern
				break;
			}
		}

		try {
			Pattern pattern = Pattern.compile(jsSource, flags);
			return pattern;
		}
		catch (Exception e) {
			throw new RuntimeException("Unable to compile JS pattern", e);
		}

	}

	/**
	 * Converts a JavaScript exception to a formatted error message with source location.
	 * @param e the exception to convert
	 * @return a formatted error message including file name, line, and column if available
	 */
	public static String jsErrorToMessage(Exception e) {
		if (e.getCause() != null && e.getCause() instanceof PolyglotException pe && pe.isGuestException()) {
			SourceSection source = pe.getSourceLocation();
			if (source != null) {
				return "%s at %s:%d:%d".formatted(
					pe.getMessage(),
					source.getSource().getName(),
					source.getStartLine(),
					source.getStartColumn()
				);
			}
		}
		return e.getMessage();
	}

	
	
}
