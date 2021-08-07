package onl.netfishers.netshot.cluster.messages;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.cluster.ClusterMember;
import onl.netfishers.netshot.rest.RestViews.ClusteringView;

/**
 * Hello message from cluster member.
 */
@XmlRootElement()
public class HelloClusterMessage extends ClusterMessage {
	
	/** Member info */
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

	@XmlElement
	@JsonView(ClusteringView.class)
	public ClusterMember getMemberInfo() {
		return this.memberInfo;
	}

	public void setMemberInfo(ClusterMember memberInfo) {
		this.memberInfo = memberInfo;
	}

	@Override
	public String toString() {
		return "HelloClusterMessage [memberInfo=" + memberInfo + "]";
	}
}
