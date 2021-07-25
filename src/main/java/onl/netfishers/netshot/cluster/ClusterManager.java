package onl.netfishers.netshot.cluster;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.cluster.messages.ClusterMessage;
import onl.netfishers.netshot.cluster.messages.HelloClusterMessage;
import onl.netfishers.netshot.database.Database;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.ObjectWriter;

import org.postgresql.PGConnection;
import org.postgresql.PGNotification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Cluster Manager - main component of clustering feature
 */
public class ClusterManager extends Thread {

	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(ClusterManager.class);

	/** Name of the PSQL notification channel */
	final private static String NOTIFICATION_CHANNEL = "netshot_clustering";

	/** Netshot clustering version */
	final protected static int CLUSTERING_VERSION = 1;

	/** Cluster Manager static instance */
	private static ClusterManager nsClusterManager = null;

	/**
	 * Initializes the cluster manager.
	 */
	public static void init() {
		if (!Netshot.getConfig("netshot.cluster.enabled", "false").equals("true")) {
			logger.info("High Availability is not enabled.");
			return;
		}

		nsClusterManager = new ClusterManager();
		nsClusterManager.start();
	}

	/** JSON reader */
	private ObjectReader jsonReader;

	/** JSON writer */
	private ObjectWriter jsonWriter;

	/** Local cluster member  */
	private ClusterMember localMember;

	/** Cluster members (other than local) */
	private Set<ClusterMember> otherMembers;

	private long lastSentHelloTime;

	/**
	 * Default constructor
	 */
	public ClusterManager() {
		ObjectMapper jsonMapper = new ObjectMapper();
		this.jsonReader = jsonMapper.readerWithView(DefaultView.class);
		this.jsonWriter = jsonMapper.writerWithView(DefaultView.class);
		this.otherMembers = new HashSet<>();
		this.lastSentHelloTime = 0L;


		String jvmVersion = System.getProperty("java.vm.version");
		int masterPriority = Netshot.getConfig("netshot.cluster.master.priority", 100);
		int runnerPriority = Netshot.getConfig("netshot.cluster.runner.priority", 100);
		int runnerWeight = Netshot.getConfig("netshot.cluster.runner.weight", 100);

		String localId = Netshot.getConfig("netshot.cluster.id");
		if (localId != null) {
			if (!localId.matches("^[0-9a-z]{16}$")) {
				logger.error("Invalid netshot.cluster.id parameter (invalid format), will generate one");
				localId = null;
			}
		}
		if (localId == null) {
			try {
				InetAddress mainAddress = InetAddress.getLocalHost();
				NetworkInterface networkInterface = NetworkInterface.getByInetAddress(mainAddress);
				byte[] mainMac = networkInterface.getHardwareAddress();
				if (mainMac != null && mainMac.length == 6 && (mainMac[0] != 0 || mainMac[1] != 0
						|| mainMac[2] != 0 || mainMac[3] != 0 || mainMac[4] != 0 || mainMac[5] != 0)) {
					localId = String.format("01ff%02x%02x%02x%02x%02x%02x",
						mainMac[0], mainMac[1], mainMac[2], mainMac[3], mainMac[4], mainMac[5]);
					logger.info("Cluster ID %s was automatically generated based on main local MAC address",
						localId);
				}
			}
			catch (Exception e) {
				// Ignore
			}
		}
		if (localId == null) {
			byte[] randomBase = new byte[6];
			new Random().nextBytes(randomBase);
			localId = String.format("02ff%02x%02x%02x%02x%02x%02x",
			randomBase[0], randomBase[1], randomBase[2], randomBase[3], randomBase[4], randomBase[5]);
			logger.warn("Cluster ID %s was randomly generated - you should rather configure netshot.cluster.id",
				localId);
		}

		this.localMember = new ClusterMember(localId, ClusterManager.CLUSTERING_VERSION,
			masterPriority, runnerPriority, runnerWeight, Netshot.VERSION, jvmVersion);
		this.otherMembers.add(this.localMember);
	}
	
	@Override
	public void run() {
		// Reconnection with exponential backoff
		int bhFactor = 0;

		while (true) {
			// Reconnection loop
			try {
				Thread.sleep(500 * bhFactor);
			}
			catch (InterruptedException e) {
				logger.error("ClusterManager got InterruptedException", e);
			}
			try (Connection listenerConnection = Database.getConnection()) {
				PGConnection pgListenerConnection = listenerConnection.unwrap(PGConnection.class);

				try (Statement listenStatement = listenerConnection.createStatement()) {
					listenStatement.execute(String.format("LISTEN %s", ClusterManager.NOTIFICATION_CHANNEL));
				}

				while (true) {
					// Main loop
					long currentTime = System.currentTimeMillis();
					if (currentTime > lastSentHelloTime + 10000) {
						HelloClusterMessage helloMessage = new HelloClusterMessage(this.localMember);
						try (PreparedStatement helloStatement = listenerConnection.prepareStatement("NOTIFY ?, ?")) {
							String helloContent = this.jsonWriter.forType(ClusterMessage.class).writeValueAsString(helloMessage);
							if (helloContent.length() > 7999) {
								logger.error("Cluster message is too long");
							}
							helloStatement.setString(1, ClusterManager.NOTIFICATION_CHANNEL);
							helloStatement.setString(2, helloContent);
							helloStatement.execute();
						}
						catch (JsonProcessingException e) {
							logger.error("Can't serialize Hello cluster message");
						}
					}
					try (
						Statement fakeStatement = listenerConnection.createStatement();
						ResultSet fakeResultSet = fakeStatement.executeQuery("SELECT 1");
					) {}
					while (true) {
						// Process all pending notifications
						PGNotification notifications[] = pgListenerConnection.getNotifications(2000);
						if (notifications == null) {
							break;
						}
						else {
							for (PGNotification notification : notifications) {
								logger.warn("Received notification " + notification.getName());
								try {
									ClusterMessage message = this.jsonReader.forType(ClusterMessage.class)
										.readValue(notification.getParameter());
								}
								catch (JsonProcessingException e) {
									logger.error("Error while parsing PGSQL notification as cluster message", e);
								}
							}
						}
					}
					bhFactor = 0;
				}
			}
			catch (SQLException e) {
				logger.error("ClusterManager got SQL exception", e);
				bhFactor *= 2;
				if (bhFactor > 32) {
					bhFactor = 32;
				}
			}
		}
	}
}
