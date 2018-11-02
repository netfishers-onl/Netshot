/**
 * Copyright 2013-2016 Sylvain Cadilhac (NetFishers)
 * 
 * This file is part of Netshot.
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
package onl.netfishers.netshot.device.credentials;

import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlRootElement;
import javax.persistence.Column;
import javax.xml.bind.annotation.XmlElement;
import org.hibernate.annotations.Type;



/**
 * SNMPv3 attributes
 */
@Entity
@XmlRootElement
public class DeviceSnmpv3Community extends DeviceSnmpCommunity {

	private String snmpv3username;
	private String snmpv3authtype;
	private String snmpv3authkey;
	private String snmpv3privtype;
	private String snmpv3privkey;

	/**
	 * Instantiates a new device snmpv1 community.
	 */
	protected DeviceSnmpv3Community() {
		
	}
	
	/**
	 * Instantiates a new device snmpv3 credential.
	 *
	 * @param community the community
	 * @param name the name
	 * @param snmpv3username username
	 * @param snmpv3authtype authtype
	 * @param snmpv3authkey authkey
	 * @param snmpv3privtype privtype
	 * @param snmpv3privkey privkey
	 */
	public DeviceSnmpv3Community(	String community,
					String name,
					String snmpv3username,
					String snmpv3authtype,
					String snmpv3authkey,
					String snmpv3privtype,
					String snmpv3privkey ) {
		super(community, name);
		this.snmpv3username = snmpv3username ;
		this.snmpv3authtype = snmpv3authtype ;
		this.snmpv3authkey = snmpv3authkey ;
		this.snmpv3privtype = snmpv3privtype ;
		this.snmpv3privkey = snmpv3privkey ;
		
	}

        /**
         * Gets the snmpv3username.
         *
         * @return the snmpv3username
         */
        @XmlElement
        @Type(type = "credentialString")
        public String getSnmpv3username() {
                return snmpv3username;
        }

        /**
         * Sets the snmpv3username.
         *
         * @param snmpv3username the new snmpv3username
         */
        public void setSnmpv3username(String snmpv3username) {
                this.snmpv3username = snmpv3username;
        }
        /**
         * Gets the snmpv3authtype.
         *
         * @return the snmpv3authtype
         */
        @XmlElement
        @Type(type = "credentialString")
        public String getSnmpv3authtype() {
                return snmpv3authtype;
        }

        /**
         * Sets the snmpv3authtype.
         *
         * @param snmpv3authtype the new snmpv3authtype
         */
        public void setSnmpv3authtype(String snmpv3authtype) {
                this.snmpv3authtype = snmpv3authtype;
        }
        /**
         * Gets the snmpv3authkey.
         *
         * @return the snmpv3authkey
         */
        @XmlElement
        @Type(type = "credentialString")
        public String getSnmpv3authkey() {
                return snmpv3authkey;
        }

        /**
         * Sets the snmpv3authkey.
         *
         * @param snmpv3authkey the new snmpv3authkey
         */
        public void setSnmpv3authkey(String snmpv3authkey) {
                this.snmpv3authkey = snmpv3authkey;
        }
        /**
         * Gets the snmpv3privtype.
         *
         * @return the snmpv3privtype
         */
        @XmlElement
        @Type(type = "credentialString")
        public String getSnmpv3privtype() {
                return snmpv3privtype;
        }

        /**
         * Sets the snmpv3privtype.
         *
         * @param snmpv3privtype the new snmpv3privtype
         */
        public void setSnmpv3privtype(String snmpv3privtype) {
                this.snmpv3privtype = snmpv3privtype;
        }
        /**
         * Gets the snmpv3privkey.
         *
         * @return the snmpv3privkey
         */
        @XmlElement
        @Type(type = "credentialString")
        public String getSnmpv3privkey() {
                return snmpv3privkey;
        }

        /**
         * Sets the snmpv3privkey.
         *
         * @param snmpv3privkey the new snmpv3privkey
         */
        public void setSnmpv3privkey(String snmpv3privkey) {
                this.snmpv3privkey = snmpv3privkey;
        }

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + ((name == null) ? 0 : name.hashCode());
		return result;
	}

	/* (non-Javadoc)
	 * @see onl.netfishers.netshot.device.credentials.DeviceSnmpCommunity#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		if (!super.equals(obj)) {
			return false;
		}
		if (!(obj instanceof DeviceSnmpv3Community)) {
			return false;
		}
		DeviceSnmpv3Community other = (DeviceSnmpv3Community) obj;
		if (name == null) {
			if (other.name != null) {
				return false;
			}
		} else if (!name.equals(other.name)) {
			return false;
		}
		return true;
	}

}
