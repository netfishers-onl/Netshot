import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import { SigninPayload, SigninResponse } from "./types";

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
  const req = await httpClient.rawRequest(HttpMethod.Delete, `/user/${id}`);
  return req.status === HttpStatus.NoContent;
}

export default {
  signin,
  signout,
};
