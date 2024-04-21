import { Task, TaskScheduleType, TaskStatus } from "@/types";
import httpClient, { HttpMethod } from "./httpClient";
import { PaginationQueryParams } from "./types";

export type TaskQueryParams = {
  status?: TaskStatus;
  after?: number;
  before?: number;
} & PaginationQueryParams;

export type CreateOrUpdateTaskPayload = {
  id?: number;
  cancelled?: boolean;
  type?: string;
  group?: number;
  device?: number;
  domain?: number;
  subnets?: string;
  scheduleReference?: Date;
  scheduleType?: TaskScheduleType;
  scheduleFactor?: number;
  comments?: string;
  limitToOutofdateDeviceHours?: number;
  daysToPurge?: number;
  configDaysToPurge?: number;
  configSizeToPurge?: number;
  configKeepDays?: number;
  script?: string;
  driver?: string;
  userInputs?: {
    additionalProp1?: string;
    additionalProp2?: string;
    additionalProp3?: string;
  };
  debugEnabled?: boolean;
  dontRunDiagnostics?: boolean;
  dontCheckCompliance?: boolean;
};

export type TaskSummaryResponse = {
  countByStatus: {
    additionalProp1: number;
    additionalProp2: number;
    additionalProp3: number;
  };
  threadCount: number;
};

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
