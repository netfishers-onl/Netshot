import { Policy } from "@/types";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";

export type CreateOrUpdatePolicy = {
  id?: number;
  name: string;
  targetGroups: number[];
};

async function getAll() {
  return httpClient.get<Policy[]>("/policies");
}

async function create(payload: CreateOrUpdatePolicy) {
  return httpClient.post<Policy, CreateOrUpdatePolicy>("/policies", payload);
}

async function update(id: number, payload: Partial<CreateOrUpdatePolicy>) {
  return httpClient.put<Policy, Partial<CreateOrUpdatePolicy>>(
    `/policies/${id}`,
    payload
  );
}

async function remove(id: number) {
  const req = await httpClient.rawRequest(HttpMethod.Delete, `/policies/${id}`);
  return req.status === HttpStatus.NoContent;
}

export default {
  getAll,
  create,
  update,
  remove,
};
