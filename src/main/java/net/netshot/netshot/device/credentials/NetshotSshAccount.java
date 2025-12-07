package net.netshot.netshot.device.credentials;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

/**
 * SSH account for a device to upload data to Netshot.
 */
@Entity
public class NetshotSshAccount {

	/** Unique ID. */
	@Getter(onMethod = @__({
		@Id,
		@GeneratedValue(strategy = GenerationType.IDENTITY),
	}))
	@Setter
	private long id;

	/** Date/time of creation. */
	@Getter
	@Setter
	private Date creationDate;

	/** Date/time of expiration (null if no expiration). */
	@Getter
	@Setter
	private Date expirationDate;

	/** The username. */
	@Getter
	@Setter
	private String username;

	/** The hashed password. */
	@Getter
	@Setter
	private String hashedPassword;
	
}
