/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
 */
package onl.netfishers.netshot.work.tasks;

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

}
