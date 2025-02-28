import { Task } from "@/types";
import httpClient, { HttpMethod } from "./httpClient";
import {
  CreateOrUpdateTaskPayload,
  TaskQueryParams,
  TaskSummaryResponse,
} from "./types";

async function getAll(queryParams: TaskQueryParams) {
  return httpClient.get<Task[]>("/tasks", {
    queryParams,
  });
}

async function getById(id: number) {
  return httpClient.get<Task>(`/tasks/${id}`);
}

async function create(payload: CreateOrUpdateTaskPayload) {
  return httpClient.post<Task, CreateOrUpdateTaskPayload>("/tasks", payload);
}

async function update(id: number, payload: CreateOrUpdateTaskPayload) {
  return httpClient.put<Task, CreateOrUpdateTaskPayload>(
    `/tasks/${id}`,
    payload
  );
}

async function getDebugById(id: number) {
  const req = await httpClient.rawRequest(
    HttpMethod.Get,
    `/tasks/${id}/debuglog`
  );
  return req;
}

async function getAllSummary() {
  return httpClient.get<TaskSummaryResponse>(`/tasks/summary`);
}

export default {
  getAll,
  getById,
  create,
  update,
  getDebugById,
  getAllSummary,
};
