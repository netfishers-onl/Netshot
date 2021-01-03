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
package onl.netfishers.netshot.compliance.rules;

import java.util.ArrayList;
import java.util.List;
import java.util.StringJoiner;
import java.util.regex.Pattern;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.Rule;
import onl.netfishers.netshot.compliance.CheckResult.ResultOption;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;
import onl.netfishers.netshot.device.script.helper.JsDeviceHelper;
import onl.netfishers.netshot.rest.RestViews.DefaultView;
import onl.netfishers.netshot.work.TaskLogger;

import org.hibernate.Session;

@Entity
public class TextRule extends Rule {
	
	private String field;
	
	private String context;
	
	private String text;
	
	private boolean regExp = false;
	
	private boolean invert = false;
	
	private boolean anyBlock = false;
	
	private boolean matchAll = false;
	
	private boolean normalize = false;
	
	private String deviceDriver;
	
	private List<Pattern> hierarchy = new ArrayList<Pattern>();
	
	private boolean prepared = false;
	
	private boolean valid = false;
	
	private Pattern pattern = null;
	
	protected TextRule() {
		
	}
	
	public TextRule(String name, Policy policy) {
		super(name, policy);
	}
	
	
	@XmlElement @JsonView(DefaultView.class)
	public String getField() {
		return field;
	}

	public void setField(String field) {
		this.field = field;
	}

	@XmlElement @JsonView(DefaultView.class)
	@Column(length = 10000)
	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
	}

	@XmlElement @JsonView(DefaultView.class)
	@Column(length = 10000000)
	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
		if (this.text != null) {
			this.text = this.text.replace("\r", "");
		}
	}

	@XmlElement @JsonView(DefaultView.class)
	public boolean isRegExp() {
		return regExp;
	}

	public void setRegExp(boolean regExp) {
		this.regExp = regExp;
	}

	@XmlElement @JsonView(DefaultView.class)
	public boolean isInvert() {
		return invert;
	}

	public void setInvert(boolean invert) {
		this.invert = invert;
	}
	
	
	
	@XmlElement @JsonView(DefaultView.class)
	public String getDeviceDriver() {
		return deviceDriver;
	}
	
	@Transient
	@XmlElement @JsonView(DefaultView.class)
	public String getDeviceDriverDescription() {
		if ("".equals(deviceDriver)) {
			return "";
		}
		try {
			DeviceDriver d = DeviceDriver.getDriverByName(deviceDriver);
			return d.getDescription();
		}
		catch (Exception e) {
			return "Unknown driver";
		}
	}

	public void setDeviceDriver(String deviceDriver) {
		this.deviceDriver = deviceDriver;
	}

	@XmlElement @JsonView(DefaultView.class)
	public boolean isAnyBlock() {
		return anyBlock;
	}

	public void setAnyBlock(boolean anyBlock) {
		this.anyBlock = anyBlock;
	}

	@XmlElement @JsonView(DefaultView.class)
	public boolean isMatchAll() {
		return matchAll;
	}

	public void setMatchAll(boolean matchAll) {
		this.matchAll = matchAll;
	}

	@XmlElement @JsonView(DefaultView.class)
	public boolean isNormalize() {
		return normalize;
	}

	public void setNormalize(boolean normalize) {
		this.normalize = normalize;
	}

	private void prepare() {
		if (prepared) {
			return;
		}
		prepared = true;
		if (context != null && context.length() > 0) {
			String[] lines = context.split("\\r?\\n");
			for (String line : lines) {
				try {
					hierarchy.add(Pattern.compile(line));
				}
				catch (Exception e) {
					return;
				}
			}
		}
		if (text == null || field == null) {
			return;
		}
		if (regExp) {
			try {
				pattern = Pattern.compile(text);
			}
			catch (Exception e) {
				return;
			}
		}
		valid = true;
	}
	
	private String normalizeText(String text) {
		if (text == null) {
			return null;
		}
		return text.replaceAll("[\\x0B\\f\\r]", "").replaceAll(" +\\n", "\n");
	}
	
	private int findIndent(String line) {
		for (int i = 0; i < line.length(); i++) {
			if (line.charAt(i) != ' ') {
				return i;
			}
		}
		return line.length();
	}
	
	private List<String[]> findSections(String lines, Pattern pattern, String where) {
		return findSections(lines.split("\\n"), pattern, where);
	}
	
	private List<String[]> findSections(String[] lines, Pattern pattern, String where) {
		List<String[]> blocks = new ArrayList<String[]>();
		StringJoiner joiner = new StringJoiner("\n");
		String title = "";
		int indent = -1;
		for (String line : lines) {
			if (indent >= 0) {
				if (findIndent(line) > indent) {
					joiner.add(line);
				}
				else {
					blocks.add(new String[] { title, joiner.toString() });
					indent = -1;
				}
			}
			if (indent < 0 && pattern.matcher(line).matches()) {
				indent = findIndent(line);
				joiner = new StringJoiner("\n");
				String trimmedLine = line.trim();
				title = (where.length() > 0 ? where + " > " + trimmedLine : trimmedLine);
			}
		}
		if (indent >= 0) {
			blocks.add(new String[] { title, joiner.toString() });
		}
		return blocks;
	}

	@Override
	public void check(Device device, Session session, TaskLogger taskLogger) {
		if (!this.isEnabled()) {
			this.setCheckResult(device, ResultOption.DISABLED, "", session);
			return;
		}
		prepare();
		if (!valid) {
			this.setCheckResult(device, ResultOption.INVALIDRULE, "", session);
			return;
		}
		if (deviceDriver != null && !"".equals(deviceDriver) && !deviceDriver.equals(device.getDriver())) {
			this.setCheckResult(device, ResultOption.NOTAPPLICABLE, "", session);
			return;
		}
		if (device.isExempted(this)) {
			this.setCheckResult(device, ResultOption.EXEMPTED, "", session);
			return;
		}
		try {
			JsDeviceHelper deviceHelper = new JsDeviceHelper(device, session, taskLogger, true);
			String content = deviceHelper.get(field).toString();
			content = content.replace("\r", "");
			if (isNormalize()) {
				content = this.normalizeText(content);
			}
			List<String[]> blocks = new ArrayList<String[]>();
			blocks.add(new String[] { "", content });
			for (Pattern pattern : hierarchy) {
				List<String[]> selectedBlocks = new ArrayList<String[]>();
				for (String[] block : blocks) {
					selectedBlocks.addAll(findSections(block[1], pattern, block[0]));
				}
				blocks = selectedBlocks;
			}
			taskLogger.debug(String.format("Found %d block(s) matching the context.", blocks.size()));
			int b = 1;
			for (String[] block : blocks) {
				boolean doesMatch =
						regExp && (matchAll && pattern.matcher(block[1]).matches() || !matchAll && pattern.matcher(block[1]).find()) ||
						!regExp && (matchAll && block[1].equals(text) || !matchAll && block[1].contains(text));
				doesMatch = doesMatch ^ invert;
				if (!doesMatch) {
					taskLogger.debug(String.format("Non matching block, number %d (in [%s])", b++, block[0]));
					this.setCheckResult(device, ResultOption.NONCONFORMING, "", session);
					return;
				}
				else if (anyBlock) {
					taskLogger.debug(String.format("Matching block, number %d (in [%s])", b++, block[0]));
					this.setCheckResult(device, ResultOption.CONFORMING, "", session);
					return;
				}
			}
			this.setCheckResult(device, ResultOption.CONFORMING, "", session);
		}
		catch (Exception e) {
			this.setCheckResult(device, ResultOption.NOTAPPLICABLE, "No such field.", session);
			taskLogger.info("No such field '" + field + "' on this device");
			return;
		}
		finally {
			taskLogger.debug("End of check");
		}
	}

	@Override
	public String toString() {
		return "Compliance text-based rule " + id + " (name '" + name + "')";
	}

}
