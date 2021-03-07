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
package onl.netfishers.netshot.hooks;

import java.io.Serializable;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * A trigger for a hook
 */
@Entity
@XmlRootElement @XmlAccessorType(value = XmlAccessType.NONE)
public class HookTrigger implements Serializable {

	private static final long serialVersionUID = -1209506185538121214L;

	/**
	 * Types of trigger
	 */
	static public enum TriggerType {
		/** Trigger the hook right at the end of a task */
		POST_TASK,
	};

	/** Type of trigger */
	private TriggerType type;

	/** Item to be matched */
	private String item;

	/** Associated hook */
	private Hook hook;

	@Id
	@XmlElement @JsonView(DefaultView.class)
	public TriggerType getType() {
		return type;
	}

	public void setType(TriggerType type) {
		this.type = type;
	}

	@Id
	@XmlElement @JsonView(DefaultView.class)
	public String getItem() {
		return item;
	}

	public void setItem(String item) {
		this.item = item;
	}

	@Id
	@ManyToOne()
	public Hook getHook() {
		return hook;
	}

	public void setHook(Hook hook) {
		this.hook = hook;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((item == null) ? 0 : item.hashCode());
		result = prime * result + ((type == null) ? 0 : type.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj) return true;
		if (obj == null) return false;
		if (getClass() != obj.getClass()) return false;
		HookTrigger other = (HookTrigger) obj;
		if (item == null) {
			if (other.item != null) return false;
		}
		else if (!item.equals(other.item)) return false;
		return type == other.type;
	}
	
}
