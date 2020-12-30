package onl.netfishers.netshot.aaa;

import java.util.regex.Pattern;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import org.jasypt.digest.StandardStringDigester;

@Entity
public class ApiToken implements User {

	private static StandardStringDigester digester;

	static {
		digester = new StandardStringDigester();
		digester.setAlgorithm("SHA-256");
		digester.setSaltSizeBytes(0);
	}

	public static String hashToken(String token) {
		return digester.digest(token);
	}

	protected static Pattern TOKEN_PATTERN = Pattern.compile("^[A-Za-z0-9]{32}$");

	/**
	 * Checks whether the given text is a valid token.
	 * @param token the token
	 * @return true if the given token is of valid format
	 */
	public static boolean isValidToken(String token) {
		return token != null && TOKEN_PATTERN.matcher(token).matches();
	}

	/** The id. */
	private long id;

	/** The hashed token. */
	private String hashedToken;

	/** The description. */
	private String description;

	/** The level. */
	private int level = User.LEVEL_ADMIN;

	/**
	 * Instantiates a new API Token.
	 */
	protected ApiToken() {
	}

	public ApiToken(String description, String token, int level) {
		this.description = description;
		this.setToken(token);
		this.level = level;
	}


	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@XmlElement
	public long getId() {
		return id;
	}

	/**
	 * Sets the id.
	 *
	 * @param id the new id
	 */
	public void setId(long id) {
		this.id = id;
	}

	public String getHashedToken() {
		return hashedToken;
	}

	public void setHashedToken(String hashedToken) {
		this.hashedToken = hashedToken;
	}

	public void setToken(String token) {
		this.hashedToken = hashToken(token);
	}

	/* (non-Javadoc)
	 * @see java.security.Principal#getName()
	 */
	@Override
	@Transient
	public String getName() {
		return String.format("API Token [%d: %s]", this.id, this.description);
	}

	@Override
	@Transient
	public String getUsername() {
		return getName();
	}

	/**
	 * Gets the level.
	 *
	 * @return the level
	 */
	@XmlElement
	public int getLevel() {
		return level;
	}

	/**
	 * Sets the level.
	 *
	 * @param level the new level
	 */
	public void setLevel(int level) {
		this.level = level;
	}

	@XmlElement
	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	@Override
	public String toString() {
		return "ApiToken [description=" + description + ", id=" + id + ", level=" + level + "]";
	}
	
}
