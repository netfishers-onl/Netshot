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

import lombok.Getter;
import lombok.Setter;

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
	@Getter(onMethod=@__({
		@Id, @GeneratedValue(strategy = GenerationType.IDENTITY),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private long id;

	/** Name of the webhook */
	@Getter(onMethod=@__({
		@Column(unique = true),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String name;

	/** Whether the hook is enabled */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private boolean enabled = true;

	/** List of associated triggers */
	@Getter(onMethod=@__({
		@OneToMany(mappedBy = "hook", orphanRemoval = true, fetch = FetchType.EAGER, cascade = CascadeType.ALL),
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private Set<HookTrigger> triggers = new HashSet<>();

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
