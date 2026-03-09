const OIDC_ENDPOINT_HEADER = "X-OIDC-AuthorizationEndpoint"
const OIDC_CLIENT_ID_HEADER = "X-OIDC-ClientID"
const OIDC_ENDPOINT_STORAGE_TOKEN = "oidc.endpoint"
const OIDC_CLIENT_ID_STORAGE_TOKEN = "oidc.clientid"
const OIDC_LAST_STATE_STORAGE_TOKEN = "oidc.laststate"

function extracDataFromHeaders(headers: Headers) {
  return {
    endpoint: headers.get(OIDC_ENDPOINT_HEADER),
    clientId: headers.get(OIDC_CLIENT_ID_HEADER),
  }
}

function generateState() {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  let state = ""

  for (let i = 0; i < 32; i++) {
    const c = Math.floor(Math.random() * chars.length)
    state += chars.charAt(c)
  }

  return state
}

function generateUrl() {
  const state = generateState()
  const clientId = getClientId()
  const endpoint = getEndpoint()

  if (!clientId) {
    throw new Error(`OIDC client ID not found`)
  }

  if (!endpoint) {
    throw new Error(`OIDC endpoint not found`)
  }

  setState(state)

  const url = new URL(endpoint)

  url.searchParams.append("response_type", "code")
  url.searchParams.append("client_id", clientId)
  url.searchParams.append("redirect_uri", window.location.href)
  url.searchParams.append("state", state)
  url.searchParams.append("scope", "openid")

  return url.toString()
}

function getEndpoint() {
  return sessionStorage.getItem(OIDC_ENDPOINT_STORAGE_TOKEN)
}

function getClientId() {
  return sessionStorage.getItem(OIDC_CLIENT_ID_STORAGE_TOKEN)
}

function getState() {
  return sessionStorage.getItem(OIDC_LAST_STATE_STORAGE_TOKEN)
}

function setEndpoint(endpoint: string) {
  return sessionStorage.setItem(OIDC_ENDPOINT_STORAGE_TOKEN, endpoint)
}

function setClientId(clientId: string) {
  return sessionStorage.setItem(OIDC_CLIENT_ID_STORAGE_TOKEN, clientId)
}

function setState(state: string) {
  return sessionStorage.setItem(OIDC_LAST_STATE_STORAGE_TOKEN, state)
}

function removeEndpoint() {
  return sessionStorage.removeItem(OIDC_ENDPOINT_STORAGE_TOKEN)
}

function removeClientId() {
  return sessionStorage.removeItem(OIDC_CLIENT_ID_STORAGE_TOKEN)
}

function removeState() {
  return sessionStorage.removeItem(OIDC_LAST_STATE_STORAGE_TOKEN)
}

function clear() {
  removeEndpoint()
  removeClientId()
  removeState()
}

function getData() {
  return {
    endpoint: getEndpoint(),
    clientId: getClientId(),
    state: getState(),
  }
}

function setDataFromHeaders(headers: Headers) {
  const data = extracDataFromHeaders(headers)

  if (data.endpoint && data.clientId) {
    setEndpoint(data.endpoint)
    setClientId(data.clientId)
  }
}

function isOidcConnection() {
  return Boolean(getEndpoint() && getClientId())
}

export default {
  extracDataFromHeaders,
  setDataFromHeaders,
  generateUrl,
  getEndpoint,
  getClientId,
  getData,
  getState,
  setEndpoint,
  setClientId,
  setState,
  removeEndpoint,
  removeClientId,
  removeState,
  isOidcConnection,
  clear,
}
