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
package net.netshot.netshot.device.script.helper;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import org.apache.commons.codec.digest.DigestUtils;
import org.graalvm.polyglot.HostAccess.Export;
import org.graalvm.polyglot.Value;

import lombok.extern.slf4j.Slf4j;
import net.netshot.netshot.crypto.Sha2BasedHash;
import net.netshot.netshot.device.Config;
import net.netshot.netshot.device.Device;
import net.netshot.netshot.device.DeviceDriver;
import net.netshot.netshot.device.access.Cli;
import net.netshot.netshot.device.access.Ssh;
import net.netshot.netshot.device.attribute.AttributeDefinition;
import net.netshot.netshot.device.attribute.AttributeDefinition.AttributeLevel;
import net.netshot.netshot.device.attribute.AttributeDefinition.AttributeType;
import net.netshot.netshot.device.attribute.ConfigBinaryAttribute;
import net.netshot.netshot.device.attribute.ConfigBinaryFileAttribute;
import net.netshot.netshot.device.attribute.ConfigLongTextAttribute;
import net.netshot.netshot.device.attribute.ConfigNumericAttribute;
import net.netshot.netshot.device.attribute.ConfigTextAttribute;
import net.netshot.netshot.work.TaskLogger;

/**
 * Class used to control a device config from JavaScript.
 * @author sylvain.cadilhac
 *
 */
@Slf4j
public final class JsConfigHelper {

	private final Device device;
	private Config config;
	private Config lastConfig;
	private TaskLogger taskLogger;
	private Cli cli;

	public JsConfigHelper(Device device, Config config, Config lastConfig,
		Cli cli, TaskLogger taskLogger) {
		this.device = device;
		this.config = config;
		this.lastConfig = lastConfig;
		this.cli = cli;
		this.taskLogger = taskLogger;
	}

	@Export
	public void set(String key, Value value) {
		if (value == null) {
			return;
		}
		try {
			if ("author".equals(key)) {
				config.setAuthor(value.asString());
			}
			else {
				DeviceDriver driver = device.getDeviceDriver();
				for (AttributeDefinition attribute : driver.getAttributes()) {
					if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
						switch (attribute.getType()) {
							case BINARY:
								config.addAttribute(new ConfigBinaryAttribute(config, key, value.asBoolean()));
								break;
							case NUMERIC:
								config.addAttribute(new ConfigNumericAttribute(config, key, value.asDouble()));
								break;
							case LONGTEXT:
								config.addAttribute(new ConfigLongTextAttribute(config, key, value.asString()));
								break;
							case TEXT:
								config.addAttribute(new ConfigTextAttribute(config, key, value.asString()));
								break;
							default:
						}
						break;
					}
				}
			}
		}
		catch (Exception e) {
			log.warn("Error during snapshot while setting config attribute key '{}'.", key);
		}
	}

	/**
	 * Compute a custom hash based on the inputs.
	 * @param inputs = the list of strings to hash
	 */
	@Export
	public void computeCustomHash(String[] inputs) {
		Sha2BasedHash digester = new Sha2BasedHash();
		digester.setSalt(null);
		digester.setIterations(1);
		digester.setAlgorithm("SHA-256");
		digester.digest(inputs);
		String hash = digester.toHashString();
		log.debug("Computed custom hash is {}", hash);
		config.setCustomHash(hash);
	}

	@Export
	public String getCustomHash() {
		return config.getCustomHash();
	}

	@Export
	public String getLastCustomHash() {
		return lastConfig.getCustomHash();
	}

	private void checkFileSha256(Path filePath, String expected) throws IOException {
		try (InputStream is = Files.newInputStream(filePath)) {
			String computed = DigestUtils.sha256Hex(is).toLowerCase();
			if (!expected.toLowerCase().equals(computed)) {
				log.warn("Invalid computed SHA256 hash for received file: {} vs {}", computed, expected);
				throw new IllegalArgumentException(
					"Invalid computed SHA256 hash for received file: %s vs %s".formatted(computed, expected));
			}
			taskLogger.debug("Checksum of downloaded file was successfully verified (%s).".formatted(computed));
		}
	}

	private void checkFileMd5(Path filePath, String expected) throws IOException {
		try (InputStream is = Files.newInputStream(filePath)) {
			String computed = DigestUtils.md5Hex(is).toLowerCase();
			if (!expected.toLowerCase().equals(computed)) {
				log.warn("Invalid computed MD5 hash for received file: {} vs {}", computed, expected);
				throw new IllegalArgumentException(
					"Invalid computed MD5 hash for received file: %s vs %s".formatted(computed, expected));
			}
			taskLogger.debug("Checksum of downloaded file was successfully verified (%s).".formatted(computed));
		}
	}

	/**
	 * Compute hash (digest) of given downloaded file and compare to passed checkum.
	 * @param filePath = the file path to digest
	 * @param expected = the expected checkum (hex-based), either MD5 or SHA256
	 * @throws IOException
	 */
	private void checkFileSum(Path filePath, String expected) throws IOException {
		if (expected == null) {
			log.info("Skipping verification of downloaded file (no checksum was provided).");
			taskLogger.debug("Skipping verification of downloaded file (no checksum provided).");
			return;
		}
		if (expected.length() == 32) {
			checkFileMd5(filePath, expected);
		}
		else if (expected.length() == 64) {
			checkFileSha256(filePath, expected);
		}
		else {
			log.warn(
				"Invalid or unsupported passed file checksum length ({} characters)",
				expected.length());
			throw new IllegalArgumentException(
				"Invalid or unsupported passed file checksum length (%d characters).".formatted(expected.length()));
		}
	}

	/**
	 * Download a binary file from the device, using SCP.
	 * @param key the name of the config attribute
	 * @param method "scp" or "sftp" for now
	 * @param remoteFileName the file (including full path) to download from the device
	 * @param storeFileName the file name to store (null to use remoreFileName)
	 * @param newSession use a new SSH session to download the file
	 * @param expectedHash if not null verify the hash of the received file (SHA256 or MD5)
	 */
	@Export
	public void download(String key, String method, String remoteFileName, String storeFileName,
		boolean newSession, String expectedHash) throws Exception {
		if (remoteFileName == null) {
			return;
		}
		String storeName = storeFileName;
		if (storeName != null) {
			storeName = storeName.trim();
			if ("".equals(storeName)) {
				storeName = null;
			}
		}
		if (storeName == null) {
			try {
				storeName = new File(remoteFileName).getName();
				storeName = storeName.trim();
				storeName = storeName.replaceAll("[^0-9_a-zA-Z\\(\\)\\%\\-\\.]", "");
			}
			catch (Exception e) {
				// Go on
			}
		}
		if (storeName != null) {
			storeName = storeName.trim();
			if ("".equals(storeName)) {
				storeName = null;
			}
		}
		try {
			DeviceDriver driver = device.getDeviceDriver();
			if ("scp".equals(method)) {
				for (AttributeDefinition attribute : driver.getAttributes()) {
					if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
						if (cli instanceof Ssh) {
							if (AttributeType.BINARYFILE.equals(attribute.getType())) {
								ConfigBinaryFileAttribute fileAttribute = new ConfigBinaryFileAttribute(config, key, storeName);
								((Ssh) cli).scpDownload(remoteFileName, fileAttribute.getFileName().toString(), newSession);
								this.checkFileSum(fileAttribute.getFileName().toPath(), expectedHash);
								fileAttribute.setFileSize(fileAttribute.getFileName().length());
								config.addAttribute(fileAttribute);
							}
							else {
								log.warn("Error during snapshot: can't use SCP download method on attribute '{}' (should be binary or long text type).", key);
								throw new IllegalArgumentException(String.format(
									"Can't use SCP download method on attribute '%s' which is not of type binary-file.", key));
							}
						}
						else {
							log.warn("Error during snapshot: can't use SCP method with non-SSH CLI access (for attribute '{}').", key);
							throw new IllegalArgumentException(String.format(
								"Can't use SCP method with non-SSH CLI access (for attribute '{}').", key));
						}
						break;
					}
				}
			}
			else if ("sftp".equals(method)) {
				for (AttributeDefinition attribute : driver.getAttributes()) {
					if (attribute.getLevel().equals(AttributeLevel.CONFIG) && attribute.getName().equals(key)) {
						if (AttributeType.BINARYFILE.equals(attribute.getType())) {
							if (cli instanceof Ssh) {
								ConfigBinaryFileAttribute fileAttribute = new ConfigBinaryFileAttribute(config, key, storeName);
								((Ssh) cli).sftpDownload(remoteFileName, fileAttribute.getFileName().toString(), newSession);
								this.checkFileSum(fileAttribute.getFileName().toPath(), expectedHash);
								fileAttribute.setFileSize(fileAttribute.getFileName().length());
								config.addAttribute(fileAttribute);
							}
							else {
								log.warn("Error during snapshot: can't use SFTP method with non-SSH CLI access (for attribute '{}').", key);
								throw new IllegalArgumentException(String.format(
									"Can't use SFTP method with non-SSH CLI access (for attribute '{}').", key));
							}
						}
						else {
							log.warn("Error during snapshot: can't use SFTP download method on non-binary-file attribute '{}'.", key);
							throw new IllegalArgumentException(String.format(
								"Can't use SFTPdownload method on attribute '%s' which is not of type binary-file.", key));
						}
						break;
					}
				}
			}
			else {
				log.warn("Invalid download method '{}' during snapshot.", method);
				throw new IllegalArgumentException(String.format("Invalid download method %s", method));
			}
		}
		catch (Exception e) {
			log.warn("Error during snapshot while downloading file for attribute key '{}'.", key);
			taskLogger.error(String.format("Error while downloading file for attribute key %s: %s", key, e.getMessage()));
			throw e;
		}
	}
}
