import {
  ApiToken,
  ClusterMasterStatus,
  ClusterMember,
  CredentialSet,
  DeviceType,
  Domain,
  Hook,
  User,
} from "@/types";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import { DeviceCredentialPayload, PaginationQueryParams } from "./types";

async function getAllApiToken(queryParams: PaginationQueryParams) {
  return httpClient.get<ApiToken[]>("/apitokens", {
    queryParams,
  });
}

async function createApiToken(payload: Partial<ApiToken>) {
  return httpClient.post<ApiToken, Partial<ApiToken>>("/apitokens", payload);
}

async function updateApiToken(id: number, payload: Partial<ApiToken>) {
  return httpClient.put<ApiToken, Partial<ApiToken>>(
    `/apitokens/${id}`,
    payload
  );
}

async function removeApiToken(id: number) {
  const req = await httpClient.rawRequest(
    HttpMethod.Delete,
    `/apitokens/${id}`
  );
  return req.status === HttpStatus.NoContent;
}

async function getAllCredentialSet(queryParams: PaginationQueryParams) {
  return httpClient.get<CredentialSet[]>("/credentialsets", {
    queryParams,
  });
}

async function createCredentialSet(payload: Partial<DeviceCredentialPayload>) {
  const req = await httpClient.rawRequest(HttpMethod.Post, "/credentialsets", {
    body: payload,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  return req.status === HttpStatus.NoContent;
}

async function updateCredentialSet(
  id: number,
  payload: Partial<DeviceCredentialPayload>
) {
  return httpClient.put<CredentialSet, Partial<DeviceCredentialPayload>>(
    `/credentialsets/${id}`,
    payload
  );
}

async function removeCredentialSet(id: number) {
  const req = await httpClient.rawRequest(
    HttpMethod.Delete,
    `/credentialsets/${id}`
  );
  return req.status === HttpStatus.NoContent;
}

async function getAllDomain(queryParams: PaginationQueryParams) {
  return httpClient.get<Domain[]>("/domains", {
    queryParams,
  });
}

async function createDomain(payload: Partial<Domain>) {
  return httpClient.post<Domain, Partial<Domain>>("/domains", payload);
}

async function updateDomain(id: number, payload: Partial<Domain>) {
  return httpClient.put<Domain, Partial<Domain>>(`/domains/${id}`, payload);
}

async function removeDomain(id: number) {
  const req = await httpClient.rawRequest(HttpMethod.Delete, `/domains/${id}`);
  return req.status === HttpStatus.NoContent;
}

async function getAllHook(queryParams: PaginationQueryParams) {
  return httpClient.get<Hook[]>("/hooks", {
    queryParams,
  });
}

async function createHook(payload: Partial<Hook>) {
  return httpClient.post<Hook, Partial<Hook>>("/hooks", payload);
}

async function updateHook(id: number, payload: Partial<Hook>) {
  return httpClient.put<Hook, Partial<Hook>>(`/hooks/${id}`, payload);
}

async function removeHook(id: number) {
  const req = await httpClient.rawRequest(HttpMethod.Delete, `/hooks/${id}`);
  return req.status === HttpStatus.NoContent;
}

async function getAllUser(queryParams: PaginationQueryParams) {
  return httpClient.get<User[]>("/users", {
    queryParams,
  });
}

async function createUser(payload: Partial<User>) {
  return httpClient.post<User, Partial<User>>("/users", payload);
}

async function updateUser(id: number, payload: Partial<User>) {
  return httpClient.put<User, Partial<User>>(`/users/${id}`, payload);
}

async function removeUser(id: number) {
  const req = await httpClient.rawRequest(HttpMethod.Delete, `/users/${id}`);
  return req.status === HttpStatus.NoContent;
}

async function getAllDriver(queryParams: PaginationQueryParams) {
  return httpClient.get<DeviceType[]>(`/devicetypes`, {
    queryParams,
  });
}

async function getAllClusterMember() {
  return httpClient.get<ClusterMember[]>("/cluster/members");
}

async function getClusterMasterStatus() {
  return httpClient.get<ClusterMasterStatus[]>("/cluster/masterstatus");
}

export default {
  getAllApiToken,
  createApiToken,
  updateApiToken,
  removeApiToken,
  getAllCredentialSet,
  createCredentialSet,
  updateCredentialSet,
  removeCredentialSet,
  getAllDomain,
  createDomain,
  updateDomain,
  removeDomain,
  getAllHook,
  createHook,
  updateHook,
  removeHook,
  getAllUser,
  createUser,
  updateUser,
  removeUser,
  getAllDriver,
  getAllClusterMember,
  getClusterMasterStatus,
};
