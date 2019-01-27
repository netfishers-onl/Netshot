/**
 * Copyright 2013-2019 Sylvain Cadilhac (NetFishers)
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


/**
 * This is a simple diagnostic: runs a CLI command in a CLI mode, and
 * optionally transforms the result using a regular expression.
 * @author sylvain.cadilhac
 */
public class SimpleDiagnostic extends Diagnostic {
	
	/**
	 * The CLI mode to run the command in.
	 */
	private String cliMode;
	
	/**
	 * The CLI command to run.
	 */
	private String command;
	
	/**
	 * The pattern to search for in the result string.
	 */
	private String modifierPattern;
	
	/**
	 * The replacement string (to replace the modifierPattern with).
	 * Also supports regular expression backreferences.
	 */
	private String modifierReplacement;

	/**
	 * Gets the cli mode.
	 *
	 * @return the cli mode
	 */
	public String getCliMode() {
		return cliMode;
	}

	/**
	 * Sets the cli mode.
	 *
	 * @param cliMode the new cli mode
	 */
	public void setCliMode(String cliMode) {
		this.cliMode = cliMode;
	}

	/**
	 * Gets the command.
	 *
	 * @return the command
	 */
	public String getCommand() {
		return command;
	}

	/**
	 * Sets the command.
	 *
	 * @param command the new command
	 */
	public void setCommand(String command) {
		this.command = command;
	}

	/**
	 * Gets the modifier pattern.
	 *
	 * @return the modifier pattern
	 */
	public String getModifierPattern() {
		return modifierPattern;
	}

	/**
	 * Sets the modifier pattern.
	 *
	 * @param modifierPattern the new modifier pattern
	 */
	public void setModifierPattern(String modifierPattern) {
		this.modifierPattern = modifierPattern;
	}

	/**
	 * Gets the modifier replacement.
	 *
	 * @return the modifier replacement
	 */
	public String getModifierReplacement() {
		return modifierReplacement;
	}

	/**
	 * Sets the modifier replacement.
	 *
	 * @param modifierReplacement the new modifier replacement
	 */
	public void setModifierReplacement(String modifierReplacement) {
		this.modifierReplacement = modifierReplacement;
	}
	
}
