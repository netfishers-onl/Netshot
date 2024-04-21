import { Script } from "@/types";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import { PaginationQueryParams } from "./types";

async function getAll(queryParams: PaginationQueryParams = {}) {
  return httpClient.get<Script[]>("/scripts", {
    queryParams,
  });
}

async function getById(id: number) {
  return httpClient.get<Script>(`/scripts/${id}`);
}

async function create(payload: Partial<Script>) {
  return httpClient.post<Script, Partial<Script>>("/scripts", payload);
}

async function validate(payload: Partial<Script>) {
  return httpClient.post<Script, Partial<Script>>("/scripts", payload, {
    queryParams: {
      validateonly: true,
    },
  });
}

async function remove(id: number) {
  const req = await httpClient.rawRequest(HttpMethod.Delete, `/scripts/${id}`);
  return req.status === HttpStatus.NoContent;
}

export default {
  getAll,
  getById,
  create,
  validate,
  remove,
};
