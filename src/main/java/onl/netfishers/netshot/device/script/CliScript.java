package onl.netfishers.netshot.device.script;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import javax.persistence.Transient;
import javax.script.ScriptException;

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
import onl.netfishers.netshot.device.access.Ssh;
import onl.netfishers.netshot.device.access.Telnet;
import onl.netfishers.netshot.device.credentials.DeviceCliAccount;
import onl.netfishers.netshot.device.credentials.DeviceCredentialSet;
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
	private static Logger logger = LoggerFactory.getLogger(CliScript.class);

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
			
			@Override
			public void warn(String message) {
				jsLog.add(String.format("[DEBUG] %s", message));
			}
			
			@Override
			public void trace(String message) {
				jsLog.add(String.format("[TRACE] %s", message));
			}
			
			@Override
			public void info(String message) {
				jsLog.add(String.format("[INFO] %s", message));
			}
			
			@Override
			public void error(String message) {
				jsLog.add(String.format("[ERROR] %s", message));
			}
			
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
			
			@Override
			public void warn(String message) {
				cliLog.add(message);
			}
			
			@Override
			public void trace(String message) {
				cliLog.add(message);
			}
			
			@Override
			public void info(String message) {
				cliLog.add(message);
			}
			
			@Override
			public void error(String message) {
				cliLog.add(message);
			}
			
			@Override
			public void debug(String message) {
				cliLog.add(message);
			}
		};
	}
	
	protected abstract void run(Session session, Device device, Cli cli, DriverProtocol protocol, DeviceCliAccount cliAccount)
			throws InvalidCredentialsException, IOException, ScriptException, MissingDeviceDriverException;
	
	public void connectRun(Session session, Device device)
			throws IOException, MissingDeviceDriverException, InvalidCredentialsException, ScriptException, MissingDeviceDriverException {
		this.connectRun(session, device, null);
	}
	
	public void connectRun(Session session, Device device, Set<DeviceCredentialSet> oneTimeCredentialSets)
			throws IOException, MissingDeviceDriverException, InvalidCredentialsException, ScriptException, MissingDeviceDriverException {
		DeviceDriver deviceDriver = device.getDeviceDriver();
		
		boolean sshOpened = true;
		boolean telnetOpened = true;
		TaskLogger taskLogger = this.getJsLogger();
		
		Network4Address address = device.getConnectAddress();
		if (address == null) {
			address = device.getMgmtAddress();
		}
		Set<DeviceCredentialSet> credentialSets = oneTimeCredentialSets;
		if (credentialSets == null) {
			credentialSets = device.getCredentialSets();
		}
		
		int sshPort = device.getSshPort();
		int telnetPort = device.getTelnetPort();
		
		if (deviceDriver.getProtocols().contains(DriverProtocol.SSH)) {
			for (DeviceCredentialSet credentialSet : credentialSets) {
				if (credentialSet instanceof DeviceSshAccount) {
					Cli cli;
					if (credentialSet instanceof DeviceSshKeyAccount) {
						cli = new Ssh(address, sshPort, ((DeviceSshKeyAccount) credentialSet).getUsername(),
								((DeviceSshKeyAccount) credentialSet).getPublicKey(),
								((DeviceSshKeyAccount) credentialSet).getPrivateKey(),
								((DeviceSshKeyAccount) credentialSet).getPassword());
					}
					else {
						cli = new Ssh(address, sshPort, ((DeviceSshAccount) credentialSet).getUsername(),
								((DeviceSshAccount) credentialSet).getPassword());
					}
					try {
						cli.connect();
						this.run(session, device, cli, DriverProtocol.SSH, (DeviceCliAccount) credentialSet);
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
							taskLogger.warn(String.format("Authentication failed using SSH credential set %s.", credentialSet.getName()));
						}
						else {
							taskLogger.warn("Unable to open an SSH socket to the device.");
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
		if (deviceDriver.getProtocols().contains(DriverProtocol.TELNET)) {
			for (DeviceCredentialSet credentialSet : credentialSets) {
				if (credentialSet instanceof DeviceTelnetAccount) {
					Cli cli = new Telnet(address, telnetPort);
					try {
						cli.connect();
						this.run(session, device, cli, DriverProtocol.TELNET, (DeviceCliAccount) credentialSet);
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
						taskLogger.warn("Unable to open a Telnet socket to the device.");
						telnetOpened = false;
						break;
					}
					finally {
						cli.disconnect();
					}
				}
			}
		}
		if (device.isAutoTryCredentials() && (sshOpened || telnetOpened)) {
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
									((DeviceSshKeyAccount) credentialSet).getPassword());
						}
						else {
							cli = new Ssh(address, sshPort, ((DeviceSshAccount) credentialSet).getUsername(),
									((DeviceSshAccount) credentialSet).getPassword());
						}
						try {
							cli.connect();
							this.run(session, device, cli, DriverProtocol.SSH, (DeviceCliAccount) credentialSet);
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
								taskLogger.warn("Unable to open an SSH socket to the device.");
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
						Cli cli = new Telnet(address, telnetPort);
						try {
							cli.connect();
							this.run(session, device, cli, DriverProtocol.TELNET, (DeviceCliAccount) credentialSet);
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
							taskLogger.warn("Unable to open a Telnet socket to the device.");
							telnetOpened = false;
							break;
						}
						finally {
							cli.disconnect();
						}
					}
				}
			}
		}
		if (!sshOpened && !telnetOpened) {
			throw new IOException("Couldn't open either SSH or Telnet socket with the device.");
		}
		throw new InvalidCredentialsException("Couldn't find valid credentials.");
	}

}
