/**
 * Copyright 2013-2025 Netshot
 *
 * This file is part of Netshot project.
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
package net.netshot.netshot;

import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.DeviceDriver.AccessDefinition;
import net.netshot.netshot.device.DeviceDriver.DriverProtocol;
import net.netshot.netshot.device.Domain;
import net.netshot.netshot.device.access.AccessAuthenticationException;
import net.netshot.netshot.device.access.AccessManager;
import net.netshot.netshot.device.access.AccessManager.Resolution;
import net.netshot.netshot.device.access.Client;
import net.netshot.netshot.device.access.InvalidCredentialsException;
import net.netshot.netshot.device.credentials.DeviceCredentialSet;
import net.netshot.netshot.device.credentials.DeviceSshAccount;
import net.netshot.netshot.device.credentials.DeviceTelnetAccount;

/**
 * Unit tests for {@link AccessManager}, the generalized lazy connect +
 * credential-set fallback engine that replaced the triplicated SSH/Telnet/SNMP
 * loops previously duplicated in {@code CliScript.connectRun}.
 */
public class AccessManagerTest {

	/** A minimal fake {@link Client} whose connect() behavior is scripted by the test. */
	private static final class FakeClient implements Client {
		private final AtomicInteger connectCount;
		private final IOException failure;
		boolean connected = false;

		FakeClient(AtomicInteger connectCount, IOException failure) {
			this.connectCount = connectCount;
			this.failure = failure;
		}

		@Override
		public void connect() throws IOException {
			this.connectCount.incrementAndGet();
			if (this.failure != null) {
				throw this.failure;
			}
			this.connected = true;
		}

		@Override
		public void disconnect() {
			this.connected = false;
		}
	}

	private static AccessDefinition sshAccess(String name) {
		return new AccessDefinition(name, DriverProtocol.SSH, null, null, null, null, null, 22);
	}

	private static AccessDefinition telnetAccess(String name) {
		return new AccessDefinition(name, DriverProtocol.TELNET, null, null, null, null, null, 23);
	}

	private static Device fakeDevice() {
		Domain domain = new Domain("Test domain", "Fake domain for tests", null, null);
		return new Device("CiscoIOS12", null, domain, "test");
	}

	@Test
	@DisplayName("Resolution is lazy: no connect() attempt happens before first use")
	void resolutionIsLazy() throws IOException {
		Device device = fakeDevice();
		DeviceCredentialSet cred = new DeviceSshAccount("admin", "admin", null, "cred1");
		device.getCredentialSets().add(cred);

		AtomicInteger connectCount = new AtomicInteger(0);
		AccessManager manager = new AccessManager(null, device, null, new FakeTaskContext(), null);
		Resolution resolution = manager.newResolution(List.of(sshAccess("ssh")),
			(accessDef, credentialSet) -> new FakeClient(connectCount, null));

		Assertions.assertEquals(0, connectCount.get(), "No connection attempt should happen before first use");
		Assertions.assertNull(resolution.getCurrentClient());

		resolution.ensureResolved(true);
		Assertions.assertEquals(1, connectCount.get(), "Exactly one connection attempt should happen on first use");
	}

	@Test
	@DisplayName("Auto-try cycles through device-scoped credentials in order, without mutating the pool on a scoped success")
	void autoTryCyclesScopedCredentials() throws IOException {
		Device device = fakeDevice();
		DeviceCredentialSet credA = new DeviceSshAccount("admin", "wrong", null, "credA");
		DeviceCredentialSet credB = new DeviceSshAccount("admin", "right", null, "credB");
		device.setCredentialSets(new LinkedHashSet<>(List.of(credA, credB)));

		AtomicInteger connectCount = new AtomicInteger(0);
		AccessManager manager = new AccessManager(null, device, null, new FakeTaskContext(), null);
		Resolution resolution = manager.newResolution(List.of(sshAccess("ssh")), (accessDef, credentialSet) -> {
			if (credentialSet == credA) {
				return new FakeClient(connectCount, new InvalidCredentialsException("bad password"));
			}
			return new FakeClient(connectCount, null);
		});

		Client client = resolution.ensureResolved(true);
		Assertions.assertNotNull(client);
		Assertions.assertEquals(credB, resolution.getCurrentCredentialSet(), "Should have connected using credB");
		Assertions.assertEquals(2, connectCount.get(), "Both credentials should have been attempted (credA then credB)");

		// A scoped (device-pool) success must NOT trigger the "remember what worked" mutation:
		// both credentials should still be present in the device's own pool.
		Assertions.assertTrue(device.getCredentialSets().contains(credA),
			"credA should still be in the device's credential pool (no rewrite on scoped success)");
		Assertions.assertTrue(device.getCredentialSets().contains(credB),
			"credB should still be in the device's credential pool");
	}

	@Test
	@DisplayName("A non-auth IOException aborts remaining candidates of that access, but a different access is still tried")
	void connectFailureAbortsOnlyThatAccess() throws IOException {
		Device device = fakeDevice();
		DeviceCredentialSet sshCred = new DeviceSshAccount("admin", "admin", null, "sshCred");
		DeviceCredentialSet telnetCred = new DeviceTelnetAccount("admin", "admin", null, "telnetCred");
		device.getCredentialSets().add(sshCred);
		device.getCredentialSets().add(telnetCred);

		AtomicInteger connectCount = new AtomicInteger(0);
		AccessManager manager = new AccessManager(null, device, null, new FakeTaskContext(), null);
		Resolution resolution = manager.newResolution(List.of(sshAccess("ssh"), telnetAccess("telnet")),
			(accessDef, credentialSet) -> {
				if ("ssh".equals(accessDef.getName())) {
					return new FakeClient(connectCount, new IOException("connection refused"));
				}
				return new FakeClient(connectCount, null);
			});

		Client client = resolution.ensureResolved(true);
		Assertions.assertNotNull(client);
		Assertions.assertEquals("telnet", resolution.getCurrentAccessDef().getName(),
			"Should have fallen back to the Telnet access after SSH was unreachable");
		Assertions.assertEquals(telnetCred, resolution.getCurrentCredentialSet());
	}

	@Test
	@DisplayName("Manual mode (autoTryCredentials=false) surfaces an AccessAuthenticationException instead of auto-cycling")
	void manualModeSurfacesAuthFailure() throws IOException {
		Device device = fakeDevice();
		DeviceCredentialSet credA = new DeviceSshAccount("admin", "wrong", null, "credA");
		DeviceCredentialSet credB = new DeviceSshAccount("admin", "right", null, "credB");
		device.setCredentialSets(new LinkedHashSet<>(List.of(credA, credB)));

		AtomicInteger connectCount = new AtomicInteger(0);
		AccessManager manager = new AccessManager(null, device, null, new FakeTaskContext(), null);
		Resolution resolution = manager.newResolution(List.of(sshAccess("ssh")), (accessDef, credentialSet) -> {
			if (credentialSet == credA) {
				return new FakeClient(connectCount, new InvalidCredentialsException("bad password"));
			}
			return new FakeClient(connectCount, null);
		});

		Assertions.assertThrows(AccessAuthenticationException.class, () -> resolution.ensureResolved(false),
			"The first (failing) candidate should surface as a catchable authentication error, not auto-cycle");
		Assertions.assertEquals(1, connectCount.get(), "Only the first candidate should have been tried so far");
		Assertions.assertNull(resolution.getCurrentClient());

		boolean advanced = resolution.tryNextCredentials();
		Assertions.assertTrue(advanced, "tryNextCredentials() should move to credB and succeed");
		Assertions.assertEquals(credB, resolution.getCurrentCredentialSet());
		Assertions.assertEquals(2, connectCount.get());
	}

	@Test
	@DisplayName("Exhausting all candidates without any credential configured throws immediately")
	void noCredentialsConfigured() {
		Device device = fakeDevice();
		device.setAutoTryCredentials(false);
		AccessManager manager = new AccessManager(null, device, null, new FakeTaskContext(), null);
		Resolution resolution = manager.newResolution(List.of(sshAccess("ssh")),
			(accessDef, credentialSet) -> new FakeClient(new AtomicInteger(), null));

		Assertions.assertThrows(InvalidCredentialsException.class, () -> resolution.ensureResolved(true));
	}

}
