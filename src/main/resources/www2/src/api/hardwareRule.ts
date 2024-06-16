import { HardwareRule } from "@/types";
import httpClient, { HttpMethod, HttpStatus } from "./httpClient";
import { CreateOrUpdateHardwareRule } from "./types";

async function getAll() {
  return httpClient.get<HardwareRule[]>("/hardwarerules");
}

async function create(payload: CreateOrUpdateHardwareRule) {
  return httpClient.post<HardwareRule, CreateOrUpdateHardwareRule>(
    "/hardwarerules",
    payload
  );
}

async function update(
  id: number,
  payload: Partial<CreateOrUpdateHardwareRule>
) {
  return httpClient.put<HardwareRule, Partial<CreateOrUpdateHardwareRule>>(
    `/hardwarerules/${id}`,
    payload
  );
}

async function remove(id: number) {
  const req = await httpClient.rawRequest(
    HttpMethod.Delete,
    `/hardwarerules/${id}`
  );
  return req.status === HttpStatus.NoContent;
}

export default {
  getAll,
  create,
  update,
  remove,
};
