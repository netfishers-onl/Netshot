package onl.netfishers.netshot.database;

import org.hibernate.boot.model.FunctionContributions;
import org.hibernate.dialect.PostgreSQLDialect;
import org.hibernate.type.BasicTypeRegistry;
import org.hibernate.type.StandardBasicTypes;

public class CustomPostgreSQLDialect extends PostgreSQLDialect {

	@Override
	public void initializeFunctionRegistry(FunctionContributions functionContributions) {
		super.initializeFunctionRegistry(functionContributions);

		BasicTypeRegistry basicTypeRegistry = functionContributions.getTypeConfiguration().getBasicTypeRegistry();

		functionContributions.getFunctionRegistry().registerPattern(
			"regexp_like",
			"?1 ~ ?2",
			basicTypeRegistry.resolve(StandardBasicTypes.BOOLEAN));
	}
}
