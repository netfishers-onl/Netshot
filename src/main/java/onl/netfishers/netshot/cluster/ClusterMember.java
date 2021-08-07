package onl.netfishers.netshot.cluster;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.rest.RestViews.RestApiView;

@XmlAccessorType(value = XmlAccessType.NONE)
@XmlRootElement()
public class ClusterMember implements Comparable<ClusterMember>, Cloneable {

	/**
	 * Mastership status of a cluster member
	 */
	public static enum MastershipStatus {
		MEMBER,
		MASTER,
		EXPIRED,
		NEGOTIATING,
	}

	/** Is it the local server? */
	private boolean local = false;

	/** Cluster member unique ID */
	private String instanceId;

	/** Member hostname */
	private String hostname;

	/** Clustering version (to check compatibility) */
	private int clusteringVersion;

	/** Mastership priority of the instance (higher = better) */
	private int masterPriority;

	/** Job runner priority (higher = better) */
	private int runnerPriority;

	/** Job runner weight (for runners of same priority) */
	private int runnerWeight;

	/** Netshot version */
	private String appVersion;

	/** JVM version */
	private String jvmVersion;

	/** Hash of all drivers */
	private String driverHash;

	/** Current status */
	private MastershipStatus status;

	/** Last status change */
	private long lastStatusChangeTime;

	/** Last seen */
	private long lastSeenTime;

	/**
	 * Default constructor
	 */
	public ClusterMember(String instanceId, String hostname, int clusteringVersion, int masterPriority,
			int runnerPriority, int runnerWeight, String appVersion, String jvmVersion, String driverHash) {
		this.local = true;
		this.instanceId = instanceId;
		this.hostname = hostname;
		this.clusteringVersion = clusteringVersion;
		this.masterPriority = masterPriority;
		this.runnerPriority = runnerPriority;
		this.runnerWeight = runnerWeight;
		this.appVersion = appVersion;
		this.jvmVersion = jvmVersion;
		this.driverHash = driverHash;
		this.status = MastershipStatus.MEMBER;
		this.lastStatusChangeTime = System.currentTimeMillis();
		this.lastSeenTime = 0L;
	}

	/**
	 * Hidden constructor for deserialization
	 */
	public ClusterMember() {
	}

	@XmlElement
	@JsonView(RestApiView.class)
	public boolean isLocal() {
		return local;
	}

	public void setLocal(boolean local) {
		this.local = local;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getInstanceId() {
		return instanceId;
	}

	protected void setInstanceId(String instanceId) {
		this.instanceId = instanceId;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getHostname() {
		return hostname;
	}

	public void setHostname(String hostname) {
		this.hostname = hostname;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public int getClusteringVersion() {
		return clusteringVersion;
	}

	protected void setClusteringVersion(int clusteringVersion) {
		this.clusteringVersion = clusteringVersion;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public int getMasterPriority() {
		return masterPriority;
	}

	protected void setMasterPriority(int masterPriority) {
		this.masterPriority = masterPriority;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public int getRunnerPriority() {
		return runnerPriority;
	}

	public void setRunnerPriority(int runnerPriority) {
		this.runnerPriority = runnerPriority;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public int getRunnerWeight() {
		return runnerWeight;
	}

	protected void setRunnerWeight(int runnerWeight) {
		this.runnerWeight = runnerWeight;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getJvmVersion() {
		return jvmVersion;
	}

	protected void setJvmVersion(String jvmVersion) {
		this.jvmVersion = jvmVersion;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getAppVersion() {
		return appVersion;
	}

	protected void setAppVersion(String appVersion) {
		this.appVersion = appVersion;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public String getDriverHash() {
		return driverHash;
	}

	public void setDriverHash(String driverHash) {
		this.driverHash = driverHash;
	}

	@XmlElement
	@JsonView(DefaultView.class)
	public MastershipStatus getStatus() {
		return status;
	}

	public void setStatus(MastershipStatus status) {
		if (!status.equals(this.status)) {
			this.lastStatusChangeTime = System.currentTimeMillis();
		}
		this.status = status;
	}

	@XmlElement
	@JsonView(RestApiView.class)
	public long getLastSeenTime() {
		return lastSeenTime;
	}

	public void setLastSeenTime(long lastSeenTime) {
		this.lastSeenTime = lastSeenTime;
	}

	@XmlElement
	@JsonView(RestApiView.class)
	public long getLastStatusChangeTime() {
		return lastStatusChangeTime;
	}

	public void setLastStatusChangeTime(long lastStatusChangeTime) {
		this.lastStatusChangeTime = lastStatusChangeTime;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((instanceId == null) ? 0 : instanceId.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj) return true;
		if (obj == null) return false;
		if (getClass() != obj.getClass()) return false;
		ClusterMember other = (ClusterMember) obj;
		if (instanceId == null) {
			if (other.instanceId != null) return false;
		}
		else if (!instanceId.equals(other.instanceId)) return false;
		return true;
	}

	/**
	 * Two ClusterMember's are compared based on mastership priority.
	 */
	@Override
	public int compareTo(ClusterMember other) {
		int r = Long.compare(this.getMasterPriority(), other.getMasterPriority());
		if (r != 0) {
			return r;
		}
		return this.getInstanceId().compareTo(other.getInstanceId());
	}

	@Override
	public Object clone() throws CloneNotSupportedException {
		return super.clone();
	}

	@Override
	public String toString() {
		return "ClusterMember [appVersion=" + appVersion + ", clusteringVersion=" + clusteringVersion + ", driverHash="
				+ driverHash + ", instanceId=" + instanceId + ", jvmVersion=" + jvmVersion + ", lastSeenTime=" + lastSeenTime
				+ ", lastStatusChangeTime=" + lastStatusChangeTime + ", masterPriority=" + masterPriority + ", runnerPriority="
				+ runnerPriority + ", runnerWeight=" + runnerWeight + ", status=" + status + "]";
	}
}
