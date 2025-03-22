import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import { ServerInfoResponse, SigninPayload, SigninResponse } from "./types";


/**
 * Netshot server info (version, etc.)
 */
async function serverInfo() {
  return await httpClient.get<ServerInfoResponse>("/serverinfo");
}

/**
 * Sign in user
 */
async function signin(payload: SigninPayload) {
  return await httpClient.post<SigninResponse, SigninPayload>("/user", payload);
}

/**
 * Sign out current user
 */
async function signout(id: number) {
  return httpClient.delete(`/user/${id}`);
}

export default {
  serverInfo,
  signin,
  signout,
};
