/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.persistence.Version;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.hibernate.annotations.Index;
import org.netshot.Netshot;
import org.netshot.NetshotDatabase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * A device configuration.
 */
@Entity @Inheritance(strategy = InheritanceType.JOINED)
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
@JsonTypeInfo(use = JsonTypeInfo.Id.MINIMAL_CLASS, include = JsonTypeInfo.As.PROPERTY, property = "type")
public abstract class Config {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(Config.class);
	
	/** The Constant CONFIG_CLASSES. */
	private static final Set<Class<? extends Config>> CONFIG_CLASSES;
	
	static {
		CONFIG_CLASSES = new HashSet<Class<? extends Config>>();
		try {
	    for (Class<?> clazz : NetshotDatabase.listClassesInPackage("org.netshot.device.vendors")) {
	    	if (Config.class.isAssignableFrom(clazz)) {
	    		@SuppressWarnings("unchecked")
	        Class<? extends Config> configClass = (Class<? extends Config>) clazz;
	    		CONFIG_CLASSES.add(configClass);
	    	}
	    }
    }
    catch (Exception e) {
    	logger.error("Error while scanning the device classes.", e);
    }
	}
	
	@Entity
	public static class LongTextConfiguration {
		
		private long id;
		private String text = "";
		
		@Id
		@GeneratedValue
		public long getId() {
			return id;
		}

		@Column(length = 100000000)
		public String getText() {
			return text;
		}

		public void setText(String text) {
			this.text = text;
		}

		public void setId(long id) {
			this.id = id;
		}
		
		public String toString() {
			return getText();
		}

		@Override
		public int hashCode() {
			final int prime = 31;
			int result = 1;
			result = prime * result + ((text == null) ? 0 : text.hashCode());
			return result;
		}

		@Override
		public boolean equals(Object obj) {
			if (this == obj)
				return true;
			if (obj == null)
				return false;
			if (!(obj instanceof LongTextConfiguration))
				return false;
			LongTextConfiguration other = (LongTextConfiguration) obj;
			if (getText() == null) {
				if (other.getText() != null)
					return false;
			}
			else if (!getText().equals(other.getText()))
				return false;
			return true;
		}
		
	}
	
	/**
	 * Gets the config classes.
	 *
	 * @return the config classes
	 */
	public static final Set<Class<? extends Config>> getConfigClasses() {
		return CONFIG_CLASSES;
	}
	
	/** The id. */
	protected long id;
	
	/** The change date. */
	protected Date changeDate;
	
	/** The device. */
	protected Device device;

	/** The author. */
	private String author = "";
	
	/**
	 * Instantiates a new config.
	 */
	public Config() {
	}
	
	/**
	 * Instantiates a new config.
	 *
	 * @param device the device
	 */
	public Config(Device device) {
		this.device = device;
	}
	
	/**
	 * Gets the id.
	 *
	 * @return the id
	 */
	@XmlElement
	@Id
	@GeneratedValue
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

	/**
	 * Gets the change date.
	 *
	 * @return the change date
	 */
	@XmlElement
	@Version
	@Index(name = "changeDateIndex")
	@ConfigItem(name = "Config change date", type = ConfigItem.Type.CHECKABLE)
	public Date getChangeDate() {
		return changeDate;
	}

	/**
	 * Sets the change date.
	 *
	 * @param changeDate the new change date
	 */
	public void setChangeDate(Date changeDate) {
		this.changeDate = changeDate;
	}

	/**
	 * Gets the device.
	 *
	 * @return the device
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	public Device getDevice() {
		return device;
	}

	/**
	 * Sets the device.
	 *
	 * @param device the new device
	 */
	public void setDevice(Device device) {
		this.device = device;
	}
	
	/**
	 * Gets the author.
	 *
	 * @return the author
	 */
	@XmlElement
	public String getAuthor() {
		return author;
	}
	
	/**
	 * Sets the author.
	 *
	 * @param author the new author
	 */
	public void setAuthor(String author) {
		this.author = author;
	}

	/**
	 * Gets the item.
	 *
	 * @param item the item
	 * @return the item
	 */
	@Transient
	public String getItem(String item) {
		Method[] methods = this.getClass().getMethods();
		for (Method method : methods) {
			ConfigItem annotation = method.getAnnotation(ConfigItem.class);
			if (annotation != null && annotation.name().compareToIgnoreCase(item) == 0 &&
					Arrays.asList(annotation.type()).contains(ConfigItem.Type.RETRIEVABLE)) {
				try {
					return (String) method.invoke(this);
				}
				catch (Exception e) {
					logger.error("Error while invoking method '{}' for item '{}' in '{}'.",
							method.getName(), item, this.getClass().getName(), e);
				}
			}
		}
		return null;
	}
	
	/**
	 * Gets the diffable items.
	 *
	 * @return the diffable items
	 */
	@Transient
	public Map<String, String> getDiffableItems() {
		Map<String, String> items = new HashMap<String, String>();
		Method[] methods = this.getClass().getMethods();
		for (Method method : methods) {
			ConfigItem annotation = method.getAnnotation(ConfigItem.class);
			if (annotation != null && Arrays.asList(annotation.type()).contains(ConfigItem.Type.DIFFABLE)) {
				try {
					String value = (String) method.invoke(this);
					items.put(annotation.name(), value);
				}
				catch (Exception e) {
					logger.error("Error while invoking method '{}' in '{}'.",
							method.getName(), this.getClass().getName(), e);
				}
			}
		}
		return items;
	}
	
	/**
	 * Write the configuration into a file.
	 *
	 * @param config the config
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	protected void writeToFile(String config) throws IOException {
		String path = Netshot.getConfig("netshot.snapshots.dump");
		if (path != null) {
			BufferedWriter output = new BufferedWriter(
					new FileWriter(Paths.get(path, this.getDevice().getName()).normalize().toFile()));
			output.write(config);
			output.close();
		}
	}
	
	/**
	 * Write to file.
	 *
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public abstract void writeToFile() throws IOException;
	
}
