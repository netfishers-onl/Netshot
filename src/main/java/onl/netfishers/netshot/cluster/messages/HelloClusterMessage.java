package onl.netfishers.netshot.cluster.messages;

import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.cluster.ClusterMember;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * Hello message from cluster member.
 */
public class HelloClusterMessage extends ClusterMessage {
	
	/** Member info */
	private ClusterMember memberInfo;

	public HelloClusterMessage(ClusterMember memberInfo) {
		super(memberInfo.getInstanceId());
		this.memberInfo = memberInfo;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public ClusterMember getMemberInfo() {
		return this.memberInfo;
	}

	public void setMemberInfo(ClusterMember memberInfo) {
		this.memberInfo = memberInfo;
	}
}
