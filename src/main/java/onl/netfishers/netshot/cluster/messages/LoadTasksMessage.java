package onl.netfishers.netshot.cluster.messages;

import javax.xml.bind.annotation.XmlRootElement;

import onl.netfishers.netshot.cluster.ClusterMember;

/**
 * Cluster message requesting to load (and execute) tasks.
 */
@XmlRootElement
public class LoadTasksMessage extends ClusterMessage {

	/**
	 * Constructor.
	 */
	public LoadTasksMessage(ClusterMember memberInfo) {
		super(memberInfo.getInstanceId());
	}

	/**
	 * Hidden constructor
	 */
	protected LoadTasksMessage() {
	}
	
}
