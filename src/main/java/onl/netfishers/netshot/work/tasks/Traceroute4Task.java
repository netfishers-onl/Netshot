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
package onl.netfishers.netshot.work.tasks;

import javax.persistence.Transient;

import org.quartz.JobKey;

import onl.netfishers.netshot.work.Task;

/**
 * The Class Traceroute4Task.
 */
public class Traceroute4Task extends Task {
	/*
	public static class IPv4Packet {
		private Network4Address sourceAddress;
		private Network4Address destinationAddress;
		private int protocol;
		private int sourcePort;
		private int destinationPort;
		public static int UDP = 17;
		public static int TCP = 6;
		public static int ICMP = 1;
	}

	public static class Frame {
		private IPPacket packet;

	}

	public static enum HopBehavior {
		L2FORWARDING,
		L3FORWARDING,
		DROP_NOROUTE,
		DROP_FILTER,
		DROP_RPF
	}

	public static class Hop {
		private Device device;
		private String virtualDevice;
		private PhysicalAddress sourceMac;
		private PhysicalAddress destinationMac;
		private String inPhysPort;
		private String outPhysPort;
		private String vrfInstance;
		private int vlan;
		private int outMplsLabel;

	}*/


	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getTaskDescription()
	 */
	@Override
	public String getTaskDescription() {
		return "Traceroute task";
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		// TODO Auto-generated method stub

	}

	/*
	 * (non-Javadoc)
	 * @see onl.netfishers.netshot.work.Task#getIdentity()
	 */
	@Override
	@Transient
	public JobKey getIdentity() {
		return new JobKey(String.format("Task_%d", this.getId()), "Traceroute");
	}
}
