/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.device;

import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.annotation.Retention;

/**
 * Config properties annotated with this @interface can be used for searches,
 * differences, etc.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Inherited
public @interface ConfigItem {

	/**
	 * Name.
	 * 
	 * @return the string
	 */
	String name();

	/**
	 * Alias.
	 * 
	 * @return the string
	 */
	String alias() default "";

	/**
	 * Type.
	 * 
	 * @return the type[]
	 */
	Type[] type();

	/**
	 * Comparator.
	 * 
	 * @return the comparator
	 */
	Comparator comparator() default Comparator.TEXT;

	/**
	 * The Enum Type.
	 */
	public static enum Type {

		/** Can be used for policy checking (compliance). */
		CHECKABLE,
		/** Can be retrieved. */
		RETRIEVABLE,
		/** Can be compared. */
		DIFFABLE,
		/** Can be searched for. */
		SEARCHABLE,
	};

	/**
	 * The type of comparator to use for the annotated property.
	 */
	public static enum Comparator {

		/** The boolean. */
		BOOLEAN,

		/** The text. */
		TEXT,

		/** The date. */
		DATE,

		/** The numeric. */
		NUMERIC,

		/** The ipaddress. */
		IPADDRESS,

		/** The macaddress. */
		MACADDRESS,

		/** The enum. */
		ENUM
	}

}
