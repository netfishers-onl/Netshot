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
package onl.netfishers.netshot.device;

import java.net.UnknownHostException;
import java.text.DateFormat;
import java.text.NumberFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.ArrayList;
import java.util.List;
import java.util.ListIterator;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import onl.netfishers.netshot.Database;
import onl.netfishers.netshot.compliance.SoftwareRule;
import onl.netfishers.netshot.device.Device.NetworkClass;
import onl.netfishers.netshot.device.Finder.Expression.FinderParseException;
import onl.netfishers.netshot.device.attribute.AttributeDefinition;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeLevel;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeType;
import onl.netfishers.netshot.diagnostic.Diagnostic;

import org.hibernate.HibernateException;
import org.hibernate.query.Query;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * A Finder finds devices based on a text expression.
 */
public class Finder {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(Finder.class);

	public static class ParsingData {
		private DeviceDriver deviceDriver;
		private List<Diagnostic> diagnostics;

		public ParsingData(DeviceDriver deviceDriver) {
			this.deviceDriver = deviceDriver;
		}

		public DeviceDriver getDeviceDriver() {
			return this.deviceDriver;
		}

		public List<Diagnostic> getDiagnostics() throws FinderParseException {
			if (this.diagnostics != null) {
				return this.diagnostics;
			}
			Session session = Database.getSession();
			try {
				this.diagnostics = session.createQuery("select d from Diagnostic d", Diagnostic.class).list();
			}
			catch (HibernateException e) {
				logger.error("Unable to fetch the diagnostics.", e);
				throw new FinderParseException("Unable to fetch the diagnostics. " + e.getMessage());
			}
			finally {
				session.close();
			}
			return this.diagnostics;
		}
	}

	/**
	 * The Enum TokenType.
	 */
	public static enum TokenType {

		/** The and. */
		AND("(?i)^\\s*(and)\\b", "AND"),

		/** The or. */
		OR("(?i)^\\s*(or)\\b", "OR"),

		/** The not. */
		NOT("(?i)^\\s*(not)\\b", "NOT"),

		/** The is. */
		IS("(?i)^\\s*(is)\\b", "IS"),

		/** The in. */
		IN("(?i)^\\s*(in)\\b", "IN"),

		/** The bracketin. */
		BRACKETIN("^\\s*(\\()", "("),

		/** The bracketout. */
		BRACKETOUT("^\\s*(\\))", ")"),

		/** The contains. */
		CONTAINS("(?i)^\\s*(contains)\\b", "CONTAINS"),

		/** The startswith. */
		STARTSWITH("(?i)^\\s*(startswith)\\b", "STARTSWITH"),

		/** The endswith. */
		ENDSWITH("(?i)^\\s*(endswith)\\b", "ENDSWITH"),

		/** The before. */
		BEFORE("(?i)^\\s*(before)\\b", "BEFORE"),

		/** The after. */
		AFTER("(?i)^\\s*(after)\\b", "AFTER"),

		/** The lessthan. */
		LESSTHAN("(?i)^\\s*(lessthan)\\b", "LESSTHAN"),

		/** The greaterthan. */
		GREATERTHAN("(?i)^\\s*(greaterthan)\\b", "GREATERTHAN"),
		
		/** True. */
		TRUE("(?i)^\\s*(true)\\b", "TRUE"),
		
		/** False. */
		FALSE("(?i)^\\s*(false)\\b", "FALSE"),

		/** The ip. */
		IP("(?i)^\\s*(\\[ip\\])", "IP"),

		/** The mac. */
		MAC("(?i)^\\s*(\\[mac\\])", "MAC"),

		/** The module. */
		MODULE("(?i)^\\s*(\\[module\\])", "MODULE"),
		
		/** Interface. */
		INTERFACE("(?i)^\\s*(\\[interface\\])", "INTERFACE"),

		/** The module. */
		VRF("(?i)^\\s*(\\[vrf\\])", "VRF"),
		
		/** The module. */
		VIRTUALNAME("(?i)^\\s*(\\[virtual name\\])", "VIRTUAL NAME"),

		/** The device. */
		DEVICE("(?i)^\\s*(\\[device\\])", "DEVICE"),
		
		/** The domain token. */
		DOMAIN("(?i)^\\s*(\\[domain\\])", "DOMAIN"),

		/** The SUBNET v4. */
		SUBNETV4("^\\s*(((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(1[0-9]|2[0-9]|3[0-2]|[0-9]))", ""),

		/** The IP v4. */
		IPV4("^\\s*(((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))", ""),

		/** The SUBNET v6. */
		SUBNETV6(
				"^\\s*(((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(([0-9A-Fa-f]{1,4}:){0,5}:((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(::([0-9A-Fa-f]{1,4}:){0,5}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))/(1[01][0-9]|12[0-8]|[0-9][0-9]|[0-9]))",
				""),

		/** The IP v6. */
		IPV6(
				"^\\s*((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(([0-9A-Fa-f]{1,4}:){0,5}:((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(::([0-9A-Fa-f]{1,4}:){0,5}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))",
				""),

		/** The macsubnet. */
		MACSUBNET("^\\s*([0-9a-fA-F]{4}\\.[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4}/(4[0-8]|[1-3][0-9]|[0-9]))", ""),

		/** The macaddress. */
		MACADDRESS("^\\s*([0-9a-fA-F]{4}\\.[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4})", ""),

		/** The quote. */
		QUOTE("^\\s*\"(.*?)(?<!\\\\)\"", ""),

		/** The numeric. */
		NUMERIC("^\\s*([0-9\\.,]+)\\b", ""),

		/** The item. */
		ITEM("^\\s*\\[([A-Za-z\\-0-9 \\(\\)\"]+)\\]", "");

		/** The pattern. */
		private Pattern pattern;

		/** The command. */
		private String command;

		/**
		 * Instantiates a new token type.
		 *
		 * @param pattern the pattern
		 * @param command the command
		 */
		TokenType(String pattern, String command) {
			this.pattern = Pattern.compile(pattern);
			this.command = command;
		}

		/* (non-Javadoc)
		 * @see java.lang.Enum#toString()
		 */
		public String toString() {
			return command;
		}

		/**
		 * Escape.
		 *
		 * @param text the text
		 * @return the string
		 */
		public static String escape(String text) {
			return text.replaceAll("\"", "\\\"");
		}

		/**
		 * Unescape.
		 *
		 * @param text the text
		 * @return the string
		 */
		public static String unescape(String text) {
			return text.replaceAll("\\\\\\\"", "\"");
		}
	}

	/**
	 * The Class Token.
	 */
	public static class Token {

		/** The position. */
		public int position;

		/** The text. */
		public String text;

		/** The type. */
		public TokenType type;

		/** The expression. */
		public Expression expression = null;

		/**
		 * Instantiates a new token.
		 *
		 * @param text the text
		 * @param position the position
		 * @param type the type
		 */
		public Token(String text, int position, TokenType type) {
			this.position = position;
			this.text = text;
			this.type = type;
		}
	}

	/**
	 * The Class Expression.
	 */
	public static abstract class Expression {

		/** The device class. */
		protected DeviceDriver driver;

		/**
		 * Instantiates a new expression.
		 *
		 * @param driver the device class
		 */
		public Expression(DeviceDriver driver) {
			this.driver = driver;
		}

		/* (non-Javadoc)
		 * @see java.lang.Object#toString()
		 */
		public abstract String toString();

		/**
		 * The Class FinderParseException.
		 */
		public static class FinderParseException extends Exception {

			/** The Constant serialVersionUID. */
			private static final long serialVersionUID = -4102690686882816860L;

			/**
			 * Instantiates a new finder parse exception.
			 *
			 * @param message the message
			 */
			FinderParseException(String message) {
				super(message);
			}
		}

		/**
		 * Tokenize.
		 *
		 * @param text the text
		 * @return the list
		 * @throws FinderParseException the finder parse exception
		 */
		public static List<Token> tokenize(String text) throws FinderParseException {
			List<Token> tokens = new ArrayList<Token>();
			String buffer = text.trim();
			int position = 1;
			BufferLoop: while (buffer.length() > 0) {
				for (TokenType type : TokenType.values()) {
					Matcher matcher = type.pattern.matcher(buffer);
					if (matcher.find()) {
						String value = matcher.group(1);
						if (type == TokenType.QUOTE) {
							value = TokenType.unescape(value);
						}
						Token token = new Token(value, position, type);
						tokens.add(token);
						buffer = buffer.substring(matcher.end());
						position += matcher.end();
						continue BufferLoop;
					}
				}
				throw new FinderParseException(String.format(
						"Parsing error, unknown token at character %d.", position));
			}
			return tokens;
		}

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			ListIterator<Token> t = tokens.listIterator();
			int brackets = 0;
			List<Token> subTokens = new ArrayList<Token>();
			while (t.hasNext()) {
				Token token = t.next();
				if (token.type == TokenType.BRACKETIN) {
					brackets++;
					if (brackets > 1) {
						subTokens.add(token);
					}
					t.remove();
				}
				else if (token.type == TokenType.BRACKETOUT) {
					brackets--;
					if (brackets < 0) {
						throw new FinderParseException(
								"Parsing error, unexpected closing bracket.");
					}
					else if (brackets == 0) {
						token.type = TokenType.ITEM;
						token.expression = Expression.parse(subTokens, parsingData);
						subTokens.clear();
					}
					else {
						subTokens.add(token);
						t.remove();
					}
				}
				else if (brackets > 0) {
					subTokens.add(token);
					t.remove();
				}
			}
			if (brackets > 0) {
				throw new FinderParseException(
						"Parsing error, missing closing bracket.");
			}

			if (tokens.size() == 0) {
				throw new FinderParseException("Parsing error, no more token to parse");
			}

			if (tokens.size() == 1 && tokens.get(0).expression != null) {
				return tokens.get(0).expression;
			}

			Expression expr;

			expr = OrOperator.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}

			expr = AndOperator.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}
			
			expr = NotOperator.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}
			
			expr = ModuleExpression.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}
			
			expr = InterfaceExpression.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}
			
			expr = VrfExpression.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}
			
			expr = VirtualNameExpression.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}

			expr = DeviceExpression.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}

			expr = DomainExpression.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}

			expr = Ipv4Expression.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}

			expr = Ipv6Expression.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}

			expr = MacExpression.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}

			expr = AttributeExpression.parse(tokens, parsingData);
			if (expr != null) {
				return expr;
			}

			throw new FinderParseException(String.format(
					"Parsing error at character %d.", tokens.get(0).position));
		}

		/**
		 * Builds the hql string.
		 *
		 * @param itemPrefix the item prefix
		 * @return the finder criteria
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = new FinderCriteria();
			return criteria;
		}

		/**
		 * Sets the variables.
		 *
		 * @param Query<?> the query
		 * @param itemPrefix the item prefix
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			if (driver != null) {
				query.setParameter("driver", driver.getName());
			}
		};
	}

	/**
	 * The Class NotOperator.
	 */
	public static class NotOperator extends Expression {

		/** The child. */
		public Expression child;

		/**
		 * Instantiates a new not operator.
		 *
		 * @param driver the device class
		 */
		public NotOperator(DeviceDriver driver) {
			super(driver);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			StringBuffer buffer = new StringBuffer();
			buffer.append(TokenType.NOT).append(" ").append(child.toString());
			return buffer.toString();
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = this.child.buildHqlString(itemPrefix + "_0");
			criteria.where = "not (" + criteria.where + ")";
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			child.setVariables(query, itemPrefix + "_0");
		}

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			ListIterator<Token> t = tokens.listIterator();
			while (t.hasNext()) {
				boolean first = !t.hasPrevious();
				Token token = t.next();
				if (token.type == TokenType.NOT) {
					if (!first) {
						throw new FinderParseException(
								String.format("Parsing error, misplaced NOT at character %d.",
										token.position));
					}
					else {
						NotOperator notExpr = new NotOperator(parsingData.getDeviceDriver());
						t.previous();
						t.remove();
						notExpr.child = Expression.parse(tokens, parsingData);
						return notExpr;
					}
				}
			}
			return null;
		}

	}

	/**
	 * The Class AndOperator.
	 */
	public static class AndOperator extends Expression {

		/** The children. */
		public List<Expression> children = new ArrayList<Expression>();

		/**
		 * Instantiates a new and operator.
		 *
		 * @param driver the device class
		 */
		public AndOperator(DeviceDriver driver) {
			super(driver);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		public String toString() {
			StringBuffer buffer = new StringBuffer();
			int i = 0;
			buffer.append("(");
			for (Expression child : children) {
				if (i++ > 0)
					buffer.append(") ").append(TokenType.AND).append(" (");
				buffer.append(child.toString());
			}
			buffer.append(")");
			return buffer.toString();
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			int i = 0;
			criteria.where = "(";
			for (Expression child : children) {
				FinderCriteria childCriteria = child.buildHqlString(itemPrefix + "_"
						+ i);
				if (i > 0) {
					criteria.where += " and ";
				}
				criteria.where += childCriteria.where;
				criteria.joins.addAll(childCriteria.joins);
				criteria.otherTables.addAll(childCriteria.otherTables);
				criteria.whereJoins.addAll(childCriteria.whereJoins);
				i++;
			}
			criteria.where += ")";
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			int i = 0;
			for (Expression child : children) {
				child.setVariables(query, itemPrefix + "_" + i);
				i++;
			}
		}

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			ListIterator<Token> t = tokens.listIterator();
			AndOperator andExpr = new AndOperator(parsingData.getDeviceDriver());
			List<Token> tokenBuffer = new ArrayList<Token>();
			while (t.hasNext()) {
				Token token = t.next();
				if (token.type == TokenType.AND) {
					if (tokenBuffer.size() == 0) {
						throw new FinderParseException(String.format(
								"Parsing error, nothing before AND at character %d.",
								token.position));
					}
					andExpr.children.add(Expression.parse(tokenBuffer, parsingData));
					tokenBuffer.clear();
				}
				else {
					tokenBuffer.add(token);
				}
			}
			if (andExpr.children.size() > 0) {
				if (tokenBuffer.size() == 0) {
					throw new FinderParseException(
							"Parsing error, nothing after last AND.");
				}
				andExpr.children.add(Expression.parse(tokenBuffer, parsingData));
				return andExpr;
			}
			return null;
		}

	}

	/**
	 * The Class OrOperator.
	 */
	public static class OrOperator extends Expression {

		/** The children. */
		public List<Expression> children = new ArrayList<Expression>();

		/**
		 * Instantiates a new or operator.
		 *
		 * @param driver the device class
		 */
		public OrOperator(DeviceDriver driver) {
			super(driver);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		public String toString() {
			StringBuffer buffer = new StringBuffer();
			int i = 0;
			buffer.append("(");
			for (Expression child : children) {
				if (i++ > 0)
					buffer.append(") ").append(TokenType.OR).append(" (");
				buffer.append(child.toString());
			}
			buffer.append(")");
			return buffer.toString();
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			int i = 0;
			criteria.where = "(";
			for (Expression child : children) {
				FinderCriteria childCriteria = child.buildHqlString(itemPrefix + "_"
						+ i);
				if (i > 0) {
					criteria.where += " or ";
				}
				criteria.where += childCriteria.where;
				criteria.joins.addAll(childCriteria.joins);
				criteria.otherTables.addAll(childCriteria.otherTables);
				criteria.whereJoins.addAll(childCriteria.whereJoins);
				i++;
			}
			criteria.where += ")";
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			int i = 0;
			for (Expression child : children) {
				child.setVariables(query, itemPrefix + "_" + i);
				i++;
			}
		}

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			ListIterator<Token> t = tokens.listIterator();
			OrOperator orExpr = new OrOperator(parsingData.getDeviceDriver());
			List<Token> tokenBuffer = new ArrayList<Token>();
			while (t.hasNext()) {
				Token token = t.next();
				if (token.type == TokenType.OR) {
					if (tokenBuffer.size() == 0) {
						throw new FinderParseException(String.format(
								"Parsing error, nothing before OR at character %d.",
								token.position));
					}
					orExpr.children.add(Expression.parse(tokenBuffer, parsingData));
					tokenBuffer.clear();
				}
				else {
					tokenBuffer.add(token);
				}
			}
			if (orExpr.children.size() > 0) {
				if (tokenBuffer.size() == 0) {
					throw new FinderParseException(
							"Parsing error, nothing after last OR.");
				}
				orExpr.children.add(Expression.parse(tokenBuffer, parsingData));
				return orExpr;
			}
			return null;
		}
	}
	
	/**
	 * The Class ModuleExpression.
	 */
	public static class ModuleExpression extends Expression {

		/**
		 * Instantiates a new module expression.
		 *
		 * @param driver the device class
		 */
		public ModuleExpression(DeviceDriver driver) {
			super(driver);
		}

		/** The sign. */
		public TokenType sign;

		/** The value. */
		private String value;

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			if (tokens.size() == 3 && tokens.get(0).type == TokenType.MODULE) {
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);
				switch (comparator.type) {
				case IS:
				case CONTAINS:
				case STARTSWITH:
				case ENDSWITH:
					if (value.type == TokenType.QUOTE) {
						ModuleExpression modExpr = new ModuleExpression(parsingData.getDeviceDriver());
						modExpr.sign = comparator.type;
						modExpr.value = TokenType.unescape(value.text);
						return modExpr;
					}
					else {
						throw new FinderParseException(String.format(
								"Expecting a quoted string for MODULE at character %d.",
								value.position));
					}
				default:
					throw new FinderParseException(String.format(
							"Invalid operator after MODULE at character %d.",
							comparator.position));
				}
			}
			return null;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = String.format(
					"(m.serialNumber like :%s or m.partNumber like :%s)", itemPrefix,
					itemPrefix);
			criteria.joins.add("d.modules m");
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			String target;
			switch (sign) {
			case CONTAINS:
				target = "%" + value + "%";
				break;
			case STARTSWITH:
				target = value + "%";
				break;
			case ENDSWITH:
				target = "%" + value;
				break;
			default:
				target = value;
			}
			query.setParameter(itemPrefix, target);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[%s] %s \"%s\"", TokenType.MODULE, sign,
					TokenType.escape(value));
		}

	}

	/**
	 * The Class InterfaceExpression.
	 */
	public static class InterfaceExpression extends Expression {

		/**
		 * Instantiates a new interface expression.
		 *
		 * @param driver the device class
		 */
		public InterfaceExpression(DeviceDriver driver) {
			super(driver);
		}

		/** The sign. */
		public TokenType sign;

		/** The value. */
		private String value;

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			if (tokens.size() == 3 && tokens.get(0).type == TokenType.INTERFACE) {
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);
				switch (comparator.type) {
				case IS:
				case CONTAINS:
				case STARTSWITH:
				case ENDSWITH:
					if (value.type == TokenType.QUOTE) {
						InterfaceExpression modExpr = new InterfaceExpression(parsingData.getDeviceDriver());
						modExpr.sign = comparator.type;
						modExpr.value = TokenType.unescape(value.text);
						return modExpr;
					}
					else {
						throw new FinderParseException(String.format(
								"Expecting a quoted string for INTERFACE at character %d.",
								value.position));
					}
				default:
					throw new FinderParseException(String.format(
							"Invalid operator after INTERFACE at character %d.",
							comparator.position));
				}
			}
			return null;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = String.format(
					"(ni.interfaceName like :%s or ni.description like :%s)", itemPrefix,
					itemPrefix);
			criteria.joins.add("d.networkInterfaces ni");
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			String target;
			switch (sign) {
			case CONTAINS:
				target = "%" + value + "%";
				break;
			case STARTSWITH:
				target = value + "%";
				break;
			case ENDSWITH:
				target = "%" + value;
				break;
			default:
				target = value;
			}
			query.setParameter(itemPrefix, target);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[%s] %s \"%s\"", TokenType.INTERFACE, sign,
					TokenType.escape(value));
		}

	}

	/**
	 * The Class DeviceExpression.
	 */
	public static class DeviceExpression extends Expression {

		/**
		 * Instantiates a new device expression.
		 *
		 * @param driver the device class
		 */
		public DeviceExpression(DeviceDriver driver) {
			super(driver);
		}

		/** The value. */
		private Long value;

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			if (tokens.size() == 3 && tokens.get(0).type == TokenType.DEVICE) {
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);
				if (comparator.type != TokenType.IS) {
					throw new FinderParseException(String.format(
							"Invalid operator after DEVICE at character %d.",
							comparator.position));
				}
				if (value.type != TokenType.NUMERIC) {
					throw new FinderParseException(String.format(
							"Expecting a numeric value for DEVICE at character %d.",
							value.position));
				}
				DeviceExpression devExpr = new DeviceExpression(parsingData.getDeviceDriver());
				devExpr.value = Long.parseLong(value.text);
				return devExpr;
			}
			return null;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = String.format("d.id = :%s", itemPrefix);
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			query.setParameter(itemPrefix, value);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[%s] %s %d", TokenType.DEVICE, TokenType.IS, this.value);
		}

	}

	/**
	 * The Class DomainExpression. Matches a device domain.
	 */
	public static class DomainExpression extends Expression {

		/**
		 * Instantiates a new domain expression.
		 *
		 * @param driver the device class
		 */
		public DomainExpression(DeviceDriver driver) {
			super(driver);
		}

		/** The value. */
		private Long value;

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			if (tokens.size() == 3 && tokens.get(0).type == TokenType.DOMAIN) {
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);
				if (comparator.type != TokenType.IS) {
					throw new FinderParseException(String.format(
							"Invalid operator after DOMAIN at character %d.",
							comparator.position));
				}
				if (value.type != TokenType.NUMERIC) {
					throw new FinderParseException(String.format(
							"Expecting a numeric value for DOMAIN at character %d.",
							value.position));
				}
				DomainExpression domExpr = new DomainExpression(parsingData.getDeviceDriver());
				domExpr.value = Long.parseLong(value.text);
				return domExpr;
			}
			return null;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = String.format("d.mgmtDomain.id = :%s", itemPrefix);
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			query.setParameter(itemPrefix, value);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[%s] %s %d", TokenType.DOMAIN, TokenType.IS, this.value);
		}
	}

	/**
	 * The Class NullExpression.
	 */
	public static class NullExpression extends Expression {

		/**
		 * Instantiates a new null expression.
		 *
		 * @param driver the device class
		 */
		public NullExpression(DeviceDriver driver) {
			super(driver);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return "";
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		@Override
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = "1 = 1";
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		@Override
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
		}

	}

	/**
	 * The Class MacExpression.
	 */
	public static class MacExpression extends Expression {

		/**
		 * Instantiates a new mac expression.
		 *
		 * @param driver the device class
		 */
		public MacExpression(DeviceDriver driver) {
			super(driver);
		}

		/** The sign. */
		public TokenType sign;

		/** The target. */
		public PhysicalAddress target;

		/** The prefix length. */
		public int prefixLength;

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			if (tokens.get(0).type == TokenType.MAC) {
				if (tokens.size() != 3) {
					throw new FinderParseException(String.format(
							"Incomplete or incorrect expression after MAC at character %d.",
							tokens.get(0).position));
				}
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);

				String mac = "";

				MacExpression macExpr = new MacExpression(parsingData.getDeviceDriver());
				if (value.type == TokenType.MACADDRESS) {
					if (comparator.type != TokenType.IS) {
						throw new FinderParseException(String.format(
								"Invalid operator for simple MAC at character %d.",
								comparator.position));
					}
					mac = value.text;
				}
				else if (value.type == TokenType.MACSUBNET) {
					if (comparator.type != TokenType.IN) {
						throw new FinderParseException(String.format(
								"Invalid operator for MAC with mask at character %d.",
								comparator.position));
					}
					String[] values = value.text.split("/");
					mac = values[0];
					macExpr.prefixLength = Integer.parseInt(values[1]);
				}
				else {
					return null;
				}

				macExpr.sign = comparator.type;
				try {
					macExpr.target = new PhysicalAddress(mac);
				}
				catch (ParseException e) {
					throw new FinderParseException(String.format(
							"Error while parsing MAC address at character %d.",
							value.position));
				}
				return macExpr;
			}
			return null;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			String mac = this.target.toString();
			if (this.sign == TokenType.IN) {
				mac += "/" + this.prefixLength;
			}
			return String.format("[MAC] %s %s", this.sign, mac);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		@Override
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.joins.add("d.networkInterfaces ni");
			criteria.joins.add("ni.physicalAddress mac");
			if (this.sign == TokenType.IN) {
				criteria.where = String.format(
						"(mac.address >= :%s_0 and mac.address <= :%s_1)", itemPrefix,
						itemPrefix);
			}
			else {
				criteria.where = String.format("mac.address = :%s_0", itemPrefix);
			}
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		@Override
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			if (this.sign == TokenType.IN) {
				long mask = 0xFFFFFFFFFFFFFFFFL << (48 - this.prefixLength);
				long min = this.target.getLongAddress() & mask;
				long max = this.target.getLongAddress() | ~mask;
				query.setParameter(itemPrefix + "_0", min);
				query.setParameter(itemPrefix + "_1", max);
			}
			else {
				query.setParameter(itemPrefix + "_0", this.target.getLongAddress());
			}
		}

	}

	/**
	 * The Class Ipv4Expression.
	 */
	public static class Ipv4Expression extends Expression {

		/**
		 * Instantiates a new ipv4 expression.
		 *
		 * @param driver the device class
		 */
		public Ipv4Expression(DeviceDriver driver) {
			super(driver);
		}

		/** The sign. */
		public TokenType sign;

		/** The with mask. */
		public boolean withMask;

		/** The target. */
		public Network4Address target;

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			if (tokens.get(0).type == TokenType.IP) {
				if (tokens.size() != 3) {
					throw new FinderParseException(String.format(
							"Incomplete or incorrect expression after IP at character %d.",
							tokens.get(0).position));
				}
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);

				int prefixLength = 32;
				String ip = "";

				Ipv4Expression ipExpr = new Ipv4Expression(parsingData.getDeviceDriver());
				if (value.type == TokenType.IPV4) {
					if (comparator.type != TokenType.IS) {
						throw new FinderParseException(String.format(
								"Invalid operator for simple IP at character %d.",
								comparator.position));
					}
					ip = value.text;
					ipExpr.withMask = false;
				}
				else if (value.type == TokenType.SUBNETV4) {
					if (comparator.type != TokenType.IS
							&& comparator.type != TokenType.IN
							&& comparator.type != TokenType.CONTAINS) {
						throw new FinderParseException(String.format(
								"Invalid operator for IP subnet at character %d.",
								comparator.position));
					}
					String[] values = value.text.split("/");
					ip = values[0];
					prefixLength = Integer.parseInt(values[1]);
					ipExpr.withMask = true;
					if (comparator.type == TokenType.CONTAINS && ipExpr.withMask) {
						throw new FinderParseException(
								String.format("IP CONTAINS must be followed by a simple IP address (at character %d).",
										comparator.position));
					}
				}
				else {
					return null;
				}

				ipExpr.sign = comparator.type;
				try {
					ipExpr.target = new Network4Address(ip, prefixLength);
				}
				catch (UnknownHostException e) {
					throw new FinderParseException(
							String.format("Error while parsing IP address at character %d.",
									value.position));
				}
				return ipExpr;
			}
			return null;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[IP] %s %s", this.sign,
					(this.withMask ? this.target.getPrefix() : this.target.getIp()));
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		@Override
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.joins.add("d.networkInterfaces ni");
			criteria.joins.add("ni.ip4Addresses ip4");
			if (this.sign == TokenType.IN) {
				criteria.where = String.format(
						"((d.mgmtAddress.address >= :%s_0 and d.mgmtAddress.address <= :%s_1) or (ip4.address >= :%s_0 and ip4.address < :%s_1))",
						itemPrefix, itemPrefix, itemPrefix, itemPrefix);
			}
			else if (this.withMask) {
				criteria.where = String
						.format(
								"((d.mgmtAddress.address = :%s_0 and d.mgmtAddress.prefixLength = :%s_1) or (ip4.address = :%s_0 and ip4.prefixLength = :%s_1))",
								itemPrefix, itemPrefix, itemPrefix, itemPrefix);
			}
			else if (this.sign == TokenType.CONTAINS) {
				criteria.where = String.format("(i4.prefixLength = 0 or "
						+ "(ip4.address < 0 and ip4.address - mod(ip4.address, power(2, 32 - ip4.prefixLength)) - power(2, 32 - ip4.prefixLength) <= :%s_0 "
						+ "and :%s_0 <= ip4.address - mod(ip4.address, power(2, 32 - ip4.prefixLength)) - 1) or "
						+ "(ip4.address >= 0 and ip4.address - mod(ip4.address, power(2, 32 - ip4.prefixLength)) <= :%s_0 "
						+ "and :%s_0 <= ip4.address -mod(ip4.address, power(2, 32 - ip4.prefixLength)) + power(2, 32 - ip4.prefixLength) - 1)",
						itemPrefix, itemPrefix, itemPrefix, itemPrefix);
			}
			else {
				criteria.where = String.format(
						"(d.mgmtAddress.address = :%s_0 or ip4.address = :%s_0)",
						itemPrefix, itemPrefix);
			}
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		@Override
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			if (this.sign == TokenType.IN) {
				int min = this.target.getSubnetMin();
				int max = this.target.getSubnetMax();
				if (this.target.getPrefixLength() == 0) {
					max = (int) (0x7FFFFFFF);
					min = (int) (0x80000000);
				}
				query.setParameter(itemPrefix + "_0", (max > min ? min : max));
				query.setParameter(itemPrefix + "_1", (max > min ? max : min));
			}
			else if (this.withMask) {
				query.setParameter(itemPrefix + "_0", this.target.getIntAddress());
				query.setParameter(itemPrefix + "_1", this.target.getPrefixLength());
			}
			else {
				query.setParameter(itemPrefix + "_0", this.target.getIntAddress());
			}
		}

	}

	/**
	 * The Class Ipv6Expression.
	 */
	public static class Ipv6Expression extends Expression {

		/**
		 * Instantiates a new ipv6 expression.
		 *
		 * @param driver the device class
		 */
		public Ipv6Expression(DeviceDriver driver) {
			super(driver);
		}

		/** The sign. */
		public TokenType sign;

		/** The with mask. */
		public boolean withMask;

		/** The target. */
		public Network6Address target;

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			if (tokens.get(0).type == TokenType.IP) {
				if (tokens.size() != 3) {
					throw new FinderParseException(String.format(
							"Incomplete expression after IP at character %d.",
							tokens.get(0).position));
				}
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);

				int prefixLength = 128;
				String ip = "";

				Ipv6Expression ipExpr = new Ipv6Expression(parsingData.getDeviceDriver());
				if (value.type == TokenType.IPV6) {
					if (comparator.type != TokenType.IS) {
						throw new FinderParseException(String.format(
								"Invalid operator for simple IP at character %d.",
								comparator.position));
					}
					ip = value.text;
					ipExpr.withMask = false;
				}
				else if (value.type == TokenType.SUBNETV6) {
					if (comparator.type != TokenType.IS
							&& comparator.type != TokenType.IN) {
						throw new FinderParseException(String.format(
								"Invalid operator for IP subnet at character %d.",
								comparator.position));
					}
					String[] values = value.text.split("/");
					ip = values[0];
					prefixLength = Integer.parseInt(values[1]);
					ipExpr.withMask = true;
				}

				ipExpr.sign = comparator.type;
				try {
					ipExpr.target = new Network6Address(ip, prefixLength);
				}
				catch (UnknownHostException e) {
					throw new FinderParseException(
							String.format("Error while parsing IP address at character %d.",
									value.position));
				}
				return ipExpr;
			}
			return null;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[IP] %s %s", this.sign,
					(this.withMask ? this.target.getPrefix() : this.target.getIp()));
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		@Override
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.joins.add("d.networkInterfaces ni");
			criteria.joins.add("ni.ip6Addresses ip6");
			if (this.sign == TokenType.IN) {
				if (this.target.getPrefixLength() <= 64) {
					criteria.where = String.format(
							"(ip6.address1 >= :%s_0 and ip6.address1 <= :%s_1)", itemPrefix,
							itemPrefix);
				}
				else {
					criteria.where = String
							.format(
									"(ip6.address2 >= :%s_0 and ip6.address2 <= :%s_1 and ip6.address1 = :%s_2)",
									itemPrefix, itemPrefix, itemPrefix);
				}
			}
			else if (this.withMask) {
				criteria.where = String
						.format(
								"(ip6.address1 = :%s_0 and ip6.address2 = :%s_1 and ip6.prefixLength = :%s_2)",
								itemPrefix, itemPrefix, itemPrefix);
			}
			else {
				criteria.where = String.format(
						"ip6.address1 = :%s_0 and ip6.address2 = :%s_1", itemPrefix,
						itemPrefix);
			}
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		@Override
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			if (this.sign == TokenType.IN) {
				if (this.target.getPrefixLength() <= 64) {
					long mask = 0xFFFFFFFFFFFFFFFFL << (64 - this.target
							.getPrefixLength());
					long min = this.target.getAddress1() & mask;
					long max = this.target.getAddress1() | ~mask;
					query.setParameter(itemPrefix + "_0", (max > min ? min : max));
					query.setParameter(itemPrefix + "_1", (max > min ? max : min));
				}
				else {
					long mask = 0xFFFFFFFFFFFFFFFFL << (128 - this.target
							.getPrefixLength());
					long min = this.target.getAddress1() & mask;
					long max = this.target.getAddress1() | ~mask;
					query.setParameter(itemPrefix + "_0", (max > min ? min : max));
					query.setParameter(itemPrefix + "_1", (max > min ? max : min));
					query.setParameter(itemPrefix + "_2", this.target.getAddress1());
				}
			}
			else if (this.withMask) {
				query.setParameter(itemPrefix + "_0", this.target.getAddress1());
				query.setParameter(itemPrefix + "_1", this.target.getAddress2());
				query.setParameter(itemPrefix + "_2", this.target.getPrefixLength());
			}
			else {
				query.setParameter(itemPrefix + "_0", this.target.getAddress1());
				query.setParameter(itemPrefix + "_1", this.target.getAddress2());
			}
		}

	}

	/**
	 * The Class AttributeExpression.
	 */
	public abstract static class AttributeExpression extends Expression {

		/** Pattern to find a diagnostic in a generic attribute */
		static protected Pattern DIAGNOSTIC_PATTERN = Pattern.compile("(?i)^Diagnostic \"(.+)\"$");

		/** The item. */
		public String item;

		/** The property. */
		private String property;

		/** The sign. */
		public TokenType sign;

		/** The property level. */
		public PropertyLevel propertyLevel;

		/**
		 * Gets the property name.
		 *
		 * @return the property name
		 */
		public String buildWhere(String valueName, String operator, String itemPrefix) {
			if (propertyLevel.nativeProperty) {
				return propertyLevel.prefix + property + " " + operator + " :" + itemPrefix;
			}
			else {
				return itemPrefix + "_" + propertyLevel.prefix + valueName + " " + operator
						+ " :" + itemPrefix;
			}
		}

		/**
		 * The Enum PropertyLevel.
		 */
		public static enum PropertyLevel {
			DEVICE("d.", true),
			CONFIG("c.", true),
			DIAGNOSTICRESULT("dr.", false),
			DEVICEATTRIBUTE("da.", false),
			CONFIGATTRIBUTE("ca.", false);

			/** The prefix. */
			private String prefix;
			private boolean nativeProperty;

			/**
			 * Instantiates a new property level.
			 *
			 * @param prefix the prefix
			 */
			PropertyLevel(String prefix, boolean nativeProperty) {
				this.prefix = prefix;
				this.nativeProperty = nativeProperty;
			}

		}

		/**
		 * Instantiates a new config item expression.
		 *
		 * @param driver the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public AttributeExpression(DeviceDriver driver,
				String item, String property, PropertyLevel propertyLevel) {
			super(driver);
			this.item = item;
			this.property = property;
			this.propertyLevel = propertyLevel;
		}

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			if (tokens.size() == 0 || tokens.get(0).type != TokenType.ITEM) {
				return null;
			}
			Expression textExpression = TextAttributeExpression.parse(tokens, parsingData);
			if (textExpression != null) {
				return textExpression;
			}
			Expression dateExpression = DateAttributeExpression.parse(tokens, parsingData);
			if (dateExpression != null) {
				return dateExpression;
			}
			Expression enumExpression = EnumAttributeExpression.parse(tokens, parsingData);
			if (enumExpression != null) {
				return enumExpression;
			}
			Expression numExpression = NumericAttributeExpression.parse(tokens, parsingData);
			if (numExpression != null) {
				return numExpression;
			}
			Expression binaryExpression = BinaryAttributeExpression.parse(tokens, parsingData);
			if (binaryExpression != null) {
				return binaryExpression;
			}
			

			throw new FinderParseException(String.format(
					"Unknown configuration field [%s] at character %d.",
					tokens.get(0).text, tokens.get(0).position));
		}

		/**
		 * Gets the text value.
		 *
		 * @return the text value
		 */
		protected abstract String getTextValue();

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		public String toString() {
			return String.format("[%s] %s %s", item.toString(), sign,
					this.getTextValue());
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			switch (this.propertyLevel) {
			case CONFIGATTRIBUTE:
				criteria.joins.add(String.format("c.attributes %s_ca with %s_ca.name = :%s_name",
						itemPrefix, itemPrefix, itemPrefix));
			case CONFIG:
				criteria.whereJoins.add("d.lastConfig = c");
				criteria.otherTables.add("Config c");
				break;
			case DEVICEATTRIBUTE:
				criteria.joins.add(String.format("d.attributes %s_da with %s_da.name = :%s_name",
						itemPrefix, itemPrefix, itemPrefix));
				break;
			case DIAGNOSTICRESULT:
				criteria.joins.add(String.format("d.diagnosticResults %s_dr", itemPrefix));
				criteria.joins.add(String.format("%s_dr.diagnostic %s_dg with %s_dg.name = :%s_name",
						itemPrefix, itemPrefix, itemPrefix, itemPrefix));
				break;
			default:
				break;
			}
			return criteria;
		}
		
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			if (!propertyLevel.nativeProperty) {
				query.setParameter(itemPrefix + "_name", property);
			}
		}
	}

	/**
	 * The Class NumericAttributeExpression.
	 */
	public static class NumericAttributeExpression extends AttributeExpression {

		/** The value. */
		private Double value;

		/**
		 * Instantiates a new numeric config item expression.
		 *
		 * @param driver the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public NumericAttributeExpression(DeviceDriver driver,
				String item, String property, PropertyLevel propertyLevel) {
			super(driver, item, property, propertyLevel);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.AttributeExpression#getTextValue()
		 */
		protected String getTextValue() {
			NumberFormat format = NumberFormat.getInstance(Locale.ENGLISH);
			format.setGroupingUsed(false);
			return format.format(value);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.AttributeExpression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			switch (sign) {
			case GREATERTHAN:
				criteria.where = this.buildWhere("number", ">", itemPrefix);
				break;
			case LESSTHAN:
				criteria.where = this.buildWhere("number", "<", itemPrefix);
				break;
			default:
				criteria.where = this.buildWhere("number", "=", itemPrefix);
				break;
			}
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			query.setParameter(itemPrefix, value);
		}
		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			String property = null;
			String item = null;
			PropertyLevel level = PropertyLevel.DEVICE;
			if (parsingData.getDeviceDriver() != null) {
				for (AttributeDefinition attribute : parsingData.getDeviceDriver().getAttributes()) {
					if (attribute.isSearchable() && attribute.getType() == AttributeType.NUMERIC &&
							attribute.getTitle().equalsIgnoreCase(tokens.get(0).text)) {
						property = attribute.getName();
						item = attribute.getTitle();
						if (attribute.getLevel() == AttributeLevel.CONFIG) {
							level = PropertyLevel.CONFIGATTRIBUTE;
						}
						else {
							level = PropertyLevel.DEVICEATTRIBUTE;
						}
						break;
					}
				}
			}
			if (item == null) {
				Matcher diagMatcher = DIAGNOSTIC_PATTERN.matcher(tokens.get(0).text);
				if (diagMatcher.find()) {
					String diagnosticName = diagMatcher.group(1);
					property = diagnosticName;
					for (Diagnostic diagnostic : parsingData.getDiagnostics()) {
						if (diagnostic.getResultType().equals(AttributeType.NUMERIC) && diagnostic.getName().equals(diagnosticName)) {
							item = String.format("Diagnostic \"%s\"", diagnosticName);
							level = PropertyLevel.DIAGNOSTICRESULT;
							break;
						}
					}
				}
			}
			if (item == null) {
				return null;
			}
			if (tokens.size() != 3) {
				throw new FinderParseException(String.format(
						"Incomplete or incorrect expression after numeric item at character %d.",
						tokens.get(0).position));
			}
			Token sign = tokens.get(1);
			Token value = tokens.get(2);

			if (sign.type != TokenType.IS && sign.type != TokenType.LESSTHAN
					&& sign.type != TokenType.GREATERTHAN) {
				throw new FinderParseException(String.format(
						"Parsing error, invalid numeric operator at position %d.",
						sign.position));
			}
			if (value.type != TokenType.NUMERIC) {
				throw new FinderParseException(String.format(
						"Parsing error, should be a quoted date at character %d.",
						value.position));
			}
			NumericAttributeExpression numExpr =
					new NumericAttributeExpression(parsingData.getDeviceDriver(), item, property, level);
			
			try {
				numExpr.value = Double.parseDouble(value.text);
			}
			catch (NumberFormatException e) {
				throw new FinderParseException(String.format(
						"Parsing error, uname to parse the numeric value at character %d.",
								value.position));
			}
			numExpr.sign = sign.type;	
			return numExpr;
		}

	}

	/**
	 * The Class EnumAttributeExpression.
	 */
	public static class EnumAttributeExpression extends AttributeExpression {

		/** The value. */
		private Object value;

		/**
		 * Instantiates a new enum config item expression.
		 *
		 * @param driver the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public EnumAttributeExpression(DeviceDriver driver,
				String item, String property, PropertyLevel propertyLevel) {
			super(driver, item, property, propertyLevel);
			this.sign = TokenType.IS;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.AttributeExpression#getTextValue()
		 */
		protected String getTextValue() {
			return "\"" + TokenType.escape(value.toString()) + "\"";
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.AttributeExpression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = this.buildWhere("choice", "=", itemPrefix);
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			query.setParameter(itemPrefix, value);
		}

		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			String property = null;
			String item = null;
			@SuppressWarnings("rawtypes") Class theEnum = null;
			PropertyLevel level = PropertyLevel.DEVICE;
			if ("Network class".equalsIgnoreCase(tokens.get(0).text)) {
				property = "networkClass";
				item = "Network class";
				theEnum = NetworkClass.class;
			}
			else if ("Software level".equalsIgnoreCase(tokens.get(0).text)) {
				property = "softwareLevel";
				item = "Software level";
				theEnum = SoftwareRule.ConformanceLevel.class;
			}
			else if ("Status".equalsIgnoreCase(tokens.get(0).text)) {
				property = "status";
				item = "Status";
				theEnum = Device.Status.class;
			}
			if (item == null) {
				return null;
			}
			if (tokens.size() != 3) {
				throw new FinderParseException(String.format(
						"Incomplete or incorrect expression after enum item at character %d.",
						tokens.get(0).position));
			}
			Token sign = tokens.get(1);
			Token value = tokens.get(2);
			if (sign.type != TokenType.IS) {
				throw new FinderParseException(String.format(
						"Parsing error, invalid operator at position %d, should be 'IS'.",
						sign.position));
			}
			if (value.type != TokenType.QUOTE) {
				throw new FinderParseException(String.format(
						"Parsing error, should be a quoted string at character %d.",
						value.position));
			}
			EnumAttributeExpression enumExpr =
					new EnumAttributeExpression(parsingData.getDeviceDriver(), item, property, level);
			try {
				@SuppressWarnings("unchecked")
				Object choice = Enum.valueOf(theEnum, value.text);
				enumExpr.value = choice;
			}
			catch (Exception e) {
				throw new FinderParseException(String.format(
						"Invalid value for item %s at character %d.", item, value.position));
			}
			return enumExpr;
		}
	}

	/**
	 * The Class TextAttributeExpression.
	 */
	public static class TextAttributeExpression extends AttributeExpression {

		/** The value. */
		private String value;

		private boolean longText = false;

		/**
		 * Instantiates a new text config item expression.
		 *
		 * @param driver the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public TextAttributeExpression(DeviceDriver driver,
				String item, String property, PropertyLevel propertyLevel) {
			super(driver, item, property, propertyLevel);
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.AttributeExpression#getTextValue()
		 */
		protected String getTextValue() {
			return "\"" + TokenType.escape(value) + "\"";
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.AttributeExpression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = this.buildWhere(longText ? "longText.text" : "text", "like", itemPrefix);
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			String target;
			switch (sign) {
			case CONTAINS:
				target = "%" + value + "%";
				break;
			case STARTSWITH:
				target = value + "%";
				break;
			case ENDSWITH:
				target = "%" + value;
				break;
			default:
				target = value;
			}
			query.setParameter(itemPrefix, target);
		}
		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			String property = null;
			String item = null;
			PropertyLevel level = PropertyLevel.DEVICE;
			boolean longText = false;
			if ("Name".equalsIgnoreCase(tokens.get(0).text)) {
				property = "name";
				item = "Name";
			}
			else if ("Comments".equalsIgnoreCase(tokens.get(0).text)) {
				property = "comments";
				item = "Comments";
			}
			else if ("Contact".equalsIgnoreCase(tokens.get(0).text)) {
				property = "contact";
				item = "Contact";
			}
			else if ("Family".equalsIgnoreCase(tokens.get(0).text)) {
				property = "family";
				item = "Family";
			}
			else if ("Location".equalsIgnoreCase(tokens.get(0).text)) {
				property = "location";
				item = "Location";
			}
			else if ("Software version".equalsIgnoreCase(tokens.get(0).text)) {
				property = "softwareVersion";
				item = "Software version";
			}
			else if (parsingData.getDeviceDriver() != null) {
				for (AttributeDefinition attribute : parsingData.getDeviceDriver().getAttributes()) {
					if (attribute.isSearchable() &&
							(attribute.getType() == AttributeType.LONGTEXT || attribute.getType() == AttributeType.TEXT) &&
							attribute.getTitle().equalsIgnoreCase(tokens.get(0).text)) {
						property = attribute.getName();
						item = attribute.getTitle();
						if (attribute.getLevel() == AttributeLevel.CONFIG) {
							level = PropertyLevel.CONFIGATTRIBUTE;
						}
						else {
							level = PropertyLevel.DEVICEATTRIBUTE;
						}
						longText = attribute.getType() == AttributeType.LONGTEXT;
						break;
					}
				}
			}
			if (item == null) {
				Matcher diagMatcher = DIAGNOSTIC_PATTERN.matcher(tokens.get(0).text);
				if (diagMatcher.find()) {
					String diagnosticName = diagMatcher.group(1);
					property = diagnosticName;
					for (Diagnostic diagnostic : parsingData.getDiagnostics()) {
						if (diagnostic.getResultType().equals(AttributeType.TEXT) && diagnostic.getName().equals(diagnosticName)) {
							item = String.format("Diagnostic \"%s\"", diagnosticName);
							level = PropertyLevel.DIAGNOSTICRESULT;
							break;
						}
					}
				}
			}
			if (item == null) {
				return null;
			}
			if (tokens.size() != 3) {
				throw new FinderParseException(String.format(
						"Incomplete or incorrect expression after text item at character %d.",
						tokens.get(0).position));
			}
			Token sign = tokens.get(1);
			Token value = tokens.get(2);
			if (sign.type != TokenType.IS && sign.type != TokenType.CONTAINS &&
					sign.type != TokenType.STARTSWITH && sign.type != TokenType.STARTSWITH &&
					sign.type != TokenType.ENDSWITH) {
				throw new FinderParseException(String.format(
						"Invalid operator for a text item at character %d.",
						sign.position));
			}
			if (value.type != TokenType.QUOTE) {
				throw new FinderParseException(String.format(
						"Parsing error, should be a quoted text, at character %d.",
						value.position));
			}
			TextAttributeExpression textExpr =
					new TextAttributeExpression(parsingData.getDeviceDriver(), item, property, level);
			textExpr.value = value.text;
			textExpr.sign = sign.type;
			textExpr.longText = longText;
			return textExpr;
		}
	}

	/**
	 * The Class DateAttributeExpression.
	 */
	public static class DateAttributeExpression extends AttributeExpression {

		/** The Constant WITHTIME. */
		final private static DateFormat WITHTIME = new SimpleDateFormat(
				"yyyy-MM-dd HH:mm");

		/** The Constant WITHOUTTIME. */
		final private static DateFormat WITHOUTTIME = new SimpleDateFormat(
				"yyyy-MM-dd");
		static {
			WITHTIME.setLenient(false);
			WITHOUTTIME.setLenient(false);
		}

		/**
		 * Instantiates a new date config item expression.
		 *
		 * @param driver the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public DateAttributeExpression(DeviceDriver driver,
				String item, String property, PropertyLevel propertyLevel) {
			super(driver, item, property, propertyLevel);
		}

		/** The value. */
		private Date value;

		/** The format. */
		private DateFormat format = WITHTIME;

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.AttributeExpression#getTextValue()
		 */
		protected String getTextValue() {
			return "\"" + this.format.format(this.value) + "\"";
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.AttributeExpression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			switch (sign) {
			case AFTER:
				criteria.where = this.buildWhere("when", ">=", itemPrefix);
				break;
			case BEFORE:
				criteria.where = this.buildWhere("when", "<=", itemPrefix);
				break;
			default:
				criteria.where = "(" + this.buildWhere("when", ">=", itemPrefix + "_1") + " and "
						+ this.buildWhere("when", "<=", itemPrefix + "_2") + ")";
			}
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			Calendar beginTime = Calendar.getInstance();
			beginTime.setTime(value);
			Calendar endTime = Calendar.getInstance();
			endTime.setTime(value);
			if (this.format == WITHOUTTIME) {
				beginTime.set(Calendar.MILLISECOND, 0);
				beginTime.set(Calendar.SECOND, 0);
				beginTime.set(Calendar.MINUTE, 0);
				beginTime.set(Calendar.HOUR, 0);
				endTime.setTime(beginTime.getTime());
				endTime.add(Calendar.DAY_OF_MONTH, 1);
				endTime.add(Calendar.MILLISECOND, -1);
			}
			switch (sign) {
			case AFTER:
				query.setParameter(itemPrefix, beginTime.getTime());
				break;
			case BEFORE:
				query.setParameter(itemPrefix, endTime.getTime());
				break;
			default:
				query.setParameter(itemPrefix + "_1", beginTime.getTime());
				query.setParameter(itemPrefix + "_2", endTime.getTime());
			}
		}
		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			String property = null;
			String item = null;
			PropertyLevel level = PropertyLevel.DEVICE;
			if ("Creation date".equalsIgnoreCase(tokens.get(0).text)) {
				property = "createdDate";
				item = "Creation date";
			}
			else if ("Last change date".equalsIgnoreCase(tokens.get(0).text)) {
				property = "changeDate";
				item = "Last change date";
			}
			else if (parsingData.getDeviceDriver() != null) {
				for (AttributeDefinition attribute : parsingData.getDeviceDriver().getAttributes()) {
					if (attribute.isSearchable() && attribute.getType() == AttributeType.DATE &&
							attribute.getTitle().equalsIgnoreCase(tokens.get(0).text)) {
						property = attribute.getName();
						item = attribute.getTitle();
						if (attribute.getLevel() == AttributeLevel.CONFIG) {
							level = PropertyLevel.CONFIGATTRIBUTE;
						}
						else {
							level = PropertyLevel.DEVICEATTRIBUTE;
						}
						break;
					}
				}
			}
			if (item == null) {
				return null;
			}
			if (tokens.size() != 3) {
				throw new FinderParseException(String.format(
						"Incomplete or incorrect expression after date item at character %d.",
						tokens.get(0).position));
			}
			Token sign = tokens.get(1);
			Token value = tokens.get(2);

			if (sign.type != TokenType.BEFORE && sign.type != TokenType.AFTER
					&& sign.type != TokenType.IS) {

				throw new FinderParseException(String.format(
						"Parsing error, invalid date operator at position %d.",
						sign.position));

			}
			if (value.type != TokenType.QUOTE) {
				throw new FinderParseException(String.format(
						"Parsing error, should be a quoted date at character %d.",
						value.position));
			}
			DateAttributeExpression dateExpr = new DateAttributeExpression(
					parsingData.getDeviceDriver(), item, property, level);
			dateExpr.sign = sign.type;
			try {
				dateExpr.value = dateExpr.format.parse(value.text);
			}
			catch (ParseException e1) {
				try {
					dateExpr.format = DateAttributeExpression.WITHOUTTIME;
					dateExpr.value = dateExpr.format.parse(value.text);
				}
				catch (ParseException e2) {
					throw new FinderParseException(String.format(
							"Invalid date/time at position %d.", value.position));
				}
			}
			return dateExpr;
		}
	}

	/**
	 * The Class BinaryAttributeExpression.
	 */
	public static class BinaryAttributeExpression extends AttributeExpression {
		
		private boolean value;

		/**
		 * Instantiates a new binary config item expression.
		 *
		 * @param driver the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public BinaryAttributeExpression(DeviceDriver driver,
				String item, String property, PropertyLevel propertyLevel) {
			super(driver, item, property, propertyLevel);
			this.sign = TokenType.IS;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.AttributeExpression#getTextValue()
		 */
		protected String getTextValue() {
			return value ? "TRUE" : "FALSE";
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.AttributeExpression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = this.buildWhere("assumption", "is", itemPrefix);
			return criteria;
		}

		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			query.setParameter(itemPrefix, this.value);
		}
		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			String property = null;
			String item = null;
			PropertyLevel level = PropertyLevel.DEVICE;
			if (parsingData.getDeviceDriver() != null) {
				for (AttributeDefinition attribute : parsingData.getDeviceDriver().getAttributes()) {
					if (attribute.isSearchable() && attribute.getType() == AttributeType.BINARY &&
							attribute.getTitle().equalsIgnoreCase(tokens.get(0).text)) {
						property = attribute.getName();
						item = attribute.getTitle();
						if (attribute.getLevel() == AttributeLevel.CONFIG) {
							level = PropertyLevel.CONFIGATTRIBUTE;
						}
						else {
							level = PropertyLevel.DEVICEATTRIBUTE;
						}
						break;
					}
				}
			}
			if (item == null) {
				Matcher diagMatcher = DIAGNOSTIC_PATTERN.matcher(tokens.get(0).text);
				if (diagMatcher.find()) {
					String diagnosticName = diagMatcher.group(1);
					property = diagnosticName;
					for (Diagnostic diagnostic : parsingData.getDiagnostics()) {
						if (diagnostic.getResultType().equals(AttributeType.BINARY) && diagnostic.getName().equals(diagnosticName)) {
							item = String.format("Diagnostic \"%s\"", diagnosticName);
							level = PropertyLevel.DIAGNOSTICRESULT;
							break;
						}
					}
				}
			}
			if (item == null) {
				return null;
			}
			if (tokens.size() != 3) {
				throw new FinderParseException(String.format(
						"Incomplete or incorrect expression after enum item at character %d.",
						tokens.get(0).position));
			}
			Token sign = tokens.get(1);
			Token value = tokens.get(2);
			if (sign.type != TokenType.IS) {
				throw new FinderParseException(String.format(
						"Parsing error, invalid operator at position %d, should be 'IS'.",
						sign.position));
			}
			BinaryAttributeExpression binExpr =
					new BinaryAttributeExpression(parsingData.getDeviceDriver(), item, property, level);
			if (value.type == TokenType.TRUE) {
				binExpr.value = true;
			}
			else if (value.type == TokenType.FALSE) {
				binExpr.value = false;
			}
			else {
				throw new FinderParseException(String.format(
						"Parsing error, invalid operator at position %d, should be 'TRUE' or 'FALSE'.",
						value.position));
			}
			return binExpr;
		}
	}

	/**
	 * The Class FinderCriteria.
	 */
	private static class FinderCriteria {

		/** The where filter. */
		public String where = "1 = 1";

		/** The HQL additional tables to join. */
		public Set<String> joins = new TreeSet<String>();

		/** The tables (other than the main device) to fetch from */
		public Set<String> otherTables = new TreeSet<String>();

		/** The where clauses to prepend to join other tables to the device one */
		public Set<String> whereJoins = new TreeSet<String>();
	}

	/**
	 * The Class ModuleExpression.
	 */
	public static class VrfExpression extends Expression {
	

		public VrfExpression(DeviceDriver driver) {
			super(driver);
		}
	
		/** The sign. */
		public TokenType sign;
	
		/** The value. */
		private String value;
	
		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			if (tokens.size() == 3 && tokens.get(0).type == TokenType.VRF) {
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);
				switch (comparator.type) {
				case IS:
				case CONTAINS:
				case STARTSWITH:
				case ENDSWITH:
					if (value.type == TokenType.QUOTE) {
						VrfExpression modExpr = new VrfExpression(parsingData.getDeviceDriver());
						modExpr.sign = comparator.type;
						modExpr.value = TokenType.unescape(value.text);
						return modExpr;
					}
					else {
						throw new FinderParseException(String.format(
								"Expecting a quoted string for VRF at character %d.",
								value.position));
					}
				default:
					throw new FinderParseException(String.format(
							"Invalid operator after VRF at character %d.",
							comparator.position));
				}
			}
			return null;
		}
	
		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = String.format("(v like :%s)", itemPrefix);
			criteria.joins.add("d.vrfInstances v");
			return criteria;
		}
	
		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			String target;
			switch (sign) {
			case CONTAINS:
				target = "%" + value + "%";
				break;
			case STARTSWITH:
				target = value + "%";
				break;
			case ENDSWITH:
				target = "%" + value;
				break;
			default:
				target = value;
			}
			query.setParameter(itemPrefix, target);
		}
	
		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[%s] %s \"%s\"", TokenType.VRF, sign,
					TokenType.escape(value));
		}
	
	}

	/**
	 * The Class ModuleExpression.
	 */
	public static class VirtualNameExpression extends Expression {
	
	
		public VirtualNameExpression(DeviceDriver driver) {
			super(driver);
		}
	
		/** The sign. */
		public TokenType sign;
	
		/** The value. */
		private String value;
	
		/**
		 * Parses the tokens to create an expression.
		 *
		 * @param tokens the tokens
		 * @param parsingData other contextual parsing data
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
				ParsingData parsingData) throws FinderParseException {
			if (tokens.size() == 3 && tokens.get(0).type == TokenType.VIRTUALNAME) {
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);
				switch (comparator.type) {
				case IS:
				case CONTAINS:
				case STARTSWITH:
				case ENDSWITH:
					if (value.type == TokenType.QUOTE) {
						VirtualNameExpression vnameExpr = new VirtualNameExpression(parsingData.getDeviceDriver());
						vnameExpr.sign = comparator.type;
						vnameExpr.value = TokenType.unescape(value.text);
						return vnameExpr;
					}
					else {
						throw new FinderParseException(String.format(
								"Expecting a quoted string for VirtualName at character %d.",
								value.position));
					}
				default:
					throw new FinderParseException(String.format(
							"Invalid operator after VirtualName at character %d.",
							comparator.position));
				}
			}
			return null;
		}
	
		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = String.format("(v like :%s) or (d.name like :%s)", itemPrefix, itemPrefix);
			criteria.joins.add("d.virtualDevices v");
			return criteria;
		}
	
		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query<?> query, String itemPrefix) {
			super.setVariables(query, itemPrefix);
			String target;
			switch (sign) {
			case CONTAINS:
				target = "%" + value + "%";
				break;
			case STARTSWITH:
				target = value + "%";
				break;
			case ENDSWITH:
				target = "%" + value;
				break;
			default:
				target = value;
			}
			query.setParameter(itemPrefix, target);
		}
	
		/* (non-Javadoc)
		 * @see onl.netfishers.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[%s] %s \"%s\"", TokenType.VIRTUALNAME, sign,
					TokenType.escape(value));
		}
	
	}

	/**
	 * Gets the device config class.
	 *
	 * @param driver the device class
	 * @return the device config class
	 */
	@SuppressWarnings("unchecked")
	public static Class<? extends Config> getDeviceConfigClass(
			Class<?> driver) {
		Class<?>[] innerClasses = driver.getDeclaredClasses();
		for (Class<?> innerClass : innerClasses) {
			if (Config.class.isAssignableFrom(innerClass)) {
				return (Class<? extends Config>) innerClass;
			}
		}
		return null;
	}

	/** The Constant HQLPREFIX. */
	private final static String HQLPREFIX = "var";

	/** The tokens. */
	private List<Token> tokens;

	/** The expression. */
	private Expression expression;

	/**
	 * Instantiates a new finder.
	 *
	 * @param Query<?> the query
	 * @param driver the device class
	 * @throws FinderParseException the finder parse exception
	 */
	public Finder(String query, DeviceDriver driver)
			throws FinderParseException {
		this.tokens = Expression.tokenize(query);
		if (this.tokens.size() == 0) {
			this.expression = new NullExpression(driver);
		}
		else {
			this.expression = Expression.parse(tokens, new ParsingData(driver));
		}
	}

	/**
	 * Gets the formatted query.
	 *
	 * @return the formatted query
	 */
	public String getFormattedQuery() {
		return expression.toString();
	}

	/**
	 * Gets the hql.
	 *
	 * @return the hql
	 */
	public String getHql() {
		FinderCriteria criteria = this.expression.buildHqlString(HQLPREFIX);
		StringBuilder hql = new StringBuilder();
		hql.append(" from Device d");
		for (String table : criteria.otherTables) {
			hql.append(", ").append(table);
		}
		for (String join : criteria.joins) {
			hql.append(" join ").append(join);
		}
		hql.append(" where ");
		if (this.expression.driver != null) {
			hql.append("d.driver = :driver").append(" and ");
		}
		for (String where : criteria.whereJoins) {
			hql.append(where).append(" and ");
		}
		hql.append("(").append(criteria.where).append(")");
		return hql.toString();
	}

	/**
	 * Sets the variables.
	 *
	 * @param Query<?> the new variables
	 */
	public void setVariables(Query<?> query) {
		this.expression.setVariables(query, HQLPREFIX);
	}

}
