package onl.netfishers.netshot.rest;

/**
 * Defines the serialization views for APIs.
 */
public class RestViews {
	// Default view
	public static class DefaultView {};

	// REST API view
	public static class RestApiView extends DefaultView {};

	// View for hook objects
	public static class HookView extends DefaultView {};
}
