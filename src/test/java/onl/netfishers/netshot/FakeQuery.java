package onl.netfishers.netshot;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import javax.persistence.FlushModeType;
import javax.persistence.LockModeType;
import javax.persistence.Parameter;
import javax.persistence.TemporalType;

import org.hibernate.CacheMode;
import org.hibernate.FlushMode;
import org.hibernate.LockMode;
import org.hibernate.LockOptions;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.engine.spi.RowSelection;
import org.hibernate.graph.GraphSemantic;
import org.hibernate.graph.RootGraph;
import org.hibernate.query.ParameterMetadata;
import org.hibernate.query.Query;
import org.hibernate.query.QueryParameter;
import org.hibernate.query.QueryProducer;
import org.hibernate.transform.ResultTransformer;
import org.hibernate.type.Type;

public class FakeQuery<R> implements Query<R> {

	private Map<String, Object> parameters = new HashMap<>();

	public Map<String, Object> getParameterHash() {
		return this.parameters;
	}

	@Override
	public int executeUpdate() {
		return 0;
	}

	@Override
	public int getMaxResults() {
		return 0;
	}

	@Override
	public int getFirstResult() {
		return 0;
	}

	@Override
	public Map<String, Object> getHints() {
		return null;
	}

	@Override
	public Set<Parameter<?>> getParameters() {
		return null;
	}

	@Override
	public Parameter<?> getParameter(String name) {
		return null;
	}

	@Override
	public <T> Parameter<T> getParameter(String name, Class<T> type) {
		return null;
	}

	@Override
	public Parameter<?> getParameter(int position) {
		return null;
	}

	@Override
	public <T> Parameter<T> getParameter(int position, Class<T> type) {
		return null;
	}

	@Override
	public boolean isBound(Parameter<?> param) {
		return false;
	}

	@Override
	public <T> T getParameterValue(Parameter<T> param) {
		return null;
	}

	@Override
	public Object getParameterValue(String name) {
		return null;
	}

	@Override
	public Object getParameterValue(int position) {
		return null;
	}

	@Override
	public FlushModeType getFlushMode() {
		return null;
	}

	@Override
	public LockModeType getLockMode() {
		return null;
	}

	@Override
	public <T> T unwrap(Class<T> cls) {
		return null;
	}

	@Override
	public RowSelection getQueryOptions() {
		return null;
	}

	@Override
	public boolean isCacheable() {
		return false;
	}

	@Override
	public Integer getTimeout() {
		return null;
	}

	@Override
	public boolean isReadOnly() {
		return false;
	}

	@Override
	public Type[] getReturnTypes() {
		return null;
	}

	@Override
	public Iterator<R> iterate() {
		return null;
	}

	@Override
	public String[] getNamedParameters() {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameterList(int position, Collection values) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameterList(int position, Collection values, Type type) {
		return null;
	}

	@Override
	public Query<R> setParameterList(int position, Object[] values, Type type) {
		return null;
	}

	@Override
	public Query<R> setParameterList(int position, Object[] values) {
		return null;
	}

	@Override
	public Type determineProperBooleanType(int position, Object value, Type defaultType) {
		return null;
	}

	@Override
	public Type determineProperBooleanType(String name, Object value, Type defaultType) {
		return null;
	}

	@Override
	public String[] getReturnAliases() {
		return null;
	}

	@Override
	public QueryProducer getProducer() {
		return null;
	}

	@Override
	public Optional<R> uniqueResultOptional() {
		return null;
	}

	@Override
	public Stream<R> stream() {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> applyGraph(RootGraph graph, GraphSemantic semantic) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameter(Parameter param, Instant value, TemporalType temporalType) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameter(Parameter param, LocalDateTime value, TemporalType temporalType) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameter(Parameter param, ZonedDateTime value, TemporalType temporalType) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameter(Parameter param, OffsetDateTime value, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setParameter(String name, Instant value, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setParameter(String name, LocalDateTime value, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setParameter(String name, ZonedDateTime value, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setParameter(String name, OffsetDateTime value, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setParameter(int position, Instant value, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setParameter(int position, LocalDateTime value, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setParameter(int position, ZonedDateTime value, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setParameter(int position, OffsetDateTime value, TemporalType temporalType) {
		return null;
	}

	@Override
	public ScrollableResults scroll() {
		return null;
	}

	@Override
	public ScrollableResults scroll(ScrollMode scrollMode) {
		return null;
	}

	@Override
	public List<R> list() {
		return null;
	}

	@Override
	public R uniqueResult() {
		return null;
	}

	@Override
	public FlushMode getHibernateFlushMode() {
		return null;
	}

	@Override
	public CacheMode getCacheMode() {
		return null;
	}

	@Override
	public String getCacheRegion() {
		return null;
	}

	@Override
	public Integer getFetchSize() {
		return null;
	}

	@Override
	public LockOptions getLockOptions() {
		return null;
	}

	@Override
	public String getComment() {
		return null;
	}

	@Override
	public String getQueryString() {
		return null;
	}

	@Override
	public ParameterMetadata getParameterMetadata() {
		return null;
	}

	@Override
	public Query<R> setMaxResults(int maxResult) {
		return null;
	}

	@Override
	public Query<R> setFirstResult(int startPosition) {
		return null;
	}

	@Override
	public Query<R> setHint(String hintName, Object value) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameter(Parameter param, Object value) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameter(Parameter param, Calendar value, TemporalType temporalType) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameter(Parameter param, Date value, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setParameter(String name, Object value) {
		this.parameters.put(name, value);
		return this;
	}

	@Override
	public Query<R> setParameter(String name, Object val, Type type) {
		this.parameters.put(name, val);
		return this;
	}

	@Override
	public Query<R> setParameter(String name, Calendar value, TemporalType temporalType) {
		this.parameters.put(name, value);
		return this;
	}

	@Override
	public Query<R> setParameter(String name, Date value, TemporalType temporalType) {
		this.parameters.put(name, value);
		return this;
	}

	@Override
	public Query<R> setParameter(int position, Object value) {
		return null;
	}

	@Override
	public Query<R> setParameter(int position, Calendar value, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setParameter(int position, Date value, TemporalType temporalType) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameter(QueryParameter parameter, Object val) {
		return null;
	}

	@Override
	public Query<R> setParameter(int position, Object val, TemporalType temporalType) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameter(QueryParameter parameter, Object val, Type type) {
		return null;
	}

	@Override
	public Query<R> setParameter(int position, Object val, Type type) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameter(QueryParameter parameter, Object val, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setParameter(String name, Object val, TemporalType temporalType) {
		return null;
	}

	@Override
	public Query<R> setFlushMode(FlushModeType flushMode) {
		return null;
	}

	@Override
	public Query<R> setLockMode(LockModeType lockMode) {
		return null;
	}

	@Override
	public Query<R> setReadOnly(boolean readOnly) {
		return null;
	}

	@Override
	public Query<R> setHibernateFlushMode(FlushMode flushMode) {
		return null;
	}

	@Override
	public Query<R> setCacheMode(CacheMode cacheMode) {
		return null;
	}

	@Override
	public Query<R> setCacheable(boolean cacheable) {
		return null;
	}

	@Override
	public Query<R> setCacheRegion(String cacheRegion) {
		return null;
	}

	@Override
	public Query<R> setTimeout(int timeout) {
		return null;
	}

	@Override
	public Query<R> setFetchSize(int fetchSize) {
		return null;
	}

	@Override
	public Query<R> setLockOptions(LockOptions lockOptions) {
		return null;
	}

	@Override
	public Query<R> setLockMode(String alias, LockMode lockMode) {
		return null;
	}

	@Override
	public Query<R> setComment(String comment) {
		return null;
	}

	@Override
	public Query<R> addQueryHint(String hint) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameterList(QueryParameter parameter, Collection values) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameterList(String name, Collection values) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setParameterList(String name, Collection values, Type type) {
		return null;
	}

	@Override
	public Query<R> setParameterList(String name, Object[] values, Type type) {
		return null;
	}

	@Override
	public Query<R> setParameterList(String name, Object[] values) {
		return null;
	}

	@Override
	public Query<R> setProperties(Object bean) {
		return null;
	}

	@Override
	@SuppressWarnings("rawtypes")
	public Query<R> setProperties(Map bean) {
		return null;
	}

	@Override
	public Query<R> setEntity(int position, Object val) {
		return null;
	}

	@Override
	public Query<R> setEntity(String name, Object val) {
		return null;
	}

	@Override
	public Query<R> setResultTransformer(ResultTransformer transformer) {
		return null;
	}
	
}
