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
package onl.netfishers.netshot.cluster;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.TaskManager;
import onl.netfishers.netshot.TaskManager.Mode;
import onl.netfishers.netshot.cluster.ClusterMember.MastershipStatus;
import onl.netfishers.netshot.cluster.messages.AssignTasksMessage;
import onl.netfishers.netshot.cluster.messages.AutoSnapshotMessage;
import onl.netfishers.netshot.cluster.messages.ClusterMessage;
import onl.netfishers.netshot.cluster.messages.HelloClusterMessage;
import onl.netfishers.netshot.cluster.messages.LoadTasksMessage;
import onl.netfishers.netshot.cluster.messages.ReloadDriversMessage;
import onl.netfishers.netshot.database.Database;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.rest.RestService;
import onl.netfishers.netshot.rest.RestViews.ClusteringView;
import onl.netfishers.netshot.work.tasks.TakeSnapshotTask;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.ObjectWriter;

import lombok.extern.slf4j.Slf4j;

import org.postgresql.PGConnection;
import org.postgresql.PGNotification;

/**
 * Cluster Manager - main component of clustering feature
 */
@Slf4j
public class ClusterManager extends Thread {

	/** Name of the PSQL notification channel */
	final private static String NOTIFICATION_CHANNEL = "clustering";

	/** Netshot clustering version */
	final protected static int CLUSTERING_VERSION = 1;

	/** Timers */
	final private static int HELLO_INTERVAL = 6000;
	final private static int NEGOTIATING_HELLO_INTERVAL = 2000;
	final private static int HELLO_HOLDTIME = 30000;
	final private static int HELLO_DRIFTTIME = 30000;
	final private static int NEGOTIATION_DURATION = 25000;
	final private static int RECEIVE_TIMEOUT = 2000;

	/** Cluster Manager static instance */
	private static ClusterManager nsClusterManager = null;

	/** Whether a driver reload was just requested. */
	private boolean driverReloadRequested = false;

	/** Whether the task manager is requesting other servers to load and execute waiting tasks. */
	private boolean loadTasksRequested = false;

	/** Whether a member is requesting the cluster master to assign new tasks. */
	private boolean assignTasksRequested = false;

	/** IDs of devices to request auto snapshots for */
	private Set<Long> autoSnapshotDeviceIds = new HashSet<>();

	/**
	 * Initializes the cluster manager.
	 */
	public static void init() {
		if (!Netshot.getConfig("netshot.cluster.enabled", false)) {
			log.info("High Availability is not enabled.");
			return;
		}

		TaskManager.setMode(Mode.CLUSTER_MEMBER);
		nsClusterManager = new ClusterManager();
		nsClusterManager.start();
	}

	/**
	 * Gets the local cluster member instance ID.
	 * @return the local instance ID
	 */
	public static String getLocalInstanceId() {
		if (nsClusterManager != null) {
			return nsClusterManager.localMember.getInstanceId();
		}
		return null;
	}

	/**
	 * Gets the list of cluster members for external use
	 * @return the cluster members
	 */
	public static List<ClusterMember> getClusterMembers() {
		List<ClusterMember> members = new ArrayList<>();
		if (ClusterManager.nsClusterManager != null) {
			for (ClusterMember member : ClusterManager.nsClusterManager.members.values()) {
				try {
					members.add((ClusterMember) member.clone());
				}
				catch (CloneNotSupportedException e) {
					// Shouldn't happen
				}
			}
		}
		return members;
	}

	/**
	 * Request driver reload on all cluster members.
	 */
	public static void requestDriverReload() {
		if (nsClusterManager != null) {
			nsClusterManager.driverReloadRequested = true;
		}
	}

	/**
	 * Request all runners to load and execute new tasks.
	 */
	public static void requestTasksLoad() {
		if (nsClusterManager != null) {
			nsClusterManager.loadTasksRequested = true;
		}
		TaskManager.scheduleLocalTasks();
	}

	/**
	 * Request the master to assign new tasks.
	 */
	public static void requestTasksAssignment() {
		if (nsClusterManager != null) {
			nsClusterManager.assignTasksRequested = true;
		}
	}

	/**
	 * Add a device ID to the list of IDs to request the master snapshots.
	 * @param deviceId the device ID
	 */
	public static void requestAutoSnapshot(Long deviceId) {
		if (nsClusterManager != null) {
			synchronized (nsClusterManager.autoSnapshotDeviceIds) {
				nsClusterManager.autoSnapshotDeviceIds.add(deviceId);
			}
		}
	}

	/** JSON reader */
	private ObjectReader jsonReader;

	/** JSON writer */
	private ObjectWriter jsonWriter;

	/** Local cluster member  */
	private ClusterMember localMember;

	/** Last master member  */
	private ClusterMember master;

	/** All cluster members */
	private Map<String, ClusterMember> members;

	/** Time (epoch) of last hello message sent */
	private long lastSentHelloTime;

	/**
	 * Default constructor
	 */
	public ClusterManager() {
		ObjectMapper jsonMapper = new ObjectMapper();
		this.jsonReader = jsonMapper.readerWithView(ClusteringView.class);
		this.jsonWriter = jsonMapper.writerWithView(ClusteringView.class);
		this.members = new ConcurrentHashMap<>();
		this.master = null;
		this.lastSentHelloTime = 0L;


		String jvmVersion = System.getProperty("java.vm.version");
		int masterPriority = Netshot.getConfig("netshot.cluster.master.priority", 100);
		int runnerPriority = Netshot.getConfig("netshot.cluster.runner.priority", 100);
		int runnerWeight = Netshot.getConfig("netshot.cluster.runner.weight", 100);
		if (runnerWeight < 1 || runnerWeight > 1000) {
			log.error("Invalid value {} for runner weight, will use 100 by default", runnerWeight);;
			runnerWeight = 100;
		}

		String localId = Netshot.getConfig("netshot.cluster.id");
		if (localId != null) {
			// First option: configured ID
			if (!localId.matches("^[0-9a-z]{20}$")) {
				log.error("Invalid netshot.cluster.id parameter (invalid format), will generate one");
				localId = null;
			}
		}
		if (localId == null) {
			// Second option: based on MAC address and REST port
			try {
				InetAddress mainAddress = InetAddress.getLocalHost();
				NetworkInterface networkInterface = NetworkInterface.getByInetAddress(mainAddress);
				byte[] mainMac = networkInterface.getHardwareAddress();
				if (mainMac != null && mainMac.length == 6 && (mainMac[0] != 0 || mainMac[1] != 0
						|| mainMac[2] != 0 || mainMac[3] != 0 || mainMac[4] != 0 || mainMac[5] != 0)) {
					localId = String.format("01ff%02x%02x%02x%02x%02x%02x%04x",
						mainMac[0], mainMac[1], mainMac[2], mainMac[3], mainMac[4], mainMac[5], RestService.getRestPort());
					log.info("Cluster ID {} was automatically generated based on main local MAC address", localId);
				}
			}
			catch (Exception e) {
				log.debug("Error while generating cluster ID based on MAC address", e);
			}
		}
		if (localId == null) {
			// Last resort: random
			byte[] randomBase = new byte[6];
			new Random().nextBytes(randomBase);
			localId = String.format("09ff%02x%02x%02x%02x%02x%02x0000",
			randomBase[0], randomBase[1], randomBase[2], randomBase[3], randomBase[4], randomBase[5]);
			log.warn("Cluster ID {} was randomly generated - you should rather configure netshot.cluster.id",
				localId);
		}

		this.localMember = new ClusterMember(localId, Netshot.getHostname(), ClusterManager.CLUSTERING_VERSION,
			masterPriority, runnerPriority, runnerWeight, Netshot.VERSION, jvmVersion, DeviceDriver.getAllDriverHash());
		this.members.put(localId, this.localMember);
	}

	/**
	 * Send a cluster message (through the PostgreSQL notification system).
	 * @param connection
	 * @param message
	 * @throws SQLException
	 */
	private void sendMessage(Connection connection, ClusterMessage message) throws SQLException {
		try (Statement statement = connection.createStatement()) {
			String content = this.jsonWriter.forType(ClusterMessage.class).writeValueAsString(message);
			// Can't make it work with a prepared statement so escape the quotes
			content = content.replace("'", "''");
			if (content.length() > 7999) {
				log.error("Cluster message {} is too long, cannot send it", message.getClass().getSimpleName());
			}
			else {
				log.trace("Sending message to {}: {}", ClusterManager.NOTIFICATION_CHANNEL, content);
				statement.execute(String.format("NOTIFY %s, '%s'", ClusterManager.NOTIFICATION_CHANNEL, content));
			}
		}
		catch (JsonProcessingException e) {
			log.error("Can't serialize Hello cluster message");
		}
	}

	/**
	 * Receive cluster message(s) (from the PostgreSQL notification system).
	 * @param connection
	 * @return
	 * @throws SQLException
	 */
	private List<ClusterMessage> receiveMessages(PGConnection pgConnection) throws SQLException {
		List<ClusterMessage> messages = new ArrayList<>();
		// Process all pending notifications
		PGNotification notifications[] = pgConnection.getNotifications(RECEIVE_TIMEOUT);
		if (notifications != null) {
			for (PGNotification notification : notifications) {
				log.trace("Received notification (name {}): {}", notification.getName(), notification.getParameter());
				try {
					ClusterMessage message = this.jsonReader.forType(ClusterMessage.class)
						.readValue(notification.getParameter());
					if (message.getInstanceId().equals(this.localMember.getInstanceId())) {
						if (message instanceof HelloClusterMessage) {
							String receivedHostname = ((HelloClusterMessage) message).getMemberInfo().getHostname();
							if (!this.localMember.getHostname().equals(receivedHostname)) {
								log.error(
									"Received hello message from our instance ID but with different hostname ({})... please check cluster member ID conflict",
									receivedHostname);
							}
						}
						// Ignore my own messages
						continue;
					}
					messages.add(message);
				}
				catch (JsonProcessingException e) {
					log.error("Error while parsing PGSQL notification as cluster message", e);
				}
			}
		}
		return messages;
	}


	/**
	 * Main cluster thread code.
	 */
	@Override
	public void run() {
		// Reconnection with exponential backoff
		int bhFactor = 0;
		boolean memberUpdated = true;
		boolean runnerChanged = true;

		while (true) {
			// Reconnection loop
			try {
				Thread.sleep(500 * bhFactor);
			}
			catch (InterruptedException e) {
				log.error("ClusterManager got InterruptedException", e);
			}
			try (Connection dbConnection = Database.getConnection(false)) {
				PGConnection pgConnection = dbConnection.unwrap(PGConnection.class);

				try (Statement listenStatement = dbConnection.createStatement()) {
					listenStatement.execute(String.format("LISTEN %s", ClusterManager.NOTIFICATION_CHANNEL));
				}

				while (true) {
					// Wait a bit
					Thread.sleep(1000);
					// Main loop
					long nextHelloTime = lastSentHelloTime + HELLO_INTERVAL;
					if (MastershipStatus.NEGOTIATING.equals(this.localMember.getStatus())) {
						nextHelloTime = lastSentHelloTime + NEGOTIATING_HELLO_INTERVAL;
					}
					if (System.currentTimeMillis() > nextHelloTime) {
						HelloClusterMessage helloMessage = new HelloClusterMessage(this.localMember);
						this.sendMessage(dbConnection, helloMessage);
						this.lastSentHelloTime = System.currentTimeMillis();
					}
					if (MastershipStatus.MASTER.equals(this.localMember.getStatus())) {
						if (this.driverReloadRequested) {
							ReloadDriversMessage reloadMessage = new ReloadDriversMessage(this.localMember);
							this.sendMessage(dbConnection, reloadMessage);
						}
						this.driverReloadRequested = false;
						if (this.loadTasksRequested) {
							LoadTasksMessage taskMessage = new LoadTasksMessage(this.localMember);
							this.sendMessage(dbConnection, taskMessage);
						}
						this.loadTasksRequested = false;
					}
					else {
						if (this.assignTasksRequested) {
							AssignTasksMessage taskMessage = new AssignTasksMessage(this.localMember);
							this.sendMessage(dbConnection, taskMessage);
						}
						this.assignTasksRequested = false;
						AutoSnapshotMessage snapshotMessage = null;
						synchronized (this.autoSnapshotDeviceIds) {
							if (this.autoSnapshotDeviceIds.size() > 0) {
								snapshotMessage = new AutoSnapshotMessage(this.localMember);
								snapshotMessage.addDeviceIds(this.autoSnapshotDeviceIds);
							}
							this.autoSnapshotDeviceIds.clear();
						}
						if (snapshotMessage != null) {
							this.sendMessage(dbConnection, snapshotMessage);
						}
					}
					try (
						Statement fakeStatement = dbConnection.createStatement();
						ResultSet fakeResultSet = fakeStatement.executeQuery("SELECT 1");
					) {}
					List<ClusterMessage> messages = this.receiveMessages(pgConnection);
					synchronized (this) {
						final long currentTime = System.currentTimeMillis();
						final Set<Class<? extends ClusterMessage>> ignoreNextClasses = new HashSet<>();
						for (ClusterMessage message : messages) {
							log.trace("Clustering message received: {}", message);
							// Check time difference
							if (Math.abs(message.getCurrentTime() - currentTime) > HELLO_DRIFTTIME) {
								log.warn(
									"Seeing excessive time difference ({} vs {}) with instance {}, please check time synchronization",
									message.getCurrentTime(), currentTime, message.getInstanceId());
							}
							if (ignoreNextClasses.contains(message.getClass())) {
								log.trace("Ignored - similar message already processed");
								continue;
							}
							if (message instanceof HelloClusterMessage) {
								HelloClusterMessage helloMessage = (HelloClusterMessage) message;
								ClusterMember member = helloMessage.getMemberInfo();
								member.setLastSeenTime(System.currentTimeMillis()); // Set last seen time
								// Check clustering version
								if (member.getClusteringVersion() != ClusterManager.CLUSTERING_VERSION) {
									log.error("Incompatible clustering version {} vs local {} message received from {} - ignoring message",
										member.getClusteringVersion(), ClusterManager.CLUSTERING_VERSION, message.getInstanceId());
									continue;
								}
								ClusterMember oldMember = this.members.get(message.getInstanceId());
								if (oldMember == null || oldMember.getRunnerPriority() != member.getRunnerPriority() ||
										oldMember.getRunnerWeight() != member.getRunnerWeight()) {
									runnerChanged = true;
								}
								if (oldMember == null) {
									this.members.put(message.getInstanceId(), member);
								}
								else {
									oldMember.setHostname(member.getHostname());
									oldMember.setClusteringVersion(member.getClusteringVersion());
									oldMember.setMasterPriority(member.getMasterPriority());
									oldMember.setRunnerPriority(member.getRunnerPriority());
									oldMember.setRunnerWeight(member.getRunnerWeight());
									oldMember.setAppVersion(member.getAppVersion());
									oldMember.setJvmVersion(member.getJvmVersion());
									oldMember.setDriverHash(member.getDriverHash());
									oldMember.setStatus(member.getStatus());
									oldMember.setLastSeenTime(member.getLastSeenTime());
								}
								memberUpdated = true;
							}
							else if (message instanceof ReloadDriversMessage) {
								try {
									DeviceDriver.refreshDrivers();
									ignoreNextClasses.add(ReloadDriversMessage.class);
								}
								catch (Exception e) {
									log.error("Error while refreshing drivers", e);
								}
							}
							else if (message instanceof LoadTasksMessage) {
								try {
									TaskManager.scheduleLocalTasks();
									ignoreNextClasses.add(LoadTasksMessage.class);
								}
								catch (Exception e) {
									log.error("Error while scheduling local tasks", e);
								}
							}
							else if (message instanceof AssignTasksMessage) {
								if (MastershipStatus.MASTER.equals(this.localMember.getStatus())) {
									try {
										TaskManager.scheduleNewTasks();
										ignoreNextClasses.add(AssignTasksMessage.class);
									}
									catch (Exception e) {
										log.error("Error while assigning new tasks", e);
									}
								}
							}
							else if (message instanceof AutoSnapshotMessage) {
								if (MastershipStatus.MASTER.equals(this.localMember.getStatus())) {
									AutoSnapshotMessage snapshotMessage = (AutoSnapshotMessage) message;
									for (long deviceId : snapshotMessage.getDeviceIds()) {
										TakeSnapshotTask.scheduleSnapshotIfNeeded(deviceId);
									}
								}
							}
							else {
								log.warn("Unknown clustering message type received");
							}
						}
						// Check expired members
						for (ClusterMember member : this.members.values()) {
							if (member.equals(this.localMember)) {
								continue;
							}
							if (member.getLastSeenTime() < currentTime - HELLO_HOLDTIME &&
									!MastershipStatus.EXPIRED.equals(member.getStatus())) {
								log.warn("Member {} not seen since {}, going into EXPIRED state",
									member.getInstanceId(), member.getLastSeenTime());
								member.setStatus(MastershipStatus.EXPIRED);
								memberUpdated = true;
								runnerChanged = true;
							}
						}
						if (memberUpdated) {
							// Master election
							ClusterMember newMaster = null;
							for (ClusterMember member : this.members.values()) {
								if (MastershipStatus.MASTER.equals(member.getStatus())) {
									if (newMaster == null || member.compareTo(newMaster) > 0) {
										newMaster = member;
									}
								}
							}
							if (newMaster != null) {
								if (!newMaster.equals(this.master)) {
									log.warn("Cluster member {} is now master", newMaster);
								}
							}
							this.master = newMaster;
							memberUpdated = false;
						}
						if (runnerChanged) {
							TaskManager.setRunners(this.members.values());
							runnerChanged = false;
						}
						if (this.master == null) {
							boolean eligible = true;
							for (ClusterMember member : this.members.values()) {
								if (member.equals(this.localMember) || member.getStatus().equals(MastershipStatus.EXPIRED)) {
									continue;
								}
								if (member.compareTo(this.localMember) > 0) {
									eligible = false;
									break;
								}
							}
							if (eligible) {
								// Eligible for mastership
								if (MastershipStatus.NEGOTIATING.equals(this.localMember.getStatus())) {
									// Already in negotiating status
									if (this.localMember.getLastStatusChangeTime() + NEGOTIATION_DURATION < currentTime) {
										// Negotiation done, upgrade to master
										log.warn("Local cluster member is switching to MASTER status");
										this.localMember.setStatus(MastershipStatus.MASTER);
										this.master = this.localMember;
										TaskManager.setMode(Mode.CLUSTER_MASTER);
										TaskManager.rescheduleAll();
										TaskManager.reassignOrphanTasks();
									}
								}
								else {
									log.warn("Local cluster member is switching to NEGOTIATING status");
									this.localMember.setStatus(MastershipStatus.NEGOTIATING);
								}
							}
						}
						else {
							// Checks on the current master
							if (!MastershipStatus.MEMBER.equals(this.localMember.getStatus()) && !this.master.equals(this.localMember)) {
								// Master conflict - Downgrade to normal member
								log.warn("Local cluster member is switching to MEMBER status");
								this.localMember.setStatus(MastershipStatus.MEMBER);
								TaskManager.setMode(Mode.CLUSTER_MEMBER);
							}
						}
					}
					if (bhFactor > 0) {
						bhFactor = 0;
						log.info("ClusterManager recovered from exception state");
					}
				}
			}
			catch (SQLException | InterruptedException e) {
				log.error("ClusterManager got exception", e);
				bhFactor *= 2;
				if (bhFactor < 1) {
					bhFactor = 1;
				}
				else if (bhFactor > 32) {
					bhFactor = 32;
				}
			}
		}
	}
}
