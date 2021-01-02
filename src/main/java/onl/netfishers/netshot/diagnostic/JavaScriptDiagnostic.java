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
package onl.netfishers.netshot.diagnostic;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.script.ScriptException;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonView;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;

import onl.netfishers.netshot.device.Device;
import onl.netfishers.netshot.device.DeviceGroup;
import onl.netfishers.netshot.device.attribute.AttributeDefinition.AttributeType;
import onl.netfishers.netshot.rest.RestViews.DefaultView;

/**
 * This is a Javascript-based diagnostic. Declare the diagnostic type along with
 * a script.
 * 
 * @author sylvain.cadilhac
 */
@Entity
@XmlRootElement
@XmlAccessorType(value = XmlAccessType.NONE)
public class JavaScriptDiagnostic extends Diagnostic {

	/**
	 * Empty constructor. For Hibernate.
	 */
	protected JavaScriptDiagnostic() {
	}

	/**
	 * Instantiates a new diagnostic.
	 * 
	 * @param name
	 *                      The name
	 * @param enabled
	 *                      True to enable the diagnostic
	 * @param targetGroup
	 *                      The group of devices the diagnostic applies to
	 * @param resultType
	 *                      The type of result expected by this diagnostic
	 * @param script
	 *                      The Javascript script
	 */
	public JavaScriptDiagnostic(String name, boolean enabled, DeviceGroup targetGroup, AttributeType resultType,
			String script) {
		super(name, enabled, targetGroup, resultType);
		this.script = script;
	}

	/**
	 * The JS script to execute on the device.
	 */
	private String script;

	/**
	 * Gets the script.
	 * 
	 * @return the script
	 */
	@XmlElement
	@JsonView(DefaultView.class)
	@Column(length = 10000000)
	public String getScript() {
		return script;
	}

	/**
	 * Sets the script.
	 * 
	 * @param script
	 *                 the script to set
	 */
	public void setScript(String script) {
		this.script = script;
	}

	@Override
	public Value getJsObject(Device device, Context context) throws ScriptException {
		context.eval("js", this.getScript());
		Value diagnose = context.getBindings("js").getMember("diagnose");
		if (!diagnose.canExecute()) {
			throw new ScriptException(String.format("Unable to find 'diagnose' function in '%s' JS diagnostic", this.getName()));
		}
		return diagnose;
	}

}
