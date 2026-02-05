package net.netshot.netshot.device.access;

import java.io.IOException;

public class InvalidCredentialsException extends IOException {
	private static final long serialVersionUID = 2762061771246688828L;

	public InvalidCredentialsException(String message) {
		super(message);
	}
}