package onl.netfishers.netshot.database;

import java.io.Serializable;
import java.util.Date;

import org.apache.commons.lang3.ArrayUtils;
import org.hibernate.EmptyInterceptor;
import org.hibernate.type.Type;

class DatabaseInterceptor extends EmptyInterceptor {

	@Override
	public boolean onFlushDirty(Object entity, Serializable id, Object[] currentState, Object[] previousState,
			String[] propertyNames, Type[] types) {
		int indexOf = ArrayUtils.indexOf(propertyNames, "changeDate");
		if (indexOf != ArrayUtils.INDEX_NOT_FOUND) {
			currentState[indexOf] = new Date(1000 * (System.currentTimeMillis() / 1000));
			return true;
		}
		return false;
	}

	@Override
	public boolean onSave(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
		int indexOf = ArrayUtils.indexOf(propertyNames, "changeDate");
		if (indexOf != ArrayUtils.INDEX_NOT_FOUND) {
			if (state[indexOf] == null) state[indexOf] = new Date(1000 * (System.currentTimeMillis() / 1000));
			return true;
		}
		return false;
	}

	private static final long serialVersionUID = 5897665908529047371L;

}