package onl.netfishers.netshot.work.tasks;

import onl.netfishers.netshot.device.Domain;

/**
 * Domain specific task interface.
 */
public interface DomainBasedTask {

	public Domain getDomain();

	public void setDomain(Domain domain);
}
