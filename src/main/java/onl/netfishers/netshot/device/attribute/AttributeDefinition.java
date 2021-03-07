package onl.netfishers.netshot.device.attribute;

import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import org.graalvm.polyglot.Value;

import onl.netfishers.netshot.device.script.helper.JsDeviceHelper;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

public class AttributeDefinition {
	
	static public enum AttributeLevel {
		DEVICE,
		CONFIG
	}
	
	static public enum AttributeType {
		NUMERIC,
		TEXT,
		LONGTEXT,
		DATE,
		BINARY,
		BINARYFILE
	}
	
	private AttributeType type;
	private AttributeLevel level;
	private String name;
	private String title;
	private boolean comparable = false;
	private boolean searchable = false;
	private boolean checkable = false;
	private boolean dump = false;
	private String preDump = null;
	private String postDump = null;
	private String preLineDump = null;
	private String postLineDump = null;
	
	protected AttributeDefinition() {
		
	}

	public AttributeDefinition(AttributeType type, AttributeLevel level, String name,
			String title, boolean comparable, boolean searchable, boolean checkable) {
		super();
		this.type = type;
		this.level = level;
		this.name = name;
		this.title = title;
		this.comparable = comparable;
		this.searchable = searchable;
		this.checkable = checkable;
	}
	
	public AttributeDefinition(AttributeLevel level, String name, Value data) throws Exception {
		this.level = level;
		this.name = name;
		this.title = data.getMember("title").asString();
		if (!this.title.matches("^[0-9A-Za-z\\-_\\(\\)][0-9A-Za-z \\-_\\(\\)]+$")) {
			throw new IllegalArgumentException("Invalid title for item %s.");
		}
		String textType = data.getMember("type").asString();
		switch (textType) {
		case "Text":
			this.type = AttributeType.TEXT;
			break;
		case "LongText":
			this.type = AttributeType.LONGTEXT;
			break;
		case "Numeric":
			this.type = AttributeType.NUMERIC;
			break;
		case "Binary":
			this.type = AttributeType.BINARY;
			break;
		case "BinaryFile":
			this.type = AttributeType.BINARYFILE;
			break;
		default:
			throw new IllegalArgumentException("Invalid type for item %s.");
		}
		this.searchable = JsDeviceHelper.getBooleanMember(data, "searchable", false);
		this.comparable = JsDeviceHelper.getBooleanMember(data, "comparable", false);
		this.checkable = JsDeviceHelper.getBooleanMember(data, "checkable", false);
		Value dataDump = data.getMember("dump");
		if (dataDump == null) {
			this.dump = false;
		}
		else {
			if (dataDump.isBoolean()) {
				this.dump = dataDump.asBoolean();
			}
			else {
				this.dump = true;
				if (dataDump.hasMember("pre")) {
					this.preDump = dataDump.getMember("pre").asString();
				}
				if (dataDump.hasMember("preLine")) {
					this.preLineDump = dataDump.getMember("preLine").asString();
				}
				if (dataDump.hasMember("post")) {
					this.postDump = dataDump.getMember("post").asString();
				}
				if (dataDump.hasMember("postLine")) {
					this.postLineDump = dataDump.getMember("postLine").asString();
				}
				
			}
		}
	}

	@XmlElement @JsonView(DefaultView.class)
	public AttributeType getType() {
		return type;
	}
	public void setType(AttributeType type) {
		this.type = type;
	}
	@XmlElement @JsonView(DefaultView.class)
	public AttributeLevel getLevel() {
		return level;
	}
	public void setLevel(AttributeLevel level) {
		this.level = level;
	}
	@XmlElement @JsonView(DefaultView.class)
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	@XmlElement @JsonView(DefaultView.class)
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	@XmlElement @JsonView(DefaultView.class)
	public boolean isComparable() {
		return comparable;
	}
	public void setComparable(boolean comparable) {
		this.comparable = comparable;
	}
	@XmlElement @JsonView(DefaultView.class)
	public boolean isCheckable() {
		return checkable;
	}
	public void setCheckable(boolean checkable) {
		this.checkable = checkable;
	}
	@XmlElement @JsonView(DefaultView.class)
	public boolean isSearchable() {
		return searchable;
	}
	public void setSearchable(boolean searchable) {
		this.searchable = searchable;
	}
	public boolean isDump() {
		return dump;
	}
	public void setDump(boolean dump) {
		this.dump = dump;
	}
	public String getPreDump() {
		return preDump;
	}
	public void setPreDump(String preDump) {
		this.preDump = preDump;
	}
	public String getPostDump() {
		return postDump;
	}
	public void setPostDump(String postDump) {
		this.postDump = postDump;
	}
	public String getPreLineDump() {
		return preLineDump;
	}
	public void setPreLineDump(String preLineDump) {
		this.preLineDump = preLineDump;
	}
	public String getPostLineDump() {
		return postLineDump;
	}
	public void setPostLineDump(String postLineDump) {
		this.postLineDump = postLineDump;
	}
	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("AttributeDefinition [");
		if (type != null) {
			builder.append("type=");
			builder.append(type);
			builder.append(", ");
		}
		if (level != null) {
			builder.append("level=");
			builder.append(level);
			builder.append(", ");
		}
		if (name != null) {
			builder.append("name=");
			builder.append(name);
			builder.append(", ");
		}
		if (title != null) {
			builder.append("title=");
			builder.append(title);
			builder.append(", ");
		}
		builder.append("comparable=");
		builder.append(comparable);
		builder.append(", searchable=");
		builder.append(searchable);
		builder.append("]");
		return builder.toString();
	}
}