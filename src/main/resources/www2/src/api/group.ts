import { Group, GroupType } from "@/types";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import { PaginationQueryParams } from "./types";

export type CreateGroupPayload = {
  name: string;
  folder: string;
  type: GroupType;
  hiddenFromReports: boolean;
  staticDevices?: number[];
  driver?: string;
  query?: string;
};

export type UpdateGroupPayload = {
  name: string;
  folder: string;
  hiddenFromReports: boolean;
  staticDevices?: number[];
  driver?: string;
  query?: string;
};

async function getAll(queryParams: PaginationQueryParams = {}) {
  return httpClient.get<Group[]>("/groups");
}

async function getById(id: number) {
  return httpClient.get<Group>(`/groups/${id}`);
}

async function create(payload: CreateGroupPayload) {
  return httpClient.post<Group, CreateGroupPayload>("/groups", payload);
}

async function update(id: number, payload: UpdateGroupPayload) {
  return httpClient.put<Group, UpdateGroupPayload>(`/groups/${id}`, payload);
}

async function remove(id: number) {
  const req = await httpClient.rawRequest(HttpMethod.Delete, `/groups/${id}`);
  return req.status === HttpStatus.NoContent;
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
