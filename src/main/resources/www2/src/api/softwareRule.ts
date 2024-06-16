import { SoftwareRule } from "@/types";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import { CreateOrUpdateSoftwareRule } from "./types";

async function getAll() {
  return httpClient.get<SoftwareRule[]>("/softwarerules");
}

async function create(payload: CreateOrUpdateSoftwareRule) {
  return httpClient.post<SoftwareRule, CreateOrUpdateSoftwareRule>(
    "/softwarerules",
    payload
  );
}

async function update(
  id: number,
  payload: Partial<CreateOrUpdateSoftwareRule>
) {
  return httpClient.put<SoftwareRule, Partial<CreateOrUpdateSoftwareRule>>(
    `/softwarerules/${id}`,
    payload
  );
}

async function reorder(id: number, nextId: number) {
  const req = await httpClient.rawRequest(
    HttpMethod.Post,
    nextId
      ? `/softwarerules/${id}/sort?next=${nextId}`
      : `/softwarerules/${id}/sort`
  );
  return req.status === HttpStatus.NoContent;
}

async function remove(id: number) {
  const req = await httpClient.rawRequest(
    HttpMethod.Delete,
    `/softwarerules/${id}`
  );
  return req.status === HttpStatus.NoContent;
}

export default {
  getAll,
  create,
  update,
  remove,
  reorder,
};
