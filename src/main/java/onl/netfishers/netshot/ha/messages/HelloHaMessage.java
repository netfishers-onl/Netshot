package onl.netfishers.netshot.ha.messages;

import java.util.Set;

import javax.xml.bind.annotation.XmlElement;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.ha.HaManager;
import onl.netfishers.netshot.ha.HaRole;
import onl.netfishers.netshot.ha.HaStatus;

public class HelloHaMessage extends HaMessage {

	/** JVM version, static */
	static protected String JVM_VERSION = System.getProperty("java.vm.version");

	/** HA version (to check compatibility) */
	private int haVersion;

	/** HA priority of the instance (higher = better) */
	private int haPriority;

	/** Job runner weight */
	private int weight;

	/** Netshot version */
	private String version;

	/** JVM version */
	private String jvmVersion;

	private HaStatus status;

	private String driverHash;

	private Set<HaRole> roles;

	/**
	 * Default constructor
	 */
	public HelloHaMessage() {
		super();
		this.version = Netshot.VERSION;
		this.haVersion = HaManager.VERSION;
		this.jvmVersion = HelloHaMessage.JVM_VERSION;
	}

	@XmlElement
	public int getHaVersion() {
		return haVersion;
	}

	public void setHaVersion(int haVersion) {
		this.haVersion = haVersion;
	}

	@XmlElement
	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}
	
}
