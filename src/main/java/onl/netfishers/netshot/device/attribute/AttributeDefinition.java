package onl.netfishers.netshot.device.attribute;

import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

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
	
	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private AttributeType type;

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private AttributeLevel level;

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String name;

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private String title;

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private boolean comparable = false;

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private boolean searchable = false;

	@Getter(onMethod=@__({
		@XmlElement, @JsonView(DefaultView.class)
	}))
	@Setter
	private boolean checkable = false;

	@Getter
	@Setter
	private boolean dump = false;

	@Getter
	@Setter
	private String preDump = null;

	@Getter
	@Setter
	private String postDump = null;

	@Getter
	@Setter
	private String preLineDump = null;

	@Getter
	@Setter
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