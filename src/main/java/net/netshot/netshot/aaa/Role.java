package net.netshot.netshot.aaa;

import lombok.Getter;

public class Role {

	public static Role ADMIN = new Role("admin", 1000);

	@Getter
	private String name;

	@Getter
	private int level;

	private Role(String name, int level) {
		this.name = name;
		this.level = level;
	}
	
}
