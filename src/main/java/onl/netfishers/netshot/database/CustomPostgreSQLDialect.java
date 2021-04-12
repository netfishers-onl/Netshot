package onl.netfishers.netshot.database;

import org.hibernate.dialect.PostgreSQL10Dialect;
import org.hibernate.dialect.function.SQLFunctionTemplate;
import org.hibernate.type.StandardBasicTypes;

public class CustomPostgreSQLDialect extends PostgreSQL10Dialect {
	
	public CustomPostgreSQLDialect() {
		super();
		registerFunction("regexp_like",
			new SQLFunctionTemplate(StandardBasicTypes.BOOLEAN, "(CASE WHEN (?1 ~ ?2) THEN 1 ELSE 0 END)"));
	}
}
