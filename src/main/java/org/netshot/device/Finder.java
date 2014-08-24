/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device;

import java.lang.reflect.Method;
import java.net.UnknownHostException;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.hibernate.Query;
import org.netshot.device.ConfigItem.Comparator;
import org.netshot.device.Finder.Expression.FinderParseException;

/**
 * A Finder finds devices based on a text expression.
 */
public class Finder {

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
		
		/** The ip. */
		IP("(?i)^\\s*(\\[ip\\])", "IP"),
		
		/** The mac. */
		MAC("(?i)^\\s*(\\[mac\\])", "MAC"),
		
		/** The module. */
		MODULE("(?i)^\\s*(\\[module\\])", "MODULE"),
		
		/** The device. */
		DEVICE("(?i)^\\s*(\\[device\\])", "DEVICE"),
		
		/** The SUBNET v4. */
		SUBNETV4(
		    "^\\s*(((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(1[0-9]|2[0-9]|3[0-2]|[0-9]))",
		    ""),
		
		/** The IP v4. */
		IPV4(
		    "^\\s*(((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))",
		    ""),
		
		/** The SUBNET v6. */
		SUBNETV6(
		    "^\\s*(((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(([0-9A-Fa-f]{1,4}:){0,5}:((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(::([0-9A-Fa-f]{1,4}:){0,5}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))/(1[01][0-9]|12[0-8]|[0-9][0-9]|[0-9]))",
		    ""),
		
		/** The IP v6. */
		IPV6(
		    "^\\s*((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(([0-9A-Fa-f]{1,4}:){0,5}:((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(::([0-9A-Fa-f]{1,4}:){0,5}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))",
		    ""),
		
		/** The macsubnet. */
		MACSUBNET(
		    "^\\s*([0-9a-fA-F]{4}\\.[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4}/(4[0-8]|[1-3][0-9]|[0-9]))",
		    ""),
		
		/** The macaddress. */
		MACADDRESS("^\\s*([0-9a-fA-F]{4}\\.[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4})", ""),
		
		/** The quote. */
		QUOTE("^\\s*\"(.*?)(?<!\\\\)\"", ""),
		
		/** The numeric. */
		NUMERIC("^\\s*([0-9\\.]+)\\b", ""),
		
		/** The item. */
		ITEM("^\\s*\\[([A-Za-z\\-0-9 \\(\\)]+)\\]", "");

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
		protected Class<? extends Device> deviceClass;

		/**
		 * Instantiates a new expression.
		 *
		 * @param deviceClass the device class
		 */
		public Expression(Class<? extends Device> deviceClass) {
			this.deviceClass = deviceClass;
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
		 * Parses the.
		 *
		 * @param tokens the tokens
		 * @param deviceClass the device class
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
		    Class<? extends Device> deviceClass) throws FinderParseException {
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
						token.expression = Expression.parse(subTokens, deviceClass);
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

			expr = OrOperator.parse(tokens, deviceClass);
			if (expr != null) {
				return expr;
			}

			expr = AndOperator.parse(tokens, deviceClass);
			if (expr != null) {
				return expr;
			}

			expr = NotOperator.parse(tokens, deviceClass);
			if (expr != null) {
				return expr;
			}

			expr = ModuleExpression.parse(tokens, deviceClass);
			if (expr != null) {
				return expr;
			}
			
			expr = DeviceExpression.parse(tokens, deviceClass);
			if (expr != null) {
				return expr;
			}

			expr = Ipv4Expression.parse(tokens, deviceClass);
			if (expr != null) {
				return expr;
			}

			expr = Ipv6Expression.parse(tokens, deviceClass);
			if (expr != null) {
				return expr;
			}

			expr = MacExpression.parse(tokens, deviceClass);
			if (expr != null) {
				return expr;
			}

			expr = ConfigItemExpression.parse(tokens, deviceClass);
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
		 * @param query the query
		 * @param itemPrefix the item prefix
		 */
		public abstract void setVariables(Query query, String itemPrefix);
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
		 * @param deviceClass the device class
		 */
		public NotOperator(Class<? extends Device> deviceClass) {
			super(deviceClass);
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			StringBuffer buffer = new StringBuffer();
			buffer.append(TokenType.NOT).append(" ").append(child.toString());
			return buffer.toString();
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = this.child.buildHqlString(itemPrefix + "_0");
			criteria.where = "not (" + criteria.where + ")";
			return criteria;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query query, String itemPrefix) {
			child.setVariables(query, itemPrefix + "_0");
		}

		/**
		 * Parses the.
		 *
		 * @param tokens the tokens
		 * @param deviceClass the device class
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
		    Class<? extends Device> deviceClass) throws FinderParseException {
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
						NotOperator notExpr = new NotOperator(deviceClass);
						t.previous();
						t.remove();
						notExpr.child = Expression.parse(tokens, deviceClass);
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
		 * @param deviceClass the device class
		 */
		public AndOperator(Class<? extends Device> deviceClass) {
			super(deviceClass);
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#toString()
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
		 * @see org.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
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
				i++;
			}
			criteria.where += ")";
			return criteria;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query query, String itemPrefix) {
			int i = 0;
			for (Expression child : children) {
				child.setVariables(query, itemPrefix + "_" + i);
				i++;
			}
		}

		/**
		 * Parses the.
		 *
		 * @param tokens the tokens
		 * @param deviceClass the device class
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
		    Class<? extends Device> deviceClass) throws FinderParseException {
			ListIterator<Token> t = tokens.listIterator();
			AndOperator andExpr = new AndOperator(deviceClass);
			List<Token> tokenBuffer = new ArrayList<Token>();
			while (t.hasNext()) {
				Token token = t.next();
				if (token.type == TokenType.AND) {
					if (tokenBuffer.size() == 0) {
						throw new FinderParseException(String.format(
						    "Parsing error, nothing before AND at character %d.",
						    token.position));
					}
					andExpr.children.add(Expression.parse(tokenBuffer, deviceClass));
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
				andExpr.children.add(Expression.parse(tokenBuffer, deviceClass));
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
		 * @param deviceClass the device class
		 */
		public OrOperator(Class<? extends Device> deviceClass) {
			super(deviceClass);
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#toString()
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
		 * @see org.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
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
				i++;
			}
			criteria.where += ")";
			return criteria;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query query, String itemPrefix) {
			int i = 0;
			for (Expression child : children) {
				child.setVariables(query, itemPrefix + "_" + i);
				i++;
			}
		}

		/**
		 * Parses the.
		 *
		 * @param tokens the tokens
		 * @param deviceClass the device class
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
		    Class<? extends Device> deviceClass) throws FinderParseException {
			ListIterator<Token> t = tokens.listIterator();
			OrOperator orExpr = new OrOperator(deviceClass);
			List<Token> tokenBuffer = new ArrayList<Token>();
			while (t.hasNext()) {
				Token token = t.next();
				if (token.type == TokenType.OR) {
					if (tokenBuffer.size() == 0) {
						throw new FinderParseException(String.format(
						    "Parsing error, nothing before OR at character %d.",
						    token.position));
					}
					orExpr.children.add(Expression.parse(tokenBuffer, deviceClass));
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
				orExpr.children.add(Expression.parse(tokenBuffer, deviceClass));
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
		 * @param deviceClass the device class
		 */
		public ModuleExpression(Class<? extends Device> deviceClass) {
			super(deviceClass);
		}

		/** The sign. */
		public TokenType sign;
		
		/** The value. */
		private String value;

		/**
		 * Parses the.
		 *
		 * @param tokens the tokens
		 * @param deviceClass the device class
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
		    Class<? extends Device> deviceClass) throws FinderParseException {
			if (tokens.size() == 3 && tokens.get(0).type == TokenType.MODULE) {
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);
				switch (comparator.type) {
				case IS:
				case CONTAINS:
				case STARTSWITH:
				case ENDSWITH:
					if (value.type == TokenType.QUOTE) {
						ModuleExpression modExpr = new ModuleExpression(deviceClass);
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
		 * @see org.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
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
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query query, String itemPrefix) {
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
			query.setString(itemPrefix, target);
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[%s] %s \"%s\"", TokenType.MODULE, sign,
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
		 * @param deviceClass the device class
		 */
		public DeviceExpression(Class<? extends Device> deviceClass) {
			super(deviceClass);
		}

		/** The value. */
		private Long value;

		/**
		 * Parses the.
		 *
		 * @param tokens the tokens
		 * @param deviceClass the device class
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
		    Class<? extends Device> deviceClass) throws FinderParseException {
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
				DeviceExpression devExpr = new DeviceExpression(deviceClass);
				devExpr.value = Long.parseLong(value.text);
				return devExpr;
			}
			return null;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = String.format("d.id = :%s", itemPrefix);
			return criteria;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query query, String itemPrefix) {
			query.setLong(itemPrefix, value);
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[%s] %s %d", TokenType.MODULE, TokenType.IS, this.value);
		}

	}

	/**
	 * The Class NullExpression.
	 */
	public static class NullExpression extends Expression {

		/**
		 * Instantiates a new null expression.
		 *
		 * @param deviceClass the device class
		 */
		public NullExpression(Class<? extends Device> deviceClass) {
	    super(deviceClass);
    }

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#toString()
		 */
		@Override
    public String toString() {
	    return "";
    }

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		@Override
    public FinderCriteria buildHqlString(String itemPrefix) {
	    FinderCriteria criteria = super.buildHqlString(itemPrefix);
	    criteria.where = "1 = 1";
	    return criteria;
    }

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		@Override
    public void setVariables(Query query, String itemPrefix) {
    }
		
	}
	
	/**
	 * The Class MacExpression.
	 */
	public static class MacExpression extends Expression {
		
		/**
		 * Instantiates a new mac expression.
		 *
		 * @param deviceClass the device class
		 */
		public MacExpression(Class<? extends Device> deviceClass) {
			super(deviceClass);
		}

		/** The sign. */
		public TokenType sign;
		
		/** The target. */
		public PhysicalAddress target;
		
		/** The prefix length. */
		public int prefixLength;

		/**
		 * Parses the.
		 *
		 * @param tokens the tokens
		 * @param deviceClass the device class
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
		    Class<? extends Device> deviceClass) throws FinderParseException {
			if (tokens.get(0).type == TokenType.MAC) {
				if (tokens.size() != 3) {
					throw new FinderParseException(String.format(
					    "Incomplete expression after MAC at character %d.",
					    tokens.get(0).position));
				}
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);

				String mac = "";

				MacExpression macExpr = new MacExpression(deviceClass);
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
		 * @see org.netshot.device.Finder.Expression#toString()
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
		 * @see org.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
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
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		@Override
		public void setVariables(Query query, String itemPrefix) {
			if (this.sign == TokenType.IN) {
				long mask = 0xFFFFFFFFFFFFFFFFL << (48 - this.prefixLength);
				long min = this.target.getLongAddress() & mask;
				long max = this.target.getLongAddress() | ~mask;
				query.setLong(itemPrefix + "_0", min);
				query.setLong(itemPrefix + "_1", max);
			}
			else {
				query.setLong(itemPrefix + "_0", this.target.getLongAddress());
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
		 * @param deviceClass the device class
		 */
		public Ipv4Expression(Class<? extends Device> deviceClass) {
			super(deviceClass);
		}

		/** The sign. */
		public TokenType sign;
		
		/** The with mask. */
		public boolean withMask;
		
		/** The target. */
		public Network4Address target;

		/**
		 * Parses the.
		 *
		 * @param tokens the tokens
		 * @param deviceClass the device class
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
		    Class<? extends Device> deviceClass) throws FinderParseException {
			if (tokens.get(0).type == TokenType.IP) {
				if (tokens.size() != 3) {
					throw new FinderParseException(String.format(
					    "Incomplete expression after IP at character %d.",
					    tokens.get(0).position));
				}
				Token comparator = tokens.get(1);
				Token value = tokens.get(2);

				int prefixLength = 32;
				String ip = "";

				Ipv4Expression ipExpr = new Ipv4Expression(deviceClass);
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
		 * @see org.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[IP] %s %s", this.sign,
			    (this.withMask ? this.target.getPrefix() : this.target.getIP()));
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		@Override
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.joins.add("d.networkInterfaces ni");
			criteria.joins.add("ni.ip4Addresses ip4");
			if (this.sign == TokenType.IN) {
				criteria.where = String
				    .format(
				        "((d.mgmtAddress.address >= :%s_0 and d.mgmtAddress.address <= :%s_1) or (ip4.address >= :%s_0 and ip4.address < :%s_1))",
				        itemPrefix, itemPrefix, itemPrefix, itemPrefix);
			}
			else if (this.withMask) {
				criteria.where = String
				    .format(
				        "((d.mgmtAddress.address = :%s_0 and d.mgmtAddress.prefixLength = :%s_1) or (ip4.address = :%s_0 and ip4.prefixLength = :%s_1))",
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
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		@Override
		public void setVariables(Query query, String itemPrefix) {
			if (this.sign == TokenType.IN) {
				int min = this.target.getSubnetMin();
				int max = this.target.getSubnetMax();
				if (this.target.getPrefixLength() == 0) {
					max = (int) (0x7FFFFFFF);
					min = (int) (0x80000000);
				}
				query.setInteger(itemPrefix + "_0", (max > min ? min : max));
				query.setInteger(itemPrefix + "_1", (max > min ? max : min));
			}
			else if (this.withMask) {
				query.setInteger(itemPrefix + "_0", this.target.getIntAddress());
				query.setInteger(itemPrefix + "_1", this.target.getPrefixLength());
			}
			else {
				query.setInteger(itemPrefix + "_0", this.target.getIntAddress());
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
		 * @param deviceClass the device class
		 */
		public Ipv6Expression(Class<? extends Device> deviceClass) {
			super(deviceClass);
		}

		/** The sign. */
		public TokenType sign;
		
		/** The with mask. */
		public boolean withMask;
		
		/** The target. */
		public Network6Address target;

		/**
		 * Parses the.
		 *
		 * @param tokens the tokens
		 * @param deviceClass the device class
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
		    Class<? extends Device> deviceClass) throws FinderParseException {
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

				Ipv6Expression ipExpr = new Ipv6Expression(deviceClass);
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
		 * @see org.netshot.device.Finder.Expression#toString()
		 */
		@Override
		public String toString() {
			return String.format("[IP] %s %s", this.sign,
			    (this.withMask ? this.target.getPrefix() : this.target.getIP()));
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
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
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		@Override
		public void setVariables(Query query, String itemPrefix) {
			if (this.sign == TokenType.IN) {
				if (this.target.getPrefixLength() <= 64) {
					long mask = 0xFFFFFFFFFFFFFFFFL << (64 - this.target
					    .getPrefixLength());
					long min = this.target.getAddress1() & mask;
					long max = this.target.getAddress1() | ~mask;
					query.setLong(itemPrefix + "_0", (max > min ? min : max));
					query.setLong(itemPrefix + "_1", (max > min ? max : min));
				}
				else {
					long mask = 0xFFFFFFFFFFFFFFFFL << (128 - this.target
					    .getPrefixLength());
					long min = this.target.getAddress1() & mask;
					long max = this.target.getAddress1() | ~mask;
					query.setLong(itemPrefix + "_0", (max > min ? min : max));
					query.setLong(itemPrefix + "_1", (max > min ? max : min));
					query.setLong(itemPrefix + "_2", this.target.getAddress1());
				}
			}
			else if (this.withMask) {
				query.setLong(itemPrefix + "_0", this.target.getAddress1());
				query.setLong(itemPrefix + "_1", this.target.getAddress2());
				query.setInteger(itemPrefix + "_2", this.target.getPrefixLength());
			}
			else {
				query.setLong(itemPrefix + "_0", this.target.getAddress1());
				query.setLong(itemPrefix + "_1", this.target.getAddress2());
			}
		}

	}

	/**
	 * The Class ConfigItemExpression.
	 */
	public abstract static class ConfigItemExpression extends Expression {
		
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
		public String getPropertyName() {
			return propertyLevel.prefix + property;
		}

		/**
		 * The Enum PropertyLevel.
		 */
		public static abstract class PropertyLevel {

			/** The prefix. */
			private String prefix;
			
			private Class<?> configClass = null;

			/**
			 * Instantiates a new property level.
			 *
			 * @param prefix the prefix
			 */
			PropertyLevel(String prefix, Class<?> configClass) {
				this.prefix = prefix;
				this.configClass = configClass;
			}

		}
		
		public static class DeviceLevel extends PropertyLevel {
			DeviceLevel() {
				super("d.", null);
			}
		}
		
		public static class ConfigLevel extends PropertyLevel {
			ConfigLevel(Class<?> configClass) {
				super("c.", configClass);
			}
		}

		/**
		 * Instantiates a new config item expression.
		 *
		 * @param deviceClass the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public ConfigItemExpression(Class<? extends Device> deviceClass,
		    String item, String property, PropertyLevel propertyLevel) {
			super(deviceClass);
			this.item = item;
			this.property = ConfigItemExpression.getterToProperyName(property);
			this.propertyLevel = propertyLevel;
		}

		/**
		 * Gets the ter to propery name.
		 *
		 * @param getter the getter
		 * @return the ter to propery name
		 */
		protected static String getterToProperyName(String getter) {
			String propertyName = getter;
			Pattern pattern = Pattern
			    .compile("^(?<pre>is|get)(?<first>[A-Z])(?<rest>.*?)(?<astext>AsText)?$");
			Matcher matcher = pattern.matcher(propertyName);
			if (matcher.find()) {
				propertyName = matcher.group("first").toLowerCase()
				    + matcher.group("rest");
				if ("AsText".equals(matcher.group("astext"))) {
					propertyName += ".text";
				}
			}
			return propertyName;
		}

		/**
		 * Parses the item.
		 *
		 * @param tokens the tokens
		 * @param method the method
		 * @param deviceClass the device class
		 * @param propertyLevel the property level
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		private static Expression parseItem(List<Token> tokens, Method method,
		    Class<? extends Device> deviceClass, PropertyLevel propertyLevel)
		    throws FinderParseException {
			String item = tokens.get(0).text;
			ConfigItem annotation = method.getAnnotation(ConfigItem.class);
			if (annotation != null
			    && Arrays.asList(annotation.type()).contains(
			        ConfigItem.Type.SEARCHABLE)
			    && (annotation.name().equalsIgnoreCase(item) || annotation.alias()
			        .equalsIgnoreCase(item))) {
				if (annotation.comparator() == Comparator.BOOLEAN) {
					if (tokens.size() != 1) {
						return null;
					}
					BinaryConfigItemExpression binExpr = new BinaryConfigItemExpression(
					    deviceClass, annotation.name(), method.getName(), propertyLevel);
					return binExpr;
				}
				if (tokens.size() != 3) {
					return null;
				}
				Token sign = tokens.get(1);
				Token value = tokens.get(2);
				if (annotation.comparator() == Comparator.DATE) {
					if (sign.type == TokenType.BEFORE || sign.type == TokenType.AFTER
					    || sign.type == TokenType.IS) {
						if (value.type != TokenType.QUOTE) {
							throw new FinderParseException(String.format(
							    "Parsing error, should be a quoted date at character %d.",
							    value.position));
						}
						DateConfigItemExpression dateExpr = new DateConfigItemExpression(
						    deviceClass, annotation.name(), method.getName(), propertyLevel);
						dateExpr.item = annotation.name();
						dateExpr.sign = sign.type;
						try {
							dateExpr.value = dateExpr.format.parse(value.text);
						}
						catch (ParseException e1) {
							try {
								dateExpr.format = DateConfigItemExpression.WITHOUTTIME;
								dateExpr.value = dateExpr.format.parse(value.text);
							}
							catch (ParseException e2) {
								throw new FinderParseException(String.format(
								    "Invalid date/time at position %d.", value.position));
							}
						}
						return dateExpr;
					}
					else {
						throw new FinderParseException(String.format(
						    "Parsing error, invalid date operator at position %d",
						    sign.position));
					}
				}
				else if (annotation.comparator() == Comparator.ENUM
				    && method.getReturnType().isEnum()) {
					if (sign.type == TokenType.IS) {
						if (value.type == TokenType.QUOTE) {
							Object[] choices = method.getReturnType().getEnumConstants();
							StringBuffer validValues = new StringBuffer();
							for (Object choice : choices) {
								Enum<?> possibleValue = (Enum<?>) choice;
								if (validValues.length() > 0) {
									validValues.append(", ");
								}
								validValues.append(possibleValue.name());
								if (possibleValue.name().equalsIgnoreCase(value.text)) {
									EnumConfigItemExpression enumExpr = new EnumConfigItemExpression(
									    deviceClass, item, method.getName(), propertyLevel);
									enumExpr.value = possibleValue.ordinal();
									enumExpr.textValue = possibleValue.toString();
									return enumExpr;
								}
							}
							throw new FinderParseException(String.format(
							    "Invalid value '%s' for [%s]. Possible values are {%s}.",
							    value.text, item, validValues));
						}
						else {
							throw new FinderParseException(
							    String
							        .format(
							            "Invalid value type for [%s] at position %d, it should be a quoted text.",
							            item, value.position));
						}
					}
					else {
						throw new FinderParseException(String.format(
						    "Invalid operator for [%s] at position %d: use IS.", item,
						    sign.position));
					}
				}
				else if (annotation.comparator() == Comparator.TEXT) {
					if (sign.type == TokenType.IS || sign.type == TokenType.CONTAINS
					    || sign.type == TokenType.STARTSWITH
					    || sign.type == TokenType.ENDSWITH) {
						if (value.type != TokenType.QUOTE) {
							throw new FinderParseException(String.format(
							    "Parsing error, should be a quoted text, at character %d.",
							    value.position));
						}
						TextConfigItemExpression textExpr = new TextConfigItemExpression(
						    deviceClass, annotation.name(), method.getName(), propertyLevel);
						textExpr.item = annotation.name();
						textExpr.value = value.text;
						textExpr.sign = sign.type;
						return textExpr;
					}
					else {
						throw new FinderParseException(String.format(
						    "Parsing error, invalid date operator at position %d",
						    sign.position));
					}
				}
				else if (annotation.comparator() == Comparator.NUMERIC) {
					if (sign.type == TokenType.IS || sign.type == TokenType.LESSTHAN
					    || sign.type == TokenType.GREATERTHAN) {
						if (value.type != TokenType.NUMERIC) {
							throw new FinderParseException(String.format(
							    "Parsing error, should be a numeric value, at character %d.",
							    value.position));
						}
						NumericConfigItemExpression numExpr = new NumericConfigItemExpression(
						    deviceClass, annotation.name(), method.getName(), propertyLevel);
						numExpr.item = annotation.name();
						try {
							numExpr.value = Double.parseDouble(value.text);
						}
						catch (NumberFormatException e) {
							throw new FinderParseException(
							    String
							        .format(
							            "Parsing error, uname to parse the numeric value at character %d.",
							            value.position));
						}
						numExpr.sign = sign.type;
						return numExpr;
					}
					else {
						throw new FinderParseException(String.format(
						    "Parsing error, invalid numeric operator at position %d",
						    sign.position));
					}
				}
			}
			return null;
		}

		/**
		 * Parses the.
		 *
		 * @param tokens the tokens
		 * @param deviceClass the device class
		 * @return the expression
		 * @throws FinderParseException the finder parse exception
		 */
		public static Expression parse(List<Token> tokens,
		    Class<? extends Device> deviceClass) throws FinderParseException {
			if (tokens.size() == 0 || tokens.get(0).type != TokenType.ITEM) {
				return null;
			}
			Method[] methods = deviceClass.getMethods();
			for (Method method : methods) {
				Expression expression = ConfigItemExpression.parseItem(tokens, method,
				    deviceClass, new DeviceLevel());
				if (expression != null) {
					return expression;
				}
			}
			Class<?> configClass = Finder.getDeviceConfigClass(deviceClass);
			if (configClass != null) {
				methods = configClass.getMethods();
				for (Method method : methods) {
					Expression expression = ConfigItemExpression.parseItem(tokens,
					    method, deviceClass, new ConfigLevel(configClass));
					if (expression != null) {
						return expression;
					}
				}
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
		 * @see org.netshot.device.Finder.Expression#toString()
		 */
		public String toString() {
			return String.format("[%s] %s %s", item.toString(), sign,
			    this.getTextValue());
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			if (this.propertyLevel instanceof ConfigLevel) {
				criteria.whereJoins.add("d.lastConfig = c");
				criteria.otherTables.add(this.propertyLevel.configClass.getName() + " c");
			}
			return criteria;
		}
	}

	/**
	 * The Class NumericConfigItemExpression.
	 */
	public static class NumericConfigItemExpression extends ConfigItemExpression {
		
		/** The value. */
		private Double value;

		/**
		 * Instantiates a new numeric config item expression.
		 *
		 * @param deviceClass the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public NumericConfigItemExpression(Class<? extends Device> deviceClass,
		    String item, String property, PropertyLevel propertyLevel) {
			super(deviceClass, item, property, propertyLevel);
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.ConfigItemExpression#getTextValue()
		 */
		protected String getTextValue() {
			return value.toString();
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.ConfigItemExpression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			switch (sign) {
			case GREATERTHAN:
				criteria.where = this.getPropertyName() + " > :" + itemPrefix;
				break;
			case LESSTHAN:
				criteria.where = this.getPropertyName() + " < :" + itemPrefix;
				break;
			default:
				criteria.where = this.getPropertyName() + " = :" + itemPrefix;
				break;
			}
			return criteria;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query query, String itemPrefix) {
			query.setDouble(itemPrefix, value);
		}
	}

	/**
	 * The Class EnumConfigItemExpression.
	 */
	public static class EnumConfigItemExpression extends ConfigItemExpression {
		
		/** The value. */
		private Integer value;
		
		/** The text value. */
		private String textValue;

		/**
		 * Instantiates a new enum config item expression.
		 *
		 * @param deviceClass the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public EnumConfigItemExpression(Class<? extends Device> deviceClass,
		    String item, String property, PropertyLevel propertyLevel) {
			super(deviceClass, item, property, propertyLevel);
			this.sign = TokenType.IS;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.ConfigItemExpression#getTextValue()
		 */
		protected String getTextValue() {
			return "\"" + TokenType.escape(textValue) + "\"";
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.ConfigItemExpression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = this.getPropertyName() + " = :" + itemPrefix;
			return criteria;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query query, String itemPrefix) {
			query.setInteger(itemPrefix, value);
		}
	}

	/**
	 * The Class TextConfigItemExpression.
	 */
	public static class TextConfigItemExpression extends ConfigItemExpression {
		
		/** The value. */
		private String value;

		/**
		 * Instantiates a new text config item expression.
		 *
		 * @param deviceClass the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public TextConfigItemExpression(Class<? extends Device> deviceClass,
		    String item, String property, PropertyLevel propertyLevel) {
			super(deviceClass, item, property, propertyLevel);
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.ConfigItemExpression#getTextValue()
		 */
		protected String getTextValue() {
			return "\"" + TokenType.escape(value) + "\"";
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.ConfigItemExpression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = this.getPropertyName() + " like :" + itemPrefix;
			return criteria;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query query, String itemPrefix) {
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
			query.setString(itemPrefix, target);
		}
	}

	/**
	 * The Class DateConfigItemExpression.
	 */
	public static class DateConfigItemExpression extends ConfigItemExpression {
		
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
		 * @param deviceClass the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public DateConfigItemExpression(Class<? extends Device> deviceClass,
		    String item, String property, PropertyLevel propertyLevel) {
			super(deviceClass, item, property, propertyLevel);
		}

		/** The value. */
		private Date value;
		
		/** The format. */
		private DateFormat format = WITHTIME;

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.ConfigItemExpression#getTextValue()
		 */
		protected String getTextValue() {
			return "\"" + this.format.format(this.value) + "\"";
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.ConfigItemExpression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			switch (sign) {
			case AFTER:
				criteria.where = this.getPropertyName() + " > :" + itemPrefix;
				break;
			case BEFORE:
				criteria.where = this.getPropertyName() + " < :" + itemPrefix;
				break;
			default:
				criteria.where = this.getPropertyName() + " = :" + itemPrefix;
			}
			return criteria;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query query, String itemPrefix) {
			query.setTimestamp(itemPrefix, value);
		}
	}

	/**
	 * The Class BinaryConfigItemExpression.
	 */
	public static class BinaryConfigItemExpression extends ConfigItemExpression {
		
		/**
		 * Instantiates a new binary config item expression.
		 *
		 * @param deviceClass the device class
		 * @param item the item
		 * @param property the property
		 * @param propertyLevel the property level
		 */
		public BinaryConfigItemExpression(Class<? extends Device> deviceClass,
		    String item, String property, PropertyLevel propertyLevel) {
			super(deviceClass, item, property, propertyLevel);
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.ConfigItemExpression#getTextValue()
		 */
		protected String getTextValue() {
			return null;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.ConfigItemExpression#toString()
		 */
		public String toString() {
			return String.format("[%s]", item);
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.ConfigItemExpression#buildHqlString(java.lang.String)
		 */
		public FinderCriteria buildHqlString(String itemPrefix) {
			FinderCriteria criteria = super.buildHqlString(itemPrefix);
			criteria.where = this.getPropertyName() + " = 1";
			return criteria;
		}

		/* (non-Javadoc)
		 * @see org.netshot.device.Finder.Expression#setVariables(org.hibernate.Query, java.lang.String)
		 */
		public void setVariables(Query query, String itemPrefix) {
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
	 * Gets the searchable field names.
	 *
	 * @param deviceClass the device class
	 * @return the searchable field names
	 */
	public static Map<String, List<ConfigItem.Comparator>> getSearchableFieldNames(
	    Class<?> deviceClass) {
		Map<String, List<ConfigItem.Comparator>> fieldNames = new HashMap<String, List<ConfigItem.Comparator>>();
		Method[] methods = deviceClass.getMethods();
		for (Method method : methods) {
			ConfigItem annotation = method.getAnnotation(ConfigItem.class);
			if (annotation != null
			    && Arrays.asList(annotation.type()).contains(
			        ConfigItem.Type.SEARCHABLE)) {
				fieldNames.put(annotation.name(),
				    Arrays.asList(annotation.comparator()));
				if (!annotation.alias().isEmpty()) {
					fieldNames.put(annotation.alias(),
					    Arrays.asList(annotation.comparator()));
				}
			}
		}
		Class<?> configClass = getDeviceConfigClass(deviceClass);
		if (configClass != null) {
			fieldNames.putAll(Finder.getSearchableFieldNames(configClass));
		}
		return fieldNames;
	}

	/**
	 * Gets the device config class.
	 *
	 * @param deviceClass the device class
	 * @return the device config class
	 */
	@SuppressWarnings("unchecked")
	public static Class<? extends Config> getDeviceConfigClass(
	    Class<?> deviceClass) {
		Class<?>[] innerClasses = deviceClass.getDeclaredClasses();
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
	 * @param query the query
	 * @param deviceClass the device class
	 * @throws FinderParseException the finder parse exception
	 */
	public Finder(String query, Class<? extends Device> deviceClass)
	    throws FinderParseException {
		this.tokens = Expression.tokenize(query);
		if (this.tokens.size() == 0) {
			this.expression = new NullExpression(deviceClass);
		}
		else {
			this.expression = Expression.parse(tokens, deviceClass);
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
		hql.append(String.format(" from %s d", this.expression.deviceClass.getName()));
		for (String table : criteria.otherTables) {
			hql.append(", ").append(table);
		}
		for (String join : criteria.joins) {
			hql.append(" left join ").append(join);
		}
		hql.append(" where ");
		for (String where : criteria.whereJoins) {
			hql.append(where).append(" and ");
		}
		hql.append("(").append(criteria.where).append(")");
		return hql.toString();
	}

	/**
	 * Sets the variables.
	 *
	 * @param query the new variables
	 */
	public void setVariables(Query query) {
		this.expression.setVariables(query, HQLPREFIX);
	}

}
