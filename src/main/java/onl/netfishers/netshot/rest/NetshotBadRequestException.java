package onl.netfishers.netshot.rest;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;

import onl.netfishers.netshot.rest.RestService.RsErrorBean;

/**
 * The NetshotBadRequestException class, a WebApplication exception
 * embedding an error message, and HTTP status code, to be sent to the REST client.
 */
class NetshotBadRequestException extends WebApplicationException {

	static public enum Reason {
		NETSHOT_INVALID_REQUEST_PARAMETER(10, Response.Status.BAD_REQUEST),
		NETSHOT_DATABASE_ACCESS_ERROR(20, Response.Status.INTERNAL_SERVER_ERROR),
		NETSHOT_INVALID_IP_ADDRESS(100, Response.Status.BAD_REQUEST),
		NETSHOT_MALFORMED_IP_ADDRESS(101, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_PORT(102, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_DOMAIN(110, Response.Status.BAD_REQUEST),
		NETSHOT_DUPLICATE_DOMAIN(111, Response.Status.CONFLICT),
		NETSHOT_INVALID_DOMAIN_NAME(112, Response.Status.BAD_REQUEST),
		NETSHOT_USED_DOMAIN(113, Response.Status.PRECONDITION_FAILED),
		NETSHOT_INVALID_TASK(120, Response.Status.BAD_REQUEST),
		NETSHOT_TASK_NOT_CANCELLABLE(121, Response.Status.PRECONDITION_FAILED),
		NETSHOT_TASK_CANCEL_ERROR(122, Response.Status.INTERNAL_SERVER_ERROR),
		NETSHOT_USED_CREDENTIALS(130, Response.Status.PRECONDITION_FAILED),
		NETSHOT_DUPLICATE_CREDENTIALS(131, Response.Status.CONFLICT),
		NETSHOT_INVALID_CREDENTIALS_TYPE(132, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_CREDENTIALS(133, Response.Status.PRECONDITION_FAILED),
		NETSHOT_INVALID_CREDENTIALS_NAME(134, Response.Status.BAD_REQUEST),
		NETSHOT_SCHEDULE_ERROR(30, Response.Status.INTERNAL_SERVER_ERROR),
		NETSHOT_DUPLICATE_DEVICE(140, Response.Status.CONFLICT),
		NETSHOT_USED_DEVICE(141, Response.Status.PRECONDITION_FAILED),
		NETSHOT_INVALID_DEVICE(142, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_CONFIG(143, Response.Status.BAD_REQUEST),
		NETSHOT_INCOMPATIBLE_CONFIGS(144, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_DEVICE_CLASSNAME(150, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_SEARCH_STRING(151, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_GROUP_NAME(160, Response.Status.BAD_REQUEST),
		NETSHOT_DUPLICATE_GROUP(161, Response.Status.CONFLICT),
		NETSHOT_INCOMPATIBLE_GROUP_TYPE(162, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_DEVICE_IN_STATICGROUP(163, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_GROUP(164, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_DYNAMICGROUP_QUERY(165, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_SUBNET(170, Response.Status.BAD_REQUEST),
		NETSHOT_SCAN_SUBNET_TOO_BIG(171, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_POLICY_NAME(180, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_POLICY(181, Response.Status.BAD_REQUEST),
		NETSHOT_DUPLICATE_POLICY(182, Response.Status.CONFLICT),
		NETSHOT_INVALID_RULE_NAME(190, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_RULE(191, Response.Status.BAD_REQUEST),
		NETSHOT_DUPLICATE_RULE(192, Response.Status.CONFLICT),
		NETSHOT_INVALID_USER(200, Response.Status.BAD_REQUEST),
		NETSHOT_DUPLICATE_USER(201, Response.Status.CONFLICT),
		NETSHOT_INVALID_USER_NAME(202, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_PASSWORD(203, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_API_TOKEN_FORMAT(204, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_SCRIPT(220, Response.Status.BAD_REQUEST),
		NETSHOT_DUPLICATE_SCRIPT(222, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_DIAGNOSTIC_NAME(230, Response.Status.BAD_REQUEST),
		NETSHOT_DUPLICATE_DIAGNOSTIC(231, Response.Status.CONFLICT),
		NETSHOT_INVALID_DIAGNOSTIC_TYPE(232, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_DIAGNOSTIC(233, Response.Status.BAD_REQUEST),
		NETSHOT_INCOMPATIBLE_DIAGNOSTIC(234, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_HOOK_NAME(240, Response.Status.BAD_REQUEST),
		NETSHOT_DUPLICATE_HOOK(241, Response.Status.CONFLICT),
		NETSHOT_INVALID_HOOK(242, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_HOOK_TYPE(243, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_HOOK_WEB(244, Response.Status.BAD_REQUEST),
		NETSHOT_INVALID_HOOK_WEB_URL(245, Response.Status.BAD_REQUEST);

		int code;
		Response.Status status;
		private Reason(int code, Response.Status status) {
			this.code = code;
			this.status = status;
		}
	}

	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = -4538169756895835186L;

	/**
	 * Instantiates a new netshot bad request exception.
	 *
	 * @param message the message
	 * @param errorCode the error code
	 */
	public NetshotBadRequestException(String message, NetshotBadRequestException.Reason reason) {
		super(Response.status(reason.status)
				.entity(new RsErrorBean(message, reason.code)).build());
	}
}