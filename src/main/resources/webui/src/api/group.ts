import { Group } from "@/types";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import {
  CreateGroupPayload,
  PaginationQueryParams,
  UpdateGroupPayload,
} from "./types";

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
  return httpClient.delete(`/groups/${id}`);
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
