const OIDC_ENDPOINT_HEADER = "X-OIDC-AuthorizationEndpoint"
const OIDC_CLIENT_ID_HEADER = "X-OIDC-ClientID"
const OIDC_LAST_STATE_STORAGE_TOKEN = "oidc.laststate"

function extractDataFromHeaders(headers: Headers) {
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

function generateUrl(endpoint: string, clientId: string) {
  const state = generateState()

  setState(state)

  const url = new URL(endpoint)

  url.searchParams.append("response_type", "code")
  url.searchParams.append("client_id", clientId)
  url.searchParams.append("redirect_uri", window.location.href)
  url.searchParams.append("state", state)
  url.searchParams.append("scope", "openid")

  return url.toString()
}

function getState() {
  return sessionStorage.getItem(OIDC_LAST_STATE_STORAGE_TOKEN)
}

function setState(state: string) {
  return sessionStorage.setItem(OIDC_LAST_STATE_STORAGE_TOKEN, state)
}

function removeState() {
  return sessionStorage.removeItem(OIDC_LAST_STATE_STORAGE_TOKEN)
}

export default {
  extractInfoFromHeaders: extractDataFromHeaders,
  generateUrl,
  getState,
  setState,
  removeState,
}
