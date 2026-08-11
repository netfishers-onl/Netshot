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
package net.netshot.netshot.vault;

import lombok.Getter;
import lombok.Setter;

/**
 * A field that can either hold a local (encrypted-at-rest) value, or a
 * reference to a secret stored in an external Vault instance (identified by
 * {@link #vaultInstance} and {@link #vaultPath}, the latter combining the
 * KV v2 secret path and the key within it, e.g. {@code "app/creds/username"}
 * - see {@link VaultKeyPath}).
 * <p>
 * This is a plain, non-persisted value object - a convenience view/bundle of
 * 4 values, NOT a JPA {@code @Embeddable}. Each owning credential entity maps
 * its own 4 real columns/association directly (same pattern as any other
 * plain field, e.g. {@code DeviceCredentialSet.mgmtDomain}) and exposes them
 * bundled through {@code getXxxSecret()}/{@code setXxxSecret(VaultableSecret)}
 * for {@link VaultManager} and the REST layer to work with uniformly, without
 * repeating the local/Vault resolution logic per field. (An actual
 * {@code @Embeddable} was tried first but triggered undocumented Hibernate
 * column-binding conflicts when combined with per-field {@code @AttributeOverride}
 * across a {@code SINGLE_TABLE} hierarchy - flattening avoids that risk
 * entirely by only using mapping patterns already proven elsewhere in this
 * codebase.)
 */
public class VaultableSecret {

	/** The local (encrypted-at-rest) value, used when not Vault-backed. */
	@Getter
	@Setter
	private String localValue;

	/** The Vault instance to read the secret from, or null if not Vault-backed. */
	@Getter
	@Setter
	private VaultInstance vaultInstance;

	/**
	 * The KVv2 secret path and key holding the value, combined as
	 * {@code <path>/<key>} (the part after the last {@code /} is the key -
	 * see {@link VaultKeyPath}).
	 */
	@Getter
	@Setter
	private String vaultPath;

	/**
	 * Staging area for the Vault instance ID, used only while handling a REST
	 * request: incoming JSON is deserialized with a raw ID before the REST
	 * layer has a Hibernate {@code Session} to resolve it into an actual
	 * {@link VaultInstance} reference. Not used once {@link #vaultInstance}
	 * itself is set (e.g. on a value bundled from a persisted entity).
	 */
	private Long pendingVaultInstanceId;

	public boolean isVaultBacked() {
		return this.vaultInstance != null || this.pendingVaultInstanceId != null;
	}

	/**
	 * The Vault instance ID, whether or not the {@link #vaultInstance}
	 * association has actually been resolved yet (see {@link #pendingVaultInstanceId}).
	 * @return the Vault instance ID, or null if this field is local (not Vault-backed)
	 */
	public Long getVaultInstanceId() {
		if (this.pendingVaultInstanceId != null) {
			return this.pendingVaultInstanceId;
		}
		return this.vaultInstance == null ? null : this.vaultInstance.getId();
	}

	/**
	 * Sets the Vault instance ID as staged from an incoming REST request.
	 * The REST layer must resolve this into an actual {@link VaultInstance}
	 * (via {@link #setVaultInstance}) before this change is persisted.
	 * @param vaultInstanceId the Vault instance ID
	 */
	public void setVaultInstanceId(Long vaultInstanceId) {
		this.pendingVaultInstanceId = vaultInstanceId;
	}
}
