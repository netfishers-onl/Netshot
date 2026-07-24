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
package net.netshot.netshot.database;

import java.net.InetAddress;

/**
 * Static helper functions registered as H2 ALIAS functions (see the
 * "net_contains" changeset in the migration changelog), used to emulate
 * PostgreSQL's native "inet" subnet-containment operator on H2, which has no
 * equivalent built-in. Only used by the H2 database engine (unit/integration
 * tests); PostgreSQL relies on its native "&lt;&lt;=" operator instead.
 */
public final class H2NetworkFunctions {

	private H2NetworkFunctions() {
	}

	/**
	 * Checks whether the given raw address bytes fall within the given CIDR subnet.
	 *
	 * @param address the raw address bytes (4 bytes for IPv4, 16 for IPv6), as stored
	 *                in the "cached_ip_address" binary column
	 * @param cidr the subnet, in "address/prefixLength" notation
	 * @return true if address is contained within the subnet
	 */
	public static boolean netContains(byte[] address, String cidr) {
		if (address == null || cidr == null) {
			return false;
		}
		try {
			String[] parts = cidr.split("/", 2);
			byte[] network = InetAddress.getByName(parts[0]).getAddress();
			if (address.length != network.length) {
				return false;
			}
			int prefixLength = parts.length > 1 ? Integer.parseInt(parts[1]) : network.length * 8;
			int fullBytes = prefixLength / 8;
			int remainingBits = prefixLength % 8;
			for (int i = 0; i < fullBytes; i++) {
				if (address[i] != network[i]) {
					return false;
				}
			}
			if (remainingBits > 0) {
				int mask = (0xFF << (8 - remainingBits)) & 0xFF;
				if ((address[fullBytes] & mask) != (network[fullBytes] & mask)) {
					return false;
				}
			}
			return true;
		}
		catch (Exception e) {
			return false;
		}
	}
}
