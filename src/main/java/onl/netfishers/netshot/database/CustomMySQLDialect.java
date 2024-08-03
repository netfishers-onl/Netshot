package onl.netfishers.netshot.database;

import org.hibernate.boot.model.FunctionContributions;
import org.hibernate.dialect.MySQLDialect;
import org.hibernate.type.BasicTypeRegistry;
import org.hibernate.type.StandardBasicTypes;

public class CustomMySQLDialect extends MySQLDialect {

	
	@Override
	public void initializeFunctionRegistry(FunctionContributions functionContributions) {
		super.initializeFunctionRegistry(functionContributions);

		BasicTypeRegistry basicTypeRegistry = functionContributions.getTypeConfiguration().getBasicTypeRegistry();

		functionContributions.getFunctionRegistry().registerPattern(
			"regexp_like",
			"?1 REGEXP ?2",
			basicTypeRegistry.resolve(StandardBasicTypes.BOOLEAN));
	}
}
