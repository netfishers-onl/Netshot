import { Diagnostic } from "@/types";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import { PaginationQueryParams } from "./types";

type DiagnosticResult = {
  creationDate: string;
  lastCheckDate: string;
  diagnosticName: string;
  type: string;
};

export type CreateOrUpdateDiagnosticPayload = {
  id: number;
  name: string;
  targetGroup: string;
  enabled: boolean;
  resultType: string;
  type: string;
  script: string;
  deviceDriver: string;
  cliMode: string;
  command: string;
  modifierPattern: string;
  modifierReplacement: string;
};

async function getAll(queryParams: PaginationQueryParams = {}) {
  return httpClient.get<Diagnostic[]>("/diagnostics", {
    queryParams,
  });
}

async function getAllResult(id: number, queryParams: PaginationQueryParams) {
  return httpClient.get<DiagnosticResult[]>(
    `/diagnostics/${id}/diagnosticresults`,
    {
      queryParams,
    }
  );
}

async function getById(id: number) {
  return httpClient.get<Diagnostic>(`/diagnostics/${id}`);
}

async function create(payload: CreateOrUpdateDiagnosticPayload) {
  return httpClient.post<Diagnostic, CreateOrUpdateDiagnosticPayload>(
    "/diagnostics",
    payload
  );
}

async function update(
  id: number,
  payload: Partial<CreateOrUpdateDiagnosticPayload>
) {
  return httpClient.put<Diagnostic, Partial<CreateOrUpdateDiagnosticPayload>>(
    `/diagnostics/${id}`,
    payload
  );
}

async function enable(payload: Diagnostic) {
  return httpClient.put<Diagnostic, Diagnostic>(`/diagnostics/${payload.id}`, {
    ...payload,
    enabled: true,
  });
}

async function disable(payload: Diagnostic) {
  return httpClient.put<Diagnostic, Diagnostic>(`/diagnostics/${payload.id}`, {
    ...payload,
    enabled: false,
  });
}

async function remove(id: number) {
  const req = await httpClient.rawRequest(
    HttpMethod.Delete,
    `/diagnostics/${id}`
  );
  return req.status === HttpStatus.NoContent;
}

export default {
  getAll,
  getAllResult,
  getById,
  create,
  update,
  remove,
  enable,
  disable,
};
