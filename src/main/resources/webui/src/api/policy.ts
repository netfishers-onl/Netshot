import { Policy } from "@/types";
import { search } from "@/utils";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import rule from "./rule";
import { CreateOrUpdatePolicy } from "./types";

async function getAll() {
  return httpClient.get<Policy[]>("/policies");
}

async function getAllWithRules(query: string = "") {
  const policies = await getAll();
  const filtered = search(policies, "name").with(query);
  const removeIds: number[] = [];

  for (let i = 0, len = policies.length; i < len; i++) {
    const policy = policies[i];
    const exists = filtered.find((p) => p.id === policy.id);
    const rules = await rule.getAll(policy.id);

    if (exists) {
      policy.rules = rules;
    } else {
      policy.rules = search(rules, "name").with(query);

      if (!policy.rules.length) {
        removeIds.push(policy.id);
      }
    }
  }

  return policies.filter((policy) => !removeIds.includes(policy.id));
}

async function create(payload: CreateOrUpdatePolicy) {
  return httpClient.post<Policy, CreateOrUpdatePolicy>("/policies", payload);
}

async function update(id: number, payload: Partial<CreateOrUpdatePolicy>) {
  return httpClient.put<Policy, Partial<CreateOrUpdatePolicy>>(
    `/policies/${id}`,
    payload
  );
}

async function remove(id: number) {
  const req = await httpClient.rawRequest(HttpMethod.Delete, `/policies/${id}`);
  return req.status === HttpStatus.NoContent;
}

export default {
  getAll,
  getAllWithRules,
  create,
  update,
  remove,
};
