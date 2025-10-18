package net.netshot.netshot.device.script.helper;

import java.util.regex.Pattern;

import org.graalvm.polyglot.Value;

public class JsUtils {

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
	
}
