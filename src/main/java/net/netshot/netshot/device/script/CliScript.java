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
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import javax.script.ScriptException;

import org.hibernate.Session;

import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.Device.InvalidCredentialsException;
import net.netshot.netshot.device.Device.MissingDeviceDriverException;
import net.netshot.netshot.device.DeviceDriver;
import net.netshot.netshot.device.DeviceDriver.DriverProtocol;
import net.netshot.netshot.device.Network4Address;
import net.netshot.netshot.device.access.Cli;
import net.netshot.netshot.device.access.Snmp;
import net.netshot.netshot.device.access.Ssh;
import net.netshot.netshot.device.access.Telnet;
import net.netshot.netshot.device.credentials.DeviceCliAccount;
import net.netshot.netshot.device.credentials.DeviceCredentialSet;
import net.netshot.netshot.device.credentials.DeviceSnmpCommunity;
import net.netshot.netshot.device.credentials.DeviceSshAccount;
import net.netshot.netshot.device.credentials.DeviceSshKeyAccount;
import net.netshot.netshot.device.credentials.DeviceTelnetAccount;
import net.netshot.netshot.work.TaskLogger;

/**
 * Something to execute on a device.
 */
@Slf4j
public abstract class CliScript {

	protected transient TaskLogger taskLogger;

	protected CliScript(TaskLogger taskLogger) {
		this.taskLogger = taskLogger;
	}

	/**
	 * Wait a bit between authentication attempts.
	 */
	private void waitBetweenAttempts() {
		try {
			Thread.sleep(1000);
		}
		catch (InterruptedException e) {
			// Ignore
		}
	}

	protected abstract void run(Session session, Device device, Cli cli, Snmp snmp, DriverProtocol protocol, DeviceCredentialSet account)
		throws InvalidCredentialsException, IOException, ScriptException, MissingDeviceDriverException;

	public void connectRun(Session session, Device device)
		throws IOException, MissingDeviceDriverException, InvalidCredentialsException, ScriptException, MissingDeviceDriverException {
		this.connectRun(session, device, null);
	}

	public void connectRun(Session session, Device device, Set<DeviceCredentialSet> oneTimeCredentialSets)
		throws IOException, MissingDeviceDriverException, InvalidCredentialsException, ScriptException, MissingDeviceDriverException {
		DeviceDriver deviceDriver = device.getDeviceDriver();

		boolean sshOpened = deviceDriver.getProtocols().contains(DriverProtocol.SSH);
		boolean telnetOpened = deviceDriver.getProtocols().contains(DriverProtocol.TELNET);
		boolean snmpWorth = deviceDriver.getProtocols().contains(DriverProtocol.SNMP);
		boolean sshTried = false;
		boolean telnetTried = false;

		Network4Address address = device.getConnectAddress();
		if (address == null) {
			address = device.getMgmtAddress();
		}
		Set<DeviceCredentialSet> credentialSets = new HashSet<>();
		if (oneTimeCredentialSets != null) {
			credentialSets.addAll(oneTimeCredentialSets);
		}
		if (credentialSets.size() == 0 && device.getSpecificCredentialSet() != null) {
			credentialSets.add(device.getSpecificCredentialSet());
		}
		if (credentialSets.size() == 0) {
			credentialSets.addAll(device.getCredentialSets());
		}

		int sshPort = device.getSshPort();
		if (sshPort == 0) {
			sshPort = Ssh.DEFAULT_PORT;
		}
		int telnetPort = device.getTelnetPort();
		if (telnetPort == 0) {
			telnetPort = Telnet.DEFAULT_PORT;
		}

		if (sshOpened) {
			for (DeviceCredentialSet credentialSet : credentialSets) {
				if (credentialSet instanceof DeviceSshAccount) {
					final Ssh cli;
					if (credentialSet instanceof DeviceSshKeyAccount) {
						cli = new Ssh(address, sshPort, ((DeviceSshKeyAccount) credentialSet).getUsername(),
							((DeviceSshKeyAccount) credentialSet).getPublicKey(),
							((DeviceSshKeyAccount) credentialSet).getPrivateKey(),
							((DeviceSshKeyAccount) credentialSet).getPassword(),
							this.taskLogger);
					}
					else {
						cli = new Ssh(address, sshPort, ((DeviceSshAccount) credentialSet).getUsername(),
							((DeviceSshAccount) credentialSet).getPassword(), this.taskLogger);
					}
					try {
						sshTried = true;
						cli.applySshConfig(deviceDriver.getSshConfig());
						this.taskLogger.info("Trying SSH to {}:{} using credentials {}.",
							address.getIp(), sshPort, credentialSet.getName());
						cli.connect();
						this.taskLogger.info("Connected using SSH to {}:{} using credentials {}.",
							address.getIp(), sshPort, credentialSet.getName());
						this.run(session, device, cli, null, DriverProtocol.SSH, (DeviceCliAccount) credentialSet);
						return;
					}
					catch (InvalidCredentialsException e) {
						this.taskLogger.warn("Authentication failed using SSH credential set {}.",
							credentialSet.getName());
						this.waitBetweenAttempts();
					}
					catch (ScriptException e) {
						throw e;
					}
					catch (IOException e) {
						log.warn("Error while opening SSH connection to {}:{}.", address.getIp(), sshPort, e);
						if ("No more authentication methods available".equals(e.getMessage())
							|| "Protocol error: expected packet type 61, got 50".equals(e.getMessage())) {
							this.taskLogger.warn("Authentication failed {}:{} using SSH credential set {}.",
								address.getIp(), sshPort, credentialSet.getName());
							this.waitBetweenAttempts();
						}
						else {
							this.taskLogger.warn("Unable to connect using SSH to {}:{}: {}",
								address.getIp(), sshPort, e.getMessage());
							sshOpened = false;
							break;
						}
					}
					finally {
						cli.disconnect();
					}
				}
			}
		}
		if (telnetOpened) {
			for (DeviceCredentialSet credentialSet : credentialSets) {
				if (credentialSet instanceof DeviceTelnetAccount) {
					final Telnet cli = new Telnet(address, telnetPort, this.taskLogger);
					try {
						telnetTried = true;
						cli.setTelnetConfig(deviceDriver.getTelnetConfig());
						this.taskLogger.info("Trying Telnet to {}:{} with credentials {}.",
							address.getIp(), telnetPort, credentialSet.getName());
						cli.connect();
						this.taskLogger.info("Connected using Telnet to {}:{}.", address.getIp(), telnetPort);
						this.run(session, device, cli, null, DriverProtocol.TELNET, (DeviceCliAccount) credentialSet);
						return;
					}
					catch (InvalidCredentialsException e) {
						this.taskLogger.warn("Authentication failed using Telnet credentials {}.", credentialSet.getName());
						this.waitBetweenAttempts();
					}
					catch (ScriptException e) {
						throw e;
					}
					catch (IOException e) {
						log.warn("Unable to open a Telnet connection to {}:{}.", address.getIp(), telnetPort, e);
						this.taskLogger.warn("Unable to open a Telnet socket to {}:{}.", address.getIp(), telnetPort);
						telnetOpened = false;
						break;
					}
					finally {
						cli.disconnect();
					}
				}
			}
		}
		if (snmpWorth) {
			for (DeviceCredentialSet credentialSet : credentialSets) {
				if (credentialSet instanceof DeviceSnmpCommunity) {
					Snmp poller = new Snmp(address, (DeviceSnmpCommunity) credentialSet);
					try {
						try {
							poller.getAsString("1.3.6.1.2.1.1.3.0"); /* sysUptime.0 */
						}
						catch (IOException e1) {
							if (!e1.getMessage().contains("noSuchObject")) {
								throw e1;
							}
						}
						this.run(session, device, null, poller, DriverProtocol.SNMP, credentialSet);
						return;
					}
					catch (IOException e) {
						log.warn("Unable to poll {} using SNMP credential set {}", address.getIp(), credentialSet.getName());
						this.taskLogger.warn("Unable to poll {} using SNMP credentials {}", address.getIp(), credentialSet.getName());
					}
					finally {
						poller.stop();
					}
				}
			}
		}
		if (device.isAutoTryCredentials() && (sshOpened || telnetOpened || snmpWorth)) {
			List<DeviceCredentialSet> globalCredentialSets = device.getAutoCredentialSetList(session);
			if (sshOpened) {
				for (DeviceCredentialSet credentialSet : globalCredentialSets) {
					if (credentialSet instanceof DeviceSshAccount) {
						this.taskLogger.info("Auto-trying SSH with credentials {}.", credentialSet.getName());
						Ssh cli;
						if (credentialSet instanceof DeviceSshKeyAccount) {
							cli = new Ssh(address, sshPort, ((DeviceSshKeyAccount) credentialSet).getUsername(),
								((DeviceSshKeyAccount) credentialSet).getPublicKey(),
								((DeviceSshKeyAccount) credentialSet).getPrivateKey(),
								((DeviceSshKeyAccount) credentialSet).getPassword(),
								this.taskLogger);
						}
						else {
							cli = new Ssh(address, sshPort, ((DeviceSshAccount) credentialSet).getUsername(),
								((DeviceSshAccount) credentialSet).getPassword(), this.taskLogger);
						}
						try {
							sshTried = true;
							cli.applySshConfig(deviceDriver.getSshConfig());
							cli.connect();
							this.taskLogger.info("Connected using SSH to {}:{} using credentials {}.",
								address.getIp(), sshPort, credentialSet.getName());
							this.run(session, device, cli, null, DriverProtocol.SSH, (DeviceCliAccount) credentialSet);
							Iterator<DeviceCredentialSet> ci = credentialSets.iterator();
							while (ci.hasNext()) {
								DeviceCredentialSet c = ci.next();
								if (c instanceof DeviceCliAccount) {
									ci.remove();
								}
							}
							credentialSets.add(credentialSet);
							return;
						}
						catch (InvalidCredentialsException e) {
							this.taskLogger.warn("Authentication failed using SSH credentials {}.", credentialSet.getName());
							this.waitBetweenAttempts();
						}
						catch (ScriptException e) {
							throw e;
						}
						catch (IOException e) {
							log.warn("Error while opening SSH connection to {}:{}.", address.getIp(), sshPort, e);
							if ("No more authentication methods available".equals(e.getMessage())
								|| "Protocol error: expected packet type 61, got 50".equals(e.getMessage())) {
								this.taskLogger.warn("Authentication failed {}:{} using SSH credential {}.",
									address.getIp(), sshPort, credentialSet.getName());
								this.waitBetweenAttempts();
							}
							else {
								this.taskLogger.warn("Unable to connect using SSH to {}:{}: {}",
									address.getIp(), sshPort, e.getMessage());
								break;
							}
						}
						finally {
							cli.disconnect();
						}
					}
				}
			}
			if (telnetOpened) {
				for (DeviceCredentialSet credentialSet : globalCredentialSets) {
					if (credentialSet instanceof DeviceTelnetAccount) {
						this.taskLogger.info("Auto-trying Telnet with credentials {}.", credentialSet.getName());
						final Telnet cli = new Telnet(address, telnetPort, this.taskLogger);
						try {
							telnetTried = true;
							cli.setTelnetConfig(deviceDriver.getTelnetConfig());
							cli.connect();
							this.taskLogger.info("Connected using Telnet to {}:{}.", address.getIp(), telnetPort);
							this.run(session, device, cli, null, DriverProtocol.TELNET, (DeviceCliAccount) credentialSet);
							Iterator<DeviceCredentialSet> ci = credentialSets.iterator();
							while (ci.hasNext()) {
								DeviceCredentialSet c = ci.next();
								if (c instanceof DeviceCliAccount) {
									ci.remove();
								}
							}
							credentialSets.add(credentialSet);
							return;
						}
						catch (InvalidCredentialsException e) {
							this.taskLogger.warn("Authentication failed using Telnet credentials {}.", credentialSet.getName());
							this.waitBetweenAttempts();
						}
						catch (ScriptException e) {
							throw e;
						}
						catch (IOException e) {
							log.warn("Unable to open a Telnet connection to {}:{}.", address.getIp(), telnetPort, e);
							this.taskLogger.warn("Unable to open a Telnet socket to {}:{}.", address.getIp(), telnetPort);
							telnetOpened = false;
							break;
						}
						finally {
							cli.disconnect();
						}
					}
				}
			}
			if (snmpWorth) {
				for (DeviceCredentialSet credentialSet : globalCredentialSets) {
					if (credentialSet instanceof DeviceSnmpCommunity) {
						this.taskLogger.trace("Will try SNMP credentials {}.", credentialSet.getName());
						Snmp poller = new Snmp(address, (DeviceSnmpCommunity) credentialSet);
						try {
							try {
								poller.getAsString("1.3.6.1.2.1.1.3.0"); /* sysUptime.0 */
							}
							catch (IOException e1) {
								if (!e1.getMessage().contains("noSuchObject")) {
									throw e1;
								}
							}
							this.run(session, device, null, poller, DriverProtocol.SNMP, credentialSet);
							Iterator<DeviceCredentialSet> ci = credentialSets.iterator();
							while (ci.hasNext()) {
								DeviceCredentialSet c = ci.next();
								if (c instanceof DeviceSnmpCommunity) {
									ci.remove();
								}
							}
							credentialSets.add(credentialSet);
							return;
						}
						catch (IOException e) {
							log.warn("Unable to poll {} using SNMP credential set {}", address.getIp(), credentialSet.getName());
							this.taskLogger.warn("Unable to poll {} using SNMP credential set {}", address.getIp(), credentialSet.getName());
							break;
						}
						finally {
							poller.stop();
						}
					}
				}

			}
		}
		if ((sshTried && !sshOpened && !telnetTried) || (telnetTried && !telnetOpened && !sshTried)
			|| (sshTried && !sshOpened && telnetTried && !telnetOpened)) {
			throw new IOException("Failed to connect to the device via SSH or Telnet.");
		}
		throw new InvalidCredentialsException("Couldn't find valid credentials.");
	}

}
