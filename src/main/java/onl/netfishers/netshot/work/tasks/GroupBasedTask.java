package onl.netfishers.netshot.work.tasks;

import onl.netfishers.netshot.device.DeviceGroup;

/**
 * Define device group specific task.
 */
public interface GroupBasedTask {
	public DeviceGroup getDeviceGroup();

	public void setDeviceGroup(DeviceGroup group);
	
}
