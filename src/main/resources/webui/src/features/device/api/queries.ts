import api, { DeviceQueryParams, PaginationQueryParams } from "@/api"
import { PAGINATION_LIMIT, QUERIES } from "@/constants"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

export function useDevice(id: number) {
  return useQuery({
    queryKey: [QUERIES.DEVICE_DETAIL, id],
    queryFn: async () => api.device.getById(id),
  })
}

export function useDeviceTypes() {
  return useQuery({
    queryKey: [QUERIES.DEVICE_TYPE_LIST],
    queryFn: api.device.getAllTypes,
    initialData: [],
  })
}

export function useDeviceTypesWithOptions() {
  return useQuery({
    queryKey: [QUERIES.DEVICE_TYPE_LIST],
    queryFn: api.device.getAllTypes,
    select(types) {
      return types.map((type) => ({
        label: type?.description,
        value: type,
      }))
    },
    initialData: [],
  })
}

export function useCredentialSets() {
  return useQuery({
    queryKey: [QUERIES.CREDENTIAL_SET_LIST],
    queryFn: async () =>
      api.admin.getAllCredentialSets({
        offset: 0,
        limit: 999,
      }),
  })
}

export function useInfiniteDeviceConfigs(deviceId: number, query: string) {
  const LIMIT = 50
  const result = useInfiniteQuery({
    queryKey: [QUERIES.DEVICE_INFINITE_CONFIGS, deviceId, query],
    queryFn: async ({ pageParam }) => {
      const pagination = {
        limit: LIMIT,
        offset: pageParam,
      } as PaginationQueryParams

      return api.device.getAllConfigsById(deviceId, pagination)
    },
    initialPageParam: 0,
    getNextPageParam(lastPage, allPages) {
      return lastPage?.length === LIMIT ? allPages.length * LIMIT : undefined
    },
  })

  return {
    ...result,
    data: result.data?.pages?.flatMap((page) => page),
  }
}

export function useDeviceConfigs(deviceId: number) {
  return useQuery({
    queryKey: [QUERIES.DEVICE_CONFIGS, deviceId],
    queryFn: async () => {
      return api.device.getAllConfigsById(deviceId)
    },
  })
}

export function useInfiniteDevices(groupId: number) {
  return useInfiniteQuery({
    queryKey: [QUERIES.DEVICE_LIST, groupId],
    queryFn: async ({ pageParam }) => {
      const params = {
        limit: PAGINATION_LIMIT,
        offset: pageParam,
      } as DeviceQueryParams

      const queryParams = new URLSearchParams(location.search)

      if (queryParams.has("group")) {
        params.group = parseInt(queryParams.get("group"))
      }

      return api.device.getAll(params)
    },
    initialPageParam: 0,
    getNextPageParam(lastPage, allPages) {
      return lastPage?.length === PAGINATION_LIMIT ? allPages.length * PAGINATION_LIMIT : undefined
    },
  })
}

export function useInfiniteSearchDevices(query: string) {
  return useInfiniteQuery({
    queryKey: [QUERIES.DEVICE_SEARCH_LIST, query],
    queryFn: async ({ pageParam }) => {
      return api.device.search({
        limit: PAGINATION_LIMIT,
        offset: pageParam,
        query,
      })
    },
    initialPageParam: 0,
    getNextPageParam(lastPage, allPages) {
      return lastPage?.devices?.length === PAGINATION_LIMIT
        ? allPages.length * PAGINATION_LIMIT
        : undefined
    },
  })
}
