import { Config, ConfigDiff } from "@/types";
import httpClient, { HttpMethod } from "./httpClient";
import { PaginationQueryParams } from "./types";

export type ConfigQueryParams = {
  after?: number;
  before?: number;
  domain?: number[];
  group?: number[];
} & PaginationQueryParams;

async function getAll(queryParams: ConfigQueryParams = {}) {
  return httpClient.get<Config[]>("/configs", {
    queryParams,
  });
}

async function getDiff(sourceId: number, targetId: number) {
  return httpClient.get<ConfigDiff>(`/configs/${sourceId}/vs/${targetId}`);
}

async function getItem(id: number, item: string) {
  const req = await httpClient.rawRequest(
    HttpMethod.Get,
    `/configs/${id}/${item}`
  );

  if (!req.ok) {
    throw new Error("");
  }

  const res = await req.text();

  return res;
}

async function getConfiguration(id: number) {
  return httpClient.get<any>(`/configs/${id}/configuration`);
}

async function getAdminConfiguration(id: number) {
  return httpClient.get<any>(`/configs/${id}/adminConfiguration`);
}

async function getXRPackage(id: number) {
  return httpClient.get<any>(`/configs/${id}/xrPackages`);
}

export default {
  getAll,
  getDiff,
  getItem,
  getConfiguration,
  getAdminConfiguration,
  getXRPackage,
};
