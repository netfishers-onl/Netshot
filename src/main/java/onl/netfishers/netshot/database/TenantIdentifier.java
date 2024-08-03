package onl.netfishers.netshot.database;

public enum TenantIdentifier {
	READ_ONLY("ReadOnly"),
	READ_WRITE("ReadWrite");

	private String sourceName;

	private TenantIdentifier(String sourceName) {
		this.sourceName = sourceName;
	}

	public String getSourceName() {
		return this.sourceName;
	}
}
