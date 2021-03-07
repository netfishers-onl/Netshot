package onl.netfishers.netshot.hooks;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * Hook base class
 */
@Entity @Inheritance(strategy = InheritanceType.JOINED)
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
	@Type(value = WebHook.class, name = "Web")
})
public abstract class Hook {

	/** Unique ID of the webhook **/
	private long id;

	/** Name of the webhook */
	private String name;

	/** Whether the hook is enabled */
	private boolean enabled = true;

	/** List of associated triggers */
	private Set<HookTrigger> triggers = new HashSet<>();

	/**
	 * Gets the ID of the webhook.
	 * @return the ID
	 */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@XmlElement @JsonView(DefaultView.class)
	public long getId() {
		return id;
	}

	/**
	 * Sets the ID of the webhook.
	 * @param id
	 */
	public void setId(long id) {
		this.id = id;
	}

	@Column(unique = true)
	@XmlElement @JsonView(DefaultView.class)
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	@XmlElement @JsonView(DefaultView.class)
	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	@XmlElement @JsonView(DefaultView.class)
	@OneToMany(fetch = FetchType.EAGER, mappedBy = "hook", cascade = CascadeType.ALL, orphanRemoval = true)
	public Set<HookTrigger> getTriggers() {
		return triggers;
	}

	public void setTriggers(Set<HookTrigger> triggers) {
		this.triggers = triggers;
	}

	/**
	 * Execute the hook.
	 * @param data Associated data (such a task)
	 */
	public abstract String execute(Object data) throws Exception;

	@Override
	public String toString() {
		return "Hook [id=" + id + ", name=" + name + "]";
	}
}
