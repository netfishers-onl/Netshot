import { Config, ConfigDiff } from "@/types";

import httpClient, { HttpMethod } from "./httpClient";
import { ConfigQueryParams } from "./types";

async function getAll(queryParams: ConfigQueryParams = {}) {
  return httpClient.get<Config[]>("/configs", {
    queryParams,
  });
}

async function getDiff(sourceId: number, targetId: number) {
  return httpClient.get<ConfigDiff>(`/configs/${sourceId}/vs/${targetId}`);
}

async function getItem(id: number, item: string) {
  const req = await httpClient.request(
    HttpMethod.GET,
    `/configs/${id}/${item}`,
    { headers: { "Accept": "*/*" } }
  );
  const res = await req.text();
  return res;
}

export default {
  getAll,
  getDiff,
  getItem,
};
