package onl.netfishers.netshot.ha.messages;

import java.lang.management.ManagementFactory;
import java.util.UUID;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;

/**
 * HA-related message to be be exchanged with other Netshot instances
 * in a serialized form.
 */
@XmlAccessorType(value = XmlAccessType.NONE)
@XmlRootElement()
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
	@Type(value = HelloHaMessage.class, name = "hello"),
})
public abstract class HaMessage {

	/** Message ID counter */
	static protected Long lastMessageId = 0L;

	private UUID instanceId;

	/** Current system time */
	private long currentTime;

	/** Current Netshot uptime */
	private long upTime;

	/** Message ID */
	private long messageId;

	/**
	 * Default constructor
	 */
	public HaMessage() {
		this.currentTime = System.currentTimeMillis();
		this.upTime = ManagementFactory.getRuntimeMXBean().getUptime();
		synchronized (HaMessage.lastMessageId) {
			HaMessage.lastMessageId += 1;
			this.messageId = HaMessage.lastMessageId;
		}
	}

	@XmlElement
	public long getCurrentTime() {
		return currentTime;
	}

	public void setCurrentTime(long currentTime) {
		this.currentTime = currentTime;
	}

	@XmlElement
	public long getUpTime() {
		return upTime;
	}

	public void setUpTime(long upTime) {
		this.upTime = upTime;
	}

	@XmlElement
	public long getMessageId() {
		return messageId;
	}

	public void setMessageId(long messageId) {
		this.messageId = messageId;
	}

	

}
