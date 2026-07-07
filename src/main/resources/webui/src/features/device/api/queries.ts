import api, { DeviceQueryParams, PaginationQueryParams } from "@/api"
import { QUERIES } from "@/constants"
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
      api.admin.getAllCredentialSets({}),
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

export function useDevices(groupId: number) {
  return useQuery({
    queryKey: [QUERIES.DEVICE_LIST, groupId],
    queryFn: async () => {
      const params = {} as DeviceQueryParams

      if (groupId) {
        params.group = groupId
      }

      return api.device.getAll(params)
    },
  })
}

export function useDeviceFamilies() {
  return useQuery({
    queryKey: [QUERIES.DEVICE_FAMILY_LIST],
    queryFn: () => api.device.getAllFamilies({ limit: 99999 }),
    select: (data) => Array.from(new Set(data.map((f) => f.deviceFamily).filter(Boolean))).sort(),
  })
}

export function useDevicePartNumbers() {
  return useQuery({
    queryKey: [QUERIES.DEVICE_PART_NUMBER_LIST],
    queryFn: () => api.device.getAllPartNumbers({ limit: 99999 }),
    select: (data) => Array.from(new Set(data.map((p) => p.partNumber).filter(Boolean))).sort(),
  })
}

export function useDeviceSoftwareVersions() {
  return useQuery({
    queryKey: [QUERIES.DEVICE_SOFTWARE_VERSION_LIST],
    queryFn: () => api.device.getAllSoftwareVersions({ limit: 99999 }),
    select: (data) => Array.from(new Set(data.map((v) => v.version).filter(Boolean))).sort(),
  })
}

export function useSearchDevices(query: string) {
  return useQuery({
    queryKey: [QUERIES.DEVICE_SEARCH_LIST, query],
    queryFn: async () => api.device.search({ query }),
  })
}
