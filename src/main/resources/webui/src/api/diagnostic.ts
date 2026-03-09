import { Diagnostic } from "@/types"
import httpClient from "./httpClient"
import {
  CreateOrUpdateDiagnosticPayload,
  CreateOrUpdateDiagnosticScriptPayload,
  DiagnosticResult,
  PaginationQueryParams,
} from "./types"

async function getAll(queryParams: PaginationQueryParams = {}) {
  return httpClient.get<Diagnostic[]>("/diagnostics", {
    queryParams,
  })
}

async function getAllResults(id: number, queryParams: PaginationQueryParams) {
  return httpClient.get<DiagnosticResult[]>(`/diagnostics/${id}/diagnosticresults`, {
    queryParams,
  })
}

async function getById(id: number) {
  return httpClient.get<Diagnostic>(`/diagnostics/${id}`)
}

async function create(
  payload: CreateOrUpdateDiagnosticPayload | CreateOrUpdateDiagnosticScriptPayload
) {
  return httpClient.post<
    Diagnostic,
    CreateOrUpdateDiagnosticPayload | CreateOrUpdateDiagnosticScriptPayload
  >("/diagnostics", payload)
}

async function update(id: number, payload: Partial<CreateOrUpdateDiagnosticPayload>) {
  return httpClient.put<Diagnostic, Partial<CreateOrUpdateDiagnosticPayload>>(
    `/diagnostics/${id}`,
    payload
  )
}

async function enable(payload: Diagnostic) {
  return httpClient.put<Diagnostic, Diagnostic>(`/diagnostics/${payload.id}`, {
    ...payload,
    // @ts-expect-error targetGroup is string on backend
    targetGroup: payload?.targetGroup?.id?.toString(),
    enabled: true,
  })
}

async function disable(payload: Diagnostic) {
  return httpClient.put<Diagnostic, Diagnostic>(`/diagnostics/${payload.id}`, {
    ...payload,
    // @ts-expect-error targetGroup is string on backend
    targetGroup: payload?.targetGroup?.id?.toString(),
    enabled: false,
  })
}

async function remove(id: number) {
  return httpClient.delete(`/diagnostics/${id}`)
}

export default {
  getAll,
  getAllResults,
  getById,
  create,
  update,
  remove,
  enable,
  disable,
}
