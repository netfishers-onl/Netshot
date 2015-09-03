package onl.netfishers.netshot.device.credentials;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

/**
 * SSH credentials with a private key.
 * The inherited password is actually the passphrase for the key.
 * @author sylv
 *
 */
@Entity
@XmlRootElement()
public class DeviceSshKeyAccount extends DeviceSshAccount {
	
	private String publicKey;
	private String privateKey;
	
	protected DeviceSshKeyAccount() {
		
	}

	public DeviceSshKeyAccount(String username, String publicKey, String privateKey, String passphrase,
			String superPassword, String name) {
		super(username, passphrase, superPassword, name);
		this.publicKey = publicKey;
		this.privateKey = privateKey;
	}

	@Column(length = 10000)
	@XmlElement
	public String getPrivateKey() {
		return privateKey;
	}

	public void setPrivateKey(String privateKey) {
		this.privateKey = privateKey;
	}
	
	@Column(length = 10000)
	@XmlElement
	public String getPublicKey() {
		return publicKey;
	}

	public void setPublicKey(String publicKey) {
		this.publicKey = publicKey;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result
				+ ((privateKey == null) ? 0 : privateKey.hashCode());
		result = prime * result
				+ ((publicKey == null) ? 0 : publicKey.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (!super.equals(obj))
			return false;
		if (getClass() != obj.getClass())
			return false;
		DeviceSshKeyAccount other = (DeviceSshKeyAccount) obj;
		if (privateKey == null) {
			if (other.privateKey != null)
				return false;
		} else if (!privateKey.equals(other.privateKey))
			return false;
		if (publicKey == null) {
			if (other.publicKey != null)
				return false;
		} else if (!publicKey.equals(other.publicKey))
			return false;
		return true;
	}


}
