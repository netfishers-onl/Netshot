import { Diagnostic } from "@/types";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import {
  CreateOrUpdateDiagnosticPayload,
  DiagnosticResult,
  PaginationQueryParams,
} from "./types";

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
    cliMode: payload.cliMode,
    command: payload.command,
    deviceDriver: payload.deviceDriver,
    enabled: true,
    modifierPattern: payload.modifierPattern,
    modifierReplacement: payload.modifierReplacement,
    name: payload.name,
    resultType: payload.resultType,
    // @ts-ignore
    targetGroup: payload.targetGroup.id.toString(),
    type: payload.type,
  });
}

async function disable(payload: Diagnostic) {
  return httpClient.put<Diagnostic, Diagnostic>(`/diagnostics/${payload.id}`, {
    cliMode: payload.cliMode,
    command: payload.command,
    deviceDriver: payload.deviceDriver,
    enabled: false,
    modifierPattern: payload.modifierPattern,
    modifierReplacement: payload.modifierReplacement,
    name: payload.name,
    resultType: payload.resultType,
    // @ts-ignore
    targetGroup: payload.targetGroup.id.toString(),
    type: payload.type,
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
