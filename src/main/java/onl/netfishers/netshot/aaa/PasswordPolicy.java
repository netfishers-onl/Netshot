package onl.netfishers.netshot.aaa;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.Getter;
import lombok.Setter;
import onl.netfishers.netshot.Netshot;

/**
 * Password policy
 */
public class PasswordPolicy {

	/**
	 * Exception to be thrown in case of password policy check failure
	 */
	static public class PasswordPolicyException extends Exception {
		public PasswordPolicyException(String message) {
			super(message);
		}
	}

	/**
	 * Match for specific characters in the password.
	 */
	static public enum CharMatch {
		ANY("mintotalchars", "minimum total length", ".", 1),
		SPECIAL("minspecialchars", "minimum special characters count", "[!\"#$%&'()*+,-./:;<=>?@\\[\\]\\^_{}|~]", 0),
		NUMERICAL("minnumericalchars", "minimum numerical character count", "[0-9]", 0),
		LOWERCASE("minlowercasechars", "minimum lowercase character count", "[a-z]", 0),
		UPPERCASE("minuppercasechars", "minimum uppercase character count", "[A-Z]", 0);

		@Getter
		private String name;

		@Getter
		private String description;

		@Getter
		private Pattern pattern;

		@Getter
		private int defaultValue;

		private CharMatch(String name, String description, String pattern, int defaultValue) {
			this.name = name;
			this.description = description;
			this.pattern = Pattern.compile(pattern);
			this.defaultValue = defaultValue;
		}

		/**
		 * Count the number of matches in the given target string.
		 * @param target Where to find characters
		 * @return the number of matches
		 */
		public long countMatches(String target) {
			Matcher m = this.pattern.matcher(target);
			return m.results().count();
		}
	}

	static private PasswordPolicy mainPolicy;

	/**
	 * Load the main policy from configuration.
	 */
	public static void loadConfig() {
		final String configPrefix = "netshot.aaa.passwordpolicy.";
		PasswordPolicy policy = new PasswordPolicy();
		policy.maxHistory = Netshot.getConfig(configPrefix + "maxhistory", 0, 0, Integer.MAX_VALUE);
		policy.maxDuration = Netshot.getConfig(configPrefix + "maxduration", 0, 0, Integer.MAX_VALUE);
		for (CharMatch m : CharMatch.values()) {
			int min = Netshot.getConfig(configPrefix + m.getName(), m.getDefaultValue(), 0, 1024);
			if (min > 0) {
				policy.minCharMatchCounts.put(m, min);
			}
		}
		PasswordPolicy.mainPolicy = policy;
	}

	static {
		PasswordPolicy.loadConfig();
	}

	/**
	 * Get the main password policy (as configured in Netshot config file)
	 * @return the main password policy
	 */
	static public PasswordPolicy getMainPolicy() {
		return PasswordPolicy.mainPolicy;
	}

	/** Max history count */
	@Getter
	@Setter
	private int maxHistory = 0;

	/** Max duration of the password, in days */
	@Getter
	@Setter
	private int maxDuration = 0;

	/** Min number of characters per character match */
	@Getter
	@Setter
	private Map<CharMatch, Integer> minCharMatchCounts = new HashMap<>();
}
