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

async function getAllApiTokens(queryParams: PaginationQueryParams)  {
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
  return httpClient.delete(`/apitokens/${id}`);
}

async function getAllCredentialSets(queryParams: PaginationQueryParams) {
  return httpClient.get<CredentialSet[]>("/credentialsets", {
    queryParams,
  });
}

async function createCredentialSet(payload: Partial<DeviceCredentialPayload>) {
  await httpClient.post("/credentialsets", payload);
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
  return httpClient.delete(`/credentialsets/${id}`);
}

async function getAllDomains(queryParams: PaginationQueryParams) {
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
  return httpClient.delete(`/domains/${id}`);
}

async function getAllHooks(queryParams: PaginationQueryParams) {
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
  return httpClient.delete(`/hooks/${id}`);
}

async function getAllUsers(queryParams: PaginationQueryParams) {
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
  await httpClient.delete(`/users/${id}`);
}

async function getAllDrivers(queryParams: PaginationQueryParams, refresh: boolean = false) {
  return httpClient.get<DeviceType[]>(`/devicetypes`, {
    queryParams: {
      ...queryParams,
      refresh,
    },
  });
}

async function getAllClusterMembers() {
  return httpClient.get<ClusterMember[]>("/cluster/members");
}

async function getClusterMasterStatus() {
  return httpClient.get<ClusterMasterStatus[]>("/cluster/masterstatus");
}

export default {
  getAllApiTokens,
  createApiToken,
  updateApiToken,
  removeApiToken,
  getAllCredentialSets,
  createCredentialSet,
  updateCredentialSet,
  removeCredentialSet,
  getAllDomains,
  createDomain,
  updateDomain,
  removeDomain,
  getAllHooks,
  createHook,
  updateHook,
  removeHook,
  getAllUsers,
  createUser,
  updateUser,
  removeUser,
  getAllDrivers,
  getAllClusterMembers,
  getClusterMasterStatus,
};
