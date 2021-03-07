/**
 * Copyright 2013-2021 Sylvain Cadilhac (NetFishers)
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
package onl.netfishers.netshot.device.script;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import javax.persistence.Transient;
import javax.script.ScriptException;

import org.graalvm.polyglot.HostAccess.Export;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.Device.InvalidCredentialsException;
import onl.netfishers.netshot.device.Device.MissingDeviceDriverException;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.DeviceDriver.DriverProtocol;
import onl.netfishers.netshot.device.Network4Address;
import onl.netfishers.netshot.device.access.Cli;
import onl.netfishers.netshot.device.access.Snmp;
import onl.netfishers.netshot.device.access.Ssh;
import onl.netfishers.netshot.device.access.Telnet;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
import onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity;
import onl.netfishers.netshot.device.credentials.DeviceSshAccount;
import onl.netfishers.netshot.device.credentials.DeviceSshKeyAccount;
import onl.netfishers.netshot.device.credentials.DeviceTelnetAccount;
import onl.netfishers.netshot.work.TaskLogger;

/**
 * Something to execute on a device.
 * @author sylvain.cadilhac
 *
 */
public abstract class CliScript {
	/** The logger. */
	final private static Logger logger = LoggerFactory.getLogger(CliScript.class);

	/** The log. */
	protected transient List<String> jsLog  = new ArrayList<String>();
	
	/** Session debug log. */
	protected transient List<String> cliLog;
	
	protected CliScript(boolean cliLogging) {
		if (cliLogging) {
			cliLog = new ArrayList<String>();
		}
	}
	
	
	/**
	 * Gets the plain log.
	 *
	 * @return the plain log
	 */
	@Transient
	public String getPlainJsLog() {
		StringBuffer buffer = new StringBuffer();
		for (String log : this.jsLog) {
			buffer.append(log);
			buffer.append("\n");
		}
		return buffer.toString();
	}
	
	/**
	 * Gets the session debug logs as plain string.
	 * @return the logs
	 */
	@Transient
	public String getPlainCliLog() {
		if (this.cliLog == null) {
			return null;
		}
		StringBuffer buffer = new StringBuffer();
		for (String log : this.cliLog) {
			buffer.append(log);
			buffer.append("\n");
		}
		return buffer.toString();
	}
	

	/**
	 * Gets the log.
	 *
	 * @return the log
	 */
	@Transient
	public List<String> getJsLog() {
		return jsLog;
	}
	
	/**
	 * Get the JS logger
	 * @return the JS logger
	 */
	protected TaskLogger getJsLogger() {
		return new TaskLogger() {
			
			@Export
			@Override
			public void warn(String message) {
				jsLog.add(String.format("[DEBUG] %s", message));
			}
			
			@Export
			@Override
			public void trace(String message) {
				jsLog.add(String.format("[TRACE] %s", message));
			}
			
			@Export
			@Override
			public void info(String message) {
				jsLog.add(String.format("[INFO] %s", message));
			}
			
			@Export
			@Override
			public void error(String message) {
				jsLog.add(String.format("[ERROR] %s", message));
			}
			
			@Export
			@Override
			public void debug(String message) {
				jsLog.add(String.format("[DEBUG] %s", message));
			}
		};
	}
	
	/**
	 * Get the CLI logger
	 * @return the CLI logger, of null if disabled
	 */
	protected TaskLogger getCliLogger() {
		if (cliLog == null) {
			return null;
		}
		return new TaskLogger() {
			
			@Export
			@Override
			public void warn(String message) {
				cliLog.add(message);
			}
			
			@Export
			@Override
			public void trace(String message) {
				cliLog.add(message);
			}
			
			@Export
			@Override
			public void info(String message) {
				cliLog.add(message);
			}
			
			@Export
			@Override
			public void error(String message) {
				cliLog.add(message);
			}
			
			@Export
			@Override
			public void debug(String message) {
				cliLog.add(message);
			}
		};
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
		TaskLogger taskLogger = this.getJsLogger();
		
		Network4Address address = device.getConnectAddress();
		if (address == null) {
			address = device.getMgmtAddress();
		}
		Set<DeviceCredentialSet> credentialSets = oneTimeCredentialSets;
		if (credentialSets == null) {
			credentialSets = device.getCredentialSets();
		}
		
		if (device.getSpecificCredentialSet() != null) {
			credentialSets = new HashSet<DeviceCredentialSet>();
			credentialSets.add(device.getSpecificCredentialSet());
		}
		
		int sshPort = device.getSshPort();
		int telnetPort = device.getTelnetPort();
		
		if (sshOpened) {
			for (DeviceCredentialSet credentialSet : credentialSets) {
				if (credentialSet instanceof DeviceSshAccount) {
					Cli cli;
					if (credentialSet instanceof DeviceSshKeyAccount) {
						cli = new Ssh(address, sshPort, ((DeviceSshKeyAccount) credentialSet).getUsername(),
								((DeviceSshKeyAccount) credentialSet).getPublicKey(),
								((DeviceSshKeyAccount) credentialSet).getPrivateKey(),
								((DeviceSshKeyAccount) credentialSet).getPassword(),
								taskLogger);
					}
					else {
						cli = new Ssh(address, sshPort, ((DeviceSshAccount) credentialSet).getUsername(),
								((DeviceSshAccount) credentialSet).getPassword(), taskLogger);
					}
					try {
						sshTried = true;
						cli.connect();
						taskLogger.info(String.format("Connected using SSH to %s:%d using credentials %s.",
								address.getIp(), sshPort, credentialSet.getName()));
						this.run(session, device, cli, null, DriverProtocol.SSH, (DeviceCliAccount) credentialSet);
						return;
					}
					catch (InvalidCredentialsException e) {
						taskLogger.warn(String.format("Authentication failed using SSH credential set %s.", credentialSet.getName()));
					}
					catch (ScriptException e) {
						throw e;
					}
					catch (Exception e) {
						logger.warn("Unable to open an SSH connection to {}:{}.", address.getIp(), sshPort, e);
						if (e.getMessage().contains("Auth fail")) {
							taskLogger.warn(String.format("Authentication failed %s:%d using SSH credential set %s.",
									address, sshPort, credentialSet.getName()));
						}
						else {
							taskLogger.warn(String.format("Unable to open an SSH socket to %s:%d: %s",
									address.getIp(), sshPort, e.getMessage()));
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
					Cli cli = new Telnet(address, telnetPort, taskLogger);
					try {
						telnetTried = true;
						cli.connect();
						taskLogger.info(String.format("Connected using Telnet to %s:%d.", address.getIp(), telnetPort));
						this.run(session, device, cli, null, DriverProtocol.TELNET, (DeviceCliAccount) credentialSet);
						return;
					}
					catch (InvalidCredentialsException e) {
						taskLogger.warn(String.format("Authentication failed using Telnet credential set %s.", credentialSet.getName()));
					}
					catch (ScriptException e) {
						throw e;
					}
					catch (IOException e) {
						logger.warn("Unable to open a Telnet connection to {}:{}.", address.getIp(), telnetPort, e);
						taskLogger.warn(String.format("Unable to open a Telnet socket to %s:%d.", address.getIp(), telnetPort));
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
					Snmp poller = new Snmp(address, (DeviceSnmpCommunity)credentialSet);
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
						logger.warn("Unable to poll {} using SNMP credential set {}", address.getIp(), credentialSet.getName());
						taskLogger.warn(String.format("Unable to poll %s using SNMP credential set %s", address.getIp(), credentialSet.getName()));
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
						taskLogger.trace(String.format("Will try SSH credentials %s.", credentialSet.getName()));
						Cli cli;
						if (credentialSet instanceof DeviceSshKeyAccount) {
							cli = new Ssh(address, sshPort, ((DeviceSshKeyAccount) credentialSet).getUsername(),
									((DeviceSshKeyAccount) credentialSet).getPublicKey(),
									((DeviceSshKeyAccount) credentialSet).getPrivateKey(),
									((DeviceSshKeyAccount) credentialSet).getPassword(),
									taskLogger);
						}
						else {
							cli = new Ssh(address, sshPort, ((DeviceSshAccount) credentialSet).getUsername(),
									((DeviceSshAccount) credentialSet).getPassword(), taskLogger);
						}
						try {
							sshTried = true;
							cli.connect();
							taskLogger.info(String.format("Connected using SSH to %s:%d using credentials %s.",
									address.getIp(), sshPort, credentialSet.getName()));
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
							taskLogger.warn(String.format("Authentication failed using Telnet credential set %s.", credentialSet.getName()));
						}
						catch (ScriptException e) {
							throw e;
						}
						catch (IOException e) {
							logger.warn("Unable to open an SSH connection to {}:{}.", address.getIp(), sshPort, e);
							if (e.getMessage().contains("Auth fail") || e.getMessage().contains("authentication failure")) {
								taskLogger.warn(String.format("Authentication failed using SSH credential set %s.", credentialSet.getName()));
							}
							else {
								taskLogger.warn(String.format("Unable to open an SSH socket to %s:%d: %s",
										address.getIp(), sshPort, e.getMessage()));
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
						taskLogger.trace(String.format("Will try Telnet credentials %s.", credentialSet.getName()));
						Cli cli = new Telnet(address, telnetPort, taskLogger);
						try {
							telnetTried = true;
							cli.connect();
							taskLogger.info(String.format("Connected using Telnet to %s:%d.", address.getIp(), telnetPort));
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
							taskLogger.warn(String.format("Authentication failed using Telnet credential set %s.", credentialSet.getName()));
						}
						catch (ScriptException e) {
							throw e;
						}
						catch (IOException e) {
							logger.warn("Unable to open a Telnet connection to {}:{}.", address.getIp(), telnetPort, e);
							taskLogger.warn(String.format("Unable to open a Telnet socket to %s:%d.", address.getIp(), telnetPort));
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
						taskLogger.trace(String.format("Will try SNMP credentials %s.", credentialSet.getName()));
						Snmp poller = new Snmp(address, (DeviceSnmpCommunity)credentialSet);
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
							logger.warn("Unable to poll {} using SNMP credential set {}", address.getIp(), credentialSet.getName());
							taskLogger.warn(String.format("Unable to poll %s using SNMP credential set %s", address.getIp(), credentialSet.getName()));
							break;
						}
						finally {
							poller.stop();
						}
					}
				}
				
			}
		}
		if ((sshTried && !sshOpened && !telnetTried) || (telnetTried && !telnetOpened && !sshTried) ||
				(sshTried && !sshOpened && telnetTried && !telnetOpened)) {
			throw new IOException("Couldn't open either SSH or Telnet socket with the device.");
		}
		throw new InvalidCredentialsException("Couldn't find valid credentials.");
	}

}
