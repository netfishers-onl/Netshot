package onl.netfishers.netshot.cluster;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlAccessorType(value = XmlAccessType.NONE)
@XmlRootElement()
public class ClusterMember {

	/**
	 * Mastership status of a cluster member
	 */
	public static enum MastershipStatus {
		MASTER,
		MEMBER,
		NEGOTIATING,
	}

	/** Cluster member unique ID */
	private String instanceId;

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

	/**
	 * Default constructor
	 */
	public ClusterMember(String instanceId, int clusteringVersion, int masterPriority,
			int runnerPriority, int runnerWeight, String appVersion, String jvmVersion) {
		this.instanceId = instanceId;
		this.clusteringVersion = clusteringVersion;
		this.masterPriority = masterPriority;
		this.runnerPriority = runnerPriority;
		this.runnerWeight = runnerWeight;
		this.appVersion = appVersion;
		this.jvmVersion = jvmVersion;
		this.status = MastershipStatus.NEGOTIATING;
	}

	@XmlElement
	public String getInstanceId() {
		return instanceId;
	}

	protected void setInstanceId(String instanceId) {
		this.instanceId = instanceId;
	}

	@XmlElement
	public int getClusteringVersion() {
		return clusteringVersion;
	}

	protected void setClusteringVersion(int clusteringVersion) {
		this.clusteringVersion = clusteringVersion;
	}

	@XmlElement
	public int getMasterPriority() {
		return masterPriority;
	}

	protected void setMasterPriority(int masterPriority) {
		this.masterPriority = masterPriority;
	}

	@XmlElement
	public int getRunnerPriority() {
		return runnerPriority;
	}

	public void setRunnerPriority(int runnerPriority) {
		this.runnerPriority = runnerPriority;
	}

	@XmlElement
	public int getRunnerWeight() {
		return runnerWeight;
	}

	protected void setRunnerWeight(int runnerWeight) {
		this.runnerWeight = runnerWeight;
	}

	@XmlElement
	public String getJvmVersion() {
		return jvmVersion;
	}

	protected void setJvmVersion(String jvmVersion) {
		this.jvmVersion = jvmVersion;
	}

	@XmlElement
	public String getAppVersion() {
		return appVersion;
	}

	protected void setAppVersion(String appVersion) {
		this.appVersion = appVersion;
	}

	@XmlElement
	public String getDriverHash() {
		return driverHash;
	}

	public void setDriverHash(String driverHash) {
		this.driverHash = driverHash;
	}

	@XmlElement
	public MastershipStatus getStatus() {
		return status;
	}

	public void setStatus(MastershipStatus status) {
		this.status = status;
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
}
