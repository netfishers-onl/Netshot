/**
 * Copyright 2013-2021 Sylvain Cadilhac (NetFishers)
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
package onl.netfishers.netshot.device.attribute;

import java.io.File;
import java.nio.file.Paths;
import java.util.UUID;

import javax.persistence.Column;
import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.Netshot;
import onl.netfishers.netshot.device.Config;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

@Entity @DiscriminatorValue("F")
public class ConfigBinaryFileAttribute extends ConfigAttribute {

	/** Unique ID generated before saving */
	private String uid;

	/** Original name of the file */
	private String originalName;

	/** File size (in bytes) */
	private long fileSize = 0L;
	
	protected ConfigBinaryFileAttribute() {
	}
	
	public ConfigBinaryFileAttribute(Config config, String name, String originalName) {
		super(config, name);
		this.uid = UUID.randomUUID().toString();
		this.originalName = originalName;
	}

	/**
	 * Get the uid
	 * @return the uid
	 */
	@Column(unique =  true)
	public String getUid() {
		return uid;
	}

	/**
	 * Set the uid
	 * @param uid the uid to set
	 */
	public void setUid(String uid) {
		this.uid = uid;
	}

	/**
	 * Get the full filename where to store data of the configuration attribute.
	 * @return a File object, where to store data of the attribute
	 */
	@Transient
	public File getFileName() {
		String path = Netshot.getConfig("netshot.snapshots.binary.path");
		if (path == null) {
			return null;
		}
		return Paths.get(path, String.format("%s.data", this.getUid())).normalize().toFile();
	}

	@Override
	@Transient
	public String getAsText() {
		return "";
	}
	
	@Override
	@Transient
	public Object getData() {
		return null;
	}

	/**
	 * Gets the original file name.
	 * @return the original file name
	 */
	@XmlElement @JsonView(DefaultView.class)
	public String getOriginalName() {
		return originalName;
	}

	/**
	 * Sets the original file name
	 * @param originalName the original file name
	 */
	public void setOriginalName(String originalName) {
		this.originalName = originalName;
	}

	/**
	 * @return the fileSize
	 */
	@XmlElement @JsonView(DefaultView.class)
	public long getFileSize() {
		return fileSize;
	}

	/**
	 * @param fileSize the fileSize to set
	 */
	@XmlElement @JsonView(DefaultView.class)
	public void setFileSize(long fileSize) {
		this.fileSize = fileSize;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + (int) (fileSize ^ (fileSize >>> 32));
		result = prime * result + ((originalName == null) ? 0 : originalName.hashCode());
		result = prime * result + ((uid == null) ? 0 : uid.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj) return true;
		if (!super.equals(obj)) return false;
		if (getClass() != obj.getClass()) return false;
		ConfigBinaryFileAttribute other = (ConfigBinaryFileAttribute) obj;
		if (fileSize != other.fileSize) return false;
		if (originalName == null) {
			if (other.originalName != null) return false;
		}
		else if (!originalName.equals(other.originalName)) return false;
		if (uid == null) {
			if (other.uid != null) return false;
		}
		else if (!uid.equals(other.uid)) return false;
		return true;
	}

}
