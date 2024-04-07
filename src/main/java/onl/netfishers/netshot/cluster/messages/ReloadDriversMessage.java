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

import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.cluster.ClusterMember;

/**
 * Cluster message requesting a reload of drivers to all servers.
 */
@XmlRootElement
public class ReloadDriversMessage extends ClusterMessage {

	/**
	 * Constructor.
	 */
	public ReloadDriversMessage(ClusterMember memberInfo) {
		super(memberInfo.getInstanceId());
	}

	/**
	 * Hidden constructor
	 */
	protected ReloadDriversMessage() {
	}
	
}
