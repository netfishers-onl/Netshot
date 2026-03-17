import { User } from "@/types";
import httpClient, { HttpMethod, HttpStatus, isNetshotError } from "./httpClient";
import oidc from "./oidc";
import { UpdateUserPayload } from "./types";

export type OidcInfo = {
  endpoint: string | null;
  clientId: string | null;
};

export type MeResult = {
  user: User | null;
  oidcInfo: OidcInfo;
};

async function me(): Promise<MeResult> {
  try {
    const response = await httpClient.request(HttpMethod.GET, "/user");
    const oidcInfo = oidc.extractInfoFromHeaders(response.headers);
    const user = await response.json() as User;
    return {
      user,
      oidcInfo,
    };
  } catch (err) {
    if (
      isNetshotError(err) &&
      err.response &&
      (err.response.status === HttpStatus.Unauthorized ||
        err.response.status === HttpStatus.Forbidden)
    ) {
      return {
        user: null,
        oidcInfo: oidc.extractInfoFromHeaders(err.response.headers),
      };
    }
    throw err;
  }
}

async function update(id: number, payload: UpdateUserPayload) {
  return httpClient.put<User, UpdateUserPayload>(`/user/${id}`, payload);
}

export default {
  me,
  update,
};
