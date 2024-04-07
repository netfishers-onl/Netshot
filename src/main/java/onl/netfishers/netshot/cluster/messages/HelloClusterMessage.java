/**
 * Copyright 2013-2024 Netshot
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
package onl.netfishers.netshot.cluster.messages;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import onl.netfishers.netshot.cluster.ClusterMember;
import onl.netfishers.netshot.rest.RestViews.ClusteringView;

/**
 * Hello message from cluster member.
 */
@XmlRootElement
public class HelloClusterMessage extends ClusterMessage {
	
	/** Member info */
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(ClusteringView.class)
	}))
	@Setter
	private ClusterMember memberInfo;

	public HelloClusterMessage(ClusterMember memberInfo) {
		super(memberInfo.getInstanceId());
		this.memberInfo = memberInfo;
	}

	/**
	 * Hidden constructor
	 */
	protected HelloClusterMessage() {
	}

	@Override
	public String toString() {
		return "HelloClusterMessage [memberInfo=" + memberInfo + "]";
	}
}
