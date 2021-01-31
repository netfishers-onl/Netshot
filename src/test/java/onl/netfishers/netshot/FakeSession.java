package onl.netfishers.netshot;

import java.io.Serializable;
import java.sql.Connection;
import java.util.Map;

import javax.persistence.EntityManagerFactory;
import javax.persistence.FlushModeType;
import javax.persistence.LockModeType;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaDelete;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.CriteriaUpdate;
import javax.persistence.metamodel.Metamodel;

import org.hibernate.CacheMode;
import org.hibernate.Criteria;
import org.hibernate.Filter;
import org.hibernate.FlushMode;
import org.hibernate.HibernateException;
import org.hibernate.IdentifierLoadAccess;
import org.hibernate.LobHelper;
import org.hibernate.LockMode;
import org.hibernate.LockOptions;
import org.hibernate.MultiIdentifierLoadAccess;
import org.hibernate.NaturalIdLoadAccess;
import org.hibernate.ReplicationMode;
import org.hibernate.Session;
import org.hibernate.SessionEventListener;
import org.hibernate.SessionFactory;
import org.hibernate.SharedSessionBuilder;
import org.hibernate.SimpleNaturalIdLoadAccess;
import org.hibernate.Transaction;
import org.hibernate.TypeHelper;
import org.hibernate.UnknownProfileException;
import org.hibernate.graph.RootGraph;
import org.hibernate.procedure.ProcedureCall;
import org.hibernate.query.NativeQuery;
import org.hibernate.query.Query;
import org.hibernate.stat.SessionStatistics;

@SuppressWarnings({ "rawtypes", "unchecked", "deprecation" })
public class FakeSession implements Session {

	/**
	 *
	 */
	private static final long serialVersionUID = 7430294064118734629L;

	@Override
	public String getTenantIdentifier() {
		return null;
	}

	@Override
	public void close() throws HibernateException {

	}

	@Override
	public boolean isOpen() {
		return false;
	}

	@Override
	public boolean isConnected() {
		return false;
	}

	@Override
	public Transaction beginTransaction() {
		return null;
	}

	@Override
	public Transaction getTransaction() {
		return null;
	}

	@Override
	public Query createQuery(String queryString) {
		return null;
	}

	@Override
	public Query getNamedQuery(String queryName) {
		return null;
	}

	@Override
	public ProcedureCall getNamedProcedureCall(String name) {
		return null;
	}

	@Override
	public ProcedureCall createStoredProcedureCall(String procedureName) {
		return null;
	}

	@Override
	public ProcedureCall createStoredProcedureCall(String procedureName, Class... resultClasses) {
		return null;
	}

	@Override
	public ProcedureCall createStoredProcedureCall(String procedureName, String... resultSetMappings) {
		return null;
	}

	@Override
	public Criteria createCriteria(Class persistentClass) {
		return null;
	}

	@Override
	public Criteria createCriteria(Class persistentClass, String alias) {
		return null;
	}

	@Override
	public Criteria createCriteria(String entityName) {
		return null;
	}

	@Override
	public Criteria createCriteria(String entityName, String alias) {
		return null;
	}

	@Override
	public Integer getJdbcBatchSize() {
		return null;
	}

	@Override
	public void setJdbcBatchSize(Integer jdbcBatchSize) {

	}

	@Override
	public Query createNamedQuery(String name) {
		return null;
	}

	@Override
	public NativeQuery createNativeQuery(String sqlString) {
		return null;
	}

	@Override
	public NativeQuery createNativeQuery(String sqlString, String resultSetMapping) {
		return null;
	}

	@Override
	public NativeQuery getNamedNativeQuery(String name) {
		return null;
	}

	@Override
	public void remove(Object entity) {

	}

	@Override
	public <T> T find(Class<T> entityClass, Object primaryKey) {
		return null;
	}

	@Override
	public <T> T find(Class<T> entityClass, Object primaryKey, Map<String, Object> properties) {
		return null;
	}

	@Override
	public <T> T find(Class<T> entityClass, Object primaryKey, LockModeType lockMode) {
		return null;
	}

	@Override
	public <T> T find(Class<T> entityClass, Object primaryKey, LockModeType lockMode, Map<String, Object> properties) {
		return null;
	}

	@Override
	public <T> T getReference(Class<T> entityClass, Object primaryKey) {
		return null;
	}

	@Override
	public void setFlushMode(FlushModeType flushMode) {

	}

	@Override
	public void lock(Object entity, LockModeType lockMode) {

	}

	@Override
	public void lock(Object entity, LockModeType lockMode, Map<String, Object> properties) {

	}

	@Override
	public void refresh(Object entity, Map<String, Object> properties) {

	}

	@Override
	public void refresh(Object entity, LockModeType lockMode) {

	}

	@Override
	public void refresh(Object entity, LockModeType lockMode, Map<String, Object> properties) {

	}

	@Override
	public void detach(Object entity) {

	}

	@Override
	public boolean contains(Object entity) {
		return false;
	}

	@Override
	public LockModeType getLockMode(Object entity) {
		return null;
	}

	@Override
	public void setProperty(String propertyName, Object value) {

	}

	@Override
	public Map<String, Object> getProperties() {
		return null;
	}

	@Override
	public NativeQuery createNativeQuery(String sqlString, Class resultClass) {
		return null;
	}

	@Override
	public StoredProcedureQuery createNamedStoredProcedureQuery(String name) {
		return null;
	}

	@Override
	public StoredProcedureQuery createStoredProcedureQuery(String procedureName) {
		return null;
	}

	@Override
	public StoredProcedureQuery createStoredProcedureQuery(String procedureName, Class... resultClasses) {
		return null;
	}

	@Override
	public StoredProcedureQuery createStoredProcedureQuery(String procedureName, String... resultSetMappings) {
		return null;
	}

	@Override
	public void joinTransaction() {

	}

	@Override
	public boolean isJoinedToTransaction() {
		return false;
	}

	@Override
	public <T> T unwrap(Class<T> cls) {
		return null;
	}

	@Override
	public Object getDelegate() {
		return null;
	}

	@Override
	public EntityManagerFactory getEntityManagerFactory() {
		return null;
	}

	@Override
	public CriteriaBuilder getCriteriaBuilder() {
		return null;
	}

	@Override
	public Metamodel getMetamodel() {
		return null;
	}

	@Override
	public Session getSession() {
		return null;
	}

	@Override
	public SharedSessionBuilder sessionWithOptions() {
		return null;
	}

	@Override
	public void flush() throws HibernateException {

	}

	@Override
	public void setFlushMode(FlushMode flushMode) {

	}

	@Override
	public FlushModeType getFlushMode() {
		return null;
	}

	@Override
	public void setHibernateFlushMode(FlushMode flushMode) {

	}

	@Override
	public FlushMode getHibernateFlushMode() {
		return null;
	}

	@Override
	public void setCacheMode(CacheMode cacheMode) {

	}

	@Override
	public CacheMode getCacheMode() {
		return null;
	}

	@Override
	public SessionFactory getSessionFactory() {
		return null;
	}

	@Override
	public void cancelQuery() throws HibernateException {

	}

	@Override
	public boolean isDirty() throws HibernateException {
		return false;
	}

	@Override
	public boolean isDefaultReadOnly() {
		return false;
	}

	@Override
	public void setDefaultReadOnly(boolean readOnly) {

	}

	@Override
	public Serializable getIdentifier(Object object) {
		return null;
	}

	@Override
	public boolean contains(String entityName, Object object) {
		return false;
	}

	@Override
	public void evict(Object object) {

	}

	@Override
	public <T> T load(Class<T> theClass, Serializable id, LockMode lockMode) {
		return null;
	}

	@Override
	public <T> T load(Class<T> theClass, Serializable id, LockOptions lockOptions) {
		return null;
	}

	@Override
	public Object load(String entityName, Serializable id, LockMode lockMode) {
		return null;
	}

	@Override
	public Object load(String entityName, Serializable id, LockOptions lockOptions) {
		return null;
	}

	@Override
	public <T> T load(Class<T> theClass, Serializable id) {
		return null;
	}

	@Override
	public Object load(String entityName, Serializable id) {
		return null;
	}

	@Override
	public void load(Object object, Serializable id) {

	}

	@Override
	public void replicate(Object object, ReplicationMode replicationMode) {

	}

	@Override
	public void replicate(String entityName, Object object, ReplicationMode replicationMode) {

	}

	@Override
	public Serializable save(Object object) {
		return null;
	}

	@Override
	public Serializable save(String entityName, Object object) {
		return null;
	}

	@Override
	public void saveOrUpdate(Object object) {

	}

	@Override
	public void saveOrUpdate(String entityName, Object object) {

	}

	@Override
	public void update(Object object) {

	}

	@Override
	public void update(String entityName, Object object) {

	}

	@Override
	public Object merge(Object object) {
		return null;
	}

	@Override
	public Object merge(String entityName, Object object) {
		return null;
	}

	@Override
	public void persist(Object object) {

	}

	@Override
	public void persist(String entityName, Object object) {

	}

	@Override
	public void delete(Object object) {

	}

	@Override
	public void delete(String entityName, Object object) {

	}

	@Override
	public void lock(Object object, LockMode lockMode) {

	}

	@Override
	public void lock(String entityName, Object object, LockMode lockMode) {

	}

	@Override
	public LockRequest buildLockRequest(LockOptions lockOptions) {
		return null;
	}

	@Override
	public void refresh(Object object) {

	}

	@Override
	public void refresh(String entityName, Object object) {

	}

	@Override
	public void refresh(Object object, LockMode lockMode) {

	}

	@Override
	public void refresh(Object object, LockOptions lockOptions) {

	}

	@Override
	public void refresh(String entityName, Object object, LockOptions lockOptions) {

	}

	@Override
	public LockMode getCurrentLockMode(Object object) {
		return null;
	}

	@Override
	public org.hibernate.Query createFilter(Object collection, String queryString) {
		return null;
	}

	@Override
	public void clear() {

	}

	@Override
	public <T> T get(Class<T> entityType, Serializable id) {
		return null;
	}

	@Override
	public <T> T get(Class<T> entityType, Serializable id, LockMode lockMode) {
		return null;
	}

	@Override
	public <T> T get(Class<T> entityType, Serializable id, LockOptions lockOptions) {
		return null;
	}

	@Override
	public Object get(String entityName, Serializable id) {
		return null;
	}

	@Override
	public Object get(String entityName, Serializable id, LockMode lockMode) {
		return null;
	}

	@Override
	public Object get(String entityName, Serializable id, LockOptions lockOptions) {
		return null;
	}

	@Override
	public String getEntityName(Object object) {
		return null;
	}

	@Override
	public IdentifierLoadAccess byId(String entityName) {
		return null;
	}

	@Override
	public <T> MultiIdentifierLoadAccess<T> byMultipleIds(Class<T> entityClass) {
		return null;
	}

	@Override
	public MultiIdentifierLoadAccess byMultipleIds(String entityName) {
		return null;
	}

	@Override
	public <T> IdentifierLoadAccess<T> byId(Class<T> entityClass) {
		return null;
	}

	@Override
	public NaturalIdLoadAccess byNaturalId(String entityName) {
		return null;
	}

	@Override
	public <T> NaturalIdLoadAccess<T> byNaturalId(Class<T> entityClass) {
		return null;
	}

	@Override
	public SimpleNaturalIdLoadAccess bySimpleNaturalId(String entityName) {
		return null;
	}

	@Override
	public <T> SimpleNaturalIdLoadAccess<T> bySimpleNaturalId(Class<T> entityClass) {
		return null;
	}

	@Override
	public Filter enableFilter(String filterName) {
		return null;
	}

	@Override
	public Filter getEnabledFilter(String filterName) {
		return null;
	}

	@Override
	public void disableFilter(String filterName) {

	}

	@Override
	public SessionStatistics getStatistics() {
		return null;
	}

	@Override
	public boolean isReadOnly(Object entityOrProxy) {
		return false;
	}

	@Override
	public void setReadOnly(Object entityOrProxy, boolean readOnly) {

	}

	@Override
	public <T> RootGraph<T> createEntityGraph(Class<T> rootType) {
		return null;
	}

	@Override
	public RootGraph<?> createEntityGraph(String graphName) {
		return null;
	}

	@Override
	public RootGraph<?> getEntityGraph(String graphName) {
		return null;
	}

	@Override
	public Connection disconnect() {
		return null;
	}

	@Override
	public void reconnect(Connection connection) {

	}

	@Override
	public boolean isFetchProfileEnabled(String name) throws UnknownProfileException {
		return false;
	}

	@Override
	public void enableFetchProfile(String name) throws UnknownProfileException {

	}

	@Override
	public void disableFetchProfile(String name) throws UnknownProfileException {

	}

	@Override
	public TypeHelper getTypeHelper() {
		return null;
	}

	@Override
	public LobHelper getLobHelper() {
		return null;
	}

	@Override
	public void addEventListeners(SessionEventListener... listeners) {

	}

	@Override
	public <T> Query<T> createQuery(String queryString, Class<T> resultType) {
		return null;
	}

	@Override
	public <T> Query<T> createQuery(CriteriaQuery<T> criteriaQuery) {
		return null;
	}

	@Override
	public Query createQuery(CriteriaUpdate updateQuery) {
		return null;
	}

	@Override
	public Query createQuery(CriteriaDelete deleteQuery) {
		return null;
	}

	@Override
	public <T> Query<T> createNamedQuery(String name, Class<T> resultType) {
		return null;
	}

	@Override
	public NativeQuery createSQLQuery(String queryString) {
		return null;
	}
	
}
