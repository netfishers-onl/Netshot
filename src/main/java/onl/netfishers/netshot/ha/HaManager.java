package onl.netfishers.netshot.ha;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.database.Database;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import org.hibernate.Session;
import org.hibernate.jdbc.Work;
import org.postgresql.PGConnection;
import org.postgresql.PGNotification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HaManager extends Thread {

	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(HaManager.class);

	/** HA Manager static instance */
	private static HaManager nsHaManager;

	/** Netshot HA version */
	public static final int VERSION = 1;

	/** Store the JVM version for easy access for HA Message */
	protected static String JVM_VERSION;

	/** Store the local roles */
	public static Set<HaRole> LOCAL_ROLES;

	/** Store the local HA priority  */
	public static int LOCAL_PRIORITY = 65536;

	/** Store the local job runner weight */
	public static int LOCAL_WEIGHT = 100;

	/**
	 * Initializes the HA manager.
	 */
	public static void init() {
		if (!Netshot.getConfig("netshot.ha.enabled", "false").equals("true")) {
			logger.info("High Availability is not enabled.");
			return;
		}
		HaManager.JVM_VERSION = System.getProperty("java.vm.version");
		HaManager.LOCAL_PRIORITY = Netshot.getConfig("netshot.ha.priority", HaManager.LOCAL_PRIORITY);
		HaManager.LOCAL_WEIGHT = Netshot.getConfig("netshot.ha.weight", HaManager.LOCAL_WEIGHT);
		HaManager.LOCAL_ROLES = new HashSet<>();
		try {
			String strRoleList = Netshot.getConfig("netshot.ha.roles");
			String[] strRoles = strRoleList.split(",");
			for (String strRole : strRoles) {
				strRole = strRole.strip();
				HaRole role = HaRole.valueOf(strRole.toUpperCase());
				HaManager.LOCAL_ROLES.add(role);
			}
		}
		catch (IllegalArgumentException e) {
			logger.error("Invalid netshot.ha.roles parameter, using default of all roles");
			HaManager.LOCAL_ROLES = new HashSet<>(Arrays.asList(HaRole.values()));
		}

		nsHaManager = new HaManager();
		nsHaManager.start();
	}
	
	@Override
	public void run() {
		int bhFactor = 0;

		while (true) {
			try {
				Thread.sleep(500 * bhFactor);
			}
			catch (InterruptedException e) {
				logger.error("HaManager got InterruptedException", e);
			}
			try (Connection listenerConnection = Database.getConnection()) {
				PGConnection pgListenerConnection = listenerConnection.unwrap(PGConnection.class);

				try (Statement listenStatement = listenerConnection.createStatement()) {
					listenStatement.execute("LISTEN netshot_ha");
				}

				while (true) {
					try (
						Statement fakeStatement = listenerConnection.createStatement();
						ResultSet fakeResultSet = fakeStatement.executeQuery("SELECT 1");
					) {}
					PGNotification notifications[] = pgListenerConnection.getNotifications(5000);
					if (notifications != null) {
						for (PGNotification notification : notifications) {
							logger.warn("Received notification " + notification.getName());
						}
					}
					bhFactor = 0;
				}
			}
			catch (SQLException e) {
				logger.error("HaManager got SQL exception", e);
				bhFactor *= 2;
				if (bhFactor > 32) {
					bhFactor = 32;
				}
			}
		}
	}
}
