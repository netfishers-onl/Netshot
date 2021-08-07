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
