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
package net.netshot.netshot.device.script;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.HashSet;
import java.util.Set;

import javax.script.ScriptException;

import org.hibernate.Session;

import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.Device.MissingDeviceDriverException;
import net.netshot.netshot.device.NetworkAddress;
import net.netshot.netshot.device.access.AccessManager;
import net.netshot.netshot.device.access.InvalidCredentialsException;
import net.netshot.netshot.device.credentials.DeviceCredentialSet;
import net.netshot.netshot.work.TaskContext;

/**
 * Something to execute on a device.
 * <p>
 * Unlike before, connecting to the device (and iterating over candidate
 * credential sets) is no longer done up-front here: it now happens lazily,
 * per access, the first time the driver's JS code actually uses a given
 * client (see {@link AccessManager}). This class is only responsible for
 * resolving the address to connect to and building the {@link AccessManager}
 * that the JS-facing helpers will use.
 */
@Slf4j
public abstract class CliScript {

	protected transient TaskContext taskContext;

	protected CliScript(TaskContext taskContext) {
		this.taskContext = taskContext;
	}

	protected abstract void run(Session session, Device device, AccessManager accessManager)
		throws InvalidCredentialsException, IOException, ScriptException, MissingDeviceDriverException;

	public void connectRun(Session session, Device device)
		throws IOException, MissingDeviceDriverException, InvalidCredentialsException, ScriptException, MissingDeviceDriverException {
		this.connectRun(session, device, null);
	}

	public void connectRun(Session session, Device device, Set<DeviceCredentialSet> oneTimeCredentialSets)
		throws IOException, MissingDeviceDriverException, InvalidCredentialsException, ScriptException, MissingDeviceDriverException {
		device.getDeviceDriver(); // fail fast if the driver is missing

		// Resolve the device's default (management) address, used by any access
		// without its own address override (see AccessManager.resolveAddress).
		// Failure here isn't immediately fatal: an access with its own override
		// address may still be usable, so resolution is deferred - the task only
		// actually fails if a used access ends up needing this default address.
		NetworkAddress address = null;
		try {
			InetAddress resolvedMgmtAddress = InetAddress.getByName(device.getMgmtAddress());
			device.setCachedIpAddress(resolvedMgmtAddress);
			address = NetworkAddress.getNetworkAddress(resolvedMgmtAddress);
		}
		catch (UnknownHostException e) {
			log.warn("Unable to resolve management address '{}' of device {}.",
				device.getMgmtAddress(), device.getId(), e);
			this.taskContext.warn("Unable to resolve management address '{}'.", device.getMgmtAddress());
		}

		Set<DeviceCredentialSet> credentialSets = new HashSet<>();
		if (oneTimeCredentialSets != null) {
			credentialSets.addAll(oneTimeCredentialSets);
		}

		AccessManager accessManager = new AccessManager(session, device, address, this.taskContext, credentialSets);

		this.run(session, device, accessManager);
	}

}
