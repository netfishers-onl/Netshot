package onl.netfishers.netshot.cluster.messages;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import lombok.Getter;
import lombok.Setter;
import onl.netfishers.netshot.cluster.ClusterMember;

/**
 * Cluster message requesting to take a snapshot of specific devices.
 * Let the master deduplicate the requests when multiple cluster members
 * receive the trap triggering the snapshot.
 */
@XmlRootElement
public class AutoSnapshotMessage extends ClusterMessage {

	/** Device IDs */
	@Getter(onMethod=@__({
		@XmlElement
	}))
	@Setter
	Set<Long> deviceIds = new HashSet<>();

	/**
	 * Constructor.
	 */
	public AutoSnapshotMessage(ClusterMember memberInfo) {
		super(memberInfo.getInstanceId());
	}

	/**
	 * Hidden constructor
	 */
	protected AutoSnapshotMessage() {
	}

	public void addDeviceIds(Collection<Long> deviceIds) {
		this.deviceIds.addAll(deviceIds);
	}
}
