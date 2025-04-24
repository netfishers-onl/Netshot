package net.netshot.netshot.device;

import java.io.Serializable;
import java.util.Objects;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.Setter;

/**
 * Device membership within a group
 */
@Entity
@Table(name = "device_group_cached_devices")
public class DeviceGroupMembership {

	@Embeddable
	private static class Key implements Serializable {

		private static final long serialVersionUID = 10209729310192924L;
	
		@Getter(onMethod=@__({
			@ManyToOne,
			@JoinColumn(name = "owner_groups"),
			@OnDelete(action = OnDeleteAction.CASCADE),
		}))
		@Setter
		private DeviceGroup group;

		@Getter(onMethod=@__({
			@ManyToOne,
			@JoinColumn(name = "cached_devices"),
			@OnDelete(action = OnDeleteAction.CASCADE),
		}))
		@Setter
		private Device device;

		protected Key() {
			//
		}
	
		public Key(Device device, DeviceGroup group) {
			this.device = device;
			this.group = group;
		}

		@Override
		public int hashCode() {
			return Objects.hash(group, device);
		}

		@Override
		public boolean equals(Object obj) {
			if (this == obj) return true;
			if (!(obj instanceof Key)) return false;
			Key other = (Key) obj;
			return Objects.equals(group, other.group) && Objects.equals(device, other.device);
		}
	}

	/** The key. */
	@Getter(onMethod=@__({
		@EmbeddedId
	}))
	@Setter
	private Key key = new Key();
	
	protected DeviceGroupMembership() {
		//
	}

	public DeviceGroupMembership(Device device, DeviceGroup group) {
		this.key = new Key(device, group);
	}

	@Transient
	public DeviceGroup getGroup() {
		return this.key.getGroup();
	}

	@Transient
	public Device getDevice() {
		return this.key.getDevice();
	}
	
}
