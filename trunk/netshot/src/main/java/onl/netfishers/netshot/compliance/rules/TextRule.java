/**
 * Copyright 2013-2014 Sylvain Cadilhac (NetFishers)
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

import onl.netfishers.netshot.compliance.Policy;
import onl.netfishers.netshot.compliance.Rule;
import onl.netfishers.netshot.compliance.CheckResult.ResultOption;
import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceDriver;

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
	
	
	@XmlElement
	public String getField() {
		return field;
	}

	public void setField(String field) {
		this.field = field;
	}

	@XmlElement
	@Column(length = 10000)
	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
	}

	@XmlElement
	@Column(length = 100000000)
	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
		if (this.text != null) {
			this.text = this.text.replace("\r", "");
		}
	}

	@XmlElement
	public boolean isRegExp() {
		return regExp;
	}

	public void setRegExp(boolean regExp) {
		this.regExp = regExp;
	}

	@XmlElement
	public boolean isInvert() {
		return invert;
	}

	public void setInvert(boolean invert) {
		this.invert = invert;
	}
	
	
	
	@XmlElement
	public String getDeviceDriver() {
		return deviceDriver;
	}
	
	@Transient
	@XmlElement
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

	@XmlElement
	public boolean isAnyBlock() {
		return anyBlock;
	}

	public void setAnyBlock(boolean anyBlock) {
		this.anyBlock = anyBlock;
	}

	@XmlElement
	public boolean isMatchAll() {
		return matchAll;
	}

	public void setMatchAll(boolean matchAll) {
		this.matchAll = matchAll;
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
	public void check(Device device, Session session) {
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
		RuleDataProvider provider = this.new RuleDataProvider(session, device);
		try {
			String content = provider.get(field).toString();
			content = content.replace("\r", "");
			List<String[]> blocks = new ArrayList<String[]>();
			blocks.add(new String[] { "", content });
			for (Pattern pattern : hierarchy) {
				List<String[]> selectedBlocks = new ArrayList<String[]>();
				for (String[] block : blocks) {
					selectedBlocks.addAll(findSections(block[1], pattern, block[0]));
				}
				blocks = selectedBlocks;
			}
			provider.debug(String.format("Found %d block(s) matching the context.", blocks.size()));
			int b = 1;
			for (String[] block : blocks) {
				boolean doesMatch =
						regExp && (matchAll && pattern.matcher(block[1]).matches() || !matchAll && pattern.matcher(block[1]).find()) ||
						!regExp && (matchAll && block[1].equals(text) || !matchAll && block[1].contains(text));
				doesMatch = doesMatch ^ invert;
				if (!doesMatch) {
					provider.debug(String.format("Non matching block, number %d (in [%s])", b++, block[0]));
					this.setCheckResult(device, ResultOption.NONCONFORMING, "", session);
					return;
				}
				else if (anyBlock) {
					provider.debug(String.format("Matching block, number %d (in [%s])", b++, block[0]));
					this.setCheckResult(device, ResultOption.CONFORMING, "", session);
					return;
				}
			}
			this.setCheckResult(device, ResultOption.CONFORMING, "", session);
		}
		catch (Exception e) {
			this.setCheckResult(device, ResultOption.NOTAPPLICABLE, "No such field.", session);
			return;
		}
	}

}
