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
  return httpClient.delete(`/scripts/${id}`);
}

export default {
  getAll,
  getById,
  create,
  validate,
  remove,
};
