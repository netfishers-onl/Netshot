/**
 * Copyright 2013-2021 Sylvain Cadilhac (NetFishers)
 * 
 * This file is part of Netshot.
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
package onl.netfishers.netshot.compliance;

import java.io.Serializable;
import java.util.Date;

import javax.persistence.Embeddable;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.rest.RestViews.DefaultView;


/**
 * The Exemption class means the given device is exempted from the given
 * rule, until the expiration date/time.
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class Exemption {

	/**
	 * The Class Key.
	 */
	@Embeddable
	public static class Key implements Serializable {

		/** The Constant serialVersionUID. */
		private static final long serialVersionUID = 1684160749155998836L;

		/** The rule. */
		private Rule rule = null;

		/** The device. */
		private Device device = null;

		/**
		 * Instantiates a new key.
		 */
		protected Key() {

		}

		/**
		 * Instantiates a new key.
		 *
		 * @param rule the rule
		 * @param device the device
		 */
		public Key(Rule rule, Device device) {
			this.rule = rule;
			this.device = device;
		}

		/**
		 * Gets the rule.
		 *
		 * @return the rule
		 */
		@ManyToOne
		public Rule getRule() {
			return rule;
		}

		/**
		 * Sets the rule.
		 *
		 * @param rule the new rule
		 */
		public void setRule(Rule rule) {
			this.rule = rule;
		}

		/**
		 * Gets the device.
		 *
		 * @return the device
		 */
		@ManyToOne
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

		/* (non-Javadoc)
		 * @see java.lang.Object#hashCode()
		 */
		@Override
		public int hashCode() {
			final int prime = 31;
			int result = 1;
			result = prime * result + ((device == null) ? 0 : device.hashCode());
			result = prime * result + ((rule == null) ? 0 : rule.hashCode());
			return result;
		}

		/* (non-Javadoc)
		 * @see java.lang.Object#equals(java.lang.Object)
		 */
		@Override
		public boolean equals(Object obj) {
			if (this == obj)
				return true;
			if (obj == null)
				return false;
			if (getClass() != obj.getClass())
				return false;
			Key other = (Key) obj;
			if (device == null) {
				if (other.device != null)
					return false;
			}
			else if (!device.equals(other.device))
				return false;
			if (rule == null) {
				if (other.rule != null)
					return false;
			}
			else if (!rule.equals(other.rule))
				return false;
			return true;
		}

	}

	/** The key. */
	private Key key = new Key();

	/** The expiration date. */
	private Date expirationDate;

	/**
	 * Instantiates a new exemption.
	 */
	protected Exemption() {
	}

	/**
	 * Instantiates a new exemption.
	 *
	 * @param rule the rule
	 * @param device the device
	 * @param expiration the expiration
	 */
	public Exemption(Rule rule, Device device, Date expiration) {
		this.key.setRule(rule);
		this.key.setDevice(device);
		this.expirationDate = expiration;
	}

	/**
	 * Gets the expiration date.
	 *
	 * @return the expiration date
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	public Date getExpirationDate() {
		return expirationDate;
	}

	/**
	 * Sets the expiration date.
	 *
	 * @param expirationDate the new expiration date
	 */
	public void setExpirationDate(Date expirationDate) {
		this.expirationDate = expirationDate;
	}

	/**
	 * Gets the rule.
	 *
	 * @return the rule
	 */
	@Transient
	public Rule getRule() {
		return this.key.getRule();
	}

	/**
	 * Sets the rule.
	 *
	 * @param rule the new rule
	 */
	public void setRule(Rule rule) {
		this.key.setRule(rule);
	}

	/**
	 * Gets the device.
	 *
	 * @return the device
	 */
	@Transient
	public Device getDevice() {
		return this.key.getDevice();
	}

	/**
	 * Sets the device.
	 *
	 * @param device the new device
	 */
	public void setDevice(Device device) {
		this.key.setDevice(device);
	}

	/**
	 * Gets the key.
	 *
	 * @return the key
	 */
	@EmbeddedId
	public Key getKey() {
		return key;
	}

	/**
	 * Sets the key.
	 *
	 * @param key the new key
	 */
	protected void setKey(Key key) {
		this.key = key;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((key == null) ? 0 : key.hashCode());
		return result;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Exemption other = (Exemption) obj;
		if (key == null) {
			if (other.key != null)
				return false;
		}
		else if (!key.equals(other.key))
			return false;
		return true;
	}

}
