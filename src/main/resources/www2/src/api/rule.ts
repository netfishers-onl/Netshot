import { ExemptedDevice, Rule, TestRuleResult } from "@/types";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import {
  CreateOrUpdateRule,
  PaginationQueryParams,
  RuleStateChangePayload,
  TestRuleScriptOnDevicePayload,
  TestRuleTextOnDevicePayload,
} from "./types";

async function getById(policyId: number, id: number) {
  return httpClient.get<Rule>(`/policies/${policyId}/rules/${id}`);
}

async function getAll(policyId: number) {
  return httpClient.get<Rule[]>(`/policies/${policyId}/rules`);
}

async function create(payload: CreateOrUpdateRule) {
  return httpClient.post<Rule, CreateOrUpdateRule>("/rules", payload);
}

async function update(id: number, payload: Partial<CreateOrUpdateRule>) {
  return httpClient.put<Rule, Partial<CreateOrUpdateRule>>(
    `/rules/${id}`,
    payload
  );
}

async function remove(id: number) {
  const req = await httpClient.rawRequest(HttpMethod.Delete, `/rules/${id}`);
  return req.status === HttpStatus.NoContent;
}

async function testScript(payload: TestRuleScriptOnDevicePayload) {
  return httpClient.post<TestRuleResult, TestRuleScriptOnDevicePayload>(
    "/rules/test",
    payload
  );
}

async function testText(payload: TestRuleTextOnDevicePayload) {
  return httpClient.post<TestRuleResult, TestRuleTextOnDevicePayload>(
    "/rules/test",
    payload
  );
}

async function disable(id: number, payload: Rule) {
  return httpClient.put<Rule, RuleStateChangePayload>(`/rules/${id}`, {
    enabled: false,
    exemptions: {},
    name: payload.name,
  });
}

async function enable(id: number, payload: Rule) {
  return httpClient.put<Rule, RuleStateChangePayload>(`/rules/${id}`, {
    enabled: true,
    exemptions: {},
    name: payload.name,
  });
}

async function updateExemptedDevice(
  id: number,
  payload: RuleStateChangePayload
) {
  return httpClient.put<Rule, RuleStateChangePayload>(`/rules/${id}`, {
    enabled: payload.enabled,
    exemptions: payload.exemptions,
    name: payload.name,
  });
}

async function getAllExemptedDevice(
  id: number,
  queryParams: PaginationQueryParams = {}
) {
  return httpClient.get<ExemptedDevice[]>(`/rule/${id}/exempteddevices`, {
    queryParams,
  });
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  testScript,
  testText,
  enable,
  disable,
  updateExemptedDevice,
  getAllExemptedDevice,
};
