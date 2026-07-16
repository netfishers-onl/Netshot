import { ConfigDiff, LightConfig } from "@/types"

import httpClient, { HttpMethod } from "./httpClient"
import { ConfigQueryParams } from "./types"

async function getAll(queryParams: ConfigQueryParams = {}) {
  return httpClient.get<LightConfig[]>("/configs", {
    queryParams,
    queryParamsOptions: {
      stringifyOpt: {
        arrayFormat: "repeat",
      },
    },
  })
}

async function getDiff(
  sourceId: number,
  targetId: number,
  queryParams: { deltas?: boolean; fullconfigs?: boolean } = {}
) {
  return httpClient.get<ConfigDiff>(`/configs/${sourceId}/vs/${targetId}`, {
    queryParams,
  })
}

async function getItem(id: number, item: string) {
  const req = await httpClient.request(
    HttpMethod.GET,
    `/configs/${id}/${item}`,
    { headers: { Accept: "*/*" } }
  )
  const res = await req.text()
  return res
}

export default {
  getAll,
  getDiff,
  getItem,
}
