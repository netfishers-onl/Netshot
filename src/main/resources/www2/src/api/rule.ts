import { ExemptedDevice, Rule, RuleType, TestRuleResult } from "@/types";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import { PaginationQueryParams } from "./types";

export type CreateOrUpdateRule = {
  id: number;
  name: string;
  type: string;
  script: string;
  policy: number;
  enabled: boolean;
  text: string;
  regExp: boolean;
  context: string;
  driver: string;
  field: string;
  anyBlock: boolean;
  matchAll: boolean;
  invert: boolean;
  normalize: boolean;
};

export type TestRuleScriptOnDevicePayload = {
  device: number;
  script: string;
  type: RuleType;
};

export type TestRuleTextOnDevicePayload = {
  anyBlock: boolean;
  context: string;
  device: number;
  driver: string;
  field: string;
  invert: boolean;
  matchAll: boolean;
  normalize: boolean;
  regExp: boolean;
  text: string;
  type: RuleType;
};

export type RuleStateChangePayload = {
  enabled: boolean;
  exemptions: Record<number, number>;
  name: string;
};

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
