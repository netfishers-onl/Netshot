/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.compliance.rules;

import java.lang.reflect.Method;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlElement;

import org.hibernate.HibernateException;
import org.hibernate.ObjectNotFoundException;
import org.hibernate.Session;
import org.mozilla.javascript.Callable;
import org.mozilla.javascript.ClassShutter;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.WrapFactory;
import org.netshot.Netshot;
import org.netshot.compliance.CheckResult;
import org.netshot.compliance.Policy;
import org.netshot.compliance.Rule;
import org.netshot.compliance.CheckResult.ResultOption;
import org.netshot.device.Config;
import org.netshot.device.ConfigItem;
import org.netshot.device.Device;
import org.netshot.device.Domain;
import org.netshot.device.Module;
import org.netshot.device.Network4Address;
import org.netshot.device.Network6Address;
import org.netshot.device.NetworkInterface;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A JavaScriptRule is a Javascript-coded script that will check the device
 * attributes, including config, and return whether the device is compliant
 * or not.
 */
@Entity
public class JavaScriptRule extends Rule {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(JavaScriptRule.class);

	/**
	 * The Class ExecutionTimeExceededException.
	 */
	private static class ExecutionTimeExceededException extends RuntimeException {
		
		/** The Constant serialVersionUID. */
		private static final long serialVersionUID = 3842590808205884823L;
	}

	/**
	 * A factory for creating TimeLimitedContext objects.
	 */
	private static class TimeLimitedContextFactory extends ContextFactory {

		/** The logger. */
		private static Logger logger = LoggerFactory.getLogger(JavaScriptRule.class);
		
		/** The max execution time. */
		private static int MAX_EXECUTION_TIME;

		static {
			try {
				MAX_EXECUTION_TIME = Integer.parseInt(Netshot.getConfig(
				    "netshot.compliance.jsscriptmaxexecutiontime", "10"));
			}
			catch (Exception e) {
				logger.error("Invalid value for netshot.max_compliancescript_executiontime, using default (10s).");
				MAX_EXECUTION_TIME = 10;
			}
		}

		// Custom Context to store execution time.
		/**
		 * The Class TimeLimitedContext.
		 */
		private static class TimeLimitedContext extends Context {
			
			/** The start time. */
			long startTime;

			/**
			 * Instantiates a new time limited context.
			 *
			 * @param factory the factory
			 */
			private TimeLimitedContext(ContextFactory factory) {
				super(factory);
			}
		}

		/* (non-Javadoc)
		 * @see org.mozilla.javascript.ContextFactory#makeContext()
		 */
		protected Context makeContext() {
			TimeLimitedContext cx = new TimeLimitedContext(this);
			// Make Rhino runtime to call observeInstructionCount
			// each 10000 bytecode instructions
			cx.setInstructionObserverThreshold(10000);
			return cx;
		}

		/* (non-Javadoc)
		 * @see org.mozilla.javascript.ContextFactory#observeInstructionCount(org.mozilla.javascript.Context, int)
		 */
		protected void observeInstructionCount(Context cx, int instructionCount) {
			TimeLimitedContext mcx = (TimeLimitedContext) cx;
			long currentTime = System.currentTimeMillis();
			if (currentTime - mcx.startTime > MAX_EXECUTION_TIME * 1000) {
				// More then 10 seconds from Context creation time:
				// it is time to stop the script.
				// Throw Error instance to ensure that script will never
				// get control back through catch or finally.
				throw new ExecutionTimeExceededException();
			}
		}

		/* (non-Javadoc)
		 * @see org.mozilla.javascript.ContextFactory#doTopCall(org.mozilla.javascript.Callable, org.mozilla.javascript.Context, org.mozilla.javascript.Scriptable, org.mozilla.javascript.Scriptable, java.lang.Object[])
		 */
		protected Object doTopCall(Callable callable, Context cx, Scriptable scope,
		    Scriptable thisObj, Object[] args) {
			TimeLimitedContext mcx = (TimeLimitedContext) cx;
			mcx.startTime = System.currentTimeMillis();

			return super.doTopCall(callable, cx, scope, thisObj, args);
		}

	}

	static {
		ContextFactory.initGlobal(new TimeLimitedContextFactory());
	}

	/** The script. */
	private String script = "/*\n" + " * Script template - to be customized.\n"
	    + " */\n" + "function check() {\n"
	    + "    //var config = Netshot.get('config');\n"
	    + "    //var name = Netshot.get('name');\n" + "    return CONFORMING;\n"
	    + "    //return NONCONFORMING;\n" + "    //return NOTAPPLICABLE;\n"
	    + "}\n";

	/**
	 * Instantiates a new java script rule.
	 */
	protected JavaScriptRule() {

	}

	/**
	 * Instantiates a new java script rule.
	 *
	 * @param name the name
	 * @param policy the policy
	 */
	public JavaScriptRule(String name, Policy policy) {
		super(name, policy);
	}

	/**
	 * Gets the script.
	 *
	 * @return the script
	 */
	@XmlElement
	@Column(length = 100000000)
	public String getScript() {
		return script;
	}

	/**
	 * Sets the script.
	 *
	 * @param script the new script
	 */
	public void setScript(String script) {
		this.script = script;
	}

	/**
	 * A factory for creating EnhancedWrap objects.
	 */
	public static class EnhancedWrapFactory extends WrapFactory {
		
		/**
		 * Instantiates a new enhanced wrap factory.
		 */
		public EnhancedWrapFactory() {
			setJavaPrimitiveWrap(false);
		}

		/* (non-Javadoc)
		 * @see org.mozilla.javascript.WrapFactory#wrapAsJavaObject(org.mozilla.javascript.Context, org.mozilla.javascript.Scriptable, java.lang.Object, java.lang.Class)
		 */
		public Scriptable wrapAsJavaObject(Context cx, Scriptable scope,
		    Object javaObject, Class<?> staticType) {
			if (javaObject instanceof Map) {
				return new NativeMapAdapter(scope, javaObject, staticType);
			}
			else if (javaObject instanceof List<?>) {
				return new NativeArrayAdapter(scope, (List<?>) javaObject);
			}
			else if (javaObject instanceof Set<?>) {
				return new NativeArrayAdapter(scope, (Set<?>) javaObject);
			}
			else if (javaObject instanceof Date) {
				return cx.newObject(scope, "Date", new Object[] { new Long(
				    ((Date) javaObject).getTime()) });
			}
			else if (javaObject instanceof Network4Address) {
				Network4Address address = (Network4Address) javaObject;
				Map<String, Object> jsAddress = new HashMap<String, Object>();
				jsAddress.put("address", address.getAddress());
				jsAddress.put("text", address.getIP());
				jsAddress.put("prefixLength", address.getPrefixLength());
				return this.wrapAsJavaObject(cx, scope, jsAddress, staticType);
			}
			else if (javaObject instanceof Network6Address) {
				Network6Address address = (Network6Address) javaObject;
				Map<String, Object> jsAddress = new HashMap<String, Object>();
				ByteBuffer buffer = ByteBuffer.allocate(16);
				buffer.putLong(address.getAddress1());
				buffer.putLong(address.getAddress2());
				buffer.rewind();
				jsAddress.put("address", new Integer[] {
						buffer.getInt(),
						buffer.getInt(),
						buffer.getInt(),
						buffer.getInt()
				});
				jsAddress.put("text", address.getIP());
				jsAddress.put("prefixLength", address.getPrefixLength());
				return this.wrapAsJavaObject(cx, scope, jsAddress, staticType);
			}
			else if (javaObject instanceof Module) {
				Module module = (Module) javaObject;
				Map<String, Object> jsModule = new HashMap<String, Object>();
				jsModule.put("id", new Long(module.getId()));
				jsModule.put("partNumber", module.getPartNumber());
				jsModule.put("serialNumber", module.getSerialNumber());
				jsModule.put("slot", module.getSlot());
				return this.wrapAsJavaObject(cx, scope, jsModule, staticType);
			}
			else if (javaObject instanceof NetworkInterface) {
				NetworkInterface networkInterface = (NetworkInterface) javaObject;
				Map<String, Object> jsInterface = new HashMap<String, Object>();
				jsInterface.put("ip", networkInterface.getIpAddresses());
				jsInterface.put("mac", networkInterface.getMacAddress());
				jsInterface.put("name", networkInterface.getInterfaceName());
				jsInterface.put("description", networkInterface.getDescription());
				jsInterface.put("enabled", networkInterface.isEnabled());
				return this.wrapAsJavaObject(cx, scope, jsInterface, staticType);
			}
			else if (javaObject instanceof Domain) {
				return this.wrapAsJavaObject(cx, scope, ((Domain) javaObject).getName(), staticType);
			}
			else if (javaObject instanceof Enum<?>) {
				return this.wrapAsJavaObject(cx, scope, javaObject.toString(), staticType);
			}
			else {
				return new NativeJavaObject(scope, javaObject, staticType);
			}
		}
	}

	/**
	 * The Class NativeMapAdapter.
	 */
	public static class NativeMapAdapter extends NativeJavaObject {

		/** The Constant serialVersionUID. */
		private static final long serialVersionUID = -3331870156689877614L;

		/**
		 * Instantiates a new native map adapter.
		 *
		 * @param scope the scope
		 * @param javaObject the java object
		 * @param staticType the static type
		 */
		public NativeMapAdapter(Scriptable scope, Object javaObject,
		    Class<?> staticType) {
			super(scope, javaObject, staticType);
		}

		/**
		 * Gets the map.
		 *
		 * @return the map
		 */
		@SuppressWarnings("unchecked")
		private Map<Object, Object> getMap() {
			return (Map<Object, Object>) javaObject;
		}

		/* (non-Javadoc)
		 * @see org.mozilla.javascript.NativeJavaObject#delete(java.lang.String)
		 */
		public void delete(String name) {
			try {
				getMap().remove(name);
			}
			catch (RuntimeException e) {
				Context.throwAsScriptRuntimeEx(e);
			}
		}

		/* (non-Javadoc)
		 * @see org.mozilla.javascript.NativeJavaObject#get(java.lang.String, org.mozilla.javascript.Scriptable)
		 */
		public Object get(String name, Scriptable start) {
			Object value = super.get(name, start);
			if (value != Scriptable.NOT_FOUND) {
				return value;
			}
			value = getMap().get(name);
			if (value == null) {
				return Scriptable.NOT_FOUND;
			}
			Context cx = Context.getCurrentContext();
			return cx.getWrapFactory().wrap(cx, this, value, null);
		}

		/* (non-Javadoc)
		 * @see org.mozilla.javascript.NativeJavaObject#getClassName()
		 */
		public String getClassName() {
			return "NativeMapAdapter";
		}

		/* (non-Javadoc)
		 * @see org.mozilla.javascript.NativeJavaObject#getIds()
		 */
		public Object[] getIds() {
			return getMap().keySet().toArray();
		}

		/* (non-Javadoc)
		 * @see org.mozilla.javascript.NativeJavaObject#has(java.lang.String, org.mozilla.javascript.Scriptable)
		 */
		public boolean has(String name, Scriptable start) {
			return getMap().containsKey(name) || super.has(name, start);
		}

		/* (non-Javadoc)
		 * @see org.mozilla.javascript.NativeJavaObject#put(java.lang.String, org.mozilla.javascript.Scriptable, java.lang.Object)
		 */
		public void put(String name, Scriptable start, Object value) {
			try {
				getMap().put(name, Context.jsToJava(value, ScriptRuntime.ObjectClass));
			}
			catch (RuntimeException e) {
				Context.throwAsScriptRuntimeEx(e);
			}
		}

		/* (non-Javadoc)
		 * @see java.lang.Object#toString()
		 */
		public String toString() {
			return javaObject.toString();
		}
	}
	
	public static class NativeArrayAdapter extends NativeArray {
		
		public NativeArrayAdapter(Scriptable scope, @SuppressWarnings("rawtypes") List list) {
			super(list.toArray());
			this.setParentScope(scope);
		}
		
		public NativeArrayAdapter(Scriptable scope, @SuppressWarnings("rawtypes") Set set) {
			super(set.toArray());
			this.setParentScope(scope);
		}
		
		public NativeArrayAdapter(Scriptable scope, Object[] array) {
			super(array);
			this.setParentScope(scope);
		}

		private static final long serialVersionUID = -2208190915392074430L;

		@Override
		public Object get(int index, Scriptable start) {
			Context cx = Context.getCurrentContext();
			try {
				return cx.getWrapFactory().wrap(cx, getParentScope(), super.get(index, start), null);
			}
			catch (RuntimeException e) {
				throw Context.throwAsScriptRuntimeEx(e);
			}
		}

		@Override
		public Object get(long index) {
			Context cx = Context.getCurrentContext();
			try {
				return cx.getWrapFactory().wrap(cx, getParentScope(), super.get(index), null);
			}
			catch (RuntimeException e) {
				throw Context.throwAsScriptRuntimeEx(e);
			}
		}

		@Override
		public Object get(int index) {
			Context cx = Context.getCurrentContext();
			try {
				return cx.getWrapFactory().wrap(cx, getParentScope(), super.get(index), null);
			}
			catch (RuntimeException e) {
				throw Context.throwAsScriptRuntimeEx(e);
			}
		}
	}

	/**
	 * The Class JsDataProvider.
	 */
	public class JsDataProvider {

		/** The device. */
		private Device device = null;
		
		/** The session. */
		private Session session;
		
		/**
		 * Instantiates a new js data provider.
		 *
		 * @param session the session
		 * @param device the device
		 */
		public JsDataProvider(Session session, Device device) {
			this.session = session;
			this.device = device;
		}

		/**
		 * Gets the device item.
		 *
		 * @param device the device
		 * @param item the item
		 * @return the device item
		 */
		private Object getDeviceItem(Device device, String item) {
			List<Method> methods = new ArrayList<Method>();
			methods.addAll(Arrays.asList(device.getClass().getMethods()));
			methods.addAll(Arrays.asList(device.getLastConfig().getClass()
			    .getMethods()));
			for (Method method : methods) {
				ConfigItem annotation = method.getAnnotation(ConfigItem.class);
				if (annotation != null
				    && Arrays.asList(annotation.type()).contains(
				        ConfigItem.Type.CHECKABLE)
				    && (annotation.name().equalsIgnoreCase(item) || annotation.alias()
				        .equalsIgnoreCase(item))) {

					Object target = device;
					if (Config.class.isAssignableFrom(method.getDeclaringClass())) {
						target = device.getLastConfig();
					}
					try {
						return method.invoke(target);
					}
					catch (Exception e) {
						logger.error("Error while invoking the device/config method.", e);
						return null;
					}
				}
			}
			return null;
		}

		/**
		 * Gets the.
		 *
		 * @param item the item
		 * @return the object
		 */
		public Object get(String item) {
			logger.debug("JavaScript request for item {} on current device.", item);
			return this.getDeviceItem(this.device, item);
		}
		
		/**
		 * Load device.
		 *
		 * @param id the id
		 * @return the device
		 * @throws HibernateException the hibernate exception
		 */
		private Device loadDevice(long id) throws HibernateException {
			Device device = (Device) session
			    .createQuery(
			        "from Device d join fetch d.lastConfig where d.id = :id")
			    .setLong("id", id).uniqueResult();
			return device;
		}
		
		/**
		 * Destroy.
		 */
		public void destroy() {
		}

		/**
		 * Gets the.
		 *
		 * @param item the item
		 * @param deviceId the device id
		 * @return the object
		 */
		public Object get(String item, long deviceId) {
			logger.debug("JavaScript request for item {} on device {}.", item,
			    deviceId);
			if (deviceId == this.device.getId()) {
				return this.get(item);
			}
			try {
				device = loadDevice(deviceId);
				Object result = this.getDeviceItem(device, item);
				session.evict(device);
				return result;
			}
			catch (ObjectNotFoundException e) {
				logger.error("Device not found on JavaScript get, item {}, device {}.",
				    item, deviceId, e);
				logIt(String.format("Unable to find the device %d.", deviceId), 3);
			}
			catch (Exception e) {
				logger.error("Error on JavaScript get, item {}, device {}.", item,
				    deviceId, e);
				logIt(String.format("Unable to get data %s for device %d.", deviceId),
				    3);
			}
			return null;
		}
		
		/**
		 * Nslookup.
		 *
		 * @param host the host
		 * @return the object
		 */
		public Object nslookup(String host) {
			String name = "";
			String address = "";
			try {
	      InetAddress ip = InetAddress.getByName(host);
	      name = ip.getHostName();
	      address = ip.getHostAddress();
      }
      catch (UnknownHostException e) {
      }
			Map<String, String> result = new HashMap<String, String>();
			result.put("name", name);
			result.put("address", address);
			return result;
		}

		/**
		 * Debug.
		 *
		 * @param message the message
		 */
		public void debug(String message) {
			logIt("DEBUG: " + message, 5);
		}

	}
	
	/** The allowed results. */
	private static CheckResult.ResultOption[] ALLOWED_RESULTS = new CheckResult.ResultOption[] {
	    CheckResult.ResultOption.CONFORMING, CheckResult.ResultOption.NONCONFORMING,
	    CheckResult.ResultOption.NOTAPPLICABLE };
	
	/** The prepared. */
	private boolean prepared = false;
	
	/** The js valid. */
	private boolean jsValid = false;
	
	/** The js context. */
	private Context jsContext = null;
	
	/** The js scope. */
	private Scriptable jsScope = null;
	
	/** The js check. */
	private Function jsCheck = null;
	
	/**
	 * Prepare.
	 */
	private void prepare() {
		if (prepared) {
			return;
		}
		
		prepared = true;

		try {
			jsContext = ContextFactory.getGlobal().enterContext();
			jsContext.setWrapFactory(new EnhancedWrapFactory());
			try {
				jsContext.setClassShutter(new ClassShutter() {
					public boolean visibleToScripts(String fullClassName) {
						logger.debug("The JavaScript script is trying to access {}.",
						    fullClassName);
						if (fullClassName == "org.netshot.compliance.rules.JavaScriptRule$JsDataProvider"
						    || fullClassName == "java.lang.String"
						    || fullClassName == "java.lang.Integer"
						    || fullClassName == "[Ljava.lang.Integer;"
						    || fullClassName == "java.lang.Long"
						    || fullClassName == "java.util.HashMap"
						    || fullClassName == "java.util.ArrayList"
						    || fullClassName == "org.hibernate.collection.internal.PersistentSet"
						    || fullClassName == "org.hibernate.collection.internal.PersistentBag") {
							return true;
						}
						return false;
					}
				});
				jsContext.getWrapFactory().setJavaPrimitiveWrap(false);
			}
			catch (SecurityException e) {
			}
			jsScope = jsContext.initStandardObjects();
			for (CheckResult.ResultOption allowedResult : ALLOWED_RESULTS) {
				ScriptableObject.putConstProperty(jsScope, allowedResult.toString(),
				    allowedResult.getValue());
			}
			jsContext.evaluateString(jsScope, script, "Compliance script", 1, null);
			Object check = jsScope.get("check", jsScope);
			if (check instanceof Function) {
				jsCheck = (Function) check;
			}
			else {
				logger.warn("The check function wasn't found in the script");
				logIt("The 'check' function couldn't be found in the script.", 2);
			}
			jsValid = true;
		}
		catch (Exception e) {
			this.logIt("Error while evaluating the Javascript script.", 2);
			logger.warn("Error while evaluating the Javascript script.", e);
			jsValid = false;
		}
	}
	
	/* (non-Javadoc)
	 * @see org.netshot.compliance.Rule#check(org.netshot.device.Device, org.hibernate.Session)
	 */
	@Override
	public void check(Device device, Session session) {
		if (!this.isEnabled()) {
			this.setCheckResult(device, ResultOption.DISABLED, "", session);
			return;
		}
		prepare();
		if (!this.jsValid) {
			this.setCheckResult(device, ResultOption.INVALIDRULE, "", session);
			return;
		}
		
		try {
			JsDataProvider dataProvider = this.new JsDataProvider(session, device);
			Object jsDataProvider = Context.javaToJS(dataProvider, jsScope);
			ScriptableObject.putProperty(jsScope, "Netshot", jsDataProvider);
			Object result = jsCheck.call(jsContext, jsScope, jsScope, new Object[] {});
			dataProvider.destroy();
			String comment = "";
			if (result instanceof Map) {
				@SuppressWarnings("unchecked")
        Map<Object, Object> mapResult = (Map<Object, Object>) result;
				if (mapResult.containsKey("comment")) {
					comment = mapResult.get("comment").toString();
				}
				if (mapResult.containsKey("result")) {
					result = mapResult.get("result");
				}
			}
			for (CheckResult.ResultOption allowedResult : ALLOWED_RESULTS) {
				if (Context.toNumber(result) == allowedResult.getValue()) {
					logIt(String.format("The script returned %s (%d), comment '%s'.",
					        allowedResult.toString(), allowedResult.getValue(), comment), 2);
					this.setCheckResult(device, allowedResult, comment, session);
					return;
				}
			}
		}
		catch (ExecutionTimeExceededException e) {
			logIt(String.format(
			    "The script exceeded its maximum execution time (%d seconds).",
			    TimeLimitedContextFactory.MAX_EXECUTION_TIME), 2);
			logger.error("The script exceeded its allowed execution time ({}s) on device {}.",
			    TimeLimitedContextFactory.MAX_EXECUTION_TIME, device.getId());
		}
		catch (Exception e) {
			logIt("Error while running the script: " + e.getMessage(), 2);
			logger.error("Error while running the script on device {}.", device.getId(), e);
		}
		this.setCheckResult(device, ResultOption.INVALIDRULE, "", session);
	}

}
