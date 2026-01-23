/**
 * Copyright 2013-2025 Netshot
 * 
 * This file is part of Netshot project.
 * 
 * Netshot is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Netshot is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Netshot.  If not, see <http://www.gnu.org/licenses/>.
 */
package net.netshot.netshot.device.script.helper;

import java.util.regex.Pattern;

import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.SourceSection;
import org.graalvm.polyglot.Value;

/**
 * Common utils for JavaScript scripts.
 */
public final class JsUtils {

	private JsUtils() {
		// Private constructor to prevent instantiation
	}

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
	public static String jsErrorToMessage(Throwable e) {
		if (e instanceof PolyglotException pe && pe.isGuestException()) {
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
		else if (e.getCause() != null && e.getCause() instanceof PolyglotException) {
			return jsErrorToMessage(e.getCause());
		}
		return e.getMessage();
	}

	
	
}
