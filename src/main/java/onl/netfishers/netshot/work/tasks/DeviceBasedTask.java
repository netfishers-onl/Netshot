package onl.netfishers.netshot.work.tasks;

import onl.netfishers.netshot.device.Device;

/**
 * Device specific task interface.
 */
public interface DeviceBasedTask {

	public Device getDevice();

	public void setDevice(Device device);
}
