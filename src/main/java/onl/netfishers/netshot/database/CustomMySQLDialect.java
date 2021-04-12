package onl.netfishers.netshot.database;

import org.hibernate.dialect.MySQL57Dialect;
import org.hibernate.dialect.function.SQLFunctionTemplate;
import org.hibernate.type.StandardBasicTypes;

public class CustomMySQLDialect extends MySQL57Dialect {
	
	public CustomMySQLDialect() {
		super();
		registerFunction("regexp_like",
			new SQLFunctionTemplate(StandardBasicTypes.BOOLEAN, "(CASE WHEN (?1 REGEXP ?2) THEN 1 ELSE 0 END)"));
	}
}
